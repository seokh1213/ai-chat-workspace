package app.tripplanner.common

import org.springframework.stereotype.Component
import java.time.Clock
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter

@Component
class ClockProvider {
    private val clock: Clock = Clock.systemUTC()

    fun nowText(): String = OffsetDateTime.now(clock).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME)
}
