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

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S tripplan && adduser -S tripplan -G tripplan
COPY --from=backend-build /workspace/backend/build/libs/*.jar /app/trip-plan.jar
USER tripplan
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "/app/trip-plan.jar"]
