package app.tripplanner.ai

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import java.nio.file.Files
import java.nio.file.Path

class CodexAppServerTokenTests {
    @TempDir
    lateinit var tempDir: Path

    @Test
    fun `unset token file sends no authorization header`() {
        assertNull(CodexAppServerProperties(tokenFile = null).authorizationHeader())
        assertNull(CodexAppServerProperties(tokenFile = " ").authorizationHeader())
    }

    @Test
    fun `missing token file sends no authorization header`() {
        val properties = CodexAppServerProperties(tokenFile = tempDir.resolve("absent").toString())

        assertNull(properties.authorizationHeader())
    }

    @Test
    fun `blank token file sends no authorization header`() {
        assertNull(propertiesWithToken("\n").authorizationHeader())
    }

    @Test
    fun `token file content is trimmed into a bearer header`() {
        assertEquals("Bearer abc123", propertiesWithToken("  abc123\n").authorizationHeader())
    }

    @Test
    fun `token file is read again for every connection`() {
        val properties = propertiesWithToken("first-token")
        assertEquals("Bearer first-token", properties.authorizationHeader())

        Files.writeString(Path.of(properties.tokenFile!!), "second-token")

        assertEquals("Bearer second-token", properties.authorizationHeader())
    }

    @Test
    fun `token that is not header safe is rejected without echoing it`() {
        val properties = propertiesWithToken("secret-part other-part")

        val error = assertThrows(IllegalStateException::class.java) { properties.authorizationHeader() }

        assertFalse(error.stackTraceToString().contains("secret-part"))
    }

    private fun propertiesWithToken(content: String): CodexAppServerProperties =
        CodexAppServerProperties(tokenFile = Files.writeString(tempDir.resolve("token"), content).toString())
}
