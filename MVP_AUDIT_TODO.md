# CargoLink Licence PFE MVP Audit TODO

Objective: prepare a clean, demo-stable MVP in 3 days without rewriting the project or adding new features. Reuse existing code, remove risk, and simplify visible workflows.

## Current Health Snapshot

- Frontend build: `npm run build` succeeds.
- Frontend lint: `npm run lint` fails with 337 issues, mostly `any`, hook dependency warnings, and a real hook-order bug.
- Backend tests: `./mvnw.cmd test` fails with 5 errors in cash/wallet flows.
- Project size: roughly 282 frontend TS/JS files, 300 backend Java files, and 86 Flyway migrations.
- MVP risk level: high complexity, but recoverable if scope is frozen and only critical paths are stabilized.

## MVP Scope Recommendation

Keep only the demo-critical paths:

- Public landing, login, register, password reset.
- Admin: dashboard, users approval, agencies, drivers, orders, pricing, finance summary.
- Agency: dashboard, orders, create order, drivers, customers, wallet/COD reconciliation, settings.
- Driver: dashboard, available orders, active delivery, proof of delivery, wallet.
- Customer: dashboard, create order, orders, tracking, address book, wallet.
- Public tracking page.

Defer or hide from navigation:

- Advanced live route monitor, AI attribution, global live map, full incident chat, advanced billing invoices, route optimization experiments, shift gamification, badges, offline queue, Supabase avatar upload, scanner extras unless needed in the demo.

## Day 1 — Stop The Bleeding

### P0 Backend Security And Config

- Remove committed real database credentials from `backend/src/main/resources/application.yml`, `backend/src/main/resources/application-dev.yml`, `backend/src/main/resources/application-prod.yml`, `backend/local.properties`, `backend/run.ps1`, and `backend/repair.bat`; replace with environment-only placeholders.
- Remove hardcoded JWT fallback secrets from all profiles; fail fast if `APP_JWT_SECRET` is missing, except tests.
- Disable `app.dev.allow-query-token` outside local development.
- Reduce production logging from DEBUG to INFO/WARN and stop logging auth internals.
- Remove public `/api/uploads/**` exposure unless file access is required for MVP; otherwise restrict or validate served paths.

### P0 Role Consistency

- Standardize customer authority naming. Backend `Role.CUSTOMER` emits `ROLE_CLIENT`, but several controllers and frontend routes talk about `CUSTOMER`.
- Choose one canonical API role vocabulary for MVP: recommended frontend value `CUSTOMER`, Spring authority `ROLE_CLIENT` only internally.
- Audit all `hasRole('CLIENT')`, `hasAnyRole('CLIENT')`, `CUSTOMER`, `AGENCY`, and `AGENCY_ADMIN` usages.
- Remove stale `SUPER_ADMIN` permissions from billing controllers because the enum maps `SUPER_ADMIN` to `ADMIN` and no role exists.

### P0 Backend Test Failures

- Fix `CashWorkflowServiceTest` by injecting/mocking `OrderMapper` in tests or refactoring constructors consistently.
- Fix `WalletServiceTest` null agency admin issue in `WalletServiceImpl.handleOrderDelivery`; MVP flow must not crash if an agency has no admin user.
- Fix COD remittance strict-stubbing mismatch or align test with current repository call.
- Re-run `./mvnw.cmd test` until green.

### P0 MVP Workflow Smoke Tests

Manually verify with seeded/demo users:

- Admin login → approve user → view orders.
- Agency login → create order → assign/validate payment.
- Driver login → accept order → update status → proof of delivery.
- Customer login → create order → track order.
- Wallet/COD path for cash delivery.

## Day 2 — Simplify Surface Area

### Frontend Architecture

- Keep route structure, but hide non-MVP routes from nav rather than deleting working code.
- Lazy-load more heavy pages: admin route monitor, global maps, finance charts, settings, and wallet pages.
- Split the giant main bundle; current build has a ~2.2 MB minified main chunk.
- Remove `console.log` API wire dumps from `frontend/src/api/client.ts` and noisy auth/websocket contexts.
- Keep a single endpoint source of truth in `frontend/src/api/endpoints.ts`; remove ad-hoc paths in services.

### Frontend Dead/Duplicate Code

- Delete or archive unused `frontend/src/pages/agency/orders/OrderDetail.tsx`; active route uses `OrderDetails.tsx`.
- Delete unused `frontend/src/pages/common/IncidentPage.jsx` if no route/import exists.
- Merge duplicate `frontend/src/services/agencyService.ts` and `frontend/src/services/api/agencyService.ts`; keep the API folder version.
- Consider merging `components/admin/StatusBadge.tsx` into `components/common/StatusBadge.tsx`.
- Keep separate client/agency create-order pages for now; merging them is too risky for 3 days.
- Remove `frontend/src/lib/supabase.ts` and `@supabase/supabase-js` if avatar upload can use backend uploads or be hidden for MVP.
- Remove `bun.lockb`/`bun.lock` or `package-lock.json`; keep one package manager, recommended npm for README consistency.

### Frontend Lint Triage

Do not fix all 337 lint issues during the MVP sprint. Prioritize:

- Fix hook-order bug in `frontend/src/components/common/UserAvatar.tsx`.
- Fix empty blocks in `ScanPage.tsx` and `UnifiedProof.tsx`.
- Fix hook dependency issues in active MVP pages only.
- Leave broad `any` cleanup for post-MVP unless it affects runtime safety.

### UI And UX Consistency

- Standardize language: many pages mix English/French; use French labels for demo-facing forms/errors if the PFE audience is French.
- Use one status label map and one status badge component across Admin/Agency/Driver/Customer.
- Ensure every form submit has loading/disabled state and a visible toast on success/failure.
- Ensure mobile nav works for Driver and Customer first; Admin/Agency can be desktop-first for PFE unless mobile demo is required.
- Hide pages with obvious mock data from nav: AI attribution, some chart-heavy details, advanced monitor.

## Day 3 — Stabilize Data And Demo

### Database And Migrations

- Do not rewrite migrations now; too risky.
- Add a short `DEMO_SETUP.md` documenting required env vars, database creation, migration command, and demo credentials.
- Review migration order/names: versions jump from V57 to V99+ and include many demo/fix/wipe migrations; acceptable for MVP but not clean production.
- Move demo-only seed data to `db/migration/dev` where possible after MVP, not before.
- Confirm a fresh DB can start from zero with current migrations.
- Confirm `ddl-auto: validate` succeeds against the target database.

### API Consistency

- Align frontend endpoints to backend mappings:
  - Notifications broadcast frontend uses `/admin/notifications/broadcast`; backend exposes it under `/api/notifications/admin/notifications/broadcast`.
  - Wallet finance summary frontend path is `/admin/finance/summary`; backend also has `/api/wallets/admin/finance/summary`, creating confusion.
  - Customer profile frontend should not call mixed `/customers/profile` and `/customers/customer/profile` patterns.
  - Agency admin endpoints should consistently use `/agency/...` or `/agencies/{id}/...`, not both for the same screen unless necessary.
- Make all controller responses use a consistent wrapper or document exceptions. Some services return raw objects, others return `ApiResponse`.
- Ensure all mutation endpoints validate request bodies with `@Valid`.

### Business Logic

- Freeze delivery lifecycle states for MVP and document them:
  - `PENDING` → `ACCEPTED/ASSIGNED` → `PICKED_UP` → `IN_TRANSIT` → `DELIVERED`
  - Failed/refused/problem states only if visible in demo.
- Freeze payment lifecycle:
  - COD amount set at order creation.
  - Driver collects cash.
  - Agency confirms cash.
  - Wallet balances update.
- Remove or hide gamification/loyalty/badges if not part of presentation.
- Make order assignment deterministic for demo; avoid random/AI scoring in visible admin attribution.

### Error Handling And Validation

- Replace generic `An unexpected error occurred: <exception>` API messages with safe, user-friendly messages.
- Add missing frontend field-level validation to order creation, registration, agency customer forms, driver modal, and wallet withdrawal.
- Add backend validation for payout, agency settings, agency create/update, update status, and broadcast requests.
- Ensure 403 does not log users out; current frontend does this correctly, keep it.
- Ensure 401 redirect preserves intended route only once and does not loop.

### Performance

- Keep Vite manual chunks but add lazy imports for more route pages to reduce main bundle.
- Remove duplicate static/dynamic `html5-qrcode` import pattern between `ScanPage` and `UnifiedProof`.
- Avoid eager loading maps/charts on dashboards unless tab is active.
- Avoid loading all orders/users without pagination in Admin and Agency pages.

## Remove / Hide Checklist

Safe to remove now after verifying no imports:

- `frontend/src/pages/agency/orders/OrderDetail.tsx`
- `frontend/src/pages/common/IncidentPage.jsx`
- duplicate root/public index if not used by Vite: verify `frontend/public/index.html`
- Supabase frontend dependency if upload is hidden/replaced
- `SIMPLIFICATION_TASKS.md` after this audit is accepted, or move to docs/archive

Hide from navigation for MVP:

- Admin Attribution
- Admin Route Monitor
- Global Live Map
- Region Management, unless city filtering is central to your demo
- Full agency billing/invoices
- Incident chat pages
- Driver ShiftHub/badges if unstable
- Scanner page if camera permissions are unreliable during presentation

Do not remove during MVP:

- Existing migrations
- Existing controllers used by visible pages
- Shared UI primitives
- Auth context and guards
- Wallet/COD code, even if messy; stabilize tests instead

## Final 3-Day Execution Order

1. Fix secrets/config and backend failing tests.
2. Fix role naming/access blockers.
3. Smoke-test four demo users and core workflows.
4. Hide unstable routes from nav.
5. Remove obvious dead files only.
6. Fix critical frontend runtime lint issues.
7. Reduce noisy logs and mock labels.
8. Create demo setup docs and demo script.
9. Run final `npm run build`, `npm run lint` if expected, and `./mvnw.cmd test`.

## Definition Of Done For PFE MVP

- Fresh setup instructions work.
- Frontend production build succeeds.
- Backend tests pass or documented non-MVP tests are explicitly skipped with reason.
- No real secrets remain committed.
- Admin, Agency, Driver, and Customer can each log in and reach their dashboard.
- One full order can be created, assigned, delivered, tracked, and paid/COD-confirmed.
- Navigation only exposes pages that work reliably.
- Demo script is written and rehearsed.
