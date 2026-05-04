package app.mindplan.plan

import jakarta.validation.constraints.NotBlank

data class PlanDto(
    val id: String,
    val workspaceId: String,
    val title: String,
    val summary: String?,
    val dueDate: String?,
    val status: String,
    val currentView: String,
    val createdAt: String,
    val updatedAt: String,
)

data class TaskNodeDto(
    val id: String,
    val planId: String,
    val parentId: String?,
    val title: String,
    val description: String?,
    val status: String,
    val priority: String,
    val dueDate: String?,
    val x: Double,
    val y: Double,
    val sortOrder: Int,
    val createdAt: String,
    val updatedAt: String,
)

data class TaskLinkDto(
    val id: String,
    val planId: String,
    val sourceNodeId: String,
    val targetNodeId: String,
    val label: String?,
    val createdAt: String,
)

data class PlanDetailDto(
    val plan: PlanDto,
    val tasks: List<TaskNodeDto>,
    val links: List<TaskLinkDto>,
)

data class CreatePlanRequest(
    @field:NotBlank val title: String,
    val summary: String? = null,
    val dueDate: String? = null,
)

data class UpdatePlanRequest(
    @field:NotBlank val title: String,
    val summary: String? = null,
    val dueDate: String? = null,
    val status: String = "active",
    val currentView: String = "canvas",
)

data class CreateTaskRequest(
    val id: String? = null,
    @field:NotBlank val title: String,
    val description: String? = null,
    val status: String = "todo",
    val priority: String = "normal",
    val dueDate: String? = null,
    val parentId: String? = null,
    val x: Double? = null,
    val y: Double? = null,
    val sortOrder: Int? = null,
)

data class UpdateTaskRequest(
    @field:NotBlank val title: String,
    val description: String? = null,
    val status: String = "todo",
    val priority: String = "normal",
    val dueDate: String? = null,
    val parentId: String? = null,
    val x: Double = 0.0,
    val y: Double = 0.0,
    val sortOrder: Int = 0,
)

data class CreateLinkRequest(
    val id: String? = null,
    @field:NotBlank val sourceNodeId: String,
    @field:NotBlank val targetNodeId: String,
    val label: String? = null,
)
