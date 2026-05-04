package app.mindplan.chat

import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter

@RestController
@RequestMapping("/api")
class ChatController(
    private val chatService: ChatService,
    private val runService: ChatRunService,
) {
    @GetMapping("/plans/{planId}/chat-sessions")
    fun list(@PathVariable planId: String): List<ChatSessionDto> =
        chatService.listSessions(planId)

    @PostMapping("/plans/{planId}/chat-sessions")
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @PathVariable planId: String,
        @RequestBody request: CreateChatSessionRequest,
    ): ChatSessionDto = chatService.createSession(planId, request)

    @GetMapping("/chat-sessions/{sessionId}")
    fun detail(@PathVariable sessionId: String): ChatSessionDetailDto =
        chatService.detail(sessionId)

    @PutMapping("/chat-sessions/{sessionId}")
    fun update(
        @PathVariable sessionId: String,
        @Valid @RequestBody request: UpdateChatSessionRequest,
    ): ChatSessionDto = chatService.updateSession(sessionId, request)

    @DeleteMapping("/chat-sessions/{sessionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable sessionId: String) =
        chatService.deleteSession(sessionId)

    @PostMapping("/chat-sessions/{sessionId}/messages")
    fun send(
        @PathVariable sessionId: String,
        @Valid @RequestBody request: SendChatMessageRequest,
    ): SseEmitter = runService.start(sessionId, request)
}
