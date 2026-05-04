package app.tripplanner.workspace

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Repository

@Repository
class WorkspaceRepository(
    private val jdbcClient: JdbcClient,
) {
    private val objectMapper: ObjectMapper = jacksonObjectMapper()

    fun findAll(): List<WorkspaceDto> =
        jdbcClient
            .sql(
                """
                SELECT id, name, ai_provider, ai_model, ai_effort, settings_json, created_at, updated_at
                FROM workspaces
                ORDER BY created_at ASC
                """.trimIndent(),
            )
            .query { rs, _ ->
                rs.toWorkspace()
            }
            .list()

    fun find(workspaceId: String): WorkspaceDto? =
        jdbcClient
            .sql(
                """
                SELECT id, name, ai_provider, ai_model, ai_effort, settings_json, created_at, updated_at
                FROM workspaces
                WHERE id = :workspaceId
                """.trimIndent(),
            )
            .param("workspaceId", workspaceId)
            .query { rs, _ -> rs.toWorkspace() }
            .optional()
            .orElse(null)

    fun insert(workspace: WorkspaceDto) {
        jdbcClient
            .sql(
                """
                INSERT INTO workspaces (
                  id, name, ai_provider, ai_model, ai_effort, settings_json, created_at, updated_at
                ) VALUES (
                  :id, :name, :aiProvider, :aiModel, :aiEffort, :settingsJson, :createdAt, :updatedAt
                )
                """.trimIndent(),
            )
            .bindWorkspace(workspace)
            .update()
    }

    fun update(workspace: WorkspaceDto) {
        val updated = jdbcClient
            .sql(
                """
                UPDATE workspaces
                SET name = :name,
                    ai_provider = :aiProvider,
                    ai_model = :aiModel,
                    ai_effort = :aiEffort,
                    settings_json = :settingsJson,
                    updated_at = :updatedAt
                WHERE id = :id
                """.trimIndent(),
            )
            .bindWorkspace(workspace)
            .update()

        if (updated == 0) {
            throw NoSuchElementException("Workspace not found.")
        }
    }

    fun updateChatSessionAiSettings(
        workspaceId: String,
        provider: String,
        model: String,
        settingsJson: String,
        updatedAt: String,
    ) {
        jdbcClient
            .sql(
                """
                UPDATE chat_sessions
                SET provider = :provider,
                    model = :model,
                    settings_json = :settingsJson,
                    updated_at = :updatedAt
                WHERE trip_id IN (
                    SELECT id
                    FROM trips
                    WHERE workspace_id = :workspaceId
                )
                """.trimIndent(),
            )
            .param("workspaceId", workspaceId)
            .param("provider", provider)
            .param("model", model)
            .param("settingsJson", settingsJson)
            .param("updatedAt", updatedAt)
            .update()
    }

    fun deactivateProviderSessions(workspaceId: String, updatedAt: String) {
        jdbcClient
            .sql(
                """
                UPDATE ai_provider_sessions
                SET status = 'inactive',
                    updated_at = :updatedAt
                WHERE chat_session_id IN (
                    SELECT chat_sessions.id
                    FROM chat_sessions
                    INNER JOIN trips ON trips.id = chat_sessions.trip_id
                    WHERE trips.workspace_id = :workspaceId
                )
                """.trimIndent(),
            )
            .param("workspaceId", workspaceId)
            .param("updatedAt", updatedAt)
            .update()
    }

    fun delete(workspaceId: String) {
        val deleted = jdbcClient
            .sql("DELETE FROM workspaces WHERE id = :workspaceId")
            .param("workspaceId", workspaceId)
            .update()

        if (deleted == 0) {
            throw NoSuchElementException("Workspace not found.")
        }
    }

    private fun java.sql.ResultSet.toWorkspace(): WorkspaceDto {
        val settingsJson = getString("settings_json")
        val settings = parseSettings(settingsJson)
        return WorkspaceDto(
            id = getString("id"),
            name = getString("name"),
            aiProvider = getString("ai_provider"),
            aiModel = getString("ai_model"),
            aiEffort = getString("ai_effort"),
            openAiBaseUrl = settings.textOrNull("openAiBaseUrl"),
            openAiApiKey = settings.textOrNull("openAiApiKey"),
            openRouterApiKey = settings.textOrNull("openRouterApiKey"),
            openRouterReferer = settings.textOrNull("openRouterReferer"),
            openRouterTitle = settings.textOrNull("openRouterTitle"),
            settingsJson = settingsJson,
            createdAt = getString("created_at"),
            updatedAt = getString("updated_at"),
        )
    }

    private fun parseSettings(settingsJson: String): JsonNode =
        runCatching { objectMapper.readTree(settingsJson) }.getOrDefault(objectMapper.createObjectNode())

    private fun JsonNode.textOrNull(fieldName: String): String? =
        path(fieldName)
            .takeIf { node -> node.isTextual }
            ?.asText()
            ?.trim()
            ?.takeIf(String::isNotBlank)
}

private fun JdbcClient.StatementSpec.bindWorkspace(workspace: WorkspaceDto): JdbcClient.StatementSpec =
    param("id", workspace.id)
        .param("name", workspace.name)
        .param("aiProvider", workspace.aiProvider)
        .param("aiModel", workspace.aiModel)
        .param("aiEffort", workspace.aiEffort)
        .param("settingsJson", workspace.settingsJson)
        .param("createdAt", workspace.createdAt)
        .param("updatedAt", workspace.updatedAt)
