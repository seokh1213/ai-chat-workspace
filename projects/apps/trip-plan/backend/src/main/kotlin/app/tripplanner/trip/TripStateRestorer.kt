package app.tripplanner.trip

import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Component

@Component
class TripStateRestorer(
    private val jdbcClient: JdbcClient,
    private val tripRepository: TripRepository,
    private val placeRepository: TripPlaceRepository,
    private val itemRepository: TripItemRepository,
) {
    fun restore(state: TripStateDto) {
        tripRepository.updateTrip(state.trip)

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

        state.days.forEach(tripRepository::insertDay)
        state.places.forEach(placeRepository::insertPlace)
        state.itineraryItems.forEach(itemRepository::insertItem)
    }
}
