package app.mindplan.ai

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app.ai")
data class AiProperties(
    val defaultProvider: String = "local-rule",
    val claude: ClaudeCliProperties = ClaudeCliProperties(),
)

data class ClaudeCliProperties(
    val command: String = "claude",
    val model: String? = null,
    val timeoutSeconds: Long = 120,
)
