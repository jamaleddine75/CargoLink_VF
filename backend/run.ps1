# Check if PostgreSQL is running on port 5432
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $scriptDir

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
