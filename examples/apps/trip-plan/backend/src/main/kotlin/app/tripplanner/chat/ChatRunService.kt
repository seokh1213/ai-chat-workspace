package app.tripplanner.chat

import app.tripplanner.ai.AiChatRequest
import app.tripplanner.ai.AiPriorMessage
import app.tripplanner.ai.AiProviderActivity
import app.tripplanner.ai.AiProviderRegistry
import app.tripplanner.ai.AiProviderResult
import app.tripplanner.ai.AiProviderSessionDto
import app.tripplanner.ai.AiProviderSessionRepository
import app.tripplanner.ai.AiStreamEvent
import app.tripplanner.common.ClockProvider
import app.tripplanner.trip.ApplyOperationsRequest
import app.tripplanner.trip.TripService
import app.tripplanner.trip.TripStateDto
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import jakarta.annotation.PreDestroy
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.time.Duration
import java.time.OffsetDateTime
import java.util.UUID

@Service
class ChatRunService(
    private val repository: ChatRepository,
    private val tripService: TripService,
    private val providerRegistry: AiProviderRegistry,
    private val providerSessionRepository: AiProviderSessionRepository,
    private val eventBroker: ChatEventBroker,
    private val runRegistry: ChatRunRegistry,
    private val clockProvider: ClockProvider,
) {
    private val logger = LoggerFactory.getLogger(javaClass)
    private val objectMapper = jacksonObjectMapper()
    private val runScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    @PreDestroy
    fun shutdown() {
        runScope.cancel()
    }

    fun cancelCurrentRun(sessionId: String): CancelChatRunResponse {
        val session = repository.findSession(sessionId) ?: throw NoSuchElementException("Chat session not found.")
        val runId = runRegistry.cancelCurrent(sessionId)
        if (runId == null) {
            return CancelChatRunResponse(
                runId = null,
                cancelled = false,
                message = "실행 중인 응답이 없습니다.",
            )
        }
        runCatching {
            providerRegistry.requireProvider(session.provider).cancel(runId)
        }

        val message = "응답 생성을 중지했습니다. 변경 사항은 적용하지 않습니다."
        eventBroker.publish(
            sessionId = sessionId,
            eventName = "run.cancelled",
            data = chatRunEvent(
                runId = runId,
                session = session,
                status = "cancelled",
                operationCount = 0,
                message = message,
                createdAt = clockProvider.nowText(),
            ),
        )
        return CancelChatRunResponse(runId = runId, cancelled = true, message = message)
    }

    fun reconcileInterruptedRun(session: ChatSessionDto): ChatMessagePairDto? {
        if (runRegistry.snapshot(session.id) != null) return null

        val userMessage = repository.findLatestUnansweredUserMessage(session.id) ?: return null
        if (!isRecoverableInterruptedMessage(userMessage.createdAt)) return null

        val recoveredAt = clockProvider.nowText()
        val durationMs = durationMsBetween(startedAt = userMessage.createdAt, endedAt = recoveredAt)
        val assistantMessage = ChatMessageDto(
            id = "msg_${UUID.randomUUID()}",
            chatSessionId = session.id,
            role = "assistant",
            content = "이전 요청은 서버 연결 오류 또는 재시작으로 중단되어 응답을 완료하지 못했습니다. 같은 요청을 다시 보내면 새 응답으로 처리합니다.",
            status = "failed",
            metadataJson = objectMapper.writeValueAsString(
                mapOf(
                    "provider" to session.provider,
                    "operationCount" to 0,
                    "durationMs" to durationMs,
                    "recovered" to true,
                ),
            ),
            createdAt = recoveredAt,
        )
        repository.insertMessage(assistantMessage)

        val run = chatEditRun(
            id = "run_recovered_${UUID.randomUUID()}",
            session = session,
            userMessageId = userMessage.id,
            assistantMessageId = assistantMessage.id,
            operationsJson = "[]",
            status = "failed",
            error = "Recovered an unanswered user message after an interrupted chat run.",
            checkpointId = null,
            providerSessionId = null,
            providerRunId = null,
            durationMs = durationMs,
            createdAt = recoveredAt,
        )
        repository.insertAiEditRun(run = run)
        repository.touchSession(session.id, recoveredAt)
        logger.warn(
            "Recovered interrupted chat run sessionId={} userMessageId={} recoveredRunId={}",
            session.id,
            userMessage.id,
            run.id,
        )

        return ChatMessagePairDto(
            userMessage = userMessage,
            assistantMessage = assistantMessage,
            editRun = run.toSummary(),
        )
    }

    fun addMessage(sessionId: String, request: CreateChatMessageRequest): ChatMessageRunDto {
        val session = repository.findSession(sessionId) ?: throw NoSuchElementException("Chat session not found.")
        val content = request.content.trim()
        require(content.isNotEmpty()) { "Message content must not be blank." }

        val now = clockProvider.nowText()
        val runId = "run_${UUID.randomUUID()}"
        val userMessage = ChatMessageDto(
            id = "msg_${UUID.randomUUID()}",
            chatSessionId = sessionId,
            role = "user",
            content = content,
            status = "completed",
            metadataJson = "{}",
            createdAt = now,
        )

        repository.insertMessage(userMessage)
        repository.touchSession(sessionId, now)
        runRegistry.start(
            sessionId = sessionId,
            runId = runId,
            startedAt = now,
            message = ChatRunStartedMessage,
        )
        publishRunStarted(session = session, runId = runId, createdAt = now)
        logger.info(
            "Chat run accepted runId={} sessionId={} tripId={} provider={} contentChars={}",
            runId,
            sessionId,
            session.tripId,
            session.provider,
            content.length,
        )

        runScope.launch {
            try {
                addMessageWithRun(session = session, content = content, userMessage = userMessage, runId = runId)
            } catch (error: RuntimeException) {
                logger.warn("Chat run failed unexpectedly: {}", runId, error)
                if (!runRegistry.isCancelled(runId)) {
                    failedProviderPair(session = session, userMessage = userMessage, runId = runId, error = error)
                }
            } finally {
                runRegistry.finish(sessionId = sessionId, runId = runId)
            }
        }

        return ChatMessageRunDto(runId = runId, userMessage = userMessage)
    }

    private fun addMessageWithRun(
        session: ChatSessionDto,
        content: String,
        userMessage: ChatMessageDto,
        runId: String,
    ): ChatMessagePairDto {
        val providerResult = try {
            runProvider(session = session, content = content, runId = runId)
        } catch (error: RuntimeException) {
            if (runRegistry.isCancelled(runId)) {
                return cancelledRunPair(session = session, userMessage = userMessage, runId = runId)
            }
            return failedProviderPair(
                session = session,
                userMessage = userMessage,
                runId = runId,
                error = error,
            )
        }

        if (runRegistry.isCancelled(runId)) {
            return cancelledRunPair(session = session, userMessage = userMessage, runId = runId)
        }

        val providerSession = upsertProviderSession(session = session, providerResult = providerResult)
        if (providerResult.operations.isNotEmpty()) {
            eventBroker.publish(
                sessionId = session.id,
                eventName = "operations.proposed",
                data = chatRunEvent(
                    runId = runId,
                    session = session,
                    status = "proposed",
                    operationCount = providerResult.operations.size,
                    operationPreview = operationPreview(providerResult.operations),
                    message = null,
                    createdAt = clockProvider.nowText(),
                ),
            )
        }

        return applyProviderResult(
            session = session,
            userMessage = userMessage,
            content = content,
            runId = runId,
            providerResult = providerResult,
            providerSession = providerSession,
        )
    }

    private fun publishRunStarted(session: ChatSessionDto, runId: String, createdAt: String) {
        eventBroker.publish(
            sessionId = session.id,
            eventName = "run.started",
            data = chatRunEvent(
                runId = runId,
                session = session,
                status = "running",
                operationCount = 0,
                message = ChatRunStartedMessage,
                createdAt = createdAt,
            ),
        )
    }

    fun activeRunSnapshot(sessionId: String): ActiveChatRunSnapshot? = runRegistry.snapshot(sessionId)

    private fun failedProviderPair(
        session: ChatSessionDto,
        userMessage: ChatMessageDto,
        runId: String,
        error: RuntimeException,
    ): ChatMessagePairDto {
        val failedAt = clockProvider.nowText()
        val durationMs = durationMsBetween(startedAt = userMessage.createdAt, endedAt = failedAt)
        val failedMessage = ChatMessageDto(
            id = "msg_${UUID.randomUUID()}",
            chatSessionId = session.id,
            role = "assistant",
            content = "AI provider 호출에 실패했습니다. ${error.message ?: "Unknown error"}",
            status = "failed",
            metadataJson = objectMapper.writeValueAsString(
                mapOf("provider" to session.provider, "operationCount" to 0, "durationMs" to durationMs),
            ),
            createdAt = failedAt,
        )
        repository.insertMessage(failedMessage)

        val failedRun = chatEditRun(
            id = runId,
            session = session,
            userMessageId = userMessage.id,
            assistantMessageId = failedMessage.id,
            operationsJson = "[]",
            status = "failed",
            error = error.message ?: "Provider failed.",
            checkpointId = null,
            providerSessionId = null,
            providerRunId = null,
            durationMs = durationMs,
            createdAt = failedMessage.createdAt,
        )
        repository.insertAiEditRun(run = failedRun)
        val runSummary = failedRun.toSummary()
        eventBroker.publish(sessionId = session.id, eventName = "run.failed", data = runSummary)
        repository.touchSession(session.id, failedMessage.createdAt)
        return ChatMessagePairDto(
            userMessage = userMessage,
            assistantMessage = failedMessage,
            editRun = runSummary,
        )
    }

    private fun applyProviderResult(
        session: ChatSessionDto,
        userMessage: ChatMessageDto,
        content: String,
        runId: String,
        providerResult: AiProviderResult,
        providerSession: AiProviderSessionDto?,
    ): ChatMessagePairDto {
        val operationsJson = objectMapper.writeValueAsString(providerResult.operations)
        val tripOperations = providerResult.operations.filterTripOperations()
        val nextChatTitle = providerResult.operations.chatTitleOperationTitle()
            ?.takeIf { title -> title != session.title }
        var appliedState: TripStateDto? = null
        var checkpointId: String? = null
        var runStatus = "completed"
        var runError: String? = null
        val completedAt = clockProvider.nowText()
        val durationMs = durationMsBetween(startedAt = userMessage.createdAt, endedAt = completedAt)
        val assistantMessage = ChatMessageDto(
            id = "msg_${UUID.randomUUID()}",
            chatSessionId = session.id,
            role = "assistant",
            content = providerResult.message,
            status = "completed",
            metadataJson = objectMapper.writeValueAsString(
                mapOf(
                    "provider" to session.provider,
                    "operationCount" to providerResult.operations.size,
                    "durationMs" to durationMs,
                ),
            ),
            createdAt = completedAt,
        )

        try {
            if (runRegistry.isCancelled(runId)) {
                return cancelledRunPair(session = session, userMessage = userMessage, runId = runId)
            }
            if (tripOperations.isNotEmpty()) {
                val response = tripService.applyOperations(
                    tripId = session.tripId,
                    request = ApplyOperationsRequest(
                        reason = content,
                        source = "ai",
                        operations = tripOperations,
                    ),
                )
                appliedState = response.state
                checkpointId = response.checkpoint?.id
                runStatus = "applied"
            }
            if (nextChatTitle != null) {
                repository.updateSession(session.copy(title = nextChatTitle, updatedAt = completedAt))
                runStatus = "applied"
            }
            repository.insertMessage(assistantMessage)
        } catch (error: RuntimeException) {
            runStatus = "failed"
            runError = error.message ?: "Operation failed."
            val failedMessage = assistantMessage.copy(
                content = "${providerResult.message}\n\n적용하지 못했습니다. ${runError}",
                status = "failed",
            )
            repository.insertMessage(failedMessage)
            val failedRun = chatEditRun(
                id = runId,
                session = session,
                userMessageId = userMessage.id,
                assistantMessageId = failedMessage.id,
                operationsJson = operationsJson,
                status = runStatus,
                error = runError,
                checkpointId = null,
                providerSessionId = providerSession?.id,
                providerRunId = providerResult.providerRunId,
                durationMs = durationMs,
                createdAt = failedMessage.createdAt,
            )
            repository.insertAiEditRun(run = failedRun)
            val runSummary = failedRun.toSummary()
            eventBroker.publish(sessionId = session.id, eventName = "run.failed", data = runSummary)
            repository.touchSession(session.id, failedMessage.createdAt)
            return ChatMessagePairDto(
                userMessage = userMessage,
                assistantMessage = failedMessage,
                editRun = runSummary,
            )
        }

        val run = chatEditRun(
            id = runId,
            session = session,
            userMessageId = userMessage.id,
            assistantMessageId = assistantMessage.id,
            operationsJson = operationsJson,
            status = runStatus,
            error = runError,
            checkpointId = checkpointId,
            providerSessionId = providerSession?.id,
            providerRunId = providerResult.providerRunId,
            durationMs = durationMs,
            createdAt = assistantMessage.createdAt,
        )
        repository.insertAiEditRun(run = run)
        val runSummary = run.toSummary()
        eventBroker.publish(
            sessionId = session.id,
            eventName = if (run.status == "applied") "run.applied" else "run.completed",
            data = runSummary,
        )
        repository.touchSession(session.id, assistantMessage.createdAt)

        return ChatMessagePairDto(
            userMessage = userMessage,
            assistantMessage = assistantMessage,
            tripState = appliedState,
            checkpoint = appliedState?.latestCheckpoint,
            editRun = runSummary,
        )
    }

    private fun cancelledRunPair(
        session: ChatSessionDto,
        userMessage: ChatMessageDto,
        runId: String,
    ): ChatMessagePairDto {
        val now = clockProvider.nowText()
        val durationMs = durationMsBetween(startedAt = userMessage.createdAt, endedAt = now)
        val assistantMessage = ChatMessageDto(
            id = "msg_${UUID.randomUUID()}",
            chatSessionId = session.id,
            role = "assistant",
            content = "응답 생성을 중지했습니다. 변경 사항은 적용하지 않았습니다.",
            status = "cancelled",
            metadataJson = objectMapper.writeValueAsString(
                mapOf("provider" to session.provider, "operationCount" to 0, "durationMs" to durationMs),
            ),
            createdAt = now,
        )
        repository.insertMessage(assistantMessage)
        val run = chatEditRun(
            id = runId,
            session = session,
            userMessageId = userMessage.id,
            assistantMessageId = assistantMessage.id,
            operationsJson = "[]",
            status = "cancelled",
            error = null,
            checkpointId = null,
            providerSessionId = null,
            providerRunId = null,
            durationMs = durationMs,
            createdAt = now,
        )
        repository.insertAiEditRun(run = run)
        val runSummary = run.toSummary()
        eventBroker.publish(sessionId = session.id, eventName = "run.cancelled", data = runSummary)
        repository.touchSession(session.id, now)
        return ChatMessagePairDto(
            userMessage = userMessage,
            assistantMessage = assistantMessage,
            editRun = runSummary,
        )
    }

    private fun runProvider(session: ChatSessionDto, content: String, runId: String): AiProviderResult {
        val provider = providerRegistry.requireProvider(session.provider)
        val tripState = tripService.state(session.tripId)
        val providerSession = providerSessionRepository.find(
            chatSessionId = session.id,
            provider = session.provider,
        )
        val priorMessages = repository.findMessages(session.id)
            .dropLast(1)
            .takeLast(12)
            .map { message -> AiPriorMessage(role = message.role, content = message.content) }
        val request = AiChatRequest(
            runId = runId,
            tripId = session.tripId,
            chatSessionId = session.id,
            content = content,
            tripState = tripState,
            priorMessages = priorMessages,
            model = session.model,
            effort = session.aiEffort(),
            settingsJson = session.settingsJson,
            providerSession = providerSession,
        )

        logger.info(
            "Chat run provider start runId={} sessionId={} tripId={} provider={} priorMessages={} days={} places={} items={}",
            runId,
            session.id,
            session.tripId,
            session.provider,
            priorMessages.size,
            tripState.days.size,
            tripState.places.size,
            tripState.itineraryItems.size,
        )

        return runBlocking {
            val deltas = mutableListOf<String>()
            var completedMessage: String? = null
            var operations = emptyList<Map<String, Any?>>()
            var providerResult: AiProviderResult? = null
            var completedPublished = false
            val startedNanos = System.nanoTime()
            var firstDeltaNanos: Long? = null
            var deltaEventCount = 0
            var sseChunkCount = 0
            var visibleCharCount = 0
            var activityCount = 0

            provider.streamChat(request).collect { event ->
                when (event) {
                    is AiStreamEvent.Activity -> {
                        activityCount += 1
                        publishRunActivity(session = session, runId = runId, activity = event.activity)
                    }
                    is AiStreamEvent.MessageDelta -> {
                        deltas += event.content
                        deltaEventCount += 1
                        visibleCharCount += event.content.length
                        if (firstDeltaNanos == null) {
                            firstDeltaNanos = System.nanoTime()
                            logger.info(
                                "Chat run first delta runId={} latencyMs={} deltaChars={}",
                                runId,
                                elapsedMillis(startedNanos),
                                event.content.length,
                            )
                        }
                        val publishedChunks = publishAssistantDelta(sessionId = session.id, runId = runId, delta = event.content)
                        sseChunkCount += publishedChunks
                        logger.debug(
                            "Chat run delta published runId={} deltaEvent={} deltaChars={} sseChunks={} totalSseChunks={}",
                            runId,
                            deltaEventCount,
                            event.content.length,
                            publishedChunks,
                            sseChunkCount,
                        )
                    }
                    is AiStreamEvent.MessageCompleted -> {
                        completedMessage = event.content
                        if (deltas.isEmpty()) {
                            completedPublished = publishAssistantCompleted(
                                sessionId = session.id,
                                runId = runId,
                                content = event.content,
                            )
                        }
                    }
                    is AiStreamEvent.OperationsProposed -> operations = event.operations
                    is AiStreamEvent.ResultCompleted -> {
                        providerResult = event.result
                        if (deltas.isEmpty()) {
                            completedPublished = publishAssistantCompleted(
                                sessionId = session.id,
                                runId = runId,
                                content = event.result.message,
                            )
                        }
                    }
                    AiStreamEvent.RunStarted,
                    AiStreamEvent.RunCompleted,
                    -> Unit
                }
            }

            val message = completedMessage ?: deltas.joinToString("")
            val result = providerResult ?: AiProviderResult(
                message = message.ifBlank { throw IllegalStateException("AI provider returned an empty response.") },
                operations = operations,
            )
            if (!completedPublished && deltas.isEmpty()) {
                publishAssistantCompleted(sessionId = session.id, runId = runId, content = result.message)
            }
            logger.info(
                "Chat run provider completed runId={} durationMs={} firstDeltaLatencyMs={} deltaEvents={} sseChunks={} visibleChars={} activities={} operations={} providerRunId={}",
                runId,
                elapsedMillis(startedNanos),
                firstDeltaNanos?.let { Duration.ofNanos(it - startedNanos).toMillis() },
                deltaEventCount,
                sseChunkCount,
                visibleCharCount,
                activityCount,
                result.operations.size,
                result.providerRunId,
            )
            result
        }
    }

    private fun publishRunActivity(session: ChatSessionDto, runId: String, activity: AiProviderActivity) {
        if (runRegistry.isCancelled(runId)) return
        val event = ChatRunActivityEventDto(
            runId = runId,
            kind = activity.kind,
            label = activity.label,
            detail = activity.detail,
            rawType = activity.rawType,
            createdAt = clockProvider.nowText(),
        )
        runRegistry.updateActivity(sessionId = session.id, runId = runId, activity = event)
        logger.info(
            "Chat run activity runId={} kind={} label={} detail={} rawType={}",
            runId,
            event.kind,
            event.label,
            event.detail,
            event.rawType,
        )
        eventBroker.publish(
            sessionId = session.id,
            eventName = "run.activity",
            data = event,
        )
    }

    private fun publishAssistantDelta(sessionId: String, runId: String, delta: String): Int {
        if (delta.isBlank() || runRegistry.isCancelled(runId)) return 0
        runRegistry.appendDelta(sessionId = sessionId, runId = runId, delta = delta)
        logger.debug("Chat run SSE delta runId={} deltaChars={}", runId, delta.length)
        eventBroker.publish(
            sessionId = sessionId,
            eventName = "assistant.message.delta",
            data = ChatMessageDeltaEventDto(
                runId = runId,
                delta = delta,
                createdAt = clockProvider.nowText(),
            ),
        )
        return 1
    }

    private fun publishAssistantCompleted(sessionId: String, runId: String, content: String): Boolean {
        if (runRegistry.isCancelled(runId)) return false
        eventBroker.publish(
            sessionId = sessionId,
            eventName = "assistant.message.completed",
            data = ChatMessageCompletedEventDto(
                runId = runId,
                content = content,
                createdAt = clockProvider.nowText(),
            ),
        )
        return true
    }

    private fun upsertProviderSession(
        session: ChatSessionDto,
        providerResult: AiProviderResult,
    ): AiProviderSessionDto? {
        val externalThreadId = providerResult.externalThreadId ?: return null
        val now = clockProvider.nowText()
        val existing = providerSessionRepository.find(
            chatSessionId = session.id,
            provider = session.provider,
        )
        val providerSession = AiProviderSessionDto(
            id = existing?.id ?: "provider_session_${UUID.randomUUID()}",
            chatSessionId = session.id,
            provider = session.provider,
            externalThreadId = externalThreadId,
            externalConversationId = existing?.externalConversationId,
            status = "active",
            lastEventJson = providerResult.lastEventJson ?: existing?.lastEventJson ?: "{}",
            metadataJson = existing?.metadataJson ?: "{}",
            createdAt = existing?.createdAt ?: now,
            updatedAt = now,
        )
        providerSessionRepository.upsert(providerSession)
        return providerSession
    }

    private fun durationMsBetween(startedAt: String, endedAt: String): Long =
        runCatching {
            Duration.between(OffsetDateTime.parse(startedAt), OffsetDateTime.parse(endedAt)).toMillis()
        }.getOrDefault(0L).coerceAtLeast(0L)

    private fun ChatSessionDto.aiEffort(): String? =
        runCatching {
            objectMapper.readTree(settingsJson).path("aiEffort").asText()
        }.getOrNull()?.takeIf(String::isNotBlank)

    private fun isRecoverableInterruptedMessage(createdAt: String): Boolean =
        runCatching {
            Duration.between(OffsetDateTime.parse(createdAt), OffsetDateTime.parse(clockProvider.nowText())) >= InterruptedRunGracePeriod
        }.getOrDefault(false)
}

private const val ChatRunStartedMessage = "요청을 분석하는 중입니다."
private val InterruptedRunGracePeriod: Duration = Duration.ofSeconds(10)

private fun elapsedMillis(startedNanos: Long): Long =
    Duration.ofNanos(System.nanoTime() - startedNanos).toMillis().coerceAtLeast(0L)

private fun List<Map<String, Any?>>.filterTripOperations(): List<Map<String, Any?>> =
    filterNot { operation -> operation["op"]?.toString() == "set_chat_title" }

private fun List<Map<String, Any?>>.chatTitleOperationTitle(): String? =
    firstNotNullOfOrNull { operation ->
        if (operation["op"]?.toString() != "set_chat_title") {
            null
        } else {
            operation["title"]
                ?.toString()
                ?.replace(Regex("\\s+"), " ")
                ?.trim()
                ?.take(80)
                ?.takeIf(String::isNotBlank)
        }
    }
