package app.mindplan.workspace

import app.mindplan.ai.AiProviderStatusService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/workspaces")
class WorkspaceController(
    private val service: WorkspaceService,
    private val providerStatusService: AiProviderStatusService,
) {
    @GetMapping
    fun list(): List<WorkspaceDto> = service.list()

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@Valid @RequestBody request: CreateWorkspaceRequest): WorkspaceDto =
        service.create(request)

    @PutMapping("/{workspaceId}")
    fun update(
        @PathVariable workspaceId: String,
        @Valid @RequestBody request: UpdateWorkspaceRequest,
    ): WorkspaceDto = service.update(workspaceId, request)

    @DeleteMapping("/{workspaceId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable workspaceId: String) = service.delete(workspaceId)

    @GetMapping("/{workspaceId}/provider-status")
    fun providerStatus(@PathVariable workspaceId: String): List<AiProviderStatusDto> =
        providerStatusService.status()
}
