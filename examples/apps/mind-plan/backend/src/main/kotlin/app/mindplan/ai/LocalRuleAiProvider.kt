package app.mindplan.ai

import app.mindplan.plan.TaskNodeDto
import org.springframework.stereotype.Component
import kotlin.math.max

@Component
class LocalRuleAiProvider : AiProvider {
    override val id: String = "local-rule"

    override fun complete(request: AiProviderRequest): AiProviderResult {
        val message = request.message.trim()
        val lowered = message.lowercase()
        val operations = buildList {
            if (lowered.contains("완료") || lowered.contains("끝냈")) {
                findMentionedTasks(message, request.plan.tasks)
                    .ifEmpty { request.plan.tasks.filter { it.status != "done" }.take(1) }
                    .forEach { task ->
                        add(AiOperation(op = "update_task", taskId = task.id, patch = mapOf("status" to "done")))
                    }
            }

            if (lowered.contains("진행") || lowered.contains("시작")) {
                findMentionedTasks(message, request.plan.tasks)
                    .forEach { task ->
                        add(AiOperation(op = "update_task", taskId = task.id, patch = mapOf("status" to "in_progress")))
                    }
            }

            extractTaskTitles(message).forEachIndexed { index, title ->
                add(
                    AiOperation(
                        op = "create_task",
                        patch = mapOf(
                            "title" to title,
                            "description" to "채팅 요청에서 생성된 작업입니다.",
                            "status" to "todo",
                            "priority" to "normal",
                            "x" to (120 + ((request.plan.tasks.size + index) % 3) * 260),
                            "y" to (160 + max(0, (request.plan.tasks.size + index) / 3) * 180),
                        ),
                    ),
                )
            }

            val titleCandidate = extractPlanTitle(message)
            if (titleCandidate != null) {
                add(AiOperation(op = "update_plan", patch = mapOf("title" to titleCandidate)))
            }

            if (request.chatHistory.count { it.role == "user" } <= 1) {
                val title = titleCandidate ?: message.take(24).ifBlank { "계획 상담" }
                add(AiOperation(op = "set_chat_title", patch = mapOf("title" to title)))
            }
        }

        return AiProviderResult(
            message = buildResponse(message, operations),
            operations = operations,
        )
    }

    private fun buildResponse(message: String, operations: List<AiOperation>): String =
        if (operations.isEmpty()) {
            """
            요청을 읽었습니다.

            현재 계획을 크게 바꾸는 명확한 작업 지시는 찾지 못했어요. `할 일 추가: ...`, `A 작업 완료`, `계획 제목을 ...로 변경`처럼 말하면 바로 반영할 수 있습니다.
            """.trimIndent()
        } else {
            val summary = operations.groupingBy { it.op }.eachCount()
            buildString {
                appendLine("반영할 수 있는 변경을 정리했습니다.")
                appendLine()
                summary.forEach { (op, count) -> appendLine("- `${op}` ${count}건") }
                appendLine()
                append("원문 요청: ")
                append(message)
            }
        }

    private fun extractTaskTitles(message: String): List<String> {
        val explicit = Regex("""(?:할 ?일|작업|todo|task)\s*(?:추가|만들어|생성)\s*[:：]\s*(.+)""", RegexOption.IGNORE_CASE)
            .find(message)
            ?.groupValues
            ?.getOrNull(1)
            ?.split(",", "\n", "·")
            ?.map { it.trim().trim('-', ' ') }
            ?.filter { it.length >= 2 }
            .orEmpty()

        val bullet = message
            .lineSequence()
            .map { it.trim() }
            .filter { it.startsWith("- ") || it.startsWith("* ") }
            .map { it.drop(2).trim() }
            .filter { it.length >= 2 }
            .toList()

        return (explicit + bullet).distinct().take(8)
    }

    private fun extractPlanTitle(message: String): String? =
        Regex("""계획\s*제목(?:을|은)?\s*(.+?)(?:로|으로)\s*(?:변경|바꿔|수정)""")
            .find(message)
            ?.groupValues
            ?.getOrNull(1)
            ?.trim()
            ?.takeIf { it.length >= 2 }

    private fun findMentionedTasks(message: String, tasks: List<TaskNodeDto>): List<TaskNodeDto> =
        tasks.filter { task -> message.contains(task.title, ignoreCase = true) }
}
