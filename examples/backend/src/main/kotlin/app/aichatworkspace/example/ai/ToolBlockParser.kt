package app.aichatworkspace.example.ai

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue

data class ParsedAssistantResponse(
    val message: String,
    val operations: List<Map<String, Any?>>,
)

class ToolBlockParser(
    private val objectMapper: ObjectMapper,
) {
    private val toolBlockRegex = Regex(
        pattern = """<tool\b[^>]*>(.*?)</tool>""",
        options = setOf(RegexOption.IGNORE_CASE, RegexOption.DOT_MATCHES_ALL),
    )

    fun parse(rawText: String): ParsedAssistantResponse {
        val match = toolBlockRegex.find(rawText)
        if (match == null) {
            return ParsedAssistantResponse(message = rawText.trim(), operations = emptyList())
        }

        val visibleMessage = rawText.removeRange(match.range).trim()
        val node = objectMapper.readTree(match.groupValues[1].trim())
        val operationsNode = when {
            node.isArray -> node
            node.has("operations") -> node.path("operations")
            else -> objectMapper.createArrayNode()
        }
        val operations = if (operationsNode.isArray) {
            objectMapper.readValue<List<Map<String, Any?>>>(operationsNode.toString())
        } else {
            emptyList()
        }

        return ParsedAssistantResponse(message = visibleMessage, operations = operations)
    }
}

