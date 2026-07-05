@echo off
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot
set DATABASE_URL=jdbc:postgresql://localhost:5432/cargolink
set DATABASE_USERNAME=postgres
set DATABASE_PASSWORD=postgres
mvnw.cmd flyway:repair -Dflyway.url="%DATABASE_URL%" -Dflyway.user="%DATABASE_USERNAME%" -Dflyway.password="%DATABASE_PASSWORD%"
