package app.tripplanner.ai

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app.ai.codex-app-server")
data class CodexAppServerProperties(
    val url: String = "ws://127.0.0.1:8765",
    val model: String = "gpt-5.4-mini",
    val effort: String = "medium",
    val timeoutSeconds: Long = 180,
    val cwd: String? = null,
    val managed: Boolean = false,
    val executable: String = "codex",
    val processWorkingDirectory: String? = null,
    val startupTimeoutSeconds: Long = 8,
    val restartOnExit: Boolean = false,
    val restartDelaySeconds: Long = 2,
)
