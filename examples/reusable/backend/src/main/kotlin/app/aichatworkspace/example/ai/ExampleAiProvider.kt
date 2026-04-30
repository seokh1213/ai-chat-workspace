package app.aichatworkspace.example.ai

import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import org.springframework.stereotype.Component

@Component
class ExampleAiProvider : AiProvider {
    override val id: String = "example"
    override val displayName: String = "Example Provider"

    override fun streamChat(request: AiChatRequest): Flow<AiStreamEvent> = flow {
        emit(AiStreamEvent.RunStarted)
        emit(AiStreamEvent.Activity(AiProviderActivity(kind = "thinking", label = "요청을 분석하는 중입니다.")))
        delay(250)

        val message = "요청을 읽었습니다.\n\n- 이 응답은 provider streaming 예시입니다.\n- 실제 구현에서는 Codex/OpenAI/OpenRouter adapter가 같은 이벤트를 emit합니다."
        message.chunked(18).forEach { chunk ->
            emit(AiStreamEvent.MessageDelta(chunk))
            delay(40)
        }

        val operations = if (request.content.contains("추가")) {
            listOf(
                mapOf(
                    "op" to "domain.upsert_record",
                    "record" to mapOf(
                        "type" to "note",
                        "title" to "AI가 추가한 기록",
                        "body" to "예시 operation으로 생성된 기록입니다.",
                    ),
                ),
            )
        } else {
            emptyList()
        }

        if (operations.isNotEmpty()) {
            emit(AiStreamEvent.OperationsProposed(operations))
        }
        emit(AiStreamEvent.ResultCompleted(AiProviderResult(message = message, operations = operations)))
        emit(AiStreamEvent.RunCompleted)
    }
}

