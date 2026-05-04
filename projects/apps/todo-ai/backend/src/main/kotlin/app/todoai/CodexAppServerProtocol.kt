package app.todoai

import com.fasterxml.jackson.databind.JsonNode

internal object CodexAppServerProtocol {
    object Method {
        const val INITIALIZE = "initialize"
        const val THREAD_START = "thread/start"
        const val THREAD_RESUME = "thread/resume"
        const val TURN_START = "turn/start"
    }

    object Notification {
        const val ERROR = "error"
        const val AGENT_MESSAGE_DELTA = "item/agentMessage/delta"
        const val ITEM_COMPLETED = "item/completed"
        const val ITEM_STARTED = "item/started"
        const val TURN_COMPLETED = "turn/completed"
    }

    object Field {
        const val DELTA = "delta"
        const val ERROR = "error"
        const val ID = "id"
        const val ITEM = "item"
        const val PARAMS = "params"
        const val PHASE = "phase"
        const val TEXT = "text"
        const val THREAD = "thread"
        const val TURN = "turn"
        const val TYPE = "type"
    }

    fun initializeParams(): Map<String, Any?> =
        mapOf(
            "clientInfo" to mapOf(
                "name" to "todo-ai-workspace",
                "title" to "Todo AI Workspace",
                "version" to "0.1.0",
            ),
            "capabilities" to mapOf("experimentalApi" to true),
        )

    fun threadStartParams(properties: CodexAppServerRuntimeConfig, developerInstructions: String): Map<String, Any?> =
        mapOf(
            "cwd" to properties.cwdOrNull(),
            "model" to properties.model,
            "approvalPolicy" to "never",
            "sandbox" to "read-only",
            "baseInstructions" to null,
            "developerInstructions" to developerInstructions,
            "ephemeral" to false,
            "experimentalRawEvents" to true,
            "persistExtendedHistory" to false,
        )

    fun threadResumeParams(
        threadId: String,
        properties: CodexAppServerRuntimeConfig,
        developerInstructions: String,
    ): Map<String, Any?> =
        mapOf(
            "threadId" to threadId,
            "model" to properties.model,
            "approvalPolicy" to "never",
            "sandbox" to "read-only",
            "cwd" to properties.cwdOrNull(),
            "developerInstructions" to developerInstructions,
            "excludeTurns" to true,
            "persistExtendedHistory" to false,
            "experimentalRawEvents" to true,
        )

    fun turnStartParams(threadId: String, properties: CodexAppServerRuntimeConfig, prompt: String): Map<String, Any?> =
        mapOf(
            "threadId" to threadId,
            "input" to listOf(textInput(prompt)),
            "model" to properties.model,
            "effort" to properties.effort,
            "approvalPolicy" to "never",
            "cwd" to properties.cwdOrNull(),
        ).filterValues { it != null }

    private fun textInput(text: String): Map<String, Any?> =
        mapOf(
            "type" to "text",
            "text" to text,
            "text_elements" to emptyList<Any>(),
        )
}

data class CodexAppServerRuntimeConfig(
    val url: String,
    val model: String,
    val effort: String,
    val timeoutSeconds: Long,
    val cwd: String?,
)

internal fun CodexAppServerRuntimeConfig.cwdOrNull(): String? = cwd?.takeIf { it.isNotBlank() }

internal fun JsonNode.codexTextField(fieldName: String): String? =
    path(fieldName).takeIf { node -> node.isTextual }?.asText()?.takeIf(String::isNotBlank)
