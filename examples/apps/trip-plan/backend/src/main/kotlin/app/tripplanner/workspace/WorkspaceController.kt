package app.tripplanner.workspace

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/workspaces")
class WorkspaceController(
    private val service: WorkspaceService,
) {
    @GetMapping
    fun findAll(): List<WorkspaceDto> = service.findAll()

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody request: CreateWorkspaceRequest): WorkspaceDto = service.create(request)

    @PatchMapping("/{workspaceId}")
    fun update(
        @PathVariable workspaceId: String,
        @RequestBody request: UpdateWorkspaceRequest,
    ): WorkspaceDto = service.update(workspaceId, request)

    @DeleteMapping("/{workspaceId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable workspaceId: String) {
        service.delete(workspaceId)
    }
}
