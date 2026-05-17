package app.tripplanner.trip

import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Repository

@Repository
class TripItemRepository(
    private val jdbcClient: JdbcClient,
) {
    fun findTripIdByItem(itemId: String): String? =
        jdbcClient
            .sql(
                """
                SELECT day.trip_id
                FROM itinerary_items item
                JOIN trip_days day ON day.id = item.trip_day_id
                WHERE item.id = :itemId
                """.trimIndent(),
            )
            .param("itemId", itemId)
            .query(String::class.java)
            .optional()
            .orElse(null)

    fun countItemsAfterDay(tripId: String, maxDayNumber: Int): Int =
        jdbcClient
            .sql(
                """
                SELECT COUNT(item.id)
                FROM itinerary_items item
                JOIN trip_days day ON day.id = item.trip_day_id
                WHERE day.trip_id = :tripId AND day.day_number > :maxDayNumber
                """.trimIndent(),
            )
            .param("tripId", tripId)
            .param("maxDayNumber", maxDayNumber)
            .query(Int::class.java)
            .single()

    fun findItineraryItems(tripId: String): List<ItineraryItemDto> =
        jdbcClient
            .sql(
                """
                SELECT item.id, item.trip_day_id, item.place_id, item.type, item.title, item.category,
                       item.time_text, item.duration_minutes, item.memo, item.lat, item.lng,
                       item.sort_order, item.locked, item.raw_json, item.created_at, item.updated_at
                FROM itinerary_items item
                JOIN trip_days day ON day.id = item.trip_day_id
                WHERE day.trip_id = :tripId
                ORDER BY day.sort_order ASC, item.sort_order ASC
                """.trimIndent(),
            )
            .param("tripId", tripId)
            .query(::itemRow)
            .list()

    fun findItemsByDay(dayId: String): List<ItineraryItemDto> =
        jdbcClient
            .sql(
                """
                SELECT id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo,
                       lat, lng, sort_order, locked, raw_json, created_at, updated_at
                FROM itinerary_items
                WHERE trip_day_id = :dayId
                ORDER BY sort_order ASC
                """.trimIndent(),
            )
            .param("dayId", dayId)
            .query(::itemRow)
            .list()

    fun nextItemSortOrder(dayId: String): Int =
        jdbcClient
            .sql(
                """
                SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_sort_order
                FROM itinerary_items
                WHERE trip_day_id = :dayId
                """.trimIndent(),
            )
            .param("dayId", dayId)
            .query(Int::class.java)
            .single()

    fun insertItem(item: ItineraryItemDto) {
        jdbcClient
            .sql(
                """
                INSERT INTO itinerary_items (
                  id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo,
                  lat, lng, sort_order, locked, raw_json, created_at, updated_at
                ) VALUES (
                  :id, :tripDayId, :placeId, :type, :title, :category, :timeText, :durationMinutes, :memo,
                  :lat, :lng, :sortOrder, :locked, :rawJson, :createdAt, :updatedAt
                )
                """.trimIndent(),
            )
            .bindItem(item)
            .update()
    }

    fun updateItemDayAndSort(itemId: String, dayId: String, sortOrder: Int, updatedAt: String) {
        jdbcClient
            .sql(
                """
                UPDATE itinerary_items
                SET trip_day_id = :dayId,
                    sort_order = :sortOrder,
                    updated_at = :updatedAt
                WHERE id = :itemId
                """.trimIndent(),
            )
            .param("itemId", itemId)
            .param("dayId", dayId)
            .param("sortOrder", sortOrder)
            .param("updatedAt", updatedAt)
            .update()
    }

    fun updateItemSortOrder(itemId: String, sortOrder: Int, updatedAt: String) {
        jdbcClient
            .sql(
                """
                UPDATE itinerary_items
                SET sort_order = :sortOrder,
                    updated_at = :updatedAt
                WHERE id = :itemId
                """.trimIndent(),
            )
            .param("itemId", itemId)
            .param("sortOrder", sortOrder)
            .param("updatedAt", updatedAt)
            .update()
    }

    fun deleteItemsByDay(dayId: String) {
        jdbcClient
            .sql("DELETE FROM itinerary_items WHERE trip_day_id = :dayId")
            .param("dayId", dayId)
            .update()
    }

    fun updateItem(itemId: String, request: UpsertItineraryItemRequest, updatedAt: String): ItineraryItemDto {
        jdbcClient
            .sql(
                """
                UPDATE itinerary_items
                SET title = :title,
                    type = :type,
                    category = :category,
                    time_text = :timeText,
                    duration_minutes = :durationMinutes,
                    memo = :memo,
                    lat = :lat,
                    lng = :lng,
                    updated_at = :updatedAt
                WHERE id = :itemId
                """.trimIndent(),
            )
            .param("itemId", itemId)
            .bindRequest(request)
            .param("updatedAt", updatedAt)
            .update()

        return findItem(itemId) ?: throw NoSuchElementException("Itinerary item not found.")
    }

    fun findItem(itemId: String): ItineraryItemDto? =
        jdbcClient
            .sql(
                """
                SELECT id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo,
                       lat, lng, sort_order, locked, raw_json, created_at, updated_at
                FROM itinerary_items
                WHERE id = :itemId
                """.trimIndent(),
            )
            .param("itemId", itemId)
            .query(::itemRow)
            .optional()
            .orElse(null)

    fun deleteItem(itemId: String) {
        val deleted = jdbcClient
            .sql("DELETE FROM itinerary_items WHERE id = :itemId")
            .param("itemId", itemId)
            .update()

        if (deleted == 0) {
            throw NoSuchElementException("Itinerary item not found.")
        }
    }
}
