package app.tripplanner.trip

import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Repository

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

}
