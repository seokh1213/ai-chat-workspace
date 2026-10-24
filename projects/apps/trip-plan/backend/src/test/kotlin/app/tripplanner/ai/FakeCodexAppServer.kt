package app.tripplanner.ai

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import java.io.ByteArrayOutputStream
import java.io.InputStream
import java.io.OutputStream
import java.net.InetAddress
import java.net.ServerSocket
import java.net.Socket
import java.nio.ByteBuffer
import java.security.MessageDigest
import java.util.Base64
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.Executors

const val FakeCodexReply = "fake codex reply"

private const val WebSocketAcceptGuid = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
private const val OpContinuation = 0x0
private const val OpText = 0x1
private const val OpClose = 0x8
private const val OpPing = 0x9
private const val OpPong = 0xA

/**
 * Minimal RFC 6455 server that answers just enough app-server JSON-RPC to drive CodexAppServerClient.
 * With [requiredToken] set it rejects the upgrade with 401 unless `Authorization: Bearer <token>` matches,
 * like codex app-server `--ws-auth capability-token`.
 */
class FakeCodexAppServer(private val requiredToken: String?) : AutoCloseable {
    private val serverSocket = ServerSocket(0, 16, InetAddress.getLoopbackAddress())
    private val executor = Executors.newVirtualThreadPerTaskExecutor()
    private val objectMapper = jacksonObjectMapper()

    val url = "ws://127.0.0.1:${serverSocket.localPort}"

    /** One entry per upgrade request; null when the client sent no Authorization header. */
    val authorizationHeaders = CopyOnWriteArrayList<String?>()
    val methods = CopyOnWriteArrayList<String>()

    init {
        executor.execute(::acceptConnections)
    }

    override fun close() {
        serverSocket.close()
        executor.shutdownNow()
    }

    private fun acceptConnections() {
        while (!serverSocket.isClosed) {
            val socket = runCatching { serverSocket.accept() }.getOrNull() ?: return
            executor.execute { socket.use(::serve) }
        }
    }

    private fun serve(socket: Socket) {
        val input = socket.getInputStream().buffered()
        val output = socket.getOutputStream()
        val headers = readUpgradeHeaders(input)
        val authorization = headers["authorization"]
        authorizationHeaders += authorization
        if (requiredToken != null && authorization != "Bearer $requiredToken") {
            output.write("HTTP/1.1 401 Unauthorized\r\nContent-Length: 0\r\nConnection: close\r\n\r\n".toByteArray())
            output.flush()
            return
        }
        output.write(switchingProtocols(headers.getValue("sec-websocket-key")).toByteArray())
        output.flush()

        val message = ByteArrayOutputStream()
        while (true) {
            val frame = readFrame(input) ?: return
            when (frame.opcode) {
                OpText, OpContinuation -> {
                    message.write(frame.payload)
                    if (frame.fin) {
                        replyTo(objectMapper.readTree(message.toByteArray()), output)
                        message.reset()
                    }
                }
                OpPing -> writeFrame(output, OpPong, frame.payload)
                OpClose -> {
                    writeFrame(output, OpClose, frame.payload)
                    return
                }
            }
        }
    }

    private fun replyTo(request: JsonNode, output: OutputStream) {
        val method = request.path("method").asText()
        methods += method
        val id = request.path("id").asInt()
        val replies = when (method) {
            "thread/start" -> listOf(result(id, mapOf("thread" to mapOf("id" to "thread-1"))))
            "turn/start" -> listOf(
                result(id, mapOf("turn" to mapOf("id" to "turn-1"))),
                notification("item/agentMessage/delta", mapOf("delta" to FakeCodexReply)),
                notification("turn/completed", mapOf("turn" to mapOf("id" to "turn-1"))),
            )
            else -> listOf(result(id, emptyMap<String, Any?>()))
        }
        replies.forEach { writeFrame(output, OpText, objectMapper.writeValueAsBytes(it)) }
    }

    private fun result(id: Int, result: Any?): Map<String, Any?> =
        mapOf("jsonrpc" to "2.0", "id" to id, "result" to result)

    private fun notification(method: String, params: Any?): Map<String, Any?> =
        mapOf("jsonrpc" to "2.0", "method" to method, "params" to params)
}

private class Frame(val fin: Boolean, val opcode: Int, val payload: ByteArray)

private fun switchingProtocols(key: String): String {
    val accept = Base64.getEncoder().encodeToString(
        MessageDigest.getInstance("SHA-1").digest((key + WebSocketAcceptGuid).toByteArray()),
    )
    return "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n" +
        "Sec-WebSocket-Accept: $accept\r\n\r\n"
}

private fun readUpgradeHeaders(input: InputStream): Map<String, String> =
    generateSequence { readHttpLine(input) }
        .takeWhile { it.isNotEmpty() }
        .drop(1)
        .associate { line ->
            val (name, value) = line.split(":", limit = 2)
            name.trim().lowercase() to value.trim()
        }

private fun readHttpLine(input: InputStream): String {
    val line = StringBuilder()
    while (true) {
        val byte = input.read()
        if (byte == -1 || byte == '\n'.code) return line.toString().trimEnd('\r')
        line.append(byte.toChar())
    }
}

private fun readFrame(input: InputStream): Frame? {
    val first = input.read()
    if (first == -1) return null
    val second = input.read()
    val length = when (val shortLength = second and 0x7F) {
        126 -> (input.read() shl 8) or input.read()
        127 -> ByteBuffer.wrap(input.readNBytes(8)).long.toInt()
        else -> shortLength
    }
    val mask = if ((second and 0x80) != 0) input.readNBytes(4) else null
    val payload = input.readNBytes(length)
    mask?.let { key -> payload.indices.forEach { payload[it] = (payload[it].toInt() xor key[it % 4].toInt()).toByte() } }
    return Frame(fin = (first and 0x80) != 0, opcode = first and 0x0F, payload = payload)
}

private fun writeFrame(output: OutputStream, opcode: Int, payload: ByteArray) {
    output.write(0x80 or opcode)
    when {
        payload.size < 126 -> output.write(payload.size)
        payload.size < 65_536 -> {
            output.write(126)
            output.write(payload.size shr 8)
            output.write(payload.size and 0xFF)
        }
        else -> {
            output.write(127)
            output.write(ByteBuffer.allocate(8).putLong(payload.size.toLong()).array())
        }
    }
    output.write(payload)
    output.flush()
}
