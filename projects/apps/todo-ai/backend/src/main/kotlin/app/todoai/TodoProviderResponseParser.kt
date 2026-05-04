package app.todoai

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

data class TodoProviderResult(
    val message: String,
    val operations: List<TodoOperation>,
)

@Component
class TodoProviderResponseParser {
    private val logger = LoggerFactory.getLogger(javaClass)
    private val objectMapper = jacksonObjectMapper()
    private val toolBlockRegex = Regex("""<tool\b[^>]*>(.*?)</tool>""", setOf(RegexOption.IGNORE_CASE, RegexOption.DOT_MATCHES_ALL))
    private val operationsBlockRegex =
        Regex("""<operations\b[^>]*>(.*?)</operations>""", setOf(RegexOption.IGNORE_CASE, RegexOption.DOT_MATCHES_ALL))

    fun parse(rawText: String): TodoProviderResult {
        val trimmed = rawText.trim()
        if (trimmed.isBlank()) {
            return TodoProviderResult(message = "응답 본문이 비어 있습니다.", operations = emptyList())
        }

        parseJsonResult(trimmed)?.let { return it }

        val toolBlocks = toolBlockRegex.findAll(trimmed).toList()
        val visibleText = toolBlockRegex.replace(trimmed, "").trim().normalizeAssistantMarkdown()
        val operations = toolBlocks.flatMap { match -> parseOperations(match.groupValues[1]) }

        return TodoProviderResult(
            message = visibleText.ifBlank { "변경안을 만들었습니다." },
            operations = operations,
        )
    }

    private fun parseJsonResult(text: String): TodoProviderResult? {
        val node = runCatching { objectMapper.readTree(text) }.getOrNull() ?: return null
        if (!node.isObject || !node.has("message") || !node.has("operations")) return null
        return TodoProviderResult(
            message = node.path("message").asText().normalizeAssistantMarkdown(),
            operations = parseOperationsNode(node.path("operations")),
        )
    }

    private fun parseOperations(text: String): List<TodoOperation> {
        val jsonText = operationsBlockRegex
            .find(text)
            ?.groupValues
            ?.getOrNull(1)
            ?: text

        val node = runCatching { objectMapper.readTree(jsonText.trim()) }
            .onFailure { error -> logger.warn("Failed to parse tool block JSON: {}", error.message) }
            .getOrNull()
            ?: return emptyList()

        val operationsNode = when {
            node.isArray -> node
            node.has("operations") -> node.path("operations")
            else -> return emptyList()
        }
        return parseOperationsNode(operationsNode)
    }

    private fun parseOperationsNode(node: JsonNode): List<TodoOperation> {
        if (!node.isArray) return emptyList()
        return runCatching {
            objectMapper.readValue<List<TodoOperation>>(node.toString())
        }.onFailure { error ->
            logger.warn("Failed to bind todo operations: {}", error.message)
        }.getOrDefault(emptyList())
    }
}

private fun String.normalizeAssistantMarkdown(): String =
    replace(Regex("""참고\s*स्रोत"""), "출처")
        .replace(Regex("""^Sources:\s*$""", RegexOption.MULTILINE), "출처:")
        .replace(Regex("""([^\s\n])-\s+(?=\S)"""), "$1\n- ")
