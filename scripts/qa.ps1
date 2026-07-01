# scripts/qa.ps1

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " Starting CargoLink QA Pipeline      " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Clean artifact folders
Write-Host "[1/6] Cleaning artifacts..." -ForegroundColor Yellow
Remove-Item -Path logs\*, screenshots\*, videos\*, playwright-report\*, jacoco\*, coverage\* -Recurse -Force -ErrorAction SilentlyContinue

# Check Docker
Write-Host "[2/6] Starting Docker Compose Infrastructure (QA)..." -ForegroundColor Yellow
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Docker is not installed. QA environment requires Docker." -ForegroundColor Red
    exit 1
}

docker compose -f docker-compose.qa.yml up -d --build

# Wait for healthchecks
Write-Host "[3/6] Waiting for healthchecks (Postgres, Backend, Frontend)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Playwright E2E
Write-Host "[4/6] Executing Playwright E2E Tests..." -ForegroundColor Yellow
Set-Location frontend
npm run qa
Set-Location ..

# Backend Coverage
Write-Host "[5/6] Executing Backend Integration Tests & Coverage..." -ForegroundColor Yellow
Set-Location backend
.\mvnw.cmd clean verify -Pqa
Set-Location ..

# Cleanup
Write-Host "[6/6] Tearing down QA Infrastructure..." -ForegroundColor Yellow
docker compose -f docker-compose.qa.yml down -v

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " QA Pipeline Completed.              " -ForegroundColor Cyan
Write-Host " Reports available in /playwright-report and /jacoco" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
