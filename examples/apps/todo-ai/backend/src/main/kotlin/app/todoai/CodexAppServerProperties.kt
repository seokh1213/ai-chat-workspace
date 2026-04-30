package app.todoai

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app.ai.codex-app-server")
data class CodexAppServerProperties(
    val url: String = "ws://127.0.0.1:8765",
    val model: String = "gpt-5.4-mini",
    val effort: String = "medium",
    val timeoutSeconds: Long = 180,
    val cwd: String? = null,
)
