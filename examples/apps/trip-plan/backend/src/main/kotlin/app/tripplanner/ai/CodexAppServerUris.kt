package app.tripplanner.ai

import java.net.URI

internal fun String.toCodexAppServerHealthUri(): URI {
    val uri = URI.create(this)
    val scheme = when (uri.scheme) {
        "wss" -> "https"
        else -> "http"
    }
    return URI(
        scheme,
        uri.userInfo,
        uri.host,
        uri.port,
        "/healthz",
        null,
        null,
    )
}
