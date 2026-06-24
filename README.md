# CargoLink

Multi-role delivery management platform — Admin, Agency, Driver, Client.

**Stack**: React 18 + Vite + TypeScript · Java 21 + Spring Boot 3 + PostgreSQL

---

## Requirements

- [JDK 21](https://adoptium.net/)
- [Node.js 18+](https://nodejs.org/)
- [PostgreSQL 14+](https://www.postgresql.org/download/)

---

## Setup

### 1. Configure environment variables

```bash
cd backend
cp .env.example .env
# Fill in .env with your credentials:
#   DATABASE_URL=jdbc:postgresql://localhost:5432/cargolink
#   DATABASE_USERNAME=postgres
#   DATABASE_PASSWORD=your_password
#   APP_JWT_SECRET=at_least_32_random_characters
```

### 2. Create the database

```sql
CREATE DATABASE cargolink;
```

Flyway will automatically apply all migrations on first startup.

---

## Run

### Backend (Java 21)

```cmd
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

> Runs at `http://localhost:8080` · Swagger: `http://localhost:8080/swagger-ui.html`

---

### Frontend

```cmd
cd frontend
npm install
npm run dev
```

> Runs at `http://localhost:5173`

---

## Common Issues

| Problem | Fix |
|---------|-----|
| Java version error | Make sure **JDK 21** is used |
| Port 8080 in use | Change `server.port` in `application-dev.yml` |
| PostgreSQL error | Check credentials in `.env` and that PostgreSQL is running |
| Flyway migration error | Ensure `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` are set |
| npm error | Delete `node_modules/` and run `npm install` again |
