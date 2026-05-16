package app.tripplanner.trip

internal fun TripOperation.operationName(): String? =
    stringOrNull("op")

internal fun TripOperations.filterTripOperations(): TripOperations =
    filterNot { operation -> operation.operationName() == "set_chat_title" }

internal fun TripOperations.chatTitleOperationTitle(): String? =
    firstNotNullOfOrNull { operation ->
        if (operation.operationName() != "set_chat_title") {
            null
        } else {
            operation.stringOrNull("title")
                ?.replace(Regex("\\s+"), " ")
                ?.trim()
                ?.take(80)
                ?.takeIf(String::isNotBlank)
        }
    }

internal fun TripOperation.string(key: String): String =
    stringOrNull(key) ?: throw IllegalArgumentException("Missing required field: $key")

internal fun TripOperation.stringOrNull(key: String): String? =
    this[key]?.toString()?.takeIf { it.isNotBlank() }

internal fun TripOperation.int(key: String): Int =
    intOrNull(key) ?: throw IllegalArgumentException("Missing required integer field: $key")

internal fun TripOperation.intOrNull(key: String): Int? =
    when (val value = this[key]) {
        is Number -> value.toInt()
        is String -> value.toIntOrNull()
        else -> null
    }

internal fun TripOperation.doubleOrNull(key: String): Double? =
    when (val value = this[key]) {
        is Number -> value.toDouble()
        is String -> value.toDoubleOrNull()
        else -> null
    }

internal fun TripOperation.booleanOrNull(key: String): Boolean? =
    when (val value = this[key]) {
        is Boolean -> value
        is String -> value.toBooleanStrictOrNull()
        else -> null
    }

internal fun TripOperation.map(key: String): TripOperation =
    mapOrNull(key) ?: throw IllegalArgumentException("Missing required object field: $key")

@Suppress("UNCHECKED_CAST")
internal fun TripOperation.mapOrNull(key: String): TripOperation? =
    this[key] as? TripOperation

@Suppress("UNCHECKED_CAST")
internal fun TripOperation.mapList(key: String): TripOperations =
    (this[key] as? List<*>)
        ?.mapIndexed { index, item ->
            item as? TripOperation ?: throw IllegalArgumentException("Expected object at $key[$index].")
        }
        ?: throw IllegalArgumentException("Missing required list field: $key")

internal fun TripOperations.validateReplacementItems() {
    forEachIndexed { index, item ->
        val explicitPlace = item["place"]
        val placePayload = item.mapOrNull("place")
        require(explicitPlace == null || placePayload != null) { "Expected object at items[$index].place." }
        val title = item.stringOrNull("title")?.trim()
        val placeName = placePayload?.stringOrNull("name")?.trim()
        if (placePayload != null) {
            require(!placeName.isNullOrBlank()) { "Place name must not be blank at items[$index].place." }
        }
        require(!title.isNullOrBlank() || !placeName.isNullOrBlank()) {
            "Itinerary item title must not be blank at items[$index]."
        }
    }
}

internal fun TripOperation.stringList(key: String): List<String> =
    (this[key] as? List<*>)?.mapNotNull { it?.toString() }.orEmpty()

internal fun TripOperation.listSize(key: String): Int =
    (this[key] as? List<*>)?.size ?: 0

internal fun TripOperation?.hasCoordinateFields(): Boolean =
    this?.get("lat") != null && this["lng"] != null
