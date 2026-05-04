package app.todoai

import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.time.Duration
import java.time.Instant
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors

@Service
class TodoChatService(
    private val repository: TodoRepository,
    private val broker: ChatEventBroker,
    private val codexClient: CodexAppServerClient,
    private val promptBuilder: TodoCodexPromptBuilder,
    private val responseParser: TodoProviderResponseParser,
) {
    private val log = LoggerFactory.getLogger(javaClass)
    private val executor = Executors.newCachedThreadPool()

    private val providerThreadIds = ConcurrentHashMap<String, String>()

    fun send(workspaceId: String, content: String): SendMessageResponse {
        val runId = "run_${UUID.randomUUID()}"
        val userMessage = repository.addUserMessage(workspaceId = workspaceId, content = content)
        executor.submit { process(workspaceId = workspaceId, runId = runId, userText = content) }
        return SendMessageResponse(runId = runId, userMessage = userMessage)
    }

    private fun process(workspaceId: String, runId: String, userText: String) {
        val startedAt = Instant.now()
        runCatching {
            broker.publish(ChatRunEvent(type = "run.started", runId = runId, workspaceId = workspaceId, status = RunStatus.RUNNING))
            val streamFilter = ToolBlockStreamFilter()
            var visibleDeltaCount = 0
            val state = repository.state(workspaceId)
            val result = codexClient.runTurn(
                runId = runId,
                workspace = state.workspace,
                existingThreadId = providerThreadIds[workspaceId],
                prompt = promptBuilder.buildTurnPrompt(state = state, userText = userText),
                developerInstructions = promptBuilder.developerInstructions(),
                onActivity = { activity ->
                    broker.publish(ChatRunEvent(type = "run.activity", runId = runId, workspaceId = workspaceId, activity = activity))
                },
                onDelta = { rawDelta ->
                    val visibleDelta = streamFilter.accept(rawDelta)
                    if (visibleDelta.isNotBlank()) {
                        visibleDeltaCount += 1
                        broker.publish(ChatRunEvent(type = "assistant.message.delta", runId = runId, workspaceId = workspaceId, delta = visibleDelta))
                    }
                },
            )
            providerThreadIds[workspaceId] = result.threadId

            val trailingMessage = streamFilter.finish()
            if (trailingMessage.isNotBlank()) {
                visibleDeltaCount += 1
                broker.publish(ChatRunEvent(type = "assistant.message.delta", runId = runId, workspaceId = workspaceId, delta = trailingMessage))
            }

            val parsed = responseParser.parse(result.text)
            if (!streamFilter.hasEmitted && parsed.message.isNotBlank()) {
                broker.publish(ChatRunEvent(type = "assistant.message.completed", runId = runId, workspaceId = workspaceId, content = parsed.message))
            }
            val operations = parsed.operations
            if (operations.isNotEmpty()) {
                broker.publish(ChatRunEvent(type = "operations.proposed", runId = runId, workspaceId = workspaceId, operations = operations))
            }

            repository.applyOperations(workspaceId = workspaceId, operations = operations)
            val durationMs = Duration.between(startedAt, Instant.now()).toMillis()
            val assistantMessage = repository.addAssistantMessage(workspaceId = workspaceId, content = parsed.message, operations = operations, durationMs = durationMs)
            log.info(
                "Todo AI run completed runId={} durationMs={} visibleDeltaEvents={} operations={} providerTurnId={}",
                runId,
                durationMs,
                visibleDeltaCount,
                operations.size,
                result.turnId,
            )
            broker.publish(
                ChatRunEvent(
                    type = "run.completed",
                    runId = runId,
                    workspaceId = workspaceId,
                    status = RunStatus.COMPLETED,
                    message = assistantMessage,
                    operations = operations,
                    state = repository.state(workspaceId),
                ),
            )
        }.onFailure { error ->
            log.warn("Todo AI run failed: {}", error.message, error)
            broker.publish(
                ChatRunEvent(
                    type = "run.failed",
                    runId = runId,
                    workspaceId = workspaceId,
                    status = RunStatus.FAILED,
                    error = error.message ?: "unknown error",
                ),
            )
        }
    }
}
