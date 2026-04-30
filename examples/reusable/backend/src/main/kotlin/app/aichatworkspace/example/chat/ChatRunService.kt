package app.aichatworkspace.example.chat

import app.aichatworkspace.example.ai.AiChatRequest
import app.aichatworkspace.example.ai.AiProvider
import app.aichatworkspace.example.ai.AiStreamEvent
import app.aichatworkspace.example.domain.DomainAdapter
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import org.springframework.stereotype.Service
import java.time.Duration
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.util.UUID

@Service
class ChatRunService(
    private val provider: AiProvider,
    private val domainAdapter: DomainAdapter,
    private val eventBroker: ChatEventBroker,
) {
    private val runScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val sessions = mutableMapOf<String, ChatSessionDto>()
    private val messages = mutableMapOf<String, MutableList<ChatMessageDto>>()
    private val runs = mutableMapOf<String, MutableList<AiEditRunSummaryDto>>()

    fun shutdown() {
        runScope.cancel()
    }

    fun detail(sessionId: String): ChatSessionDetailDto {
        val session = sessions.getOrPut(sessionId) { sampleSession(sessionId) }
        return ChatSessionDetailDto(
            session = session,
            messages = messages[sessionId].orEmpty(),
            editRuns = runs[sessionId].orEmpty(),
        )
    }

    fun addMessage(sessionId: String, request: CreateChatMessageRequest): CreateChatMessageResponse {
        val session = sessions.getOrPut(sessionId) { sampleSession(sessionId) }
        val now = nowText()
        val runId = "run_${UUID.randomUUID()}"
        val userMessage = ChatMessageDto(
            id = "msg_${UUID.randomUUID()}",
            chatSessionId = sessionId,
            role = "user",
            content = request.content.trim(),
            status = "completed",
            metadataJson = "{}",
            createdAt = now,
        )
        messages.computeIfAbsent(sessionId) { mutableListOf() }.add(userMessage)

        eventBroker.publish(
            sessionId = sessionId,
            eventName = "run.started",
            data = ChatRunEventDto(
                runId = runId,
                status = "running",
                provider = session.provider,
                model = session.model,
                operationCount = 0,
                message = "요청을 분석하는 중입니다.",
                createdAt = now,
            ),
        )

        runScope.launch {
            runProvider(session = session, userMessage = userMessage, runId = runId)
        }

        return CreateChatMessageResponse(runId = runId, userMessage = userMessage)
    }

    fun cancelCurrentRun(sessionId: String) {
        eventBroker.publish(
            sessionId = sessionId,
            eventName = "run.cancelled",
            data = ChatRunEventDto(
                runId = "unknown",
                status = "cancelled",
                provider = provider.id,
                model = null,
                operationCount = 0,
                message = "중지됨",
                createdAt = nowText(),
            ),
        )
    }

    private fun runProvider(session: ChatSessionDto, userMessage: ChatMessageDto, runId: String) {
        val startedAt = userMessage.createdAt
        val context = domainAdapter.buildContext(session.dataSpaceId)
        val deltas = mutableListOf<String>()
        var resultOperations = emptyList<Map<String, Any?>>()
        var finalMessage: String? = null

        runBlocking {
            provider.streamChat(
                AiChatRequest(
                    runId = runId,
                    dataSpaceId = session.dataSpaceId,
                    chatSessionId = session.id,
                    content = userMessage.content,
                    contextJson = context.json,
                    priorMessages = messages[session.id].orEmpty().dropLast(1).map {
                        app.aichatworkspace.example.ai.AiPriorMessage(role = it.role, content = it.content)
                    },
                    model = session.model,
                    providerSession = null,
                ),
            ).collect { event ->
                when (event) {
                    AiStreamEvent.RunStarted -> Unit
                    is AiStreamEvent.Activity -> eventBroker.publish(
                        sessionId = session.id,
                        eventName = "run.activity",
                        data = ChatRunActivityEventDto(
                            runId = runId,
                            kind = event.activity.kind,
                            label = event.activity.label,
                            detail = event.activity.detail,
                            rawType = event.activity.rawType,
                            createdAt = nowText(),
                        ),
                    )
                    is AiStreamEvent.MessageDelta -> {
                        deltas += event.content
                        eventBroker.publish(
                            sessionId = session.id,
                            eventName = "assistant.message.delta",
                            data = ChatMessageDeltaEventDto(runId = runId, delta = event.content, createdAt = nowText()),
                        )
                    }
                    is AiStreamEvent.MessageCompleted -> {
                        finalMessage = event.content
                        eventBroker.publish(
                            sessionId = session.id,
                            eventName = "assistant.message.completed",
                            data = ChatMessageCompletedEventDto(runId = runId, content = event.content, createdAt = nowText()),
                        )
                    }
                    is AiStreamEvent.OperationsProposed -> {
                        resultOperations = event.operations
                        eventBroker.publish(
                            sessionId = session.id,
                            eventName = "operations.proposed",
                            data = ChatRunEventDto(
                                runId = runId,
                                status = "proposed",
                                provider = session.provider,
                                model = session.model,
                                operationCount = event.operations.size,
                                operationPreview = domainAdapter.previewOperations(event.operations),
                                message = null,
                                createdAt = nowText(),
                            ),
                        )
                    }
                    is AiStreamEvent.ResultCompleted -> {
                        finalMessage = event.result.message
                        resultOperations = event.result.operations
                    }
                    AiStreamEvent.RunCompleted -> Unit
                }
            }
        }

        val completedAt = nowText()
        val assistantMessage = ChatMessageDto(
            id = "msg_${UUID.randomUUID()}",
            chatSessionId = session.id,
            role = "assistant",
            content = finalMessage ?: deltas.joinToString(""),
            status = "completed",
            metadataJson = """{"durationMs":${durationMsBetween(startedAt, completedAt)}}""",
            createdAt = completedAt,
        )
        messages.computeIfAbsent(session.id) { mutableListOf() }.add(assistantMessage)

        val applyResult = domainAdapter.applyOperations(session.dataSpaceId, resultOperations)
        val run = AiEditRunSummaryDto(
            id = runId,
            dataSpaceId = session.dataSpaceId,
            chatSessionId = session.id,
            provider = session.provider,
            model = session.model,
            userMessageId = userMessage.id,
            assistantMessageId = assistantMessage.id,
            status = if (resultOperations.isEmpty()) "completed" else "applied",
            error = null,
            checkpointId = applyResult.checkpointId,
            operationCount = resultOperations.size,
            operationPreview = applyResult.operationPreview,
            durationMs = durationMsBetween(startedAt, completedAt),
            createdAt = completedAt,
        )
        runs.computeIfAbsent(session.id) { mutableListOf() }.add(0, run)

        eventBroker.publish(
            sessionId = session.id,
            eventName = if (resultOperations.isEmpty()) "run.completed" else "run.applied",
            data = run,
        )
    }

    private fun sampleSession(sessionId: String): ChatSessionDto =
        ChatSessionDto(
            id = sessionId,
            dataSpaceId = "space_example",
            title = "예시 대화",
            provider = provider.id,
            model = null,
            status = "idle",
            settingsJson = "{}",
            createdAt = nowText(),
            updatedAt = nowText(),
        )
}

private fun nowText(): String = OffsetDateTime.now().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME)

private fun durationMsBetween(startedAt: String, endedAt: String): Long =
    runCatching {
        Duration.between(OffsetDateTime.parse(startedAt), OffsetDateTime.parse(endedAt)).toMillis()
    }.getOrDefault(0L).coerceAtLeast(0L)

