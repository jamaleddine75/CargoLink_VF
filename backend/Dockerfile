FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app
COPY . .
RUN apk add --no-cache dos2unix curl && sed -i 's/\r$//' mvnw && chmod +x mvnw && ./mvnw clean package -DskipTests
EXPOSE 8080
CMD ["java", "-jar", "target/cargolink-0.0.1-SNAPSHOT.jar"]
