package app.tripplanner.trip

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.springframework.stereotype.Component
import java.util.Locale
import java.util.UUID

@Component
class TripOperationApplier(
    private val repository: TripRepository,
    private val itemRepository: TripItemRepository,
    private val placeRepository: TripPlaceRepository,
) {
    private val objectMapper = jacksonObjectMapper()

    fun apply(tripId: String, operation: TripOperation, now: String) {
        when (operation.string("op")) {
            "upsert_place" -> applyUpsertPlace(tripId, operation, now)
            "add_item" -> applyAddItem(tripId, operation, now)
            "update_item" -> applyUpdateItem(tripId, operation, now)
            "move_item" -> applyMoveItem(tripId, operation, now)
            "delete_item" -> applyDeleteItem(tripId, operation)
            "reorder_day" -> applyReorderDay(tripId, operation, now)
            "replace_day_plan" -> applyReplaceDayPlan(tripId, operation, now)
            else -> throw IllegalArgumentException("Unknown operation: ${operation["op"]}")
        }
    }

    private fun applyUpsertPlace(tripId: String, operation: TripOperation, now: String): PlaceDto {
        val payload = operation.mapOrNull("place") ?: operation
        return createPlaceFromPayload(tripId = tripId, payload = payload, now = now)
    }

    private fun applyAddItem(tripId: String, operation: TripOperation, now: String): ItineraryItemDto {
        val day = repository.findDayByNumber(tripId, operation.int("day"))
            ?: throw NoSuchElementException("Trip day not found.")
        val itemPayload = operation.map("item")
        itemPayload.stringOrNull("placeId")?.let { placeId -> requirePlaceOwnedByTrip(placeId, tripId) }
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
            sortOrder = itemRepository.nextItemSortOrder(day.id),
            locked = false,
            rawJson = "{}",
            createdAt = now,
            updatedAt = now,
        )
        require(item.title.isNotBlank()) { "Itinerary item title must not be blank." }
        itemRepository.insertItem(item)
        return item
    }

    private fun createPlaceFromPayload(tripId: String, payload: TripOperation, now: String): PlaceDto {
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
        placeRepository.insertPlace(place)
        return place
    }

    private fun reusablePlace(tripId: String, payload: TripOperation, name: String): PlaceDto? {
        val normalizedName = normalizePlaceName(name)
        val lat = payload.doubleOrNull("lat")
        val lng = payload.doubleOrNull("lng")
        return placeRepository.findPlaces(tripId).firstOrNull { place ->
            val sameName = normalizePlaceName(place.name) == normalizedName
            val sameCoordinate = lat != null && lng != null && place.lat != null && place.lng != null &&
                coordinateDistanceMeters(lat, lng, place.lat, place.lng) <= 80.0
            sameName || sameCoordinate
        }
    }

    private fun TripOperation.toImplicitPlacePayload(): TripOperation? {
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

    private fun applyUpdateItem(tripId: String, operation: TripOperation, now: String) {
        val itemId = operation.string("itemId")
        val existing = itemRepository.findItem(itemId) ?: throw NoSuchElementException("Itinerary item not found.")
        requireItemOwnedByTrip(itemId, tripId)
        require(!existing.locked || operation.booleanOrNull("unlock") == true) { "Locked item cannot be updated." }

        val patch = operation.map("patch")
        itemRepository.updateItem(
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

    private fun applyMoveItem(tripId: String, operation: TripOperation, now: String) {
        val itemId = operation.string("itemId")
        val item = itemRepository.findItem(itemId) ?: throw NoSuchElementException("Itinerary item not found.")
        requireItemOwnedByTrip(itemId, tripId)
        require(!item.locked || operation.booleanOrNull("unlock") == true) { "Locked item cannot be moved." }
        val targetDay = repository.findDayByNumber(tripId, operation.int("toDay"))
            ?: throw NoSuchElementException("Trip day not found.")
        val toIndex = (operation.intOrNull("toIndex") ?: Int.MAX_VALUE).coerceAtLeast(1)

        val targetItems = itemRepository.findItemsByDay(targetDay.id)
            .filterNot { it.id == itemId }
            .toMutableList()
        val insertIndex = (toIndex - 1).coerceIn(0, targetItems.size)
        targetItems.add(insertIndex, item.copy(tripDayId = targetDay.id))

        itemRepository.updateItemDayAndSort(itemId, targetDay.id, insertIndex + 1, now)
        normalizeDayOrder(targetDay.id, targetItems.map { it.id }, now)
        if (item.tripDayId != targetDay.id) {
            normalizeDayOrder(item.tripDayId, itemRepository.findItemsByDay(item.tripDayId).map { it.id }, now)
        }
    }

    private fun applyDeleteItem(tripId: String, operation: TripOperation) {
        val item = itemRepository.findItem(operation.string("itemId")) ?: throw NoSuchElementException("Itinerary item not found.")
        requireItemOwnedByTrip(item.id, tripId)
        require(!item.locked || operation.booleanOrNull("unlock") == true) { "Locked item cannot be deleted." }
        itemRepository.deleteItem(item.id)
    }

    private fun applyReorderDay(tripId: String, operation: TripOperation, now: String) {
        val day = repository.findDayByNumber(tripId, operation.int("day"))
            ?: throw NoSuchElementException("Trip day not found.")
        val current = itemRepository.findItemsByDay(day.id)
        val requested = operation.stringList("itemIds")
        val unknown = requested - current.map { it.id }.toSet()
        require(unknown.isEmpty()) { "Unknown item ids: ${unknown.joinToString(", ")}" }

        val orderedIds = requested + current.map { it.id }.filterNot(requested::contains)
        normalizeDayOrder(day.id, orderedIds, now)
    }

    private fun applyReplaceDayPlan(tripId: String, operation: TripOperation, now: String) {
        val day = repository.findDayByNumber(tripId, operation.int("day"))
            ?: throw NoSuchElementException("Trip day not found.")
        val current = itemRepository.findItemsByDay(day.id)
        require(current.none { it.locked } || operation.booleanOrNull("unlock") == true) {
            "Locked items cannot be replaced."
        }

        val replacementItems = operation.mapList("items")
        replacementItems.validateReplacementItems()
        itemRepository.deleteItemsByDay(day.id)
        replacementItems.forEach { item ->
            applyAddItem(
                tripId = tripId,
                operation = mapOf("op" to "add_item", "day" to day.dayNumber, "item" to item),
                now = now,
            )
        }
    }

    private fun normalizeDayOrder(dayId: String, orderedIds: List<String>, now: String) {
        orderedIds.forEachIndexed { index, itemId ->
            itemRepository.updateItemSortOrder(itemId, index + 1, now)
        }
    }

    private fun requireItemOwnedByTrip(itemId: String, tripId: String) {
        val itemTripId = itemRepository.findTripIdByItem(itemId)
            ?: throw NoSuchElementException("Itinerary item not found.")
        require(itemTripId == tripId) { "Itinerary item does not belong to this trip." }
    }

    private fun requirePlaceOwnedByTrip(placeId: String, tripId: String) {
        val place = placeRepository.findPlace(placeId) ?: throw NoSuchElementException("Place not found.")
        require(place.tripId == tripId) { "Place does not belong to this trip." }
    }
}

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
