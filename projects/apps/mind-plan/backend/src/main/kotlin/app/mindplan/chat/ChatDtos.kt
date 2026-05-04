package app.mindplan.chat

import app.mindplan.ai.AiOperation
import jakarta.validation.constraints.NotBlank

data class ChatSessionDto(
    val id: String,
    val planId: String,
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

data class AiEditRunDto(
    val id: String,
    val planId: String,
    val chatSessionId: String,
    val provider: String,
    val model: String?,
    val userMessageId: String,
    val assistantMessageId: String?,
    val operationsJson: String,
    val status: String,
    val error: String?,
    val checkpointId: String?,
    val durationMs: Long?,
    val createdAt: String,
)

data class ChatSessionDetailDto(
    val session: ChatSessionDto,
    val messages: List<ChatMessageDto>,
    val runs: List<AiEditRunDto>,
)

data class CreateChatSessionRequest(
    val title: String? = null,
    val provider: String? = null,
    val model: String? = null,
    val settingsJson: String? = null,
)

data class UpdateChatSessionRequest(
    @field:NotBlank val title: String,
)

data class SendChatMessageRequest(
    @field:NotBlank val content: String,
)

data class ChatRunStartedEvent(
    val type: String = "run_started",
    val runId: String,
    val message: String,
    val createdAt: String,
)

data class ChatRunDeltaEvent(
    val type: String = "assistant_delta",
    val runId: String,
    val delta: String,
    val createdAt: String,
)

data class ChatRunCompletedEvent(
    val type: String = "run_completed",
    val runId: String,
    val content: String,
    val operations: List<AiOperation>,
    val operationCount: Int,
    val checkpointId: String?,
    val durationMs: Long,
    val detail: ChatSessionDetailDto,
    val createdAt: String,
)

data class ChatRunFailedEvent(
    val type: String = "run_failed",
    val runId: String,
    val error: String,
    val createdAt: String,
)
