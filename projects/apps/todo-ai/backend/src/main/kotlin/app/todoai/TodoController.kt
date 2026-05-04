package app.todoai

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.CrossOrigin
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = ["http://127.0.0.1:4178", "http://localhost:4178"])
class TodoController(
    private val repository: TodoRepository,
    private val chatService: TodoChatService,
    private val broker: ChatEventBroker,
) {
    @GetMapping("/state")
    fun state(): WorkspaceState = repository.state(repository.defaultWorkspaceId())

    @GetMapping("/workspaces")
    fun workspaces(): List<WorkspaceDto> = repository.workspaces()

    @PostMapping("/workspaces")
    fun createWorkspace(@RequestBody request: CreateWorkspaceRequest): WorkspaceDto =
        repository.createWorkspace(request)

    @PatchMapping("/workspaces/{workspaceId}")
    fun updateWorkspace(
        @PathVariable workspaceId: String,
        @RequestBody request: UpdateWorkspaceRequest,
    ): WorkspaceDto = repository.updateWorkspace(workspaceId = workspaceId, request = request)

    @DeleteMapping("/workspaces/{workspaceId}")
    fun deleteWorkspace(@PathVariable workspaceId: String): ResponseEntity<Void> =
        if (repository.deleteWorkspace(workspaceId)) ResponseEntity.noContent().build() else ResponseEntity.notFound().build()

    @GetMapping("/workspaces/{workspaceId}/state")
    fun workspaceState(@PathVariable workspaceId: String): WorkspaceState = repository.state(workspaceId)

    @PostMapping("/chat/messages")
    fun sendMessage(@RequestBody request: SendMessageRequest): SendMessageResponse =
        chatService.send(workspaceId = repository.defaultWorkspaceId(), content = request.content)

    @PostMapping("/workspaces/{workspaceId}/chat/messages")
    fun sendWorkspaceMessage(
        @PathVariable workspaceId: String,
        @RequestBody request: SendMessageRequest,
    ): SendMessageResponse = chatService.send(workspaceId = workspaceId, content = request.content)

    @GetMapping("/chat/events")
    fun chatEvents(): SseEmitter = broker.subscribe()

    @PostMapping("/todos")
    fun createTodo(@RequestBody request: CreateTodoRequest): TodoItem =
        repository.createTodo(workspaceId = repository.defaultWorkspaceId(), request = request)

    @PostMapping("/workspaces/{workspaceId}/todos")
    fun createWorkspaceTodo(
        @PathVariable workspaceId: String,
        @RequestBody request: CreateTodoRequest,
    ): TodoItem = repository.createTodo(workspaceId = workspaceId, request = request)

    @PatchMapping("/todos/{id}")
    fun updateTodo(@PathVariable id: String, @RequestBody patch: TodoPatch): ResponseEntity<TodoItem> =
        repository.updateTodo(workspaceId = repository.defaultWorkspaceId(), id = id, patch = patch)
            ?.let { ResponseEntity.ok(it) } ?: ResponseEntity.notFound().build()

    @PatchMapping("/workspaces/{workspaceId}/todos/{id}")
    fun updateWorkspaceTodo(
        @PathVariable workspaceId: String,
        @PathVariable id: String,
        @RequestBody patch: TodoPatch,
    ): ResponseEntity<TodoItem> =
        repository.updateTodo(workspaceId = workspaceId, id = id, patch = patch)
            ?.let { ResponseEntity.ok(it) } ?: ResponseEntity.notFound().build()

    @DeleteMapping("/todos/{id}")
    fun deleteTodo(@PathVariable id: String): ResponseEntity<Void> =
        if (repository.deleteTodo(workspaceId = repository.defaultWorkspaceId(), id = id)) {
            ResponseEntity.noContent().build()
        } else {
            ResponseEntity.notFound().build()
        }

    @DeleteMapping("/workspaces/{workspaceId}/todos/{id}")
    fun deleteWorkspaceTodo(
        @PathVariable workspaceId: String,
        @PathVariable id: String,
    ): ResponseEntity<Void> =
        if (repository.deleteTodo(workspaceId = workspaceId, id = id)) {
            ResponseEntity.noContent().build()
        } else {
            ResponseEntity.notFound().build()
        }

    @PostMapping("/reset")
    fun reset(): WorkspaceState = repository.reset(repository.defaultWorkspaceId())

    @PostMapping("/workspaces/{workspaceId}/reset")
    fun resetWorkspace(@PathVariable workspaceId: String): WorkspaceState = repository.reset(workspaceId)
}
