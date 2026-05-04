package app.tripplanner.ai

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app.ai.openai-compatible")
data class OpenAiCompatibleProperties(
    val baseUrl: String = "https://api.openai.com/v1/chat/completions",
    val apiKey: String? = null,
    val model: String = "gpt-5.4-mini",
    val timeoutSeconds: Long = 180,
)

@ConfigurationProperties(prefix = "app.ai.openrouter")
data class OpenRouterProperties(
    val baseUrl: String = "https://openrouter.ai/api/v1/chat/completions",
    val apiKey: String? = null,
    val model: String = "openai/gpt-5.2",
    val referer: String? = null,
    val title: String = "Trip Planner",
    val timeoutSeconds: Long = 180,
)
