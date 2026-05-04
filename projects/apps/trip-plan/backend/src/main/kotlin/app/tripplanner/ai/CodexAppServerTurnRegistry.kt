package app.tripplanner.ai

import org.springframework.stereotype.Service
import java.util.concurrent.ConcurrentHashMap

data class CodexActiveTurn(
    val runId: String,
    val threadId: String,
    val turnId: String,
)

@Service
class CodexAppServerTurnRegistry {
    private val turnsByRunId = ConcurrentHashMap<String, CodexActiveTurn>()

    fun register(runId: String, threadId: String, turnId: String) {
        turnsByRunId[runId] = CodexActiveTurn(
            runId = runId,
            threadId = threadId,
            turnId = turnId,
        )
    }

    fun find(runId: String): CodexActiveTurn? = turnsByRunId[runId]

    fun remove(runId: String) {
        turnsByRunId.remove(runId)
    }
}
