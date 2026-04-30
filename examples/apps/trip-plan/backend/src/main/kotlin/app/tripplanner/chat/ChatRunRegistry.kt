package app.tripplanner.chat

import org.springframework.stereotype.Service
import java.util.concurrent.ConcurrentHashMap

data class ActiveChatRunSnapshot(
    val runId: String,
    val startedAt: String,
    val message: String,
    val activity: ChatRunActivityEventDto?,
    val streamedContent: String,
)

@Service
class ChatRunRegistry {
    private val activeRunsBySession = ConcurrentHashMap<String, ActiveChatRun>()
    private val cancelledRunIds = ConcurrentHashMap.newKeySet<String>()

    fun start(sessionId: String, runId: String, startedAt: String, message: String) {
        activeRunsBySession[sessionId] = ActiveChatRun(
            runId = runId,
            startedAt = startedAt,
            message = message,
        )
        cancelledRunIds.remove(runId)
    }

    fun cancelCurrent(sessionId: String): String? {
        val runId = activeRunsBySession[sessionId]?.runId ?: return null
        cancelledRunIds.add(runId)
        return runId
    }

    fun isCancelled(runId: String): Boolean = cancelledRunIds.contains(runId)

    fun updateActivity(sessionId: String, runId: String, activity: ChatRunActivityEventDto) {
        val activeRun = activeRunsBySession[sessionId]?.takeIf { it.runId == runId } ?: return
        synchronized(activeRun) {
            activeRun.activity = activity
        }
    }

    fun appendDelta(sessionId: String, runId: String, delta: String) {
        if (delta.isBlank()) return
        val activeRun = activeRunsBySession[sessionId]?.takeIf { it.runId == runId } ?: return
        synchronized(activeRun) {
            activeRun.streamedContent.append(delta)
        }
    }

    fun snapshot(sessionId: String): ActiveChatRunSnapshot? {
        val activeRun = activeRunsBySession[sessionId] ?: return null
        synchronized(activeRun) {
            return ActiveChatRunSnapshot(
                runId = activeRun.runId,
                startedAt = activeRun.startedAt,
                message = activeRun.message,
                activity = activeRun.activity,
                streamedContent = activeRun.streamedContent.toString(),
            )
        }
    }

    fun finish(sessionId: String, runId: String) {
        activeRunsBySession.computeIfPresent(sessionId) { _, activeRun ->
            if (activeRun.runId == runId) null else activeRun
        }
        cancelledRunIds.remove(runId)
    }
}

private class ActiveChatRun(
    val runId: String,
    val startedAt: String,
    val message: String,
    var activity: ChatRunActivityEventDto? = null,
    val streamedContent: StringBuilder = StringBuilder(),
)
