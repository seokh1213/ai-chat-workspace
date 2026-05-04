package app.tripplanner.ai

import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Repository
import java.sql.ResultSet

@Repository
class AiProviderSessionRepository(
    private val jdbcClient: JdbcClient,
) {
    fun find(chatSessionId: String, provider: String): AiProviderSessionDto? =
        jdbcClient
            .sql(
                """
                SELECT
                  id, chat_session_id, provider, external_thread_id, external_conversation_id,
                  status, last_event_json, metadata_json, created_at, updated_at
                FROM ai_provider_sessions
                WHERE chat_session_id = :chatSessionId AND provider = :provider AND status = 'active'
                ORDER BY updated_at DESC
                LIMIT 1
                """.trimIndent(),
            )
            .param("chatSessionId", chatSessionId)
            .param("provider", provider)
            .query(::row)
            .optional()
            .orElse(null)

    fun upsert(session: AiProviderSessionDto) {
        jdbcClient
            .sql(
                """
                INSERT INTO ai_provider_sessions (
                  id, chat_session_id, provider, external_thread_id, external_conversation_id,
                  status, last_event_json, metadata_json, created_at, updated_at
                ) VALUES (
                  :id, :chatSessionId, :provider, :externalThreadId, :externalConversationId,
                  :status, :lastEventJson, :metadataJson, :createdAt, :updatedAt
                )
                ON CONFLICT(id) DO UPDATE SET
                  external_thread_id = excluded.external_thread_id,
                  external_conversation_id = excluded.external_conversation_id,
                  status = excluded.status,
                  last_event_json = excluded.last_event_json,
                  metadata_json = excluded.metadata_json,
                  updated_at = excluded.updated_at
                """.trimIndent(),
            )
            .param("id", session.id)
            .param("chatSessionId", session.chatSessionId)
            .param("provider", session.provider)
            .param("externalThreadId", session.externalThreadId)
            .param("externalConversationId", session.externalConversationId)
            .param("status", session.status)
            .param("lastEventJson", session.lastEventJson)
            .param("metadataJson", session.metadataJson)
            .param("createdAt", session.createdAt)
            .param("updatedAt", session.updatedAt)
            .update()
    }

    private fun row(rs: ResultSet, rowNumber: Int): AiProviderSessionDto =
        AiProviderSessionDto(
            id = rs.getString("id"),
            chatSessionId = rs.getString("chat_session_id"),
            provider = rs.getString("provider"),
            externalThreadId = rs.getString("external_thread_id"),
            externalConversationId = rs.getString("external_conversation_id"),
            status = rs.getString("status"),
            lastEventJson = rs.getString("last_event_json"),
            metadataJson = rs.getString("metadata_json"),
            createdAt = rs.getString("created_at"),
            updatedAt = rs.getString("updated_at"),
        )
}
