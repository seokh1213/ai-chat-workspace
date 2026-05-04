package app.tripplanner.trip

import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Repository
import java.sql.ResultSet

@Repository
class TripRepository(
    private val jdbcClient: JdbcClient,
) {
    fun findTripsByWorkspace(workspaceId: String): List<TripDto> =
        jdbcClient
            .sql(
                """
                SELECT id, workspace_id, title, destination_name, destination_lat, destination_lng,
                       start_date, end_date, timezone, created_at, updated_at
                FROM trips
                WHERE workspace_id = :workspaceId
                ORDER BY updated_at DESC, created_at DESC
                """.trimIndent(),
            )
            .param("workspaceId", workspaceId)
            .query(::tripRow)
            .list()

    fun findTrip(tripId: String): TripDto? =
        jdbcClient
            .sql(
                """
                SELECT id, workspace_id, title, destination_name, destination_lat, destination_lng,
                       start_date, end_date, timezone, created_at, updated_at
                FROM trips
                WHERE id = :tripId
                """.trimIndent(),
            )
            .param("tripId", tripId)
            .query(::tripRow)
            .optional()
            .orElse(null)

    fun findTripIdByDay(dayId: String): String? =
        jdbcClient
            .sql("SELECT trip_id FROM trip_days WHERE id = :dayId")
            .param("dayId", dayId)
            .query(String::class.java)
            .optional()
            .orElse(null)

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

    fun insertTrip(trip: TripDto) {
        jdbcClient
            .sql(
                """
                INSERT INTO trips (
                  id, workspace_id, title, destination_name, destination_lat, destination_lng,
                  start_date, end_date, timezone, created_at, updated_at
                ) VALUES (
                  :id, :workspaceId, :title, :destinationName, :destinationLat, :destinationLng,
                  :startDate, :endDate, :timezone, :createdAt, :updatedAt
                )
                """.trimIndent(),
            )
            .param("id", trip.id)
            .param("workspaceId", trip.workspaceId)
            .param("title", trip.title)
            .param("destinationName", trip.destinationName)
            .param("destinationLat", trip.destinationLat)
            .param("destinationLng", trip.destinationLng)
            .param("startDate", trip.startDate)
            .param("endDate", trip.endDate)
            .param("timezone", trip.timezone)
            .param("createdAt", trip.createdAt)
            .param("updatedAt", trip.updatedAt)
            .update()
    }

    fun updateTrip(trip: TripDto) {
        val updated = jdbcClient
            .sql(
                """
                UPDATE trips
                SET title = :title,
                    destination_name = :destinationName,
                    destination_lat = :destinationLat,
                    destination_lng = :destinationLng,
                    start_date = :startDate,
                    end_date = :endDate,
                    timezone = :timezone,
                    updated_at = :updatedAt
                WHERE id = :id
                """.trimIndent(),
            )
            .param("id", trip.id)
            .param("title", trip.title)
            .param("destinationName", trip.destinationName)
            .param("destinationLat", trip.destinationLat)
            .param("destinationLng", trip.destinationLng)
            .param("startDate", trip.startDate)
            .param("endDate", trip.endDate)
            .param("timezone", trip.timezone)
            .param("updatedAt", trip.updatedAt)
            .update()

        if (updated == 0) {
            throw NoSuchElementException("Trip not found.")
        }
    }

    fun deleteTrip(tripId: String) {
        val deleted = jdbcClient
            .sql("DELETE FROM trips WHERE id = :tripId")
            .param("tripId", tripId)
            .update()

        if (deleted == 0) {
            throw NoSuchElementException("Trip not found.")
        }
    }

    fun insertDay(day: TripDayDto) {
        jdbcClient
            .sql(
                """
                INSERT INTO trip_days (
                  id, trip_id, day_number, date_text, weekday, title, sort_order, created_at, updated_at
                ) VALUES (
                  :id, :tripId, :dayNumber, :dateText, :weekday, :title, :sortOrder, :createdAt, :updatedAt
                )
                """.trimIndent(),
            )
            .param("id", day.id)
            .param("tripId", day.tripId)
            .param("dayNumber", day.dayNumber)
            .param("dateText", day.dateText)
            .param("weekday", day.weekday)
            .param("title", day.title)
            .param("sortOrder", day.sortOrder)
            .param("createdAt", day.createdAt)
            .param("updatedAt", day.updatedAt)
            .update()
    }

    fun updateDayDate(day: TripDayDto) {
        jdbcClient
            .sql(
                """
                UPDATE trip_days
                SET date_text = :dateText,
                    weekday = :weekday,
                    title = :title,
                    sort_order = :sortOrder,
                    updated_at = :updatedAt
                WHERE id = :id
                """.trimIndent(),
            )
            .param("id", day.id)
            .param("dateText", day.dateText)
            .param("weekday", day.weekday)
            .param("title", day.title)
            .param("sortOrder", day.sortOrder)
            .param("updatedAt", day.updatedAt)
            .update()
    }

    fun deleteDaysAfter(tripId: String, maxDayNumber: Int) {
        jdbcClient
            .sql("DELETE FROM trip_days WHERE trip_id = :tripId AND day_number > :maxDayNumber")
            .param("tripId", tripId)
            .param("maxDayNumber", maxDayNumber)
            .update()
    }

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

    fun findDays(tripId: String): List<TripDayDto> =
        jdbcClient
            .sql(
                """
                SELECT id, trip_id, day_number, date_text, weekday, title, sort_order, created_at, updated_at
                FROM trip_days
                WHERE trip_id = :tripId
                ORDER BY sort_order ASC
                """.trimIndent(),
            )
            .param("tripId", tripId)
            .query(::dayRow)
            .list()

    fun findDayByNumber(tripId: String, dayNumber: Int): TripDayDto? =
        jdbcClient
            .sql(
                """
                SELECT id, trip_id, day_number, date_text, weekday, title, sort_order, created_at, updated_at
                FROM trip_days
                WHERE trip_id = :tripId AND day_number = :dayNumber
                """.trimIndent(),
            )
            .param("tripId", tripId)
            .param("dayNumber", dayNumber)
            .query(::dayRow)
            .optional()
            .orElse(null)

    fun findPlaces(tripId: String): List<PlaceDto> =
        jdbcClient
            .sql(
                """
                SELECT id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url,
                       lat, lng, status, raw_json, created_at, updated_at
                FROM places
                WHERE trip_id = :tripId
                ORDER BY created_at DESC
                """.trimIndent(),
            )
            .param("tripId", tripId)
            .query(::placeRow)
            .list()

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

    fun insertPlace(place: PlaceDto) {
        jdbcClient
            .sql(
                """
                INSERT INTO places (
                  id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url,
                  lat, lng, status, raw_json, created_at, updated_at
                ) VALUES (
                  :id, :tripId, :name, :category, :rating, :reviews, :note, :address, :source, :sourceUrl, :imageUrl,
                  :lat, :lng, :status, :rawJson, :createdAt, :updatedAt
                )
                """.trimIndent(),
            )
            .bindPlace(place)
            .update()
    }

    fun updatePlace(placeId: String, request: UpsertPlaceRequest, updatedAt: String): PlaceDto {
        jdbcClient
            .sql(
                """
                UPDATE places
                SET name = :name,
                    category = :category,
                    note = :note,
                    address = :address,
                    source = :source,
                    source_url = :sourceUrl,
                    image_url = :imageUrl,
                    lat = :lat,
                    lng = :lng,
                    status = :status,
                    updated_at = :updatedAt
                WHERE id = :placeId
                """.trimIndent(),
            )
            .param("placeId", placeId)
            .bindRequest(request)
            .param("status", if (request.lat != null && request.lng != null) "ready" else "needs_coordinates")
            .param("updatedAt", updatedAt)
            .update()

        return findPlace(placeId) ?: throw NoSuchElementException("Place not found.")
    }

    fun findPlace(placeId: String): PlaceDto? =
        jdbcClient
            .sql(
                """
                SELECT id, trip_id, name, category, rating, reviews, note, address, source, source_url,
                       image_url, lat, lng, status, raw_json, created_at, updated_at
                FROM places
                WHERE id = :placeId
                """.trimIndent(),
            )
            .param("placeId", placeId)
            .query(::placeRow)
            .optional()
            .orElse(null)

    fun deletePlace(placeId: String) {
        val deleted = jdbcClient
            .sql("DELETE FROM places WHERE id = :placeId")
            .param("placeId", placeId)
            .update()

        if (deleted == 0) {
            throw NoSuchElementException("Place not found.")
        }
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

    fun latestCheckpoint(tripId: String): CheckpointSummaryDto? =
        jdbcClient
            .sql(
                """
                SELECT id, label, reason, source, created_at
                FROM checkpoints
                WHERE trip_id = :tripId
                ORDER BY created_at DESC
                LIMIT 1
                """.trimIndent(),
            )
            .param("tripId", tripId)
            .query { rs, _ ->
                CheckpointSummaryDto(
                    id = rs.getString("id"),
                    label = rs.getString("label"),
                    reason = rs.getString("reason"),
                    source = rs.getString("source"),
                    createdAt = rs.getString("created_at"),
                )
            }
            .optional()
            .orElse(null)

    fun findCheckpoints(tripId: String): List<CheckpointSummaryDto> =
        jdbcClient
            .sql(
                """
                SELECT id, label, reason, source, created_at
                FROM checkpoints
                WHERE trip_id = :tripId
                ORDER BY created_at DESC
                LIMIT 30
                """.trimIndent(),
            )
            .param("tripId", tripId)
            .query(::checkpointRow)
            .list()

    fun findCheckpoint(checkpointId: String): CheckpointRecordDto? =
        jdbcClient
            .sql(
                """
                SELECT id, trip_id, label, reason, source, before_state_json, after_state_json,
                       operations_json, created_at
                FROM checkpoints
                WHERE id = :checkpointId
                """.trimIndent(),
            )
            .param("checkpointId", checkpointId)
            .query(::checkpointRecordRow)
            .optional()
            .orElse(null)

    fun insertCheckpoint(checkpoint: CheckpointRecordDto) {
        jdbcClient
            .sql(
                """
                INSERT INTO checkpoints (
                  id, trip_id, label, reason, source, before_state_json, after_state_json,
                  operations_json, created_at
                ) VALUES (
                  :id, :tripId, :label, :reason, :source, :beforeStateJson, :afterStateJson,
                  :operationsJson, :createdAt
                )
                """.trimIndent(),
            )
            .param("id", checkpoint.id)
            .param("tripId", checkpoint.tripId)
            .param("label", checkpoint.label)
            .param("reason", checkpoint.reason)
            .param("source", checkpoint.source)
            .param("beforeStateJson", checkpoint.beforeStateJson)
            .param("afterStateJson", checkpoint.afterStateJson)
            .param("operationsJson", checkpoint.operationsJson)
            .param("createdAt", checkpoint.createdAt)
            .update()
    }

    fun restoreTripState(state: TripStateDto) {
        updateTrip(state.trip)

        jdbcClient
            .sql(
                """
                DELETE FROM itinerary_items
                WHERE trip_day_id IN (SELECT id FROM trip_days WHERE trip_id = :tripId)
                """.trimIndent(),
            )
            .param("tripId", state.trip.id)
            .update()

        jdbcClient
            .sql("DELETE FROM trip_days WHERE trip_id = :tripId")
            .param("tripId", state.trip.id)
            .update()

        jdbcClient
            .sql("DELETE FROM places WHERE trip_id = :tripId")
            .param("tripId", state.trip.id)
            .update()

        state.days.forEach(::insertDay)
        state.places.forEach(::insertPlace)
        state.itineraryItems.forEach(::insertItem)
    }

    private fun tripRow(rs: ResultSet, rowNumber: Int): TripDto =
        TripDto(
            id = rs.getString("id"),
            workspaceId = rs.getString("workspace_id"),
            title = rs.getString("title"),
            destinationName = rs.getString("destination_name"),
            destinationLat = rs.getNullableDouble("destination_lat"),
            destinationLng = rs.getNullableDouble("destination_lng"),
            startDate = rs.getString("start_date"),
            endDate = rs.getString("end_date"),
            timezone = rs.getString("timezone"),
            createdAt = rs.getString("created_at"),
            updatedAt = rs.getString("updated_at"),
        )

    private fun dayRow(rs: ResultSet, rowNumber: Int): TripDayDto =
        TripDayDto(
            id = rs.getString("id"),
            tripId = rs.getString("trip_id"),
            dayNumber = rs.getInt("day_number"),
            dateText = rs.getString("date_text"),
            weekday = rs.getString("weekday"),
            title = rs.getString("title"),
            sortOrder = rs.getInt("sort_order"),
            createdAt = rs.getString("created_at"),
            updatedAt = rs.getString("updated_at"),
        )

    private fun placeRow(rs: ResultSet, rowNumber: Int): PlaceDto =
        PlaceDto(
            id = rs.getString("id"),
            tripId = rs.getString("trip_id"),
            name = rs.getString("name"),
            category = rs.getString("category"),
            rating = rs.getString("rating"),
            reviews = rs.getString("reviews"),
            note = rs.getString("note"),
            address = rs.getString("address"),
            source = rs.getString("source"),
            sourceUrl = rs.getString("source_url"),
            imageUrl = rs.getString("image_url"),
            lat = rs.getNullableDouble("lat"),
            lng = rs.getNullableDouble("lng"),
            status = rs.getString("status"),
            rawJson = rs.getString("raw_json"),
            createdAt = rs.getString("created_at"),
            updatedAt = rs.getString("updated_at"),
        )

    private fun itemRow(rs: ResultSet, rowNumber: Int): ItineraryItemDto =
        ItineraryItemDto(
            id = rs.getString("id"),
            tripDayId = rs.getString("trip_day_id"),
            placeId = rs.getString("place_id"),
            type = rs.getString("type"),
            title = rs.getString("title"),
            category = rs.getString("category"),
            timeText = rs.getString("time_text"),
            durationMinutes = rs.getNullableInt("duration_minutes"),
            memo = rs.getString("memo"),
            lat = rs.getNullableDouble("lat"),
            lng = rs.getNullableDouble("lng"),
            sortOrder = rs.getInt("sort_order"),
            locked = rs.getBoolean("locked"),
            rawJson = rs.getString("raw_json"),
            createdAt = rs.getString("created_at"),
            updatedAt = rs.getString("updated_at"),
        )

    private fun checkpointRow(rs: ResultSet, rowNumber: Int): CheckpointSummaryDto =
        CheckpointSummaryDto(
            id = rs.getString("id"),
            label = rs.getString("label"),
            reason = rs.getString("reason"),
            source = rs.getString("source"),
            createdAt = rs.getString("created_at"),
        )

    private fun checkpointRecordRow(rs: ResultSet, rowNumber: Int): CheckpointRecordDto =
        CheckpointRecordDto(
            id = rs.getString("id"),
            tripId = rs.getString("trip_id"),
            label = rs.getString("label"),
            reason = rs.getString("reason"),
            source = rs.getString("source"),
            beforeStateJson = rs.getString("before_state_json"),
            afterStateJson = rs.getString("after_state_json"),
            operationsJson = rs.getString("operations_json"),
            createdAt = rs.getString("created_at"),
        )
}

private fun JdbcClient.StatementSpec.bindRequest(request: UpsertItineraryItemRequest): JdbcClient.StatementSpec =
    param("title", request.title.trim())
        .param("type", request.type?.trim().takeUnless { it.isNullOrEmpty() } ?: "custom")
        .param("category", request.category?.trim().takeUnless { it.isNullOrEmpty() })
        .param("timeText", request.timeText?.trim().takeUnless { it.isNullOrEmpty() })
        .param("durationMinutes", request.durationMinutes)
        .param("memo", request.memo?.trim().takeUnless { it.isNullOrEmpty() })
        .param("lat", request.lat)
        .param("lng", request.lng)

private fun JdbcClient.StatementSpec.bindRequest(request: UpsertPlaceRequest): JdbcClient.StatementSpec =
    param("name", request.name.trim())
        .param("category", request.category?.trim().takeUnless { it.isNullOrEmpty() })
        .param("note", request.note?.trim().takeUnless { it.isNullOrEmpty() })
        .param("address", request.address?.trim().takeUnless { it.isNullOrEmpty() })
        .param("source", request.source?.trim().takeUnless { it.isNullOrEmpty() })
        .param("sourceUrl", request.sourceUrl?.trim().takeUnless { it.isNullOrEmpty() })
        .param("imageUrl", request.imageUrl?.trim().takeUnless { it.isNullOrEmpty() })
        .param("lat", request.lat)
        .param("lng", request.lng)

private fun JdbcClient.StatementSpec.bindItem(item: ItineraryItemDto): JdbcClient.StatementSpec =
    param("id", item.id)
        .param("tripDayId", item.tripDayId)
        .param("placeId", item.placeId)
        .param("type", item.type)
        .param("title", item.title)
        .param("category", item.category)
        .param("timeText", item.timeText)
        .param("durationMinutes", item.durationMinutes)
        .param("memo", item.memo)
        .param("lat", item.lat)
        .param("lng", item.lng)
        .param("sortOrder", item.sortOrder)
        .param("locked", item.locked)
        .param("rawJson", item.rawJson)
        .param("createdAt", item.createdAt)
        .param("updatedAt", item.updatedAt)

private fun JdbcClient.StatementSpec.bindPlace(place: PlaceDto): JdbcClient.StatementSpec =
    param("id", place.id)
        .param("tripId", place.tripId)
        .param("name", place.name)
        .param("category", place.category)
        .param("rating", place.rating)
        .param("reviews", place.reviews)
        .param("note", place.note)
        .param("address", place.address)
        .param("source", place.source)
        .param("sourceUrl", place.sourceUrl)
        .param("imageUrl", place.imageUrl)
        .param("lat", place.lat)
        .param("lng", place.lng)
        .param("status", place.status)
        .param("rawJson", place.rawJson)
        .param("createdAt", place.createdAt)
        .param("updatedAt", place.updatedAt)

private fun ResultSet.getNullableDouble(column: String): Double? {
    val value = getDouble(column)
    return if (wasNull()) null else value
}

private fun ResultSet.getNullableInt(column: String): Int? {
    val value = getInt(column)
    return if (wasNull()) null else value
}
