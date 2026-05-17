package app.tripplanner

import app.tripplanner.trip.ApplyOperationsRequest
import app.tripplanner.trip.CreateTripRequest
import app.tripplanner.trip.UpsertItineraryItemRequest
import app.tripplanner.trip.UpsertPlaceRequest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test

class TripPlannerOperationTests : TripPlannerIntegrationTestSupport() {
    @Test
    fun `ai add item operation stores place and coordinates`() {
        val trip = tripService.createTrip(
            workspaceId = "workspace_default",
            request = CreateTripRequest(title = "장소 핀 테스트"),
        )

        val response = tripService.applyOperations(
            tripId = trip.id,
            request = ApplyOperationsRequest(
                source = "ai",
                operations = listOf(
                    mapOf(
                        "op" to "add_item",
                        "day" to 1,
                        "item" to mapOf(
                            "title" to "와이탄",
                            "type" to "poi",
                            "category" to "sight",
                            "lat" to 31.2403,
                            "lng" to 121.4903,
                            "place" to mapOf(
                                "name" to "와이탄",
                                "category" to "sight",
                                "address" to "Zhongshan East 1st Rd, Shanghai",
                                "note" to "황푸강 야경 명소",
                                "lat" to 31.2403,
                                "lng" to 121.4903,
                                "source" to "ai",
                            ),
                        ),
                    ),
                ),
            ),
        )

        assertEquals(1, response.state.places.size)
        assertEquals("와이탄", response.state.places.single().name)
        assertEquals(response.state.places.single().id, response.state.itineraryItems.single().placeId)
        assertEquals(31.2403, response.state.itineraryItems.single().lat ?: 0.0, 0.000001)
    }

    @Test
    fun `ai add item with coordinates creates implicit place`() {
        val trip = tripService.createTrip(
            workspaceId = "workspace_default",
            request = CreateTripRequest(title = "암묵 장소 핀 테스트"),
        )

        val response = tripService.applyOperations(
            tripId = trip.id,
            request = ApplyOperationsRequest(
                source = "ai",
                operations = listOf(
                    mapOf(
                        "op" to "add_item",
                        "day" to 1,
                        "item" to mapOf(
                            "title" to "난징동루",
                            "type" to "poi",
                            "category" to "shopping",
                            "lat" to 31.2355,
                            "lng" to 121.4749,
                        ),
                    ),
                ),
            ),
        )

        assertEquals(1, response.state.places.size)
        assertEquals("난징동루", response.state.places.single().name)
        assertEquals(response.state.places.single().id, response.state.itineraryItems.single().placeId)
    }

    @Test
    fun `ai add item reuses existing place for duplicate coordinates`() {
        val trip = tripService.createTrip(
            workspaceId = "workspace_default",
            request = CreateTripRequest(title = "중복 장소 테스트"),
        )

        tripService.applyOperations(
            tripId = trip.id,
            request = ApplyOperationsRequest(
                source = "ai",
                operations = listOf(
                    mapOf(
                        "op" to "add_item",
                        "day" to 1,
                        "item" to mapOf(
                            "title" to "푸동국제공항 도착",
                            "type" to "transport",
                            "category" to "transport",
                            "lat" to 31.1443,
                            "lng" to 121.8083,
                        ),
                    ),
                    mapOf(
                        "op" to "add_item",
                        "day" to 1,
                        "item" to mapOf(
                            "title" to "푸동국제공항 출발",
                            "type" to "transport",
                            "category" to "transport",
                            "lat" to 31.14431,
                            "lng" to 121.80831,
                        ),
                    ),
                ),
            ),
        )

        val state = tripService.state(trip.id)
        assertEquals(1, state.places.size)
        assertEquals(state.places.single().id, state.itineraryItems[0].placeId)
        assertEquals(state.places.single().id, state.itineraryItems[1].placeId)
    }

    @Test
    fun `ai operations cannot update item from another trip`() {
        val sourceTrip = tripService.createTrip(workspaceId = "workspace_default", request = CreateTripRequest(title = "원본 여행"))
        val targetTrip = tripService.createTrip(workspaceId = "workspace_default", request = CreateTripRequest(title = "대상 여행"))
        val sourceDay = tripService.state(sourceTrip.id).days.first()
        val sourceItem = tripService.addItem(
            dayId = sourceDay.id,
            request = UpsertItineraryItemRequest(title = "건드리면 안 되는 일정"),
        )

        assertThrows(IllegalArgumentException::class.java) {
            tripService.applyOperations(
                tripId = targetTrip.id,
                request = ApplyOperationsRequest(
                    source = "ai",
                    operations = listOf(
                        mapOf("op" to "update_item", "itemId" to sourceItem.id, "patch" to mapOf("title" to "오염된 일정")),
                    ),
                ),
            )
        }

        assertEquals("건드리면 안 되는 일정", tripService.state(sourceTrip.id).itineraryItems.single().title)
        assertEquals(0, tripService.state(targetTrip.id).itineraryItems.size)
    }

    @Test
    fun `ai operations cannot attach place from another trip`() {
        val sourceTrip = tripService.createTrip(workspaceId = "workspace_default", request = CreateTripRequest(title = "장소 원본 여행"))
        val targetTrip = tripService.createTrip(workspaceId = "workspace_default", request = CreateTripRequest(title = "장소 대상 여행"))
        val sourcePlace = tripService.addPlace(tripId = sourceTrip.id, request = UpsertPlaceRequest(name = "외부 장소"))

        assertThrows(IllegalArgumentException::class.java) {
            tripService.applyOperations(
                tripId = targetTrip.id,
                request = ApplyOperationsRequest(
                    source = "ai",
                    operations = listOf(
                        mapOf("op" to "add_item", "day" to 1, "item" to mapOf("title" to "외부 장소 일정", "placeId" to sourcePlace.id)),
                    ),
                ),
            )
        }

        assertEquals(0, tripService.state(targetTrip.id).itineraryItems.size)
    }
}
