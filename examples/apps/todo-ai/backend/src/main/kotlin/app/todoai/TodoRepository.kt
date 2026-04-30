package app.todoai

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.springframework.stereotype.Component
import java.time.Instant
import java.util.UUID

@Component
class TodoRepository(
    private val codexDefaults: CodexAppServerProperties,
) {
    private val objectMapper = jacksonObjectMapper()
    private val workspaces = linkedMapOf<String, WorkspaceData>()

    init {
        createWorkspaceInternal(
            request = CreateWorkspaceRequest(
                name = "샘플 작업공간",
                aiProvider = "codex-app-server",
                aiModel = codexDefaults.model,
                aiEffort = codexDefaults.effort,
                codexUrl = codexDefaults.url,
                codexCwd = codexDefaults.cwd,
            ),
            seedTodos = true,
        )
    }

    @Synchronized
    fun workspaces(): List<WorkspaceDto> = workspaces.values.map { it.workspace }

    @Synchronized
    fun defaultWorkspaceId(): String = workspaces.keys.firstOrNull() ?: createWorkspaceInternal(
        request = CreateWorkspaceRequest(name = "샘플 작업공간"),
        seedTodos = true,
    ).id

    @Synchronized
    fun createWorkspace(request: CreateWorkspaceRequest): WorkspaceDto =
        createWorkspaceInternal(request = request, seedTodos = true)

    @Synchronized
    fun updateWorkspace(workspaceId: String, request: UpdateWorkspaceRequest): WorkspaceDto {
        val data = workspaceData(workspaceId)
        val current = data.workspace
        val updated = workspaceFrom(
            id = current.id,
            name = request.name ?: current.name,
            aiProvider = request.aiProvider ?: current.aiProvider,
            aiModel = request.aiModel ?: current.aiModel,
            aiEffort = request.aiEffort ?: current.aiEffort,
            codexUrl = request.codexUrl ?: current.codexUrl,
            codexCwd = request.codexCwd ?: current.codexCwd,
            createdAt = current.createdAt,
            updatedAt = Instant.now(),
        )
        data.workspace = updated
        data.checkpoints += data.checkpoint("워크스페이스 설정 수정")
        return updated
    }

    @Synchronized
    fun deleteWorkspace(workspaceId: String): Boolean {
        require(workspaces.size > 1) { "Cannot delete the last workspace." }
        return workspaces.remove(workspaceId) != null
    }

    @Synchronized
    fun state(workspaceId: String): WorkspaceState {
        val data = workspaceData(workspaceId)
        return data.state()
    }

    @Synchronized
    fun addUserMessage(workspaceId: String, content: String): ChatMessage {
        val data = workspaceData(workspaceId)
        val message = ChatMessage(
            id = newId("msg"),
            role = ChatRole.USER,
            content = content.trim(),
            createdAt = Instant.now(),
        )
        data.messages += message
        return message
    }

    @Synchronized
    fun addAssistantMessage(workspaceId: String, content: String, operations: List<TodoOperation>, durationMs: Long): ChatMessage {
        val data = workspaceData(workspaceId)
        val message = ChatMessage(
            id = newId("msg"),
            role = ChatRole.ASSISTANT,
            content = content.trim(),
            operations = operations,
            durationMs = durationMs,
            createdAt = Instant.now(),
        )
        data.messages += message
        return message
    }

    @Synchronized
    fun createTodo(workspaceId: String, request: CreateTodoRequest): TodoItem {
        val data = workspaceData(workspaceId)
        val now = Instant.now()
        val todo = TodoItem(
            id = newId("todo"),
            title = request.title.trim(),
            description = request.description.trim(),
            status = TodoStatus.TODO,
            priority = request.priority,
            createdAt = now,
            updatedAt = now,
        )
        data.todos[todo.id] = todo
        data.checkpoints += data.checkpoint("할일 직접 추가")
        return todo
    }

    @Synchronized
    fun updateTodo(workspaceId: String, id: String, patch: TodoPatch): TodoItem? {
        val data = workspaceData(workspaceId)
        val current = data.todos[id] ?: return null
        val updated = current.copy(
            title = patch.title?.trim()?.takeIf { it.isNotBlank() } ?: current.title,
            description = patch.description?.trim() ?: current.description,
            status = patch.status ?: current.status,
            priority = patch.priority ?: current.priority,
            updatedAt = Instant.now(),
        )
        data.todos[id] = updated
        data.checkpoints += data.checkpoint("할일 직접 수정")
        return updated
    }

    @Synchronized
    fun deleteTodo(workspaceId: String, id: String): Boolean {
        val data = workspaceData(workspaceId)
        val removed = data.todos.remove(id) != null
        if (removed) {
            data.checkpoints += data.checkpoint("할일 직접 삭제")
        }
        return removed
    }

    @Synchronized
    fun reset(workspaceId: String): WorkspaceState {
        val data = workspaceData(workspaceId)
        data.todos.clear()
        data.messages.clear()
        data.checkpoints.clear()
        seedWorkspaceData(data, reset = true)
        return data.state()
    }

    @Synchronized
    fun applyOperations(workspaceId: String, operations: List<TodoOperation>): List<TodoItem> {
        val data = workspaceData(workspaceId)
        val changed = operations.mapNotNull { operation ->
            when (operation.type) {
                OperationType.ADD_TODO -> {
                    val now = Instant.now()
                    val todo = TodoItem(
                        id = newId("todo"),
                        title = operation.title?.trim()?.takeIf { it.isNotBlank() } ?: "새 할일",
                        description = operation.description?.trim().orEmpty(),
                        status = TodoStatus.TODO,
                        priority = operation.priority ?: TodoPriority.MEDIUM,
                        createdAt = now,
                        updatedAt = now,
                    )
                    data.todos[todo.id] = todo
                    todo
                }

                OperationType.UPDATE_TODO -> data.updateTodoWithoutCheckpoint(operation.todoId, operation.patch)
                OperationType.COMPLETE_TODO -> data.updateTodoWithoutCheckpoint(operation.todoId, TodoPatch(status = TodoStatus.DONE))
                OperationType.DELETE_TODO -> {
                    val id = operation.todoId ?: return@mapNotNull null
                    data.todos.remove(id)
                }
            }
        }
        if (changed.isNotEmpty()) {
            data.checkpoints += data.checkpoint("AI 변경 적용")
        }
        return changed
    }

    private fun createWorkspaceInternal(request: CreateWorkspaceRequest, seedTodos: Boolean): WorkspaceDto {
        val now = Instant.now()
        val workspace = workspaceFrom(
            id = "workspace_${UUID.randomUUID()}",
            name = request.name,
            aiProvider = request.aiProvider,
            aiModel = request.aiModel,
            aiEffort = request.aiEffort,
            codexUrl = request.codexUrl,
            codexCwd = request.codexCwd,
            createdAt = now,
            updatedAt = now,
        )
        val data = WorkspaceData(workspace = workspace)
        workspaces[workspace.id] = data
        if (seedTodos) {
            seedWorkspaceData(data, reset = false)
        }
        return workspace
    }

    private fun workspaceFrom(
        id: String,
        name: String?,
        aiProvider: String?,
        aiModel: String?,
        aiEffort: String?,
        codexUrl: String?,
        codexCwd: String?,
        createdAt: Instant,
        updatedAt: Instant,
    ): WorkspaceDto {
        val normalizedProvider = aiProvider?.trim().takeUnless { it.isNullOrEmpty() } ?: "codex-app-server"
        val normalizedModel = aiModel?.trim().takeUnless { it.isNullOrEmpty() } ?: codexDefaults.model
        val normalizedEffort = aiEffort?.trim().takeUnless { it.isNullOrEmpty() } ?: codexDefaults.effort
        val normalizedCodexUrl = codexUrl?.trim().takeUnless { it.isNullOrEmpty() } ?: codexDefaults.url
        val normalizedCodexCwd = codexCwd?.trim().takeUnless { it.isNullOrEmpty() } ?: codexDefaults.cwd
        val normalizedName = name?.trim().takeUnless { it.isNullOrEmpty() } ?: "새 작업공간"

        require(normalizedProvider == "codex-app-server") { "Todo demo currently supports codex-app-server." }
        require(normalizedEffort in setOf("low", "medium", "high", "xhigh")) { "Unsupported AI effort: $normalizedEffort" }

        return WorkspaceDto(
            id = id,
            name = normalizedName,
            aiProvider = normalizedProvider,
            aiModel = normalizedModel,
            aiEffort = normalizedEffort,
            codexUrl = normalizedCodexUrl,
            codexCwd = normalizedCodexCwd,
            settingsJson = objectMapper.writeValueAsString(
                mapOf(
                    "aiProvider" to normalizedProvider,
                    "aiModel" to normalizedModel,
                    "aiEffort" to normalizedEffort,
                    "codexUrl" to normalizedCodexUrl,
                    "codexCwd" to normalizedCodexCwd,
                ),
            ),
            createdAt = createdAt,
            updatedAt = updatedAt,
        )
    }

    private fun seedWorkspaceData(data: WorkspaceData, reset: Boolean) {
        val now = Instant.now()
        listOf(
            TodoItem(
                id = newId("todo"),
                title = "프로젝트 뼈대 정리",
                description = "워크스페이스, 채팅 세션, 원천 데이터 구조를 문서로 정리한다.",
                status = if (reset) TodoStatus.TODO else TodoStatus.DONE,
                priority = TodoPriority.HIGH,
                createdAt = now,
                updatedAt = now,
            ),
            TodoItem(
                id = newId("todo"),
                title = "SSE 채팅 연결 점검",
                description = "AI 응답 델타와 작업 미리보기가 화면에 순차 노출되는지 확인한다.",
                status = if (reset) TodoStatus.TODO else TodoStatus.DOING,
                priority = if (reset) TodoPriority.MEDIUM else TodoPriority.HIGH,
                createdAt = now,
                updatedAt = now,
            ),
            TodoItem(
                id = newId("todo"),
                title = "스크린샷용 데모 다듬기",
                description = "할일 카드, 채팅 입력, 변경 내역 표시가 한 화면에서 보이도록 구성한다.",
                status = TodoStatus.TODO,
                priority = TodoPriority.MEDIUM,
                createdAt = now,
                updatedAt = now,
            ),
        ).forEach { data.todos[it.id] = it }

        data.messages += ChatMessage(
            id = newId("msg"),
            role = ChatRole.ASSISTANT,
            content = "이 작업공간의 LLM 설정을 기준으로 Todo를 편집합니다. 예: `보고서 초안 작성 추가해줘`, `SSE 채팅 연결 점검 완료 처리해줘`",
            createdAt = now,
        )
        data.checkpoints += data.checkpoint(if (reset) "초기화" else "초기 데모 데이터")
    }

    private fun workspaceData(workspaceId: String): WorkspaceData =
        workspaces[workspaceId] ?: throw NoSuchElementException("Workspace not found: $workspaceId")

    private data class WorkspaceData(
        var workspace: WorkspaceDto,
        val todos: LinkedHashMap<String, TodoItem> = linkedMapOf(),
        val messages: MutableList<ChatMessage> = mutableListOf(),
        val checkpoints: MutableList<Checkpoint> = mutableListOf(),
    ) {
        fun state(): WorkspaceState =
            WorkspaceState(
                workspace = workspace,
                todos = todos.values.sortedWith(compareBy<TodoItem> { it.status.ordinal }.thenByDescending { it.priority.ordinal }),
                messages = messages.toList(),
                checkpoints = checkpoints.toList(),
            )

        fun checkpoint(label: String): Checkpoint = Checkpoint(
            id = newId("checkpoint"),
            label = label,
            todoCount = todos.size,
            createdAt = Instant.now(),
        )

        fun updateTodoWithoutCheckpoint(id: String?, patch: TodoPatch?): TodoItem? {
            val current = id?.let { todos[it] } ?: return null
            val safePatch = patch ?: return current
            val updated = current.copy(
                title = safePatch.title?.trim()?.takeIf { it.isNotBlank() } ?: current.title,
                description = safePatch.description?.trim() ?: current.description,
                status = safePatch.status ?: current.status,
                priority = safePatch.priority ?: current.priority,
                updatedAt = Instant.now(),
            )
            todos[current.id] = updated
            return updated
        }
    }
}

private fun newId(prefix: String): String = "${prefix}_${UUID.randomUUID()}"
