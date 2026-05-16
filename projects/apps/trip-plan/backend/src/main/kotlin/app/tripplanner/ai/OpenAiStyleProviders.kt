package app.tripplanner.ai

import app.tripplanner.trip.TripOperations
import app.tripplanner.trip.readTripOperations
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import org.springframework.stereotype.Component
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration

@Component
class OpenAiCompatibleProvider(
    private val properties: OpenAiCompatibleProperties,
    promptBuilder: CodexPromptBuilder,
    responseParser: AiProviderResponseParser,
) : AiProvider {
    override val id: String = "openai-compatible"
    override val displayName: String = "OpenAI 호환"

    private val client = OpenAiStyleChatClient(
        providerId = id,
        promptBuilder = promptBuilder,
        responseParser = responseParser,
    ) { request, objectMapper ->
        val settings = request.settingsNode(objectMapper)
        val apiKey = settings.textOrNull("openAiApiKey") ?: properties.apiKey?.takeIf(String::isNotBlank)
        OpenAiStyleConfig(
            url = settings.textOrNull("openAiBaseUrl") ?: properties.baseUrl,
            model = request.model?.takeIf(String::isNotBlank) ?: properties.model,
            timeoutSeconds = properties.timeoutSeconds,
            headers = buildMap {
                apiKey?.let { put("Authorization", "Bearer $it") }
            },
        )
    }

    override fun streamChat(request: AiChatRequest): Flow<AiStreamEvent> = client.streamChat(request)
}

@Component
class OpenRouterProvider(
    private val properties: OpenRouterProperties,
    promptBuilder: CodexPromptBuilder,
    responseParser: AiProviderResponseParser,
) : AiProvider {
    override val id: String = "openrouter"
    override val displayName: String = "OpenRouter"

    private val client = OpenAiStyleChatClient(
        providerId = id,
        promptBuilder = promptBuilder,
        responseParser = responseParser,
    ) { request, objectMapper ->
        val settings = request.settingsNode(objectMapper)
        val apiKey = settings.textOrNull("openRouterApiKey") ?: properties.apiKey?.takeIf(String::isNotBlank)
        require(!apiKey.isNullOrBlank()) {
            "OpenRouter API key is required. 워크스페이스 설정에서 OpenRouter API key를 입력해주세요."
        }

        OpenAiStyleConfig(
            url = properties.baseUrl,
            model = request.model?.takeIf(String::isNotBlank) ?: properties.model,
            timeoutSeconds = properties.timeoutSeconds,
            headers = buildMap {
                put("Authorization", "Bearer $apiKey")
                (settings.textOrNull("openRouterReferer") ?: properties.referer?.takeIf(String::isNotBlank))
                    ?.let { put("HTTP-Referer", it) }
                (settings.textOrNull("openRouterTitle") ?: properties.title.takeIf(String::isNotBlank))
                    ?.let { title ->
                        put("X-OpenRouter-Title", title)
                        put("X-Title", title)
                    }
            },
        )
    }

    override fun streamChat(request: AiChatRequest): Flow<AiStreamEvent> = client.streamChat(request)
}

private class OpenAiStyleChatClient(
    private val providerId: String,
    private val promptBuilder: CodexPromptBuilder,
    private val responseParser: AiProviderResponseParser,
    private val configFactory: (AiChatRequest, ObjectMapper) -> OpenAiStyleConfig,
) {
    private val objectMapper: ObjectMapper = jacksonObjectMapper()
    private val httpClient = HttpClient.newBuilder().build()

    fun streamChat(request: AiChatRequest): Flow<AiStreamEvent> = flow {
        emit(AiStreamEvent.RunStarted)
        val result = runStreaming(request) { delta ->
            emit(AiStreamEvent.MessageDelta(delta))
        }

        if (result.operations.isNotEmpty()) {
            emit(AiStreamEvent.OperationsProposed(result.operations))
        }
        emit(AiStreamEvent.ResultCompleted(result))
        emit(AiStreamEvent.RunCompleted)
    }

    private suspend fun runStreaming(
        request: AiChatRequest,
        onMessageDelta: suspend (String) -> Unit,
    ): AiProviderResult {
        val response = httpClient.send(
            buildRequest(request = request, stream = true),
            HttpResponse.BodyHandlers.ofInputStream(),
        )
        require(response.statusCode() in 200..299) {
            "$providerId stream failed: ${response.statusCode()} ${responseBodyText(response).take(500)}"
        }

        val state = OpenAiStyleStreamState()
        response.body().bufferedReader().useLines { lines ->
            val dataLines = mutableListOf<String>()
            val rawLines = mutableListOf<String>()
            for (line in lines) {
                if (line.isBlank()) {
                    val payload = if (dataLines.isNotEmpty()) dataLines.joinToString("\n") else rawLines.joinToString("\n")
                    if (processSsePayload(payload, state, onMessageDelta)) break
                    dataLines.clear()
                    rawLines.clear()
                    continue
                }
                if (line.startsWith("data:")) {
                    dataLines += line.removePrefix("data:").trimStart()
                } else if (!line.startsWith("event:")) {
                    rawLines += line
                }
            }
            if (dataLines.isNotEmpty()) {
                processSsePayload(dataLines.joinToString("\n"), state, onMessageDelta)
            } else if (rawLines.isNotEmpty()) {
                processSsePayload(rawLines.joinToString("\n"), state, onMessageDelta)
            }
        }

        state.completedResult?.let { return it }
        state.messageExtractor.finish().takeIf(String::isNotBlank)?.let { trailing ->
            state.emittedMessageDelta = true
            onMessageDelta(trailing)
        }

        val result = responseParser.parseAssistantToolResponse(state.rawModelText.toString())
        if (!state.emittedMessageDelta && result.message.isNotBlank()) {
            onMessageDelta(result.message)
        }
        return result.copy(
            operations = state.operations + result.operations,
            externalThreadId = result.externalThreadId ?: state.externalThreadId,
            providerRunId = result.providerRunId ?: state.providerRunId,
            lastEventJson = result.lastEventJson ?: state.lastEventJson,
        )
    }

    private suspend fun processSsePayload(
        payload: String,
        state: OpenAiStyleStreamState,
        onMessageDelta: suspend (String) -> Unit,
    ): Boolean {
        if (payload.isBlank()) return false
        if (payload == "[DONE]") return true

        val node = runCatching { objectMapper.readTree(payload) }.getOrNull()
        if (node == null) {
            state.rawModelText.append(payload)
            return false
        }

        state.lastEventJson = payload
        if (node.has("message") && node.has("operations")) {
            state.completedResult = responseParser.parseProviderResponse(payload)
            state.completedResult?.message?.takeIf(String::isNotBlank)?.let { message ->
                if (!state.emittedMessageDelta) {
                    state.emittedMessageDelta = true
                    onMessageDelta(message)
                }
            }
            return false
        }

        val fullContent = firstText(
            node.path("content"),
            node.path("output_text"),
            node.path("choices").path(0).path("message").path("content"),
        )
        if (fullContent != null) {
            val parsed = responseParser.parseProviderResponse(payload)
            state.completedResult = parsed
            if (!state.emittedMessageDelta && parsed.message.isNotBlank()) {
                state.emittedMessageDelta = true
                onMessageDelta(parsed.message)
            }
            return false
        }

        state.externalThreadId = firstText(node.path("externalThreadId"), node.path("threadId"), node.path("conversationId"))
            ?: state.externalThreadId
        state.providerRunId = firstText(node.path("providerRunId"), node.path("runId"), node.path("id"))
            ?: state.providerRunId

        if (node.has("operations")) {
            state.operations = runCatching {
                objectMapper.readTripOperations(node.path("operations"))
            }.getOrDefault(state.operations)
        }

        val contentDelta = responseParser.extractSseContentDelta(node)
        if (contentDelta.isNotBlank()) {
            state.rawModelText.append(contentDelta)
            val messageDelta = state.messageExtractor.accept(contentDelta)
            if (messageDelta.isNotBlank()) {
                state.emittedMessageDelta = true
                onMessageDelta(messageDelta)
            }
        }
        return false
    }

    private fun buildRequest(request: AiChatRequest, stream: Boolean): HttpRequest {
        val config = configFactory(request, objectMapper)
        require(config.url.isNotBlank()) { "$providerId URL is required." }
        require(config.model.isNotBlank()) { "$providerId model is required." }

        val payload = mapOf(
            "model" to config.model,
            "stream" to stream,
            "messages" to listOf(
                mapOf("role" to "system", "content" to promptBuilder.developerInstructions()),
                mapOf("role" to "user", "content" to userMessageContent(request)),
            ),
        )

        val builder = HttpRequest
            .newBuilder(URI.create(config.url))
            .timeout(Duration.ofSeconds(config.timeoutSeconds))
            .header("Accept", if (stream) "text/event-stream" else "application/json")
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))

        config.headers.forEach { (name, value) -> builder.header(name, value) }
        return builder.build()
    }

    private fun userMessageContent(request: AiChatRequest): Any {
        val prompt = promptBuilder.buildStreamingTurnPrompt(request)
        if (request.inputImages.isEmpty()) return prompt
        return buildList {
            add(mapOf("type" to "text", "text" to prompt))
            request.inputImages.forEach { image ->
                val url = image.url ?: return@forEach
                add(
                    mapOf(
                        "type" to "image_url",
                        "image_url" to mapOf("url" to url),
                    ),
                )
            }
        }
    }

    private fun responseBodyText(response: HttpResponse<java.io.InputStream>): String =
        runCatching { response.body().bufferedReader().readText() }.getOrDefault("")

    private fun firstText(vararg nodes: JsonNode): String? =
        nodes.firstNotNullOfOrNull { node ->
            node.takeIf { it.isTextual }?.asText()?.takeIf(String::isNotBlank)
        }
}

private data class OpenAiStyleConfig(
    val url: String,
    val model: String,
    val timeoutSeconds: Long,
    val headers: Map<String, String>,
)

private class OpenAiStyleStreamState {
    val rawModelText = StringBuilder()
    val messageExtractor = ToolBlockStreamFilter()
    var operations: TripOperations = emptyList()
    var completedResult: AiProviderResult? = null
    var externalThreadId: String? = null
    var providerRunId: String? = null
    var lastEventJson: String? = null
    var emittedMessageDelta: Boolean = false
}

private fun AiChatRequest.settingsNode(objectMapper: ObjectMapper): JsonNode =
    runCatching { objectMapper.readTree(settingsJson) }.getOrDefault(objectMapper.createObjectNode())

private fun JsonNode.textOrNull(fieldName: String): String? =
    path(fieldName)
        .takeIf { node -> node.isTextual }
        ?.asText()
        ?.trim()
        ?.takeIf(String::isNotBlank)
