$env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot"
$env:DATABASE_URL="jdbc:postgresql://localhost:5432/cargolink"
$env:DATABASE_USERNAME="postgres"
$env:DATABASE_PASSWORD="postgres"
$env:APP_JWT_SECRET="CargoLinkDevSecretKey2026AtLeast32Chars!"
$env:SPRING_PROFILES_ACTIVE="dev"
& .\mvnw.cmd "-Dmaven.test.skip=true" clean spring-boot:run
