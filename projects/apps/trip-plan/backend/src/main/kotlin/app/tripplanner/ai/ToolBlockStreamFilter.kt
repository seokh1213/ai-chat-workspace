package app.tripplanner.ai

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper

class ToolBlockStreamFilter {
    private val objectMapper = jacksonObjectMapper()
    private val openingTag = Regex("""<tool\b[^>]*>""", RegexOption.IGNORE_CASE)
    private val closingTag = "</tool>"
    private val pendingOpening = StringBuilder()
    private val pendingClosing = StringBuilder()
    private val pendingJson = StringBuilder()
    private var insideToolBlock = false
    private var jsonDepth = 0
    private var jsonInString = false
    private var jsonEscaped = false

    var hasEmitted: Boolean = false
        private set

    fun accept(chunk: String): String {
        val output = StringBuilder()
        chunk.forEach { char ->
            if (insideToolBlock) {
                acceptHiddenChar(char)
                return@forEach
            }

            if (pendingOpening.isNotEmpty() || char == '<') {
                acceptPotentialOpeningChar(char, output)
                return@forEach
            }

            if (pendingJson.isNotEmpty() || char == '{') {
                acceptPotentialJsonChar(char, output)
                return@forEach
            }

            output.append(char)
        }

        return output.toString().markEmitted()
    }

    fun finish(): String {
        if (insideToolBlock) {
            pendingClosing.clear()
            return ""
        }

        val output = StringBuilder()
        output.append(pendingOpening)
        pendingOpening.clear()

        if (pendingJson.isNotEmpty()) {
            val candidate = pendingJson.toString()
            if (!isHiddenJsonPayload(candidate)) {
                output.append(candidate)
            }
            clearPotentialJson()
        }

        return output.toString().markEmitted()
    }

    private fun acceptHiddenChar(char: Char) {
        pendingClosing.append(char)
        if (pendingClosing.length > closingTag.length) {
            pendingClosing.delete(0, pendingClosing.length - closingTag.length)
        }
        if (pendingClosing.toString().equals(closingTag, ignoreCase = true)) {
            insideToolBlock = false
            pendingClosing.clear()
        }
    }

    private fun acceptPotentialOpeningChar(char: Char, output: StringBuilder) {
        pendingOpening.append(char)
        val pending = pendingOpening.toString()
        val lowerPending = pending.lowercase()

        when {
            lowerPending == "<" || "<tool".startsWith(lowerPending) -> Unit
            lowerPending.startsWith("<tool") && !pending.endsWith(">") -> Unit
            lowerPending.startsWith("<tool") && openingTag.matches(pending) -> {
                insideToolBlock = true
                pendingOpening.clear()
                pendingClosing.clear()
            }
            else -> {
                output.append(pending)
                pendingOpening.clear()
            }
        }
    }

    private fun acceptPotentialJsonChar(char: Char, output: StringBuilder) {
        pendingJson.append(char)
        updatePotentialJsonState(char)
        if (jsonDepth != 0) return

        val candidate = pendingJson.toString()
        if (!isHiddenJsonPayload(candidate)) {
            output.append(candidate)
        }
        clearPotentialJson()
    }

    private fun updatePotentialJsonState(char: Char) {
        if (pendingJson.length == 1 && char == '{') {
            jsonDepth = 1
            return
        }

        if (jsonInString) {
            when {
                jsonEscaped -> jsonEscaped = false
                char == '\\' -> jsonEscaped = true
                char == '"' -> jsonInString = false
            }
            return
        }

        when (char) {
            '"' -> jsonInString = true
            '{' -> jsonDepth += 1
            '}' -> jsonDepth = (jsonDepth - 1).coerceAtLeast(0)
        }
    }

    private fun clearPotentialJson() {
        pendingJson.clear()
        jsonDepth = 0
        jsonInString = false
        jsonEscaped = false
    }

    private fun isHiddenJsonPayload(payload: String): Boolean {
        val node = runCatching { objectMapper.readTree(payload) }.getOrNull() ?: return false
        return node.isObject && node.has("operations")
    }

    private fun String.markEmitted(): String {
        if (isNotBlank()) {
            hasEmitted = true
        }
        return this
    }
}
