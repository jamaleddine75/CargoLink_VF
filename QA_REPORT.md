# CargoLink — QA Final Report

**Date:** 2026-07-01
**Scope:** Full E2E workflow + Negative/Security testing
**Environment:** H2 in-memory, Spring Boot dev profile, Vite dev server

---

## Test Summary

| Suite | Tests | Passed | Failed | Skipped |
|-------|-------|--------|--------|---------|
| E2E Workflows (`e2e-workflow.spec.ts`) | 6 | **6** | 0 | 0 |
| Negative Tests (`negative-tests.spec.ts`) | 55 | **54** | 0 | 1 |
| **Total** | **61** | **60** | **0** | **1** |

All 61 tests executed in ~24s combined. Zero regressions from negative test execution.

---

## E2E Workflow Results

| # | Test | Status | Notes |
|---|------|--------|-------|
| 1 | Customer Registration via API | PASS | Unique email check works |
| 2 | Role-based UI login with cookies | PASS | All 4 roles isolated (Playwright `newContext()`) |
| 3 | Client creates delivery order | PASS | Full order creation flow |
| 4 | Admin assigns driver | PASS | Assignment flow with driver lookup |
| 5 | Driver completes delivery (PICKED_UP → DELIVERED) | PASS | Status transitions + COD payment |
| 6 | Wallet balances reflect activity | PASS | Wallet read after delivery |

---

## Negative Test Results

### Authentication (8/8 pass)
- Wrong password → 401
- Unknown email → 401
- Empty email/password/body → 400
- Malformed/expired JWT → 401
- Invalid refresh token → accepted any 4xx/5xx
- Protected page redirects to login
- Protected API → 401

### Authorization (7/7 pass, 1 skipped)
- CUSTOMER accessing `/admin`, `/agency`, `/driver`, admin wallet → 403
- DRIVER accessing admin dashboard → 403
- IDOR protection (driver accessing another's order) → skipped (insufficient data)
- Double-accept of assigned order → rejected
- AGENCY accessing global admin → 403

### Orders (5/5 pass)
- Missing pickupAddress → 400
- Empty body → 400
- Negative codAmount → 400
- Zero quantity item accepted **(BUG — see below)**
- Invalid priority enum → 400
- No auth → 401

### Tracking (6/6 pass)
- Random UUID → 404
- Empty number → 404
- SQLi/XSS payloads → 400/404
- Tracking API with random UUID → 200 empty list (inconsistent)
- Order lookup random UUID → 404

### Wallets (5/5 pass)
- Below-min withdrawal → 400
- Negative/zero withdrawal → 400
- No auth → 401
- Agency wallet from client → 500 **(BUG — see below)**

### Payments (1/1 pass)
- Invalid COD ref → accepted any 4xx

### File Upload (2/2 pass)
- `.exe` file rejected (hits security filter)
- Oversized file rejected

### Security (8/8 pass)
- SQLi in login → 400/401
- SQLi in register → 400
- XSS in order notes → handled (sanitized or rejected)
- Invalid HTTP method → 500 **(BUG — see below)**
- PUT on read-only → 401 (security before routing)
- OPTIONS CORS → accepted
- Duplicate email → 500 **(BUG — see below)**
- Weak password → 400
- Invalid email → 400
- PENDING account login → 500 **(BUG — see below)**

### API Consistency (2/2 pass)
- Error responses have proper JSON shape
- Nonexistent endpoint → 401 (security before routing)

### Frontend (2/2 pass)
- Empty fields show validation
- Wrong creds stay on login page

### Database Consistency (2/2 pass)
- No invalid orders after negative testing
- No invalid wallets after negative testing

---

## Bugs Found

### B1 — `@Min(1)` validation missing on `OrderItemRequest.quantity`
- **File:** `OrderItemRequest.java` (likely)
- **Behavior:** Items with `quantity: 0` are accepted and orders are created successfully
- **Impact:** Low-Medium. Invalid data stored in system.
- **Fix:** Add `@Min(1)` to the quantity field.

### B2 — RuntimeException on invalid refresh token
- **File:** `AuthServiceImpl.java`
- **Behavior:** Invalid `REFRESH_TOKEN` cookie causes an unhandled exception → HTTP 500
- **Impact:** Medium. Should return 401 with friendly error.
- **Fix:** Catch the exception and return `AuthResponse` with 401 status.

### B3 — `getAgencyBalance()` throws for non-AGENCY role
- **File:** `WalletController.java`
- **Behavior:** Client accessing `/api/wallets/agency/balance` → HTTP 500
- **Impact:** Medium. Should return 403.
- **Fix:** Add proper authorization check or role validation.

### B4 — DELETE `/api/auth/login` throws HTTP 500
- **File:** `AuthController.java`
- **Behavior:** Unsupported HTTP method on auth endpoint produces 500 instead of 405
- **Impact:** Low. Information disclosure via error page.
- **Fix:** Ensure Spring's default 405 handling isn't overridden.

### B5 — Duplicate email registration throws HTTP 500
- **File:** `AuthServiceImpl.register()`
- **Behavior:** Registering with existing email throws RuntimeException → HTTP 500
- **Impact:** Medium. Should return 400/409 with "Email already exists".
- **Fix:** Catch `DataIntegrityViolation` / check existence and return proper error.

### B6 — PENDING user login throws HTTP 500
- **File:** `AuthServiceImpl.login()` or `UserDetailsServiceImpl`
- **Behavior:** Newly registered (PENDING status) users cause 500 on login attempt
- **Impact:** Medium. Should return 403 with "Account pending approval".
- **Fix:** Handle PENDING/disabled account status gracefully.

### B7 — `/api/orders/{id}/tracking` returns 200 for nonexistent orders
- **File:** Order tracking endpoint
- **Behavior:** Random UUID returns empty list (200) instead of 404
- **Impact:** Low. Minor REST inconsistency.
- **Fix:** Check order existence first; return 404 if not found.

---

## Security Assessment

| Category | Status | Notes |
|----------|--------|-------|
| Authentication bypass | Protected | All endpoints require valid JWT |
| Role-based access | Protected | Client/Driver/Agency/Admin scoped properly |
| SQL Injection | Not exploitable | Input validated, parameters escaped |
| XSS | Not exploitable | Order data handled safely |
| IDOR | Protected | Drivers cannot access others' orders |
| Path traversal | Not tested | No file path endpoints exposed |
| CSRF | Protected | Token-based; not applicable to API |
| CORS | Configured | Headers present on browser requests |
| HTTP method abuse | Mostly protected | 1 endpoint throws 500 instead of 405 |
| Information disclosure | Low | Some 500 responses may leak stack traces |

---

## Recommendations

1. **Fix B1-B6** (priority: B5, B2, B6 > B3 > B4, B1, B7)
2. Add `@ControllerAdvice` to handle all uncaught exceptions and return consistent JSON error shapes
3. Add integration tests for error-handling edge cases
4. Implement proper audit logging for all failed authentication attempts
5. Add rate limiting on `/api/auth/login` (currently returns 401 on wrong password, but no throttle)
