package app.mindplan.chat

import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Repository
import java.sql.ResultSet

@Repository
class ChatRepository(
    private val jdbcClient: JdbcClient,
) {
    fun findSessions(planId: String): List<ChatSessionDto> =
        jdbcClient
            .sql(
                """
                SELECT id, plan_id, title, provider, model, status, settings_json, created_at, updated_at
                FROM chat_sessions
                WHERE plan_id = :planId
                ORDER BY updated_at DESC
                """.trimIndent(),
            )
            .param("planId", planId)
            .query(::sessionRow)
            .list()

    fun findSession(sessionId: String): ChatSessionDto? =
        jdbcClient
            .sql(
                """
                SELECT id, plan_id, title, provider, model, status, settings_json, created_at, updated_at
                FROM chat_sessions
                WHERE id = :sessionId
                """.trimIndent(),
            )
            .param("sessionId", sessionId)
            .query(::sessionRow)
            .optional()
            .orElse(null)

    fun insertSession(session: ChatSessionDto) {
        jdbcClient
            .sql(
                """
                INSERT INTO chat_sessions (
                  id, plan_id, title, provider, model, status, settings_json, created_at, updated_at
                ) VALUES (
                  :id, :planId, :title, :provider, :model, :status, :settingsJson, :createdAt, :updatedAt
                )
                """.trimIndent(),
            )
            .bindSession(session)
            .update()
    }

    fun updateSession(session: ChatSessionDto) {
        val updated = jdbcClient
            .sql(
                """
                UPDATE chat_sessions
                SET title = :title,
                    provider = :provider,
                    model = :model,
                    status = :status,
                    settings_json = :settingsJson,
                    updated_at = :updatedAt
                WHERE id = :id
                """.trimIndent(),
            )
            .bindSession(session)
            .update()

        if (updated == 0) throw NoSuchElementException("Chat session not found.")
    }

    fun deleteSession(sessionId: String) {
        val deleted = jdbcClient
            .sql("DELETE FROM chat_sessions WHERE id = :sessionId")
            .param("sessionId", sessionId)
            .update()

        if (deleted == 0) throw NoSuchElementException("Chat session not found.")
    }

    fun findMessages(sessionId: String): List<ChatMessageDto> =
        jdbcClient
            .sql(
                """
                SELECT id, chat_session_id, role, content, status, metadata_json, created_at
                FROM chat_messages
                WHERE chat_session_id = :sessionId
                ORDER BY created_at ASC
                """.trimIndent(),
            )
            .param("sessionId", sessionId)
            .query(::messageRow)
            .list()

    fun insertMessage(message: ChatMessageDto) {
        jdbcClient
            .sql(
                """
                INSERT INTO chat_messages (
                  id, chat_session_id, role, content, status, metadata_json, created_at
                ) VALUES (
                  :id, :chatSessionId, :role, :content, :status, :metadataJson, :createdAt
                )
                """.trimIndent(),
            )
            .param("id", message.id)
            .param("chatSessionId", message.chatSessionId)
            .param("role", message.role)
            .param("content", message.content)
            .param("status", message.status)
            .param("metadataJson", message.metadataJson)
            .param("createdAt", message.createdAt)
            .update()
    }

    fun insertRun(run: AiEditRunDto) {
        jdbcClient
            .sql(
                """
                INSERT INTO ai_edit_runs (
                  id, plan_id, chat_session_id, provider, model, user_message_id, assistant_message_id,
                  operations_json, status, error, checkpoint_id, duration_ms, created_at
                ) VALUES (
                  :id, :planId, :chatSessionId, :provider, :model, :userMessageId, :assistantMessageId,
                  :operationsJson, :status, :error, :checkpointId, :durationMs, :createdAt
                )
                """.trimIndent(),
            )
            .param("id", run.id)
            .param("planId", run.planId)
            .param("chatSessionId", run.chatSessionId)
            .param("provider", run.provider)
            .param("model", run.model)
            .param("userMessageId", run.userMessageId)
            .param("assistantMessageId", run.assistantMessageId)
            .param("operationsJson", run.operationsJson)
            .param("status", run.status)
            .param("error", run.error)
            .param("checkpointId", run.checkpointId)
            .param("durationMs", run.durationMs)
            .param("createdAt", run.createdAt)
            .update()
    }

    fun findRuns(sessionId: String): List<AiEditRunDto> =
        jdbcClient
            .sql(
                """
                SELECT id, plan_id, chat_session_id, provider, model, user_message_id, assistant_message_id,
                       operations_json, status, error, checkpoint_id, duration_ms, created_at
                FROM ai_edit_runs
                WHERE chat_session_id = :sessionId
                ORDER BY created_at DESC
                """.trimIndent(),
            )
            .param("sessionId", sessionId)
            .query(::runRow)
            .list()

    private fun sessionRow(rs: ResultSet, rowNumber: Int): ChatSessionDto =
        ChatSessionDto(
            id = rs.getString("id"),
            planId = rs.getString("plan_id"),
            title = rs.getString("title"),
            provider = rs.getString("provider"),
            model = rs.getString("model"),
            status = rs.getString("status"),
            settingsJson = rs.getString("settings_json"),
            createdAt = rs.getString("created_at"),
            updatedAt = rs.getString("updated_at"),
        )

    private fun messageRow(rs: ResultSet, rowNumber: Int): ChatMessageDto =
        ChatMessageDto(
            id = rs.getString("id"),
            chatSessionId = rs.getString("chat_session_id"),
            role = rs.getString("role"),
            content = rs.getString("content"),
            status = rs.getString("status"),
            metadataJson = rs.getString("metadata_json"),
            createdAt = rs.getString("created_at"),
        )

    private fun runRow(rs: ResultSet, rowNumber: Int): AiEditRunDto =
        AiEditRunDto(
            id = rs.getString("id"),
            planId = rs.getString("plan_id"),
            chatSessionId = rs.getString("chat_session_id"),
            provider = rs.getString("provider"),
            model = rs.getString("model"),
            userMessageId = rs.getString("user_message_id"),
            assistantMessageId = rs.getString("assistant_message_id"),
            operationsJson = rs.getString("operations_json"),
            status = rs.getString("status"),
            error = rs.getString("error"),
            checkpointId = rs.getString("checkpoint_id"),
            durationMs = rs.getNullableLong("duration_ms"),
            createdAt = rs.getString("created_at"),
        )
}

private fun JdbcClient.StatementSpec.bindSession(session: ChatSessionDto): JdbcClient.StatementSpec =
    param("id", session.id)
        .param("planId", session.planId)
        .param("title", session.title)
        .param("provider", session.provider)
        .param("model", session.model)
        .param("status", session.status)
        .param("settingsJson", session.settingsJson)
        .param("createdAt", session.createdAt)
        .param("updatedAt", session.updatedAt)

private fun ResultSet.getNullableLong(column: String): Long? {
    val value = getLong(column)
    return if (wasNull()) null else value
}
