package app.mindplan.ai

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.stereotype.Component
import java.util.concurrent.TimeUnit

@Component
class CodexCliAiProvider(
    private val objectMapper: ObjectMapper,
    private val fallback: LocalRuleAiProvider,
) : AiProvider {
    override val id: String = "codex-app-server"

    override fun complete(request: AiProviderRequest): AiProviderResult {
        val settings = request.settings()
        val command = listOf(
            resolveCliCommand("codex"),
            "exec",
            "--skip-git-repo-check",
            "--sandbox",
            "read-only",
            "-m",
            request.model?.takeIf { it.isNotBlank() } ?: settings.textOrNull("aiModel") ?: "gpt-5.4-mini",
            "-c",
            "model_reasoning_effort=\"${settings.textOrNull("aiEffort") ?: "medium"}\"",
            buildPrompt(request),
        )
        val process = runCatching {
            ProcessBuilder(command)
                .redirectErrorStream(true)
                .start()
        }.getOrNull() ?: return fallback.complete(request)

        val completed = process.waitFor(180, TimeUnit.SECONDS)
        if (!completed) {
            process.destroyForcibly()
            return fallback.complete(request)
        }

        val output = process.inputStream.bufferedReader().use { it.readText() }.trim()
        return parseOutput(output).copy(model = request.model ?: settings.textOrNull("aiModel"))
    }

    private fun buildPrompt(request: AiProviderRequest): String =
        """
        당신은 계획과 할 일을 수정하는 AI입니다. 사용자의 자연어 요청을 읽고 사용자에게 보여줄 message와 적용할 operations를 JSON으로만 답하세요.
        마크다운 설명은 message 안에 넣고, 실제 변경은 operations 배열에만 넣으세요.

        가능한 operations:
        - {"op":"create_task","patch":{"title":"...","description":"...","status":"todo|in_progress|done","priority":"low|normal|high","x":120,"y":160}}
        - {"op":"update_task","taskId":"...","patch":{"title":"...","description":"...","status":"todo|in_progress|done","priority":"low|normal|high"}}
        - {"op":"delete_task","taskId":"..."}
        - {"op":"update_plan","patch":{"title":"...","summary":"...","dueDate":"YYYY-MM-DD","currentView":"canvas|kanban|mindmap"}}
        - {"op":"set_chat_title","patch":{"title":"짧은 대화 제목"}}

        현재 계획:
        ${objectMapper.writeValueAsString(request.plan)}

        최근 대화:
        ${objectMapper.writeValueAsString(request.chatHistory.takeLast(12))}

        사용자 요청:
        ${request.message}

        응답 스키마:
        {"message":"사용자에게 보여줄 한국어 답변","operations":[]}
        """.trimIndent()

    private fun parseOutput(output: String): AiProviderResult =
        runCatching {
            val jsonText = if ("\n{" in output) "{${output.substringAfterLast("\n{")}" else output
            val node = objectMapper.readTree(jsonText)
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
            AiProviderResult(message = output.ifBlank { "Codex CLI 응답을 받았지만 비어 있습니다." }, operations = emptyList())
        }

    private fun AiProviderRequest.settings(): JsonNode =
        runCatching { objectMapper.readTree(settingsJson) }.getOrDefault(objectMapper.createObjectNode())
}

private fun JsonNode.textOrNull(field: String): String? =
    path(field).takeIf { !it.isMissingNode && !it.isNull }?.asText()?.takeIf { it.isNotBlank() }
