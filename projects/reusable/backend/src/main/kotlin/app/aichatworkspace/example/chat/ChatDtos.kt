package app.aichatworkspace.example.chat

data class ChatSessionDto(
    val id: String,
    val dataSpaceId: String,
    val title: String,
    val provider: String,
    val model: String?,
    val status: String,
    val settingsJson: String,
    val createdAt: String,
    val updatedAt: String,
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

data class AiEditRunSummaryDto(
    val id: String,
    val dataSpaceId: String,
    val chatSessionId: String?,
    val provider: String,
    val model: String?,
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

data class ChatSessionDetailDto(
    val session: ChatSessionDto,
    val messages: List<ChatMessageDto>,
    val editRuns: List<AiEditRunSummaryDto>,
)

data class CreateChatMessageRequest(
    val content: String,
)

data class CreateChatMessageResponse(
    val runId: String,
    val userMessage: ChatMessageDto,
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

