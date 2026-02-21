# ===== BUILD STAGE =====
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app

# cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline

# copy source
COPY src ./src

# build
RUN mvn clean package -DskipTests


# ===== RUNTIME STAGE =====
FROM eclipse-temurin:17-jdk
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

# Limit RAM for free tier (Render/Koyeb/Railway)
# -Xmx300m: Max heap size 300MB
# -Xms128m: Start heap size 128MB
EXPOSE 8080
ENTRYPOINT ["java", "-Xmx256m", "-Xms128m", "-XX:+UseSerialGC", "-Xss512k", "-XX:MaxMetaspaceSize=128m", "-jar", "app.jar"]
