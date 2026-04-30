package app.mindplan.ai

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.stereotype.Component
import java.util.concurrent.TimeUnit

@Component
@EnableConfigurationProperties(AiProperties::class)
class ClaudeCliAiProvider(
    private val properties: AiProperties,
    private val objectMapper: ObjectMapper,
    private val fallback: LocalRuleAiProvider,
) : AiProvider {
    override val id: String = "claude-cli"

    override fun complete(request: AiProviderRequest): AiProviderResult {
        val prompt = buildPrompt(request)
        val settings = request.settings()
        val command = resolveCliCommand(settings.textOrNull("claudeCommand") ?: properties.claude.command)
        val model = request.model ?: settings.textOrNull("aiModel") ?: properties.claude.model
        val commandLine = buildList {
            add(command)
            model?.takeIf { it.isNotBlank() && it != "default" }?.let {
                add("--model")
                add(it)
            }
            add("-p")
            add(prompt)
        }
        val process = runCatching {
            ProcessBuilder(commandLine)
                .redirectErrorStream(true)
                .start()
        }.getOrNull() ?: return fallback.complete(request)

        val completed = process.waitFor(properties.claude.timeoutSeconds, TimeUnit.SECONDS)
        if (!completed) {
            process.destroyForcibly()
            return fallback.complete(request)
        }

        val output = process.inputStream.bufferedReader().use { it.readText() }.trim()
        return parseOutput(output).copy(model = model)
    }

    private fun buildPrompt(request: AiProviderRequest): String =
        """
        당신은 계획과 할 일을 수정하는 AI입니다. 사용자의 자연어 요청을 읽고 사용자에게 보여줄 message와 적용할 operations를 JSON으로만 답하세요.

        가능한 operations:
        - {"op":"create_task","patch":{"title":"...","description":"...","status":"todo|in_progress|done","priority":"low|normal|high","x":120,"y":160}}
        - {"op":"update_task","taskId":"...","patch":{"title":"...","description":"...","status":"todo|in_progress|done","priority":"low|normal|high"}}
        - {"op":"update_plan","patch":{"title":"...","summary":"...","dueDate":"YYYY-MM-DD","currentView":"canvas|kanban|mindmap"}}
        - {"op":"set_chat_title","patch":{"title":"짧은 대화 제목"}}

        현재 계획:
        ${objectMapper.writeValueAsString(request.plan)}

        사용자 요청:
        ${request.message}

        응답 스키마:
        {"message":"사용자에게 보여줄 한국어 답변","operations":[]}
        """.trimIndent()

    private fun parseOutput(output: String): AiProviderResult =
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
            AiProviderResult(message = output.ifBlank { "Claude CLI 응답을 받았지만 비어 있습니다." }, operations = emptyList())
        }

    private fun AiProviderRequest.settings(): JsonNode =
        runCatching { objectMapper.readTree(settingsJson) }.getOrDefault(objectMapper.createObjectNode())
}

private fun JsonNode.textOrNull(field: String): String? =
    path(field).takeIf { !it.isMissingNode && !it.isNull }?.asText()?.takeIf { it.isNotBlank() }
