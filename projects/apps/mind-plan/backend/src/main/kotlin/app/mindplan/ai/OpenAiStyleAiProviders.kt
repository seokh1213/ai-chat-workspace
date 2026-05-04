package app.mindplan.ai

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.stereotype.Component
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration

@Component
class OpenAiCompatibleProvider(
    objectMapper: ObjectMapper,
) : OpenAiStyleProvider(
    id = "openai-compatible",
    objectMapper = objectMapper,
    defaultUrl = "https://api.openai.com/v1/chat/completions",
    defaultModel = "gpt-5.4-mini",
)

@Component
class OpenRouterProvider(
    objectMapper: ObjectMapper,
) : OpenAiStyleProvider(
    id = "openrouter",
    objectMapper = objectMapper,
    defaultUrl = "https://openrouter.ai/api/v1/chat/completions",
    defaultModel = "openai/gpt-5.2",
)

abstract class OpenAiStyleProvider(
    override val id: String,
    private val objectMapper: ObjectMapper,
    private val defaultUrl: String,
    private val defaultModel: String,
) : AiProvider {
    private val httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(20)).build()

    override fun complete(request: AiProviderRequest): AiProviderResult {
        val settings = request.settings()
        val response = httpClient.send(
            buildRequest(request = request, settings = settings),
            HttpResponse.BodyHandlers.ofString(),
        )
        require(response.statusCode() in 200..299) {
            "$id request failed: ${response.statusCode()} ${response.body().take(500)}"
        }

        val content = objectMapper.readTree(response.body())
            .path("choices")
            .path(0)
            .path("message")
            .path("content")
            .asText()
            .takeIf { it.isNotBlank() }
            ?: response.body()
        return parseProviderOutput(content).copy(model = request.model ?: defaultModelFor(settings))
    }

    private fun buildRequest(
        request: AiProviderRequest,
        settings: JsonNode,
    ): HttpRequest {
        val body = objectMapper.writeValueAsString(
            mapOf(
                "model" to defaultModelFor(settings, request.model),
                "messages" to listOf(
                    mapOf("role" to "system", "content" to systemPrompt()),
                    mapOf("role" to "user", "content" to userPrompt(request)),
                ),
                "temperature" to 0.2,
            ),
        )

        val builder = HttpRequest
            .newBuilder(URI.create(urlFor(settings)))
            .timeout(Duration.ofSeconds(180))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(body))

        apiKeyFor(settings)?.let { builder.header("Authorization", "Bearer $it") }
        if (id == "openrouter") {
            settings.textOrNull("openRouterReferer")?.let { builder.header("HTTP-Referer", it) }
            settings.textOrNull("openRouterTitle")?.let {
                builder.header("X-OpenRouter-Title", it)
                builder.header("X-Title", it)
            }
        }
        return builder.build()
    }

    private fun systemPrompt(): String =
        """
        당신은 계획과 할 일을 수정하는 AI입니다. 사용자의 자연어 요청을 읽고 사용자에게 보여줄 message와 적용할 operations를 JSON으로만 답하세요.

        가능한 operations:
        - {"op":"create_task","patch":{"title":"...","description":"...","status":"todo|in_progress|done","priority":"low|normal|high","x":120,"y":160}}
        - {"op":"update_task","taskId":"...","patch":{"title":"...","description":"...","status":"todo|in_progress|done","priority":"low|normal|high"}}
        - {"op":"update_plan","patch":{"title":"...","summary":"...","dueDate":"YYYY-MM-DD","currentView":"canvas|kanban|mindmap"}}
        - {"op":"set_chat_title","patch":{"title":"짧은 대화 제목"}}

        응답 스키마:
        {"message":"사용자에게 보여줄 한국어 답변","operations":[]}
        """.trimIndent()

    private fun userPrompt(request: AiProviderRequest): String =
        """
        현재 계획:
        ${objectMapper.writeValueAsString(request.plan)}

        최근 대화:
        ${objectMapper.writeValueAsString(request.chatHistory.takeLast(12))}

        사용자 요청:
        ${request.message}
        """.trimIndent()

    private fun parseProviderOutput(output: String): AiProviderResult =
        runCatching {
            val node = objectMapper.readTree(output)
            val operations = node.path("operations").map { operation ->
                AiOperation(
                    op = operation.path("op").asText(),
                    taskId = operation.path("taskId").takeIf { !it.isMissingNode && !it.isNull }?.asText(),
                    linkId = operation.path("linkId").takeIf { !it.isMissingNode && !it.isNull }?.asText(),
                    patch = objectMapper.convertValue(
                        operation.path("patch"),
                        object : TypeReference<Map<String, Any?>>() {},
                    ),
                )
            }
            AiProviderResult(
                message = node.path("message").asText(output),
                operations = operations,
            )
        }.getOrElse {
            AiProviderResult(message = output.ifBlank { "AI 응답을 받았지만 비어 있습니다." }, operations = emptyList())
        }

    private fun AiProviderRequest.settings(): JsonNode =
        runCatching { objectMapper.readTree(settingsJson) }.getOrDefault(objectMapper.createObjectNode())

    private fun urlFor(settings: JsonNode): String =
        if (id == "openai-compatible") settings.textOrNull("openAiBaseUrl") ?: defaultUrl else defaultUrl

    private fun apiKeyFor(settings: JsonNode): String? =
        when (id) {
            "openai-compatible" -> settings.textOrNull("openAiApiKey")
            "openrouter" -> settings.textOrNull("openRouterApiKey")
            else -> null
        }

    private fun defaultModelFor(settings: JsonNode, requestedModel: String? = null): String =
        requestedModel?.takeIf { it.isNotBlank() }
            ?: settings.textOrNull("aiModel")
            ?: defaultModel
}

private fun JsonNode.textOrNull(field: String): String? =
    path(field).takeIf { !it.isMissingNode && !it.isNull }?.asText()?.takeIf { it.isNotBlank() }
