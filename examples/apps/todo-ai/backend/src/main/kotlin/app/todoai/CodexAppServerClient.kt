package app.todoai

import app.todoai.CodexAppServerProtocol.Field
import app.todoai.CodexAppServerProtocol.Method
import app.todoai.CodexAppServerProtocol.Notification
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
) {
    private val logger = LoggerFactory.getLogger(javaClass)
    private val objectMapper = jacksonObjectMapper()

    fun runTurn(
        runId: String,
        workspace: WorkspaceDto,
        existingThreadId: String?,
        prompt: String,
        developerInstructions: String,
        onDelta: (String) -> Unit = {},
        onActivity: (AiActivity) -> Unit = {},
    ): CodexTurnResult {
        val config = runtimeConfig(workspace)
        JsonRpcConnection(url = config.url, timeout = Duration.ofSeconds(config.timeoutSeconds), objectMapper = objectMapper).use { rpc ->
            rpc.request(method = Method.INITIALIZE, params = CodexAppServerProtocol.initializeParams())
            val threadId = existingThreadId
                ?.let { rpc.resumeThread(threadId = it, config = config, developerInstructions = developerInstructions) }
                ?: rpc.startThread(config = config, developerInstructions = developerInstructions)

            val turnStart = rpc.request(
                method = Method.TURN_START,
                params = CodexAppServerProtocol.turnStartParams(
                    threadId = threadId,
                    properties = config,
                    prompt = prompt,
                ),
            )
            val turnId = turnStart.path(Field.TURN).codexTextField(Field.ID)
            val text = StringBuilder()
            var activeAgentMessagePhase: String? = null
            var finalCompletedText: String? = null
            var lastEvent: JsonNode = objectMapper.createObjectNode()

            while (true) {
                val message = rpc.nextMessage()
                lastEvent = message
                val method = message.path("method").asText()
                codexActivityFrom(method = method, message = message)?.let { activity ->
                    logger.info(
                        "Codex app-server activity runId={} kind={} label={} detail={} rawType={}",
                        runId,
                        activity.kind,
                        activity.label,
                        activity.detail,
                        activity.rawType,
                    )
                    onActivity(activity)
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
                        if (activeAgentMessagePhase != null && activeAgentMessagePhase != FinalAnswerPhase) {
                            continue
                        }
                        val delta = message.path(Field.PARAMS).path(Field.DELTA).asText()
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
        }
    }

    private fun runtimeConfig(workspace: WorkspaceDto): CodexAppServerRuntimeConfig =
        CodexAppServerRuntimeConfig(
            url = workspace.codexUrl.ifBlank { properties.url },
            model = workspace.aiModel.ifBlank { properties.model },
            effort = workspace.aiEffort.ifBlank { properties.effort },
            timeoutSeconds = properties.timeoutSeconds,
            cwd = workspace.codexCwd ?: properties.cwd,
        )

    private fun JsonRpcConnection.startThread(config: CodexAppServerRuntimeConfig, developerInstructions: String): String {
        val result = request(
            method = Method.THREAD_START,
            params = CodexAppServerProtocol.threadStartParams(
                properties = config,
                developerInstructions = developerInstructions,
            ),
        )
        return result.path(Field.THREAD).codexTextField(Field.ID)
            ?: throw IllegalStateException("Codex app-server did not return a thread id.")
    }

    private fun JsonRpcConnection.resumeThread(
        threadId: String,
        config: CodexAppServerRuntimeConfig,
        developerInstructions: String,
    ): String {
        val result = request(
            method = Method.THREAD_RESUME,
            params = CodexAppServerProtocol.threadResumeParams(
                threadId = threadId,
                properties = config,
                developerInstructions = developerInstructions,
            ),
        )
        return result.path(Field.THREAD).codexTextField(Field.ID) ?: threadId
    }
}

private fun codexActivityFrom(method: String, message: JsonNode): AiActivity? {
    if (method.isBlank()) return null
    if (method == Notification.AGENT_MESSAGE_DELTA) return null
    val lowerMethod = method.lowercase()
    val payload = message.toString()
    val lowerPayload = payload.lowercase()
    val detail = codexActivityDetail(message)

    return when {
        lowerMethod.contains("web") ||
            lowerMethod.contains("search") ||
            lowerPayload.contains("websearch") ||
            lowerPayload.contains("web_search") ||
            lowerPayload.contains("search_query") ->
            AiActivity(kind = "tool", label = "웹 검색 중", detail = detail, rawType = method)

        lowerMethod.contains("mcp") || lowerPayload.contains("\"mcp") ->
            AiActivity(kind = "tool", label = "연결된 도구 확인 중", detail = detail, rawType = method)

        lowerMethod.contains("tool") ||
            lowerPayload.contains("\"tool") ||
            lowerPayload.contains("function_call") ->
            AiActivity(kind = "tool", label = "도구 실행 중", detail = detail, rawType = method)

        else -> null
    }
}

private fun codexActivityDetail(message: JsonNode): String? {
    val params = message.path(Field.PARAMS)
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
        properties().forEach { entry ->
            entry.value.findActivityDetail(depth + 1)?.let { return it }
        }
    }

    if (isArray) {
        val elements = elements()
        while (elements.hasNext()) {
            elements.next().findActivityDetail(depth + 1)?.let { return it }
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
    private val client = HttpClient.newBuilder().connectTimeout(timeout).build()
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
