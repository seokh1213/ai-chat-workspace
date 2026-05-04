package app.tripplanner.setup

import app.tripplanner.ai.AiChatRequest
import app.tripplanner.ai.CodexAppServerClient
import app.tripplanner.trip.TripDto
import app.tripplanner.trip.TripStateDto
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.springframework.stereotype.Service
import java.time.Duration
import java.util.UUID

@Service
class SetupAssistantService(
    private val codexClient: CodexAppServerClient,
) {
    private val objectMapper = jacksonObjectMapper()

    fun reply(request: SetupAssistantRequest): SetupAssistantResponse {
        val content = request.content.trim()
        require(content.isNotEmpty()) { "Message content must not be blank." }

        val result = replyWithCodex(request.copy(content = content))

        return SetupAssistantResponse(
            message = SetupAssistantMessageDto(
                role = "assistant",
                content = result.message,
            ),
            actions = result.actions,
        )
    }

    private fun replyWithCodex(request: SetupAssistantRequest): SetupAssistantResult {
        val result = codexClient.runTurn(
            request = request.toAiChatRequest(),
            prompt = setupPrompt(request),
            developerInstructions = setupDeveloperInstructions(),
            outputSchema = setupOutputSchema(),
            timeout = Duration.ofSeconds(60),
        )
        return parseResult(result.text)
            ?: throw IllegalStateException("AI setup assistant returned an invalid response.")
    }

    private fun setupDeveloperInstructions(): String =
        """
        You are a travel setup advisor for a trip planning app.
        Answer in Korean.
        Do not edit files, run shell commands, or ask for approvals.
        Give concrete planning recommendations first. Ask at most two follow-up questions only after giving useful defaults.
        Use the actions array as the hidden tool channel for UI updates.
        Never show raw JSON, XML, tool tags, or action payloads inside message.
        Return only JSON matching the provided schema.
        """.trimIndent()

    private fun setupPrompt(request: SetupAssistantRequest): String =
        """
        현재 여행 초안:
        ${objectMapper.writeValueAsString(request.draftTrip)}

        지금까지의 세팅 상담:
        ${objectMapper.writeValueAsString(request.messages.takeLast(10))}

        사용자 요청:
        ${request.content}

        해야 할 일:
        - 사용자가 추천을 물으면 먼저 구체적인 추천안을 제시하세요.
        - 날짜가 있으면 날짜 기준으로 1일차/2일차/3일차처럼 초안을 제안하세요.
        - 사용자가 목적지, 날짜, 여행 이름을 채워달라고 하거나 명확히 말하면 actions에 updateDraftTrip을 넣으세요.
        - 목적지가 명확하면 destinationLat/destinationLng에 대표 중심 좌표를 넣으세요. 예: 상하이 31.2304, 121.4737.
        - actions는 화면 왼쪽 폼을 바꾸는 숨김 도구 호출입니다. message에는 사용자가 읽을 자연어만 쓰세요.
        - updateDraftTrip에는 확실한 필드만 넣고, 모르는 필드는 null로 두세요.
        - startDate/endDate는 YYYY-MM-DD 형식만 쓰세요.
        - title은 목적지와 기간이 명확하면 자연스러운 여행 이름으로 제안하세요. 예: 상하이 4일 여행.
        - 오키나와라면 남부/나하, 중부, 북부/츄라우미, 해변 휴식 같은 권역 구성을 고려하세요.
        - 정보가 부족해도 합리적인 기본값을 가정하고 답하세요.
        - 같은 문장을 반복하지 마세요.
        """.trimIndent()

    private fun setupOutputSchema(): Map<String, Any?> =
        mapOf(
            "type" to "object",
            "additionalProperties" to false,
            "required" to listOf("message", "actions"),
            "properties" to mapOf(
                "message" to mapOf("type" to "string"),
                "actions" to mapOf(
                    "type" to "array",
                    "items" to mapOf(
                        "type" to "object",
                        "additionalProperties" to false,
                        "required" to listOf("type", "title", "destinationName", "destinationLat", "destinationLng", "startDate", "endDate", "reason"),
                        "properties" to mapOf(
                            "type" to mapOf("type" to "string", "enum" to listOf("updateDraftTrip")),
                            "title" to nullableString(),
                            "destinationName" to nullableString(),
                            "destinationLat" to nullableNumber(),
                            "destinationLng" to nullableNumber(),
                            "startDate" to nullableString(),
                            "endDate" to nullableString(),
                            "reason" to nullableString(),
                        ),
                    ),
                ),
            ),
        )

    private fun nullableString(): Map<String, Any> = mapOf("type" to listOf("string", "null"))

    private fun nullableNumber(): Map<String, Any> = mapOf("type" to listOf("number", "null"))

    private fun parseResult(text: String): SetupAssistantResult? =
        runCatching {
            val root = objectMapper.readTree(text)
            val message = root
                .path("message")
                .takeIf { node -> node.isTextual }
                ?.asText()
                ?.takeIf(String::isNotBlank)
                ?: return@runCatching null
            SetupAssistantResult(
                message = message,
                actions = root.path("actions").parseActions(),
            )
        }.getOrNull()

    private fun JsonNode.parseActions(): List<SetupAssistantActionDto> {
        if (!isArray) return emptyList()
        return mapNotNull { node ->
            if (node.path("type").asText() != "updateDraftTrip") {
                return@mapNotNull null
            }
            SetupAssistantActionDto(
                type = "updateDraftTrip",
                title = node.nullableText("title"),
                destinationName = node.nullableText("destinationName"),
                destinationLat = node.nullableDouble("destinationLat"),
                destinationLng = node.nullableDouble("destinationLng"),
                startDate = node.nullableText("startDate"),
                endDate = node.nullableText("endDate"),
                reason = node.nullableText("reason"),
            )
        }
    }

    private fun JsonNode.nullableText(fieldName: String): String? =
        path(fieldName)
            .takeIf { node -> node.isTextual }
            ?.asText()
            ?.trim()
            ?.takeIf(String::isNotBlank)

    private fun JsonNode.nullableDouble(fieldName: String): Double? =
        path(fieldName)
            .takeIf { node -> node.isNumber }
            ?.asDouble()

    private fun SetupAssistantRequest.toAiChatRequest(): AiChatRequest =
        AiChatRequest(
            runId = "setup_${UUID.randomUUID()}",
            tripId = "draft_trip",
            chatSessionId = "setup",
            content = content,
            tripState = TripStateDto(
                trip = TripDto(
                    id = "draft_trip",
                    workspaceId = "draft_workspace",
                    title = draftTrip.title?.takeIf { it.isNotBlank() } ?: "새 여행",
                    destinationName = draftTrip.destinationName?.takeIf { it.isNotBlank() },
                    destinationLat = draftTrip.destinationLat,
                    destinationLng = draftTrip.destinationLng,
                    startDate = draftTrip.startDate?.takeIf { it.isNotBlank() },
                    endDate = draftTrip.endDate?.takeIf { it.isNotBlank() },
                    timezone = draftTrip.timezone?.takeIf { it.isNotBlank() } ?: "Asia/Seoul",
                    createdAt = "",
                    updatedAt = "",
                ),
                days = emptyList(),
                places = emptyList(),
                itineraryItems = emptyList(),
                latestCheckpoint = null,
                checkpoints = emptyList(),
            ),
            model = null,
            effort = null,
            settingsJson = "{}",
            providerSession = null,
        )
}

private data class SetupAssistantResult(
    val message: String,
    val actions: List<SetupAssistantActionDto>,
)
