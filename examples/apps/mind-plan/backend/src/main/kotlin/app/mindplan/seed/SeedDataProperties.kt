package app.mindplan.seed

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app.seed")
data class SeedDataProperties(
    val enabled: Boolean = false,
    val locations: List<String> = emptyList(),
)
