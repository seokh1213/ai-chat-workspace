package app.tripplanner.ai

import jakarta.annotation.PreDestroy
import org.slf4j.LoggerFactory
import org.springframework.boot.context.event.ApplicationReadyEvent
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Service
import java.io.File
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

@Service
class CodexAppServerProcessManager(
    private val properties: CodexAppServerProperties,
) {
    private val logger = LoggerFactory.getLogger(javaClass)
    private val httpClient = HttpClient
        .newBuilder()
        .connectTimeout(Duration.ofMillis(800))
        .build()

    @Volatile
    private var process: Process? = null

    private val stopping = AtomicBoolean(false)

    @Volatile
    private var externalProcessDetected: Boolean = false

    @EventListener(ApplicationReadyEvent::class)
    @Synchronized
    fun startIfEnabled() {
        if (!properties.managed) return
        if (process?.isAlive == true) return
        if (isHealthy()) {
            externalProcessDetected = true
            logger.info("Codex app-server is already reachable at {}", properties.url)
            return
        }

        val builder = ProcessBuilder(properties.executable, "app-server", "--listen", properties.url)
            .redirectErrorStream(true)
        properties.processWorkingDirectory
            ?.takeIf(String::isNotBlank)
            ?.let { builder.directory(File(it)) }

        val startedProcess = runCatching { builder.start() }
            .onFailure { error -> logger.warn("Failed to start Codex app-server process.", error) }
            .getOrNull()
            ?: return

        stopping.set(false)
        externalProcessDetected = false
        process = startedProcess
        pipeOutput(startedProcess)
        watchExit(startedProcess)

        if (waitForHealth(Duration.ofSeconds(properties.startupTimeoutSeconds))) {
            logger.info("Codex app-server started at {}", properties.url)
            return
        }

        if (startedProcess.isAlive) {
            logger.warn("Codex app-server process started but health check did not pass at {}", properties.url)
        } else {
            logger.warn("Codex app-server process exited with code {}", startedProcess.exitValue())
        }
    }

    fun statusDetail(): String? {
        if (!properties.managed) return null
        val currentProcess = process ?: return if (externalProcessDetected) {
            "external process detected at startup"
        } else {
            "managed process not started"
        }
        return if (currentProcess.isAlive) {
            "managed process running"
        } else {
            "managed process exited ${currentProcess.exitValue()}"
        }
    }

    @PreDestroy
    @Synchronized
    fun stop() {
        stopping.set(true)
        val currentProcess = process ?: return
        process = null
        if (!currentProcess.isAlive) return

        currentProcess.destroy()
        if (!currentProcess.waitFor(3, TimeUnit.SECONDS)) {
            currentProcess.destroyForcibly()
        }
    }

    private fun waitForHealth(timeout: Duration): Boolean {
        val deadline = System.nanoTime() + timeout.toNanos()
        while (System.nanoTime() < deadline) {
            if (isHealthy()) return true
            Thread.sleep(250)
        }
        return false
    }

    private fun isHealthy(): Boolean =
        runCatching {
            val request = HttpRequest
                .newBuilder(properties.url.toCodexAppServerHealthUri())
                .timeout(Duration.ofMillis(1000))
                .GET()
                .build()
            val response = httpClient.send(request, HttpResponse.BodyHandlers.discarding())
            response.statusCode() in 200..299
        }.getOrDefault(false)

    private fun pipeOutput(process: Process) {
        Thread {
            process.inputStream.bufferedReader().useLines { lines ->
                lines.forEach { line -> logger.debug("codex app-server: {}", line) }
            }
        }.apply {
            name = "codex-app-server-output"
            isDaemon = true
            start()
        }
    }

    private fun watchExit(process: Process) {
        Thread {
            val exitCode = process.waitFor()
            if (stopping.get()) return@Thread

            logger.warn("Codex app-server process exited with code {}", exitCode)
            synchronized(this@CodexAppServerProcessManager) {
                if (this@CodexAppServerProcessManager.process === process) {
                    this@CodexAppServerProcessManager.process = null
                }
            }
            if (properties.restartOnExit) {
                Thread.sleep(Duration.ofSeconds(properties.restartDelaySeconds).toMillis())
                if (!stopping.get()) {
                    startIfEnabled()
                }
            }
        }.apply {
            name = "codex-app-server-exit-watch"
            isDaemon = true
            start()
        }
    }
}
