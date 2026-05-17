package app.tripplanner.trip

import org.springframework.stereotype.Component
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.format.TextStyle
import java.time.temporal.ChronoUnit
import java.util.Locale
import java.util.UUID

@Component
class TripDayPlanner(
    private val repository: TripRepository,
) {
    fun defaultDays(trip: TripDto, startDate: LocalDate?, endDate: LocalDate?, now: String): List<TripDayDto> {
        val dayCount = when {
            startDate != null && endDate != null -> ChronoUnit.DAYS.between(startDate, endDate).toInt() + 1
            else -> 1
        }.coerceIn(1, 30)

        return (1..dayCount).map { dayNumber ->
            val date = startDate?.plusDays((dayNumber - 1).toLong())
            newDay(trip.id, dayNumber, date, now)
        }
    }

    fun syncDays(trip: TripDto, startDate: LocalDate?, endDate: LocalDate?, now: String) {
        val dayCount = when {
            startDate != null && endDate != null -> ChronoUnit.DAYS.between(startDate, endDate).toInt() + 1
            else -> repository.findDays(trip.id).size.coerceAtLeast(1)
        }.coerceIn(1, 30)

        val existingDays = repository.findDays(trip.id)
        existingDays.take(dayCount).forEach { day ->
            val date = startDate?.plusDays((day.dayNumber - 1).toLong())
            repository.updateDayDate(
                day.copy(
                    dateText = date?.toString(),
                    weekday = date?.dayOfWeek?.koreanName(),
                    title = "Day ${day.dayNumber}",
                    sortOrder = day.dayNumber,
                    updatedAt = now,
                ),
            )
        }

        if (existingDays.size < dayCount) {
            ((existingDays.size + 1)..dayCount)
                .map { dayNumber -> newDay(trip.id, dayNumber, startDate?.plusDays((dayNumber - 1).toLong()), now) }
                .forEach(repository::insertDay)
        }

        if (existingDays.size > dayCount) {
            repository.deleteDaysAfter(trip.id, dayCount)
        }
    }

    private fun newDay(tripId: String, dayNumber: Int, date: LocalDate?, now: String): TripDayDto =
        TripDayDto(
            id = "day_${UUID.randomUUID()}",
            tripId = tripId,
            dayNumber = dayNumber,
            dateText = date?.toString(),
            weekday = date?.dayOfWeek?.koreanName(),
            title = "Day $dayNumber",
            sortOrder = dayNumber,
            createdAt = now,
            updatedAt = now,
        )
}

private fun DayOfWeek.koreanName(): String = getDisplayName(TextStyle.SHORT, Locale.KOREAN)
