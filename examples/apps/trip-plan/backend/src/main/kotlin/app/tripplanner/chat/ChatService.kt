package app.tripplanner.chat

import app.tripplanner.common.ClockProvider
import app.tripplanner.trip.TripRepository
import app.tripplanner.workspace.WorkspaceRepository
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import java.time.OffsetDateTime
import java.util.UUID

@Service
class ChatService(
    private val repository: ChatRepository,
    private val tripRepository: TripRepository,
    private val workspaceRepository: WorkspaceRepository,
    private val runService: ChatRunService,
    private val eventBroker: ChatEventBroker,
    private val clockProvider: ClockProvider,
) {
    private val objectMapper = jacksonObjectMapper()

    @Transactional(readOnly = true)
    fun findSessions(tripId: String): List<ChatSessionDto> = repository.findSessions(tripId)

    @Transactional
    fun createSession(tripId: String, request: CreateChatSessionRequest): ChatSessionDto {
        val trip = tripRepository.findTrip(tripId) ?: throw NoSuchElementException("Trip not found.")
        val workspace = workspaceRepository.find(trip.workspaceId) ?: throw NoSuchElementException("Workspace not found.")
        val title = request.title.trim()
        require(title.isNotEmpty()) { "Chat session title must not be blank." }

        val now = clockProvider.nowText()
        val session = ChatSessionDto(
            id = "chat_${UUID.randomUUID()}",
            tripId = tripId,
            title = title,
            provider = request.provider?.trim().takeUnless { it.isNullOrEmpty() } ?: workspace.aiProvider,
            model = request.model?.trim().takeUnless { it.isNullOrEmpty() } ?: workspace.aiModel,
            status = "idle",
            settingsJson = workspace.settingsJson,
            createdAt = now,
            updatedAt = now,
        )
        repository.insertSession(session)
        return session
    }

    @Transactional
    fun importSetupSession(tripId: String, request: ImportSetupChatSessionRequest): ChatSessionDetailDto {
        val trip = tripRepository.findTrip(tripId) ?: throw NoSuchElementException("Trip not found.")
        val importedMessages = request.messages
            .filter { message -> message.content.isNotBlank() && message.role in setOf("user", "assistant") }
            .take(40)
        require(importedMessages.isNotEmpty()) { "Imported messages must not be empty." }

        val session = createSession(
            tripId = trip.id,
            request = CreateChatSessionRequest(
                title = request.title.trim().takeIf(String::isNotEmpty) ?: "초안 설계",
            ),
        )
        val baseTime = OffsetDateTime.parse(clockProvider.nowText())
        importedMessages.forEachIndexed { index, message ->
            repository.insertMessage(
                ChatMessageDto(
                    id = "msg_${UUID.randomUUID()}",
                    chatSessionId = session.id,
                    role = message.role,
                    content = message.content.trim(),
                    status = "completed",
                    metadataJson = objectMapper.writeValueAsString(
                        mapOf(
                            "source" to "setup",
                            "durationMs" to message.durationMs,
                            "appliedActions" to message.appliedActions,
                        ),
                    ),
                    createdAt = baseTime.plusSeconds(index.toLong()).toString(),
                ),
            )
        }
        repository.touchSession(session.id, clockProvider.nowText())
        return detail(session.id)
    }

    @Transactional
    fun detail(sessionId: String): ChatSessionDetailDto {
        val session = repository.findSession(sessionId) ?: throw NoSuchElementException("Chat session not found.")
        runService.reconcileInterruptedRun(session)
        return ChatSessionDetailDto(
            session = session,
            messages = repository.findMessages(sessionId),
            editRuns = repository.findAiEditRuns(sessionId).map(AiEditRunDto::toSummary),
        )
    }

    @Transactional
    fun updateSession(sessionId: String, request: UpdateChatSessionRequest): ChatSessionDto {
        val existing = repository.findSession(sessionId) ?: throw NoSuchElementException("Chat session not found.")
        val title = request.title.trim()
        require(title.isNotEmpty()) { "Chat session title must not be blank." }

        val session = existing.copy(
            title = title,
            updatedAt = clockProvider.nowText(),
        )
        repository.updateSession(session)
        return session
    }

    @Transactional
    fun deleteSession(sessionId: String) {
        repository.findSession(sessionId) ?: throw NoSuchElementException("Chat session not found.")
        runService.cancelCurrentRun(sessionId)
        repository.deleteSession(sessionId)
    }

    @Transactional(readOnly = true)
    fun editRuns(sessionId: String): List<AiEditRunSummaryDto> {
        repository.findSession(sessionId) ?: throw NoSuchElementException("Chat session not found.")
        return repository.findAiEditRuns(sessionId).map(AiEditRunDto::toSummary)
    }

    @Transactional(readOnly = true)
    fun subscribeEvents(sessionId: String): SseEmitter {
        val session = repository.findSession(sessionId) ?: throw NoSuchElementException("Chat session not found.")
        val emitter = eventBroker.subscribe(sessionId)
        runService.activeRunSnapshot(sessionId)?.let { snapshot ->
            eventBroker.send(
                emitter = emitter,
                eventName = "run.started",
                data = chatRunEvent(
                    runId = snapshot.runId,
                    session = session,
                    status = "running",
                    operationCount = 0,
                    message = snapshot.message,
                    createdAt = snapshot.startedAt,
                ),
            )
            snapshot.activity?.let { activity ->
                eventBroker.send(emitter = emitter, eventName = "run.activity", data = activity)
            }
            if (snapshot.streamedContent.isNotBlank()) {
                eventBroker.send(
                    emitter = emitter,
                    eventName = "assistant.message.delta",
                    data = ChatMessageDeltaEventDto(
                        runId = snapshot.runId,
                        delta = snapshot.streamedContent,
                        createdAt = clockProvider.nowText(),
                    ),
                )
            }
        }
        repository.findAiEditRuns(sessionId)
            .take(5)
            .asReversed()
            .map(AiEditRunDto::toSummary)
            .forEach { run -> eventBroker.send(emitter = emitter, eventName = "run.snapshot", data = run) }
        return emitter
    }

    fun addMessage(sessionId: String, request: CreateChatMessageRequest): ChatMessageRunDto =
        runService.addMessage(sessionId = sessionId, request = request)

    fun cancelCurrentRun(sessionId: String): CancelChatRunResponse =
        runService.cancelCurrentRun(sessionId)
}
