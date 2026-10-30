# ========================================================
# STAGE 1: BUILD VITE FRONTEND
# ========================================================
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
# This creates the /app/frontend/dist directory
RUN npm run build

# ========================================================
# STAGE 2: BUILD SPRING BOOT BACKEND
# ========================================================
FROM maven:3.9-eclipse-temurin-21 AS backend-build
WORKDIR /app

# Copy pom.xml and download dependencies (for cache efficiency)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy the source code
COPY src ./src

# Create the target directory and inject the frontend files
# This ensures Spring Boot finds your CSS/JS during the 'mvn package' step
RUN mkdir -p src/main/resources/static
COPY --from=frontend-build /app/frontend/dist/ src/main/resources/static/

# Build the JAR
RUN mvn package -DskipTests

# ========================================================
# STAGE 3: RUNTIME IMAGE
# ========================================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app && mkdir -p /app/uploads && chown -R app:app /app

# Copy the JAR from the backend-build stage
COPY --from=backend-build /app/target/*.jar app.jar
RUN chown app:app app.jar

USER app

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]