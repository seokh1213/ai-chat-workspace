package app.tripplanner.ai

import app.tripplanner.trip.TripStateDto
import kotlinx.coroutines.flow.Flow
import org.springframework.stereotype.Component

data class AiChatRequest(
    val runId: String,
    val tripId: String,
    val chatSessionId: String,
    val content: String,
    val inputImages: List<AiInputImage> = emptyList(),
    val tripState: TripStateDto,
    val priorMessages: List<AiPriorMessage> = emptyList(),
    val model: String?,
    val effort: String?,
    val settingsJson: String,
    val providerSession: AiProviderSessionDto?,
)

data class AiInputImage(
    val fileName: String,
    val contentType: String,
    val localPath: String? = null,
    val url: String? = null,
)

data class AiPriorMessage(
    val role: String,
    val content: String,
)

data class AiProviderResult(
    val message: String,
    val operations: List<Map<String, Any?>>,
    val externalThreadId: String? = null,
    val providerRunId: String? = null,
    val lastEventJson: String? = null,
)

data class AiProviderActivity(
    val kind: String,
    val label: String,
    val detail: String? = null,
    val rawType: String? = null,
)

data class AiProviderSessionDto(
    val id: String,
    val chatSessionId: String,
    val provider: String,
    val externalThreadId: String?,
    val externalConversationId: String?,
    val status: String,
    val lastEventJson: String,
    val metadataJson: String,
    val createdAt: String,
    val updatedAt: String,
)

sealed interface AiStreamEvent {
    data object RunStarted : AiStreamEvent

    data class Activity(
        val activity: AiProviderActivity,
    ) : AiStreamEvent

    data class MessageDelta(
        val content: String,
    ) : AiStreamEvent

    data class OperationsProposed(
        val operations: List<Map<String, Any?>>,
    ) : AiStreamEvent

    data class MessageCompleted(
        val content: String,
    ) : AiStreamEvent

    data class ResultCompleted(
        val result: AiProviderResult,
    ) : AiStreamEvent

    data object RunCompleted : AiStreamEvent
}

interface AiProvider {
    val id: String
    val displayName: String
        get() = id
    val userVisible: Boolean
        get() = true

    fun streamChat(request: AiChatRequest): Flow<AiStreamEvent>

    fun cancel(runId: String): Boolean = false
}

@Component
class AiProviderRegistry(
    providers: List<AiProvider>,
) {
    private val providersById = providers.associateBy { it.id }

    fun requireProvider(id: String): AiProvider =
        providersById[id] ?: throw NoSuchElementException("AI provider not found: $id")

    fun providers(): List<AiProvider> = providersById.values.sortedBy { it.id }

    fun userVisibleProviders(): List<AiProvider> =
        providersById.values
            .filter(AiProvider::userVisible)
            .sortedBy { it.id }
}
