# Check if PostgreSQL is running on port 5432
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $scriptDir

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
    Write-Host "PostgreSQL is NOT running. Falling back to in-memory H2 database..." -ForegroundColor Yellow
    $env:DATABASE_URL="jdbc:h2:mem:cargolink;DB_CLOSE_DELAY=-1;MODE=PostgreSQL"
    $env:DATABASE_USERNAME="sa"
    $env:DATABASE_PASSWORD=""
    $env:SPRING_DATASOURCE_DRIVER_CLASS_NAME="org.h2.Driver"
    $env:SPRING_JPA_PROPERTIES_HIBERNATE_DIALECT="org.hibernate.dialect.H2Dialect"
    $env:SPRING_FLYWAY_ENABLED="false"
    $env:SPRING_JPA_HIBERNATE_DDL_AUTO="update"
}

function Test-JavaHome {
    param([string]$Path)
    return (Test-Path (Join-Path $Path "bin\java.exe"))
}

$javaHomeCandidates = @()
if ($env:JAVA_HOME) {
    $javaHomeCandidates += $env:JAVA_HOME
}

try {
    $javaExe = (Get-Command java.exe -ErrorAction Stop).Source
    $javaHomeCandidates += (Split-Path -Parent (Split-Path -Parent $javaExe))
} catch {
}

$javaHomeCandidates += @(
    "C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot",
    "C:\Program Files\Java\jdk-21.0.10"
)

$env:JAVA_HOME = $javaHomeCandidates | Where-Object { $_ -and (Test-JavaHome $_) } | Select-Object -First 1

if (-not $env:JAVA_HOME) {
    throw "No valid JDK installation was found. Install JDK 21 or set JAVA_HOME to a valid JDK home."
}

$env:APP_JWT_SECRET="CargoLinkDevSecretKey2026AtLeast32Chars!"
$env:SPRING_PROFILES_ACTIVE="dev"
& "$scriptDir\mvnw.cmd" "-Dmaven.test.skip=true" clean spring-boot:run
