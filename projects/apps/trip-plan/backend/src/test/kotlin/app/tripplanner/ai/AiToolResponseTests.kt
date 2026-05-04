package app.tripplanner.ai

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class AiToolResponseTests {
    private val parser = AiProviderResponseParser()

    @Test
    fun `stream filter emits markdown and hides split tool block`() {
        val filter = ToolBlockStreamFilter()

        assertEquals("첫 줄\n", filter.accept("첫 줄\n<to"))
        assertEquals("", filter.accept("ol>{\"operations\":["))
        assertEquals("\n마무리", filter.accept("]}</tool>\n마무리"))

        assertTrue(filter.hasEmitted)
        assertEquals("", filter.finish())
    }

    @Test
    fun `stream filter preserves non tool angle brackets`() {
        val filter = ToolBlockStreamFilter()

        assertEquals("1 < 2", filter.accept("1 < 2"))
        assertEquals("", filter.finish())
    }

    @Test
    fun `stream filter hides legacy json operation payload`() {
        val filter = ToolBlockStreamFilter()

        assertEquals("설명을 정리하겠습니다.", filter.accept("설명을 정리하겠습니다.{\"message\":\"완료\","))
        assertEquals("", filter.accept("\"operations\":[{\"op\":\"update_item\",\"itemId\":\"item_1\",\"patch\":{\"memo\":\"새 메모\"}}]}"))
        assertEquals("", filter.finish())
    }

    @Test
    fun `parser reads operations from hidden tool block`() {
        val result = parser.parseAssistantToolResponse(
            """
            첫날은 와이탄 중심으로 가볍게 잡겠습니다.

            <tool>
            {"operations":[{"op":"add_item","day":1,"item":{"title":"와이탄 산책","type":"poi","category":"sight","lat":31.2397,"lng":121.4998}}]}
            </tool>
            """.trimIndent(),
        )

        assertEquals("첫날은 와이탄 중심으로 가볍게 잡겠습니다.", result.message)
        assertEquals(1, result.operations.size)
        assertEquals("add_item", result.operations.first()["op"])
        assertFalse(result.message.contains("<tool>"))
    }

    @Test
    fun `parser reads operations from legacy json appended after markdown`() {
        val result = parser.parseAssistantToolResponse(
            """
            1일차 항목들의 메모를 읽기 쉽게 정리하겠습니다.{"message":"1일차 노드 설명을 수정해뒀어요.","operations":[{"op":"update_item","itemId":"item_1","patch":{"memo":"새 메모"}}]}
            """.trimIndent(),
        )

        assertEquals("1일차 노드 설명을 수정해뒀어요.", result.message)
        assertEquals(1, result.operations.size)
        assertEquals("update_item", result.operations.first()["op"])
    }

    @Test
    fun `parser keeps plain markdown when there is no tool block`() {
        val result = parser.parseAssistantToolResponse("첫날은 이동 부담을 줄이는 편이 좋습니다.")

        assertEquals("첫날은 이동 부담을 줄이는 편이 좋습니다.", result.message)
        assertTrue(result.operations.isEmpty())
    }
}
