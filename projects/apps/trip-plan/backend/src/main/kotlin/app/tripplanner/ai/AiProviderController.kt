package app.tripplanner.ai

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@RestController
class AiProviderController(
    private val statusService: AiProviderStatusService,
) {
    @GetMapping("/api/ai/providers")
    fun providers(): List<AiProviderStatusDto> = statusService.statuses()
}
