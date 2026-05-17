package app.tripplanner.chat

import java.sql.ResultSet

internal const val AttachmentSelectSql = """
SELECT id, chat_session_id, chat_message_id, original_filename, content_type, byte_size,
       kind, text_preview, created_at
FROM chat_files.chat_attachments
"""

internal fun sessionRow(rs: ResultSet, rowNumber: Int): ChatSessionDto =
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

internal fun messageRow(rs: ResultSet, rowNumber: Int): ChatMessageDto =
    ChatMessageDto(
        id = rs.getString("id"),
        chatSessionId = rs.getString("chat_session_id"),
        role = rs.getString("role"),
        content = rs.getString("content"),
        status = rs.getString("status"),
        metadataJson = rs.getString("metadata_json"),
        createdAt = rs.getString("created_at"),
    )

internal fun attachmentRow(rs: ResultSet, rowNumber: Int): ChatAttachmentDto =
    ChatAttachmentDto(
        id = rs.getString("id"),
        chatSessionId = rs.getString("chat_session_id"),
        chatMessageId = rs.getString("chat_message_id"),
        fileName = rs.getString("original_filename"),
        contentType = rs.getString("content_type"),
        byteSize = rs.getLong("byte_size"),
        kind = rs.getString("kind"),
        downloadUrl = "/api/chat-sessions/${rs.getString("chat_session_id")}/attachments/${rs.getString("id")}/content",
        textPreview = rs.getString("text_preview"),
        createdAt = rs.getString("created_at"),
    )

internal fun aiEditRunRow(rs: ResultSet, rowNumber: Int): AiEditRunDto =
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

private fun ResultSet.getNullableLong(column: String): Long? {
    val value = getLong(column)
    return if (wasNull()) null else value
}
