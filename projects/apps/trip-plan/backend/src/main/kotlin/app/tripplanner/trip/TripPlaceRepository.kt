package app.tripplanner.trip

import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Repository

@Repository
class TripPlaceRepository(
    private val jdbcClient: JdbcClient,
) {
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
}
