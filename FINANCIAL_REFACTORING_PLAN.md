# CargoLink Financial System — Complete Refactoring Plan

**Version**: 1.0  
**Author**: Senior Software Architect / FinTech Architect  
**Scope**: Full architectural simplification of the financial system  
**Target**: Production-quality, defensible PFE project

---

## Table of Contents

1. [Phase 1 — Current Architecture Review](#phase-1--current-architecture-review)
2. [Phase 2 — Identified Problems](#phase-2--identified-problems)
3. [Phase 3 — Refactored Service Architecture](#phase-3--refactored-service-architecture)
4. [Phase 4 — Simplified Business Logic](#phase-4--simplified-business-logic)
5. [Phase 5 — Simplified Database](#phase-5--simplified-database)
6. [Phase 6 — Simplified Entities](#phase-6--simplified-entities)
7. [Phase 7 — Simplified APIs](#phase-7--simplified-apis)
8. [Phase 8 — Simplified DTOs](#phase-8--simplified-dtos)
9. [Phase 9 — Simplified Workflows](#phase-9--simplified-workflows)
10. [Phase 10 — Dead Code Removal](#phase-10--dead-code-removal)
11. [Phase 11 — Final Architecture](#phase-11--final-architecture)
12. [Phase 12 — Implementation Roadmap](#phase-12--implementation-roadmap)

---

# Phase 1 — Current Architecture Review

## 1.1 Wallet System

### Wallet + WalletService + WalletServiceImpl

**What it does**: Driver and customer wallet management — balance tracking, COD collection, remittance, payout requests, earnings queries, CSV statements, bonuses, deductions, freeze/unfreeze, admin approval flows.

**Who uses it**: Drivers, Customers, Admins, Agency admins

**Why it exists**: Core wallet functionality for users.

**Problems**: It is a **God Service** — 1928 lines, 18 dependencies injected, 60+ methods covering driver wallets, customer wallets, agency wallets, payouts, COD, admin operations, agency payouts, and dev utilities. It does **everything**.

### PlatformWallet + PlatformWalletService + PlatformWalletServiceImpl

**What it does**: Tracks global platform balance, total revenue, platform profit, total driver/agency payouts. Methods: `recordRevenue`, `recordProfit`, `updateBalance`, `recordDriverPayout`, `recordAgencyPayout`, `getGlobalWallet`.

**Who uses it**: `WalletServiceImpl.handleOrderDelivery`, `WalletServiceImpl.processClientSettlement`, admin dashboard.

**Why it exists**: Acts as a system-of-record for platform-level financial aggregates.

**Redundancy with Transaction**: `PlatformWallet.balance`, `.totalRevenue`, `.platformProfit`, `.totalDriverPayout`, `.totalAgencyPayout` are all derivable from `Transaction` records filtered by type. This table duplicates what the transaction ledger already stores.

### AgencyWallet + AgencyWalletRepository

**What it does**: Stores agency-specific balance, revenue, expenses, profit, commissions, receivables, payables, collection totals.

**Who uses it**: Agencies, Admins, `WalletServiceImpl`, `AgencyBillingServiceImpl`.

**Why it exists**: Separate wallet for agencies — conceptually distinct from individual driver/customer wallets.

**Redundancy**: 14 monetary fields — at least 8 are derivable from `AgencyTransaction` records (balance, totalRevenue, totalExpenses, totalProfit, pendingReceivables, pendingPayables, totalCommissionEarned, pendingCommission, totalCollected, totalPaidOut).

### WalletTimeline

**What it does**: Audit trail entries for wallet events.

**Who uses it**: `SettlementEngineImpl` (only).

**Redundancy**: Partially duplicates `Transaction` and `FinancialAuditLog`. Only used by the settlement engine, which is itself mostly dead code (see below).

## 1.2 Transaction System

### Transaction

**What it does**: Core ledger entry — tracks every financial event. Fields: wallet, amount, type, description, orderId, referenceIds, status, metadata, date.

**Who uses it**: Every financial service.

**Why it exists**: The single source of truth for all monetary movements.

### AgencyTransaction

**What it does**: Near-identical copy of `Transaction` for agency wallets.

**Who uses it**: `FinancialServiceImpl`, `WalletServiceImpl`.

**Redundancy**: Almost **exact duplicate** of `Transaction` — same fields (amount, type, status, description, orderId, date) but with `agencyWalletId` foreign key instead of `walletId`. Both could be merged into `Transaction` with a polymorphic `ownerType` + `ownerId` pattern.

### PlatformTransaction

**What it does**: Near-identical copy of `Transaction` for platform wallet.

**Who uses it**: Appears to exist but is barely used in practice.

**Redundancy**: Same as `AgencyTransaction` — **exact duplicate** with `platformWalletId` foreign key.

## 1.3 Payout / Withdrawal System

### WithdrawalRequest

**What it does**: Driver/customer withdrawal request — tracks amount, paypal email, payout amount, currency, provider, status, rejection reason.

**Who uses it**: Drivers, Customers, Admins, `WalletServiceImpl`.

### AgencyPayoutRequest

**What it does**: Agency payout request — near-identical to `WithdrawalRequest` but for agencies.

**Who uses it**: Agencies, Admins, `WalletServiceImpl`.

**Redundancy**: **Duplicate of WithdrawalRequest**. Same lifecycle (PENDING → APPROVED/REJECTED/COMPLETED), same fields (amount, status, paymentAccountId, receiverEmailSnapshot, provider). Both could be merged.

### PayoutLog

**What it does**: Logs payout events. Appears unused in service code.

**Redundancy**: Dead code — never written or queried by any service.

### PaymentProvider + PayPalProviderImpl

**What it does**: Abstraction over PayPal payout API.

**Who uses it**: `WalletServiceImpl.createWithdrawalRequest`.

**Why it exists**: Encapsulates external payment gateway.

### PayoutService + PayoutServiceImpl

**What it does**: Interface + implementation. Empty/delegating — `PayoutServiceImpl` appears to have no real logic.

**Redundancy**: All payout logic is in `WalletServiceImpl`. This service is dead code or near-empty.

## 1.4 COD System

### COD fields in Order entity

**What it does**: `codAmount`, `codCollected`, `cashCollected`, `codCollectedAt`, `paymentStatus`, `paymentConfirmedAt`, `cashConfirmed`, `cashConfirmedAt`, `driverEarnings`.

**Who uses it**: `WalletServiceImpl.handleOrderDelivery`, `WalletServiceImpl.declareCODRemittance`, `WalletServiceImpl.confirmCODRemittance`, `WalletServiceImpl.acceptCODRemittance`.

### CODReconciliation (billing package)

**What it does**: Agency-level COD reconciliation records.

**Who uses it**: `AgencyBillingServiceImpl` (only).

**Redundancy**: `CODReconciliation` duplicates information already tracked in Orders (codAmount, paymentStatus) and Transactions (COD_COLLECTED records). The COD reconciliation workflow in billing is **completely separate** from the COD workflow in WalletService — two parallel COD systems exist.

## 1.5 Billing & Accounting System

### AgencyCustomerInvoice

**What it does**: Invoicing for agency customers.

### AgencyCustomerPayment

**What it does**: Payment records against invoices.

### AgencyLedgerTransaction

**What it does**: Agency-specific ledger entries — another duplicate of Transaction/AgencyTransaction.

### AgencyBillingService

**What it does**: Manages invoices, customer payments, driver earnings records, COD reconciliation, platform commission calculation, ledger transactions, adjustments.

**Who uses it**: Agency customers (B2B), Agency admins.

**Redundancy**: This entire subsystem appears to be a **parallel financial system** that duplicates:
- `CODReconciliation` vs. `Transaction.COD_COLLECTED`
- `AgencyLedgerTransaction` vs. `Transaction` / `AgencyTransaction`
- `DriverEarning` + `DriverFinancialRecord` vs. `WalletService` driver earnings
- `PlatformCommissionRecord` vs. `Transaction.COMMISSION`
- `AgencyBillingService.getBillingSummary` reads `AgencyWallet` fields that are duplicates of ledger-summable values

## 1.6 Financial Engine System

### FinancialService + FinancialServiceImpl

**What it does**: Admin operations — list all wallets (unified view), freeze/unfreeze, adjust balance, settings CRUD, global transactions, withdrawal management.

**Who uses it**: Admin dashboard.

**Redundancy**: Partially overlaps with `WalletService` (freeze/unfreeze exist in both). The `getAllWallets` streams from both `walletRepository` and `agencyWalletRepository` manually — indicating the two separate wallet tables cause complexity.

### FinancialQueryService + FinancialQueryServiceImpl

**What it does**: Returns KPIs and analytics summary.

**Who uses it**: Admin dashboard.

**Redundancy**: `getOverviewKPIs` delegates to `FinancialQueryRepository.getFinancialKPIs()` (a native query). `getAnalyticsSummary` returns **mock/empty data** — it's dead code with no real implementation.

### FinancialQueryRepository

**What it does**: Native query for financial KPIs.

**Who uses it**: `FinancialQueryServiceImpl`.

### SettlementEngine + SettlementEngineImpl

**What it does**: Batch settlement processing — finds settled orders, credits customer wallets.

**Who uses it**: Admin trigger, `ReconciliationScheduler`.

**Redundancy**: Bulk version of `processClientSettlement()` in `WalletServiceImpl`. Almost identical logic: finds CONFIRMED_BY_AGENCY orders, calculates `platformFinanceSettingsService.calculateClientSettlement()`, credits wallet, records COD_SETTLED transaction.

### DriverFinancialEngine + DriverFinancialEngineImpl

**What it does**: Calculates driver balance metrics from orders.

**Who uses it**: Potentially admin dashboard (barely called anywhere).

**Redundancy**: Does manual iteration over orders to calculate what is already stored in the `Wallet` entity (cashInHand, debtToSystem) and `Transaction` records. Also: **calculates platformCommission = fee - earnings** which duplicates `PlatformWallet.platformProfit`.

### SettlementBatch

**What it does**: Tracks batch settlement runs.

### ClientSettlementFormula

**What it does**: Appears to be config for client settlement formulas. Reference exists in `PlatformFinanceSettings`.

## 1.7 Settings & Configuration

### PlatformFinanceSettings + PlatformFinanceSettingsService

**What it does**: Platform fee rate, default agency commission rate, client settlement formula, auto-reconcile flag, debt alert threshold.

**Who uses it**: Every financial service.

**Why it exists**: Central configuration for financial business rules. This is **good design**.

## 1.8 Audit & Event System

### FinancialAuditLog

**What it does**: Records admin actions on wallets/withdrawals.

### FinancialOutboxEvent + FinancialOutboxStatus

**What it does**: Event outbox pattern for reliable event publishing.

**Redundancy**: Pattern is set up but events are also published directly via `ApplicationEventPublisher` in `PlatformWalletServiceImpl` and `WalletServiceImpl`. The outbox table appears to be **unused in practice**.

### Financial Events: AgencyCommissionEvent, DriverEarningEvent, FinancialMutationEvent, PlatformRevenueEvent

**What they do**: Event objects for various financial mutations.

**Redundancy**: `FinancialMutationEvent` is a **catch-all** that duplicates the specific event types. PlatformRevenueEvent duplicates FinancialMutationEvent with EntityType.PLATFORM.

### Financial Listeners: FinancialAuditListener, FinancialLedgerListener, FinancialNotificationListener, FinancialWebSocketListener

**What they do**: Handle financial events.

**Redundancy**: Complex event/listener infrastructure that adds indirection. Much of this could be simplified to direct calls.

## 1.9 Pricing

### PricingConfig + PricingService + PricingController

**What it does**: Pricing configuration — distance-based, weight-based, etc.

**Why it exists**: Business logic for delivery fee calculation.

**Status**: This is a distinct concern from finance. Keep separate but acknowledge it's related.

## 1.10 Frontend Finance Feature

### FinancialCenterPage + sub-components

**What it does**: Admin financial dashboard — wallets, transactions, withdrawals, analytics, reports, settlements.

**Who uses it**: Admin users.

**Status**: Frontend is well-organized by domain. Main issue is it calls APIs that return mock/empty data.

---

# Phase 2 — Identified Problems

## 2.1 God Classes

| Problem | Location | Lines | Dependencies | Why It's a Problem |
|---------|----------|-------|-------------|-------------------|
| **God Service** | `WalletServiceImpl.java` | **1928 lines** | 18 repos/services | Violates SRP. Does driver wallet, customer wallet, agency wallet, COD, withdrawals, payouts, admin, agency payouts, dev utilities |
| **God Controller** | `WalletController.java` | 283 lines | 1 service | 20+ endpoints — balance, transactions, COD, remittances, commissions, bonuses, stats, withdrawals, payouts, agency operations |
| **God Service** | `FinancialAdminController.java` | 203 lines | 3 services | 18 endpoints — wallets, transactions, withdrawals, settings, settlements, reconciliation, fraud, export, ledger |
| **God Entity** | `AgencyWallet.java` | 94 lines | - | **14 monetary fields** — at least 8 are derivable |

## 2.2 Duplicate Services

| Service A | Service B | Duplication Level |
|-----------|-----------|------------------|
| `WalletService` | `FinancialService` | High — freeze/unfreeze in both; `getAllWallets` / `getWithdrawals` overlap |
| `WalletService` | `SettlementEngine` | High — `processClientSettlement()` and `runSettlement()` have identical logic |
| `WalletService.handleOrderDelivery` | `DriverFinancialEngine` | Medium — driver earnings calculation duplicated |
| `WalletService` | `PayoutService` | High — PayoutService is empty shell, all logic in WalletService |

## 2.3 Duplicate Business Logic

### Fee Split Calculation (appears 4 times)
1. `WalletServiceImpl.handleOrderDelivery()` lines 1136-1154 — primary fee split
2. `WalletServiceImpl.calculateAmountToRemit()` lines 1608-1630 — COD remittance fee split
3. `WalletServiceImpl.acceptCODRemittance()` lines 1754-1761 — commission calculation during remittance acceptance
4. `AgencyBillingServiceImpl.calculatePlatformCommission()` lines 255-263 — platform fee calculation

### COD Remittance Acceptance (3 implementations)
1. `WalletServiceImpl.confirmCODRemittance()` — agency confirms
2. `WalletServiceImpl.acceptCODRemittance()` — admin accepts
3. `WalletServiceImpl.remitAllByAgencyScan()` — scan-based remittance

All three do the same thing: update driver wallet, credit agency wallet, update orders, process client settlement. But each has **slightly different logic** for status transitions and wallet updates.

### Client Settlement Logic (3 implementations)
1. `WalletServiceImpl.processClientSettlement()` — inline settlement
2. `WalletServiceImpl.reconcileDailyBatch()` — batch version calling processClientSettlement
3. `SettlementEngineImpl.runSettlement()` — batch version with same logic

## 2.4 Duplicate Transactions

| Table | Duplicates | Impact |
|-------|-----------|--------|
| `Transaction` | - | Core ledger (keep) |
| `AgencyTransaction` | `Transaction` (with agencyWalletId) | Can be merged into Transaction |
| `PlatformTransaction` | `Transaction` (with platformWalletId) | Can be merged into Transaction |
| `AgencyLedgerTransaction` | `Transaction` + `AgencyTransaction` | Can be removed entirely |

## 2.5 Duplicate Database Fields

### AgencyWallet — 14 monetary fields, most derivable:
| Field | Derivable From |
|-------|---------------|
| `balance` | SUM of AgencyTransaction amounts |
| `currentBalance` | = balance (exact duplicate) |
| `totalRevenue` | SUM of AgencyTransaction where amount > 0 |
| `totalExpenses` | SUM of AgencyTransaction where amount < 0 |
| `totalProfit` | totalRevenue - totalExpenses |
| `pendingReceivables` | SUM of pending Invoice amounts |
| `pendingPayables` | SUM of pending DriverEarning amounts |
| `totalCommissionEarned` | SUM of AgencyTransaction where type = COMMISSION |
| `pendingCommission` | Same as pendingReceivables |
| `totalCollected` | SUM of COD transactions |
| `totalPaidOut` | SUM of payout transactions |

### PlatformWallet — 6 monetary fields, most derivable:
| Field | Derivable From |
|-------|---------------|
| `balance` | SUM(adminShare) - SUM(payouts) |
| `totalRevenue` | SUM of delivery fees |
| `platformProfit` | SUM of adminShare |
| `totalDriverPayout` | SUM of PAYOUT transactions |
| `totalAgencyPayout` | SUM of agency payouts |

### Wallet — 3 monetary fields, `cashInHand` + `debtToSystem` derivable:
| Field | Derivable From |
|-------|---------------|
| `cashInHand` | SUM(CASH_KEPT_BY_DRIVER) - SUM(COD_REMIS COMPLETED) |
| `debtToSystem` | SUM(COD_COLLECTED PENDING) |

## 2.6 Duplicate APIs

| Endpoint in WalletController | Endpoint in FinancialAdminController | Type |
|-----------------------------|--------------------------------------|------|
| (none for freeze) | `PUT /api/admin/finance/wallets/{id}/freeze` | Only in admin |
| (none for wallets list) | `GET /api/admin/finance/wallets` | Only in admin |
| `GET /api/wallets/balance` | `GET /api/admin/finance/wallets` (includes) | Overlap |
| (none for settings) | `GET/PUT /api/admin/finance/settings` | Only in admin |

## 2.7 Circular Dependencies

- `WalletServiceImpl` → `PlatformWalletService` → (returns to) → No direct circular dependency, but tight coupling exists:
  - `WalletServiceImpl` depends on `PlatformWalletService`
  - `WalletService.handleOrderDelivery` calls `platformWalletService.recordRevenue()` then `platformWalletService.recordProfit()` then `platformWalletService.updateBalance()`

- `FinancialServiceImpl` depends on `WalletService` (for `rejectWithdrawal`)
- `WalletService` is referenced everywhere — it's a hub that everything connects to.

## 2.8 Dead Code

| File | Status | Why It's Dead |
|------|--------|---------------|
| `PayoutService.java` + `PayoutServiceImpl.java` | **Dead** | All payout logic is in WalletServiceImpl |
| `PayoutLog.java` + `PayoutLogRepository.java` | **Dead** | Never written or queried by any service |
| `DriverFinancialEngine.java` + `DriverFinancialEngineImpl.java` | **Dead** | Never called from any service or controller |
| `FinancialQueryServiceImpl.getAnalyticsSummary()` | **Dead** | Returns mock/empty data |
| `SettlementEngine.java` + `SettlementEngineImpl.java` | **Dead** | Logic duplicates WalletServiceImpl; never triggered in production flow (only admin manual trigger) |
| `SettlementBatch.java` + `SettlementBatchRepository.java` | **Dead** | Only used by SettlementEngine |
| `WalletTimeline.java` + `WalletTimelineRepository.java` | **Dead** | Only used by SettlementEngine |
| `FinancialOutboxEvent.java` + `FinancialOutboxStatus.java` | **Dead** | Table exists, events are published directly via ApplicationEventPublisher |
| `ClientSettlementFormula.java` | **Dead** | Referenced in PlatformFinanceSettings but separate entity unused |
| `AgencyPayoutRequest.java` | **Duplicate** | Near-identical to WithdrawalRequest |
| `PlatformTransaction.java` | **Duplicate** | Near-identical to Transaction |
| `AgencyTransaction.java` | **Duplicate** | Near-identical to Transaction |
| `CODReconciliation.java` + entire reconcil. workflow in billing | **Duplicate** | Parallel COD tracking — main COD system is in WalletService |
| `DriverFinancialRecord.java` | **Duplicate** | Duplicates info in Wallet + Transaction |
| `DriverEarning.java` + `DriverEarningRepository` | **Duplicate** | Duplicates Transaction.GAIN records |
| `FinancialAdminController` fraud/reconciliation/ledger endpoints | **Dead** | All return empty lists or mock data |
| `FinancialAdminController.exportData()` | **Flawed** | Uses reflection on arbitrary DTOs — fragile and limited |
| `TestPayPalController.java` | **Dev-only** | Test endpoint, should be profile-guarded |
| `WalletController.creditWalletForTesting()` | **Dev-only** | Marked as DEV-ONLY in comment but has no @Profile guard |
| `WalletWalletController` (misspelled) | - | Possibly test-only |

## 2.9 Over-engineering

1. **Event-driven architecture for simple CRUD**: `FinancialMutationEvent`, `PlatformRevenueEvent`, `AgencyCommissionEvent`, `DriverEarningEvent` + 4 listeners for basic wallet operations that could be direct service calls.

2. **FinancialOutboxEvent table + pattern**: Outbox pattern adds complexity without being used in practice. Events are published directly.

3. **Three separate transaction tables** (`Transaction`, `AgencyTransaction`, `PlatformTransaction`) + `AgencyLedgerTransaction` = 4 tables doing the same thing.

4. **WalletTimeline**: A separate entity for wallet events when `Transaction` already serves this purpose.

5. **SettlementBatch separate entity**: A simple log table for a scheduled job.

6. **AgencyPayoutRequest**: Separate entity from `WithdrawalRequest` with identical fields.

7. **Mock/empty analytics endpoints**: `/api/admin/finance/analytics/top`, `/api/admin/finance/fraud-alerts`, `/api/admin/finance/reconciliations`, `/api/admin/finance/ledger-accounts`, `/api/admin/finance/journal-entries` all return empty data.

## 2.10 Tight Coupling

- `WalletServiceImpl` is coupled to **18 different repositories and services**. Any change anywhere in the financial system potentially requires changes to this class.
- The `billing` package (`AgencyBillingService`, `InvoicingService`, `LedgerService`) is **completely separate** from the main financial flow, yet processes the same orders and wallets.
- `handleOrderDelivery` method does **too much**: fee split, COD tracking, wallet credit, agency commission, platform profit, WebSocket notification, and event publishing.

---

# Phase 3 — Refactored Service Architecture

## 3.1 Analysis of Every Current Service

### WalletService / WalletServiceImpl

| Aspect | Analysis |
|--------|----------|
| **Current Responsibility** | Everything wallet-related: balances, transactions, COD, remittances, payouts, bonuses, deductions, admin operations, agency operations, CSV, earnings |
| **Problems** | God class — 1928 lines, 18 dependencies, 60+ methods |
| **Should it remain?** | Yes, but **split** into focused services |
| **New home** | Split into: `DriverWalletService`, `CustomerWalletService`, `CODService`, `FinanceCalculationHelper` |

### PlatformWalletService / PlatformWalletServiceImpl

| Aspect | Analysis |
|--------|----------|
| **Current Responsibility** | Platform aggregate tracking — revenue, profit, balance, payouts |
| **Problems** | Most fields are derivable from Transaction; creates write duplication |
| **Should it remain?** | **Simplify** — keep only `balance` as cached field, derive others |
| **New home** | Merge into simplified `WalletAdminService` |

### FinancialService / FinancialServiceImpl

| Aspect | Analysis |
|--------|----------|
| **Current Responsibility** | Admin wallet operations, settings CRUD, global queries |
| **Problems** | Partially overlaps WalletService (freeze/unfreeze) |
| **Should it remain?** | **Rename** to `WalletAdminService` — expand to cover all admin financial ops |
| **New home** | `WalletAdminService` |

### FinancialQueryService / FinancialQueryServiceImpl

| Aspect | Analysis |
|--------|----------|
| **Current Responsibility** | KPIs, analytics summary |
| **Problems** | Returns empty/mock data; barely functional |
| **Should it remain?** | **Merge** into `WalletAdminService` — no separate service needed |
| **New home** | Remove interface, move KPIs to `WalletAdminService` |

### PayoutService / PayoutServiceImpl

| Aspect | Analysis |
|--------|----------|
| **Current Responsibility** | Nothing — all logic in WalletService |
| **Problems** | Dead code |
| **Should it remain?** | **Remove** entirely |
| **New home** | N/A — logic stays in `WithdrawalService` (extracted from WalletService) |

### PaymentProvider / PayPalProviderImpl

| Aspect | Analysis |
|--------|----------|
| **Current Responsibility** | PayPal API abstraction |
| **Should it remain?** | **Keep** — well-designed abstraction |
| **New home** | `PaymentProvider` stays as-is |

### PlatformFinanceSettingsService

| Aspect | Analysis |
|--------|----------|
| **Current Responsibility** | Centralized settings — fee rates, commission rates, settlement formula |
| **Should it remain?** | **Keep** — well-designed, single source of truth |
| **New home** | Keep as-is |

### SettlementEngine / SettlementEngineImpl

| Aspect | Analysis |
|--------|----------|
| **Current Responsibility** | Batch settlement processing |
| **Problems** | Duplicates `WalletServiceImpl.processClientSettlement` |
| **Should it remain?** | **Remove** — merge batch logic into `CODService` or `WalletAdminService` |
| **New home** | N/A — logic moves to `CODService` |

### DriverFinancialEngine / DriverFinancialEngineImpl

| Aspect | Analysis |
|--------|----------|
| **Current Responsibility** | Calculate driver metrics from orders |
| **Problems** | Dead code — never called; duplicates WalletService logic |
| **Should it remain?** | **Remove** entirely |
| **New home** | N/A |

### AgencyBillingService / AgencyBillingServiceImpl

| Aspect | Analysis |
|--------|----------|
| **Current Responsibility** | B2B invoicing, driver earnings records, COD reconciliation, platform commissions, ledger |
| **Problems** | Parallel financial system duplicating WalletService |
| **Should it remain?** | **Partially keep** — keep invoicing feature ONLY if used in production; remove COD reconciliation, driver earnings, platform commission records (these duplicate main system) |
| **New home** | If kept, rename to `InvoicingService`; remove duplicated features |

### InvoicingService / InvoicingServiceImpl

| Aspect | Analysis |
|--------|----------|
| **Current Responsibility** | Invoice CRUD |
| **Should it remain?** | **Keep** if invoicing is a real business requirement. Remove if not used. |
| **New home** | Keep as `InvoicingService` |

### LedgerService / LedgerServiceImpl

| Aspect | Analysis |
|--------|----------|
| **Current Responsibility** | Agency ledger transactions |
| **Problems** | Duplicates Transaction system |
| **Should it remain?** | **Remove** — merge into unified Transaction system |
| **New home** | N/A |

### PricingService

| Aspect | Analysis |
|--------|----------|
| **Current Responsibility** | Delivery fee calculation |
| **Should it remain?** | **Keep** — distinct concern |
| **New home** | Keep as-is |

### ExchangeRateService

| Aspect | Analysis |
|--------|----------|
| **Current Responsibility** | MAD-to-currency conversion for payouts |
| **Should it remain?** | **Keep** — needed for PayPal |
| **New home** | Keep as-is |

### CashWorkflowValidator

| Aspect | Analysis |
|--------|----------|
| **Current Responsibility** | COD workflow validation |
| **Should it remain?** | **Keep** — but could be merged into `CODService` |
| **New home** | Merge into `CODService` |

## 3.2 Final Service Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FINANCIAL SERVICE LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐   ┌─────────────────────────────────┐  │
│  │   WalletService      │   │      CODService (NEW)            │  │
│  │   (interface only)   │   │                                  │  │
│  │                      │   │  - declareCODRemittance()        │  │
│  │   (split into:)      │   │  - confirmCODRemittance()        │  │
│  │                      │   │  - acceptCODRemittance()         │  │
│  │  ┌─────────────────┐ │   │  - remitByScan()                 │  │
│  │  │ DriverWalletSvc  │ │   │  - rejectCODRemittance()        │  │
│  │  │ CustomerWalletSvc│ │   │  - processClientSettlement()    │  │
│  │  └─────────────────┘ │   │  - reconcileDailyBatch()         │  │
│  └─────────────────────┘   └─────────────────────────────────┘  │
│                                                                  │
│  ┌─────────────────────┐   ┌─────────────────────────────────┐  │
│  │  WithdrawalService   │   │      WalletAdminService          │  │
│  │                      │   │  (renamed from FinancialService) │  │
│  │  - requestWithdraw() │   │                                  │  │
│  │  - createWithdrawal()│   │  - getAllWallets()               │  │
│  │  - cancelWithdraw()  │   │  - freeze/unfreezeWallet()       │  │
│  │  - rejectWithdraw()  │   │  - adjustBalance()               │  │
│  │  - getWithdrawals()  │   │  - getGlobalTransactions()       │  │
│  │                      │   │  - getWithdrawalRequests()       │  │
│  └─────────────────────┘   │  - getFinanceSettings()           │  │
│                            │  - updateFinanceSettings()         │  │
│  ┌─────────────────────┐   │  - getOverviewKPIs()              │  │
│  │  PaymentProvider     │   │  - approve/rejectWithdrawal()    │  │
│  │  (interface)         │   │  - manageAgencyPayout()          │  │
│  │  ├─ PayPalProvider   │   └─────────────────────────────────┘  │
│  │  └─ (future: Stripe) │                                        │
│  └─────────────────────┘   ┌─────────────────────────────────┐  │
│                            │  PlatformFinanceSettingsService  │  │
│  ┌─────────────────────┐   │  (keep as-is)                    │  │
│  │  PricingService     │   └─────────────────────────────────┘  │
│  │  (keep as-is)       │                                        │
│  └─────────────────────┘   ┌─────────────────────────────────┐  │
│                            │  FinanceCalculationHelper        │  │
│  ┌─────────────────────┐   │  (NEW — shared utility)          │  │
│  │  InvoicingService   │   │                                  │  │
│  │  (KEEP only if used)│   │  - splitDeliveryFee()            │  │
│  └─────────────────────┘   │  - calculateClientSettlement()   │  │
│                            │  - calculateAmountToRemit()      │  │
│  (REMOVED)                 │  - calculateWeeklyEarnings()     │  │
│  ✗ PayoutService           └─────────────────────────────────┘  │
│  ✗ SettlementEngine                                           │
│  ✗ DriverFinancialEngine  ┌─────────────────────────────────┐  │
│  ✗ LedgerService           │  ExchangeRateService            │  │
│  ✗ FinancialQueryService   │  (keep as-is)                   │  │
│  ✗ AgencyBillingService    └─────────────────────────────────┘  │
│    (except invoicing)                                          │
│  ✗ CashWorkflowValidator                                       │
│    (merged into CODService)                                    │
│                                                               │
└─────────────────────────────────────────────────────────────────┘
```

### Service Responsibilities

| Service | Responsibility |
|---------|---------------|
| **DriverWalletService** | Balance queries, transaction history, daily/weekly/monthly earnings, bonuses, deductions, freeze/unfreeze for driver wallets. Manages `Wallet` where `walletType = DRIVER`. |
| **CustomerWalletService** | Customer wallet stats, COD settlement credit, delivery fee payments, order payments. Manages `Wallet` where `walletType = CUSTOMER`. |
| **CODService** | All COD lifecycle: declare remittance, confirm (agency), accept (admin), scan-based remittance, reject, reconcile daily batch, process client settlement. |
| **WithdrawalService** | Payout requests (create, cancel, reject), withdrawal history, PayPal integration, payment account management. Handles both driver and customer withdrawals using unified `WithdrawalRequest`. Merges agency payouts into same flow. |
| **WalletAdminService** | Admin operations: unified wallet listing (driver wallets + agency wallets), freeze/unfreeze (any wallet type), balance adjustment, global transaction view, withdrawal management (approve/reject), finance settings CRUD, overview KPIs, CSV export. |
| **PaymentProvider** (interface) | Abstraction over external payment gateways (PayPal currently). One implementation: `PayPalProviderImpl`. |
| **PlatformFinanceSettingsService** | Single source of truth for fee rates, commission rates, settlement formula, reconciliation config, debt thresholds. Cached read access. |
| **FinanceCalculationHelper** | Static/utility methods shared across all services: `splitDeliveryFee(deliveryFee, platformRate, agencyRate)`, `calculateClientSettlement(codAmount, deliveryFee, formula)`, `calculateAmountToRemit(codAmount, deliveryFee, platformRate, agencyRate)`, `calculateWeeklyEarnings(userId, days)`. |
| **PricingService** | Delivery fee calculation based on distance, weight, and pricing config. Kept as separate concern. |
| **ExchangeRateService** | MAD-to-currency conversion for PayPal payouts. |
| **InvoicingService** | (Conditional) B2B invoice management. Only keep if production-verified. |

---

# Phase 4 — Simplify Business Logic

## 4.1 Duplicated Calculations

### Fee Split Calculation — 4 copies → 1 function

**Current locations**:
1. `WalletServiceImpl.handleOrderDelivery()` lines 1136-1154
2. `WalletServiceImpl.calculateAmountToRemit()` lines 1608-1630
3. `WalletServiceImpl.acceptCODRemittance()` lines 1754-1761
4. `AgencyBillingServiceImpl.calculatePlatformCommission()` lines 255-263

**New location**:

```java
// FinanceCalculationHelper.java — static utility
public class FinanceCalculationHelper {

    /**
     * Splits a delivery fee into admin (platform) share, agency share, and driver share.
     * @return FeeSplitResult containing all three shares
     */
    public static FeeSplitResult splitDeliveryFee(
            BigDecimal deliveryFee,
            BigDecimal platformFeeRate,
            BigDecimal agencyCommissionRate) {

        BigDecimal adminShare = deliveryFee.multiply(platformFeeRate)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal remainingFee = deliveryFee.subtract(adminShare);
        BigDecimal agencyShare = remainingFee.multiply(agencyCommissionRate)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal driverShare = remainingFee.subtract(agencyShare);

        return new FeeSplitResult(adminShare, agencyShare, driverShare);
    }

    /**
     * Calculates the client settlement amount based on formula.
     */
    public static BigDecimal calculateClientSettlement(
            BigDecimal codAmount,
            BigDecimal deliveryFee,
            ClientSettlementFormula formula) {

        return switch (formula) {
            case COD_MINUS_FEE -> codAmount.subtract(deliveryFee).max(BigDecimal.ZERO);
            case COD_FULL -> codAmount;
        };
    }

    /**
     * Calculates amount a driver must remit to agency for a COD order.
     */
    public static BigDecimal calculateAmountToRemit(
            BigDecimal codAmount,
            BigDecimal deliveryFee,
            BigDecimal platformFeeRate,
            BigDecimal agencyCommissionRate) {

        BigDecimal totalCollected = codAmount.add(deliveryFee);
        FeeSplitResult split = splitDeliveryFee(deliveryFee, platformFeeRate, agencyCommissionRate);
        return totalCollected.subtract(split.driverShare()).max(BigDecimal.ZERO);
    }
}
```

### Client Settlement Logic — 3 copies → 1 function

**Current locations**:
1. `WalletServiceImpl.processClientSettlement()` lines 1451-1491
2. `WalletServiceImpl.reconcileDailyBatch()` lines 1440-1449 (calls #1)
3. `SettlementEngineImpl.runSettlement()` lines 34-126 (independent duplicate)

**Resolution**: Remove `SettlementEngineImpl.runSettlement()`. Keep `processClientSettlement()` in `CODService`. `reconcileDailyBatch()` calls it in a loop (already done).

### Weekly/Daily Earnings — 2 copies per calculation method

**Current locations**:
- `WalletServiceImpl.getDailyEarnings()` lines 365-389
- `WalletServiceImpl.calculateWeeklyCommission()` lines 1820-1837

Both have an identical pattern: query transactions, then fallback to order sums, then take the `max()`.

**Resolution**: Move both into `FinanceCalculationHelper`:

```java
public static BigDecimal calculateEarnings(UUID userId, int days, 
        TransactionRepository txRepo, OrderRepository orderRepo, 
        DriverRepository driverRepo) {
    
    LocalDateTime since = LocalDateTime.now().minus(days, ChronoUnit.DAYS);
    BigDecimal fromTx = txRepo.findByWalletUserIdAndTypeInAndDateGreaterThan(
        userId, EARNING_TYPES, since)
        .stream().map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    
    // Fallback to order sums for consistency
    UUID driverId = driverRepo.findByUserId(userId).map(Driver::getId).orElse(null);
    if (driverId != null) {
        BigDecimal fromOrders = orderRepo.sumDriverEarningsByDriverIdAndStatusAndDeliveredAtAfter(
            driverId, OrderStatus.DELIVERED, since);
        return fromTx.max(fromOrders != null ? fromOrders : BigDecimal.ZERO);
    }
    return fromTx;
}
```

### Amount to Remit — 2 copies

**Current locations**:
1. `WalletServiceImpl.declareCODRemittance()` lines 266-268
2. `WalletServiceImpl.calculateAmountToRemit()` lines 1608-1630

**Resolution**: Single function in `FinanceCalculationHelper` (see above).

---

# Phase 5 — Simplify Database

## 5.1 Table-by-Table Analysis

### wallets

| Aspect | Assessment |
|--------|-----------|
| **Purpose** | Store wallet state for drivers and customers |
| **Current usage** | Core — heavily used |
| **Dependencies** | User (1:1), Transaction (1:N) |
| **Problems** | `cash_in_hand` and `debt_to_system` are derivable; `balance` is source of truth |
| **Changes** | Keep `balance` as cached source of truth. Remove `cash_in_hand` and `debt_to_system` — calculate from transactions when needed (infrequent read, typically only for driver wallet view) |

### agency_wallets

| Aspect | Assessment |
|--------|-----------|
| **Purpose** | Store agency wallet state |
| **Current usage** | Heavily used |
| **Dependencies** | Agency (1:1) |
| **Problems** | **14 monetary fields** — vast over-engineering |
| **Changes** | Keep only: `id`, `agency_id`, `balance`, `is_frozen`, `frozen_reason`, `created_at`, `updated_at`, `version`. Remove `current_balance` (same as balance), `total_revenue`, `total_expenses`, `total_profit`, `pending_receivables`, `pending_payables`, `total_commission_earned`, `pending_commission`, `commission_rate` (moved to Agency), `total_collected`, `total_paid_out`. All removed fields are summable from `Transaction` records |

### platform_wallet

| Aspect | Assessment |
|--------|-----------|
| **Purpose** | Platform-level aggregations |
| **Current usage** | Written by PlatformWalletService, read by admin dashboards |
| **Dependencies** | None |
| **Problems** | All fields except `balance` are derivable |
| **Changes** | Keep only: `id`, `balance`, `updated_at`, `version`. Remove `total_revenue`, `platform_profit`, `total_driver_payout`, `total_agency_payout`. Admin dashboard calculates these from `Transaction` when needed |

### transactions

| Aspect | Assessment |
|--------|-----------|
| **Purpose** | Core financial ledger |
| **Current usage** | Extremely high — every financial operation |
| **Dependencies** | Wallet (M:1) |
| **Problems** | None structurally |
| **Changes** | Add polymorphic owner columns: `owner_type` (DRIVER, CUSTOMER, AGENCY, PLATFORM) + `owner_id` (UUID). This allows merging `AgencyTransaction` and `PlatformTransaction` into this single table |

### agency_transactions

| Aspect | Assessment |
|--------|-----------|
| **Purpose** | Agency-specific transactions |
| **Dependencies** | AgencyWallet (M:1) |
| **Changes** | **Remove** — merge into `transactions` table using polymorphic pattern |

### platform_transactions

| Aspect | Assessment |
|--------|-----------|
| **Purpose** | Platform-specific transactions |
| **Dependencies** | PlatformWallet (M:1) |
| **Changes** | **Remove** — merge into `transactions` table |

### withdrawal_requests

| Aspect | Assessment |
|--------|-----------|
| **Purpose** | Driver/customer withdrawal requests |
| **Current usage** | Heavily used |
| **Dependencies** | User (M:1), PaymentAccount |
| **Problems** | None structurally |
| **Changes** | Add `owner_type` column to also handle agency payouts. This merges `agency_payout_requests` |

### agency_payout_requests

| Aspect | Assessment |
|--------|-----------|
| **Purpose** | Agency payout requests |
| **Dependencies** | Agency (M:1) |
| **Changes** | **Remove** — merge into `withdrawal_requests` using `owner_type` = 'AGENCY' |

### billing tables (AgencyCustomerInvoice, AgencyCustomerPayment, AgencyLedgerTransaction, CODReconciliation, DriverEarning, DriverFinancialRecord, PlatformCommissionRecord)

| Aspect | Assessment |
|--------|-----------|
| **Purpose** | Billing sub-system |
| **Changes** | **Remove all** except `agency_customer_invoice` and `agency_customer_payment` if invoicing is a real feature. `AgencyLedgerTransaction` → merged into `transactions`. `CODReconciliation` → remove (COD tracked in Orders + Transactions). `DriverEarning` + `DriverFinancialRecord` → remove (driver earnings tracked in `transactions` with type GAIN). `PlatformCommissionRecord` → remove (commissions tracked in `transactions` with type COMMISSION) |

### Other tables

| Table | Change |
|-------|--------|
| `wallet_timeline` | **Remove** — not needed. Transactions + audit logs suffice |
| `settlement_batch` | **Remove** — not needed. Simple scheduled job log |
| `payout_log` | **Remove** — dead code |
| `financial_outbox_event` | **Remove** — outbox pattern unused |
| `financial_audit_log` | **Keep** — useful for admin audit trail |
| `platform_finance_settings` | **Keep** — single source of truth for config |
| `payment_accounts` | **Keep** — needed for PayPal integration |
| `pricing_config` | **Keep** — needed for PricingService |
| `client_settlement_formula` | **Remove** — unused (part of PlatformFinanceSettings) |

## 5.2 Final Database Schema

```
Core Tables (KEEP + SIMPLIFY):
  wallets                    — Keep: id, user_id, balance, wallet_type, is_frozen, frozen_reason
  agency_wallets             — Keep: id, agency_id, balance, is_frozen, frozen_reason, version
  platform_wallet            — Keep: id, balance, version
  transactions               — KEEP + ADD: owner_type, owner_id (to absorb agency/platform transactions)
  withdrawal_requests        — KEEP + ADD: owner_type (to absorb agency payouts)
  payment_accounts           — KEEP
  platform_finance_settings  — KEEP
  financial_audit_log        — KEEP

Removed Tables:
  ✗ agency_transactions      → Merged into transactions
  ✗ platform_transactions    → Merged into transactions
  ✗ agency_payout_requests   → Merged into withdrawal_requests
  ✗ wallet_timeline          → Removed (not needed)
  ✗ settlement_batch         → Removed (not needed)
  ✗ payout_log               → Removed (dead code)
  ✗ financial_outbox_event   → Removed (unused pattern)
  ✗ agency_ledger_transaction → Merged into transactions
  ✗ cod_reconciliation        → Removed (COD tracked in orders + transactions)
  ✗ driver_earning            → Removed (tracked in transactions)
  ✗ driver_financial_record   → Removed (tracked in transactions)
  ✗ platform_commission_record → Removed (tracked in transactions)
  ✗ client_settlement_formula → Removed (moved to settings)
```

---

# Phase 6 — Simplified Entities

## 6.1 Wallet Entity (Simplified)

```java
@Entity
@Table(name = "wallets")
public class Wallet {
    @Id private UUID id;
    
    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    
    private BigDecimal balance = BigDecimal.ZERO;  // Cached source of truth
    private boolean isFrozen = false;
    private String frozenReason;
    
    @Enumerated(EnumType.STRING)
    private WalletType walletType = WalletType.DRIVER;
}
```

**Removed fields**:
- `cash_in_hand` → calculated from transactions (CASH_KEPT_BY_DRIVER - COD_REMIS_COMPLETED)
- `debt_to_system` → calculated from transactions (SUM of COD_COLLECTED where PENDING)

## 6.2 AgencyWallet Entity (Simplified)

```java
@Entity
@Table(name = "agency_wallets")
public class AgencyWallet {
    @Id private UUID id;
    
    @OneToOne
    @JoinColumn(name = "agency_id", nullable = false, unique = true)
    private Agency agency;
    
    private BigDecimal balance = BigDecimal.ZERO;  // Cached source of truth
    private boolean isFrozen = false;
    private String frozenReason;
    
    @Version private Long version = 0L;
}
```

**Removed fields** (all derivable from transactions):
- `current_balance` = balance (exact duplicate)
- `total_revenue` → SUM of CREDIT transactions
- `total_expenses` → SUM of DEBIT transactions
- `total_profit` = total_revenue - total_expenses
- `pending_receivables` → pending invoice amounts
- `pending_payables` → pending driver earnings
- `total_commission_earned` → SUM COMMISSION transactions
- `pending_commission` → same as pending_receivables
- `commission_rate` → moved to Agency entity or PlatformFinanceSettings
- `total_collected` → SUM of COD transactions
- `total_paid_out` → SUM of payout transactions

## 6.3 PlatformWallet Entity (Simplified)

```java
@Entity
@Table(name = "platform_wallet")
public class PlatformWallet {
    @Id private UUID id;
    private BigDecimal balance = BigDecimal.ZERO;  // Cached liability balance
    @Version private Long version = 0L;
}
```

**Removed fields** (all derivable from Transaction queries):
- `total_revenue` → SUM of delivery fees in transactions
- `platform_profit` → SUM of admin shares
- `total_driver_payout` → SUM of PAYOUT transactions where owner_type = DRIVER
- `total_agency_payout` → SUM of PAYOUT transactions where owner_type = AGENCY

## 6.4 Transaction Entity (Enhanced)

```java
@Entity
@Table(name = "transactions")
public class Transaction {
    @Id private UUID id;
    
    // Polymorphic owner (replaces wallet_id, agency_wallet_id, platform_wallet_id)
    @Enumerated(EnumType.STRING)
    @Column(name = "owner_type", nullable = false)
    private OwnerType ownerType;  // DRIVER, CUSTOMER, AGENCY, PLATFORM
    
    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;  // wallet_id, agency_wallet_id, or platform_wallet_id
    
    private BigDecimal amount;
    
    @Enumerated(EnumType.STRING)
    private TransactionType type;
    
    @Enumerated(EnumType.STRING)
    private TransactionStatus status;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private UUID orderId;
    private LocalDateTime date;
    
    // Optional: Map<String, String> metadata — keep only if used
}
```

## 6.5 WithdrawalRequest Entity (Enhanced)

```java
@Entity
@Table(name = "withdrawal_requests")
public class WithdrawalRequest {
    @Id private UUID id;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "owner_type", nullable = false)
    private OwnerType ownerType;  // DRIVER, CUSTOMER, AGENCY
    
    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;
    
    private BigDecimal amount;
    private BigDecimal payoutAmount;
    private String payoutCurrency;
    private UUID paymentAccountId;
    private String receiverEmailSnapshot;
    private PaymentProviderEnum provider;
    
    @Enumerated(EnumType.STRING)
    private TransactionStatus status;
    
    private String rejectionReason;
    private String paypalItemId;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
}
```

**Merged**: `AgencyPayoutRequest` fields are now handled by `owner_type = AGENCY`.

---

# Phase 7 — Simplified APIs

## 7.1 WalletController Endpoints

| Endpoint | Action | Method | Decision | Reason |
|----------|--------|--------|----------|--------|
| `GET /api/wallets/balance` | Get wallet balance | `DriverWalletService` | **KEEP** | Core driver feature |
| `GET /api/wallets/transactions` | List transactions | `DriverWalletService` | **KEEP** | Core feature |
| `GET /api/wallets/pending-cod` | List pending COD | `CODService` | **MERGE** | Move to CODService |
| `POST /api/wallets/cod-remittance` | Declare COD remittance | `CODService` | **MERGE** | Move to CODService |
| `POST /api/wallets/remit/scan` | Scan-based remittance | `CODService` | **MERGE** | Move to CODService |
| `GET /api/wallets/commission/weekly` | Get weekly commission | `DriverWalletService` | **KEEP** | Consolidate |
| `GET /api/wallets/earnings/monthly` | Get monthly earnings | `DriverWalletService` | **KEEP** | Consolidate |
| `POST /api/wallets/payout` | Request payout | `WithdrawalService` | **MERGE** | Move to WithdrawalService |
| `GET /api/wallets/bonuses` | Get bonuses | `DriverWalletService` | **KEEP** | |
| `GET /api/wallets/stats` | Get wallet stats | `DriverWalletService` | **KEEP** | |
| `GET /api/wallets/stats/customer` | Customer wallet stats | `CustomerWalletService` | **MERGE** | Move to CustomerWalletService |
| `GET /api/wallets/withdrawals` | List withdrawals | `WithdrawalService` | **MERGE** | Move to WithdrawalService |
| `GET /api/wallets/daily-earnings` | Daily earnings breakdown | `DriverWalletService` | **KEEP** | |
| `GET /api/wallets/statement/csv` | Download CSV | `DriverWalletService` | **KEEP** | |
| `POST /api/wallets/withdrawal-request` | Create withdrawal | `WithdrawalService` | **MERGE** | Move to WithdrawalService |
| `GET /api/wallets/agency/balance` | Agency wallet | `WalletAdminService` | **MERGE** | Move to WalletAdminService |
| `GET /api/wallets/agency/commissions` | Agency commissions | `WalletAdminService` | **MERGE** | Move to WalletAdminService |
| `POST /api/wallets/agency/payout-request` | Agency payout | `WithdrawalService` | **MERGE** | Move to WithdrawalService |
| `GET /api/wallets/agency/remittances` | Agency remittances | `CODService` | **MERGE** | Move to CODService |
| `GET /api/wallets/earnings/summary` | Earnings summary | `DriverWalletService` | **KEEP** | |
| `GET /api/wallets/cod/pending` | Pending COD (duplicate) | `CODService` | **REMOVE** | Duplicate of pending-cod |
| `GET /api/wallets/pending-cod-remittances` | Pending COD remittances | `CODService` | **MERGE** | Move to CODService |
| `GET /api/wallets/agency/payout-requests` | Agency payout requests | `WithdrawalService` | **MERGE** | Move to WithdrawalService |

## 7.2 FinancialAdminController Endpoints

| Endpoint | Decision | Reason |
|----------|----------|--------|
| `GET /api/admin/finance/overview/kpis` | **KEEP** | Real query in FinancialQueryRepository |
| `GET /api/admin/finance/analytics/top` | **REMOVE** | Returns empty mock data |
| `GET/PUT /api/admin/finance/settings` | **KEEP** | Core admin feature |
| `GET /api/admin/finance/wallets` | **KEEP** | Unified wallet listing |
| `PUT /api/admin/finance/wallets/{id}/freeze` | **KEEP** | Core admin feature |
| `PUT /api/admin/finance/wallets/{id}/unfreeze` | **KEEP** | Core admin feature |
| `POST /api/admin/finance/wallets/{id}/adjust` | **KEEP** | Core admin feature |
| `GET /api/admin/finance/transactions` | **KEEP** | Global transaction view |
| `GET /api/admin/finance/withdrawals` | **KEEP** | Withdrawal management |
| `POST /api/admin/finance/settle` | **KEEP** but **SIMPLIFY** | Move to CODService.reconcileDailyBatch() |
| `POST /api/admin/finance/reconcile` | **REMOVE** | Mock — returns empty success |
| `POST /api/admin/finance/fraud-scan` | **REMOVE** | Mock |
| `GET /api/admin/finance/fraud-alerts` | **REMOVE** | Returns empty list |
| `GET /api/admin/finance/reconciliations` | **REMOVE** | Returns empty list |
| `PUT /api/admin/finance/withdrawals/{id}/approve` | **KEEP** | Core admin feature |
| `PUT /api/admin/finance/withdrawals/{id}/reject` | **KEEP** | Core admin feature |
| `POST /api/admin/finance/export` | **KEEP** but **SIMPLIFY** | Replace reflection-based CSV |
| `GET /api/admin/finance/ledger-accounts` | **REMOVE** | Returns empty list |
| `GET /api/admin/finance/journal-entries` | **REMOVE** | Returns empty list |

## 7.3 Other Controllers

| Controller | Decision | Reason |
|------------|----------|--------|
| `PaymentAccountController` | **KEEP** | Needed for PayPal integration |
| `PricingController` | **KEEP** | Distinct from finance |
| `AgencyBillingController` | **SIMPLIFY** or **REMOVE** | Remove duplicated features, keep invoicing only if used |
| `WebhookController` | **KEEP** | PayPal webhooks |
| `TestPayPalController` | **GUARD** with @Profile("dev") | Dev-only test endpoint |
| `AdminDashboardController` | **KEEP** | Dashboard metrics (may overlap with FinancialAdminController) |

## 7.4 Restructured API Surface

```
/api/wallets/driver          → DriverWalletController
  GET /balance
  GET /transactions
  GET /earnings/daily
  GET /earnings/weekly
  GET /earnings/monthly
  GET /earnings/summary
  GET /bonuses
  GET /stats
  GET /statement/csv

/api/wallets/customer        → CustomerWalletController
  GET /stats

/api/cod                     → CODController
  GET /pending
  POST /remittance
  POST /remit/scan
  PUT /remittance/{id}/accept
  PUT /remittance/{id}/reject
  POST /settle/batch

/api/withdrawals             → WithdrawalController
  POST /request
  GET /
  GET /{id}
  POST /{id}/cancel

/api/admin/finance           → WalletAdminController
  GET /overview/kpis
  GET /settings | PUT /settings
  GET /wallets
  PUT /wallets/{id}/freeze | /unfreeze
  POST /wallets/{id}/adjust
  GET /transactions
  GET /withdrawals
  PUT /withdrawals/{id}/approve | /reject
  POST /export
```

---

# Phase 8 — Simplify DTOs

## 8.1 Problem: Too Many DTOs

**Current count**: 33 DTO classes across 4 packages.

**Root cause**: Each service/controller defines its own response type, leading to:
- `WalletResponse` + `WalletOverviewDTO` + `CustomerWalletResponse` = 3 wallet response types
- `TransactionResponse` + `TransactionDTO` = 2 transaction response types
- `WithdrawalRequestResponse` + `WithdrawalDTO` = 2 withdrawal response types
- `FinanceResponse` + `FinanceSummaryResponse` + `FinancialSummaryDTO` = 3 summary types
- 11 request DTOs with overlapping fields

## 8.2 Proposed DTO Structure

```
dto/
  request/
    WithdrawalRequestDTO        (KEEP)
    PayoutRequestDTO            (KEEP)
    CODRemittanceRequestDTO     (KEEP)
    FinanceSettingsUpdateRequest (KEEP)
    WalletAdjustmentRequest     (KEEP)
    CreatePaymentAccountRequest (KEEP)
    TopUpRequest                (REMOVE — unused feature)
  
  response/
    WalletResponse              (KEEP — unified for all wallet types)
    TransactionResponse         (KEEP — unified for all transaction types)
    WithdrawalResponse          (RENAME from WithdrawalRequestResponse)
    PaymentAccountResponse      (KEEP)
    FinanceSettingsDTO          (KEEP)
    FinancialSummaryDTO         (RENAME from FinanceSummaryResponse — single summary)
    CustomerWalletResponse      (KEEP if needed, else use WalletResponse)
    DailyEarningsResponse       (KEEP)
    WalletCreditResult          (KEEP — dev-only)
    
    billing/
      BillingSummaryResponse    (KEEP only if invoicing kept)

  REMOVE:
    ✗ WalletBalanceResponse     → WalletResponse has balance
    ✗ WalletCreditResult        → Dev-only, move to test package
    ✗ TransactionDTO            → TransactionResponse covers same purpose
    ✗ WithdrawalDTO             → WithdrawalResponse (rename)
    ✗ FinanceResponse           → Never used?
    ✗ FinanceSummaryResponse    → Use FinancialSummaryDTO
    ✗ PaymentTimelineResponse   → Never used?
    ✗ WalletOverviewDTO         → Use WalletResponse
    ✗ AnalyticsDTO              → Dead (mock data)
    ✗ AuditLogDTO               → If needed, add to FinancialAuditLog directly
    ✗ NotificationDTO           → Not a DTO for REST
    ✗ ReportDTO                 → Not needed
    ✗ SettingsDTO               → Use FinanceSettingsDTO
    ✗ All billing DTOs          → Remove if billing subsystem removed
```

## 8.3 Unified WalletResponse

```java
@Data
@Builder
public class WalletResponse {
    private UUID id;
    private UUID userId;
    private String userEmail;
    private String userName;
    private String walletType;        // DRIVER, CUSTOMER, AGENCY, PLATFORM
    private BigDecimal balance;
    private BigDecimal availableBalance;
    private BigDecimal cashInHand;    // Calculated on read
    private BigDecimal debtToSystem;  // Calculated on read
    private BigDecimal totalEarned;   // Calculated on read
    private BigDecimal pendingCOD;
    private BigDecimal weeklyEarnings;
    private BigDecimal monthlyEarnings;
    private BigDecimal todayEarnings;
    private BigDecimal deductions;
    private int totalDeliveries;
    private boolean isFrozen;
    private String accountStatus;
    private LocalDate nextPayoutDate;
}
```

---

# Phase 9 — Simplified Workflows

## 9.1 Order Delivery → Fee Distribution

### Current (complicated)
1. `WalletServiceImpl.handleOrderDelivery()` — 170 lines, does everything
2. Fee split calculation inline
3. COD tracking inline
4. Driver credit inline
5. Agency commission inline
6. Platform revenue/profit inline
7. WebSocket notification inline
8. Event publishing inline

### Simplified
```
1. CODService.processDelivery(order, codCollected)
   a. FinanceCalculationHelper.splitDeliveryFee(deliveryFee, platformRate, agencyRate)
   b. If COD: create COD_COLLECTED + CASH_KEPT_BY_DRIVER transactions
   c. DriverWalletService.creditEarnings(driverUserId, driverShare, orderId)
   d. AgencyWalletService.creditCommission(agencyId, agencyShare, orderId)
   e. PlatformWalletService.recordRevenue(deliveryFee, adminShare)
   f. updateOrderStatus(order, DELIVERED)
   g. publishWalletUpdateEvent(driverUserId)
```

Each step is a simple method call. No 170-line god method.

## 9.2 COD Collection → Remittance → Settlement

### Current (3 parallel implementations)
1. `declareCODRemittance → confirmCODRemittance` (agency confirms)
2. `declareCODRemittance → acceptCODRemittance` (admin accepts)
3. `remitAllByAgencyScan` (scan-based, different flow)

### Simplified
```
COD FLOW (single unified path):

1. DRIVER declares remittance:
   POST /api/cod/remittance
   → Creates COD_REMIS transaction (PENDING)
   → Marks COD_COLLECTED as REMITTED

2. AGENCY confirms AND settles (merged step):
   PUT /api/cod/remittance/{id}/confirm
   → Updates driver wallet (cashInHand, debtToSystem)
   → Credits agency wallet
   → Updates orders to CONFIRMED_BY_AGENCY
   → processClientSettlement() for each order

3. (Alternative) ADMIN accepts:
   PUT /api/cod/remittance/{id}/accept
   → Same as confirm but admin-initiated

4. (Alternative) DRIVER scan-remit:
   POST /api/cod/remit/scan
   → Creates COD_REMIS (COMPLETED immediately)
   → Same wallet/agency/order updates
   → processClientSettlement() for each order
```

Key simplification: All three paths share the same underlying logic. Extract shared logic into private methods in `CODService`.

## 9.3 Withdrawal / Payout

### Current
- `createWithdrawalRequest` in WalletService (155 lines)
- Phase 1: DB transaction (lock, validate, deduct, save)
- Phase 2: External PayPal API call
- Phase 3: DB transaction (update state based on result)
- Separate flow for agency payouts

### Simplified
```
1. WithdrawalService.requestWithdrawal(userId, amount, paymentAccountId):
   → validate (amount, frozen, debt, duplicate)
   → lock wallet, deduct balance
   → create WithdrawalRequest (PENDING)
   → create PAYOUT Transaction (PENDING)
   → call PaymentProvider.createPayout()
   → on success: update to PROCESSING
   → on failure: refund balance, update to FAILED

2. WithdrawalService.requestAgencyWithdrawal(agencyId, amount, paymentAccountId):
   → Same flow using owner_type = AGENCY
   → No debt check needed for agencies

3. WebhookController.handlePaypalWebhook():
   → finalizeSuccessfulWithdrawal() or finalizeFailedWithdrawal()
```

Merged: Agency and user withdrawals use the same `WithdrawalRequest` table with `owner_type` discriminator.

## 9.4 Client Settlement

### Current
- `processClientSettlement()` in WalletService (private, 40 lines)
- `SettlementEngineImpl.runSettlement()` (separate class, 127 lines)
- `reconcileDailyBatch()` in WalletService (calls processClientSettlement in loop)

### Simplified
```
CODService.settleOrder(order):
  → Lock order
  → Calculate settlement: FinanceCalculationHelper.calculateClientSettlement()
  → Credit customer wallet
  → Debit platform wallet balance
  → Record COD_SETTLED transaction
  → Update order payment status

CODService.reconcileDailyBatch():
  → Find all CONFIRMED_BY_AGENCY orders
  → Call settleOrder() for each
```

**Remove** `SettlementEngineImpl` entirely.

---

# Phase 10 — Dead Code Removal

## 10.1 Services to Remove

| Service | File | Safe to Remove? | Impact |
|---------|------|----------------|--------|
| `PayoutService` + `PayoutServiceImpl` | `service/PayoutService.java` | **Yes** | Empty shell, never injects |
| `SettlementEngine` + `SettlementEngineImpl` | `service/finance/` | **Yes** | Logic duplicated in WalletService/CODService |
| `DriverFinancialEngine` + `DriverFinancialEngineImpl` | `service/finance/` | **Yes** | Never called from any code path |
| `FinancialQueryService` + `FinancialQueryServiceImpl` | `service/` | **Yes** | Partial mock; merge KPIs into WalletAdminService |
| `LedgerService` + `LedgerServiceImpl` | `service/billing/` | **Yes** | Billing sub-system removal |
| `AgencyBillingService` + `AgencyBillingServiceImpl` | `service/billing/` | **Conditional** | Remove duplicated features; keep invoicing only |

## 10.2 Controllers to Remove/Simplify

| Controller | Action | Impact |
|------------|--------|--------|
| `WalletController` | **SPLIT** into `DriverWalletController`, `CustomerWalletController`, etc. | No functional loss |
| `FinancialAdminController` | **REMOVE** mock endpoints: analytics, fraud, ledger, journal, reconciliation | Safe — all return empty data |
| `AgencyBillingController` | **REMOVE** or **SIMPLIFY** | Safe — keep invoicing endpoints only |
| `TestPayPalController` | **GUARD** with `@Profile("dev")` | Safe — dev-only |
| `AdminDashboardController` | **REVIEW** for overlap with FinancialAdminController | May need merge |

## 10.3 Entities to Remove

| Entity | Reason | Migration |
|--------|--------|-----------|
| `AgencyTransaction` | Duplicate of Transaction | Merge into Transaction (polymorphic owner) |
| `PlatformTransaction` | Duplicate of Transaction | Merge into Transaction |
| `AgencyPayoutRequest` | Duplicate of WithdrawalRequest | Merge into WithdrawalRequest |
| `PayoutLog` | Dead code | Remove entirely |
| `WalletTimeline` | Not needed | Remove entirely |
| `SettlementBatch` | Not needed | Remove entirely |
| `FinancialOutboxEvent` | Unused pattern | Remove entirely |
| `AgencyLedgerTransaction` | Duplicate | Merge into Transaction |
| `CODReconciliation` | Parallel COD tracking | Remove (COD in Orders + Transactions) |
| `DriverEarning` | Duplicate wallet data | Remove |
| `DriverFinancialRecord` | Duplicate wallet data | Remove |
| `PlatformCommissionRecord` | Duplicate | Remove |
| `ClientSettlementFormula` | Unused | Remove |

## 10.4 Repositories to Remove

| Repository | Reason |
|------------|--------|
| `AgencyTransactionRepository` | Entity removed |
| `PlatformTransactionRepository` | Entity removed |
| `AgencyPayoutRequestRepository` | Entity removed |
| `PayoutLogRepository` | Entity removed |
| `WalletTimelineRepository` | Entity removed |
| `SettlementBatchRepository` | Entity removed |
| `FinancialQueryRepository` | Merge logic into WalletAdminService |
| `billing/AgencyLedgerTransactionRepository` | Entity removed |
| `billing/CODReconciliationRepository` | Entity removed |
| `billing/DriverEarningRepository` | Entity removed |
| `billing/DriverFinancialRecordRepository` | Entity removed |
| `billing/PlatformCommissionRecordRepository` | Entity removed |

## 10.5 DTOs to Remove

See Phase 8 above — reduces from 33 to ~12 DTOs.

## 10.6 Events/Listeners to Remove

| File | Reason |
|------|--------|
| `AgencyCommissionEvent` | Simplify to direct calls |
| `DriverEarningEvent` | Simplify to direct calls |
| `PlatformRevenueEvent` | Duplicates FinancialMutationEvent |
| `FinancialLedgerListener` | Not needed after simplification |
| `FinancialNotificationListener` | Consider keep for WebSocket notifications |
| `FinancialWebSocketListener` | Consider keep |
| `FinancialAuditListener` | Consider keep for audit logging |

**Simplify to**: Keep `FinancialMutationEvent` as single unified event + remove specific events. Keep listeners only for cross-cutting concerns (audit, websocket). Remove `FinancialLedgerListener`.

## 10.7 Schedulers to Review

| Scheduler | Decision |
|-----------|----------|
| `ReconciliationScheduler` | **REMOVE** — SettlementEngine removed |
| `WithdrawalRecoveryScheduler` | **KEEP** — useful for PayPal failures |
| `DispatchScheduler` | **KEEP** — not financial |
| `TempFileCleanupTask` | **KEEP** — not financial |

---

# Phase 11 — Final Financial Architecture

## 11.1 Service Dependency Diagram

```
                    ┌─────────────────────────────────────┐
                    │        WalletAdminController          │
                    │     (/api/admin/finance/*)            │
                    └──────────────┬──────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
     ┌──────────────┐   ┌──────────────────┐   ┌──────────────┐
     │ WalletAdmin   │   │   CODService     │   │ Withdrawal   │
     │   Service    │   │                  │   │   Service    │
     └──────┬───────┘   └───────┬──────────┘   └──────┬───────┘
            │                   │                      │
            ▼                   ▼                      ▼
     ┌─────────────────────────────────────────────────────┐
     │               FinanceCalculationHelper               │
     │           (static utility, single source             │
     │            of truth for all calculations)            │
     └─────────────────────────────────────────────────────┘
            │                   │                      │
            ▼                   ▼                      ▼
     ┌──────────────┐   ┌──────────────────┐   ┌──────────────┐
     │ DriverWallet │   │  CustomerWallet  │   │ Platform     │
     │   Service    │   │    Service       │   │ WalletSvc    │
     └──────┬───────┘   └──────┬───────────┘   └──────┬───────┘
            │                  │                      │
            └──────────────────┼──────────────────────┘
                               ▼
                    ┌──────────────────────┐
                    │  PlatformFinance      │
                    │  SettingsService      │
                    │  (read-by all)        │
                    └──────────────────────┘
                    
                    ┌──────────────────────┐
                    │  PaymentProvider      │
                    │  (PayPalProviderImpl) │
                    └──────┬───────────────┘
                           │
                    ┌──────▼───────────────┐
                    │  ExchangeRateService  │
                    └──────────────────────┘
```

## 11.2 Database Diagram

```
┌─────────────────┐     ┌──────────────────────────────┐
│     users        │     │        wallets               │
├─────────────────┤     ├──────────────────────────────┤
│ id (PK)         │◄───►│ id (PK)                      │
│ ...             │     │ user_id (FK, unique)         │
└─────────────────┘     │ balance                      │
                        │ wallet_type                   │
┌─────────────────┐     │ is_frozen                    │
│    agencies      │     │ frozen_reason                │
├─────────────────┤     └──────────────────────────────┘
│ id (PK)         │◄───┐
│ ...             │    │  ┌──────────────────────────────┐
│ commission_rate │    │  │     agency_wallets           │
└─────────────────┘    ├─►├──────────────────────────────┤
                       │  │ id (PK)                      │
┌─────────────────┐    │  │ agency_id (FK, unique)       │
│   orders        │    │  │ balance                      │
├─────────────────┤    │  │ is_frozen                    │
│ id (PK)         │    │  │ frozen_reason                │
│ ...             │    │  │ version                      │
│ cod_amount      │    │  └──────────────────────────────┘
│ cod_collected   │    │
│ payment_status  │    │  ┌──────────────────────────────┐
│ driver_earnings │    │  │      platform_wallet          │
│ delivery_fee    │    │  ├──────────────────────────────┤
└─────────────────┘    │  │ id (PK)                      │
                       │  │ balance                      │
┌─────────────────┐    │  │ version                      │
│  transactions   │◄───┘  └──────────────────────────────┘
├─────────────────┤
│ id (PK)         │     ┌──────────────────────────────┐
│ owner_type      │     │    withdrawal_requests        │
│ owner_id        │     ├──────────────────────────────┤
│ amount          │     │ id (PK)                      │
│ type            │     │ owner_type                   │
│ status          │     │ owner_id                     │
│ description     │     │ amount                       │
│ order_id        │     │ payout_amount                │
│ date            │     │ payout_currency              │
└─────────────────┘     │ payment_account_id           │
                        │ receiver_email_snapshot      │
┌─────────────────┐     │ provider                     │
│ payment_accounts│     │ status                       │
├─────────────────┤     │ rejection_reason             │
│ id (PK)         │     │ paypal_item_id               │
│ user_id (FK)    │     │ created_at                   │
│ provider        │     │ completed_at                 │
│ account_email   │     └──────────────────────────────┘
│ is_default      │
└─────────────────┘     ┌──────────────────────────────┐
                        │ financial_audit_log           │
┌─────────────────┐     ├──────────────────────────────┤
│ platform_finance│     │ id (PK)                      │
│ _settings       │     │ admin_id                     │
├─────────────────┤     │ action                       │
│ id (PK)         │     │ target_id                    │
│ platform_fee    │     │ target_type                  │
│  _rate          │     │ previous_value               │
│ default_agency  │     │ new_value                    │
│  _commission    │     │ reason                       │
│  _rate          │     │ created_at                   │
│ client_settle   │     └──────────────────────────────┘
│  _ment_formula  │
│ auto_reconcile  │     ┌──────────────────────────────┐
│ debt_alert      │     │     pricing_config            │
│  _threshold     │     ├──────────────────────────────┤
└─────────────────┘     │ ...                          │
                        └──────────────────────────────┘
```

## 11.3 Clean Package Structure

```
com.deliveryplatform/
├── finance/
│   ├── service/
│   │   ├── DriverWalletService.java
│   │   ├── impl/
│   │   │   └── DriverWalletServiceImpl.java
│   │   ├── CustomerWalletService.java
│   │   ├── impl/
│   │   │   └── CustomerWalletServiceImpl.java
│   │   ├── CODService.java
│   │   ├── impl/
│   │   │   └── CODServiceImpl.java
│   │   ├── WithdrawalService.java
│   │   ├── impl/
│   │   │   └── WithdrawalServiceImpl.java
│   │   ├── WalletAdminService.java
│   │   ├── impl/
│   │   │   └── WalletAdminServiceImpl.java
│   │   ├── PlatformFinanceSettingsService.java
│   │   ├── impl/
│   │   │   └── PlatformFinanceSettingsServiceImpl.java
│   │   ├── PaymentProvider.java
│   │   ├── impl/
│   │   │   ├── PayPalProviderImpl.java
│   │   │   └── FixedExchangeRateServiceImpl.java
│   │   └── FinanceCalculationHelper.java
│   │
│   ├── controller/
│   │   ├── DriverWalletController.java
│   │   ├── CustomerWalletController.java
│   │   ├── CODController.java
│   │   ├── WithdrawalController.java
│   │   ├── WalletAdminController.java
│   │   ├── PaymentAccountController.java
│   │   └── WebhookController.java
│   │
│   ├── domain/
│   │   ├── entity/
│   │   │   ├── Wallet.java
│   │   │   ├── AgencyWallet.java
│   │   │   ├── PlatformWallet.java
│   │   │   ├── Transaction.java
│   │   │   ├── WithdrawalRequest.java
│   │   │   ├── PaymentAccount.java
│   │   │   ├── PlatformFinanceSettings.java
│   │   │   ├── FinancialAuditLog.java
│   │   │   └── enums/
│   │   │       ├── OwnerType.java
│   │   │       ├── TransactionType.java
│   │   │       ├── TransactionStatus.java
│   │   │       ├── WalletType.java
│   │   │       └── PaymentProviderEnum.java
│   │   └── dto/
│   │       ├── request/
│   │       │   ├── WithdrawalRequestDTO.java
│   │       │   ├── PayoutRequestDTO.java
│   │       │   ├── CODRemittanceRequestDTO.java
│   │       │   ├── FinanceSettingsUpdateRequest.java
│   │       │   ├── WalletAdjustmentRequest.java
│   │       │   └── CreatePaymentAccountRequest.java
│   │       └── response/
│   │           ├── WalletResponse.java
│   │           ├── TransactionResponse.java
│   │           ├── WithdrawalResponse.java
│   │           ├── PaymentAccountResponse.java
│   │           ├── FinanceSettingsDTO.java
│   │           ├── FinancialSummaryDTO.java
│   │           ├── CustomerWalletResponse.java
│   │           └── DailyEarningsResponse.java
│   │
│   ├── repository/
│   │   ├── WalletRepository.java
│   │   ├── AgencyWalletRepository.java
│   │   ├── PlatformWalletRepository.java
│   │   ├── TransactionRepository.java
│   │   ├── WithdrawalRequestRepository.java
│   │   ├── PaymentAccountRepository.java
│   │   ├── PlatformFinanceSettingsRepository.java
│   │   └── FinancialAuditLogRepository.java
│   │
│   └── scheduler/
│       └── WithdrawalRecoveryScheduler.java
│
├── billing/                         (ONLY if invoicing is real)
│   ├── service/
│   │   └── InvoicingService.java
│   ├── controller/
│   │   └── InvoiceController.java
│   ├── domain/entity/
│   │   ├── AgencyCustomerInvoice.java
│   │   └── AgencyCustomerPayment.java
│   └── repository/
│       ├── AgencyCustomerInvoiceRepository.java
│       └── AgencyCustomerPaymentRepository.java
│
└── pricing/                          (unchanged)
    ├── PricingService.java
    ├── PricingController.java
    └── PricingConfig.java
```

---

# Phase 12 — Implementation Roadmap

## Step 1: Create FinanceCalculationHelper

**Goal**: Centralize all financial calculations into one reusable utility class.

**Files to create**:
- `service/finance/FinanceCalculationHelper.java`
- `service/finance/FeeSplitResult.java` (record)

**Files to modify**: None initially

**Files to delete**: None

**Expected impact**: Zero — new utility, not yet consumed

**Regression risk**: None

**Testing required**: Unit test `FinanceCalculationHelperTest.java` with all edge cases

**Rollback**: Delete both files

---

## Step 2: Refactor WalletService → DriverWalletService + CustomerWalletService

**Goal**: Extract driver wallet operations from WalletService god class.

**Files to create**:
- `finance/service/DriverWalletService.java` (interface)
- `finance/service/impl/DriverWalletServiceImpl.java`
- `finance/service/CustomerWalletService.java` (interface)
- `finance/service/impl/CustomerWalletServiceImpl.java`
- `finance/controller/DriverWalletController.java`
- `finance/controller/CustomerWalletController.java`

**Files to modify**:
- `service/WalletService.java` — strip down to delegation or remove
- `service/impl/WalletServiceImpl.java` — strip to COD + withdrawal + agency logic
- `WalletController.java` — remove driver/customer endpoints

**Files to delete**: None yet

**Expected impact**: New services handle driver/customer wallet features. Old class shrinks.

**Regression risk**: Medium — all existing callers must be updated to use new services

**Testing required**: Integration tests for each new service; verify all endpoints respond same

**Rollback**: Restore WalletService, delete new files

---

## Step 3: Create CODService

**Goal**: Extract all COD logic into dedicated service.

**Files to create**:
- `finance/service/CODService.java`
- `finance/service/impl/CODServiceImpl.java`
- `finance/controller/CODController.java`

**Files to modify**:
- `WalletServiceImpl.java` — remove COD methods
- `WalletController.java` — remove COD endpoints
- `FinancialAdminController.java` — remove settle, reconcile endpoints

**Files to delete**: None

**Expected impact**: COD logic moves to dedicated service

**Regression risk**: Medium — COD workflow is complex

**Testing required**: Full COD flow integration test (declare → confirm → settle)

**Rollback**: Revert WalletServiceImpl, restore COD methods

---

## Step 4: Create WithdrawalService

**Goal**: Extract all withdrawal/payout logic into dedicated service with unified driver/customer/agency support.

**Files to create**:
- `finance/service/WithdrawalService.java`
- `finance/service/impl/WithdrawalServiceImpl.java`
- `finance/controller/WithdrawalController.java`

**Files to modify**:
- `WalletServiceImpl.java` — remove withdrawal methods
- `WalletController.java` — remove withdrawal/payout endpoints
- `FinancialAdminController.java` — update approval/rejection delegation

**Files to delete**: `service/PayoutService.java`, `service/impl/PayoutServiceImpl.java`

**Expected impact**: Withdrawal logic consolidated in one place

**Regression risk**: High — withdrawal involves PayPal API calls and balance mutations

**Testing required**: Full withdrawal flow test (create → PayPal mock → complete/fail), agency payout test

**Rollback**: Restore WalletServiceImpl withdrawal methods, remove new files

---

## Step 5: Create WalletAdminService

**Goal**: Consolidate all admin financial operations.

**Files to create**:
- `finance/service/WalletAdminService.java`
- `finance/service/impl/WalletAdminServiceImpl.java`
- `finance/controller/WalletAdminController.java`

**Files to modify**:
- `FinancialService.java` + `FinancialServiceImpl.java` — remove or redirect
- `FinancialAdminController.java` — redirect to WalletAdminService

**Files to delete**:
- `service/FinancialService.java`
- `service/impl/FinancialServiceImpl.java`
- `service/FinancialQueryService.java`
- `service/impl/FinancialQueryServiceImpl.java`

**Expected impact**: Admin financial operations in one clean service

**Regression risk**: Medium — admin endpoints must maintain backward compatibility with frontend

**Testing required**: All admin endpoints respond correctly

**Rollback**: Restore old services, remove new files

---

## Step 6: Simplify PlatformWalletService

**Goal**: Reduce to single `balance` field; make other fields calculated.

**Files to modify**:
- `domain/entity/PlatformWallet.java` — remove totalRevenue, platformProfit, totalDriverPayout, totalAgencyPayout
- `service/impl/PlatformWalletServiceImpl.java` — remove recordDriverPayout, recordAgencyPayout (merge into WithdrawalService)
- Run migration: `ALTER TABLE platform_wallet DROP COLUMN ...`

**Files to create**: None

**Files to delete**: None

**Expected impact**: Platform wallet no longer stores derived data

**Regression risk**: Low — admin dashboard queries change from field read to SUM query

**Testing required**: Verify admin dashboard KPIs unchanged

**Rollback**: Revert entity changes, re-add columns

---

## Step 7: Simplify AgencyWallet Entity

**Goal**: Remove 12 of 14 monetary fields.

**Files to modify**:
- `domain/entity/AgencyWallet.java` — remove all derived fields
- `WalletServiceImpl.java` — update references
- `AgencyBillingServiceImpl.java` — update references
- Run migration: `ALTER TABLE agency_wallets DROP COLUMN ...`

**Files to create**: None

**Files to delete**: None

**Expected impact**: Agency wallet stored data reduced drastically

**Regression risk**: Medium — many callers reference removed fields

**Testing required**: Verify agency wallet read operations return correct values (calculated)

**Rollback**: Revert entity, re-add columns

---

## Step 8: Merge Transaction Tables

**Goal**: Unify `Transaction`, `AgencyTransaction`, `PlatformTransaction` into single `transactions` table.

**Files to modify**:
- `domain/entity/Transaction.java` — add ownerType, ownerId
- `domain/entity/enums/OwnerType.java` — new enum (DRIVER, CUSTOMER, AGENCY, PLATFORM)
- All repositories — update queries
- All services — update references from wallet_id to owner pattern
- `domain/entity/AgencyTransaction.java` — mark deprecated or remove
- `domain/entity/PlatformTransaction.java` — mark deprecated or remove
- Run migration: Add columns to transactions, migrate data, drop old tables

**Files to create**:
- `domain/entity/enums/OwnerType.java`

**Files to delete** (after migration):
- `domain/entity/AgencyTransaction.java`
- `repository/AgencyTransactionRepository.java`
- `domain/entity/PlatformTransaction.java`
- `repository/PlatformTransactionRepository.java`

**Expected impact**: Single transaction table for all entity types

**Regression risk**: High — core data structure change affecting all financial operations

**Testing required**: Every financial workflow end-to-end after migration

**Rollback**: Complex — must restore old tables and data. Prefer adding new columns first, dual-write, then migrate.

---

## Step 9: Merge WithdrawalRequest + AgencyPayoutRequest

**Goal**: Unify all withdrawal requests into single table.

**Files to modify**:
- `domain/entity/WithdrawalRequest.java` — add `ownerType`
- All services updating references
- Run migration: Add columns, migrate data, drop agency_payout_requests table

**Files to delete**:
- `domain/entity/AgencyPayoutRequest.java`
- `repository/AgencyPayoutRequestRepository.java`

**Expected impact**: Single withdrawal request table

**Regression risk**: Medium

**Testing required**: Test both driver and agency withdrawal flows

**Rollback**: Complex — data migration required

---

## Step 10: Remove Billing Subsystem (except invoicing)

**Goal**: Eliminate parallel COD tracking, driver earnings, platform commission records, ledger transactions.

**Files to delete**:
- `repository/billing/AgencyLedgerTransactionRepository.java`
- `repository/billing/CODReconciliationRepository.java`
- `repository/billing/DriverEarningRepository.java`
- `repository/billing/DriverFinancialRecordRepository.java`
- `repository/billing/PlatformCommissionRecordRepository.java`
- `domain/entity/billing/AgencyLedgerTransaction.java`
- `domain/entity/billing/CODReconciliation.java`
- `domain/entity/billing/DriverEarning.java`
- `domain/entity/billing/DriverFinancialRecord.java`
- `domain/entity/billing/PlatformCommissionRecord.java`
- `service/billing/AgencyBillingService.java` + impl
- `service/billing/LedgerService.java` + impl
- `controller/billing/AgencyBillingController.java`
- Run migration: Drop tables

**Files to modify**: None

**Files to create**: None

**Expected impact**: ~15 files removed, no functional loss (all data exists in main transaction tables)

**Regression risk**: Low — billing subsystem is separate and duplicated

**Testing required**: Verify no imports/exceptions reference removed classes

**Rollback**: Restore deleted files, re-run migrations

---

## Step 11: Remove Dead Code

**Goal**: Remove all unused services, entities, repositories, events, listeners, DTOs.

**Files to delete** (already identified in Phase 10):
- All files from Steps 8-10 that weren't already deleted
- `domain/entity/WalletTimeline.java`
- `domain/entity/SettlementBatch.java`
- `domain/entity/PayoutLog.java`
- `domain/entity/FinancialOutboxEvent.java`
- `domain/entity/FinancialOutboxStatus.java`
- `domain/entity/ClientSettlementFormula.java`
- `repository/...` (corresponding repositories)
- `service/finance/DriverFinancialEngine.java` + impl
- `service/finance/SettlementEngine.java` + impl
- `event/finance/AgencyCommissionEvent.java`
- `event/finance/DriverEarningEvent.java`
- `event/finance/PlatformRevenueEvent.java`
- `listener/finance/FinancialLedgerListener.java`
- `dto/response/WalletBalanceResponse.java`
- `dto/response/WalletCreditResult.java` (move to test)
- `dto/response/TransactionDTO.java`
- `dto/response/WithdrawalDTO.java`
- `dto/response/FinanceResponse.java`
- `dto/response/FinanceSummaryResponse.java`
- `dto/response/PaymentTimelineResponse.java`
- `dto/response/WalletOverviewDTO.java`
- `dto/response/finance/AnalyticsDTO.java`
- `dto/response/finance/AuditLogDTO.java`
- `dto/response/finance/NotificationDTO.java`
- `dto/response/finance/ReportDTO.java`
- `dto/response/finance/SettingsDTO.java`
- `dto/request/TopUpRequest.java`
- `dto/billing/CODReconciliationRequest.java`
- `dto/billing/DriverEarningRequest.java`
- `dto/billing/InvoiceRequest.java`
- `dto/billing/PaymentRequest.java`
- `dto/response/billing/BillingSummaryResponse.java`

**Files to guard**:
- `controller/TestPayPalController.java` — add `@Profile("dev")`
- `WalletServiceImpl.creditWalletForTesting()` — add `@Profile("dev")` guard

**Expected impact**: ~50 files removed. Massive cleanup.

**Regression risk**: Medium — verify no import anywhere references removed classes

**Testing required**: Compile project, run all tests, verify frontend still works

**Rollback**: Restore from git

---

## Step 12: Simplify APIs

**Goal**: Restructure API surface as defined in Phase 7.

**Files to modify**:
- All controllers — restructure and remove mock endpoints
- Frontend `financialService.ts` — update API calls
- Frontend endpoints config — update paths

**Files to create**: None

**Files to delete**: None (controllers are modified, not removed)

**Expected impact**: Cleaner, more logical API surface

**Regression risk**: Medium — frontend must be updated to match new paths

**Testing required**: Full frontend-backend integration test

**Rollback**: Revert controller changes, restore old endpoints

---

## Step 13: Update Migrations

**Goal**: Create final schema migration that applies all table changes.

**Files to create**:
- `V152__financial_system_simplification.sql`

**Files to delete**: None

**Expected impact**: Single migration applies all schema changes

**Regression risk**: High — affects all existing data

**Testing required**: Run migration against test database, verify data integrity

**Rollback**: Create V153 that reverses V152

---

## Step 14: Frontend Updates

**Goal**: Update frontend to match new simplified API.

**Files to modify**:
- `frontend/src/features/finance/api/financialService.ts` — update all endpoints
- `frontend/src/features/finance/components/` — update component props for simplified DTOs
- All frontend files referencing removed endpoints

**Files to create**: None

**Files to delete**: None

**Expected impact**: Frontend matches new backend API

**Regression risk**: Medium — UI changes must be visually verified

**Testing required**: Playwright/E2E tests for all finance features

**Rollback**: Revert frontend changes

---

## Step 15: Remove WalletService God Class

**Goal**: Final step — remove the empty shell of WalletService/WalletServiceImpl.

**Files to delete**:
- `service/WalletService.java`
- `service/impl/WalletServiceImpl.java`
- `service/WalletController.java`

**Expected impact**: All functionality distributed to focused services

**Regression risk**: Low — all functionality already moved by previous steps

**Testing required**: Full regression test

**Rollback**: Restore from git

---

## Summary: Implementation Order

| Step | Name | Risk | Dependencies | Effort |
|------|------|------|-------------|--------|
| 1 | Create FinanceCalculationHelper | None | None | Small |
| 2 | Extract DriverWalletService + CustomerWalletService | Medium | Step 1 | Large |
| 3 | Create CODService | Medium | Step 2 | Large |
| 4 | Create WithdrawalService | High | Step 2 | Large |
| 5 | Create WalletAdminService | Medium | Steps 2-4 | Medium |
| 6 | Simplify PlatformWallet | Low | Step 5 | Small |
| 7 | Simplify AgencyWallet | Medium | Step 5 | Small |
| 8 | Merge Transaction tables | High | Steps 1-7 | Very Large |
| 9 | Merge WithdrawalRequest | Medium | Steps 1-7 | Medium |
| 10 | Remove billing subsystem | Low | Steps 1-7 | Medium |
| 11 | Remove dead code | Medium | Steps 8-10 | Medium |
| 12 | Simplify APIs | Medium | Steps 1-11 | Large |
| 13 | Update migrations | High | Steps 6-10 | Small |
| 14 | Frontend updates | Medium | Step 12 | Large |
| 15 | Remove WalletService god class | Low | Steps 2-4 | Small |

**Total estimated effort**: 3-4 weeks for a single developer working full-time.

**Safest order**: Start with steps that add new code (Steps 1-5), then simplify existing code (Steps 6-11), then restructure APIs (Steps 12-14), then delete the god class (Step 15).
