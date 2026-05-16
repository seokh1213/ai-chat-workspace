package app.tripplanner.chat

import app.tripplanner.trip.TripOperations
import app.tripplanner.trip.hasCoordinateFields
import app.tripplanner.trip.listSize
import app.tripplanner.trip.mapOrNull
import app.tripplanner.trip.operationName
import app.tripplanner.trip.readTripOperations
import app.tripplanner.trip.stringOrNull
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper

private val chatRunObjectMapper = jacksonObjectMapper()

internal fun AiEditRunDto.toSummary(): AiEditRunSummaryDto =
    AiEditRunSummaryDto(
        id = id,
        tripId = tripId,
        chatSessionId = chatSessionId,
        providerSessionId = providerSessionId,
        provider = provider,
        model = model,
        providerRunId = providerRunId,
        userMessageId = userMessageId,
        assistantMessageId = assistantMessageId,
        status = status,
        error = error,
        checkpointId = checkpointId,
        operationCount = operationCount(operationsJson),
        operationPreview = operationPreview(operationsJson),
        durationMs = durationMs,
        createdAt = createdAt,
    )

internal fun chatRunEvent(
    runId: String,
    session: ChatSessionDto,
    status: String,
    operationCount: Int,
    operationPreview: List<String> = emptyList(),
    message: String?,
    createdAt: String,
): ChatRunEventDto =
    ChatRunEventDto(
        runId = runId,
        status = status,
        provider = session.provider,
        model = session.model,
        operationCount = operationCount,
        operationPreview = operationPreview,
        message = message,
        createdAt = createdAt,
    )

internal fun chatEditRun(
    id: String,
    session: ChatSessionDto,
    userMessageId: String,
    assistantMessageId: String,
    operationsJson: String,
    status: String,
    error: String?,
    checkpointId: String?,
    providerSessionId: String?,
    providerRunId: String?,
    durationMs: Long?,
    createdAt: String,
): AiEditRunDto =
    AiEditRunDto(
        id = id,
        tripId = session.tripId,
        chatSessionId = session.id,
        providerSessionId = providerSessionId,
        provider = session.provider,
        model = session.model,
        providerRunId = providerRunId,
        userMessageId = userMessageId,
        assistantMessageId = assistantMessageId,
        operationsJson = operationsJson,
        status = status,
        error = error,
        checkpointId = checkpointId,
        durationMs = durationMs,
        createdAt = createdAt,
    )

private fun operationCount(operationsJson: String): Int =
    runCatching {
        chatRunObjectMapper.readTripOperations(operationsJson).size
    }.getOrDefault(0)

internal fun operationPreview(operations: TripOperations): List<String> =
    operations.mapNotNull { operation ->
        val op = operation.operationName()
        when (op) {
            "set_chat_title" -> {
                val title = operation.stringOrNull("title") ?: "새 대화 제목"
                "대화 제목을 '${title}'로 변경"
            }
            "upsert_place" -> {
                val place = operation.mapOrNull("place") ?: operation
                val title = place.stringOrNull("name") ?: "새 조사장소"
                val coordinateText = if (place.hasCoordinateFields()) "좌표 포함" else "좌표 없음"
                "조사장소 '${title}' 추가 · ${coordinateText}"
            }
            "add_item" -> {
                val day = operation["day"]?.toString()
                val item = operation.mapOrNull("item")
                val place = item?.mapOrNull("place")
                val title = item?.stringOrNull("title") ?: place?.stringOrNull("name") ?: "새 일정"
                val coordinateText = if (item.hasCoordinateFields() || place.hasCoordinateFields()) "좌표 포함" else "좌표 없음"
                "Day ${day ?: "?"}에 '${title}' 추가 · ${coordinateText}"
            }
            "update_item" -> "'${operation["itemId"] ?: "일정"}' 내용 수정"
            "move_item" -> "'${operation["itemId"] ?: "일정"}'을 Day ${operation["toDay"] ?: "?"}로 이동"
            "delete_item" -> "'${operation["itemId"] ?: "일정"}' 삭제"
            "reorder_day" -> "Day ${operation["day"] ?: "?"} 일정 순서 변경"
            "replace_day_plan" -> {
                val count = operation.listSize("items")
                "Day ${operation["day"] ?: "?"} 일정 ${count}개로 교체"
            }
            else -> null
        }
    }

private fun operationPreview(operationsJson: String): List<String> =
    runCatching {
        operationPreview(chatRunObjectMapper.readTripOperations(operationsJson))
    }.getOrDefault(emptyList())
