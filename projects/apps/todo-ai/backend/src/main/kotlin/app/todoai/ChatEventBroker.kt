package app.todoai

import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import java.util.concurrent.CopyOnWriteArraySet

@Component
class ChatEventBroker {
    private val log = LoggerFactory.getLogger(javaClass)
    private val emitters = CopyOnWriteArraySet<SseEmitter>()

    fun subscribe(): SseEmitter {
        val emitter = SseEmitter(0L)
        emitters += emitter
        emitter.onCompletion { emitters -= emitter }
        emitter.onTimeout {
            emitters -= emitter
            emitter.complete()
        }
        emitter.onError {
            emitters -= emitter
        }
        send(emitter, ChatRunEvent(type = "stream.connected", runId = "system"))
        return emitter
    }

    fun publish(event: ChatRunEvent) {
        emitters.forEach { emitter -> send(emitter, event) }
    }

    private fun send(emitter: SseEmitter, event: ChatRunEvent) {
        runCatching {
            emitter.send(SseEmitter.event().name(event.type).data(event))
        }.onFailure { error ->
            log.debug("SSE emitter removed after send failure: {}", error.message)
            emitters -= emitter
            runCatching { emitter.complete() }
        }
    }
}
