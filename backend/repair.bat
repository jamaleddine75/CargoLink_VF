@echo off
set DATABASE_URL=jdbc:postgresql://aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require^&prepareThreshold=0^&tcpKeepAlive=true^&reWriteBatchedInserts=true
set DATABASE_USERNAME=postgres.qrbpdwjrnvbaupccboit
set DATABASE_PASSWORD=D29cUUuxLekNEzu8
mvnw.cmd flyway:repair -Dflyway.url="%DATABASE_URL%" -Dflyway.user="%DATABASE_USERNAME%" -Dflyway.password="%DATABASE_PASSWORD%"
