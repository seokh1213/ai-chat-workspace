package app.mindplan.workspace

import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Repository
import java.sql.ResultSet

@Repository
class WorkspaceRepository(
    private val jdbcClient: JdbcClient,
) {
    fun findAll(): List<WorkspaceDto> =
        jdbcClient
            .sql(
                """
                SELECT id, name, ai_provider, ai_settings_json, created_at, updated_at
                FROM workspaces
                ORDER BY updated_at DESC, created_at DESC
                """.trimIndent(),
            )
            .query(::workspaceRow)
            .list()

    fun findById(id: String): WorkspaceDto? =
        jdbcClient
            .sql(
                """
                SELECT id, name, ai_provider, ai_settings_json, created_at, updated_at
                FROM workspaces
                WHERE id = :id
                """.trimIndent(),
            )
            .param("id", id)
            .query(::workspaceRow)
            .optional()
            .orElse(null)

    fun insert(workspace: WorkspaceDto) {
        jdbcClient
            .sql(
                """
                INSERT INTO workspaces (id, name, ai_provider, ai_settings_json, created_at, updated_at)
                VALUES (:id, :name, :aiProvider, :aiSettingsJson, :createdAt, :updatedAt)
                """.trimIndent(),
            )
            .bind(workspace)
            .update()
    }

    fun update(workspace: WorkspaceDto) {
        val updated = jdbcClient
            .sql(
                """
                UPDATE workspaces
                SET name = :name,
                    ai_provider = :aiProvider,
                    ai_settings_json = :aiSettingsJson,
                    updated_at = :updatedAt
                WHERE id = :id
                """.trimIndent(),
            )
            .bind(workspace)
            .update()

        if (updated == 0) {
            throw NoSuchElementException("Workspace not found.")
        }
    }

    fun delete(id: String) {
        val deleted = jdbcClient
            .sql("DELETE FROM workspaces WHERE id = :id")
            .param("id", id)
            .update()

        if (deleted == 0) {
            throw NoSuchElementException("Workspace not found.")
        }
    }

    private fun workspaceRow(rs: ResultSet, rowNumber: Int): WorkspaceDto =
        WorkspaceDto(
            id = rs.getString("id"),
            name = rs.getString("name"),
            aiProvider = rs.getString("ai_provider"),
            aiSettingsJson = rs.getString("ai_settings_json"),
            createdAt = rs.getString("created_at"),
            updatedAt = rs.getString("updated_at"),
        )
}

private fun JdbcClient.StatementSpec.bind(workspace: WorkspaceDto): JdbcClient.StatementSpec =
    param("id", workspace.id)
        .param("name", workspace.name)
        .param("aiProvider", workspace.aiProvider)
        .param("aiSettingsJson", workspace.aiSettingsJson)
        .param("createdAt", workspace.createdAt)
        .param("updatedAt", workspace.updatedAt)
