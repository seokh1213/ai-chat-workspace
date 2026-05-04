package app.tripplanner.ai

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.launch
import org.springframework.stereotype.Component

@Component
class CodexAppServerProvider(
    private val client: CodexAppServerClient,
    private val promptBuilder: CodexPromptBuilder,
    private val responseParser: AiProviderResponseParser,
) : AiProvider {
    override val id: String = "codex-app-server"
    override val displayName: String = "Codex app-server"

    override fun cancel(runId: String): Boolean = client.interruptTurn(runId)

    override fun streamChat(request: AiChatRequest): Flow<AiStreamEvent> = callbackFlow {
        trySend(AiStreamEvent.RunStarted)
        val job = launch(Dispatchers.IO) {
            runCatching {
                val streamFilter = ToolBlockStreamFilter()
                val result = client.runTurn(
                    request = request,
                    prompt = promptBuilder.buildStreamingTurnPrompt(request),
                    developerInstructions = promptBuilder.codexDeveloperInstructions(),
                    onActivity = { activity ->
                        trySend(AiStreamEvent.Activity(activity))
                    },
                    onDelta = { rawDelta ->
                        val messageDelta = streamFilter.accept(rawDelta)
                        if (messageDelta.isNotBlank()) {
                            trySend(AiStreamEvent.MessageDelta(messageDelta))
                        }
                    },
                )
                val trailingMessage = streamFilter.finish()
                if (trailingMessage.isNotBlank()) {
                    trySend(AiStreamEvent.MessageDelta(trailingMessage))
                }

                val parsed = responseParser.parseAssistantToolResponse(result.text)
                if (!streamFilter.hasEmitted && parsed.message.isNotBlank()) {
                    trySend(AiStreamEvent.MessageCompleted(parsed.message))
                }
                if (parsed.operations.isNotEmpty()) {
                    trySend(AiStreamEvent.OperationsProposed(parsed.operations))
                }
                trySend(
                    AiStreamEvent.ResultCompleted(
                        result = parsed.copy(
                            externalThreadId = result.threadId,
                            providerRunId = result.turnId,
                            lastEventJson = result.lastEventJson,
                        ),
                    ),
                )
                trySend(AiStreamEvent.RunCompleted)
            }.onFailure { error ->
                close(error)
            }.onSuccess {
                close()
            }
        }

        awaitClose { job.cancel() }
    }
}
