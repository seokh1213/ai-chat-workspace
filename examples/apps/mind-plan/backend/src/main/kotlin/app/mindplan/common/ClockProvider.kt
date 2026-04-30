package app.mindplan.common

import org.springframework.stereotype.Component
import java.time.Clock
import java.time.Instant

@Component
class ClockProvider {
    private val clock: Clock = Clock.systemUTC()

    fun nowText(): String = Instant.now(clock).toString()
}
