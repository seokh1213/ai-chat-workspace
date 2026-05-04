package app.tripplanner.setup

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
class SetupAssistantController(
    private val service: SetupAssistantService,
) {
    @PostMapping("/api/setup-assistant/messages")
    @ResponseStatus(HttpStatus.CREATED)
    fun reply(@RequestBody request: SetupAssistantRequest): SetupAssistantResponse = service.reply(request)
}
