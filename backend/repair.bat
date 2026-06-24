@echo off
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot
set DATABASE_URL=jdbc:postgresql://aws-0-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require^&prepareThreshold=0^&tcpKeepAlive=true^&reWriteBatchedInserts=true
set DATABASE_USERNAME=postgres.ixearqeexcceoqscyanx
set DATABASE_PASSWORD=CargoLink@0101
mvnw.cmd flyway:repair -Dflyway.url="%DATABASE_URL%" -Dflyway.user="%DATABASE_USERNAME%" -Dflyway.password="%DATABASE_PASSWORD%"
