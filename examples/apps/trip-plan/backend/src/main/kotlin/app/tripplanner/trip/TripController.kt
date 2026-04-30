package app.tripplanner.trip

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
class TripController(
    private val service: TripService,
) {
    @GetMapping("/api/workspaces/{workspaceId}/trips")
    fun findTrips(@PathVariable workspaceId: String): List<TripDto> = service.findTrips(workspaceId)

    @PostMapping("/api/workspaces/{workspaceId}/trips")
    @ResponseStatus(HttpStatus.CREATED)
    fun createTrip(
        @PathVariable workspaceId: String,
        @RequestBody request: CreateTripRequest,
    ): TripDto = service.createTrip(workspaceId, request)

    @GetMapping("/api/trips/{tripId}/state")
    fun state(@PathVariable tripId: String): TripStateDto = service.state(tripId)

    @GetMapping("/api/trips/{tripId}/checkpoints")
    fun checkpoints(@PathVariable tripId: String): List<CheckpointSummaryDto> = service.checkpoints(tripId)

    @PostMapping("/api/checkpoints/{checkpointId}/rollback")
    fun rollbackCheckpoint(@PathVariable checkpointId: String): TripStateDto = service.rollbackCheckpoint(checkpointId)

    @PostMapping("/api/trips/{tripId}/operations")
    fun applyOperations(
        @PathVariable tripId: String,
        @RequestBody request: ApplyOperationsRequest,
    ): ApplyOperationsResponse = service.applyOperations(tripId, request)

    @PatchMapping("/api/trips/{tripId}")
    fun updateTrip(
        @PathVariable tripId: String,
        @RequestBody request: UpdateTripRequest,
    ): TripDto = service.updateTrip(tripId, request)

    @DeleteMapping("/api/trips/{tripId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteTrip(@PathVariable tripId: String) {
        service.deleteTrip(tripId)
    }

    @PostMapping("/api/trip-days/{dayId}/items")
    @ResponseStatus(HttpStatus.CREATED)
    fun addItem(
        @PathVariable dayId: String,
        @RequestBody request: UpsertItineraryItemRequest,
    ): ItineraryItemDto = service.addItem(dayId, request)

    @PatchMapping("/api/itinerary-items/{itemId}")
    fun updateItem(
        @PathVariable itemId: String,
        @RequestBody request: UpsertItineraryItemRequest,
    ): ItineraryItemDto = service.updateItem(itemId, request)

    @DeleteMapping("/api/itinerary-items/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteItem(@PathVariable itemId: String) {
        service.deleteItem(itemId)
    }

    @PatchMapping("/api/places/{placeId}")
    fun updatePlace(
        @PathVariable placeId: String,
        @RequestBody request: UpsertPlaceRequest,
    ): PlaceDto = service.updatePlace(placeId, request)

    @DeleteMapping("/api/places/{placeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deletePlace(@PathVariable placeId: String) {
        service.deletePlace(placeId)
    }
}
