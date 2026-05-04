package app.tripplanner.chat

import app.tripplanner.common.ClockProvider
import app.tripplanner.trip.TripRepository
import app.tripplanner.workspace.WorkspaceRepository
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.springframework.http.ContentDisposition
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import java.security.MessageDigest
import java.time.OffsetDateTime
import java.util.HexFormat
import java.util.UUID

@Service
class ChatService(
    private val repository: ChatRepository,
    private val tripRepository: TripRepository,
    private val workspaceRepository: WorkspaceRepository,
    private val runService: ChatRunService,
    private val eventBroker: ChatEventBroker,
    private val clockProvider: ClockProvider,
) {
    private val objectMapper = jacksonObjectMapper()

    @Transactional(readOnly = true)
    fun findSessions(tripId: String): List<ChatSessionDto> = repository.findSessions(tripId)

    @Transactional
    fun createSession(tripId: String, request: CreateChatSessionRequest): ChatSessionDto {
        val trip = tripRepository.findTrip(tripId) ?: throw NoSuchElementException("Trip not found.")
        val workspace = workspaceRepository.find(trip.workspaceId) ?: throw NoSuchElementException("Workspace not found.")
        val title = request.title.trim()
        require(title.isNotEmpty()) { "Chat session title must not be blank." }

        val now = clockProvider.nowText()
        val session = ChatSessionDto(
            id = "chat_${UUID.randomUUID()}",
            tripId = tripId,
            title = title,
            provider = request.provider?.trim().takeUnless { it.isNullOrEmpty() } ?: workspace.aiProvider,
            model = request.model?.trim().takeUnless { it.isNullOrEmpty() } ?: workspace.aiModel,
            status = "idle",
            settingsJson = workspace.settingsJson,
            createdAt = now,
            updatedAt = now,
        )
        repository.insertSession(session)
        return session
    }

    @Transactional
    fun importSetupSession(tripId: String, request: ImportSetupChatSessionRequest): ChatSessionDetailDto {
        val trip = tripRepository.findTrip(tripId) ?: throw NoSuchElementException("Trip not found.")
        val importedMessages = request.messages
            .filter { message -> message.content.isNotBlank() && message.role in setOf("user", "assistant") }
            .take(40)
        require(importedMessages.isNotEmpty()) { "Imported messages must not be empty." }

        val session = createSession(
            tripId = trip.id,
            request = CreateChatSessionRequest(
                title = request.title.trim().takeIf(String::isNotEmpty) ?: "초안 설계",
            ),
        )
        val baseTime = OffsetDateTime.parse(clockProvider.nowText())
        importedMessages.forEachIndexed { index, message ->
            repository.insertMessage(
                ChatMessageDto(
                    id = "msg_${UUID.randomUUID()}",
                    chatSessionId = session.id,
                    role = message.role,
                    content = message.content.trim(),
                    status = "completed",
                    metadataJson = objectMapper.writeValueAsString(
                        mapOf(
                            "source" to "setup",
                            "durationMs" to message.durationMs,
                            "appliedActions" to message.appliedActions,
                        ),
                    ),
                    createdAt = baseTime.plusSeconds(index.toLong()).toString(),
                ),
            )
        }
        repository.touchSession(session.id, clockProvider.nowText())
        return detail(session.id)
    }

    @Transactional
    fun detail(sessionId: String): ChatSessionDetailDto {
        val session = repository.findSession(sessionId) ?: throw NoSuchElementException("Chat session not found.")
        runService.reconcileInterruptedRun(session)
        return ChatSessionDetailDto(
            session = session,
            messages = repository.findMessages(sessionId),
            editRuns = repository.findAiEditRuns(sessionId).map(AiEditRunDto::toSummary),
        )
    }

    @Transactional
    fun uploadAttachment(sessionId: String, file: MultipartFile): ChatAttachmentDto {
        repository.findSession(sessionId) ?: throw NoSuchElementException("Chat session not found.")
        require(!file.isEmpty) { "Attachment must not be empty." }
        require(file.size <= MaxAttachmentBytes) {
            "Attachment is too large. Maximum size is ${MaxAttachmentBytes / 1024 / 1024}MB."
        }

        val content = file.bytes
        val now = clockProvider.nowText()
        val contentType = file.contentType?.takeIf(String::isNotBlank) ?: MediaType.APPLICATION_OCTET_STREAM_VALUE
        val fileName = sanitizeFileName(file.originalFilename)
        val attachment = ChatAttachmentDto(
            id = "att_${UUID.randomUUID()}",
            chatSessionId = sessionId,
            chatMessageId = null,
            fileName = fileName,
            contentType = contentType,
            byteSize = content.size.toLong(),
            kind = if (contentType.startsWith("image/")) "image" else "file",
            downloadUrl = "",
            textPreview = textPreview(fileName = fileName, contentType = contentType, content = content),
            createdAt = now,
        )

        repository.insertAttachment(
            attachment = attachment,
            checksumSha256 = sha256(content),
            content = content,
        )
        return attachment.copy(downloadUrl = "/api/chat-attachments/${attachment.id}/content")
    }

    @Transactional(readOnly = true)
    fun attachmentContent(attachmentId: String): ResponseEntity<ByteArray> {
        val attachment = repository.findAttachment(attachmentId) ?: throw NoSuchElementException("Attachment not found.")
        val content = repository.findAttachmentBlob(attachmentId) ?: throw NoSuchElementException("Attachment content not found.")
        val contentType = runCatching { MediaType.parseMediaType(attachment.contentType) }
            .getOrDefault(MediaType.APPLICATION_OCTET_STREAM)

        return ResponseEntity
            .ok()
            .contentType(contentType)
            .header(
                HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.inline()
                    .filename(attachment.fileName, Charsets.UTF_8)
                    .build()
                    .toString(),
            )
            .body(content)
    }

    @Transactional
    fun deleteAttachment(sessionId: String, attachmentId: String) {
        repository.findSession(sessionId) ?: throw NoSuchElementException("Chat session not found.")
        if (!repository.deleteUnsentAttachment(sessionId = sessionId, attachmentId = attachmentId)) {
            throw NoSuchElementException("Attachment not found or already sent.")
        }
    }

    @Transactional
    fun updateSession(sessionId: String, request: UpdateChatSessionRequest): ChatSessionDto {
        val existing = repository.findSession(sessionId) ?: throw NoSuchElementException("Chat session not found.")
        val title = request.title.trim()
        require(title.isNotEmpty()) { "Chat session title must not be blank." }

        val session = existing.copy(
            title = title,
            updatedAt = clockProvider.nowText(),
        )
        repository.updateSession(session)
        return session
    }

    @Transactional
    fun deleteSession(sessionId: String) {
        repository.findSession(sessionId) ?: throw NoSuchElementException("Chat session not found.")
        runService.cancelCurrentRun(sessionId)
        repository.deleteSession(sessionId)
    }

    @Transactional(readOnly = true)
    fun editRuns(sessionId: String): List<AiEditRunSummaryDto> {
        repository.findSession(sessionId) ?: throw NoSuchElementException("Chat session not found.")
        return repository.findAiEditRuns(sessionId).map(AiEditRunDto::toSummary)
    }

    @Transactional(readOnly = true)
    fun subscribeEvents(sessionId: String): SseEmitter {
        val session = repository.findSession(sessionId) ?: throw NoSuchElementException("Chat session not found.")
        val emitter = eventBroker.subscribe(sessionId)
        runService.activeRunSnapshot(sessionId)?.let { snapshot ->
            repository.findLatestUnansweredUserMessage(sessionId)?.let { message ->
                eventBroker.send(emitter = emitter, eventName = "user.message.created", data = message)
            }
            eventBroker.send(
                emitter = emitter,
                eventName = "run.started",
                data = chatRunEvent(
                    runId = snapshot.runId,
                    session = session,
                    status = "running",
                    operationCount = 0,
                    message = snapshot.message,
                    createdAt = snapshot.startedAt,
                ),
            )
            snapshot.activity?.let { activity ->
                eventBroker.send(emitter = emitter, eventName = "run.activity", data = activity)
            }
            if (snapshot.streamedContent.isNotBlank()) {
                eventBroker.send(
                    emitter = emitter,
                    eventName = "assistant.message.delta",
                    data = ChatMessageDeltaEventDto(
                        runId = snapshot.runId,
                        delta = snapshot.streamedContent,
                        createdAt = clockProvider.nowText(),
                    ),
                )
            }
        }
        repository.findAiEditRuns(sessionId)
            .take(5)
            .asReversed()
            .map(AiEditRunDto::toSummary)
            .forEach { run -> eventBroker.send(emitter = emitter, eventName = "run.snapshot", data = run) }
        return emitter
    }

    @Transactional
    fun addMessage(sessionId: String, request: CreateChatMessageRequest): ChatMessageRunDto =
        runService.addMessage(sessionId = sessionId, request = request)

    fun cancelCurrentRun(sessionId: String): CancelChatRunResponse =
        runService.cancelCurrentRun(sessionId)
}

private const val MaxAttachmentBytes = 20L * 1024L * 1024L
private const val TextPreviewBytes = 128 * 1024
private const val TextPreviewChars = 12_000

private fun sanitizeFileName(value: String?): String {
    val name = value
        ?.substringAfterLast('/')
        ?.substringAfterLast('\\')
        ?.replace(Regex("[\\r\\n\\t]"), " ")
        ?.trim()
        ?.takeIf(String::isNotEmpty)
        ?: "attachment"
    return name.take(180)
}

private fun sha256(content: ByteArray): String =
    HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(content))

private fun textPreview(fileName: String, contentType: String, content: ByteArray): String? {
    if (content.size > TextPreviewBytes || !isTextLike(fileName, contentType)) return null
    return content
        .toString(Charsets.UTF_8)
        .replace("\u0000", "")
        .trim()
        .take(TextPreviewChars)
        .takeIf(String::isNotBlank)
}

private fun isTextLike(fileName: String, contentType: String): Boolean {
    val normalizedType = contentType.lowercase()
    if (normalizedType.startsWith("text/")) return true
    if (normalizedType in setOf("application/json", "application/xml", "application/x-yaml")) return true
    val extension = fileName.substringAfterLast('.', "").lowercase()
    return extension in setOf("txt", "md", "csv", "json", "yaml", "yml", "xml", "html", "htm", "log")
}
