package app.tripplanner.common

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
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
                    message = error.message ?: "Upstream service is unavailable.",
                ),
            )
}
