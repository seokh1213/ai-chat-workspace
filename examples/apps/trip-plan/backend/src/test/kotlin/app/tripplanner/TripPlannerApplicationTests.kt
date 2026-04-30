package app.tripplanner

import app.tripplanner.chat.ChatService
import app.tripplanner.chat.CreateChatMessageRequest
import app.tripplanner.chat.CreateChatSessionRequest
import app.tripplanner.chat.ImportChatMessageDto
import app.tripplanner.chat.ImportSetupChatSessionRequest
import app.tripplanner.trip.ApplyOperationsRequest
import app.tripplanner.trip.CreateTripRequest
import app.tripplanner.trip.TripService
import app.tripplanner.trip.UpdateTripRequest
import app.tripplanner.trip.UpsertItineraryItemRequest
import app.tripplanner.workspace.WorkspaceRepository
import app.tripplanner.workspace.WorkspaceService
import app.tripplanner.workspace.UpdateWorkspaceRequest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles

@SpringBootTest(
    properties = [
        "spring.datasource.url=jdbc:sqlite:file:trip_planner_test?mode=memory&cache=shared",
        "app.ai.codex-app-server.managed=false",
    ],
)
@ActiveProfiles("dev")
class TripPlannerApplicationTests {
    @Autowired
    private lateinit var workspaceRepository: WorkspaceRepository

    @Autowired
    private lateinit var workspaceService: WorkspaceService

    @Autowired
    private lateinit var tripService: TripService

    @Autowired
    private lateinit var chatService: ChatService

    @Test
    fun `context loads`() {
        assertTrue(true)
    }

    @Test
    fun `seeded default workspace is available`() {
        val workspaces = workspaceRepository.findAll()

        assertTrue(
            workspaces.any { it.id == "workspace_default" && it.name == "Default workspace" },
            "default workspace should be seeded",
        )
    }

    @Test
    fun `workspace ai settings update existing and new chat sessions`() {
        val trip = tripService.createTrip(
            workspaceId = "workspace_default",
            request = CreateTripRequest(title = "워크스페이스 설정 테스트"),
        )
        val existingSession = chatService.createSession(
            tripId = trip.id,
            request = CreateChatSessionRequest(title = "기존 세션"),
        )

        workspaceService.update(
            workspaceId = "workspace_default",
            request = UpdateWorkspaceRequest(
                name = "Default workspace",
                aiProvider = "openrouter",
                aiModel = "openai/gpt-5.2",
                aiEffort = "low",
                openRouterApiKey = "test-openrouter-key",
                openRouterReferer = "http://localhost:5173",
                openRouterTitle = "Trip Planner Test",
            ),
        )

        val updatedExistingSession = chatService.detail(existingSession.id).session
        assertEquals("openrouter", updatedExistingSession.provider)
        assertEquals("openai/gpt-5.2", updatedExistingSession.model)
        assertTrue(updatedExistingSession.settingsJson.contains("low"))
        assertTrue(updatedExistingSession.settingsJson.contains("test-openrouter-key"))

        val newSession = chatService.createSession(
            tripId = trip.id,
            request = CreateChatSessionRequest(title = "새 세션"),
        )
        assertEquals("openrouter", newSession.provider)
        assertEquals("openai/gpt-5.2", newSession.model)
        assertTrue(newSession.settingsJson.contains("low"))
        assertTrue(newSession.settingsJson.contains("Trip Planner Test"))
    }

    @Test
    fun `trip setup creates days and editable items`() {
        val trip = tripService.createTrip(
            workspaceId = "workspace_default",
            request = CreateTripRequest(
                title = "테스트 여행",
                destinationName = "Tokyo",
                startDate = "2026-05-01",
                endDate = "2026-05-03",
                timezone = "Asia/Tokyo",
            ),
        )

        val state = tripService.state(trip.id)
        assertEquals(3, state.days.size)

        val item = tripService.addItem(
            dayId = state.days.first().id,
            request = UpsertItineraryItemRequest(
                title = "공항 도착",
                type = "transport",
                timeText = "10:00",
            ),
        )

        assertEquals("공항 도착", item.title)
        assertEquals(1, tripService.state(trip.id).itineraryItems.size)
        assertEquals(1, tripService.state(trip.id).checkpoints.size)
    }

    @Test
    fun `checkpoint rollback restores previous itinerary state`() {
        val trip = tripService.createTrip(
            workspaceId = "workspace_default",
            request = CreateTripRequest(title = "롤백 테스트 여행"),
        )
        val day = tripService.state(trip.id).days.first()

        tripService.addItem(
            dayId = day.id,
            request = UpsertItineraryItemRequest(title = "되돌릴 일정"),
        )

        val checkpoint = tripService.state(trip.id).checkpoints.first()
        val rolledBack = tripService.rollbackCheckpoint(checkpoint.id)

        assertEquals(0, rolledBack.itineraryItems.size)
        assertTrue(rolledBack.checkpoints.any { it.source == "rollback" })
    }

    @Test
    fun `trip date shrink does not silently delete itinerary items`() {
        val trip = tripService.createTrip(
            workspaceId = "workspace_default",
            request = CreateTripRequest(
                title = "날짜 축소 테스트",
                startDate = "2026-05-01",
                endDate = "2026-05-03",
            ),
        )
        val state = tripService.state(trip.id)
        tripService.addItem(
            dayId = state.days.last().id,
            request = UpsertItineraryItemRequest(title = "마지막 날 일정"),
        )

        assertThrows(IllegalArgumentException::class.java) {
            tripService.updateTrip(
                tripId = trip.id,
                request = UpdateTripRequest(
                    title = trip.title,
                    destinationName = trip.destinationName,
                    startDate = "2026-05-01",
                    endDate = "2026-05-02",
                ),
            )
        }
        assertEquals(3, tripService.state(trip.id).days.size)
        assertEquals(1, tripService.state(trip.id).itineraryItems.size)
    }

    @Test
    fun `chat session stores setup conversation`() {
        val trip = tripService.createTrip(
            workspaceId = "workspace_default",
            request = CreateTripRequest(title = "상담 테스트 여행"),
        )
        val session = chatService.createSession(
            tripId = trip.id,
            request = CreateChatSessionRequest(
                title = "초기 세팅",
                provider = "local-rule",
            ),
        )

        val run = chatService.addMessage(
            sessionId = session.id,
            request = CreateChatMessageRequest("아이와 함께 가는 일정으로 잡아줘"),
        )

        assertEquals("user", run.userMessage.role)
        eventually {
            val detail = chatService.detail(session.id)
            assertNotNull(detail.messages.find { it.role == "assistant" })
        }
    }

    @Test
    fun `chat message can apply local itinerary operation`() {
        val trip = tripService.createTrip(
            workspaceId = "workspace_default",
            request = CreateTripRequest(title = "AI 적용 테스트 여행"),
        )
        val session = chatService.createSession(
            tripId = trip.id,
            request = CreateChatSessionRequest(
                title = "AI 대화",
                provider = "local-rule",
            ),
        )

        val run = chatService.addMessage(
            sessionId = session.id,
            request = CreateChatMessageRequest("Day 1에 수영장 추가해줘"),
        )

        eventually {
            val state = tripService.state(trip.id)
            assertEquals(1, state.itineraryItems.size)
            assertEquals("수영장", state.itineraryItems.single().title)
            assertNotNull(state.latestCheckpoint)
            assertTrue(chatService.detail(session.id).editRuns.any { it.id == run.runId && it.status == "applied" })
        }
    }

    @Test
    fun `setup conversation can be imported as chat session`() {
        val trip = tripService.createTrip(
            workspaceId = "workspace_default",
            request = CreateTripRequest(title = "상담 이어가기 테스트"),
        )

        val detail = chatService.importSetupSession(
            tripId = trip.id,
            request = ImportSetupChatSessionRequest(
                title = "초안 설계",
                messages = listOf(
                    ImportChatMessageDto(role = "assistant", content = "목적지와 날짜를 알려주세요."),
                    ImportChatMessageDto(role = "user", content = "상하이 4일 여행으로 채워줘."),
                    ImportChatMessageDto(role = "assistant", content = "폼에 반영했습니다.", appliedActions = listOf("목적지")),
                ),
            ),
        )

        assertEquals("초안 설계", detail.session.title)
        assertEquals(3, detail.messages.size)
        assertEquals("user", detail.messages[1].role)
    }

    @Test
    fun `ai add item operation stores place and coordinates`() {
        val trip = tripService.createTrip(
            workspaceId = "workspace_default",
            request = CreateTripRequest(title = "장소 핀 테스트"),
        )

        val response = tripService.applyOperations(
            tripId = trip.id,
            request = ApplyOperationsRequest(
                source = "ai",
                operations = listOf(
                    mapOf(
                        "op" to "add_item",
                        "day" to 1,
                        "item" to mapOf(
                            "title" to "와이탄",
                            "type" to "poi",
                            "category" to "sight",
                            "lat" to 31.2403,
                            "lng" to 121.4903,
                            "place" to mapOf(
                                "name" to "와이탄",
                                "category" to "sight",
                                "address" to "Zhongshan East 1st Rd, Shanghai",
                                "note" to "황푸강 야경 명소",
                                "lat" to 31.2403,
                                "lng" to 121.4903,
                                "source" to "ai",
                            ),
                        ),
                    ),
                ),
            ),
        )

        assertEquals(1, response.state.places.size)
        assertEquals("와이탄", response.state.places.single().name)
        assertEquals(response.state.places.single().id, response.state.itineraryItems.single().placeId)
        assertEquals(31.2403, response.state.itineraryItems.single().lat)
    }

    @Test
    fun `ai add item with coordinates creates implicit place`() {
        val trip = tripService.createTrip(
            workspaceId = "workspace_default",
            request = CreateTripRequest(title = "암묵 장소 핀 테스트"),
        )

        val response = tripService.applyOperations(
            tripId = trip.id,
            request = ApplyOperationsRequest(
                source = "ai",
                operations = listOf(
                    mapOf(
                        "op" to "add_item",
                        "day" to 1,
                        "item" to mapOf(
                            "title" to "난징동루",
                            "type" to "poi",
                            "category" to "shopping",
                            "lat" to 31.2355,
                            "lng" to 121.4749,
                        ),
                    ),
                ),
            ),
        )

        assertEquals(1, response.state.places.size)
        assertEquals("난징동루", response.state.places.single().name)
        assertEquals(response.state.places.single().id, response.state.itineraryItems.single().placeId)
    }

    @Test
    fun `ai add item reuses existing place for duplicate coordinates`() {
        val trip = tripService.createTrip(
            workspaceId = "workspace_default",
            request = CreateTripRequest(title = "중복 장소 테스트"),
        )

        tripService.applyOperations(
            tripId = trip.id,
            request = ApplyOperationsRequest(
                source = "ai",
                operations = listOf(
                    mapOf(
                        "op" to "add_item",
                        "day" to 1,
                        "item" to mapOf(
                            "title" to "푸동국제공항 도착",
                            "type" to "transport",
                            "category" to "transport",
                            "lat" to 31.1443,
                            "lng" to 121.8083,
                        ),
                    ),
                    mapOf(
                        "op" to "add_item",
                        "day" to 1,
                        "item" to mapOf(
                            "title" to "푸동국제공항 출발",
                            "type" to "transport",
                            "category" to "transport",
                            "lat" to 31.14431,
                            "lng" to 121.80831,
                        ),
                    ),
                ),
            ),
        )

        val state = tripService.state(trip.id)
        assertEquals(1, state.places.size)
        assertEquals(state.places.single().id, state.itineraryItems[0].placeId)
        assertEquals(state.places.single().id, state.itineraryItems[1].placeId)
    }

    private fun eventually(timeoutMs: Long = 3_000, assertion: () -> Unit) {
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
}
