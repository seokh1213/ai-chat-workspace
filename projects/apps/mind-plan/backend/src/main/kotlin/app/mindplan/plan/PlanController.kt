package app.mindplan.plan

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
@RequestMapping("/api")
class PlanController(
    private val service: PlanService,
) {
    @GetMapping("/workspaces/{workspaceId}/plans")
    fun list(@PathVariable workspaceId: String): List<PlanDto> =
        service.list(workspaceId)

    @PostMapping("/workspaces/{workspaceId}/plans")
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @PathVariable workspaceId: String,
        @Valid @RequestBody request: CreatePlanRequest,
    ): PlanDetailDto = service.create(workspaceId, request)

    @GetMapping("/plans/{planId}")
    fun detail(@PathVariable planId: String): PlanDetailDto =
        service.detail(planId)

    @PutMapping("/plans/{planId}")
    fun update(
        @PathVariable planId: String,
        @Valid @RequestBody request: UpdatePlanRequest,
    ): PlanDto = service.update(planId, request)

    @DeleteMapping("/plans/{planId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable planId: String) =
        service.delete(planId)

    @PostMapping("/plans/{planId}/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    fun createTask(
        @PathVariable planId: String,
        @Valid @RequestBody request: CreateTaskRequest,
    ): TaskNodeDto = service.createTask(planId, request)

    @PutMapping("/tasks/{taskId}")
    fun updateTask(
        @PathVariable taskId: String,
        @Valid @RequestBody request: UpdateTaskRequest,
    ): TaskNodeDto = service.updateTask(taskId, request)

    @DeleteMapping("/tasks/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteTask(@PathVariable taskId: String) =
        service.deleteTask(taskId)

    @PostMapping("/plans/{planId}/links")
    @ResponseStatus(HttpStatus.CREATED)
    fun createLink(
        @PathVariable planId: String,
        @Valid @RequestBody request: CreateLinkRequest,
    ): TaskLinkDto = service.createLink(planId, request)

    @DeleteMapping("/plans/{planId}/links/{linkId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteLink(
        @PathVariable planId: String,
        @PathVariable linkId: String,
    ) = service.deleteLink(planId, linkId)
}
