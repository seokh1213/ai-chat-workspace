package app.tripplanner.trip

import org.junit.jupiter.api.Assertions.assertDoesNotThrow
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test

class TripOperationAccessorsTests {
    @Test
    fun `replace day plan items require valid item title before mutation`() {
        assertThrows(IllegalArgumentException::class.java) {
            listOf(mapOf("memo" to "title missing")).validateReplacementItems()
        }
    }

    @Test
    fun `replace day plan items may derive title from valid place`() {
        assertDoesNotThrow {
            listOf(mapOf("place" to mapOf("name" to "와이탄"))).validateReplacementItems()
        }
    }

    @Test
    fun `replace day plan rejects malformed place payload before mutation`() {
        assertThrows(IllegalArgumentException::class.java) {
            listOf(mapOf("title" to "와이탄", "place" to "not an object")).validateReplacementItems()
        }
    }
}
