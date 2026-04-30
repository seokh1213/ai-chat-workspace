package app.mindplan.seed

import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.ApplicationContext
import org.springframework.core.io.support.ResourcePatternResolver
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import jakarta.annotation.PostConstruct

@Component
@EnableConfigurationProperties(SeedDataProperties::class)
class SeedDataRunner(
    private val properties: SeedDataProperties,
    private val resolver: ResourcePatternResolver,
    private val jdbcTemplate: JdbcTemplate,
    @Suppress("unused") private val applicationContext: ApplicationContext,
) {
    @PostConstruct
    @Transactional
    fun run() {
        if (!properties.enabled) return

        properties.locations
            .flatMap { resolver.getResources(it).toList() }
            .sortedBy { it.filename.orEmpty() }
            .forEach { resource ->
                val sql = resource.inputStream.bufferedReader().use { it.readText() }
                sql.splitToStatements().forEach(jdbcTemplate::execute)
            }
    }
}

private fun String.splitToStatements(): List<String> =
    split(";")
        .map { it.trim() }
        .filter { it.isNotBlank() }
