package app.mindplan.ai

import app.mindplan.plan.PlanDetailDto

data class AiProviderRequest(
    val provider: String,
    val model: String?,
    val message: String,
    val plan: PlanDetailDto,
    val chatHistory: List<AiChatMessage>,
    val settingsJson: String = "{}",
)

data class AiChatMessage(
    val role: String,
    val content: String,
)

data class AiProviderResult(
    val message: String,
    val operations: List<AiOperation>,
    val model: String? = null,
)

data class AiOperation(
    val op: String,
    val taskId: String? = null,
    val linkId: String? = null,
    val patch: Map<String, Any?> = emptyMap(),
)

interface AiProvider {
    val id: String

    fun complete(request: AiProviderRequest): AiProviderResult
}
