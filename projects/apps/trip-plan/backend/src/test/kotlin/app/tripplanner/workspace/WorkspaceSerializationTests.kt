package app.tripplanner.workspace

import app.tripplanner.chat.ChatSessionDto
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Test

class WorkspaceSerializationTests {
    private val objectMapper = jacksonObjectMapper()

    @Test
    fun `workspace response hides api keys and raw settings`() {
        val workspace = WorkspaceDto(
            id = "workspace_test",
            name = "Test",
            aiProvider = "openrouter",
            aiModel = "openai/gpt-5.2",
            aiEffort = "medium",
            openAiBaseUrl = "https://api.openai.com/v1/chat/completions",
            openAiApiKey = "secret-openai-key",
            openRouterApiKey = "secret-openrouter-key",
            openRouterReferer = "http://localhost:5173",
            openRouterTitle = "Trip Planner",
            settingsJson = """{"openRouterApiKey":"secret-openrouter-key"}""",
            createdAt = "2026-05-17T00:00:00Z",
            updatedAt = "2026-05-17T00:00:00Z",
        )

        val json = objectMapper.writeValueAsString(workspace)

        assertFalse(json.contains("secret-openai-key"))
        assertFalse(json.contains("secret-openrouter-key"))
        assertFalse(json.contains("settingsJson"))
    }

    @Test
    fun `chat session response hides raw provider settings`() {
        val session = ChatSessionDto(
            id = "chat_test",
            tripId = "trip_test",
            title = "Test chat",
            provider = "openrouter",
            model = "openai/gpt-5.2",
            status = "active",
            settingsJson = """{"openRouterApiKey":"secret-openrouter-key"}""",
            createdAt = "2026-05-17T00:00:00Z",
            updatedAt = "2026-05-17T00:00:00Z",
        )

        val json = objectMapper.writeValueAsString(session)

        assertFalse(json.contains("secret-openrouter-key"))
        assertFalse(json.contains("settingsJson"))
    }
}
