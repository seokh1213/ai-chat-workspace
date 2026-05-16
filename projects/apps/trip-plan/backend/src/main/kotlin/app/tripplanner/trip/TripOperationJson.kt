package app.tripplanner.trip

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue

internal fun ObjectMapper.readTripOperations(json: String): TripOperations =
    readValue(json)

internal fun ObjectMapper.readTripOperations(node: JsonNode): TripOperations =
    readTripOperations(node.toString())
