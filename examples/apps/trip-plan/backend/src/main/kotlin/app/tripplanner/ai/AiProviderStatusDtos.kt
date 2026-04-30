package app.tripplanner.ai

data class AiProviderStatusDto(
    val id: String,
    val displayName: String,
    val available: Boolean,
    val status: String,
    val detail: String?,
    val checks: List<AiProviderCheckDto> = emptyList(),
)

data class AiProviderCheckDto(
    val label: String,
    val status: String,
    val detail: String?,
)
