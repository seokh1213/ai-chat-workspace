package app.tripplanner.trip

import java.sql.ResultSet

internal fun tripRow(rs: ResultSet, rowNumber: Int): TripDto =
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

internal fun dayRow(rs: ResultSet, rowNumber: Int): TripDayDto =
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

internal fun placeRow(rs: ResultSet, rowNumber: Int): PlaceDto =
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

internal fun itemRow(rs: ResultSet, rowNumber: Int): ItineraryItemDto =
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

internal fun checkpointRow(rs: ResultSet, rowNumber: Int): CheckpointSummaryDto =
    CheckpointSummaryDto(
        id = rs.getString("id"),
        label = rs.getString("label"),
        reason = rs.getString("reason"),
        source = rs.getString("source"),
        createdAt = rs.getString("created_at"),
    )

internal fun checkpointRecordRow(rs: ResultSet, rowNumber: Int): CheckpointRecordDto =
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

private fun ResultSet.getNullableDouble(column: String): Double? {
    val value = getDouble(column)
    return if (wasNull()) null else value
}

private fun ResultSet.getNullableInt(column: String): Int? {
    val value = getInt(column)
    return if (wasNull()) null else value
}
