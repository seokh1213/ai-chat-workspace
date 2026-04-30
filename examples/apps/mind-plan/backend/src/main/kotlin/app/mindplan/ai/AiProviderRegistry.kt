package app.mindplan.ai

import org.springframework.stereotype.Component

@Component
class AiProviderRegistry(
    providers: List<AiProvider>,
    private val fallbackProvider: LocalRuleAiProvider,
) {
    private val byId: Map<String, AiProvider> = providers.associateBy { it.id }

    fun get(provider: String?): AiProvider =
        provider
            ?.let { byId[it] }
            ?: fallbackProvider
}
