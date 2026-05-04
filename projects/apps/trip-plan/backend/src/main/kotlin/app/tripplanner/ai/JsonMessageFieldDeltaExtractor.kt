package app.tripplanner.ai

class JsonMessageFieldDeltaExtractor(
    private val fieldName: String = "message",
) {
    private val raw = StringBuilder()
    private var emittedLength = 0

    val hasEmitted: Boolean
        get() = emittedLength > 0

    fun accept(chunk: String): String {
        raw.append(chunk)
        val decoded = extractPartialMessage(raw.toString()) ?: return ""
        if (decoded.length <= emittedLength) return ""

        val delta = decoded.substring(emittedLength)
        emittedLength = decoded.length
        return delta
    }

    private fun extractPartialMessage(text: String): String? {
        val fieldIndex = text.indexOf("\"$fieldName\"")
        if (fieldIndex < 0) return null

        val colonIndex = text.indexOf(':', startIndex = fieldIndex)
        if (colonIndex < 0) return null

        var valueStart = colonIndex + 1
        while (valueStart < text.length && text[valueStart].isWhitespace()) {
            valueStart += 1
        }
        if (valueStart >= text.length || text[valueStart] != '"') return null

        val output = StringBuilder()
        var index = valueStart + 1
        var escaped = false
        while (index < text.length) {
            val char = text[index]
            if (escaped) {
                when (char) {
                    '"', '\\', '/' -> output.append(char)
                    'b' -> output.append('\b')
                    'f' -> output.append('\u000C')
                    'n' -> output.append('\n')
                    'r' -> output.append('\r')
                    't' -> output.append('\t')
                    'u' -> {
                        if (index + 4 >= text.length) return output.toString()
                        val hex = text.substring(index + 1, index + 5)
                        val decodedChar = hex.toIntOrNull(radix = 16)?.toChar() ?: return output.toString()
                        output.append(decodedChar)
                        index += 4
                    }
                    else -> output.append(char)
                }
                escaped = false
            } else {
                when (char) {
                    '\\' -> escaped = true
                    '"' -> return output.toString()
                    else -> output.append(char)
                }
            }
            index += 1
        }
        return output.toString()
    }
}
