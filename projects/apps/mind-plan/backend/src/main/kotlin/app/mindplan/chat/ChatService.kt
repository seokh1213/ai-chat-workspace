package app.mindplan.chat

import app.mindplan.common.ClockProvider
import app.mindplan.common.IdGenerator
import app.mindplan.plan.PlanService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ChatService(
    private val repository: ChatRepository,
    private val planService: PlanService,
    private val ids: IdGenerator,
    private val clock: ClockProvider,
) {
    fun listSessions(planId: String): List<ChatSessionDto> =
        repository.findSessions(planId)

    fun detail(sessionId: String): ChatSessionDetailDto {
        val session = repository.findSession(sessionId) ?: throw NoSuchElementException("Chat session not found.")
        return ChatSessionDetailDto(
            session = session,
            messages = repository.findMessages(sessionId),
            runs = repository.findRuns(sessionId),
        )
    }

    @Transactional
    fun createSession(planId: String, request: CreateChatSessionRequest): ChatSessionDto {
        planService.get(planId)
        val now = clock.nowText()
        val session = ChatSessionDto(
            id = ids.chatSessionId(),
            planId = planId,
            title = request.title?.trim()?.takeIf { it.isNotBlank() } ?: "새 계획 상담",
            provider = request.provider?.takeIf { it.isNotBlank() } ?: "local-rule",
            model = request.model?.takeIf { it.isNotBlank() },
            status = "idle",
            settingsJson = request.settingsJson?.takeIf { it.isNotBlank() } ?: "{}",
            createdAt = now,
            updatedAt = now,
        )
        repository.insertSession(session)
        return session
    }

    @Transactional
    fun updateSession(sessionId: String, request: UpdateChatSessionRequest): ChatSessionDto {
        val current = repository.findSession(sessionId) ?: throw NoSuchElementException("Chat session not found.")
        val updated = current.copy(title = request.title.trim(), updatedAt = clock.nowText())
        repository.updateSession(updated)
        return updated
    }

    @Transactional
    fun deleteSession(sessionId: String) =
        repository.deleteSession(sessionId)

    fun session(sessionId: String): ChatSessionDto =
        repository.findSession(sessionId) ?: throw NoSuchElementException("Chat session not found.")

    fun messages(sessionId: String): List<ChatMessageDto> =
        repository.findMessages(sessionId)

    fun insertMessage(message: ChatMessageDto) =
        repository.insertMessage(message)

    fun insertRun(run: AiEditRunDto) =
        repository.insertRun(run)

    fun updateSession(session: ChatSessionDto) =
        repository.updateSession(session)

    fun newMessage(
        sessionId: String,
        role: String,
        content: String,
        metadataJson: String = "{}",
        status: String = "completed",
    ): ChatMessageDto =
        ChatMessageDto(
            id = ids.messageId(),
            chatSessionId = sessionId,
            role = role,
            content = content,
            status = status,
            metadataJson = metadataJson,
            createdAt = clock.nowText(),
        )

    fun newRunId(): String = ids.runId()

    fun nowText(): String = clock.nowText()
}
