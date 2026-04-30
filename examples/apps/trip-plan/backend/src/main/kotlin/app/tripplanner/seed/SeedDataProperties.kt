package app.tripplanner.seed

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app.seed")
data class SeedDataProperties(
    val enabled: Boolean = false,
    val locations: List<String> = listOf("classpath*:db/seed/*.sql"),
)
