package app.todoai

import jakarta.validation.constraints.NotBlank
import java.time.Instant

enum class TodoStatus {
    TODO,
    DOING,
    DONE,
}

enum class TodoPriority {
    LOW,
    MEDIUM,
    HIGH,
}

enum class ChatRole {
    USER,
    ASSISTANT,
}

enum class RunStatus {
    RUNNING,
    COMPLETED,
    FAILED,
}

enum class OperationType {
    ADD_TODO,
    UPDATE_TODO,
    COMPLETE_TODO,
    DELETE_TODO,
}

data class TodoItem(
    val id: String,
    val title: String,
    val description: String,
    val status: TodoStatus,
    val priority: TodoPriority,
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class TodoPatch(
    val title: String? = null,
    val description: String? = null,
    val status: TodoStatus? = null,
    val priority: TodoPriority? = null,
)

data class TodoOperation(
    val type: OperationType,
    val todoId: String? = null,
    val title: String? = null,
    val description: String? = null,
    val priority: TodoPriority? = null,
    val patch: TodoPatch? = null,
)

data class ChatMessage(
    val id: String,
    val role: ChatRole,
    val content: String,
    val operations: List<TodoOperation> = emptyList(),
    val durationMs: Long? = null,
    val createdAt: Instant,
)

data class Checkpoint(
    val id: String,
    val label: String,
    val todoCount: Int,
    val createdAt: Instant,
)

data class WorkspaceDto(
    val id: String,
    val name: String,
    val aiProvider: String,
    val aiModel: String,
    val aiEffort: String,
    val codexUrl: String,
    val codexCwd: String?,
    val settingsJson: String,
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class CreateWorkspaceRequest(
    val name: String,
    val aiProvider: String? = null,
    val aiModel: String? = null,
    val aiEffort: String? = null,
    val codexUrl: String? = null,
    val codexCwd: String? = null,
)

data class UpdateWorkspaceRequest(
    val name: String? = null,
    val aiProvider: String? = null,
    val aiModel: String? = null,
    val aiEffort: String? = null,
    val codexUrl: String? = null,
    val codexCwd: String? = null,
)

data class AiActivity(
    val kind: String,
    val label: String,
    val detail: String? = null,
    val rawType: String? = null,
)

data class WorkspaceState(
    val workspace: WorkspaceDto,
    val todos: List<TodoItem>,
    val messages: List<ChatMessage>,
    val checkpoints: List<Checkpoint>,
)

data class SendMessageRequest(
    @field:NotBlank
    val content: String,
)

data class SendMessageResponse(
    val runId: String,
    val userMessage: ChatMessage,
)

data class CreateTodoRequest(
    @field:NotBlank
    val title: String,
    val description: String = "",
    val priority: TodoPriority = TodoPriority.MEDIUM,
)

data class ChatRunEvent(
    val type: String,
    val runId: String,
    val workspaceId: String? = null,
    val status: RunStatus? = null,
    val delta: String? = null,
    val content: String? = null,
    val message: ChatMessage? = null,
    val operations: List<TodoOperation> = emptyList(),
    val activity: AiActivity? = null,
    val state: WorkspaceState? = null,
    val error: String? = null,
    val createdAt: Instant = Instant.now(),
)
