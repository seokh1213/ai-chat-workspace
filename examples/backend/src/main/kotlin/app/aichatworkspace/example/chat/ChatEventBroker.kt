package app.aichatworkspace.example.chat

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArrayList

@Component
class ChatEventBroker(
    private val objectMapper: ObjectMapper,
) {
    private val emitters = ConcurrentHashMap<String, CopyOnWriteArrayList<SseEmitter>>()

    fun subscribe(sessionId: String): SseEmitter {
        val emitter = SseEmitter(0L)
        emitters.computeIfAbsent(sessionId) { CopyOnWriteArrayList() }.add(emitter)

        emitter.onCompletion { remove(sessionId, emitter) }
        emitter.onTimeout { remove(sessionId, emitter) }
        emitter.onError { remove(sessionId, emitter) }

        emitter.send(
            SseEmitter.event()
                .name("connected")
                .data("""{"sessionId":"$sessionId"}""", MediaType.APPLICATION_JSON),
        )
        return emitter
    }

    fun publish(sessionId: String, eventName: String, data: Any) {
        val payload = objectMapper.writeValueAsString(data)
        val deadEmitters = mutableListOf<SseEmitter>()

        emitters[sessionId]?.forEach { emitter ->
            runCatching {
                emitter.send(SseEmitter.event().name(eventName).data(payload, MediaType.APPLICATION_JSON))
            }.onFailure {
                deadEmitters += emitter
            }
        }

        deadEmitters.forEach { remove(sessionId, it) }
    }

    private fun remove(sessionId: String, emitter: SseEmitter) {
        emitters[sessionId]?.remove(emitter)
        if (emitters[sessionId]?.isEmpty() == true) {
            emitters.remove(sessionId)
        }
    }
}

