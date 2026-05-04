package app.tripplanner.setup

data class SetupAssistantRequest(
    val content: String,
    val draftTrip: DraftTripDto,
    val messages: List<SetupAssistantMessageDto> = emptyList(),
)

data class DraftTripDto(
    val title: String? = null,
    val destinationName: String? = null,
    val destinationLat: Double? = null,
    val destinationLng: Double? = null,
    val startDate: String? = null,
    val endDate: String? = null,
    val timezone: String? = null,
)

data class SetupAssistantMessageDto(
    val role: String,
    val content: String,
)

data class SetupAssistantActionDto(
    val type: String,
    val title: String? = null,
    val destinationName: String? = null,
    val destinationLat: Double? = null,
    val destinationLng: Double? = null,
    val startDate: String? = null,
    val endDate: String? = null,
    val reason: String? = null,
)

data class SetupAssistantResponse(
    val message: SetupAssistantMessageDto,
    val actions: List<SetupAssistantActionDto> = emptyList(),
)
