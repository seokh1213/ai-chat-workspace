package app.tripplanner.ai

import app.tripplanner.ai.CodexAppServerProtocol.Field
import app.tripplanner.ai.CodexAppServerProtocol.Method
import app.tripplanner.ai.CodexAppServerProtocol.Notification
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.net.URI
import java.net.http.HttpClient
import java.net.http.WebSocket
import java.time.Duration
import java.util.concurrent.CompletableFuture
import java.util.concurrent.LinkedBlockingDeque
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference

private const val FinalAnswerPhase = "final_answer"

data class CodexTurnResult(
    val text: String,
    val threadId: String,
    val turnId: String?,
    val lastEventJson: String,
)

@Component
class CodexAppServerClient(
    private val properties: CodexAppServerProperties,
    private val turnRegistry: CodexAppServerTurnRegistry,
) {
    private val logger = LoggerFactory.getLogger(javaClass)
    private val objectMapper = jacksonObjectMapper()

    fun runTurn(
        request: AiChatRequest,
        prompt: String,
        developerInstructions: String,
        outputSchema: Map<String, Any?>? = null,
        onDelta: (String) -> Unit = {},
        onActivity: (AiProviderActivity) -> Unit = {},
        timeout: Duration = Duration.ofSeconds(properties.timeoutSeconds),
    ): CodexTurnResult {
        val connection = JsonRpcConnection(
            url = properties.url,
            timeout = timeout,
            objectMapper = objectMapper,
        )

        connection.use { rpc ->
            var activeThreadId: String? = null
            var activeTurnId: String? = null
            var recoveredFromThreadId: String? = null
            rpc.request(
                method = Method.INITIALIZE,
                params = CodexAppServerProtocol.initializeParams(),
            )

            val threadId = request.providerSession?.externalThreadId
                ?.let { threadId ->
                    runCatching {
                        rpc.resumeThread(threadId = threadId, request = request, developerInstructions = developerInstructions)
                    }.recoverCatching { error ->
                        if (!error.isMissingCodexRollout()) throw error
                        logger.warn(
                            "Codex app-server could not resume stale thread {}; starting a new thread for runId={}",
                            threadId,
                            request.runId,
                        )
                        recoveredFromThreadId = threadId
                        rpc.startThread(request = request, developerInstructions = developerInstructions)
                    }.getOrThrow()
                }
                ?: rpc.startThread(request = request, developerInstructions = developerInstructions)
            activeThreadId = threadId
            val turnPrompt = recoveredFromThreadId
                ?.let { missingThreadId ->
                    """
                    이전 Codex thread를 재개할 수 없어 새 thread로 복구했습니다.
                    재개 실패 thread id: $missingThreadId
                    아래 prompt에는 DB에 저장된 최근 대화와 현재 여행 상태가 포함되어 있습니다.
                    기존 대화가 이어지는 상황으로 간주하고, 같은 맥락에서 답변하세요.

                    $prompt
                    """.trimIndent()
                }
                ?: prompt

            val turnStart = rpc.request(
                method = Method.TURN_START,
                params = CodexAppServerProtocol.turnStartParams(
                    threadId = threadId,
                    request = request,
                    properties = properties,
                    prompt = turnPrompt,
                    outputSchema = outputSchema,
                ),
            )
            val turnId = turnStart.path(Field.TURN).codexTextField(Field.ID)
            activeTurnId = turnId
            turnId?.let { id ->
                turnRegistry.register(
                    runId = request.runId,
                    threadId = threadId,
                    turnId = id,
                )
            }

            val text = StringBuilder()
            var activeAgentMessagePhase: String? = null
            var finalCompletedText: String? = null
            var lastEvent: JsonNode = objectMapper.createObjectNode()

            try {
                while (true) {
                    val message = rpc.nextMessage()
                    lastEvent = message
                    val method = message.path("method").asText()
                    codexActivityFrom(method = method, message = message)?.let { activity ->
                        logger.info(
                            "Codex app-server activity runId={} kind={} label={} detail={} rawType={}",
                            request.runId,
                            activity.kind,
                            activity.label,
                            activity.detail,
                            activity.rawType,
                        )
                        onActivity(activity)
                    }
                    if (method.isNotBlank() &&
                        method !in setOf(
                            Notification.AGENT_MESSAGE_DELTA,
                            Notification.TURN_COMPLETED,
                            Notification.ERROR,
                        )
                    ) {
                        logger.debug(
                            "Codex app-server event runId={} method={} payload={}",
                            request.runId,
                            method,
                            message.toString().take(1200),
                        )
                    }
                    when (method) {
                        Notification.ITEM_STARTED -> {
                            val item = message.path(Field.PARAMS).path(Field.ITEM)
                            if (item.codexTextField(Field.TYPE) == "agentMessage") {
                                activeAgentMessagePhase = item.codexTextField(Field.PHASE)
                            }
                        }
                        Notification.ITEM_COMPLETED -> {
                            val item = message.path(Field.PARAMS).path(Field.ITEM)
                            if (item.codexTextField(Field.TYPE) == "agentMessage") {
                                if (item.codexTextField(Field.PHASE) == FinalAnswerPhase) {
                                    finalCompletedText = item.codexTextField(Field.TEXT)
                                }
                                activeAgentMessagePhase = null
                            }
                        }
                        Notification.AGENT_MESSAGE_DELTA -> {
                            val delta = message.path(Field.PARAMS).path(Field.DELTA).asText()
                            if (activeAgentMessagePhase != null && activeAgentMessagePhase != FinalAnswerPhase) {
                                continue
                            }
                            text.append(delta)
                            onDelta(delta)
                        }
                        Notification.TURN_COMPLETED -> {
                            val turn = message.path(Field.PARAMS).path(Field.TURN)
                            val error = turn.path(Field.ERROR)
                            if (!error.isMissingNode && !error.isNull) {
                                throw IllegalStateException("Codex turn failed: ${error.toString().take(500)}")
                            }
                            return CodexTurnResult(
                                text = text.toString().ifBlank { finalCompletedText.orEmpty() },
                                threadId = threadId,
                                turnId = turn.codexTextField(Field.ID) ?: turnId,
                                lastEventJson = lastEvent.toString(),
                            )
                        }
                        Notification.ERROR -> throw IllegalStateException(message.path(Field.PARAMS).toString())
                    }
                }
            } catch (error: RuntimeException) {
                interruptActiveTurn(activeThreadId = activeThreadId, activeTurnId = activeTurnId)
                throw error
            } finally {
                turnRegistry.remove(request.runId)
            }
        }
    }

    fun interruptTurn(runId: String): Boolean {
        val activeTurn = turnRegistry.find(runId) ?: return false
        return interruptTurn(threadId = activeTurn.threadId, turnId = activeTurn.turnId)
    }

    private fun interruptActiveTurn(activeThreadId: String?, activeTurnId: String?) {
        val threadId = activeThreadId ?: return
        val turnId = activeTurnId ?: return
        runCatching { interruptTurn(threadId = threadId, turnId = turnId) }
    }

    private fun interruptTurn(threadId: String, turnId: String): Boolean {
        val connection = JsonRpcConnection(
            url = properties.url,
            timeout = Duration.ofSeconds(5),
            objectMapper = objectMapper,
        )

        connection.use { rpc ->
            rpc.request(
                method = Method.INITIALIZE,
                params = CodexAppServerProtocol.initializeParams(),
            )
            rpc.request(
                method = Method.TURN_INTERRUPT,
                params = CodexAppServerProtocol.turnInterruptParams(
                    threadId = threadId,
                    turnId = turnId,
                ),
            )
        }
        return true
    }

    private fun JsonRpcConnection.startThread(request: AiChatRequest, developerInstructions: String): String {
        val result = request(
            method = Method.THREAD_START,
            params = CodexAppServerProtocol.threadStartParams(
                request = request,
                properties = properties,
                developerInstructions = developerInstructions,
            ),
        )
        return result.path(Field.THREAD).codexTextField(Field.ID)
            ?: throw IllegalStateException("Codex app-server did not return a thread id.")
    }

    private fun JsonRpcConnection.resumeThread(
        threadId: String,
        request: AiChatRequest,
        developerInstructions: String,
    ): String {
        val result = request(
            method = Method.THREAD_RESUME,
            params = CodexAppServerProtocol.threadResumeParams(
                threadId = threadId,
                request = request,
                properties = properties,
                developerInstructions = developerInstructions,
            ),
        )
        return result.path(Field.THREAD).codexTextField(Field.ID) ?: threadId
    }

    private fun Throwable.isMissingCodexRollout(): Boolean =
        message?.contains("no rollout found for thread id", ignoreCase = true) == true
}

private fun codexActivityFrom(method: String, message: JsonNode): AiProviderActivity? {
    if (method.isBlank()) return null

    val lowerMethod = method.lowercase()
    val payload = message.toString()
    val lowerPayload = payload.lowercase()
    val detail = codexActivityDetail(message)

    return when {
        lowerMethod.contains("web") ||
            lowerMethod.contains("search") ||
            lowerPayload.contains("websearch") ||
            lowerPayload.contains("web_search") ||
            lowerPayload.contains("web search") ||
            lowerPayload.contains("search_query") ->
            AiProviderActivity(
                kind = "tool",
                label = "웹 검색 중",
                detail = detail,
                rawType = method,
            )
        lowerMethod.contains("mcp") || lowerPayload.contains("\"mcp") ->
            AiProviderActivity(
                kind = "tool",
                label = "연결된 도구 확인 중",
                detail = detail,
                rawType = method,
            )
        lowerMethod.contains("tool") ||
            lowerPayload.contains("\"tool") ||
            lowerPayload.contains("function_call") ->
            AiProviderActivity(
                kind = "tool",
                label = "도구 실행 중",
                detail = detail,
                rawType = method,
            )
        else -> null
    }
}

private fun codexActivityDetail(message: JsonNode): String? {
    val params = message.path(CodexAppServerProtocol.Field.PARAMS)
    return sequenceOf(
        params.path("title"),
        params.path("name"),
        params.path("toolName"),
        params.path("query"),
        params.path("command"),
        params.path("item").path("title"),
        params.path("item").path("name"),
        params.path("item").path("toolName"),
        params.path("item").path("query"),
        params.path("item").path("action").path("query"),
        params.path("item").path("command"),
    )
        .firstOrNull { node -> node.isTextual && node.asText().isNotBlank() }
        ?.asText()
        ?.take(120)
        ?: params.findActivityDetail()
        ?: message.findActivityDetail()
}

private val activityDetailKeys = listOf("query", "q", "url", "title", "name", "toolName", "command", "message", "status")

private fun JsonNode.findActivityDetail(depth: Int = 0): String? {
    if (depth > 5 || isMissingNode || isNull) return null

    if (isObject) {
        activityDetailKeys.forEach { key ->
            val value = path(key)
            value.takeIf { node -> node.isTextual }
                ?.asText()
                ?.trim()
                ?.takeIf(String::isNotBlank)
                ?.let { return it.take(160) }
        }
        activityDetailKeys.forEach { key ->
            path(key).findActivityDetail(depth + 1)?.let { return it }
        }
        val fields = fields()
        while (fields.hasNext()) {
            val value = fields.next().value
            value.findActivityDetail(depth + 1)?.let { return it }
        }
    }

    if (isArray) {
        val elements = elements()
        while (elements.hasNext()) {
            val value = elements.next()
            value.findActivityDetail(depth + 1)?.let { return it }
        }
    }

    return null
}

private class JsonRpcConnection(
    url: String,
    timeout: Duration,
    private val objectMapper: ObjectMapper,
) : AutoCloseable {
    private val listener = QueueingWebSocketListener(objectMapper)
    private val deferredMessages = LinkedBlockingDeque<JsonNode>()
    private val deadlineNanos = System.nanoTime() + timeout.toNanos()
    private val client = HttpClient
        .newBuilder()
        .connectTimeout(timeout)
        .build()
    private val webSocket = client
        .newWebSocketBuilder()
        .buildAsync(URI.create(url), listener)
        .get(remainingMillis(), TimeUnit.MILLISECONDS)
    private var nextRequestId = 1

    fun request(method: String, params: Any?): JsonNode {
        val id = nextRequestId++
        val payload = linkedMapOf(
            "jsonrpc" to "2.0",
            "id" to id,
            "method" to method,
            "params" to params,
        )
        webSocket
            .sendText(objectMapper.writeValueAsString(payload), true)
            .get(remainingMillis(), TimeUnit.MILLISECONDS)
        return awaitResponse(id)
    }

    fun nextMessage(): JsonNode {
        deferredMessages.poll()?.let { return it }
        return rawNextMessage()
    }

    override fun close() {
        webSocket.sendClose(WebSocket.NORMAL_CLOSURE, "done")
    }

    private fun rawNextMessage(): JsonNode {
        listener.error.get()?.let { throw IllegalStateException("Codex app-server websocket failed.", it) }
        return listener.messages.poll(remainingMillis(), TimeUnit.MILLISECONDS)
            ?: throw IllegalStateException("Timed out waiting for Codex app-server event.")
    }

    private fun awaitResponse(id: Int): JsonNode {
        while (true) {
            val message = rawNextMessage()
            if (message.path(Field.ID).asInt(-1) != id) {
                deferredMessages.offer(message)
                continue
            }
            val error = message.path(Field.ERROR)
            if (!error.isMissingNode && !error.isNull) {
                throw IllegalStateException("Codex app-server request failed: ${error.toString().take(500)}")
            }
            return message.path("result")
        }
    }

    private fun remainingMillis(): Long {
        val remainingNanos = deadlineNanos - System.nanoTime()
        if (remainingNanos <= 0) {
            throw IllegalStateException("Timed out waiting for Codex app-server event.")
        }
        return TimeUnit.NANOSECONDS.toMillis(remainingNanos).coerceAtLeast(1)
    }
}

private class QueueingWebSocketListener(
    private val objectMapper: ObjectMapper,
) : WebSocket.Listener {
    val messages = LinkedBlockingQueue<JsonNode>()
    val error = AtomicReference<Throwable?>()
    private val buffer = StringBuilder()

    override fun onOpen(webSocket: WebSocket) {
        webSocket.request(1)
    }

    override fun onText(webSocket: WebSocket, data: CharSequence, last: Boolean): CompletableFuture<*> {
        buffer.append(data)
        if (last) {
            runCatching {
                messages.offer(objectMapper.readTree(buffer.toString()))
            }.onFailure(error::set)
            buffer.clear()
        }
        webSocket.request(1)
        return CompletableFuture.completedFuture(null)
    }

    override fun onError(webSocket: WebSocket, error: Throwable) {
        this.error.set(error)
    }
}
