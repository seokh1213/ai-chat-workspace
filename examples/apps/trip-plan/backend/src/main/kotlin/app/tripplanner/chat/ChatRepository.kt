package app.tripplanner.chat

import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Repository
import java.sql.ResultSet

@Repository
class ChatRepository(
    private val jdbcClient: JdbcClient,
) {
    fun findSessions(tripId: String): List<ChatSessionDto> =
        jdbcClient
            .sql(
                """
                SELECT id, trip_id, title, provider, model, status, settings_json, created_at, updated_at
                FROM chat_sessions
                WHERE trip_id = :tripId
                ORDER BY updated_at DESC
                """.trimIndent(),
            )
            .param("tripId", tripId)
            .query(::sessionRow)
            .list()

    fun findSession(sessionId: String): ChatSessionDto? =
        jdbcClient
            .sql(
                """
                SELECT id, trip_id, title, provider, model, status, settings_json, created_at, updated_at
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
                  id, trip_id, title, provider, model, status, settings_json, created_at, updated_at
                ) VALUES (
                  :id, :tripId, :title, :provider, :model, :status, :settingsJson, :createdAt, :updatedAt
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
                    status = :status,
                    settings_json = :settingsJson,
                    updated_at = :updatedAt
                WHERE id = :id
                """.trimIndent(),
            )
            .bindSession(session)
            .update()

        if (updated == 0) {
            throw NoSuchElementException("Chat session not found.")
        }
    }

    fun deleteSession(sessionId: String) {
        val deleted = jdbcClient
            .sql("DELETE FROM chat_sessions WHERE id = :sessionId")
            .param("sessionId", sessionId)
            .update()

        if (deleted == 0) {
            throw NoSuchElementException("Chat session not found.")
        }
    }

    fun touchSession(sessionId: String, updatedAt: String) {
        jdbcClient
            .sql("UPDATE chat_sessions SET updated_at = :updatedAt WHERE id = :sessionId")
            .param("sessionId", sessionId)
            .param("updatedAt", updatedAt)
            .update()
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

    fun findLatestUnansweredUserMessage(sessionId: String): ChatMessageDto? =
        jdbcClient
            .sql(
                """
                SELECT m.id, m.chat_session_id, m.role, m.content, m.status, m.metadata_json, m.created_at
                FROM chat_messages m
                WHERE m.chat_session_id = :sessionId
                  AND m.role = 'user'
                  AND NOT EXISTS (
                    SELECT 1
                    FROM ai_edit_runs r
                    WHERE r.user_message_id = m.id
                  )
                  AND NOT EXISTS (
                    SELECT 1
                    FROM chat_messages later
                    WHERE later.chat_session_id = m.chat_session_id
                      AND later.created_at > m.created_at
                  )
                ORDER BY m.created_at DESC
                LIMIT 1
                """.trimIndent(),
            )
            .param("sessionId", sessionId)
            .query(::messageRow)
            .optional()
            .orElse(null)

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

    fun insertAiEditRun(run: AiEditRunDto) {
        jdbcClient
            .sql(
                """
                INSERT INTO ai_edit_runs (
                  id, trip_id, chat_session_id, provider_session_id, provider, model, provider_run_id,
                  user_message_id, assistant_message_id, operations_json, status, error, checkpoint_id, duration_ms, created_at
                ) VALUES (
                  :id, :tripId, :chatSessionId, :providerSessionId, :provider, :model, :providerRunId,
                  :userMessageId, :assistantMessageId, :operationsJson, :status, :error, :checkpointId, :durationMs, :createdAt
                )
                """.trimIndent(),
            )
            .param("id", run.id)
            .param("tripId", run.tripId)
            .param("chatSessionId", run.chatSessionId)
            .param("providerSessionId", run.providerSessionId)
            .param("provider", run.provider)
            .param("model", run.model)
            .param("providerRunId", run.providerRunId)
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

    fun findAiEditRuns(sessionId: String): List<AiEditRunDto> =
        jdbcClient
            .sql(
                """
                SELECT
                  id, trip_id, chat_session_id, provider_session_id, provider, model, provider_run_id,
                  user_message_id, assistant_message_id, operations_json, status, error, checkpoint_id, duration_ms, created_at
                FROM ai_edit_runs
                WHERE chat_session_id = :sessionId
                ORDER BY created_at DESC
                """.trimIndent(),
            )
            .param("sessionId", sessionId)
            .query(::aiEditRunRow)
            .list()

    private fun sessionRow(rs: ResultSet, rowNumber: Int): ChatSessionDto =
        ChatSessionDto(
            id = rs.getString("id"),
            tripId = rs.getString("trip_id"),
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

    private fun aiEditRunRow(rs: ResultSet, rowNumber: Int): AiEditRunDto =
        AiEditRunDto(
            id = rs.getString("id"),
            tripId = rs.getString("trip_id"),
            chatSessionId = rs.getString("chat_session_id"),
            providerSessionId = rs.getString("provider_session_id"),
            provider = rs.getString("provider"),
            model = rs.getString("model"),
            providerRunId = rs.getString("provider_run_id"),
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
        .param("tripId", session.tripId)
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
