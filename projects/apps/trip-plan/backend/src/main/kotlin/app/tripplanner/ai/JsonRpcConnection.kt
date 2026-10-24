package app.tripplanner.ai

import app.tripplanner.ai.CodexAppServerProtocol.Field
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import java.net.URI
import java.net.http.HttpClient
import java.net.http.WebSocket
import java.net.http.WebSocketHandshakeException
import java.time.Duration
import java.util.concurrent.CompletableFuture
import java.util.concurrent.ExecutionException
import java.util.concurrent.LinkedBlockingDeque
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference

internal class JsonRpcConnection(
    url: String,
    authorization: String?,
    timeout: Duration,
    private val objectMapper: ObjectMapper,
) : AutoCloseable {
    private val listener = QueueingWebSocketListener(objectMapper)
    private val deferredMessages = LinkedBlockingDeque<JsonNode>()
    private val idleTimeoutMillis = timeout.toMillis().coerceAtLeast(1)
    private val client = HttpClient
        .newBuilder()
        .connectTimeout(timeout)
        .build()
    private val webSocket = openWebSocket(url, authorization)
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

    private fun openWebSocket(url: String, authorization: String?): WebSocket {
        val builder = client.newWebSocketBuilder()
        authorization?.let { builder.header("Authorization", it) }
        return try {
            builder.buildAsync(URI.create(url), listener).get(remainingMillis(), TimeUnit.MILLISECONDS)
        } catch (error: ExecutionException) {
            val handshake = error.cause as? WebSocketHandshakeException ?: throw error
            // The handshake response still references the request and its Authorization header, so it is not chained.
            throw IllegalStateException(handshakeRejectedMessage(handshake.response.statusCode()))
        }
    }

    private fun remainingMillis(): Long {
        return idleTimeoutMillis
    }
}

private fun handshakeRejectedMessage(status: Int): String {
    val hint = if (status == 401) " Check CODEX_APP_SERVER_TOKEN_FILE." else ""
    return "Codex app-server rejected the websocket handshake with HTTP $status.$hint"
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
