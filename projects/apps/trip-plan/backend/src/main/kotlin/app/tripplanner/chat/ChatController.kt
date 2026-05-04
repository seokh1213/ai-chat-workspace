package app.tripplanner.chat

import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter

@RestController
class ChatController(
    private val service: ChatService,
) {
    @GetMapping("/api/trips/{tripId}/chat-sessions")
    fun findSessions(@PathVariable tripId: String): List<ChatSessionDto> = service.findSessions(tripId)

    @PostMapping("/api/trips/{tripId}/chat-sessions")
    @ResponseStatus(HttpStatus.CREATED)
    fun createSession(
        @PathVariable tripId: String,
        @RequestBody request: CreateChatSessionRequest,
    ): ChatSessionDto = service.createSession(tripId, request)

    @PostMapping("/api/trips/{tripId}/chat-sessions/import-setup")
    @ResponseStatus(HttpStatus.CREATED)
    fun importSetupSession(
        @PathVariable tripId: String,
        @RequestBody request: ImportSetupChatSessionRequest,
    ): ChatSessionDetailDto = service.importSetupSession(tripId, request)

    @GetMapping("/api/chat-sessions/{sessionId}")
    fun detail(@PathVariable sessionId: String): ChatSessionDetailDto = service.detail(sessionId)

    @PatchMapping("/api/chat-sessions/{sessionId}")
    fun updateSession(
        @PathVariable sessionId: String,
        @RequestBody request: UpdateChatSessionRequest,
    ): ChatSessionDto = service.updateSession(sessionId, request)

    @DeleteMapping("/api/chat-sessions/{sessionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteSession(@PathVariable sessionId: String) {
        service.deleteSession(sessionId)
    }

    @GetMapping("/api/chat-sessions/{sessionId}/edit-runs")
    fun editRuns(@PathVariable sessionId: String): List<AiEditRunSummaryDto> = service.editRuns(sessionId)

    @GetMapping("/api/chat-sessions/{sessionId}/events", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    fun events(@PathVariable sessionId: String): SseEmitter = service.subscribeEvents(sessionId)

    @PostMapping(
        "/api/chat-sessions/{sessionId}/attachments",
        consumes = [MediaType.MULTIPART_FORM_DATA_VALUE],
    )
    @ResponseStatus(HttpStatus.CREATED)
    fun uploadAttachment(
        @PathVariable sessionId: String,
        @RequestParam("file") file: MultipartFile,
    ): ChatAttachmentDto = service.uploadAttachment(sessionId = sessionId, file = file)

    @DeleteMapping("/api/chat-sessions/{sessionId}/attachments/{attachmentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteAttachment(
        @PathVariable sessionId: String,
        @PathVariable attachmentId: String,
    ) {
        service.deleteAttachment(sessionId = sessionId, attachmentId = attachmentId)
    }

    @GetMapping("/api/chat-attachments/{attachmentId}/content")
    fun attachmentContent(@PathVariable attachmentId: String): ResponseEntity<ByteArray> =
        service.attachmentContent(attachmentId)

    @PostMapping("/api/chat-sessions/{sessionId}/messages")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun addMessage(
        @PathVariable sessionId: String,
        @RequestBody request: CreateChatMessageRequest,
    ): ChatMessageRunDto = service.addMessage(sessionId, request)

    @PostMapping("/api/chat-sessions/{sessionId}/runs/current/cancel")
    fun cancelCurrentRun(@PathVariable sessionId: String): CancelChatRunResponse = service.cancelCurrentRun(sessionId)
}
