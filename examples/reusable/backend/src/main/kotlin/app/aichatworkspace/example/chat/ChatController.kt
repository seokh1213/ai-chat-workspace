package app.aichatworkspace.example.chat

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter

@RestController
@RequestMapping("/api/chat-sessions")
class ChatController(
    private val chatRunService: ChatRunService,
    private val eventBroker: ChatEventBroker,
) {
    @GetMapping("/{sessionId}")
    fun detail(@PathVariable sessionId: String): ChatSessionDetailDto =
        chatRunService.detail(sessionId)

    @PostMapping("/{sessionId}/messages")
    fun addMessage(
        @PathVariable sessionId: String,
        @RequestBody request: CreateChatMessageRequest,
    ): CreateChatMessageResponse =
        chatRunService.addMessage(sessionId, request)

    @GetMapping("/{sessionId}/events")
    fun events(@PathVariable sessionId: String): SseEmitter =
        eventBroker.subscribe(sessionId)

    @PostMapping("/{sessionId}/cancel")
    fun cancel(@PathVariable sessionId: String) {
        chatRunService.cancelCurrentRun(sessionId)
    }
}

