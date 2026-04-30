package app.mindplan.workspace

import jakarta.validation.constraints.NotBlank

data class WorkspaceDto(
    val id: String,
    val name: String,
    val aiProvider: String,
    val aiSettingsJson: String,
    val createdAt: String,
    val updatedAt: String,
)

data class CreateWorkspaceRequest(
    @field:NotBlank val name: String,
)

data class UpdateWorkspaceRequest(
    @field:NotBlank val name: String,
    val aiProvider: String? = null,
    val aiSettingsJson: String? = null,
)

data class AiProviderStatusDto(
    val id: String,
    val displayName: String,
    val available: Boolean,
    val status: String,
    val detail: String?,
    val checks: List<AiProviderCheckDto> = emptyList(),
    val models: List<AiProviderModelDto> = emptyList(),
    val provider: String = id,
    val label: String = displayName,
)

data class AiProviderCheckDto(
    val label: String,
    val status: String,
    val detail: String?,
)

data class AiProviderModelDto(
    val value: String,
    val label: String,
    val description: String,
)
