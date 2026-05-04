package app.tripplanner.trip

import app.tripplanner.common.ClockProvider
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.format.TextStyle
import java.time.temporal.ChronoUnit
import java.util.Locale
import java.util.UUID

@Service
class TripService(
    private val repository: TripRepository,
    private val clockProvider: ClockProvider,
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
        defaultDays(trip, startDate, endDate, now).forEach(repository::insertDay)

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
        syncDays(trip, startDate, endDate, now)
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
        repository.restoreTripState(rollbackState)
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
            applyOperation(tripId = tripId, operation = operation, now = now)
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
            places = repository.findPlaces(tripId),
            itineraryItems = repository.findItineraryItems(tripId),
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
            sortOrder = repository.nextItemSortOrder(dayId),
            locked = false,
            rawJson = "{}",
            createdAt = now,
            updatedAt = now,
        )
        repository.insertItem(item)
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
        val tripId = repository.findTripIdByItem(itemId) ?: throw NoSuchElementException("Itinerary item not found.")
        val beforeState = snapshot(tripId)
        val item = repository.updateItem(itemId, request, clockProvider.nowText())
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
        val tripId = repository.findTripIdByItem(itemId) ?: throw NoSuchElementException("Itinerary item not found.")
        val item = repository.findItem(itemId) ?: throw NoSuchElementException("Itinerary item not found.")
        val beforeState = snapshot(tripId)
        repository.deleteItem(itemId)
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
        repository.insertPlace(place)
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
        val existing = repository.findPlace(placeId) ?: throw NoSuchElementException("Place not found.")
        val beforeState = snapshot(existing.tripId)
        val place = repository.updatePlace(placeId, request, clockProvider.nowText())
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
        val place = repository.findPlace(placeId) ?: throw NoSuchElementException("Place not found.")
        val beforeState = snapshot(place.tripId)
        repository.deletePlace(placeId)
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

    private fun defaultDays(trip: TripDto, startDate: LocalDate?, endDate: LocalDate?, now: String): List<TripDayDto> {
        val dayCount = when {
            startDate != null && endDate != null -> ChronoUnit.DAYS.between(startDate, endDate).toInt() + 1
            else -> 1
        }.coerceIn(1, 30)

        return (1..dayCount).map { dayNumber ->
            val date = startDate?.plusDays((dayNumber - 1).toLong())
            newDay(trip.id, dayNumber, date, now)
        }
    }

    private fun syncDays(trip: TripDto, startDate: LocalDate?, endDate: LocalDate?, now: String) {
        val dayCount = when {
            startDate != null && endDate != null -> ChronoUnit.DAYS.between(startDate, endDate).toInt() + 1
            else -> repository.findDays(trip.id).size.coerceAtLeast(1)
        }.coerceIn(1, 30)

        val existingDays = repository.findDays(trip.id)
        existingDays.take(dayCount).forEach { day ->
            val date = startDate?.plusDays((day.dayNumber - 1).toLong())
            repository.updateDayDate(
                day.copy(
                    dateText = date?.toString(),
                    weekday = date?.dayOfWeek?.koreanName(),
                    title = "Day ${day.dayNumber}",
                    sortOrder = day.dayNumber,
                    updatedAt = now,
                ),
            )
        }

        if (existingDays.size < dayCount) {
            ((existingDays.size + 1)..dayCount)
                .map { dayNumber -> newDay(trip.id, dayNumber, startDate?.plusDays((dayNumber - 1).toLong()), now) }
                .forEach(repository::insertDay)
        }

        if (existingDays.size > dayCount) {
            repository.deleteDaysAfter(trip.id, dayCount)
        }
    }

    private fun applyOperation(tripId: String, operation: Map<String, Any?>, now: String) {
        when (operation.string("op")) {
            "upsert_place" -> applyUpsertPlace(tripId, operation, now)
            "add_item" -> applyAddItem(tripId, operation, now)
            "update_item" -> applyUpdateItem(operation, now)
            "move_item" -> applyMoveItem(tripId, operation, now)
            "delete_item" -> applyDeleteItem(operation)
            "reorder_day" -> applyReorderDay(tripId, operation, now)
            "replace_day_plan" -> applyReplaceDayPlan(tripId, operation, now)
            else -> throw IllegalArgumentException("Unknown operation: ${operation["op"]}")
        }
    }

    private fun applyUpsertPlace(tripId: String, operation: Map<String, Any?>, now: String): PlaceDto {
        val payload = operation.mapOrNull("place") ?: operation
        return createPlaceFromPayload(tripId = tripId, payload = payload, now = now)
    }

    private fun applyAddItem(tripId: String, operation: Map<String, Any?>, now: String): ItineraryItemDto {
        val day = repository.findDayByNumber(tripId, operation.int("day"))
            ?: throw NoSuchElementException("Trip day not found.")
        val itemPayload = operation.map("item")
        val placePayload = itemPayload.mapOrNull("place") ?: itemPayload.toImplicitPlacePayload()
        val place = placePayload
            ?.let { payload -> createPlaceFromPayload(tripId = tripId, payload = payload, now = now) }
        val item = ItineraryItemDto(
            id = "item_${UUID.randomUUID()}",
            tripDayId = day.id,
            placeId = place?.id ?: itemPayload.stringOrNull("placeId"),
            type = itemPayload.stringOrNull("type") ?: "custom",
            title = itemPayload.stringOrNull("title")?.trim() ?: place?.name ?: "",
            category = itemPayload.stringOrNull("category") ?: place?.category,
            timeText = itemPayload.stringOrNull("time") ?: itemPayload.stringOrNull("timeText"),
            durationMinutes = itemPayload.intOrNull("durationMinutes"),
            memo = itemPayload.stringOrNull("memo") ?: place?.note,
            lat = itemPayload.doubleOrNull("lat") ?: place?.lat,
            lng = itemPayload.doubleOrNull("lng") ?: place?.lng,
            sortOrder = repository.nextItemSortOrder(day.id),
            locked = false,
            rawJson = "{}",
            createdAt = now,
            updatedAt = now,
        )
        require(item.title.isNotBlank()) { "Itinerary item title must not be blank." }
        repository.insertItem(item)
        return item
    }

    private fun createPlaceFromPayload(tripId: String, payload: Map<String, Any?>, now: String): PlaceDto {
        val name = payload.string("name").trim()
        require(name.isNotBlank()) { "Place name must not be blank." }
        reusablePlace(tripId = tripId, payload = payload, name = name)?.let { return it }

        val place = PlaceDto(
            id = "place_${UUID.randomUUID()}",
            tripId = tripId,
            name = name,
            category = payload.stringOrNull("category"),
            rating = null,
            reviews = null,
            note = payload.stringOrNull("note"),
            address = payload.stringOrNull("address"),
            source = payload.stringOrNull("source") ?: "ai",
            sourceUrl = payload.stringOrNull("sourceUrl"),
            imageUrl = null,
            lat = payload.doubleOrNull("lat"),
            lng = payload.doubleOrNull("lng"),
            status = if (payload.doubleOrNull("lat") != null && payload.doubleOrNull("lng") != null) "ready" else "needs_coordinates",
            rawJson = objectMapper.writeValueAsString(payload),
            createdAt = now,
            updatedAt = now,
        )
        repository.insertPlace(place)
        return place
    }

    private fun reusablePlace(tripId: String, payload: Map<String, Any?>, name: String): PlaceDto? {
        val normalizedName = normalizePlaceName(name)
        val lat = payload.doubleOrNull("lat")
        val lng = payload.doubleOrNull("lng")
        return repository.findPlaces(tripId).firstOrNull { place ->
            val sameName = normalizePlaceName(place.name) == normalizedName
            val sameCoordinate = lat != null && lng != null && place.lat != null && place.lng != null &&
                coordinateDistanceMeters(lat, lng, place.lat, place.lng) <= 80.0
            sameName || sameCoordinate
        }
    }

    private fun Map<String, Any?>.toImplicitPlacePayload(): Map<String, Any?>? {
        if (stringOrNull("placeId") != null) return null

        val title = stringOrNull("title")?.trim().orEmpty()
        val itemType = stringOrNull("type") ?: "custom"
        val hasCoordinates = doubleOrNull("lat") != null && doubleOrNull("lng") != null
        val looksLikePlace = itemType in setOf("poi", "meal", "transport") || hasCoordinates
        if (title.isBlank() || !looksLikePlace) return null

        return mapOf(
            "name" to title,
            "category" to (stringOrNull("category") ?: when (itemType) {
                "meal" -> "restaurant"
                "transport" -> "transport"
                else -> "other"
            }),
            "address" to null,
            "note" to stringOrNull("memo"),
            "lat" to doubleOrNull("lat"),
            "lng" to doubleOrNull("lng"),
            "source" to "ai",
            "sourceUrl" to null,
        )
    }

    private fun applyUpdateItem(operation: Map<String, Any?>, now: String) {
        val itemId = operation.string("itemId")
        val existing = repository.findItem(itemId) ?: throw NoSuchElementException("Itinerary item not found.")
        require(!existing.locked || operation.booleanOrNull("unlock") == true) { "Locked item cannot be updated." }

        val patch = operation.map("patch")
        repository.updateItem(
            itemId = itemId,
            request = UpsertItineraryItemRequest(
                title = patch.stringOrNull("title") ?: existing.title,
                type = patch.stringOrNull("type") ?: existing.type,
                category = patch.stringOrNull("category") ?: existing.category,
                timeText = patch.stringOrNull("time") ?: patch.stringOrNull("timeText") ?: existing.timeText,
                durationMinutes = patch.intOrNull("durationMinutes") ?: existing.durationMinutes,
                memo = patch.stringOrNull("memo") ?: existing.memo,
                lat = patch.doubleOrNull("lat") ?: existing.lat,
                lng = patch.doubleOrNull("lng") ?: existing.lng,
            ),
            updatedAt = now,
        )
    }

    private fun applyMoveItem(tripId: String, operation: Map<String, Any?>, now: String) {
        val itemId = operation.string("itemId")
        val item = repository.findItem(itemId) ?: throw NoSuchElementException("Itinerary item not found.")
        require(!item.locked || operation.booleanOrNull("unlock") == true) { "Locked item cannot be moved." }
        val targetDay = repository.findDayByNumber(tripId, operation.int("toDay"))
            ?: throw NoSuchElementException("Trip day not found.")
        val toIndex = (operation.intOrNull("toIndex") ?: Int.MAX_VALUE).coerceAtLeast(1)

        val targetItems = repository.findItemsByDay(targetDay.id)
            .filterNot { it.id == itemId }
            .toMutableList()
        val insertIndex = (toIndex - 1).coerceIn(0, targetItems.size)
        targetItems.add(insertIndex, item.copy(tripDayId = targetDay.id))

        repository.updateItemDayAndSort(itemId, targetDay.id, insertIndex + 1, now)
        normalizeDayOrder(targetDay.id, targetItems.map { it.id }, now)
        if (item.tripDayId != targetDay.id) {
            normalizeDayOrder(item.tripDayId, repository.findItemsByDay(item.tripDayId).map { it.id }, now)
        }
    }

    private fun applyDeleteItem(operation: Map<String, Any?>) {
        val item = repository.findItem(operation.string("itemId")) ?: throw NoSuchElementException("Itinerary item not found.")
        require(!item.locked || operation.booleanOrNull("unlock") == true) { "Locked item cannot be deleted." }
        repository.deleteItem(item.id)
    }

    private fun applyReorderDay(tripId: String, operation: Map<String, Any?>, now: String) {
        val day = repository.findDayByNumber(tripId, operation.int("day"))
            ?: throw NoSuchElementException("Trip day not found.")
        val current = repository.findItemsByDay(day.id)
        val requested = operation.stringList("itemIds")
        val unknown = requested - current.map { it.id }.toSet()
        require(unknown.isEmpty()) { "Unknown item ids: ${unknown.joinToString(", ")}" }

        val orderedIds = requested + current.map { it.id }.filterNot(requested::contains)
        normalizeDayOrder(day.id, orderedIds, now)
    }

    private fun applyReplaceDayPlan(tripId: String, operation: Map<String, Any?>, now: String) {
        val day = repository.findDayByNumber(tripId, operation.int("day"))
            ?: throw NoSuchElementException("Trip day not found.")
        val current = repository.findItemsByDay(day.id)
        require(current.none { it.locked } || operation.booleanOrNull("unlock") == true) {
            "Locked items cannot be replaced."
        }

        repository.deleteItemsByDay(day.id)
        operation.mapList("items").forEach { item ->
            applyAddItem(
                tripId = tripId,
                operation = mapOf("op" to "add_item", "day" to day.dayNumber, "item" to item),
                now = now,
            )
        }
    }

    private fun normalizeDayOrder(dayId: String, orderedIds: List<String>, now: String) {
        orderedIds.forEachIndexed { index, itemId ->
            repository.updateItemSortOrder(itemId, index + 1, now)
        }
    }

    private fun validateDayShrink(tripId: String, startDate: LocalDate?, endDate: LocalDate?) {
        if (startDate == null || endDate == null) return

        val dayCount = ChronoUnit.DAYS.between(startDate, endDate).toInt() + 1
        val existingDayCount = repository.findDays(tripId).size
        if (existingDayCount <= dayCount) return

        val itemCount = repository.countItemsAfterDay(tripId, dayCount)
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
        operations: List<Map<String, Any?>>,
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

    private fun newDay(tripId: String, dayNumber: Int, date: LocalDate?, now: String): TripDayDto =
        TripDayDto(
            id = "day_${UUID.randomUUID()}",
            tripId = tripId,
            dayNumber = dayNumber,
            dateText = date?.toString(),
            weekday = date?.dayOfWeek?.koreanName(),
            title = "Day $dayNumber",
            sortOrder = dayNumber,
            createdAt = now,
            updatedAt = now,
        )

    private fun validateItemRequest(request: UpsertItineraryItemRequest) {
        require(request.title.trim().isNotEmpty()) { "Itinerary item title must not be blank." }
    }

    private fun validatePlaceRequest(request: UpsertPlaceRequest) {
        require(request.name.trim().isNotEmpty()) { "Place name must not be blank." }
    }
}

private fun DayOfWeek.koreanName(): String = getDisplayName(TextStyle.SHORT, Locale.KOREAN)

private fun normalizePlaceName(value: String): String =
    value.lowercase(Locale.ROOT)
        .replace(Regex("[\\s·・,._()\\[\\]{}'\"`-]+"), "")

private fun coordinateDistanceMeters(
    latA: Double,
    lngA: Double,
    latB: Double,
    lngB: Double,
): Double {
    val latMeters = (latA - latB) * 111_320.0
    val lngMeters = (lngA - lngB) * 111_320.0 * kotlin.math.cos(Math.toRadians((latA + latB) / 2.0))
    return kotlin.math.hypot(latMeters, lngMeters)
}

private fun Map<String, Any?>.string(key: String): String =
    stringOrNull(key) ?: throw IllegalArgumentException("Missing required field: $key")

private fun Map<String, Any?>.stringOrNull(key: String): String? =
    this[key]?.toString()?.takeIf { it.isNotBlank() }

private fun Map<String, Any?>.int(key: String): Int =
    intOrNull(key) ?: throw IllegalArgumentException("Missing required integer field: $key")

private fun Map<String, Any?>.intOrNull(key: String): Int? =
    when (val value = this[key]) {
        is Number -> value.toInt()
        is String -> value.toIntOrNull()
        else -> null
    }

private fun Map<String, Any?>.doubleOrNull(key: String): Double? =
    when (val value = this[key]) {
        is Number -> value.toDouble()
        is String -> value.toDoubleOrNull()
        else -> null
    }

private fun Map<String, Any?>.booleanOrNull(key: String): Boolean? =
    when (val value = this[key]) {
        is Boolean -> value
        is String -> value.toBooleanStrictOrNull()
        else -> null
    }

private fun Map<String, Any?>.map(key: String): Map<String, Any?> =
    mapOrNull(key) ?: throw IllegalArgumentException("Missing required object field: $key")

@Suppress("UNCHECKED_CAST")
private fun Map<String, Any?>.mapOrNull(key: String): Map<String, Any?>? =
    this[key] as? Map<String, Any?>

@Suppress("UNCHECKED_CAST")
private fun Map<String, Any?>.mapList(key: String): List<Map<String, Any?>> =
    (this[key] as? List<*>)?.mapNotNull { it as? Map<String, Any?> }.orEmpty()

private fun Map<String, Any?>.stringList(key: String): List<String> =
    (this[key] as? List<*>)?.mapNotNull { it?.toString() }.orEmpty()
