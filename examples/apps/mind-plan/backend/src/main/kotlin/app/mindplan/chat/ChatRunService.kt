package app.mindplan.chat

import app.mindplan.ai.AiChatMessage
import app.mindplan.ai.AiOperation
import app.mindplan.ai.AiProviderRegistry
import app.mindplan.ai.AiProviderRequest
import app.mindplan.plan.PlanService
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.stereotype.Service
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import java.time.Duration
import java.time.Instant
import java.util.concurrent.CompletableFuture
import java.util.concurrent.Executors

@Service
class ChatRunService(
    private val chatService: ChatService,
    private val planService: PlanService,
    private val providers: AiProviderRegistry,
    private val objectMapper: ObjectMapper,
) {
    private val executor = Executors.newCachedThreadPool()

    fun start(sessionId: String, request: SendChatMessageRequest): SseEmitter {
        val emitter = SseEmitter(Duration.ofMinutes(4).toMillis())
        CompletableFuture.runAsync({ run(sessionId, request, emitter) }, executor)
        return emitter
    }

    private fun run(sessionId: String, request: SendChatMessageRequest, emitter: SseEmitter) {
        val runId = chatService.newRunId()
        val startedAt = Instant.now()
        try {
            val session = chatService.session(sessionId)
            val currentMessages = chatService.messages(sessionId)
            val userMessage = chatService.newMessage(sessionId, "user", request.content.trim())
            chatService.insertMessage(userMessage)
            chatService.updateSession(session.copy(status = "running", updatedAt = chatService.nowText()))

            send(emitter, ChatRunStartedEvent(runId = runId, message = "계획을 읽고 변경점을 찾는 중입니다.", createdAt = chatService.nowText()))

            val provider = providers.get(session.provider)
            val plan = planService.detail(session.planId)
            val result = provider.complete(
                AiProviderRequest(
                    provider = provider.id,
                    model = session.model,
                    message = request.content,
                    plan = plan,
                    chatHistory = currentMessages.map { AiChatMessage(role = it.role, content = it.content) },
                    settingsJson = session.settingsJson,
                ),
            )

            val planOperations = result.operations.filterNot { it.op == "set_chat_title" }
            val checkpointId = if (planOperations.isNotEmpty()) {
                planService.createCheckpoint(session.planId, "AI 변경 전 체크포인트")
            } else {
                null
            }
            val applied = planService.applyOperations(session.planId, planOperations)
            result.operations.chatTitle()?.let { title ->
                val latest = chatService.session(sessionId)
                chatService.updateSession(latest.copy(title = title, status = "idle", updatedAt = chatService.nowText()))
            } ?: chatService.updateSession(chatService.session(sessionId).copy(status = "idle", updatedAt = chatService.nowText()))

            streamMessage(emitter, runId, result.message)

            val durationMs = Duration.between(startedAt, Instant.now()).toMillis()
            val metadataJson = objectMapper.writeValueAsString(
                mapOf(
                    "durationMs" to durationMs,
                    "operationCount" to applied.size,
                    "checkpointId" to checkpointId,
                ),
            )
            val assistantMessage = chatService.newMessage(sessionId, "assistant", result.message, metadataJson)
            chatService.insertMessage(assistantMessage)
            chatService.insertRun(
                AiEditRunDto(
                    id = runId,
                    planId = session.planId,
                    chatSessionId = sessionId,
                    provider = provider.id,
                    model = result.model ?: session.model,
                    userMessageId = userMessage.id,
                    assistantMessageId = assistantMessage.id,
                    operationsJson = objectMapper.writeValueAsString(applied),
                    status = "completed",
                    error = null,
                    checkpointId = checkpointId,
                    durationMs = durationMs,
                    createdAt = chatService.nowText(),
                ),
            )

            send(
                emitter,
                ChatRunCompletedEvent(
                    runId = runId,
                    content = result.message,
                    operations = applied,
                    operationCount = applied.size,
                    checkpointId = checkpointId,
                    durationMs = durationMs,
                    detail = chatService.detail(sessionId),
                    createdAt = chatService.nowText(),
                ),
            )
            emitter.complete()
        } catch (error: Exception) {
            runCatching {
                send(
                    emitter,
                    ChatRunFailedEvent(
                        runId = runId,
                        error = error.message ?: "AI run failed.",
                        createdAt = chatService.nowText(),
                    ),
                )
            }
            emitter.complete()
        }
    }

    private fun streamMessage(emitter: SseEmitter, runId: String, content: String) {
        content.chunked(80).forEach { delta ->
            send(emitter, ChatRunDeltaEvent(runId = runId, delta = delta, createdAt = chatService.nowText()))
            Thread.sleep(18)
        }
    }

    private fun send(emitter: SseEmitter, event: Any) {
        emitter.send(SseEmitter.event().data(objectMapper.writeValueAsString(event)))
    }
}

private fun List<AiOperation>.chatTitle(): String? =
    firstOrNull { it.op == "set_chat_title" }
        ?.patch
        ?.get("title")
        ?.toString()
        ?.trim()
        ?.takeIf { it.isNotBlank() }
