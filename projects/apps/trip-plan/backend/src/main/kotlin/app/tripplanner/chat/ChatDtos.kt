package app.tripplanner.chat

import app.tripplanner.trip.CheckpointSummaryDto
import app.tripplanner.trip.TripStateDto

data class ChatSessionDto(
    val id: String,
    val tripId: String,
    val title: String,
    val provider: String,
    val model: String?,
    val status: String,
    val settingsJson: String,
    val createdAt: String,
    val updatedAt: String,
)

data class CreateChatSessionRequest(
    val title: String,
    val provider: String? = null,
    val model: String? = null,
)

data class UpdateChatSessionRequest(
    val title: String,
)

data class ChatMessageDto(
    val id: String,
    val chatSessionId: String,
    val role: String,
    val content: String,
    val status: String,
    val metadataJson: String,
    val createdAt: String,
)

data class CreateChatMessageRequest(
    val content: String,
)

data class ImportChatMessageDto(
    val role: String,
    val content: String,
    val durationMs: Long? = null,
    val appliedActions: List<String> = emptyList(),
)

data class ImportSetupChatSessionRequest(
    val title: String = "초안 설계",
    val messages: List<ImportChatMessageDto> = emptyList(),
)

data class ChatSessionDetailDto(
    val session: ChatSessionDto,
    val messages: List<ChatMessageDto>,
    val editRuns: List<AiEditRunSummaryDto> = emptyList(),
)

data class ChatMessagePairDto(
    val userMessage: ChatMessageDto,
    val assistantMessage: ChatMessageDto,
    val tripState: TripStateDto? = null,
    val checkpoint: CheckpointSummaryDto? = null,
    val editRun: AiEditRunSummaryDto? = null,
)

data class ChatMessageRunDto(
    val runId: String,
    val userMessage: ChatMessageDto,
)

data class AiEditRunDto(
    val id: String,
    val tripId: String,
    val chatSessionId: String?,
    val providerSessionId: String?,
    val provider: String,
    val model: String?,
    val providerRunId: String?,
    val userMessageId: String?,
    val assistantMessageId: String?,
    val operationsJson: String,
    val status: String,
    val error: String?,
    val checkpointId: String?,
    val durationMs: Long?,
    val createdAt: String,
)

data class AiEditRunSummaryDto(
    val id: String,
    val tripId: String,
    val chatSessionId: String?,
    val providerSessionId: String?,
    val provider: String,
    val model: String?,
    val providerRunId: String?,
    val userMessageId: String?,
    val assistantMessageId: String?,
    val status: String,
    val error: String?,
    val checkpointId: String?,
    val operationCount: Int,
    val operationPreview: List<String> = emptyList(),
    val durationMs: Long?,
    val createdAt: String,
)

data class ChatRunEventDto(
    val runId: String,
    val status: String,
    val provider: String,
    val model: String?,
    val operationCount: Int,
    val operationPreview: List<String> = emptyList(),
    val message: String?,
    val createdAt: String,
)

data class ChatRunActivityEventDto(
    val runId: String,
    val kind: String,
    val label: String,
    val detail: String?,
    val rawType: String?,
    val createdAt: String,
)

data class ChatMessageDeltaEventDto(
    val runId: String,
    val delta: String,
    val createdAt: String,
)

data class ChatMessageCompletedEventDto(
    val runId: String,
    val content: String,
    val createdAt: String,
)

data class CancelChatRunResponse(
    val runId: String?,
    val cancelled: Boolean,
    val message: String,
)
