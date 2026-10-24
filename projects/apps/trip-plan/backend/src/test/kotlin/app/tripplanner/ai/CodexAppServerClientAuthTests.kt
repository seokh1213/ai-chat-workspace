package app.tripplanner.ai

import app.tripplanner.trip.TripDto
import app.tripplanner.trip.TripStateDto
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import java.nio.file.Files
import java.nio.file.Path
import java.time.Duration

class CodexAppServerClientAuthTests {
    @TempDir
    lateinit var tempDir: Path

    @Test
    fun `turn connection sends the capability token from the token file`() {
        FakeCodexAppServer(requiredToken = "test-token-1").use { server ->
            val client = client(server, tokenFile = writeToken("test-token-1\n"))

            val result = client.runTestTurn()

            assertEquals(FakeCodexReply, result.text)
            assertEquals(listOf("Bearer test-token-1"), server.authorizationHeaders)
        }
    }

    @Test
    fun `interrupt connection sends the capability token from the token file`() {
        FakeCodexAppServer(requiredToken = "test-token-1").use { server ->
            val turnRegistry = CodexAppServerTurnRegistry()
            turnRegistry.register(runId = "run-1", threadId = "thread-1", turnId = "turn-1")
            val client = CodexAppServerClient(properties(server, writeToken("test-token-1")), turnRegistry)

            assertTrue(client.interruptTurn("run-1"))

            assertEquals(listOf("initialize", "turn/interrupt"), server.methods)
            assertEquals(listOf("Bearer test-token-1"), server.authorizationHeaders)
        }
    }

    @Test
    fun `connects without authorization when no token file is configured`() {
        FakeCodexAppServer(requiredToken = null).use { server ->
            val result = client(server, tokenFile = null).runTestTurn()

            assertEquals(FakeCodexReply, result.text)
            assertEquals(listOf<String?>(null), server.authorizationHeaders)
        }
    }

    @Test
    fun `rejected handshake reports the status without the token`() {
        FakeCodexAppServer(requiredToken = "expected-token").use { server ->
            val client = client(server, tokenFile = writeToken("wrong-token"))

            val error = assertThrows(IllegalStateException::class.java) { client.runTestTurn() }

            assertTrue(error.message.orEmpty().contains("HTTP 401"))
            assertFalse(error.stackTraceToString().contains("wrong-token"))
            assertEquals(emptyList<String>(), server.methods)
        }
    }

    private fun writeToken(content: String): String =
        Files.writeString(tempDir.resolve("token"), content).toString()

    private fun client(server: FakeCodexAppServer, tokenFile: String?): CodexAppServerClient =
        CodexAppServerClient(properties(server, tokenFile), CodexAppServerTurnRegistry())

    private fun properties(server: FakeCodexAppServer, tokenFile: String?): CodexAppServerProperties =
        CodexAppServerProperties(url = server.url, tokenFile = tokenFile)

    private fun CodexAppServerClient.runTestTurn(): CodexTurnResult =
        runTurn(
            request = chatRequest(),
            prompt = "hello",
            developerInstructions = "answer briefly",
            timeout = Duration.ofSeconds(5),
        )

    private fun chatRequest(): AiChatRequest =
        AiChatRequest(
            runId = "run-1",
            tripId = "trip-1",
            chatSessionId = "chat-1",
            content = "hello",
            tripState = TripStateDto(
                trip = TripDto(
                    id = "trip-1",
                    workspaceId = "workspace-1",
                    title = "Test trip",
                    destinationName = null,
                    destinationLat = null,
                    destinationLng = null,
                    startDate = null,
                    endDate = null,
                    timezone = null,
                    createdAt = "2026-10-24T00:00:00Z",
                    updatedAt = "2026-10-24T00:00:00Z",
                ),
                days = emptyList(),
                places = emptyList(),
                itineraryItems = emptyList(),
                latestCheckpoint = null,
            ),
            model = null,
            effort = null,
            settingsJson = "{}",
            providerSession = null,
        )
}
