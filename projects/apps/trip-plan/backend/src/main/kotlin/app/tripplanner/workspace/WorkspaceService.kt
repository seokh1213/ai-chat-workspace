package app.tripplanner.workspace

import app.tripplanner.common.ClockProvider
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
class WorkspaceService(
    private val repository: WorkspaceRepository,
    private val clockProvider: ClockProvider,
) {
    private val objectMapper = jacksonObjectMapper()

    @Transactional(readOnly = true)
    fun findAll(): List<WorkspaceDto> = repository.findAll()

    @Transactional
    fun create(request: CreateWorkspaceRequest): WorkspaceDto {
        val now = clockProvider.nowText()
        val aiSettings = workspaceAiSettings(
            provider = request.aiProvider,
            model = request.aiModel,
            effort = request.aiEffort,
            openAiBaseUrl = request.openAiBaseUrl,
            openAiApiKey = request.openAiApiKey,
            openRouterApiKey = request.openRouterApiKey,
            openRouterReferer = request.openRouterReferer,
            openRouterTitle = request.openRouterTitle,
        )
        val workspace = WorkspaceDto(
            id = "workspace_${UUID.randomUUID()}",
            name = request.name.trim(),
            aiProvider = aiSettings.provider,
            aiModel = aiSettings.model,
            aiEffort = aiSettings.effort,
            openAiBaseUrl = aiSettings.openAiBaseUrl,
            openAiApiKey = aiSettings.openAiApiKey,
            openRouterApiKey = aiSettings.openRouterApiKey,
            openRouterReferer = aiSettings.openRouterReferer,
            openRouterTitle = aiSettings.openRouterTitle,
            settingsJson = workspaceSettingsJson(aiSettings),
            createdAt = now,
            updatedAt = now,
        )

        require(workspace.name.isNotEmpty()) { "Workspace name must not be blank." }

        repository.insert(workspace)
        return workspace
    }

    @Transactional
    fun update(workspaceId: String, request: UpdateWorkspaceRequest): WorkspaceDto {
        val existing = repository.find(workspaceId) ?: throw NoSuchElementException("Workspace not found.")
        val name = request.name?.trim().takeUnless { it.isNullOrEmpty() } ?: existing.name
        require(name.isNotEmpty()) { "Workspace name must not be blank." }
        val aiSettings = workspaceAiSettings(
            provider = request.aiProvider ?: existing.aiProvider,
            model = request.aiModel ?: existing.aiModel,
            effort = request.aiEffort ?: existing.aiEffort,
            openAiBaseUrl = settingValue(request.openAiBaseUrl, existing.openAiBaseUrl),
            openAiApiKey = settingValue(request.openAiApiKey, existing.openAiApiKey),
            openRouterApiKey = settingValue(request.openRouterApiKey, existing.openRouterApiKey),
            openRouterReferer = settingValue(request.openRouterReferer, existing.openRouterReferer),
            openRouterTitle = settingValue(request.openRouterTitle, existing.openRouterTitle),
        )
        val now = clockProvider.nowText()

        val workspace = existing.copy(
            name = name,
            aiProvider = aiSettings.provider,
            aiModel = aiSettings.model,
            aiEffort = aiSettings.effort,
            openAiBaseUrl = aiSettings.openAiBaseUrl,
            openAiApiKey = aiSettings.openAiApiKey,
            openRouterApiKey = aiSettings.openRouterApiKey,
            openRouterReferer = aiSettings.openRouterReferer,
            openRouterTitle = aiSettings.openRouterTitle,
            settingsJson = workspaceSettingsJson(aiSettings),
            updatedAt = now,
        )
        repository.update(workspace)
        if (existing.settingsHash() != workspace.settingsHash()) {
            repository.updateChatSessionAiSettings(
                workspaceId = workspace.id,
                provider = workspace.aiProvider,
                model = workspace.aiModel,
                settingsJson = workspace.settingsJson,
                updatedAt = now,
            )
            if (existing.aiProvider != workspace.aiProvider) {
                repository.deactivateProviderSessions(workspaceId = workspace.id, updatedAt = now)
            }
        }
        return workspace
    }

    @Transactional
    fun delete(workspaceId: String) {
        val workspaces = repository.findAll()
        require(workspaces.size > 1) { "Cannot delete the last workspace." }
        repository.delete(workspaceId)
    }

    private fun workspaceAiSettings(
        provider: String?,
        model: String?,
        effort: String?,
        openAiBaseUrl: String? = null,
        openAiApiKey: String? = null,
        openRouterApiKey: String? = null,
        openRouterReferer: String? = null,
        openRouterTitle: String? = null,
    ): WorkspaceAiSettings {
        val normalizedProvider = provider?.trim().takeUnless { it.isNullOrEmpty() } ?: DefaultAiProvider
        val normalizedModel = model?.trim().takeUnless { it.isNullOrEmpty() } ?: defaultModel(normalizedProvider)
        val normalizedEffort = effort?.trim().takeUnless { it.isNullOrEmpty() } ?: DefaultAiEffort
        require(normalizedProvider in SupportedAiProviders) { "Unsupported AI provider: $normalizedProvider" }
        require(normalizedEffort in SupportedAiEfforts) { "Unsupported AI effort: $normalizedEffort" }
        return WorkspaceAiSettings(
            provider = normalizedProvider,
            model = normalizedModel,
            effort = normalizedEffort,
            openAiBaseUrl = openAiBaseUrl?.trim().takeUnless { it.isNullOrEmpty() } ?: DefaultOpenAiBaseUrl,
            openAiApiKey = openAiApiKey?.trim().takeUnless { it.isNullOrEmpty() },
            openRouterApiKey = openRouterApiKey?.trim().takeUnless { it.isNullOrEmpty() },
            openRouterReferer = openRouterReferer?.trim().takeUnless { it.isNullOrEmpty() },
            openRouterTitle = openRouterTitle?.trim().takeUnless { it.isNullOrEmpty() } ?: DefaultOpenRouterTitle,
        )
    }

    private fun workspaceSettingsJson(settings: WorkspaceAiSettings): String =
        objectMapper.writeValueAsString(
            buildMap {
                put("aiEffort", settings.effort)
                put("openAiBaseUrl", settings.openAiBaseUrl)
                settings.openAiApiKey?.let { put("openAiApiKey", it) }
                settings.openRouterApiKey?.let { put("openRouterApiKey", it) }
                settings.openRouterReferer?.let { put("openRouterReferer", it) }
                put("openRouterTitle", settings.openRouterTitle)
            },
        )

    private fun settingValue(requestValue: String?, existingValue: String?): String? =
        if (requestValue == null) existingValue else requestValue

    private fun WorkspaceDto.settingsHash(): String =
        listOf(aiProvider, aiModel, aiEffort, openAiBaseUrl, openAiApiKey, openRouterApiKey, openRouterReferer, openRouterTitle)
            .joinToString(separator = "\u001F")
}

private data class WorkspaceAiSettings(
    val provider: String,
    val model: String,
    val effort: String,
    val openAiBaseUrl: String,
    val openAiApiKey: String?,
    val openRouterApiKey: String?,
    val openRouterReferer: String?,
    val openRouterTitle: String,
)

private const val DefaultAiProvider = "codex-app-server"
private const val DefaultAiModel = "gpt-5.4-mini"
private const val DefaultOpenRouterModel = "openai/gpt-5.2"
private const val DefaultAiEffort = "medium"
private const val DefaultOpenAiBaseUrl = "https://api.openai.com/v1/chat/completions"
private const val DefaultOpenRouterTitle = "Trip Planner"
private val SupportedAiProviders = setOf("codex-app-server", "openai-compatible", "openrouter")
private val SupportedAiEfforts = setOf("low", "medium", "high", "xhigh")

private fun defaultModel(provider: String): String =
    when (provider) {
        "openrouter" -> DefaultOpenRouterModel
        else -> DefaultAiModel
    }
