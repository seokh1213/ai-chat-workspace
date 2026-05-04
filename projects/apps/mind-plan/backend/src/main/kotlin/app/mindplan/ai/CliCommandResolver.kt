package app.mindplan.ai

import java.io.File
import java.nio.file.Files
import java.nio.file.Path

fun resolveCliCommand(command: String): String {
    val trimmed = command.trim()
    if (trimmed.isBlank() || "/" in trimmed) return trimmed

    val home = System.getProperty("user.home")
    val pathEntries = System.getenv("PATH")
        .orEmpty()
        .split(File.pathSeparator)
        .filter { it.isNotBlank() }

    val fallbackEntries = listOf(
        Path.of(home, ".local", "bin").toString(),
        Path.of(home, ".claude", "local").toString(),
        "/opt/homebrew/bin",
        "/usr/local/bin",
        "/usr/bin",
        "/bin",
    )

    return (pathEntries + fallbackEntries)
        .asSequence()
        .distinct()
        .map { directory -> Path.of(directory, trimmed) }
        .firstOrNull(Files::isExecutable)
        ?.toString()
        ?: trimmed
}
