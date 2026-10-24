# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS frontend-deps
WORKDIR /workspace/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

FROM frontend-deps AS frontend-build
COPY frontend/ ./
RUN npm run build

FROM gradle:9.2.1-jdk21-alpine AS backend-build
WORKDIR /workspace
COPY --chown=gradle:gradle gradle gradle
COPY --chown=gradle:gradle gradlew gradlew.bat settings.gradle.kts build.gradle.kts ./
COPY --chown=gradle:gradle backend backend
COPY --chown=gradle:gradle frontend frontend
COPY --from=frontend-build --chown=gradle:gradle /workspace/frontend/node_modules frontend/node_modules
COPY --from=frontend-build --chown=gradle:gradle /workspace/frontend/dist frontend/dist
RUN ./gradlew :backend:bootJar --no-daemon -x :backend:frontendInstall -x :backend:frontendBuild

# eclipse-temurin:21-jre-alpine still ships 21.0.12.1 (the running image was 21.0.11), missing the
# 2026-10 CPU and the CVE-2026-91403 cacerts fix. Overlay Adoptium's 21.0.13+9 musl JRE until the
# official image catches up. Extract natively; GNU tar can fail in the emulated amd64 stage.
FROM --platform=$BUILDPLATFORM gradle:9.2.1-jdk21-alpine AS jre
ADD --checksum=sha256:9138eab0f7d230e17163953f015ec9ae2431dbc49069c658b7f991e45b54fb9b \
    https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.13%2B9/OpenJDK21U-jre_x64_alpine-linux_hotspot_21.0.13_9.tar.gz \
    /tmp/jre.tar.gz
RUN mkdir /jre && tar -xzf /tmp/jre.tar.gz -C /jre --strip-components=1

FROM eclipse-temurin:21-jre-alpine
# The base image lags Alpine security updates (brotli, openssl, sqlite, expat, p11-kit).
RUN apk upgrade --no-cache
ENV JAVA_VERSION=jdk-21.0.13+9
RUN rm -rf /opt/java/openjdk
COPY --from=jre /jre /opt/java/openjdk
WORKDIR /app
RUN addgroup -S -g 1000 tripplan && adduser -S -u 1000 tripplan -G tripplan
COPY --from=backend-build /workspace/backend/build/libs/*.jar /app/trip-plan.jar
USER tripplan
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "/app/trip-plan.jar"]
