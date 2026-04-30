package app.mindplan.plan

import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Repository
import java.sql.ResultSet

@Repository
class PlanRepository(
    private val jdbcClient: JdbcClient,
) {
    fun findPlans(workspaceId: String): List<PlanDto> =
        jdbcClient
            .sql(
                """
                SELECT id, workspace_id, title, summary, due_date, status, current_view, created_at, updated_at
                FROM plans
                WHERE workspace_id = :workspaceId
                ORDER BY updated_at DESC, created_at DESC
                """.trimIndent(),
            )
            .param("workspaceId", workspaceId)
            .query(::planRow)
            .list()

    fun findPlan(planId: String): PlanDto? =
        jdbcClient
            .sql(
                """
                SELECT id, workspace_id, title, summary, due_date, status, current_view, created_at, updated_at
                FROM plans
                WHERE id = :planId
                """.trimIndent(),
            )
            .param("planId", planId)
            .query(::planRow)
            .optional()
            .orElse(null)

    fun insertPlan(plan: PlanDto) {
        jdbcClient
            .sql(
                """
                INSERT INTO plans (
                  id, workspace_id, title, summary, due_date, status, current_view, created_at, updated_at
                ) VALUES (
                  :id, :workspaceId, :title, :summary, :dueDate, :status, :currentView, :createdAt, :updatedAt
                )
                """.trimIndent(),
            )
            .bindPlan(plan)
            .update()
    }

    fun updatePlan(plan: PlanDto) {
        val updated = jdbcClient
            .sql(
                """
                UPDATE plans
                SET title = :title,
                    summary = :summary,
                    due_date = :dueDate,
                    status = :status,
                    current_view = :currentView,
                    updated_at = :updatedAt
                WHERE id = :id
                """.trimIndent(),
            )
            .bindPlan(plan)
            .update()

        if (updated == 0) throw NoSuchElementException("Plan not found.")
    }

    fun deletePlan(planId: String) {
        val deleted = jdbcClient
            .sql("DELETE FROM plans WHERE id = :planId")
            .param("planId", planId)
            .update()

        if (deleted == 0) throw NoSuchElementException("Plan not found.")
    }

    fun findTasks(planId: String): List<TaskNodeDto> =
        jdbcClient
            .sql(
                """
                SELECT id, plan_id, parent_id, title, description, status, priority, due_date,
                       x, y, sort_order, created_at, updated_at
                FROM task_nodes
                WHERE plan_id = :planId
                ORDER BY sort_order ASC, created_at ASC
                """.trimIndent(),
            )
            .param("planId", planId)
            .query(::taskRow)
            .list()

    fun findTask(taskId: String): TaskNodeDto? =
        jdbcClient
            .sql(
                """
                SELECT id, plan_id, parent_id, title, description, status, priority, due_date,
                       x, y, sort_order, created_at, updated_at
                FROM task_nodes
                WHERE id = :taskId
                """.trimIndent(),
            )
            .param("taskId", taskId)
            .query(::taskRow)
            .optional()
            .orElse(null)

    fun countTasks(planId: String): Int =
        jdbcClient
            .sql("SELECT COUNT(*) FROM task_nodes WHERE plan_id = :planId")
            .param("planId", planId)
            .query(Int::class.java)
            .single()

    fun insertTask(task: TaskNodeDto) {
        jdbcClient
            .sql(
                """
                INSERT INTO task_nodes (
                  id, plan_id, parent_id, title, description, status, priority, due_date,
                  x, y, sort_order, created_at, updated_at
                ) VALUES (
                  :id, :planId, :parentId, :title, :description, :status, :priority, :dueDate,
                  :x, :y, :sortOrder, :createdAt, :updatedAt
                )
                """.trimIndent(),
            )
            .bindTask(task)
            .update()
    }

    fun updateTask(task: TaskNodeDto) {
        val updated = jdbcClient
            .sql(
                """
                UPDATE task_nodes
                SET parent_id = :parentId,
                    title = :title,
                    description = :description,
                    status = :status,
                    priority = :priority,
                    due_date = :dueDate,
                    x = :x,
                    y = :y,
                    sort_order = :sortOrder,
                    updated_at = :updatedAt
                WHERE id = :id
                """.trimIndent(),
            )
            .bindTask(task)
            .update()

        if (updated == 0) throw NoSuchElementException("Task not found.")
    }

    fun deleteTask(taskId: String) {
        val deleted = jdbcClient
            .sql("DELETE FROM task_nodes WHERE id = :taskId")
            .param("taskId", taskId)
            .update()

        if (deleted == 0) throw NoSuchElementException("Task not found.")
    }

    fun findLinks(planId: String): List<TaskLinkDto> =
        jdbcClient
            .sql(
                """
                SELECT id, plan_id, source_node_id, target_node_id, label, created_at
                FROM task_links
                WHERE plan_id = :planId
                ORDER BY created_at ASC
                """.trimIndent(),
            )
            .param("planId", planId)
            .query(::linkRow)
            .list()

    fun insertLink(link: TaskLinkDto) {
        jdbcClient
            .sql(
                """
                INSERT INTO task_links (id, plan_id, source_node_id, target_node_id, label, created_at)
                VALUES (:id, :planId, :sourceNodeId, :targetNodeId, :label, :createdAt)
                """.trimIndent(),
            )
            .param("id", link.id)
            .param("planId", link.planId)
            .param("sourceNodeId", link.sourceNodeId)
            .param("targetNodeId", link.targetNodeId)
            .param("label", link.label)
            .param("createdAt", link.createdAt)
            .update()
    }

    fun deleteLink(linkId: String) {
        val deleted = jdbcClient
            .sql("DELETE FROM task_links WHERE id = :linkId")
            .param("linkId", linkId)
            .update()

        if (deleted == 0) throw NoSuchElementException("Link not found.")
    }

    fun insertCheckpoint(id: String, planId: String, title: String, snapshotJson: String, createdAt: String) {
        jdbcClient
            .sql(
                """
                INSERT INTO plan_checkpoints (id, plan_id, title, snapshot_json, created_at)
                VALUES (:id, :planId, :title, :snapshotJson, :createdAt)
                """.trimIndent(),
            )
            .param("id", id)
            .param("planId", planId)
            .param("title", title)
            .param("snapshotJson", snapshotJson)
            .param("createdAt", createdAt)
            .update()
    }

    private fun planRow(rs: ResultSet, rowNumber: Int): PlanDto =
        PlanDto(
            id = rs.getString("id"),
            workspaceId = rs.getString("workspace_id"),
            title = rs.getString("title"),
            summary = rs.getString("summary"),
            dueDate = rs.getString("due_date"),
            status = rs.getString("status"),
            currentView = rs.getString("current_view"),
            createdAt = rs.getString("created_at"),
            updatedAt = rs.getString("updated_at"),
        )

    private fun taskRow(rs: ResultSet, rowNumber: Int): TaskNodeDto =
        TaskNodeDto(
            id = rs.getString("id"),
            planId = rs.getString("plan_id"),
            parentId = rs.getString("parent_id"),
            title = rs.getString("title"),
            description = rs.getString("description"),
            status = rs.getString("status"),
            priority = rs.getString("priority"),
            dueDate = rs.getString("due_date"),
            x = rs.getDouble("x"),
            y = rs.getDouble("y"),
            sortOrder = rs.getInt("sort_order"),
            createdAt = rs.getString("created_at"),
            updatedAt = rs.getString("updated_at"),
        )

    private fun linkRow(rs: ResultSet, rowNumber: Int): TaskLinkDto =
        TaskLinkDto(
            id = rs.getString("id"),
            planId = rs.getString("plan_id"),
            sourceNodeId = rs.getString("source_node_id"),
            targetNodeId = rs.getString("target_node_id"),
            label = rs.getString("label"),
            createdAt = rs.getString("created_at"),
        )
}

private fun JdbcClient.StatementSpec.bindPlan(plan: PlanDto): JdbcClient.StatementSpec =
    param("id", plan.id)
        .param("workspaceId", plan.workspaceId)
        .param("title", plan.title)
        .param("summary", plan.summary)
        .param("dueDate", plan.dueDate)
        .param("status", plan.status)
        .param("currentView", plan.currentView)
        .param("createdAt", plan.createdAt)
        .param("updatedAt", plan.updatedAt)

private fun JdbcClient.StatementSpec.bindTask(task: TaskNodeDto): JdbcClient.StatementSpec =
    param("id", task.id)
        .param("planId", task.planId)
        .param("parentId", task.parentId)
        .param("title", task.title)
        .param("description", task.description)
        .param("status", task.status)
        .param("priority", task.priority)
        .param("dueDate", task.dueDate)
        .param("x", task.x)
        .param("y", task.y)
        .param("sortOrder", task.sortOrder)
        .param("createdAt", task.createdAt)
        .param("updatedAt", task.updatedAt)
