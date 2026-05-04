package app.tripplanner.ai

import app.tripplanner.trip.TripStateDto
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import org.springframework.stereotype.Component

@Component
class LocalRuleAiProvider : AiProvider {
    override val id: String = "local-rule"
    override val displayName: String = "Local"
    override val userVisible: Boolean = false

    override fun streamChat(request: AiChatRequest): Flow<AiStreamEvent> = flow {
        emit(AiStreamEvent.RunStarted)
        val result = planLocalOperations(request.tripState, request.content)
        emit(AiStreamEvent.MessageDelta(result.message))
        if (result.operations.isNotEmpty()) {
            emit(AiStreamEvent.OperationsProposed(result.operations))
        }
        emit(AiStreamEvent.MessageCompleted(result.message))
        emit(AiStreamEvent.RunCompleted)
    }

    private fun planLocalOperations(state: TripStateDto, content: String): AiProviderResult {
        val dayNumber = dayPattern.find(content)
            ?.groupValues
            ?.drop(1)
            ?.firstOrNull { it.isNotBlank() }
            ?.toIntOrNull()
            ?: state.days.firstOrNull()?.dayNumber
        val matchedPlace = state.places.firstOrNull { content.contains(it.name, ignoreCase = true) }

        if (content.contains("삭제")) {
            val item = state.itineraryItems.firstOrNull { content.contains(it.title, ignoreCase = true) }
            return if (item == null) {
                AiProviderResult(message = "삭제할 일정 항목을 찾지 못했습니다.", operations = emptyList())
            } else {
                AiProviderResult(
                    message = "'${item.title}' 일정을 삭제합니다.",
                    operations = listOf(mapOf("op" to "delete_item", "itemId" to item.id)),
                )
            }
        }

        if (content.contains("추가") || content.contains("넣어")) {
            val targetDay = dayNumber ?: 1
            val title = matchedPlace?.name ?: extractAddTitle(content)
            if (title.isBlank()) {
                return AiProviderResult(message = "추가할 일정 이름을 찾지 못했습니다.", operations = emptyList())
            }

            val item = mutableMapOf<String, Any?>(
                "type" to if (matchedPlace == null) "custom" else "poi",
                "title" to title,
                "category" to matchedPlace?.category,
                "memo" to matchedPlace?.note,
                "lat" to matchedPlace?.lat,
                "lng" to matchedPlace?.lng,
                "placeId" to matchedPlace?.id,
            ).filterValues { it != null }

            return AiProviderResult(
                message = "Day ${targetDay}에 '${title}' 일정을 추가합니다.",
                operations = listOf(
                    mapOf(
                        "op" to "add_item",
                        "day" to targetDay,
                        "item" to item,
                    ),
                ),
            )
        }

        return AiProviderResult(
            message = "요청을 읽었습니다. 지금은 일정 추가/삭제처럼 검증 가능한 변경을 먼저 적용합니다.",
            operations = emptyList(),
        )
    }

    private fun extractAddTitle(content: String): String =
        content
            .replace(dayPattern, "")
            .replace("추가해줘", "")
            .replace("추가", "")
            .replace("넣어줘", "")
            .replace("넣어", "")
            .replace("일정", "")
            .replace("에", " ")
            .replace("을", " ")
            .replace("를", " ")
            .trim()
            .ifBlank { "새 일정" }

    private companion object {
        val dayPattern = Regex("(?i)day\\s*(\\d+)|(?:^|\\s)(\\d+)일차")
    }
}
