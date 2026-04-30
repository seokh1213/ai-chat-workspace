package app.aichatworkspace.example.domain

import org.springframework.stereotype.Component
import java.util.UUID

@Component
class GenericRecordsDomainAdapter : DomainAdapter {
    override val type: String = "generic-records"

    override fun buildContext(dataSpaceId: String): DomainContext =
        DomainContext(
            dataSpaceId = dataSpaceId,
            json = """{"dataSpaceId":"$dataSpaceId","records":[]}""",
        )

    override fun operationSchema(): Map<String, Any?> =
        mapOf(
            "supported" to listOf(
                "chat.set_title",
                "domain.upsert_record",
                "domain.update_record",
                "domain.delete_record",
            ),
        )

    override fun promptRules(): String =
        """
        - 사용자에게 보이는 답변은 한국어 Markdown으로 작성한다.
        - 데이터 수정은 <tool>{"operations":[...]}</tool>에만 넣는다.
        - 불확실한 id를 수정하지 않는다.
        """.trimIndent()

    override fun previewOperations(operations: List<Map<String, Any?>>): List<String> =
        operations.mapNotNull { operation ->
            when (operation["op"]?.toString()) {
                "chat.set_title" -> "대화 제목 변경"
                "domain.upsert_record" -> "기록 추가 또는 갱신"
                "domain.update_record" -> "기록 수정"
                "domain.delete_record" -> "기록 삭제"
                else -> null
            }
        }

    override fun applyOperations(dataSpaceId: String, operations: List<Map<String, Any?>>): DomainApplyResult {
        // 예시 코드다. 실제 프로젝트에서는 repository transaction 안에서 검증 후 적용한다.
        return DomainApplyResult(
            checkpointId = if (operations.isEmpty()) null else "checkpoint_${UUID.randomUUID()}",
            operationPreview = previewOperations(operations),
        )
    }
}

