package app.tripplanner.ai

import app.tripplanner.trip.TripOperations
import app.tripplanner.trip.readTripOperations
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.springframework.stereotype.Component

@Component
class AiProviderResponseParser {
    private val objectMapper: ObjectMapper = jacksonObjectMapper()
    private val toolBlockRegex = Regex("""<tool\b[^>]*>(.*?)</tool>""", setOf(RegexOption.IGNORE_CASE, RegexOption.DOT_MATCHES_ALL))
    private val operationsBlockRegex =
        Regex("""<operations\b[^>]*>(.*?)</operations>""", setOf(RegexOption.IGNORE_CASE, RegexOption.DOT_MATCHES_ALL))

    fun parseAssistantJson(rawText: String): AiProviderResult {
        val json = rawText.trim().removeCodeFence()
        return runCatching {
            parseResultNode(objectMapper.readTree(json))
        }.getOrElse { error ->
            AiProviderResult(
                message = "AI 응답을 적용 가능한 형식으로 해석하지 못했습니다. ${error.message ?: ""}".trim(),
                operations = emptyList(),
            )
        }
    }

    fun parseProviderResponse(rawText: String): AiProviderResult {
        val node = runCatching { objectMapper.readTree(rawText) }.getOrNull()
            ?: return parseAssistantJson(rawText)

        if (node.has("message") && node.has("operations")) {
            return parseResultNode(node)
        }

        val content = firstText(
            node.path("content"),
            node.path("output_text"),
            node.path("choices").path(0).path("message").path("content"),
            node.path("choices").path(0).path("text"),
        )
        return content
            ?.let(::parseAssistantToolResponse)
            ?: AiProviderResult(message = "외부 AI 응답에서 메시지 본문을 찾지 못했습니다.", operations = emptyList())
    }

    fun parseAssistantToolResponse(rawText: String): AiProviderResult {
        val toolBlocks = toolBlockRegex.findAll(rawText).toList()
        val textWithoutToolBlocks = toolBlockRegex.replace(rawText, "").trim().normalizeAssistantMarkdown()
        val embeddedJson = findEmbeddedResultJson(textWithoutToolBlocks)
        val toolOperations = toolBlocks.flatMap { match ->
            parseToolOperations(match.groupValues[1])
        }

        if (embeddedJson != null) {
            val parsed = parseResultNode(embeddedJson.node)
            val visibleMessage = textWithoutToolBlocks
                .removeRange(embeddedJson.start, embeddedJson.endExclusive)
                .trim()
            return parsed.copy(
                message = parsed.message.ifBlank { visibleMessage.ifBlank { "변경안을 정리했습니다." } }.normalizeAssistantMarkdown(),
                operations = toolOperations + parsed.operations,
            )
        }

        if (toolBlocks.isEmpty()) {
            val text = textWithoutToolBlocks
            return if (text.looksLikeJson()) {
                parseAssistantJson(text)
            } else {
                AiProviderResult(message = text.normalizeAssistantMarkdown(), operations = emptyList())
            }
        }

        return AiProviderResult(
            message = textWithoutToolBlocks.ifBlank { "변경안을 정리했습니다." }.normalizeAssistantMarkdown(),
            operations = toolOperations,
        )
    }

    fun extractSseContentDelta(node: JsonNode): String =
        firstText(
            node.path("delta"),
            node.path("content"),
            node.path("message"),
            node.path("choices").path(0).path("delta").path("content"),
            node.path("choices").path(0).path("text"),
        ).orEmpty()

    private fun parseResultNode(node: JsonNode): AiProviderResult =
        AiProviderResult(
            message = node.path("message").asText("변경안을 정리했습니다.").normalizeAssistantMarkdown(),
            operations = objectMapper.readTripOperations(node.path("operations")),
            externalThreadId = firstText(node.path("externalThreadId"), node.path("threadId"), node.path("conversationId")),
            providerRunId = firstText(node.path("providerRunId"), node.path("runId"), node.path("id")),
            lastEventJson = node.toString(),
        )

    private fun parseToolOperations(rawToolText: String): TripOperations {
        val jsonText = operationsBlockRegex
            .find(rawToolText)
            ?.groupValues
            ?.getOrNull(1)
            ?.trim()
            ?: rawToolText.trim()

        val node = runCatching { objectMapper.readTree(jsonText.removeCodeFence()) }.getOrNull() ?: return emptyList()
        val operationsNode = when {
            node.isArray -> node
            node.has("operations") -> node.path("operations")
            else -> return emptyList()
        }
        if (!operationsNode.isArray) return emptyList()
        return runCatching {
            objectMapper.readTripOperations(operationsNode)
        }.getOrDefault(emptyList())
    }

    private fun findEmbeddedResultJson(text: String): EmbeddedJsonResult? {
        text.forEachIndexed { start, char ->
            if (char != '{') return@forEachIndexed

            val endExclusive = findJsonObjectEnd(text, start) ?: return@forEachIndexed
            val node = runCatching { objectMapper.readTree(text.substring(start, endExclusive)) }.getOrNull()
                ?: return@forEachIndexed
            if (node.isObject && node.has("message") && node.has("operations")) {
                return EmbeddedJsonResult(
                    start = start,
                    endExclusive = endExclusive,
                    node = node,
                )
            }
        }
        return null
    }

    private fun findJsonObjectEnd(text: String, start: Int): Int? {
        var depth = 0
        var inString = false
        var escaped = false

        for (index in start until text.length) {
            val char = text[index]
            if (inString) {
                when {
                    escaped -> escaped = false
                    char == '\\' -> escaped = true
                    char == '"' -> inString = false
                }
                continue
            }

            when (char) {
                '"' -> inString = true
                '{' -> depth += 1
                '}' -> {
                    depth -= 1
                    if (depth == 0) return index + 1
                    if (depth < 0) return null
                }
            }
        }
        return null
    }

    private fun firstText(vararg nodes: JsonNode): String? =
        nodes.firstNotNullOfOrNull { node ->
            node.takeIf { it.isTextual }?.asText()?.takeIf(String::isNotBlank)
        }

    private fun String.looksLikeJson(): Boolean {
        val text = removeCodeFence()
        return text.startsWith("{") || text.startsWith("[")
    }

    private fun String.removeCodeFence(): String =
        removePrefix("```json")
            .removePrefix("```")
            .removeSuffix("```")
            .trim()

    private fun String.normalizeAssistantMarkdown(): String =
        replace(Regex("""참고\s*स्रोत"""), "출처")
            .replace(Regex("""(?m)^Sources:\s*$"""), "출처:")
            .replace(Regex("""([^\s\n])-\s+(?=\S)"""), "$1\n- ")
}

private data class EmbeddedJsonResult(
    val start: Int,
    val endExclusive: Int,
    val node: JsonNode,
)
