package app.tripplanner

import app.tripplanner.chat.ChatService
import app.tripplanner.trip.TripService
import app.tripplanner.workspace.WorkspaceRepository
import app.tripplanner.workspace.WorkspaceService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.testcontainers.containers.PostgreSQLContainer

@SpringBootTest(
    properties = [
        "app.ai.codex-app-server.managed=false",
    ],
)
@ActiveProfiles("dev")
abstract class TripPlannerIntegrationTestSupport {
    @Autowired
    protected lateinit var workspaceRepository: WorkspaceRepository

    @Autowired
    protected lateinit var workspaceService: WorkspaceService

    @Autowired
    protected lateinit var tripService: TripService

    @Autowired
    protected lateinit var chatService: ChatService

    protected fun eventually(timeoutMs: Long = 3_000, assertion: () -> Unit) {
        val deadline = System.currentTimeMillis() + timeoutMs
        var lastError: AssertionError? = null
        while (System.currentTimeMillis() < deadline) {
            try {
                assertion()
                return
            } catch (error: AssertionError) {
                lastError = error
                Thread.sleep(50)
            }
        }
        lastError?.let { throw it }
        assertion()
    }

    companion object {
        private val externalDatabaseUrl = System.getenv("TRIP_PLAN_TEST_DATABASE_URL")?.takeIf(String::isNotBlank)
        private val postgres = externalDatabaseUrl?.let { null } ?: PostgreSQLContainer<Nothing>("postgres:16-alpine").apply {
            withDatabaseName(TestDatabaseName)
            withUsername(TestDatabaseUsername)
            withPassword(TestDatabasePassword)
        }

        @JvmStatic
        @DynamicPropertySource
        fun registerDatasourceProperties(registry: DynamicPropertyRegistry) {
            if (externalDatabaseUrl != null) {
                registry.add("spring.datasource.url") { externalDatabaseUrl }
                registry.add("spring.datasource.username") { TestDatabaseUsername }
                registry.add("spring.datasource.password") { TestDatabasePassword }
                registry.add("spring.datasource.driver-class-name") { "org.postgresql.Driver" }
                return
            }

            postgres.start()
            registry.add("spring.datasource.url", postgres::getJdbcUrl)
            registry.add("spring.datasource.username", postgres::getUsername)
            registry.add("spring.datasource.password", postgres::getPassword)
            registry.add("spring.datasource.driver-class-name", postgres::getDriverClassName)
        }
    }
}

private const val TestDatabaseName = "trip_plan_test"
private const val TestDatabaseUsername = "trip_plan"
private const val TestDatabasePassword = "trip_plan"
