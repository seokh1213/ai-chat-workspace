import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.springframework.boot.gradle.tasks.bundling.BootJar
import org.springframework.boot.gradle.tasks.run.BootRun

plugins {
    kotlin("jvm")
    kotlin("plugin.spring")
    id("org.springframework.boot")
}

group = "app.tripplanner"
version = "0.1.0-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

dependencies {
    implementation(platform("org.springframework.boot:spring-boot-dependencies:4.0.5"))

    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-flyway")
    implementation("org.springframework.boot:spring-boot-starter-jdbc")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.flywaydb:flyway-database-postgresql")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core")

    runtimeOnly("org.postgresql:postgresql")

    testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
    testRuntimeOnly("org.xerial:sqlite-jdbc:3.53.0.0")
}

kotlin {
    compilerOptions {
        jvmTarget = JvmTarget.JVM_21
        freeCompilerArgs.add("-Xjsr305=strict")
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}

tasks.withType<BootRun> {
    workingDir = rootProject.projectDir
}

val frontendDir = rootProject.layout.projectDirectory.dir("frontend")
val frontendInstall = tasks.register<Exec>("frontendInstall") {
    workingDir = frontendDir.asFile
    commandLine("npm", "ci")
    inputs.files(frontendDir.file("package.json"), frontendDir.file("package-lock.json"))
    outputs.dir(frontendDir.dir("node_modules"))
}

val frontendBuild = tasks.register<Exec>("frontendBuild") {
    dependsOn(frontendInstall)
    workingDir = frontendDir.asFile
    commandLine("npm", "run", "build")
    inputs.files(
        frontendDir.file("package.json"),
        frontendDir.file("package-lock.json"),
        frontendDir.file("index.html"),
        frontendDir.file("tsconfig.json"),
        frontendDir.file("vite.config.ts"),
    )
    inputs.dir(frontendDir.dir("src"))
    outputs.dir(frontendDir.dir("dist"))
}

val copyFrontendAssets = tasks.register<Copy>("copyFrontendAssets") {
    dependsOn(frontendBuild)
    from(frontendDir.dir("dist"))
    into(layout.buildDirectory.dir("generated/frontend-static"))
}

tasks.named<BootJar>("bootJar") {
    dependsOn(copyFrontendAssets)
    from(copyFrontendAssets) {
        into("BOOT-INF/classes/static")
    }
}
