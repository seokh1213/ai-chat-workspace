package app.tripplanner.chat

import app.tripplanner.ai.AiProviderResult
import app.tripplanner.ai.AiProviderSessionDto
import app.tripplanner.ai.AiProviderSessionRepository
import app.tripplanner.common.ClockProvider
import app.tripplanner.common.redactExternalErrorMessage
import app.tripplanner.trip.ApplyOperationsRequest
import app.tripplanner.trip.TripService
import app.tripplanner.trip.TripStateDto
import app.tripplanner.trip.chatTitleOperationTitle
import app.tripplanner.trip.filterTripOperations
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.springframework.stereotype.Component
import org.springframework.transaction.support.TransactionCallback
import org.springframework.transaction.support.TransactionTemplate
import java.time.Duration
import java.time.OffsetDateTime
import java.util.UUID

@Component
class ChatRunResultWriter(
    private val repository: ChatRepository,
    private val tripService: TripService,
    private val providerSessionRepository: AiProviderSessionRepository,
    private val eventBroker: ChatEventBroker,
    private val runRegistry: ChatRunRegistry,
    private val clockProvider: ClockProvider,
    private val transactionTemplate: TransactionTemplate,
) {
    private val objectMapper = jacksonObjectMapper()

    fun failedProviderPair(
        session: ChatSessionDto,
        userMessage: ChatMessageDto,
        runId: String,
        error: RuntimeException,
    ): ChatMessagePairDto = writeTransaction {
        val safeError = redactExternalErrorMessage(error.message ?: "Provider failed.")
        val failedAt = clockProvider.nowText()
        val durationMs = durationMsBetween(startedAt = userMessage.createdAt, endedAt = failedAt)
        val failedMessage = ChatMessageDto(
            id = "msg_${UUID.randomUUID()}",
            chatSessionId = session.id,
            role = "assistant",
            content = "AI provider 호출에 실패했습니다. $safeError",
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
            error = safeError,
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
        ChatMessagePairDto(userMessage = userMessage, assistantMessage = failedMessage, editRun = runSummary)
    }

    fun applyProviderResult(
        session: ChatSessionDto,
        userMessage: ChatMessageDto,
        content: String,
        runId: String,
        providerResult: AiProviderResult,
        providerSession: AiProviderSessionDto?,
    ): ChatMessagePairDto {
        val operationsJson = objectMapper.writeValueAsString(providerResult.operations)
        val completedAt = clockProvider.nowText()
        val durationMs = durationMsBetween(startedAt = userMessage.createdAt, endedAt = completedAt)
        val assistantMessage = completedAssistantMessage(session, providerResult, completedAt, durationMs)

        return try {
            writeTransaction {
                applyProviderResultInTransaction(
                    session = session,
                    userMessage = userMessage,
                    content = content,
                    runId = runId,
                    providerResult = providerResult,
                    providerSession = providerSession,
                    operationsJson = operationsJson,
                    assistantMessage = assistantMessage,
                    durationMs = durationMs,
                )
            }
        } catch (error: RuntimeException) {
            if (runRegistry.isCancelled(runId)) {
                cancelledRunPair(session = session, userMessage = userMessage, runId = runId)
            } else {
                failedApplyPair(
                    session = session,
                    userMessage = userMessage,
                    runId = runId,
                    providerResult = providerResult,
                    providerSession = providerSession,
                    operationsJson = operationsJson,
                    assistantMessage = assistantMessage,
                    durationMs = durationMs,
                    error = error,
                )
            }
        }
    }

    fun cancelledRunPair(
        session: ChatSessionDto,
        userMessage: ChatMessageDto,
        runId: String,
    ): ChatMessagePairDto = writeTransaction {
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
        ChatMessagePairDto(userMessage = userMessage, assistantMessage = assistantMessage, editRun = runSummary)
    }

    fun upsertProviderSession(
        session: ChatSessionDto,
        providerResult: AiProviderResult,
    ): AiProviderSessionDto? {
        val externalThreadId = providerResult.externalThreadId ?: return null
        return writeTransaction {
            val now = clockProvider.nowText()
            val existing = providerSessionRepository.find(chatSessionId = session.id, provider = session.provider)
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
            providerSession
        }
    }

    private fun completedAssistantMessage(
        session: ChatSessionDto,
        providerResult: AiProviderResult,
        completedAt: String,
        durationMs: Long,
    ): ChatMessageDto =
        ChatMessageDto(
            id = "msg_${UUID.randomUUID()}",
            chatSessionId = session.id,
            role = "assistant",
            content = providerResult.message,
            status = "completed",
            metadataJson = objectMapper.writeValueAsString(
                mapOf("provider" to session.provider, "operationCount" to providerResult.operations.size, "durationMs" to durationMs),
            ),
            createdAt = completedAt,
        )

    private fun applyProviderResultInTransaction(
        session: ChatSessionDto,
        userMessage: ChatMessageDto,
        content: String,
        runId: String,
        providerResult: AiProviderResult,
        providerSession: AiProviderSessionDto?,
        operationsJson: String,
        assistantMessage: ChatMessageDto,
        durationMs: Long,
    ): ChatMessagePairDto {
        if (runRegistry.isCancelled(runId)) throw ChatRunCancelledException()
        val tripOperations = providerResult.operations.filterTripOperations()
        val nextChatTitle = providerResult.operations.chatTitleOperationTitle()?.takeIf { title -> title != session.title }
        var appliedState: TripStateDto? = null
        var checkpointId: String? = null
        var runStatus = "completed"
        if (tripOperations.isNotEmpty()) {
            val response = tripService.applyOperations(
                tripId = session.tripId,
                request = ApplyOperationsRequest(reason = content, source = "ai", operations = tripOperations),
            )
            appliedState = response.state
            checkpointId = response.checkpoint?.id
            runStatus = "applied"
        }
        if (nextChatTitle != null) {
            repository.updateSession(session.copy(title = nextChatTitle, updatedAt = assistantMessage.createdAt))
            runStatus = "applied"
        }
        repository.insertMessage(assistantMessage)
        val run = chatEditRun(
            id = runId,
            session = session,
            userMessageId = userMessage.id,
            assistantMessageId = assistantMessage.id,
            operationsJson = operationsJson,
            status = runStatus,
            error = null,
            checkpointId = checkpointId,
            providerSessionId = providerSession?.id,
            providerRunId = providerResult.providerRunId,
            durationMs = durationMs,
            createdAt = assistantMessage.createdAt,
        )
        repository.insertAiEditRun(run = run)
        val runSummary = run.toSummary()
        eventBroker.publish(sessionId = session.id, eventName = if (run.status == "applied") "run.applied" else "run.completed", data = runSummary)
        repository.touchSession(session.id, assistantMessage.createdAt)
        return ChatMessagePairDto(
            userMessage = userMessage,
            assistantMessage = assistantMessage,
            tripState = appliedState,
            checkpoint = appliedState?.latestCheckpoint,
            editRun = runSummary,
        )
    }

    private fun failedApplyPair(
        session: ChatSessionDto,
        userMessage: ChatMessageDto,
        runId: String,
        providerResult: AiProviderResult,
        providerSession: AiProviderSessionDto?,
        operationsJson: String,
        assistantMessage: ChatMessageDto,
        durationMs: Long,
        error: RuntimeException,
    ): ChatMessagePairDto = writeTransaction {
        val safeError = redactExternalErrorMessage(error.message ?: "Operation failed.")
        val failedMessage = assistantMessage.copy(content = "${providerResult.message}\n\n적용하지 못했습니다. $safeError", status = "failed")
        repository.insertMessage(failedMessage)
        val failedRun = chatEditRun(
            id = runId,
            session = session,
            userMessageId = userMessage.id,
            assistantMessageId = failedMessage.id,
            operationsJson = operationsJson,
            status = "failed",
            error = safeError,
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
        ChatMessagePairDto(userMessage = userMessage, assistantMessage = failedMessage, editRun = runSummary)
    }

    private fun <T> writeTransaction(block: () -> T): T =
        transactionTemplate.execute(TransactionCallback { block() })
            ?: error("Chat write transaction did not return a result.")
}

private class ChatRunCancelledException : RuntimeException("Chat run was cancelled.")

private fun durationMsBetween(startedAt: String, endedAt: String): Long =
    runCatching {
        Duration.between(OffsetDateTime.parse(startedAt), OffsetDateTime.parse(endedAt)).toMillis()
    }.getOrDefault(0L).coerceAtLeast(0L)
