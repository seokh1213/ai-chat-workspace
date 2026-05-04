package app.aichatworkspace.example.ai

import kotlinx.coroutines.flow.Flow

data class AiChatRequest(
    val runId: String,
    val dataSpaceId: String,
    val chatSessionId: String,
    val content: String,
    val contextJson: String,
    val priorMessages: List<AiPriorMessage>,
    val model: String?,
    val providerSession: AiProviderSession?,
)

data class AiPriorMessage(
    val role: String,
    val content: String,
)

data class AiProviderSession(
    val externalThreadId: String?,
)

data class AiProviderActivity(
    val kind: String,
    val label: String,
    val detail: String? = null,
    val rawType: String? = null,
)

data class AiProviderResult(
    val message: String,
    val operations: List<Map<String, Any?>> = emptyList(),
    val externalThreadId: String? = null,
    val providerRunId: String? = null,
    val lastEventJson: String? = null,
)

sealed interface AiStreamEvent {
    data object RunStarted : AiStreamEvent
    data class Activity(val activity: AiProviderActivity) : AiStreamEvent
    data class MessageDelta(val content: String) : AiStreamEvent
    data class MessageCompleted(val content: String) : AiStreamEvent
    data class OperationsProposed(val operations: List<Map<String, Any?>>) : AiStreamEvent
    data class ResultCompleted(val result: AiProviderResult) : AiStreamEvent
    data object RunCompleted : AiStreamEvent
}

interface AiProvider {
    val id: String
    val displayName: String
    fun streamChat(request: AiChatRequest): Flow<AiStreamEvent>
    fun cancel(runId: String): Boolean = false
}

