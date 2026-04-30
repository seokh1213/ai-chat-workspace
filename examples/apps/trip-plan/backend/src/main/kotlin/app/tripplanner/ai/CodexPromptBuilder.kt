package app.tripplanner.ai

import app.tripplanner.trip.TripStateDto
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.springframework.stereotype.Component

@Component
class CodexPromptBuilder {
    private val objectMapper = jacksonObjectMapper()

    fun developerInstructions(): String =
        """
        You are the itinerary editing engine for a travel planner.
        Do not edit files, run shell commands, or ask the user for approval.
        Read the trip context and user request, then return only JSON matching the requested schema.
        The backend validates and applies operations. If a requested change is ambiguous, return no operations and explain what is missing in "message".
        """.trimIndent()

    fun codexDeveloperInstructions(): String =
        """
        You are the itinerary editing engine for a travel planner.
        Do not edit files, run shell commands, or ask the user for approval.
        Do not emit separate progress/commentary text. Put only the final user-facing answer in Korean Markdown.
        Use Korean only, except unavoidable official place names, URLs, and code identifiers.
        If sources are listed, title the section exactly "출처:".
        If the trip should be edited, append exactly one hidden tool block at the end of the answer.
        The hidden tool block must be raw JSON inside <tool>...</tool>, and must not be described to the user.
        The backend validates and applies operations. If a requested change is ambiguous, omit the tool block and explain what is missing.
        """.trimIndent()

    fun buildStreamingTurnPrompt(request: AiChatRequest): String =
        """
        여행 계획 전체 컨텍스트:
        ${objectMapper.writeValueAsString(request.tripState.toPromptContext())}

        최근 대화:
        ${objectMapper.writeValueAsString(request.priorMessages.takeLast(12))}

        사용자 요청:
        ${request.content}

        먼저 사용자에게 보이는 한국어 Markdown 답변을 바로 작성하세요.
        - 긴 한 문단으로 쓰지 말고, 핵심 요약 1문장 뒤에 bullet list 또는 번호 목록을 사용하세요.
        - 목록은 반드시 "- 항목" 또는 "1. 항목" Markdown 문법으로 작성하고, 4칸 들여쓰기만으로 목록처럼 보이게 쓰지 마세요.
        - 일정/추천/주의사항은 줄을 나눠 읽기 쉽게 작성하세요.
        - 한국어만 사용하세요. "Sources", "参考", " स्रोत" 같은 외국어 출처 라벨을 쓰지 말고, 필요하면 "출처:"라고 쓰세요.
        - 내부 처리용 XML, JSON, tool block을 사용자 답변에 설명하지 마세요.

        여행 데이터를 수정해야 한다면 사용자 답변을 마친 뒤 맨 마지막에만 아래 형식의 숨김 블록을 붙이세요.
        Markdown code fence를 쓰지 마세요. 수정이 없으면 <tool> 블록을 생략하세요.

        <tool>
        {"operations":[{"op":"upsert_place","place":{"name":"장소명","category":"sight","address":"선택","note":"추천 이유","lat":31.2304,"lng":121.4737,"source":"ai","sourceUrl":null}}]}
        </tool>

        지원 operations:
        - set_chat_title: {"op":"set_chat_title","title":"상하이 4일 초안"}
        - upsert_place: {"op":"upsert_place","place":{"name":"장소명","category":"sight","address":"선택","note":"추천 이유","lat":31.2304,"lng":121.4737,"source":"ai","sourceUrl":"선택"}}
        - add_item: {"op":"add_item","day":1,"item":{...}}
        - update_item: {"op":"update_item","itemId":"item_x","patch":{...}}
        - move_item: {"op":"move_item","itemId":"item_x","toDay":2,"toIndex":1}
        - delete_item: {"op":"delete_item","itemId":"item_x"}
        - reorder_day: {"op":"reorder_day","day":1,"itemIds":["item_a","item_b"]}
        - replace_day_plan: {"op":"replace_day_plan","day":1,"items":[{...}]}

        규칙:
        - 최근 대화가 비어 있으면 사용자의 요청 목적을 12~24자 한국어 제목으로 요약해 set_chat_title operation을 포함하세요.
        - set_chat_title의 title은 사용자가 나중에 대화 목록에서 알아보기 좋은 짧은 명사형으로 작성하세요.
        - itemId, placeId는 컨텍스트에 있는 실제 id만 사용하세요.
        - 사용자가 "현재 일정에 없는 좋은 장소", "추가 후보", "추천 장소", "조사할 장소"를 물으면, 후보를 말로만 추천하지 말고 각 후보를 upsert_place operations로 조사장소에 등록하세요.
        - 사용자가 일정에 끼워 넣어 달라고 명시하지 않은 후보 추천은 add_item을 만들지 말고 upsert_place만 사용하세요.
        - upsert_place의 place에는 name, category, address, note, lat, lng, source, sourceUrl을 채우세요. 웹/공식 자료를 확인했다면 sourceUrl도 넣으세요.
        - 사용자가 물리적인 장소, 식당, 카페, 호텔, 교통 거점을 새 일정으로 추가하거나 하루 일정을 새로 짤 때는 각 item에 item.place를 반드시 넣으세요.
        - 장소 스키마는 name, category, address, note, lat, lng, source, sourceUrl 입니다.
        - 지도 핀이 필요하므로 유명 장소는 WGS84 십진수 lat/lng를 포함하세요. item.lat/lng도 place.lat/lng와 같은 값으로 채우세요.
        - 사용자 화면 언어는 한국어입니다. message, item.title, item.memo, place.name, place.note는 한국어로 작성하세요.
        - 장소명은 한국어 통용명을 우선 쓰고, 지도 검색에 필요한 영문/현지 공식명은 address 또는 note에 보조로 넣으세요.
        - place.name은 물리 장소명만 쓰세요. "도착", "출발", "이동", "짐 보관" 같은 행동은 item.title 또는 memo에만 넣으세요.
        - 이미 places 컨텍스트에 같은 장소가 있으면 새 place를 만들지 말고 기존 placeId를 사용하세요.
        - category는 sight, restaurant, cafe, hotel, transport, shopping, activity, other 중 하나를 우선 사용하세요.
        - 좌표를 확신할 수 없으면 operations를 빈 배열로 두고 어떤 장소 좌표가 필요한지 사용자 답변에 설명하세요.
        - 확신이 없으면 operations를 빈 배열로 두세요.
        """.trimIndent()

    fun buildTurnPrompt(request: AiChatRequest): String =
        """
        여행 계획 전체 컨텍스트:
        ${objectMapper.writeValueAsString(request.tripState.toPromptContext())}

        최근 대화:
        ${objectMapper.writeValueAsString(request.priorMessages.takeLast(12))}

        사용자 요청:
        ${request.content}

        응답은 반드시 JSON 객체 하나만 반환하세요. Markdown code fence를 쓰지 마세요.
        message 필드는 사용자에게 그대로 보이는 한국어 Markdown입니다.
        - 긴 한 문단으로 쓰지 말고, 핵심 요약 1문장 뒤에 bullet list 또는 번호 목록을 사용하세요.
        - 목록은 반드시 "- 항목" 또는 "1. 항목" Markdown 문법으로 작성하고, 4칸 들여쓰기만으로 목록처럼 보이게 쓰지 마세요.
        - 일정/추천/주의사항은 줄을 나눠 읽기 쉽게 작성하세요.
        - 한국어만 사용하세요. "Sources", "参考", " स्रोत" 같은 외국어 출처 라벨을 쓰지 말고, 필요하면 "출처:"라고 쓰세요.
        - JSON, XML, tool block 같은 내부 처리용 표기는 message에 노출하지 마세요. 실제 변경은 operations에만 넣으세요.

        JSON shape:
        {
          "message": "사용자에게 보여줄 한국어 응답",
          "operations": [
            {
              "op": "add_item",
              "day": 1,
              "item": {
                "title": "일정 제목",
                "type": "custom|poi|meal|transport",
                "category": "선택",
                "timeText": "선택",
                "durationMinutes": 60,
                "memo": "선택",
                "lat": 26.0,
                "lng": 127.0,
                "placeId": "선택",
                "place": {
                  "name": "장소명",
                  "category": "sight|restaurant|cafe|hotel|transport|shopping|activity|other",
                  "address": "선택",
                  "note": "선택",
                  "lat": 31.2304,
                  "lng": 121.4737,
                  "source": "ai",
                  "sourceUrl": "선택"
                }
              }
            }
          ]
        }

        지원 operations:
        - set_chat_title: {"op":"set_chat_title","title":"상하이 4일 초안"}
        - upsert_place: {"op":"upsert_place","place":{"name":"장소명","category":"sight","address":"선택","note":"추천 이유","lat":31.2304,"lng":121.4737,"source":"ai","sourceUrl":"선택"}}
        - add_item: {"op":"add_item","day":1,"item":{...}}
        - update_item: {"op":"update_item","itemId":"item_x","patch":{...}}
        - move_item: {"op":"move_item","itemId":"item_x","toDay":2,"toIndex":1}
        - delete_item: {"op":"delete_item","itemId":"item_x"}
        - reorder_day: {"op":"reorder_day","day":1,"itemIds":["item_a","item_b"]}
        - replace_day_plan: {"op":"replace_day_plan","day":1,"items":[{...}]}

        규칙:
        - 최근 대화가 비어 있으면 사용자의 요청 목적을 12~24자 한국어 제목으로 요약해 set_chat_title operation을 포함하세요.
        - set_chat_title의 title은 사용자가 나중에 대화 목록에서 알아보기 좋은 짧은 명사형으로 작성하세요.
        - itemId, placeId는 컨텍스트에 있는 실제 id만 사용하세요.
        - 사용자가 "현재 일정에 없는 좋은 장소", "추가 후보", "추천 장소", "조사할 장소"를 물으면, 후보를 말로만 추천하지 말고 각 후보를 upsert_place operations로 조사장소에 등록하세요.
        - 사용자가 일정에 끼워 넣어 달라고 명시하지 않은 후보 추천은 add_item을 만들지 말고 upsert_place만 사용하세요.
        - upsert_place의 place에는 name, category, address, note, lat, lng, source, sourceUrl을 채우세요. 웹/공식 자료를 확인했다면 sourceUrl도 넣으세요.
        - 사용자가 물리적인 장소, 식당, 카페, 호텔, 교통 거점을 새 일정으로 추가하거나 하루 일정을 새로 짤 때는 각 item에 item.place를 반드시 넣으세요.
        - 장소 스키마는 name, category, address, note, lat, lng, source, sourceUrl 입니다.
        - 지도 핀이 필요하므로 유명 장소는 WGS84 십진수 lat/lng를 포함하세요. item.lat/lng도 place.lat/lng와 같은 값으로 채우세요.
        - 사용자 화면 언어는 한국어입니다. message, item.title, item.memo, place.name, place.note는 한국어로 작성하세요.
        - 장소명은 한국어 통용명을 우선 쓰고, 지도 검색에 필요한 영문/현지 공식명은 address 또는 note에 보조로 넣으세요.
        - place.name은 물리 장소명만 쓰세요. "도착", "출발", "이동", "짐 보관" 같은 행동은 item.title 또는 memo에만 넣으세요.
        - 이미 places 컨텍스트에 같은 장소가 있으면 새 place를 만들지 말고 기존 placeId를 사용하세요.
        - category는 sight, restaurant, cafe, hotel, transport, shopping, activity, other 중 하나를 우선 사용하세요.
        - 좌표를 확신할 수 없으면 operations를 빈 배열로 두고 어떤 장소 좌표가 필요한지 message에 설명하세요.
        - 확신이 없으면 operations를 빈 배열로 두세요.
        """.trimIndent()

    fun outputSchema(): Map<String, Any?> =
        mapOf(
            "type" to "object",
            "additionalProperties" to false,
            "required" to listOf("message", "operations"),
            "properties" to mapOf(
                "message" to mapOf("type" to "string"),
                "operations" to mapOf(
                    "type" to "array",
                    "items" to operationSchema(),
                ),
            ),
        )

    private fun operationSchema(): Map<String, Any?> =
        mapOf(
            "type" to "object",
            "additionalProperties" to false,
            "required" to listOf(
                "op",
                "day",
                "place",
                "item",
                "itemId",
                "patch",
                "toDay",
                "toIndex",
                "itemIds",
                "items",
                "unlock",
                "title",
            ),
            "properties" to mapOf(
                "op" to mapOf(
                    "type" to "string",
                    "enum" to listOf(
                        "set_chat_title",
                        "upsert_place",
                        "add_item",
                        "update_item",
                        "move_item",
                        "delete_item",
                        "reorder_day",
                        "replace_day_plan",
                    ),
                ),
                "day" to nullable("integer"),
                "place" to nullableObject(placeSchema()),
                "item" to nullableObject(itemSchema()),
                "itemId" to nullable("string"),
                "patch" to nullableObject(itemPatchSchema()),
                "toDay" to nullable("integer"),
                "toIndex" to nullable("integer"),
                "itemIds" to nullableArray(mapOf("type" to "string")),
                "items" to nullableArray(itemSchema()),
                "unlock" to nullable("boolean"),
                "title" to nullable("string"),
            ),
        )

    private fun itemSchema(): Map<String, Any?> =
        mapOf(
            "type" to "object",
            "additionalProperties" to false,
            "required" to listOf(
                "title",
                "type",
                "category",
                "timeText",
                "durationMinutes",
                "memo",
                "lat",
                "lng",
                "placeId",
                "place",
            ),
            "properties" to mapOf(
                "title" to nullable("string"),
                "type" to nullable("string"),
                "category" to nullable("string"),
                "timeText" to nullable("string"),
                "durationMinutes" to nullable("integer"),
                "memo" to nullable("string"),
                "lat" to nullable("number"),
                "lng" to nullable("number"),
                "placeId" to nullable("string"),
                "place" to nullableObject(placeSchema()),
            ),
        )

    private fun placeSchema(): Map<String, Any?> =
        mapOf(
            "type" to "object",
            "additionalProperties" to false,
            "required" to listOf("name", "category", "address", "note", "lat", "lng", "source", "sourceUrl"),
            "properties" to mapOf(
                "name" to nullable("string"),
                "category" to nullable("string"),
                "address" to nullable("string"),
                "note" to nullable("string"),
                "lat" to nullable("number"),
                "lng" to nullable("number"),
                "source" to nullable("string"),
                "sourceUrl" to nullable("string"),
            ),
        )

    private fun itemPatchSchema(): Map<String, Any?> =
        mapOf(
            "type" to "object",
            "additionalProperties" to false,
            "required" to listOf("title", "type", "category", "timeText", "durationMinutes", "memo", "lat", "lng"),
            "properties" to mapOf(
                "title" to nullable("string"),
                "type" to nullable("string"),
                "category" to nullable("string"),
                "timeText" to nullable("string"),
                "durationMinutes" to nullable("integer"),
                "memo" to nullable("string"),
                "lat" to nullable("number"),
                "lng" to nullable("number"),
            ),
        )

    private fun nullable(type: String): Map<String, Any?> = mapOf("type" to listOf(type, "null"))

    private fun nullableObject(schema: Map<String, Any?>): Map<String, Any?> =
        schema + ("type" to listOf("object", "null"))

    private fun nullableArray(itemSchema: Map<String, Any?>): Map<String, Any?> =
        mapOf(
            "type" to listOf("array", "null"),
            "items" to itemSchema,
        )

    private fun TripStateDto.toPromptContext(): Map<String, Any?> =
        mapOf(
            "trip" to mapOf(
                "id" to trip.id,
                "title" to trip.title,
                "destinationName" to trip.destinationName,
                "destinationLat" to trip.destinationLat,
                "destinationLng" to trip.destinationLng,
                "startDate" to trip.startDate,
                "endDate" to trip.endDate,
            ),
            "days" to days.map { day ->
                mapOf(
                    "id" to day.id,
                    "dayNumber" to day.dayNumber,
                    "dateText" to day.dateText,
                    "weekday" to day.weekday,
                )
            },
            "itineraryItems" to itineraryItems.map { item ->
                mapOf(
                    "id" to item.id,
                    "tripDayId" to item.tripDayId,
                    "placeId" to item.placeId,
                    "type" to item.type,
                    "title" to item.title,
                    "category" to item.category,
                    "timeText" to item.timeText,
                    "durationMinutes" to item.durationMinutes,
                    "memo" to item.memo,
                    "lat" to item.lat,
                    "lng" to item.lng,
                    "sortOrder" to item.sortOrder,
                    "locked" to item.locked,
                )
            },
            "places" to places.map { place ->
                mapOf(
                    "id" to place.id,
                    "name" to place.name,
                    "category" to place.category,
                    "note" to place.note,
                    "address" to place.address,
                    "lat" to place.lat,
                    "lng" to place.lng,
                    "status" to place.status,
                )
            },
        )
}
