package app.tripplanner

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.runApplication

@SpringBootApplication
@ConfigurationPropertiesScan
class TripPlannerApplication

fun main(args: Array<String>) {
    runApplication<TripPlannerApplication>(*args)
}
