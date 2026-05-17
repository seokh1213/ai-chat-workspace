package app.tripplanner.chat

import app.tripplanner.ai.AiChatRequest
import app.tripplanner.ai.AiInputImage
import app.tripplanner.ai.AiPriorMessage
import app.tripplanner.ai.AiProviderActivity
import app.tripplanner.ai.AiProviderRegistry
import app.tripplanner.ai.AiProviderResult
import app.tripplanner.ai.AiStreamEvent
import app.tripplanner.common.ClockProvider
import app.tripplanner.trip.TripService
import app.tripplanner.trip.TripOperations
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.runBlocking
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardOpenOption
import java.time.Duration
import java.util.Base64

@Component
class ChatProviderRunner(
    private val repository: ChatRepository,
    private val tripService: TripService,
    private val providerRegistry: AiProviderRegistry,
    private val providerSessionRepository: app.tripplanner.ai.AiProviderSessionRepository,
    private val eventBroker: ChatEventBroker,
    private val runRegistry: ChatRunRegistry,
    private val clockProvider: ClockProvider,
    @param:Value("\${app.chat.attachments.model-local-dir:}") private val modelAttachmentLocalDir: String,
    @param:Value("\${app.chat.attachments.model-base-url:}") private val modelAttachmentBaseUrl: String,
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    fun run(session: ChatSessionDto, userMessage: ChatMessageDto, runId: String): AiProviderResult {
        val provider = providerRegistry.requireProvider(session.provider)
        val tripState = tripService.state(session.tripId)
        val providerSession = providerSessionRepository.find(chatSessionId = session.id, provider = session.provider)
        val priorMessages = repository.findMessages(session.id)
            .dropLast(1)
            .takeLast(12)
            .map { message -> AiPriorMessage(role = message.role, content = providerContent(message)) }
        val inputImages = modelInputImages(userMessage)
        val request = AiChatRequest(
            runId = runId,
            tripId = session.tripId,
            chatSessionId = session.id,
            content = providerContent(userMessage, currentTurnImageInputs = inputImages.isNotEmpty()),
            inputImages = inputImages,
            tripState = tripState,
            priorMessages = priorMessages,
            model = session.model,
            effort = session.aiEffort(),
            settingsJson = session.settingsJson,
            providerSession = providerSession,
        )

        logger.info(
            "Chat run provider start runId={} sessionId={} tripId={} provider={} priorMessages={} inputImages={} days={} places={} items={}",
            runId,
            session.id,
            session.tripId,
            session.provider,
            priorMessages.size,
            inputImages.size,
            tripState.days.size,
            tripState.places.size,
            tripState.itineraryItems.size,
        )

        return runBlocking {
            val deltas = mutableListOf<String>()
            var completedMessage: String? = null
            var operations: TripOperations = emptyList()
            var providerResult: AiProviderResult? = null
            var completedPublished = false
            val startedNanos = System.nanoTime()
            var firstDeltaNanos: Long? = null
            var deltaEventCount = 0
            var sseChunkCount = 0
            var visibleCharCount = 0
            var activityCount = 0

            provider.streamChat(request).collect { event ->
                when (event) {
                    is AiStreamEvent.Activity -> {
                        activityCount += 1
                        publishRunActivity(session = session, runId = runId, activity = event.activity)
                    }
                    is AiStreamEvent.MessageDelta -> {
                        deltas += event.content
                        deltaEventCount += 1
                        visibleCharCount += event.content.length
                        if (firstDeltaNanos == null) {
                            firstDeltaNanos = System.nanoTime()
                            logger.info("Chat run first delta runId={} latencyMs={} deltaChars={}", runId, elapsedMillis(startedNanos), event.content.length)
                        }
                        sseChunkCount += publishAssistantDelta(sessionId = session.id, runId = runId, delta = event.content)
                    }
                    is AiStreamEvent.MessageCompleted -> {
                        completedMessage = event.content
                        if (deltas.isEmpty()) {
                            completedPublished = publishAssistantCompleted(sessionId = session.id, runId = runId, content = event.content)
                        }
                    }
                    is AiStreamEvent.OperationsProposed -> operations = event.operations
                    is AiStreamEvent.ResultCompleted -> {
                        providerResult = event.result
                        if (deltas.isEmpty()) {
                            completedPublished = publishAssistantCompleted(sessionId = session.id, runId = runId, content = event.result.message)
                        }
                    }
                    AiStreamEvent.RunStarted,
                    AiStreamEvent.RunCompleted,
                    -> Unit
                }
            }

            val message = completedMessage ?: deltas.joinToString("")
            val result = providerResult ?: AiProviderResult(
                message = message.ifBlank { throw IllegalStateException("AI provider returned an empty response.") },
                operations = operations,
            )
            if (!completedPublished && deltas.isEmpty()) {
                publishAssistantCompleted(sessionId = session.id, runId = runId, content = result.message)
            }
            logger.info(
                "Chat run provider completed runId={} durationMs={} firstDeltaLatencyMs={} deltaEvents={} sseChunks={} visibleChars={} activities={} operations={} providerRunId={}",
                runId,
                elapsedMillis(startedNanos),
                firstDeltaNanos?.let { Duration.ofNanos(it - startedNanos).toMillis() },
                deltaEventCount,
                sseChunkCount,
                visibleCharCount,
                activityCount,
                result.operations.size,
                result.providerRunId,
            )
            result
        }
    }

    private fun modelInputImages(message: ChatMessageDto): List<AiInputImage> =
        message.attachments
            .filter { attachment -> attachment.kind == "image" }
            .mapNotNull { attachment ->
                val contentType = normalizedImageContentType(attachment.contentType)
                val localPath = modelAttachmentLocalPath(message = message, attachment = attachment, contentType = contentType)
                if (localPath != null) {
                    return@mapNotNull AiInputImage(fileName = attachment.fileName, contentType = contentType, localPath = localPath)
                }
                val url = modelAttachmentUrl(attachment) ?: imageDataUrl(message = message, attachment = attachment, contentType = contentType)
                    ?: return@mapNotNull null
                AiInputImage(fileName = attachment.fileName, contentType = contentType, url = url)
            }

    private fun modelAttachmentLocalPath(message: ChatMessageDto, attachment: ChatAttachmentDto, contentType: String): String? {
        val directory = modelAttachmentLocalDir.trim().takeIf(String::isNotBlank) ?: return null
        val content = attachmentContentForModel(message = message, attachment = attachment) ?: return null
        return runCatching {
            val root = Path.of(directory).toAbsolutePath().normalize()
            Files.createDirectories(root)
            val target = root.resolve("${attachment.id}.${imageFileExtension(contentType)}").normalize()
            require(target.parent == root) { "Attachment path escaped model attachment directory." }
            Files.write(target, content, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE)
            target.toString()
        }.onFailure { error ->
            logger.warn("Chat image attachment could not be staged for local model input messageId={} attachmentId={} directory={}: {}", message.id, attachment.id, directory, error.message)
        }.getOrNull()
    }

    private fun modelAttachmentUrl(attachment: ChatAttachmentDto): String? {
        val baseUrl = modelAttachmentBaseUrl.trim().trimEnd('/').takeIf(String::isNotBlank) ?: return null
        val path = attachment.downloadUrl.takeIf(String::isNotBlank)
            ?: "/api/chat-sessions/${attachment.chatSessionId}/attachments/${attachment.id}/content"
        return "$baseUrl$path"
    }

    private fun imageDataUrl(message: ChatMessageDto, attachment: ChatAttachmentDto, contentType: String): String? {
        val content = attachmentContentForModel(message = message, attachment = attachment) ?: return null
        return "data:$contentType;base64,${Base64.getEncoder().encodeToString(content)}"
    }

    private fun attachmentContentForModel(message: ChatMessageDto, attachment: ChatAttachmentDto): ByteArray? {
        val content = repository.findAttachmentBlob(attachment.id)
        if (content == null) {
            logger.warn("Chat image attachment content missing messageId={} attachmentId={}", message.id, attachment.id)
            return null
        }
        if (content.size.toLong() > MaxModelImageBytes) {
            logger.warn("Chat image attachment skipped for model input messageId={} attachmentId={} bytes={}", message.id, attachment.id, content.size)
            return null
        }
        return content
    }

    private fun publishRunActivity(session: ChatSessionDto, runId: String, activity: AiProviderActivity) {
        if (runRegistry.isCancelled(runId)) return
        val event = ChatRunActivityEventDto(
            runId = runId,
            kind = activity.kind,
            label = activity.label,
            detail = activity.detail,
            rawType = activity.rawType,
            createdAt = clockProvider.nowText(),
        )
        runRegistry.updateActivity(sessionId = session.id, runId = runId, activity = event)
        eventBroker.publish(sessionId = session.id, eventName = "run.activity", data = event)
    }

    private fun publishAssistantDelta(sessionId: String, runId: String, delta: String): Int {
        if (delta.isBlank() || runRegistry.isCancelled(runId)) return 0
        runRegistry.appendDelta(sessionId = sessionId, runId = runId, delta = delta)
        eventBroker.publish(
            sessionId = sessionId,
            eventName = "assistant.message.delta",
            data = ChatMessageDeltaEventDto(runId = runId, delta = delta, createdAt = clockProvider.nowText()),
        )
        return 1
    }

    private fun publishAssistantCompleted(sessionId: String, runId: String, content: String): Boolean {
        if (runRegistry.isCancelled(runId)) return false
        eventBroker.publish(
            sessionId = sessionId,
            eventName = "assistant.message.completed",
            data = ChatMessageCompletedEventDto(runId = runId, content = content, createdAt = clockProvider.nowText()),
        )
        return true
    }
}

private const val MaxModelImageBytes = 20L * 1024L * 1024L

private fun ChatSessionDto.aiEffort(): String? =
    runCatching {
        com.fasterxml.jackson.module.kotlin.jacksonObjectMapper().readTree(settingsJson).path("aiEffort").asText()
    }.getOrNull()?.takeIf(String::isNotBlank)

private fun normalizedImageContentType(contentType: String): String {
    val normalized = contentType.substringBefore(';').trim().lowercase()
    return normalized
        .takeIf { value -> value.startsWith("image/") && value.all { char -> char.isLetterOrDigit() || char in setOf('/', '.', '+', '-') } }
        ?: "image/png"
}

private fun imageFileExtension(contentType: String): String =
    when (contentType) {
        "image/jpeg", "image/jpg" -> "jpg"
        "image/webp" -> "webp"
        "image/gif" -> "gif"
        else -> "png"
    }

private fun providerContent(message: ChatMessageDto, currentTurnImageInputs: Boolean = false): String {
    if (message.attachments.isEmpty()) return message.content

    return buildString {
        append(message.content.ifBlank { "첨부 파일을 확인해줘." })
        append("\n\n첨부 파일:")
        message.attachments.forEach { attachment ->
            append("\n- ")
            append(attachment.fileName)
            append(" (")
            append(attachment.contentType)
            append(", ")
            append(attachment.byteSize)
            append(" bytes)")
            if (attachment.textPreview != null) {
                append("\n")
                append(attachment.textPreview.take(12_000))
            } else if (attachment.kind == "image" && currentTurnImageInputs) {
                append("\n이미지 본문은 현재 턴의 이미지 입력으로 함께 전달됩니다.")
            }
        }
    }
}

private fun elapsedMillis(startedNanos: Long): Long =
    Duration.ofNanos(System.nanoTime() - startedNanos).toMillis()
