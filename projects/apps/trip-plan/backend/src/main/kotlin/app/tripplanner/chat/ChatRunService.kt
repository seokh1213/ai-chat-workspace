package app.tripplanner.chat

import app.tripplanner.ai.AiProviderRegistry
import app.tripplanner.common.ClockProvider
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import jakarta.annotation.PreDestroy
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.support.TransactionSynchronization
import org.springframework.transaction.support.TransactionSynchronizationManager
import java.time.Duration
import java.time.OffsetDateTime
import java.util.UUID

@Service
class ChatRunService(
    private val repository: ChatRepository,
    private val providerRegistry: AiProviderRegistry,
    private val eventBroker: ChatEventBroker,
    private val runRegistry: ChatRunRegistry,
    private val clockProvider: ClockProvider,
    private val providerRunner: ChatProviderRunner,
    private val resultWriter: ChatRunResultWriter,
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
        val attachmentIds = request.attachmentIds
            .map(String::trim)
            .filter(String::isNotEmpty)
            .distinct()
        require(content.isNotEmpty() || attachmentIds.isNotEmpty()) { "Message content or attachments are required." }
        require(attachmentIds.size <= MaxAttachmentsPerMessage) {
            "Too many attachments. Maximum is $MaxAttachmentsPerMessage per message."
        }
        val attachments = repository.findAttachments(sessionId = sessionId, attachmentIds = attachmentIds)
        require(attachments.size == attachmentIds.size) { "One or more attachments were not found." }
        require(attachments.all { attachment -> attachment.chatMessageId == null }) {
            "One or more attachments have already been sent."
        }
        val orderedAttachments = attachmentIds.map { attachmentId ->
            attachments.first { attachment -> attachment.id == attachmentId }
        }

        val now = clockProvider.nowText()
        val runId = "run_${UUID.randomUUID()}"
        val userMessage = ChatMessageDto(
            id = "msg_${UUID.randomUUID()}",
            chatSessionId = sessionId,
            role = "user",
            content = content,
            status = "completed",
            metadataJson = objectMapper.writeValueAsString(mapOf("attachmentIds" to attachmentIds)),
            createdAt = now,
        )
        val savedUserMessage = userMessage.copy(
            attachments = orderedAttachments.map { attachment -> attachment.copy(chatMessageId = userMessage.id) },
        )

        repository.insertMessage(userMessage)
        val attachedCount = repository.attachAttachmentsToMessage(
            sessionId = sessionId,
            messageId = userMessage.id,
            attachmentIds = attachmentIds,
            updatedAt = now,
        )
        require(attachedCount == attachmentIds.size) { "One or more attachments could not be linked." }
        repository.touchSession(sessionId, now)
        logger.info(
            "Chat run accepted runId={} sessionId={} tripId={} provider={} contentChars={} attachments={}",
            runId,
            sessionId,
            session.tripId,
            session.provider,
            content.length,
            attachmentIds.size,
        )

        afterCurrentTransactionCommit {
            runRegistry.start(
                sessionId = sessionId,
                runId = runId,
                startedAt = now,
                message = ChatRunStartedMessage,
            )
            publishUserMessageCreated(sessionId = sessionId, message = savedUserMessage)
            publishRunStarted(session = session, runId = runId, createdAt = now)
            launchRun(session = session, content = content, userMessage = savedUserMessage, runId = runId)
        }

        return ChatMessageRunDto(runId = runId, userMessage = savedUserMessage)
    }

    private fun afterCurrentTransactionCommit(action: () -> Unit) {
        if (!TransactionSynchronizationManager.isActualTransactionActive()) {
            action()
            return
        }
        TransactionSynchronizationManager.registerSynchronization(
            object : TransactionSynchronization {
                override fun afterCommit() {
                    action()
                }
            },
        )
    }

    private fun launchRun(
        session: ChatSessionDto,
        content: String,
        userMessage: ChatMessageDto,
        runId: String,
    ) {
        runScope.launch {
            try {
                addMessageWithRun(session = session, content = content, userMessage = userMessage, runId = runId)
            } catch (error: RuntimeException) {
                logger.warn("Chat run failed unexpectedly: {}", runId, error)
                if (!runRegistry.isCancelled(runId)) {
                    resultWriter.failedProviderPair(session = session, userMessage = userMessage, runId = runId, error = error)
                }
            } finally {
                runRegistry.finish(sessionId = session.id, runId = runId)
            }
        }
    }

    private fun publishUserMessageCreated(sessionId: String, message: ChatMessageDto) {
        eventBroker.publish(
            sessionId = sessionId,
            eventName = "user.message.created",
            data = message,
        )
    }

    private fun addMessageWithRun(
        session: ChatSessionDto,
        content: String,
        userMessage: ChatMessageDto,
        runId: String,
    ): ChatMessagePairDto {
        val providerResult = try {
            providerRunner.run(session = session, userMessage = userMessage, runId = runId)
        } catch (error: RuntimeException) {
            if (runRegistry.isCancelled(runId)) {
                return resultWriter.cancelledRunPair(session = session, userMessage = userMessage, runId = runId)
            }
            return resultWriter.failedProviderPair(
                session = session,
                userMessage = userMessage,
                runId = runId,
                error = error,
            )
        }

        if (runRegistry.isCancelled(runId)) {
            return resultWriter.cancelledRunPair(session = session, userMessage = userMessage, runId = runId)
        }

        val providerSession = resultWriter.upsertProviderSession(session = session, providerResult = providerResult)
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

        return resultWriter.applyProviderResult(
            session = session,
            userMessage = userMessage,
            content = content.ifBlank { "첨부 파일 기반 요청" },
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

    private fun isRecoverableInterruptedMessage(createdAt: String): Boolean =
        runCatching {
            Duration.between(OffsetDateTime.parse(createdAt), OffsetDateTime.parse(clockProvider.nowText())) >= InterruptedRunGracePeriod
        }.getOrDefault(false)
}

private const val ChatRunStartedMessage = "요청을 분석하는 중입니다."
private const val MaxAttachmentsPerMessage = 8
private val InterruptedRunGracePeriod: Duration = Duration.ofSeconds(10)

private fun durationMsBetween(startedAt: String, endedAt: String): Long =
    runCatching {
        Duration.between(OffsetDateTime.parse(startedAt), OffsetDateTime.parse(endedAt)).toMillis()
    }.getOrDefault(0L).coerceAtLeast(0L)
