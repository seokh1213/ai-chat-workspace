package app.tripplanner.workspace

import com.fasterxml.jackson.annotation.JsonIgnore

data class WorkspaceDto(
    val id: String,
    val owner: String,
    val name: String,
    val aiProvider: String,
    val aiModel: String,
    val aiEffort: String,
    val openAiBaseUrl: String?,
    @get:JsonIgnore
    val openAiApiKey: String?,
    @get:JsonIgnore
    val openRouterApiKey: String?,
    val openRouterReferer: String?,
    val openRouterTitle: String?,
    @get:JsonIgnore
    val settingsJson: String,
    val createdAt: String,
    val updatedAt: String,
)

data class CreateWorkspaceRequest(
    val name: String,
    val aiProvider: String? = null,
    val aiModel: String? = null,
    val aiEffort: String? = null,
    val openAiBaseUrl: String? = null,
    val openAiApiKey: String? = null,
    val openRouterApiKey: String? = null,
    val openRouterReferer: String? = null,
    val openRouterTitle: String? = null,
)

data class UpdateWorkspaceRequest(
    val name: String? = null,
    val aiProvider: String? = null,
    val aiModel: String? = null,
    val aiEffort: String? = null,
    val openAiBaseUrl: String? = null,
    val openAiApiKey: String? = null,
    val openRouterApiKey: String? = null,
    val openRouterReferer: String? = null,
    val openRouterTitle: String? = null,
)
