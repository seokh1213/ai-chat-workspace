package app.mindplan.plan

import app.mindplan.ai.AiOperation
import app.mindplan.common.ClockProvider
import app.mindplan.common.IdGenerator
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class PlanService(
    private val repository: PlanRepository,
    private val ids: IdGenerator,
    private val clock: ClockProvider,
    private val objectMapper: ObjectMapper,
) {
    fun list(workspaceId: String): List<PlanDto> = repository.findPlans(workspaceId)

    fun get(planId: String): PlanDto =
        repository.findPlan(planId) ?: throw NoSuchElementException("Plan not found.")

    fun detail(planId: String): PlanDetailDto =
        PlanDetailDto(
            plan = get(planId),
            tasks = repository.findTasks(planId),
            links = repository.findLinks(planId),
        )

    @Transactional
    fun create(workspaceId: String, request: CreatePlanRequest): PlanDetailDto {
        val now = clock.nowText()
        val plan = PlanDto(
            id = ids.planId(),
            workspaceId = workspaceId,
            title = request.title.trim(),
            summary = request.summary?.trim()?.takeIf { it.isNotBlank() },
            dueDate = request.dueDate?.trim()?.takeIf { it.isNotBlank() },
            status = "active",
            currentView = "canvas",
            createdAt = now,
            updatedAt = now,
        )
        repository.insertPlan(plan)
        return detail(plan.id)
    }

    @Transactional
    fun update(planId: String, request: UpdatePlanRequest): PlanDto {
        val current = get(planId)
        val updated = current.copy(
            title = request.title.trim(),
            summary = request.summary?.trim()?.takeIf { it.isNotBlank() },
            dueDate = request.dueDate?.trim()?.takeIf { it.isNotBlank() },
            status = request.status.takeIf { it in planStatuses } ?: current.status,
            currentView = request.currentView.takeIf { it in planViews } ?: current.currentView,
            updatedAt = clock.nowText(),
        )
        repository.updatePlan(updated)
        return updated
    }

    @Transactional
    fun delete(planId: String) = repository.deletePlan(planId)

    @Transactional
    fun createTask(planId: String, request: CreateTaskRequest): TaskNodeDto {
        get(planId)
        val now = clock.nowText()
        val count = repository.countTasks(planId)
        val task = TaskNodeDto(
            id = request.id?.trim()?.takeIf { it.isNotBlank() } ?: ids.taskId(),
            planId = planId,
            parentId = request.parentId?.takeIf { it.isNotBlank() },
            title = request.title.trim(),
            description = request.description?.trim()?.takeIf { it.isNotBlank() },
            status = request.status.normalizedStatus(),
            priority = request.priority.normalizedPriority(),
            dueDate = request.dueDate?.trim()?.takeIf { it.isNotBlank() },
            x = request.x ?: (120.0 + (count % 3) * 260.0),
            y = request.y ?: (140.0 + (count / 3) * 180.0),
            sortOrder = request.sortOrder ?: count + 1,
            createdAt = now,
            updatedAt = now,
        )
        repository.insertTask(task)
        touchPlan(planId)
        return task
    }

    @Transactional
    fun updateTask(taskId: String, request: UpdateTaskRequest): TaskNodeDto {
        val current = repository.findTask(taskId) ?: throw NoSuchElementException("Task not found.")
        val updated = current.copy(
            parentId = request.parentId?.takeIf { it.isNotBlank() },
            title = request.title.trim(),
            description = request.description?.trim()?.takeIf { it.isNotBlank() },
            status = request.status.normalizedStatus(),
            priority = request.priority.normalizedPriority(),
            dueDate = request.dueDate?.trim()?.takeIf { it.isNotBlank() },
            x = request.x,
            y = request.y,
            sortOrder = request.sortOrder,
            updatedAt = clock.nowText(),
        )
        repository.updateTask(updated)
        touchPlan(updated.planId)
        return updated
    }

    @Transactional
    fun deleteTask(taskId: String) {
        val current = repository.findTask(taskId) ?: throw NoSuchElementException("Task not found.")
        repository.deleteTask(taskId)
        touchPlan(current.planId)
    }

    @Transactional
    fun createLink(planId: String, request: CreateLinkRequest): TaskLinkDto {
        val now = clock.nowText()
        val link = TaskLinkDto(
            id = request.id?.trim()?.takeIf { it.isNotBlank() } ?: ids.linkId(),
            planId = planId,
            sourceNodeId = request.sourceNodeId,
            targetNodeId = request.targetNodeId,
            label = request.label?.trim()?.takeIf { it.isNotBlank() },
            createdAt = now,
        )
        repository.insertLink(link)
        touchPlan(planId)
        return link
    }

    @Transactional
    fun deleteLink(planId: String, linkId: String) {
        repository.deleteLink(linkId)
        touchPlan(planId)
    }

    fun snapshot(planId: String): String =
        objectMapper.writeValueAsString(detail(planId))

    @Transactional
    fun createCheckpoint(planId: String, title: String): String {
        val id = ids.checkpointId()
        repository.insertCheckpoint(id, planId, title, snapshot(planId), clock.nowText())
        return id
    }

    @Transactional
    fun applyOperations(planId: String, operations: List<AiOperation>): List<AiOperation> {
        val applied = mutableListOf<AiOperation>()
        operations.forEach { operation ->
            when (operation.op) {
                "create_task" -> {
                    createTask(
                        planId,
                        CreateTaskRequest(
                            title = operation.patch.string("title") ?: return@forEach,
                            description = operation.patch.string("description"),
                            status = operation.patch.string("status") ?: "todo",
                            priority = operation.patch.string("priority") ?: "normal",
                            dueDate = operation.patch.string("dueDate"),
                            parentId = operation.patch.string("parentId"),
                            x = operation.patch.double("x"),
                            y = operation.patch.double("y"),
                        ),
                    )
                    applied += operation
                }
                "update_task" -> {
                    val task = operation.taskId?.let(repository::findTask) ?: return@forEach
                    updateTask(
                        task.id,
                        UpdateTaskRequest(
                            title = operation.patch.string("title") ?: task.title,
                            description = operation.patch.string("description") ?: task.description,
                            status = operation.patch.string("status") ?: task.status,
                            priority = operation.patch.string("priority") ?: task.priority,
                            dueDate = operation.patch.string("dueDate") ?: task.dueDate,
                            parentId = operation.patch.string("parentId") ?: task.parentId,
                            x = operation.patch.double("x") ?: task.x,
                            y = operation.patch.double("y") ?: task.y,
                            sortOrder = operation.patch.int("sortOrder") ?: task.sortOrder,
                        ),
                    )
                    applied += operation
                }
                "delete_task" -> {
                    val taskId = operation.taskId ?: return@forEach
                    deleteTask(taskId)
                    applied += operation
                }
                "update_plan" -> {
                    val current = get(planId)
                    update(
                        planId,
                        UpdatePlanRequest(
                            title = operation.patch.string("title") ?: current.title,
                            summary = operation.patch.string("summary") ?: current.summary,
                            dueDate = operation.patch.string("dueDate") ?: current.dueDate,
                            status = operation.patch.string("status") ?: current.status,
                            currentView = operation.patch.string("currentView") ?: current.currentView,
                        ),
                    )
                    applied += operation
                }
            }
        }
        return applied
    }

    private fun touchPlan(planId: String) {
        val current = get(planId)
        repository.updatePlan(current.copy(updatedAt = clock.nowText()))
    }
}

private val planStatuses = setOf("active", "paused", "done")
private val planViews = setOf("canvas", "kanban", "mindmap")
private val taskStatuses = setOf("todo", "in_progress", "done")
private val taskPriorities = setOf("low", "normal", "high")

private fun String.normalizedStatus(): String = takeIf { it in taskStatuses } ?: "todo"

private fun String.normalizedPriority(): String = takeIf { it in taskPriorities } ?: "normal"

private fun Map<String, Any?>.string(key: String): String? =
    this[key]?.toString()?.trim()?.takeIf { it.isNotBlank() }

private fun Map<String, Any?>.double(key: String): Double? =
    when (val value = this[key]) {
        is Number -> value.toDouble()
        is String -> value.toDoubleOrNull()
        else -> null
    }

private fun Map<String, Any?>.int(key: String): Int? =
    when (val value = this[key]) {
        is Number -> value.toInt()
        is String -> value.toIntOrNull()
        else -> null
    }
