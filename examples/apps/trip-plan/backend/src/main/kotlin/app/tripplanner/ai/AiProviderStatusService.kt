package app.tripplanner.ai

import org.springframework.stereotype.Service
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.nio.file.Files
import java.nio.file.Path
import java.time.Duration
import java.util.concurrent.TimeUnit

@Service
class AiProviderStatusService(
    private val registry: AiProviderRegistry,
    private val codexProperties: CodexAppServerProperties,
    private val codexProcessManager: CodexAppServerProcessManager,
) {
    private val httpClient = HttpClient
        .newBuilder()
        .connectTimeout(Duration.ofMillis(800))
        .build()

    fun statuses(): List<AiProviderStatusDto> =
        registry.userVisibleProviders().map { provider ->
            when (provider.id) {
                "codex-app-server" -> codexStatus(provider)
                "openai-compatible" -> provider.status(
                    available = true,
                    status = "configurable",
                    detail = "워크스페이스 설정의 Base URL, API key, 모델을 사용합니다.",
                )
                "openrouter" -> provider.status(
                    available = true,
                    status = "configurable",
                    detail = "워크스페이스 설정의 OpenRouter API key와 모델을 사용합니다.",
                )
                else -> provider.status(available = false, status = "unknown", detail = "No health check configured.")
            }
    }

    private fun codexStatus(provider: AiProvider): AiProviderStatusDto {
        val healthUri = codexProperties.url.toCodexAppServerHealthUri()
        val processDetail = codexProcessManager.statusDetail()
        val installCheck = codexInstallCheck()
        val authCheck = codexAuthCheck()
        return runCatching {
            val request = HttpRequest
                .newBuilder(healthUri)
                .timeout(Duration.ofMillis(1000))
                .GET()
                .build()
            val response = httpClient.send(request, HttpResponse.BodyHandlers.discarding())
            val available = response.statusCode() in 200..299
            provider.status(
                available = available,
                status = if (available) "ready" else "unavailable",
                detail = listOfNotNull("healthz ${response.statusCode()}", processDetail).joinToString(", "),
                checks = listOf(
                    installCheck,
                    authCheck,
                    AiProviderCheckDto(
                        label = "app-server",
                        status = if (available) "ok" else "error",
                        detail = listOfNotNull("healthz ${response.statusCode()}", processDetail).joinToString(", "),
                    ),
                ),
            )
        }.getOrElse { error ->
            provider.status(
                available = false,
                status = "offline",
                detail = listOfNotNull(
                    error.message ?: "Codex app-server is not reachable.",
                    processDetail,
                ).joinToString(", "),
                checks = listOf(
                    installCheck,
                    authCheck,
                    AiProviderCheckDto(
                        label = "app-server",
                        status = "error",
                        detail = listOfNotNull(error.message, processDetail).joinToString(", "),
                    ),
                ),
            )
        }
    }

    private fun codexInstallCheck(): AiProviderCheckDto {
        val process = runCatching {
            ProcessBuilder(codexProperties.executable, "--version")
                .redirectErrorStream(true)
                .start()
        }.getOrNull() ?: return AiProviderCheckDto(
            label = "codex command",
            status = "error",
            detail = "${codexProperties.executable} 명령을 실행할 수 없습니다.",
        )

        val completed = process.waitFor(900, TimeUnit.MILLISECONDS)
        if (!completed) {
            process.destroyForcibly()
            return AiProviderCheckDto(
                label = "codex command",
                status = "warning",
                detail = "${codexProperties.executable} --version 응답 대기 중",
            )
        }

        val output = process.inputStream.bufferedReader().readText().trim().lineSequence().firstOrNull().orEmpty()
        return AiProviderCheckDto(
            label = "codex command",
            status = if (process.exitValue() == 0) "ok" else "error",
            detail = output.ifBlank { "exit ${process.exitValue()}" },
        )
    }

    private fun codexAuthCheck(): AiProviderCheckDto {
        val home = System.getProperty("user.home")
        val candidates = listOf(
            Path.of(home, ".codex", "auth"),
            Path.of(home, ".codex", "auth.json"),
            Path.of(home, ".codex", "auth.toml"),
        )
        val existing = candidates.firstOrNull(Files::exists)
        return AiProviderCheckDto(
            label = "auth",
            status = if (existing == null) "warning" else "ok",
            detail = existing?.toString()?.replace(home, "~") ?: "~/.codex/auth 파일을 찾지 못했습니다.",
        )
    }

    private fun AiProvider.status(
        available: Boolean,
        status: String,
        detail: String?,
        checks: List<AiProviderCheckDto> = emptyList(),
    ): AiProviderStatusDto =
        AiProviderStatusDto(
            id = id,
            displayName = displayName,
            available = available,
            status = status,
            detail = detail,
            checks = checks,
        )
}
