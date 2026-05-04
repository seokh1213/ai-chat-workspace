package app.tripplanner.ai

import com.fasterxml.jackson.databind.JsonNode

internal object CodexAppServerProtocol {
    object Method {
        const val INITIALIZE = "initialize"
        const val THREAD_START = "thread/start"
        const val THREAD_RESUME = "thread/resume"
        const val TURN_START = "turn/start"
        const val TURN_INTERRUPT = "turn/interrupt"
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
        const val THREAD_ID = "threadId"
        const val TURN = "turn"
        const val TURN_ID = "turnId"
        const val TYPE = "type"
    }

    fun initializeParams(): Map<String, Any?> =
        mapOf(
            "clientInfo" to mapOf(
                "name" to "trip-planner",
                "title" to "Trip Planner",
                "version" to "0.1.0",
            ),
            "capabilities" to mapOf("experimentalApi" to true),
        )

    fun threadStartParams(
        request: AiChatRequest,
        properties: CodexAppServerProperties,
        developerInstructions: String,
    ): Map<String, Any?> =
        mapOf(
            "cwd" to properties.cwdOrNull(),
            "model" to (request.model ?: properties.model),
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
        request: AiChatRequest,
        properties: CodexAppServerProperties,
        developerInstructions: String,
    ): Map<String, Any?> =
        mapOf(
            "threadId" to threadId,
            "model" to (request.model ?: properties.model),
            "approvalPolicy" to "never",
            "sandbox" to "read-only",
            "cwd" to properties.cwdOrNull(),
            "developerInstructions" to developerInstructions,
            "excludeTurns" to true,
            "persistExtendedHistory" to false,
            "experimentalRawEvents" to true,
        )

    fun turnStartParams(
        threadId: String,
        request: AiChatRequest,
        properties: CodexAppServerProperties,
        prompt: String,
        outputSchema: Map<String, Any?>?,
    ): Map<String, Any?> {
        val input = buildList {
            add(textInput(prompt))
            request.inputImages.forEach { image ->
                image.localPath?.let { path -> add(localImageInput(path)) }
                    ?: image.url?.let { url -> add(imageInput(url)) }
            }
        }

        return mapOf(
            "threadId" to threadId,
            "input" to input,
            "model" to (request.model ?: properties.model),
            "effort" to (request.effort ?: properties.effort),
            "approvalPolicy" to "never",
            "cwd" to properties.cwdOrNull(),
            "outputSchema" to outputSchema,
        ).filterValues { it != null }
    }

    fun turnInputCount(request: AiChatRequest): Int = 1 + request.inputImages.size

    private fun textInput(text: String): Map<String, Any?> =
        mapOf(
            "type" to "text",
            "text" to text,
            "text_elements" to emptyList<Any>(),
        )

    private fun imageInput(url: String): Map<String, Any?> =
        mapOf(
            "type" to "image",
            "url" to url,
        )

    private fun localImageInput(path: String): Map<String, Any?> =
        mapOf(
            "type" to "localImage",
            "path" to path,
        )

    fun turnInterruptParams(threadId: String, turnId: String): Map<String, Any?> =
        mapOf(
            "threadId" to threadId,
            "turnId" to turnId,
        )
}

internal fun CodexAppServerProperties.cwdOrNull(): String? = cwd?.takeIf { it.isNotBlank() }

internal fun JsonNode.codexTextField(fieldName: String): String? =
    path(fieldName).takeIf { node -> node.isTextual }?.asText()?.takeIf(String::isNotBlank)
