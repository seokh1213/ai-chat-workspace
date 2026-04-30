package app.mindplan

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class MindPlanApplication

fun main(args: Array<String>) {
    runApplication<MindPlanApplication>(*args)
}
