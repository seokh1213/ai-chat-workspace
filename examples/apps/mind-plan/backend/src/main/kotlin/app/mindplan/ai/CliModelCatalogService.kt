package app.mindplan.ai

import app.mindplan.workspace.AiProviderModelDto
import jakarta.annotation.PostConstruct
import org.springframework.stereotype.Service
import java.nio.file.Files
import java.nio.file.Path
import java.util.concurrent.TimeUnit

@Service
class CliModelCatalogService(
    private val properties: AiProperties,
) {
    private var discoveredModels: Map<String, List<AiProviderModelDto>> = emptyMap()

    @PostConstruct
    fun load() {
        discoveredModels = mapOf(
            "codex-app-server" to discoverCodexModels(),
            "claude-cli" to discoverClaudeModels(),
            "openai-compatible" to OpenAiModels,
            "openrouter" to OpenRouterModels,
        )
    }

    fun models(providerId: String): List<AiProviderModelDto> =
        discoveredModels[providerId].orEmpty()

    private fun discoverClaudeModels(): List<AiProviderModelDto> {
        val help = commandOutput(properties.claude.command, "--help")
        val fullModelExamples = Regex("'(claude-[^']+)'")
            .findAll(help)
            .map { match -> match.groupValues[1] }
            .distinct()
            .map { model -> AiProviderModelDto(model, model, "Claude CLI help에서 발견한 전체 모델명 예시") }
            .toList()

        return (ClaudeAliasModels + fullModelExamples).distinctBy { it.value }
    }

    private fun discoverCodexModels(): List<AiProviderModelDto> {
        val configuredModel = readCodexConfiguredModel()
            ?.let { AiProviderModelDto(it, it, "~/.codex/config.toml의 현재 model") }

        return (listOfNotNull(configuredModel) + CodexFallbackModels).distinctBy { it.value }
    }

    private fun readCodexConfiguredModel(): String? {
        val config = Path.of(System.getProperty("user.home"), ".codex", "config.toml")
        if (!Files.exists(config)) return null
        val text = runCatching { Files.readString(config) }.getOrNull() ?: return null
        return Regex("""(?m)^\s*model\s*=\s*["']([^"']+)["']""")
            .find(text)
            ?.groupValues
            ?.getOrNull(1)
            ?.takeIf { it.isNotBlank() }
    }

    private fun commandOutput(vararg command: String): String {
        val resolvedCommand = command
            .toMutableList()
            .also { if (it.isNotEmpty()) it[0] = resolveCliCommand(it[0]) }
        val process = runCatching {
            ProcessBuilder(resolvedCommand)
                .redirectErrorStream(true)
                .start()
        }.getOrNull() ?: return ""

        val completed = process.waitFor(1500, TimeUnit.MILLISECONDS)
        if (!completed) {
            process.destroyForcibly()
            return ""
        }
        return process.inputStream.bufferedReader().readText()
    }
}

private val ClaudeAliasModels = listOf(
    AiProviderModelDto("default", "Default", "계정 유형에 따른 Claude Code 권장 모델"),
    AiProviderModelDto("sonnet", "Sonnet", "Claude Code 최신 Sonnet alias"),
    AiProviderModelDto("opus", "Opus", "Claude Code 최신 Opus alias"),
    AiProviderModelDto("haiku", "Haiku", "Claude Code 최신 Haiku alias"),
    AiProviderModelDto("sonnet[1m]", "Sonnet 1M", "긴 세션용 100만 토큰 컨텍스트 alias"),
    AiProviderModelDto("opusplan", "Opus Plan", "계획 모드에서는 Opus, 실행 시 Sonnet으로 전환"),
)

private val CodexFallbackModels = listOf(
    AiProviderModelDto("gpt-5.4-mini", "GPT-5.4 Mini", "빠른 응답과 비용 균형"),
    AiProviderModelDto("gpt-5.4", "GPT-5.4", "일반 작업용 균형 모델"),
    AiProviderModelDto("gpt-5.3-codex-spark", "GPT-5.3 Codex Spark", "가벼운 코딩 작업에 빠른 모델"),
    AiProviderModelDto("gpt-5.3-codex", "GPT-5.3 Codex", "코딩 작업 특화 모델"),
    AiProviderModelDto("gpt-5.2", "GPT-5.2", "안정적인 장문 작업용 모델"),
    AiProviderModelDto("gpt-5.5", "GPT-5.5", "복잡한 작업용 고성능 모델"),
)

private val OpenAiModels = listOf(
    AiProviderModelDto("gpt-5.4-mini", "GPT-5.4 Mini", "기본 추천"),
    AiProviderModelDto("gpt-5.4", "GPT-5.4", "일반 작업용"),
    AiProviderModelDto("gpt-5.2", "GPT-5.2", "안정적인 장문 작업용"),
    AiProviderModelDto("gpt-4.1", "GPT-4.1", "호환 엔드포인트 후보"),
)

private val OpenRouterModels = listOf(
    AiProviderModelDto("openai/gpt-5.2", "openai/gpt-5.2", "OpenRouter 기본 추천"),
    AiProviderModelDto("openai/gpt-4o", "openai/gpt-4o", "OpenRouter 호환 후보"),
)
