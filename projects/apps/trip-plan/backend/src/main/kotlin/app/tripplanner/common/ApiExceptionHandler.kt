package app.tripplanner.common

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.multipart.MaxUploadSizeExceededException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

data class ErrorResponse(
    val error: String,
    val message: String,
)

@RestControllerAdvice
class ApiExceptionHandler {
    @ExceptionHandler(IllegalArgumentException::class)
    fun handleIllegalArgumentException(error: IllegalArgumentException): ResponseEntity<ErrorResponse> =
        ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(
                ErrorResponse(
                    error = "bad_request",
                    message = error.message ?: "Invalid request.",
                ),
            )

    @ExceptionHandler(NoSuchElementException::class)
    fun handleNoSuchElementException(error: NoSuchElementException): ResponseEntity<ErrorResponse> =
        ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(
                ErrorResponse(
                    error = "not_found",
                    message = error.message ?: "Resource not found.",
                ),
            )

    @ExceptionHandler(IllegalStateException::class)
    fun handleIllegalStateException(error: IllegalStateException): ResponseEntity<ErrorResponse> =
        ResponseEntity
            .status(HttpStatus.BAD_GATEWAY)
            .body(
                ErrorResponse(
                    error = "upstream_unavailable",
                    message = redactExternalErrorMessage(error.message ?: "Upstream service is unavailable."),
                ),
            )

    @ExceptionHandler(MaxUploadSizeExceededException::class)
    fun handleMaxUploadSizeExceeded(error: MaxUploadSizeExceededException): ResponseEntity<ErrorResponse> =
        ResponseEntity
            .status(HttpStatus.PAYLOAD_TOO_LARGE)
            .body(
                ErrorResponse(
                    error = "payload_too_large",
                    message = "Attachment is too large.",
                ),
            )
}

private val bearerTokenPattern = Regex("(?i)\\bBearer\\s+[A-Za-z0-9._~+/=-]{8,}")
private val sensitiveFieldPattern = Regex("(?i)\"?(api[_-]?key|token|secret|authorization)\"?\\s*[:=]\\s*\"?[^\"\\s,}]+")
private val longCredentialPattern = Regex("\\b[A-Za-z0-9._~+/=-]{32,}\\b")

fun redactExternalErrorMessage(message: String): String {
    val redacted = message
        .replace(bearerTokenPattern, "Bearer [REDACTED]")
        .replace(sensitiveFieldPattern) { match ->
            val field = match.groupValues[1]
            "$field=[REDACTED]"
        }
        .replace(longCredentialPattern, "[REDACTED]")
        .replace(Regex("[\\r\\n\\t]+"), " ")
        .trim()
    return redacted.take(MaxExternalErrorMessageChars).ifBlank { "Upstream service is unavailable." }
}

private const val MaxExternalErrorMessageChars = 500
