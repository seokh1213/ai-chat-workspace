package app.tripplanner.trip

typealias TripOperation = Map<String, Any?>
typealias TripOperations = List<TripOperation>

data class TripDto(
    val id: String,
    val workspaceId: String,
    val title: String,
    val destinationName: String?,
    val destinationLat: Double?,
    val destinationLng: Double?,
    val startDate: String?,
    val endDate: String?,
    val timezone: String?,
    val createdAt: String,
    val updatedAt: String,
)

data class CreateTripRequest(
    val title: String,
    val destinationName: String? = null,
    val destinationLat: Double? = null,
    val destinationLng: Double? = null,
    val startDate: String? = null,
    val endDate: String? = null,
    val timezone: String? = "Asia/Seoul",
)

data class UpdateTripRequest(
    val title: String,
    val destinationName: String? = null,
    val destinationLat: Double? = null,
    val destinationLng: Double? = null,
    val startDate: String? = null,
    val endDate: String? = null,
    val timezone: String? = "Asia/Seoul",
)

data class TripDayDto(
    val id: String,
    val tripId: String,
    val dayNumber: Int,
    val dateText: String?,
    val weekday: String?,
    val title: String?,
    val sortOrder: Int,
    val createdAt: String,
    val updatedAt: String,
)

data class PlaceDto(
    val id: String,
    val tripId: String,
    val name: String,
    val category: String?,
    val rating: String?,
    val reviews: String?,
    val note: String?,
    val address: String?,
    val source: String?,
    val sourceUrl: String?,
    val imageUrl: String?,
    val lat: Double?,
    val lng: Double?,
    val status: String,
    val rawJson: String,
    val createdAt: String,
    val updatedAt: String,
)

data class UpsertPlaceRequest(
    val name: String,
    val category: String? = null,
    val note: String? = null,
    val address: String? = null,
    val source: String? = null,
    val sourceUrl: String? = null,
    val imageUrl: String? = null,
    val lat: Double? = null,
    val lng: Double? = null,
)

data class ItineraryItemDto(
    val id: String,
    val tripDayId: String,
    val placeId: String?,
    val type: String,
    val title: String,
    val category: String?,
    val timeText: String?,
    val durationMinutes: Int?,
    val memo: String?,
    val lat: Double?,
    val lng: Double?,
    val sortOrder: Int,
    val locked: Boolean,
    val rawJson: String,
    val createdAt: String,
    val updatedAt: String,
)

data class UpsertItineraryItemRequest(
    val title: String,
    val type: String? = "custom",
    val category: String? = null,
    val timeText: String? = null,
    val durationMinutes: Int? = null,
    val memo: String? = null,
    val lat: Double? = null,
    val lng: Double? = null,
)

data class ApplyOperationsRequest(
    val reason: String? = null,
    val source: String = "ui",
    val operations: TripOperations = emptyList(),
)

data class ApplyOperationsResponse(
    val state: TripStateDto,
    val checkpoint: CheckpointSummaryDto?,
)

data class TripStateDto(
    val trip: TripDto,
    val days: List<TripDayDto>,
    val places: List<PlaceDto>,
    val itineraryItems: List<ItineraryItemDto>,
    val latestCheckpoint: CheckpointSummaryDto?,
    val checkpoints: List<CheckpointSummaryDto> = emptyList(),
)

data class CheckpointSummaryDto(
    val id: String,
    val label: String?,
    val reason: String?,
    val source: String,
    val createdAt: String,
)

data class CheckpointRecordDto(
    val id: String,
    val tripId: String,
    val label: String?,
    val reason: String?,
    val source: String,
    val beforeStateJson: String,
    val afterStateJson: String,
    val operationsJson: String,
    val createdAt: String,
)
