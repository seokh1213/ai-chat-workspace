package app.mindplan.common

import org.springframework.stereotype.Component
import java.util.UUID

@Component
class IdGenerator {
    fun workspaceId(): String = "ws_${uuid()}"

    fun planId(): String = "plan_${uuid()}"

    fun taskId(): String = "task_${uuid()}"

    fun linkId(): String = "link_${uuid()}"

    fun chatSessionId(): String = "chat_${uuid()}"

    fun messageId(): String = "msg_${uuid()}"

    fun runId(): String = "run_${uuid()}"

    fun checkpointId(): String = "checkpoint_${uuid()}"

    private fun uuid(): String = UUID.randomUUID().toString()
}
