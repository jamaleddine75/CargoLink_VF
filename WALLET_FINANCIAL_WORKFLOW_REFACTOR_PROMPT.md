# CargoLink Wallets + Financial Workflow Refactor Prompt

Use this prompt as a single implementation brief for a coding agent working on CargoLink. The goal is to redesign the wallet system and the full financial workflow across backend and frontend, with a strong Super Admin financial control panel, clearer COD logic, and much better UX for all roles.

---

## 1. Mission

Refactor the CargoLink financial system end-to-end:

- backend financial logic
- wallet domain model
- COD remittance workflow
- agency settlement workflow
- platform fee governance
- unified admin visibility
- frontend UX for `ADMIN`, `AGENCY`, `DRIVER`, and `CLIENT`

This is not a cosmetic change only. It is a business-logic correction plus a product UX redesign.

The final result must make money movement understandable, auditable, configurable, and operationally simple.

---

## 2. Business Rule To Enforce

Target operational model:

1. Customer final recipient pays cash on delivery when order is COD.
2. Driver collects the money in cash during delivery.
3. Driver keeps only the driver earning share in hand.
4. Driver remits the rest to the agency.
5. Agency keeps its commission share.
6. Agency transfers platform fees to the Super Admin/platform wallet.
7. Agency settles the merchant/client amount.
8. Super Admin must be able to see, configure, freeze, adjust, reconcile, and audit everything from one panel.

Desired split:

```text
deliveryFee
  -> platformShare = deliveryFee * platformFeeRate
  -> remainingFee = deliveryFee - platformShare
       -> agencyShare = remainingFee * agencyCommissionRate
       -> driverShare = remainingFee - agencyShare
```

Main rule:

- Driver does **not** remit their own share.
- Driver remits only:
  - `codAmount`
  - `platformShare`
  - `agencyShare`

Equivalent formula:

```text
amountToRemit = codAmount + deliveryFee - driverShare
```

---

## 3. Repo Reality Check From Quick Scan

The implementation must start from the current codebase, not from assumptions.

### Backend areas already present

- `backend/src/main/java/com/deliveryplatform/service/impl/WalletServiceImpl.java`
- `backend/src/main/java/com/deliveryplatform/controller/WalletController.java`
- `backend/src/main/java/com/deliveryplatform/controller/FinancialAdminController.java`
- `backend/src/main/java/com/deliveryplatform/controller/AgencyController.java`
- `backend/src/main/java/com/deliveryplatform/service/impl/FinancialServiceImpl.java`
- `backend/src/main/java/com/deliveryplatform/domain/entity/Wallet.java`
- `backend/src/main/java/com/deliveryplatform/domain/entity/AgencyWallet.java`
- `backend/src/main/java/com/deliveryplatform/domain/entity/PlatformWallet.java`
- `backend/src/main/java/com/deliveryplatform/domain/entity/Transaction.java`
- `backend/src/main/java/com/deliveryplatform/domain/entity/TransactionType.java`
- `backend/src/main/java/com/deliveryplatform/domain/entity/FinancialAuditLog.java`
- `backend/src/main/java/com/deliveryplatform/domain/entity/billing/*`

### Frontend areas already present

- `frontend/src/pages/admin/GlobalWallets.tsx`
- `frontend/src/pages/admin/FinanceDashboard.tsx`
- `frontend/src/features/finance/components/wallets/UnifiedWalletTable.tsx`
- `frontend/src/features/finance/api/financialService.ts`
- `frontend/src/pages/driver/WalletPage.tsx`
- `frontend/src/pages/client/CustomerWallet.tsx`
- `frontend/src/pages/agency/wallet/components/WalletComponents.tsx`
- `frontend/src/pages/agency/wallet/index.tsx`

### Important gaps confirmed in current code

1. Hardcoded fee values still exist.
   - `WalletServiceImpl.java` contains hardcoded `0.05` and `0.15`
   - `AgencyBillingServiceImpl.java` contains hardcoded `0.05`
   - `Agency.java` and `AgencyWallet.java` still default commission values in entity fields
   - `DatabaseInitializer.java` seeds `0.15`
2. Driver remittance logic still appears based on full collected amount in multiple places.
3. Admin wallet views are split and inconsistent.
   - `GlobalWallets.tsx` focuses mainly on agencies/payouts
   - `FinanceDashboard.tsx` is more operational but still fragmented
   - `UnifiedWalletTable.tsx` exists but is not yet the single finance control surface
4. Agency wallet component is minimal and not sufficient for real operations.
5. There is no single configurable finance settings entity for platform fee governance.
6. Order-level payment timeline is not clearly exposed to frontend.

---

## 4. Architecture Goal

Implement a finance architecture with 4 layers:

1. `Finance Settings Layer`
   - platform-wide fee rules
   - default agency commission
   - settlement formula options
2. `Money Movement Layer`
   - order delivery
   - driver cash collection
   - agency remittance confirmation
   - client settlement
   - platform share transfer
3. `Ledger + Audit Layer`
   - every action traceable
   - every adjustment justified
   - exportable financial history
4. `Role UX Layer`
   - client sees expected payout and timing
   - driver sees what is earned vs what must be remitted
   - agency sees pending cash operations and commissions
   - admin sees everything in one unified place

---

## 5. Backend Refactor Requirements

### 5.1 Add configurable finance settings

Create a new singleton-style entity for platform finance settings, for example:

```java
PlatformFinanceSettings
```

Suggested fields:

```java
UUID id;
BigDecimal platformFeeRate;
BigDecimal defaultAgencyCommissionRate;
ClientSettlementFormula clientSettlementFormula;
Boolean autoRunDailyReconciliation;
BigDecimal debtAlertThreshold;
LocalDateTime updatedAt;
UUID updatedBy;
```

Also add:

- repository
- service
- controller
- DTOs
- validation
- audit logging for every settings update

If the project currently uses `ADMIN` instead of `SUPER_ADMIN`, keep compatibility by protecting the endpoints with the highest financial admin role already used in the repo, but structure the code so it can support a dedicated super-admin permission later.

### 5.2 Remove hardcoded percentages everywhere

Replace all business-logic hardcoded financial ratios:

- `0.05`
- `0.15`

These must no longer drive runtime calculations inside services.

Do not only patch `WalletServiceImpl`. Also inspect and refactor:

- `AgencyBillingServiceImpl`
- entity defaults where they act as business rules
- initializers and seed logic
- any mapper/service/helper doing fee derivation

Rule:

- settings changes apply to future operations only
- do not retroactively recompute historical transactions

### 5.3 Correct driver cash remittance logic

Refactor `handleOrderDelivery(...)` and all related COD/remittance flows.

Required behavior:

- when COD is collected, system calculates:
  - `platformShare`
  - `agencyShare`
  - `driverShare`
- driver earned balance increases by `driverShare`
- driver cash debt/remittance obligation excludes `driverShare`
- amount expected from driver becomes:

```java
codAmount + deliveryFee - driverShare
```

Add dedicated transaction/event types if needed, such as:

- `CASH_COLLECTED_BY_DRIVER`
- `DRIVER_SHARE_KEPT_IN_HAND`
- `DRIVER_REMITTANCE_DECLARED`
- `DRIVER_REMITTANCE_CONFIRMED`
- `AGENCY_PLATFORM_TRANSFER`
- `CLIENT_SETTLEMENT_COMPLETED`

Do not hide this in generic transaction names. The ledger must be understandable.

### 5.4 Introduce order-level financial state model

Every delivered COD order should expose a clear financial lifecycle.

Add or formalize states such as:

- `NOT_APPLICABLE`
- `AWAITING_DRIVER_COLLECTION`
- `COLLECTED_BY_DRIVER`
- `REMITTANCE_DECLARED`
- `REMITTANCE_CONFIRMED_BY_AGENCY`
- `CLIENT_SETTLED`
- `PLATFORM_SHARE_TRANSFERRED`
- `FULLY_RECONCILED`
- `DISPUTED`

Expose a `paymentTimeline` object in order responses with timestamps:

```json
{
  "codCollectedAt": "...",
  "driverShareRecognizedAt": "...",
  "remittanceDeclaredAt": "...",
  "remittanceConfirmedAt": "...",
  "clientSettledAt": "...",
  "platformShareTransferredAt": "...",
  "reconciledAt": "..."
}
```

### 5.5 Add or unify finance admin endpoints

Create or consolidate finance admin APIs around one coherent surface.

Required capabilities:

- finance settings read/update
- unified wallets overview
- wallet freeze/unfreeze
- manual wallet adjustment with mandatory reason
- full ledger query
- ledger export CSV
- reconciliation execution
- reconciliation history
- agency commission override management
- pending remittance visibility

Suggested endpoints:

```text
GET    /api/admin/finance/settings
PUT    /api/admin/finance/settings

GET    /api/admin/finance/wallets/overview
POST   /api/admin/finance/wallets/{walletId}/freeze
POST   /api/admin/finance/wallets/{walletId}/unfreeze
POST   /api/admin/finance/wallets/{walletId}/adjust

GET    /api/admin/finance/ledger
GET    /api/admin/finance/ledger/export.csv

POST   /api/admin/finance/reconciliation/run
GET    /api/admin/finance/reconciliation/history

PUT    /api/admin/finance/agencies/{agencyId}/commission-rate
GET    /api/admin/finance/remittances
```

If equivalent endpoints already exist, refactor and normalize them instead of duplicating.

### 5.6 Make manual adjustments safe

Manual adjustment rules:

- reason is mandatory
- actor is mandatory
- target wallet is mandatory
- adjustment type must be explicit:
  - `CREDIT`
  - `DEBIT`
- amount must be positive in payload
- backend computes signed effect
- all adjustments create:
  - transaction record
  - audit record
  - optional notification

### 5.7 Reconciliation redesign

Current daily reconciliation must become operationally visible and reliable.

Implement:

- manual run endpoint
- dry-run option if feasible
- reconciliation history table/entity
- per-order result details
- processed/succeeded/failed counts
- failure reasons

If automatic batch already exists through scheduler, expose its outcome in the admin panel.

### 5.8 Ledger consistency

Ensure all wallet balance changes remain explainable by ledger entries.

The implementation must preserve or improve this invariant:

```text
wallet balance = sum of effective ledger entries
```

No silent balance mutation without transaction trace.

---

## 6. Frontend Refactor Requirements

### 6.1 Admin financial control panel

Build one clear financial panel for platform-level control.

Use current assets as the base:

- `GlobalWallets.tsx`
- `FinanceDashboard.tsx`
- `UnifiedWalletTable.tsx`

Do not keep them fragmented. Consolidate into a stronger experience.

Target sections:

1. Overview
   - total wallet exposure
   - pending remittances
   - pending client settlements
   - platform profit
   - frozen wallets
   - agencies with debt alerts
2. Unified Wallets
   - all roles in one table
   - filter by `CLIENT`, `DRIVER`, `AGENCY`, `PLATFORM`
   - search by user, agency, phone, wallet id
   - quick actions: freeze, unfreeze, adjust, inspect ledger
3. Finance Settings
   - platform fee rate
   - default agency commission rate
   - agency-specific overrides
   - client settlement formula selector
   - simulation preview
4. Reconciliation
   - run manually
   - see last batches
   - inspect failures
5. Global Ledger
   - filters by date, role, transaction type, status
   - CSV export
6. Payouts and Remittances
   - pending agency payouts
   - pending driver-related remittances
   - approval/rejection flow

UX expectations:

- crisp information hierarchy
- role filters as first-class controls
- visible financial statuses
- no hidden destructive actions
- confirmation dialogs for freeze/adjust/reconcile

### 6.2 Client wallet redesign

Refactor `CustomerWallet.tsx` away from generic wallet-only language.

The client/merchant cares about:

- which delivered orders are settled
- how much money is still pending
- exact payout date/time
- which order is blocked and why

Target UI:

- top summary:
  - available balance
  - pending settlement amount
  - number of unsettled delivered orders
- delivered orders financial table
  - order ref
  - COD amount
  - delivery fee
  - net merchant amount
  - current finance status
  - expected or actual settlement date
- payment timeline per order
- filters:
  - all
  - pending
  - settled
  - disputed

Microcopy should be simple and operational.
The user should immediately understand: "when will my money arrive?"

### 6.3 Driver wallet redesign

Refactor `WalletPage.tsx` to clearly separate:

- money earned by driver
- cash physically held by driver
- amount still owed to agency/system

Target blocks:

1. `My Earnings`
   - withdrawable balance
   - today / week / month earnings
2. `Cash To Remit`
   - total pending remittance
   - number of orders included
   - warning state if overdue
3. `Pending COD Orders`
   - selectable list
   - order reference
   - COD amount
   - fee split preview
   - exact amount included in remittance
4. `Declare Agency Remittance`
   - confirmation modal
   - selected orders
   - total to remit
   - explicit note that driver share is excluded
5. `Remittance History`
   - declared
   - confirmed
   - rejected

Important:

- current UI text says driver keeps gains and remits COD/fees, which is directionally correct
- now make the math and the statuses exact and visible

### 6.4 Agency wallet redesign

The current agency wallet component is too thin. Replace it with a real operations dashboard.

Target sections:

1. Financial KPIs
   - available commission
   - pending commission
   - cash received from drivers
   - amount owed to merchants/clients
   - amount owed to platform
2. Driver Remittances Queue
   - pending declarations
   - confirm receipt
   - reject with reason
3. Driver Debt Monitor
   - per driver cash in hand
   - debt to remit
   - overdue flags
4. Merchant Settlements
   - unsettled delivered orders
   - settle now / batch settle
   - settlement history
5. Platform Transfers
   - amount due to platform
   - transfer status
   - history
6. Agency Payout Requests
   - request payout
   - history

### 6.5 Reuse existing design system

Prefer existing UI primitives and patterns already present in the repo:

- `Card`
- `Badge`
- `Button`
- `Table`
- `Dialog`
- `PageHeader`
- `StatCard`

Keep styling aligned with the repo's current visual language. Improve hierarchy and clarity, not randomize the design system.

---

## 7. Data Contracts To Add Or Improve

Add or improve DTOs for:

- finance settings
- wallet overview by role
- wallet adjustment request
- reconciliation run result
- reconciliation history row
- ledger row
- agency commission override
- order payment timeline
- driver remittance summary
- client settlement summary

Example wallet overview shape:

```ts
type UnifiedWalletRow = {
  walletId: string;
  ownerId: string;
  ownerName: string;
  ownerRole: 'CLIENT' | 'DRIVER' | 'AGENCY' | 'PLATFORM';
  agencyName?: string;
  balance: number;
  cashInHand?: number;
  debtToSystem?: number;
  pendingBalance?: number;
  isFrozen: boolean;
  lastTransactionAt?: string;
  riskFlag?: 'NONE' | 'DEBT_HIGH' | 'FROZEN' | 'RECONCILIATION_ERROR';
};
```

---

## 8. Migration And Compatibility Rules

Because this repo already contains finance data and wallet flows, the refactor must be safe.

Requirements:

- add DB migrations for new tables/columns/enums
- preserve historical data
- do not break existing orders
- provide default settings row migration
- backfill timestamps/statuses where feasible
- keep old APIs working temporarily if frontend still depends on them
- add adapters where necessary before final cleanup

If a breaking contract is unavoidable, update frontend and backend in the same implementation.

---

## 9. Testing Requirements

Add or update tests for:

- fee split calculation
- agency override rate precedence
- default rate fallback
- driver remittance amount excludes `driverShare`
- COD order with zero delivery fee
- non-COD order
- COD order with client wallet prepaid fee if supported
- remittance declaration
- agency confirmation
- client settlement
- platform transfer
- finance settings update audit trail
- freeze/unfreeze wallet
- manual adjustment reason enforcement
- reconciliation batch result reporting

Also add frontend tests where realistic for:

- wallet table role filtering
- finance settings form
- driver remittance summary rendering
- client payment status rendering

---

## 10. Acceptance Criteria

- No runtime finance logic depends on hardcoded `0.05` or `0.15`.
- Finance settings are editable from the admin financial panel.
- Driver remittance excludes the driver earning share.
- All money movement is visible in a ledger and audit trail.
- Admin can see all wallet types in one place.
- Admin can freeze/unfreeze and manually adjust wallets with mandatory reason.
- Agency can confirm driver remittances and track obligations.
- Client can clearly see when money is expected and when it was settled.
- Delivered order responses expose a usable payment timeline.
- Reconciliation can be run manually and inspected afterward.
- UX is materially simpler for real operations, not just prettier.

---

## 11. Implementation Style Expectations

- keep code modular
- prefer explicit transaction names over vague ones
- reuse existing services/controllers where possible
- avoid duplicating finance entry points
- favor auditable business flows over shortcut mutations
- document assumptions in code comments only where the rule is non-obvious

---

## 12. Deliverables

Produce:

1. backend implementation
2. DB migrations
3. updated DTOs and APIs
4. frontend finance/admin/client/driver/agency UI updates
5. tests
6. short implementation notes listing:
   - files changed
   - migrations added
   - new endpoints
   - assumptions made

---

## 13. Extra Product Guidance

When in doubt, optimize for operational clarity:

- the driver should know exactly what cash must be remitted
- the agency should know exactly what it owes and keeps
- the client should know exactly when money is coming
- the admin should be able to inspect and change the rules without touching code

This finance module should feel like a real cash logistics control center, not a generic wallet page.
