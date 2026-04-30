package app.mindplan.ai

import app.mindplan.workspace.AiProviderStatusDto
import app.mindplan.workspace.AiProviderCheckDto
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.stereotype.Service
import java.nio.file.Files
import java.nio.file.Path
import java.util.concurrent.TimeUnit

@Service
@EnableConfigurationProperties(AiProperties::class)
class AiProviderStatusService(
    private val properties: AiProperties,
    private val modelCatalog: CliModelCatalogService,
) {
    fun status(): List<AiProviderStatusDto> =
        listOf(
            codexStatus(),
            claudeStatus(),
            configurableStatus(
                id = "openai-compatible",
                displayName = "OpenAI 호환",
                detail = "워크스페이스 설정의 Base URL, API key, 모델을 사용합니다.",
            ),
            configurableStatus(
                id = "openrouter",
                displayName = "OpenRouter",
                detail = "워크스페이스 설정의 OpenRouter API key와 모델을 사용합니다.",
            ),
        )

    private fun codexStatus(): AiProviderStatusDto {
        val installCheck = commandCheck(label = "codex command", command = "codex")
        val authCheck = authCheck(
            label = "auth",
            candidates = listOf(".codex/auth", ".codex/auth.json", ".codex/auth.toml"),
            missingDetail = "~/.codex/auth 파일을 찾지 못했습니다.",
        )
        val ready = installCheck.status == "ok" && authCheck.status == "ok"
        return AiProviderStatusDto(
            id = "codex-app-server",
            displayName = "Codex app-server",
            available = ready,
            status = if (ready) "ready" else "warning",
            detail = if (ready) {
                "codex 명령어와 인증 정보를 확인했습니다."
            } else {
                "codex app-server를 쓰려면 codex 명령어와 ~/.codex 인증 상태가 필요합니다."
            },
            checks = listOf(installCheck, authCheck),
            models = modelCatalog.models("codex-app-server"),
        )
    }

    private fun claudeStatus(): AiProviderStatusDto {
        val installCheck = commandCheck(label = "claude command", command = properties.claude.command)
        val authCheck = claudeAuthCheck()
        val ready = installCheck.status == "ok" && authCheck.status == "ok"
        return AiProviderStatusDto(
            id = "claude-cli",
            displayName = "Claude CLI",
            available = ready,
            status = if (ready) "ready" else "warning",
            detail = if (ready) {
                "Claude CLI 명령어와 로그인 상태를 확인했습니다."
            } else if (installCheck.status == "ok") {
                "Claude CLI는 설치되어 있지만 로그인 상태 확인이 필요합니다."
            } else {
                "Claude CLI 명령어를 찾지 못했습니다."
            },
            checks = listOf(installCheck, authCheck),
            models = modelCatalog.models("claude-cli"),
        )
    }

    private fun configurableStatus(
        id: String,
        displayName: String,
        detail: String,
    ): AiProviderStatusDto =
        AiProviderStatusDto(
            id = id,
            displayName = displayName,
            available = true,
            status = "configurable",
            detail = detail,
            models = modelCatalog.models(id),
        )

    private fun commandCheck(label: String, command: String): AiProviderCheckDto {
        val resolvedCommand = resolveCliCommand(command)
        val process = runCatching {
            ProcessBuilder(resolvedCommand, "--version")
                .redirectErrorStream(true)
                .start()
        }.getOrNull() ?: return AiProviderCheckDto(
            label = label,
            status = "error",
            detail = "$command 명령을 실행할 수 없습니다.",
        )

        val completed = process.waitFor(900, TimeUnit.MILLISECONDS)
        if (!completed) {
            process.destroyForcibly()
            return AiProviderCheckDto(
                label = label,
                status = "warning",
                detail = "$command --version 응답 대기 중",
            )
        }

        val output = process.inputStream.bufferedReader().readText().trim().lineSequence().firstOrNull().orEmpty()
        return AiProviderCheckDto(
            label = label,
            status = if (process.exitValue() == 0) "ok" else "error",
            detail = output.ifBlank { "exit ${process.exitValue()}" },
        )
    }

    private fun authCheck(
        label: String,
        candidates: List<String>,
        missingDetail: String,
    ): AiProviderCheckDto {
        val home = System.getProperty("user.home")
        val existing = candidates
            .map { Path.of(home, it) }
            .firstOrNull(Files::exists)
        return AiProviderCheckDto(
            label = label,
            status = if (existing == null) "warning" else "ok",
            detail = existing?.toString()?.replace(home, "~") ?: missingDetail,
        )
    }

    private fun claudeAuthCheck(): AiProviderCheckDto {
        val command = resolveCliCommand(properties.claude.command)
        val process = runCatching {
            ProcessBuilder(command, "auth", "status")
                .redirectErrorStream(true)
                .start()
        }.getOrNull() ?: return AiProviderCheckDto(
            label = "auth",
            status = "error",
            detail = "claude auth status 명령을 실행할 수 없습니다.",
        )

        val completed = process.waitFor(900, TimeUnit.MILLISECONDS)
        if (!completed) {
            process.destroyForcibly()
            return AiProviderCheckDto(
                label = "auth",
                status = "warning",
                detail = "claude auth status 응답 대기 중",
            )
        }

        val output = process.inputStream.bufferedReader().readText().trim()
        val loggedIn = "\"loggedIn\": true" in output
        val loggedOut = "\"loggedIn\": false" in output
        val authMethod = Regex("\"authMethod\"\\s*:\\s*\"([^\"]+)\"")
            .find(output)
            ?.groupValues
            ?.getOrNull(1)
        return AiProviderCheckDto(
            label = "auth",
            status = if (process.exitValue() == 0 && loggedIn) "ok" else "warning",
            detail = when {
                loggedIn -> listOfNotNull("로그인됨", authMethod?.let { "authMethod=$it" }).joinToString(", ")
                loggedOut -> listOfNotNull("로그인되지 않음", authMethod?.let { "authMethod=$it" }).joinToString(", ")
                else -> output.lineSequence().firstOrNull { it.isNotBlank() && it != "{" } ?: "exit ${process.exitValue()}"
            },
        )
    }
}
