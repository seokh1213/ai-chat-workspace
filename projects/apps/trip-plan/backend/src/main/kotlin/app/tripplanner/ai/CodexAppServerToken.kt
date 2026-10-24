package app.tripplanner.ai

import java.nio.file.Files
import java.nio.file.Path

private val HeaderSafeToken = Regex("[\\x21-\\x7E]+")

/**
 * Builds the `Authorization` value for app-server capability-token auth, or null when there is no token.
 * The file is read per connection so a Secret mounted after startup, or rotated later, applies without a
 * restart, and a missing file keeps app-servers that do not require auth working.
 */
internal fun CodexAppServerProperties.authorizationHeader(): String? {
    val path = tokenFile?.takeIf { it.isNotBlank() }?.let(Path::of) ?: return null
    if (!Files.exists(path)) return null
    val token = Files.readString(path).trim()
    if (token.isEmpty()) return null
    // Name only the file; the token must never reach a log or an exception message.
    check(HeaderSafeToken.matches(token)) { "Codex app-server token in $path must be one printable ASCII word." }
    return "Bearer $token"
}
