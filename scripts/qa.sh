#!/usr/bin/env bash
# scripts/qa.sh

echo "====================================="
echo " Starting CargoLink QA Pipeline      "
echo "====================================="

# Clean artifact folders
echo "[1/6] Cleaning artifacts..."
rm -rf logs/* screenshots/* videos/* playwright-report/* jacoco/* coverage/*

# Spin up infrastructure
echo "[2/6] Starting Docker Compose Infrastructure (QA)..."
if ! command -v docker &> /dev/null
then
    echo "ERROR: Docker is not installed. QA environment requires Docker to spawn PostgreSQL and WebServers."
    exit 1
fi

docker compose -f docker-compose.qa.yml up -d --build

echo "[3/6] Waiting for healthchecks (Postgres, Backend, Frontend)..."
# Simple wait loop for the frontend which depends on backend and postgres
sleep 15

# Run Playwright E2E
echo "[4/6] Executing Playwright E2E Tests..."
cd frontend
npm run qa
cd ..

# Run Backend Coverage (jacoco)
echo "[5/6] Executing Backend Integration Tests & Coverage..."
cd backend
./mvnw clean verify -Pqa
cd ..

# Cleanup
echo "[6/6] Tearing down QA Infrastructure..."
docker compose -f docker-compose.qa.yml down -v

echo "====================================="
echo " QA Pipeline Completed.              "
echo " Reports available in /playwright-report and /jacoco"
echo "====================================="
