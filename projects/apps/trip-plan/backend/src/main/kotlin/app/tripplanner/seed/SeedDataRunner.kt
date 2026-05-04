package app.tripplanner.seed

import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.core.io.Resource
import org.springframework.core.io.support.EncodedResource
import org.springframework.core.io.support.PathMatchingResourcePatternResolver
import org.springframework.jdbc.datasource.init.ScriptUtils
import org.springframework.stereotype.Component
import java.nio.charset.StandardCharsets
import javax.sql.DataSource

@Component
class SeedDataRunner(
    private val dataSource: DataSource,
    private val properties: SeedDataProperties,
) : ApplicationRunner {
    private val resolver = PathMatchingResourcePatternResolver()

    override fun run(args: ApplicationArguments) {
        if (!properties.enabled) {
            return
        }

        properties.locations
            .flatMap(::resourcesFor)
            .sortedBy { it.filename.orEmpty() }
            .forEach(::execute)
    }

    private fun resourcesFor(location: String): List<Resource> =
        resolver.getResources(location).filter { it.exists() }

    private fun execute(resource: Resource) {
        dataSource.connection.use { connection ->
            ScriptUtils.executeSqlScript(connection, EncodedResource(resource, StandardCharsets.UTF_8))
        }
    }
}
