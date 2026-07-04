# Check if PostgreSQL is running on port 5432
$pgPort = 5432
$connection = New-Object System.Net.Sockets.TcpClient
$t = $connection.BeginConnect("localhost", $pgPort, $null, $null)
$success = $t.AsyncWaitHandle.WaitOne(1000, $false)

if ($success -and $connection.Connected) {
    $connection.Close()
    Write-Host "PostgreSQL is running. Starting with PostgreSQL database..." -ForegroundColor Green
    $env:DATABASE_URL="jdbc:postgresql://localhost:5432/cargolink"
    $env:DATABASE_USERNAME="postgres"
    $env:DATABASE_PASSWORD="postgres"
    $env:SPRING_DATASOURCE_DRIVER_CLASS_NAME="org.postgresql.Driver"
    $env:SPRING_JPA_PROPERTIES_HIBERNATE_DIALECT="org.hibernate.dialect.PostgreSQLDialect"
} else {
    Write-Host "PostgreSQL is NOT running. Falling back to file-based H2 database (persistent)..." -ForegroundColor Yellow
    $env:DATABASE_URL="jdbc:h2:file:./data/cargolink;DB_CLOSE_DELAY=-1;MODE=PostgreSQL"
    $env:DATABASE_USERNAME="sa"
    $env:DATABASE_PASSWORD=""
    $env:SPRING_DATASOURCE_DRIVER_CLASS_NAME="org.h2.Driver"
    $env:SPRING_JPA_PROPERTIES_HIBERNATE_DIALECT="org.hibernate.dialect.H2Dialect"
    $env:SPRING_FLYWAY_ENABLED="false"
    $env:SPRING_JPA_HIBERNATE_DDL_AUTO="update"
}

$env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"
$env:APP_JWT_SECRET="CargoLinkDevSecretKey2026AtLeast32Chars!"
$env:SPRING_PROFILES_ACTIVE="dev"
& .\mvnw.cmd "-Dmaven.test.skip=true" clean spring-boot:run
