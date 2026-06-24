$env:DATABASE_URL="jdbc:postgresql://aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0&tcpKeepAlive=true&reWriteBatchedInserts=true"
$env:DATABASE_USERNAME="postgres.qrbpdwjrnvbaupccboit"
$env:DATABASE_PASSWORD="D29cUUuxLekNEzu8"
$env:APP_JWT_SECRET="CargoLinkDevSecretKey2026AtLeast32Chars!"
$env:SPRING_PROFILES_ACTIVE="dev"
& .\mvnw.cmd "-Dmaven.test.skip=true" clean spring-boot:run
