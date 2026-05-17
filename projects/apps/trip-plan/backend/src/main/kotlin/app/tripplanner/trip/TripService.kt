package app.tripplanner.trip

import app.tripplanner.common.ClockProvider
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.util.UUID

@Service
class TripService(
    private val repository: TripRepository,
    private val itemRepository: TripItemRepository,
    private val placeRepository: TripPlaceRepository,
    private val stateRestorer: TripStateRestorer,
    private val clockProvider: ClockProvider,
    private val operationApplier: TripOperationApplier,
    private val dayPlanner: TripDayPlanner,
) {
    private val objectMapper = jacksonObjectMapper()

    @Transactional(readOnly = true)
    fun findTrips(workspaceId: String): List<TripDto> = repository.findTripsByWorkspace(workspaceId)

    @Transactional
    fun createTrip(workspaceId: String, request: CreateTripRequest): TripDto {
        val title = request.title.trim()
        require(title.isNotEmpty()) { "Trip title must not be blank." }

        val startDate = request.startDate?.takeIf { it.isNotBlank() }?.let(LocalDate::parse)
        val endDate = request.endDate?.takeIf { it.isNotBlank() }?.let(LocalDate::parse)
        require(startDate == null || endDate == null || !endDate.isBefore(startDate)) {
            "End date must be after start date."
        }

        val now = clockProvider.nowText()
        val trip = TripDto(
            id = "trip_${UUID.randomUUID()}",
            workspaceId = workspaceId,
            title = title,
            destinationName = request.destinationName?.trim().takeUnless { it.isNullOrEmpty() },
            destinationLat = request.destinationLat,
            destinationLng = request.destinationLng,
            startDate = startDate?.toString(),
            endDate = endDate?.toString(),
            timezone = request.timezone?.trim().takeUnless { it.isNullOrEmpty() } ?: "Asia/Seoul",
            createdAt = now,
            updatedAt = now,
        )

        repository.insertTrip(trip)
        dayPlanner.defaultDays(trip, startDate, endDate, now).forEach(repository::insertDay)

        return trip
    }

    @Transactional
    fun updateTrip(tripId: String, request: UpdateTripRequest): TripDto {
        val existing = repository.findTrip(tripId) ?: throw NoSuchElementException("Trip not found.")
        val title = request.title.trim()
        require(title.isNotEmpty()) { "Trip title must not be blank." }

        val startDate = request.startDate?.takeIf { it.isNotBlank() }?.let(LocalDate::parse)
        val endDate = request.endDate?.takeIf { it.isNotBlank() }?.let(LocalDate::parse)
        require(startDate == null || endDate == null || !endDate.isBefore(startDate)) {
            "End date must be after start date."
        }
        validateDayShrink(existing.id, startDate, endDate)

        val now = clockProvider.nowText()
        val beforeState = snapshot(existing.id)
        val destinationName = request.destinationName?.trim().takeUnless { it.isNullOrEmpty() }
        val destinationChanged = destinationName != existing.destinationName
        val trip = existing.copy(
            title = title,
            destinationName = destinationName,
            destinationLat = request.destinationLat ?: if (destinationChanged) null else existing.destinationLat,
            destinationLng = request.destinationLng ?: if (destinationChanged) null else existing.destinationLng,
            startDate = startDate?.toString(),
            endDate = endDate?.toString(),
            timezone = request.timezone?.trim().takeUnless { it.isNullOrEmpty() } ?: existing.timezone,
            updatedAt = now,
        )

        repository.updateTrip(trip)
        dayPlanner.syncDays(trip, startDate, endDate, now)
        val afterState = snapshot(existing.id)
        recordCheckpoint(
            tripId = existing.id,
            label = "여행 정보 수정",
            reason = "기본 정보 또는 날짜 변경",
            source = "manual",
            beforeState = beforeState,
            afterState = afterState,
            operations = listOf(mapOf("type" to "update_trip")),
        )
        return repository.findTrip(tripId) ?: trip
    }

    @Transactional
    fun deleteTrip(tripId: String) {
        repository.findTrip(tripId) ?: throw NoSuchElementException("Trip not found.")
        repository.deleteTrip(tripId)
    }

    @Transactional(readOnly = true)
    fun state(tripId: String): TripStateDto {
        repository.findTrip(tripId) ?: throw NoSuchElementException("Trip not found.")
        return readState(tripId, includeCheckpoints = true)
    }

    @Transactional(readOnly = true)
    fun checkpoints(tripId: String): List<CheckpointSummaryDto> {
        val trip = repository.findTrip(tripId) ?: throw NoSuchElementException("Trip not found.")
        return repository.findCheckpoints(trip.id)
    }

    @Transactional
    fun rollbackCheckpoint(checkpointId: String): TripStateDto {
        val checkpoint = repository.findCheckpoint(checkpointId) ?: throw NoSuchElementException("Checkpoint not found.")
        repository.findTrip(checkpoint.tripId) ?: throw NoSuchElementException("Trip not found.")

        val beforeRollback = snapshot(checkpoint.tripId)
        val rollbackState = objectMapper.readValue<TripStateDto>(checkpoint.beforeStateJson)
        stateRestorer.restore(rollbackState)
        val afterRollback = snapshot(checkpoint.tripId)

        recordCheckpoint(
            tripId = checkpoint.tripId,
            label = "변경 되돌리기",
            reason = checkpoint.label ?: checkpoint.reason ?: "이전 체크포인트로 복원",
            source = "rollback",
            beforeState = beforeRollback,
            afterState = afterRollback,
            operations = listOf(mapOf("type" to "rollback_checkpoint", "checkpointId" to checkpoint.id)),
        )

        return readState(checkpoint.tripId, includeCheckpoints = true)
    }

    @Transactional
    fun applyOperations(tripId: String, request: ApplyOperationsRequest): ApplyOperationsResponse {
        repository.findTrip(tripId) ?: throw NoSuchElementException("Trip not found.")
        require(request.operations.size <= 30) { "Operation batch is too large." }

        if (request.operations.isEmpty()) {
            return ApplyOperationsResponse(
                state = readState(tripId, includeCheckpoints = true),
                checkpoint = null,
            )
        }

        val beforeState = snapshot(tripId)
        val now = clockProvider.nowText()
        request.operations.forEach { operation ->
            operationApplier.apply(tripId = tripId, operation = operation, now = now)
        }
        val afterState = snapshot(tripId)
        val checkpoint = recordCheckpoint(
            tripId = tripId,
            label = "AI 변경 적용",
            reason = request.reason?.takeIf { it.isNotBlank() } ?: "Operation batch",
            source = request.source.takeIf { it.isNotBlank() } ?: "ai",
            beforeState = beforeState,
            afterState = afterState,
            operations = request.operations,
        )

        return ApplyOperationsResponse(
            state = readState(tripId, includeCheckpoints = true),
            checkpoint = checkpoint,
        )
    }

    private fun readState(tripId: String, includeCheckpoints: Boolean): TripStateDto {
        val trip = repository.findTrip(tripId) ?: throw NoSuchElementException("Trip not found.")
        return TripStateDto(
            trip = trip,
            days = repository.findDays(tripId),
            places = placeRepository.findPlaces(tripId),
            itineraryItems = itemRepository.findItineraryItems(tripId),
            latestCheckpoint = if (includeCheckpoints) repository.latestCheckpoint(tripId) else null,
            checkpoints = if (includeCheckpoints) repository.findCheckpoints(tripId) else emptyList(),
        )
    }

    @Transactional
    fun addItem(dayId: String, request: UpsertItineraryItemRequest): ItineraryItemDto {
        validateItemRequest(request)
        val tripId = repository.findTripIdByDay(dayId) ?: throw NoSuchElementException("Trip day not found.")
        val beforeState = snapshot(tripId)
        val now = clockProvider.nowText()
        val item = ItineraryItemDto(
            id = "item_${UUID.randomUUID()}",
            tripDayId = dayId,
            placeId = null,
            type = request.type?.trim().takeUnless { it.isNullOrEmpty() } ?: "custom",
            title = request.title.trim(),
            category = request.category?.trim().takeUnless { it.isNullOrEmpty() },
            timeText = request.timeText?.trim().takeUnless { it.isNullOrEmpty() },
            durationMinutes = request.durationMinutes,
            memo = request.memo?.trim().takeUnless { it.isNullOrEmpty() },
            lat = request.lat,
            lng = request.lng,
            sortOrder = itemRepository.nextItemSortOrder(dayId),
            locked = false,
            rawJson = "{}",
            createdAt = now,
            updatedAt = now,
        )
        itemRepository.insertItem(item)
        val afterState = snapshot(tripId)
        recordCheckpoint(
            tripId = tripId,
            label = "일정 추가",
            reason = item.title,
            source = "manual",
            beforeState = beforeState,
            afterState = afterState,
            operations = listOf(mapOf("type" to "add_item", "itemId" to item.id)),
        )
        return item
    }

    @Transactional
    fun updateItem(itemId: String, request: UpsertItineraryItemRequest): ItineraryItemDto {
        validateItemRequest(request)
        val tripId = itemRepository.findTripIdByItem(itemId) ?: throw NoSuchElementException("Itinerary item not found.")
        val beforeState = snapshot(tripId)
        val item = itemRepository.updateItem(itemId, request, clockProvider.nowText())
        val afterState = snapshot(tripId)
        recordCheckpoint(
            tripId = tripId,
            label = "일정 수정",
            reason = item.title,
            source = "manual",
            beforeState = beforeState,
            afterState = afterState,
            operations = listOf(mapOf("type" to "update_item", "itemId" to item.id)),
        )
        return item
    }

    @Transactional
    fun deleteItem(itemId: String) {
        val tripId = itemRepository.findTripIdByItem(itemId) ?: throw NoSuchElementException("Itinerary item not found.")
        val item = itemRepository.findItem(itemId) ?: throw NoSuchElementException("Itinerary item not found.")
        val beforeState = snapshot(tripId)
        itemRepository.deleteItem(itemId)
        val afterState = snapshot(tripId)
        recordCheckpoint(
            tripId = tripId,
            label = "일정 삭제",
            reason = item.title,
            source = "manual",
            beforeState = beforeState,
            afterState = afterState,
            operations = listOf(mapOf("type" to "delete_item", "itemId" to item.id)),
        )
    }

    @Transactional
    fun addPlace(tripId: String, request: UpsertPlaceRequest): PlaceDto {
        validatePlaceRequest(request)
        repository.findTrip(tripId) ?: throw NoSuchElementException("Trip not found.")
        val beforeState = snapshot(tripId)
        val now = clockProvider.nowText()
        val place = PlaceDto(
            id = "place_${UUID.randomUUID()}",
            tripId = tripId,
            name = request.name.trim(),
            category = request.category?.trim().takeUnless { it.isNullOrEmpty() },
            rating = null,
            reviews = null,
            note = request.note?.trim().takeUnless { it.isNullOrEmpty() },
            address = request.address?.trim().takeUnless { it.isNullOrEmpty() },
            source = request.source?.trim().takeUnless { it.isNullOrEmpty() } ?: "manual",
            sourceUrl = request.sourceUrl?.trim().takeUnless { it.isNullOrEmpty() },
            imageUrl = request.imageUrl?.trim().takeUnless { it.isNullOrEmpty() },
            lat = request.lat,
            lng = request.lng,
            status = if (request.lat != null && request.lng != null) "ready" else "needs_coordinates",
            rawJson = objectMapper.writeValueAsString(request),
            createdAt = now,
            updatedAt = now,
        )
        placeRepository.insertPlace(place)
        val afterState = snapshot(tripId)
        recordCheckpoint(
            tripId = tripId,
            label = "조사 장소 추가",
            reason = place.name,
            source = "manual",
            beforeState = beforeState,
            afterState = afterState,
            operations = listOf(mapOf("type" to "create_place", "placeId" to place.id)),
        )
        return place
    }

    @Transactional
    fun updatePlace(placeId: String, request: UpsertPlaceRequest): PlaceDto {
        validatePlaceRequest(request)
        val existing = placeRepository.findPlace(placeId) ?: throw NoSuchElementException("Place not found.")
        val beforeState = snapshot(existing.tripId)
        val place = placeRepository.updatePlace(placeId, request, clockProvider.nowText())
        val afterState = snapshot(existing.tripId)
        recordCheckpoint(
            tripId = existing.tripId,
            label = "조사 장소 수정",
            reason = place.name,
            source = "manual",
            beforeState = beforeState,
            afterState = afterState,
            operations = listOf(mapOf("type" to "update_place", "placeId" to place.id)),
        )
        return place
    }

    @Transactional
    fun deletePlace(placeId: String) {
        val place = placeRepository.findPlace(placeId) ?: throw NoSuchElementException("Place not found.")
        val beforeState = snapshot(place.tripId)
        placeRepository.deletePlace(placeId)
        val afterState = snapshot(place.tripId)
        recordCheckpoint(
            tripId = place.tripId,
            label = "조사 장소 삭제",
            reason = place.name,
            source = "manual",
            beforeState = beforeState,
            afterState = afterState,
            operations = listOf(mapOf("type" to "delete_place", "placeId" to place.id)),
        )
    }

    private fun validateDayShrink(tripId: String, startDate: LocalDate?, endDate: LocalDate?) {
        if (startDate == null || endDate == null) return

        val dayCount = ChronoUnit.DAYS.between(startDate, endDate).toInt() + 1
        val existingDayCount = repository.findDays(tripId).size
        if (existingDayCount <= dayCount) return

        val itemCount = itemRepository.countItemsAfterDay(tripId, dayCount)
        require(itemCount == 0) {
            "Cannot shorten the trip because ${itemCount} itinerary item(s) exist in removed days."
        }
    }

    private fun snapshot(tripId: String): TripStateDto = readState(tripId, includeCheckpoints = false)

    private fun recordCheckpoint(
        tripId: String,
        label: String,
        reason: String,
        source: String,
        beforeState: TripStateDto,
        afterState: TripStateDto,
        operations: TripOperations,
    ): CheckpointSummaryDto {
        val checkpoint = CheckpointRecordDto(
            id = "checkpoint_${UUID.randomUUID()}",
                tripId = tripId,
                label = label,
                reason = reason,
                source = source,
                beforeStateJson = objectMapper.writeValueAsString(beforeState),
                afterStateJson = objectMapper.writeValueAsString(afterState),
                operationsJson = objectMapper.writeValueAsString(operations),
                createdAt = clockProvider.nowText(),
        )
        repository.insertCheckpoint(checkpoint)
        return CheckpointSummaryDto(
            id = checkpoint.id,
            label = checkpoint.label,
            reason = checkpoint.reason,
            source = checkpoint.source,
            createdAt = checkpoint.createdAt,
        )
    }

    private fun validateItemRequest(request: UpsertItineraryItemRequest) {
        require(request.title.trim().isNotEmpty()) { "Itinerary item title must not be blank." }
    }

    private fun validatePlaceRequest(request: UpsertPlaceRequest) {
        require(request.name.trim().isNotEmpty()) { "Place name must not be blank." }
    }
}
