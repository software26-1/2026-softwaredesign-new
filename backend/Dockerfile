# syntax=docker/dockerfile:1

# ---- Stage 1: build ----
# Temurin 25 is GA; the eclipse-temurin:25-jdk tag must exist on the registry.
FROM eclipse-temurin:25-jdk AS build
WORKDIR /workspace

# Cache Gradle wrapper + build scripts first for better layer caching.
COPY gradlew settings.gradle build.gradle ./
COPY gradle ./gradle
RUN chmod +x ./gradlew

# Copy sources and build the bootJar (skip tests; CI runs tests separately).
COPY src ./src
RUN ./gradlew bootJar -x test --no-daemon

# ---- Stage 2: runtime ----
FROM eclipse-temurin:25-jre AS runtime
WORKDIR /app

# Copy the single bootJar produced by the build stage.
COPY --from=build /workspace/build/libs/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
