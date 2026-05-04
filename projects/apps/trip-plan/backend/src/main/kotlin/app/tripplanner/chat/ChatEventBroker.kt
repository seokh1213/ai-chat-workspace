package app.tripplanner.chat

import org.springframework.stereotype.Service
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArrayList

@Service
class ChatEventBroker {
    private val emittersBySession = ConcurrentHashMap<String, CopyOnWriteArrayList<SseEmitter>>()

    fun subscribe(sessionId: String): SseEmitter {
        val emitter = SseEmitter(0L)
        emittersBySession.computeIfAbsent(sessionId) { CopyOnWriteArrayList() }.add(emitter)

        emitter.onCompletion { remove(sessionId, emitter) }
        emitter.onTimeout { remove(sessionId, emitter) }
        emitter.onError { remove(sessionId, emitter) }
        if (!send(emitter = emitter, eventName = "ready", data = mapOf("sessionId" to sessionId))) {
            remove(sessionId, emitter)
        }
        return emitter
    }

    fun publish(sessionId: String, eventName: String, data: Any) {
        emittersBySession[sessionId]?.forEach { emitter ->
            if (!send(emitter = emitter, eventName = eventName, data = data)) {
                remove(sessionId, emitter)
            }
        }
    }

    fun send(emitter: SseEmitter, eventName: String, data: Any): Boolean =
        runCatching {
            emitter.send(
                SseEmitter
                    .event()
                    .name(eventName)
                    .data(data),
            )
        }.isSuccess

    private fun remove(sessionId: String, emitter: SseEmitter) {
        emittersBySession[sessionId]?.remove(emitter)
    }
}
