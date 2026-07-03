# CargoLink End-to-End Test Script
$ErrorActionPreference = "Stop"

function Log-Output ($Message) {
    Write-Host "[E2E] $Message" -ForegroundColor Cyan
}

Log-Output "Step 1: Wait for Backend..."
# Assuming backend is already restarting.

Log-Output "Step 2: Seed Database"
$seedResponse = Invoke-RestMethod -Uri "http://localhost:8080/v3/api-docs/seed-test-data" -Method POST
$email = $seedResponse.email
$password = $seedResponse.password
Log-Output "Seeded Driver: $email"

Log-Output "Step 3: Authenticate"
$loginPayload = @{ email = $email; password = $password } | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body $loginPayload -ContentType "application/json"
$jwt = $loginResponse.token
Log-Output "JWT Acquired!"

Log-Output "Step 3.5: Fetch Payment Accounts"
$headers = @{ "Authorization" = "Bearer $jwt" }
$accountsResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/payment-accounts" -Method GET -Headers $headers
$paypalAccount = $accountsResponse | Where-Object { $_.provider -eq "PAYPAL" }
if (-not $paypalAccount) {
    throw "No PayPal account found!"
}
$paymentAccountId = $paypalAccount.id
Log-Output "Found PayPal Account: $paymentAccountId"

Log-Output "Step 4: Execute Real Withdrawal (200 DH)"
$withdrawPayload = @{ amount = 200; paymentAccountId = $paymentAccountId } | ConvertTo-Json

# This might throw 500 if something breaks. 
try {
    $withdrawResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/wallets/withdraw" -Method POST -Headers $headers -Body $withdrawPayload -ContentType "application/json"
    Log-Output "Withdrawal Success! ID: $($withdrawResponse.id)"
    Log-Output ($withdrawResponse | ConvertTo-Json -Depth 5)
} catch {
    Log-Output "Withdrawal FAILED: $_"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Log-Output $reader.ReadToEnd()
    }
}

Log-Output "Step 5: Fetch Database Dump"
try {
    $dumpResponse = Invoke-RestMethod -Uri "http://localhost:8080/v3/api-docs/dump-state?email=$email" -Method POST
    Log-Output "Database Dump:"
    Log-Output ($dumpResponse | ConvertTo-Json -Depth 5)
} catch {
    Log-Output "Dump FAILED: $_"
}

Log-Output "Step 6: Trigger Webhook locally (Simulating PayPal)"
# Assuming the withdraw generated a transaction, we don't know the exact batch ID without DB access. 
# But wait, the withdrawResponse might contain the withdrawalRequest which might have the transaction ID?
# Actually, the withdrawalRequest doesn't return the paypalBatchId. It's stored in PayoutLog.
# We will just print the DB values in java or query it.

Log-Output "End of Script. Check Backend Logs for exact values."
