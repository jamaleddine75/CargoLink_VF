$env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"
$env:DATABASE_URL="jdbc:postgresql://aws-0-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0&tcpKeepAlive=true&reWriteBatchedInserts=true"
$env:DATABASE_USERNAME="postgres.ixearqeexcceoqscyanx"
$env:DATABASE_PASSWORD="CargoLink@0101"
$env:APP_JWT_SECRET="CargoLinkDevSecretKey2026AtLeast32Chars!"
$env:SPRING_PROFILES_ACTIVE="dev"
& .\mvnw.cmd "-Dmaven.test.skip=true" clean spring-boot:run
