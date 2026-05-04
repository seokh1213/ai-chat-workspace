package app.mindplan.workspace

import app.mindplan.common.ClockProvider
import app.mindplan.common.IdGenerator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class WorkspaceService(
    private val repository: WorkspaceRepository,
    private val ids: IdGenerator,
    private val clock: ClockProvider,
) {
    fun list(): List<WorkspaceDto> = repository.findAll()

    fun get(id: String): WorkspaceDto =
        repository.findById(id) ?: throw NoSuchElementException("Workspace not found.")

    @Transactional
    fun create(request: CreateWorkspaceRequest): WorkspaceDto {
        val now = clock.nowText()
        val workspace = WorkspaceDto(
            id = ids.workspaceId(),
            name = request.name.trim(),
            aiProvider = "local-rule",
            aiSettingsJson = "{}",
            createdAt = now,
            updatedAt = now,
        )
        repository.insert(workspace)
        return workspace
    }

    @Transactional
    fun update(id: String, request: UpdateWorkspaceRequest): WorkspaceDto {
        val current = get(id)
        val updated = current.copy(
            name = request.name.trim(),
            aiProvider = request.aiProvider?.takeIf { it.isNotBlank() } ?: current.aiProvider,
            aiSettingsJson = request.aiSettingsJson?.takeIf { it.isNotBlank() } ?: current.aiSettingsJson,
            updatedAt = clock.nowText(),
        )
        repository.update(updated)
        return updated
    }

    @Transactional
    fun delete(id: String) = repository.delete(id)
}
