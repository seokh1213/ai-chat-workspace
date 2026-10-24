# syntax=docker/dockerfile:1.7
FROM node:26.12.1-alpine@sha256:40cd011b55415bc894e45b02fdd5a5dfde056921b7d23a64c74f80497af48797 AS frontend-deps
WORKDIR /workspace/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

FROM frontend-deps AS frontend-build
COPY frontend/ ./
RUN npm run build

FROM gradle:9.8.2-jdk25-alpine@sha256:80143a78c558d1298d392339ea51236bea816131afe2916ef465a76ff2579809 AS backend-build
WORKDIR /workspace
COPY --chown=gradle:gradle gradle gradle
COPY --chown=gradle:gradle gradlew gradlew.bat settings.gradle.kts build.gradle.kts ./
COPY --chown=gradle:gradle backend backend
COPY --chown=gradle:gradle frontend frontend
COPY --from=frontend-build --chown=gradle:gradle /workspace/frontend/node_modules frontend/node_modules
COPY --from=frontend-build --chown=gradle:gradle /workspace/frontend/dist frontend/dist
RUN ./gradlew :backend:bootJar --no-daemon -x :backend:frontendInstall -x :backend:frontendBuild

# eclipse-temurin:25-jre-alpine still ships 25.0.4.1, missing the 2026-10 CPU. Overlay Adoptium's
# 25.0.5+8 musl JRE until the official image catches up. Extract natively; GNU tar can fail in the
# emulated amd64 stage.
FROM --platform=$BUILDPLATFORM gradle:9.8.2-jdk25-alpine@sha256:80143a78c558d1298d392339ea51236bea816131afe2916ef465a76ff2579809 AS jre
ADD --checksum=sha256:b46e981318decb77eda728e006c7678a1ac0c56cf81ae3ad245710c2e4fa1a55 \
    https://github.com/adoptium/temurin25-binaries/releases/download/jdk-25.0.5%2B8/OpenJDK25U-jre_x64_alpine-linux_hotspot_25.0.5_8.tar.gz \
    /tmp/jre.tar.gz
RUN mkdir /jre && tar -xzf /tmp/jre.tar.gz -C /jre --strip-components=1

FROM eclipse-temurin:25-jre-alpine@sha256:b7528962e65d43064d8a8b67ba175367896bc948363ea2d3fcd7f10d34e1f048
# The base image lags Alpine security updates (brotli, openssl, sqlite, expat, p11-kit).
RUN apk upgrade --no-cache
ENV JAVA_VERSION=jdk-25.0.5+8
RUN rm -rf /opt/java/openjdk
COPY --from=jre /jre /opt/java/openjdk
WORKDIR /app
RUN addgroup -S -g 1000 tripplan && adduser -S -u 1000 tripplan -G tripplan
COPY --from=backend-build /workspace/backend/build/libs/*.jar /app/trip-plan.jar
USER tripplan
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "/app/trip-plan.jar"]
