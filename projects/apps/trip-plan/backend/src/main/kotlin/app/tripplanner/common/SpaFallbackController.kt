package app.tripplanner.common

import org.springframework.core.io.ClassPathResource
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.ResponseBody

@Controller
class SpaFallbackController {
    @GetMapping(
        "/",
        "/trips/**",
        "/workspaces/**",
        "/chat/**",
        "/setup/**",
    )
    @ResponseBody
    fun frontendRoute(): ResponseEntity<String> =
        ResponseEntity
            .ok()
            .contentType(MediaType.TEXT_HTML)
            .body(ClassPathResource("static/index.html").inputStream.bufferedReader().readText())
}
