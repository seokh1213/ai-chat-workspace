package app.todoai

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.springframework.stereotype.Component

@Component
class TodoCodexPromptBuilder {
    private val objectMapper = jacksonObjectMapper()

    fun developerInstructions(): String =
        """
        당신은 Todo AI Workspace의 실제 AI 편집 에이전트입니다.
        사용자는 채팅으로 할일 원천 데이터를 상담하고 수정합니다.

        응답 규칙:
        - 사용자에게 보이는 답변은 한국어 Markdown으로 자연스럽고 간결하게 작성하세요.
        - Todo 데이터를 수정해야 하면 답변 맨 끝에 정확히 하나의 숨김 tool block을 붙이세요.
        - tool block은 사용자에게 설명하지 마세요.
        - 수정이 없으면 tool block을 생략하세요.
        - 모호하면 데이터를 수정하지 말고 무엇이 필요한지 물어보세요.

        숨김 tool block 형식:
        <tool>
        {"operations":[{"type":"ADD_TODO","title":"할일 제목","description":"설명","priority":"MEDIUM"}]}
        </tool>

        지원 operations:
        - ADD_TODO: {"type":"ADD_TODO","title":"제목","description":"설명","priority":"LOW|MEDIUM|HIGH"}
        - UPDATE_TODO: {"type":"UPDATE_TODO","todoId":"기존 id","patch":{"title":"선택","description":"선택","status":"TODO|DOING|DONE","priority":"LOW|MEDIUM|HIGH"}}
        - COMPLETE_TODO: {"type":"COMPLETE_TODO","todoId":"기존 id"}
        - DELETE_TODO: {"type":"DELETE_TODO","todoId":"기존 id"}

        현재 Todo 목록에 있는 id만 todoId로 사용하세요.
        새 할일은 ADD_TODO를 사용하세요.
        사용자가 "완료", "끝", "했어"라고 하면 가장 적합한 기존 항목을 COMPLETE_TODO로 처리하세요.
        사용자가 우선순위나 상태를 바꾸라고 하면 UPDATE_TODO를 사용하세요.
        """.trimIndent()

    fun buildTurnPrompt(state: WorkspaceState, userText: String): String {
        val todos = state.todos.map { todo ->
            mapOf(
                "id" to todo.id,
                "title" to todo.title,
                "description" to todo.description,
                "status" to todo.status.name,
                "priority" to todo.priority.name,
            )
        }
        val recentMessages = state.messages.takeLast(8).map { message ->
            mapOf(
                "role" to message.role.name.lowercase(),
                "content" to message.content,
            )
        }

        return listOf(
            "워크스페이스:",
            objectMapper.writeValueAsString(
                mapOf(
                    "id" to state.workspace.id,
                    "name" to state.workspace.name,
                    "aiProvider" to state.workspace.aiProvider,
                    "model" to state.workspace.aiModel,
                    "effort" to state.workspace.aiEffort,
                ),
            ),
            "",
            "현재 Todo 원천 데이터:",
            objectMapper.writeValueAsString(todos),
            "",
            "최근 대화:",
            objectMapper.writeValueAsString(recentMessages),
            "",
            "이번 사용자 요청:",
            userText.trim(),
            "",
            "위 요청에 답변하고, 필요하면 지원 operations를 hidden <tool> block으로 제안하세요.",
        ).joinToString("\n")
    }
}
