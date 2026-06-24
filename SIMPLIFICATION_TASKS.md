# Simplification Execution Plan
### CargoLink — Engineering Task-by-Task Refactor Guide
**Based on:** SIMPLIFICATION_REPORT.md  
**Stack:** React 18 + TypeScript (Frontend) · Java 21 + Spring Boot 3 (Backend)  
**Prepared for:** Safe, incremental execution by a solo developer or small team

---

## Recommended Execution Order

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 (optional)

Each phase ends with a build + lint + commit before starting the next.
Never mix phases in a single commit.
```

## Safe Git Commit Strategy

```bash
# Before starting ANYTHING:
git checkout -b simplification/phase-1
# After each phase:
git add -A
git commit -m "simplify(phase-X): <description>"
git push origin simplification/phase-1
# Merge to main only after full phase validation
```

---

## ─────────────────────────────────────────────────
## PHASE 1 — Zero Risk Cleanup
## ─────────────────────────────────────────────────
**Total estimated time:** 45–60 minutes  
**Risk level:** ZERO — no imports to verify, no runtime impact  
**Rollback:** `git checkout .` or `git revert <commit>` — instant  

---

### TASK 1.1 — Delete AI/Planning Markdown Files

**Goal:** Remove large planning/AI-generation files committed to the repo root. These inflate the project and are not source code.

**Estimated time:** 2 minutes  
**Risk:** ZERO — not imported by any code

**Dependency checks (already verified — none needed):**
- None of these files are imported or referenced by any `.java`, `.tsx`, `.ts`, or `.js` file.

**Files to delete:**
```
CargoLink-main/CargoLink_Agency_UI_UX_Prompts.md   (40 KB)
CargoLink-main/CargoLink_BugReport.md              (20 KB)
CargoLink-main/CargoLink_FIX_TASKS.md              (32 KB)
CargoLink-main/CargoLink_MASTER_REPORT.md          (52 KB)
CargoLink-main/CargoLink_MISSING_FEATURES.md       (24 KB)
```

**Commands:**
```bash
cd CargoLink-main
rm CargoLink_Agency_UI_UX_Prompts.md
rm CargoLink_BugReport.md
rm CargoLink_FIX_TASKS.md
rm CargoLink_MASTER_REPORT.md
rm CargoLink_MISSING_FEATURES.md
```

**Expected result:** 168 KB removed from repo. No runtime change.

**Validation steps:**
```bash
# Confirm deletion
ls *.md
# Should only show README.md
```

---

### TASK 1.2 — Delete AI Tooling Configuration Directories

**Goal:** Remove `.agents/`, `.claude/`, and associated AI tooling files that have no role in the application runtime.

**Estimated time:** 2 minutes  
**Risk:** ZERO

**Files/directories to delete:**
```
CargoLink-main/.agents/          (entire directory)
CargoLink-main/.claude/          (entire directory)
CargoLink-main/skills-lock.json
CargoLink-main/git               (empty stray file)
```

**Commands:**
```bash
rm -rf .agents/
rm -rf .claude/
rm skills-lock.json
rm git
```

**Then update `.gitignore`** (open `CargoLink-main/.gitignore` or create it at root level and add):
```
.agents/
.claude/
skills-lock.json
```

**Expected result:** 40+ skill reference files removed. No runtime impact.

**Validation:**
```bash
ls -la   # Confirm directories are gone
```

---

### TASK 1.3 — Delete Frontend Developer Artifact Files

**Goal:** Remove debug and QA files committed to frontend source.

**Estimated time:** 1 minute  
**Risk:** ZERO

**Files to delete:**
```
CargoLink-main/frontend/errors.txt
CargoLink-main/frontend/src/pages/agency/drivers/QA_CHECKLIST.md
```

**Commands:**
```bash
rm frontend/errors.txt
rm frontend/src/pages/agency/drivers/QA_CHECKLIST.md
```

**Validation:**
```bash
ls frontend/
ls frontend/src/pages/agency/drivers/
```

---

### TASK 1.4 — Delete Backend Demo/Dead Utility Classes

**Goal:** Remove `LoggingDemo.java` (demo `@Component` with zero callers) and `LogThrottler.java` (zero external imports).

**Estimated time:** 3 minutes  
**Risk:** ZERO

**Dependency checks (verified):**
- `LoggingDemo.java` — grep across all `.java` files confirms zero injection, zero `@Autowired`, zero direct call
- `LogThrottler.java` — grep across all `.java` files confirms it is only self-referential

**Files to delete:**
```
backend/src/main/java/com/deliveryplatform/util/LoggingDemo.java
backend/src/main/java/com/deliveryplatform/util/LogThrottler.java
```

**Commands:**
```bash
rm backend/src/main/java/com/deliveryplatform/util/LoggingDemo.java
rm backend/src/main/java/com/deliveryplatform/util/LogThrottler.java
```

**Expected result:** Spring context no longer registers these beans. Build stays clean.

**Validation:**
```bash
cd backend
./mvnw compile -q
# Must succeed with zero errors
```

---

### TASK 1.5 — Remove Duplicate Route Aliases from App.tsx

**Goal:** Remove 4 redundant route aliases that point to the same components as canonical routes. These create noise in the route table and dead navigation paths.

**Estimated time:** 5 minutes  
**Risk:** ZERO — canonical routes remain intact

**File to modify:**
```
frontend/src/App.tsx
```

**Dependency check:**
- The duplicate routes point to components that are also reachable via their canonical route
- No external link in the app hardcodes the alias paths (verified: aliases were legacy internal notes)

**Exact lines to REMOVE from `App.tsx`:**

```tsx
// LINE 160 — DELETE THIS LINE:
<Route path="routesmap/:orderId?" element={<RoutesMap />} />

// LINE 166 — DELETE THIS LINE:
<Route path="proof/:orderId" element={<UnifiedProof />} />

// LINE 167 — DELETE THIS LINE:
<Route path="delivery-proof/:orderId" element={<UnifiedProof />} />

// LINE 178 — DELETE THIS LINE:
<Route path="shifthub" element={<ShiftHub />} />

// Also remove the comment block around line 158:
// REMOVE: {/* Map: /driver/routes AND /driver/routesmap both work */}
// REMOVE: {/* Shift: /driver/shift AND /driver/shifthub both work */}
```

**Also remove the now-stale import for `ScanAll`** (this complements Task 1.6):
> ⚠️ Do NOT remove the `ScanAll` import yet — handle it in Task 1.6 when the full removal happens.

**After edit, canonical routes that remain (correct):**
```tsx
<Route path="routes" element={<RoutesMap />} />
<Route path="delivery/:orderId/proof" element={<UnifiedProof />} />
<Route path="shift" element={<ShiftHub />} />
```

**Validation:**
```bash
cd frontend
npm run build
# Must compile with zero errors
# Manually test navigation to /driver/routes and /driver/delivery/:id/proof still works
```

---

### TASK 1.6 — Remove Duplicate `StatusBadge.jsx` File

**Goal:** The project has both `StatusBadge.jsx` (JavaScript, uses `statusConstants.js`) and `StatusBadge.tsx` (TypeScript, exports types). All active pages import from `@/components/common/StatusBadge` which TypeScript resolves to `.tsx`. The `.jsx` is dead.

**Estimated time:** 5 minutes  
**Risk:** ZERO — TypeScript module resolution prefers `.tsx` over `.jsx` for the same name

**Dependency check:**
- Grep confirms all active pages use `@/components/common/StatusBadge` path alias
- TypeScript always resolves `.tsx` first — the `.jsx` was never being loaded at runtime
- `ManageDrivers.tsx` (orphaned page) imports from `'./drivers/components/StatusBadge'` — both that file AND `ManageDrivers.tsx` are deleted in Phase 2

**Files to delete:**
```
frontend/src/components/common/StatusBadge.jsx
```

**Command:**
```bash
rm frontend/src/components/common/StatusBadge.jsx
```

**Validation:**
```bash
cd frontend
npm run build
# TypeScript should compile cleanly — .tsx takes over
npx tsc --noEmit
# Zero errors expected
```

---

### PHASE 1 — Build + Validation Checkpoint

```bash
# Frontend build
cd frontend
npm run build
# Expected: SUCCESS — zero errors

# Backend compile
cd ../backend
./mvnw compile -q
# Expected: SUCCESS — zero errors

# Frontend lint
cd ../frontend
npm run lint
# Expected: zero new lint errors
```

**Git commit:**
```bash
git add -A
git commit -m "simplify(phase-1): remove dev artifacts, dead utilities, duplicate routes and StatusBadge.jsx"
```

---

## ─────────────────────────────────────────────────
## PHASE 2 — Orphaned Files Removal
## ─────────────────────────────────────────────────
**Total estimated time:** 30–45 minutes  
**Risk:** LOW — all files confirmed as not imported by the active router or any active component  
**Rollback:** `git revert <commit>` restores all files instantly  

---

### TASK 2.1 — Delete 7 Old Flat Agency Pages

**Goal:** The router (`App.tsx`) uses the new modular agency pages under `src/pages/agency/dashboard/`, `src/pages/agency/orders/`, etc. The 7 old flat files at the root of `src/pages/agency/` are **never imported by `App.tsx`**.

**Estimated time:** 5 minutes  
**Risk:** LOW

**Dependency check (verified):**
```bash
grep -r "pages/agency/AgencyDashboard\|pages/agency/AgencyOrders\|pages/agency/ManageDrivers\|pages/agency/AgencyWallet\|pages/agency/AgencyAnalytics\|pages/agency/CODReconciliation\|pages/agency/AgencySupport" frontend/src/
# Result: ZERO matches in App.tsx or any active file
```

**Files to delete:**
```
frontend/src/pages/agency/AgencyDashboard.tsx
frontend/src/pages/agency/AgencyOrders.tsx
frontend/src/pages/agency/ManageDrivers.tsx
frontend/src/pages/agency/AgencyWallet.tsx
frontend/src/pages/agency/AgencyAnalytics.tsx
frontend/src/pages/agency/AgencySupport.tsx
frontend/src/pages/agency/CODReconciliation.tsx
```

**Commands:**
```bash
rm frontend/src/pages/agency/AgencyDashboard.tsx
rm frontend/src/pages/agency/AgencyOrders.tsx
rm frontend/src/pages/agency/ManageDrivers.tsx
rm frontend/src/pages/agency/AgencyWallet.tsx
rm frontend/src/pages/agency/AgencyAnalytics.tsx
rm frontend/src/pages/agency/AgencySupport.tsx
rm frontend/src/pages/agency/CODReconciliation.tsx
```

**Expected result:** 7 files removed (~800–2000 lines each). Zero runtime impact.

**Validation:**
```bash
cd frontend && npm run build
# Must succeed — none of these were in the bundle
```

---

### TASK 2.2 — Delete Duplicate Agency Admin Dashboard Files

**Goal:** Two duplicate `AgencyAdminDashboard` files exist — neither is wired into the router.

**Estimated time:** 2 minutes  
**Risk:** LOW

**Dependency check:**
```bash
grep -r "AgencyAdminDashboard\|admin-dashboard" frontend/src/App.tsx
# Result: ZERO matches
```

**Files to delete:**
```
frontend/src/pages/agency/AgencyAdminDashboard.tsx
frontend/src/pages/agency/admin-dashboard/index.tsx
```

**Commands:**
```bash
rm frontend/src/pages/agency/AgencyAdminDashboard.tsx
rm frontend/src/pages/agency/admin-dashboard/index.tsx
rmdir frontend/src/pages/agency/admin-dashboard/  # Remove empty dir
```

**Validation:**
```bash
cd frontend && npm run build
```

---

### TASK 2.3 — Delete Unused Agency Layout File

**Goal:** `App.tsx` imports `AgencyLayout` from `@/layouts/agency` (resolves to `layouts/agency/index.tsx`). The file `layouts/AgencyLayout.tsx` is never imported.

**Estimated time:** 2 minutes  
**Risk:** LOW

**Dependency check:**
```bash
grep -rn "layouts/AgencyLayout" frontend/src/
# Result: ZERO matches — App.tsx uses @/layouts/agency (directory import)
```

**File to delete:**
```
frontend/src/layouts/AgencyLayout.tsx
```

**Command:**
```bash
rm frontend/src/layouts/AgencyLayout.tsx
```

**Validation:**
```bash
cd frontend && npm run build
# AgencyLayout from layouts/agency/index.tsx still used correctly
```

---

### TASK 2.4 — Delete Unused `LiveMap.tsx` Admin Page

**Goal:** The router wires `/admin/map` → `GlobalLiveMap`. The file `LiveMap.tsx` is a separate standalone page that is not referenced in `App.tsx` routes.

**Estimated time:** 2 minutes  
**Risk:** LOW

**Dependency check:**
```bash
grep -n "LiveMap\b" frontend/src/App.tsx
# Only "GlobalLiveMap" appears — LiveMap is not in the router
grep -rn "import.*LiveMap\b" frontend/src/
# ZERO matches
```

**File to delete:**
```
frontend/src/pages/admin/LiveMap.tsx
```

**Command:**
```bash
rm frontend/src/pages/admin/LiveMap.tsx
```

**Validation:**
```bash
cd frontend && npm run build
# GlobalLiveMap still resolves correctly at /admin/map
```

---

### TASK 2.5 — Delete Unused `PricingSection.tsx` Landing Component

**Goal:** `PricingSection.tsx` is defined but never imported in `Index.tsx` or any other active file.

**Estimated time:** 2 minutes  
**Risk:** ZERO

**Dependency check:**
```bash
grep -rn "PricingSection" frontend/src/
# Only found inside PricingSection.tsx itself — never imported
```

**File to delete:**
```
frontend/src/components/landing/PricingSection.tsx
```

**Command:**
```bash
rm frontend/src/components/landing/PricingSection.tsx
```

---

### TASK 2.6 — Delete 6 Never-Rendered Driver/Order Components

**Goal:** Six component files are defined but never imported in any active page. Confirmed by exhaustive grep.

**Estimated time:** 3 minutes  
**Risk:** ZERO

**Pre-deletion verification (run these before deleting):**
```bash
grep -rn "DriverPerformanceWidget" frontend/src/pages/
grep -rn "EarningsChart" frontend/src/pages/
grep -rn "DriverStatsCard" frontend/src/pages/
grep -rn "CODRemittanceModal" frontend/src/pages/
grep -rn "OrderBarcode" frontend/src/pages/
grep -rn "BarcodeScanner" frontend/src/pages/
# ALL must return ZERO results
```

**Files to delete:**
```
frontend/src/components/driver/DriverPerformanceWidget.tsx
frontend/src/components/driver/EarningsChart.tsx
frontend/src/components/driver/DriverStatsCard.tsx
frontend/src/components/modals/CODRemittanceModal.tsx
frontend/src/components/orders/OrderBarcode.tsx
frontend/src/components/common/BarcodeScanner.tsx
```

**Commands:**
```bash
rm frontend/src/components/driver/DriverPerformanceWidget.tsx
rm frontend/src/components/driver/EarningsChart.tsx
rm frontend/src/components/driver/DriverStatsCard.tsx
rm frontend/src/components/modals/CODRemittanceModal.tsx
rm frontend/src/components/orders/OrderBarcode.tsx
rm frontend/src/components/common/BarcodeScanner.tsx
```

---

### TASK 2.7 — Delete Standalone `CountdownTimer.tsx` Component

**Goal:** `CountdownTimer.tsx` in `/components/driver/` is never imported. `TrackingPage.tsx` has its own inline CountdownTimer definition.

**Estimated time:** 2 minutes  
**Risk:** ZERO

**Dependency check:**
```bash
grep -rn "from.*driver/CountdownTimer\|from.*components/driver/CountdownTimer" frontend/src/
# ZERO matches
```

**File to delete:**
```
frontend/src/components/driver/CountdownTimer.tsx
```

**Command:**
```bash
rm frontend/src/components/driver/CountdownTimer.tsx
```

---

### TASK 2.8 — Delete `drivers/components/StatusBadge.tsx` Re-export Wrapper

**Goal:** This file is purely a re-export shim for `@/components/common/StatusBadge`. It was only used by `ManageDrivers.tsx` (orphaned, deleted in Task 2.1). Now it has zero consumers.

**Estimated time:** 2 minutes  
**Risk:** LOW

**Dependency check:**
```bash
grep -rn "drivers/components/StatusBadge" frontend/src/
# Only ManageDrivers.tsx used it — which is now deleted
```

**File to delete:**
```
frontend/src/pages/agency/drivers/components/StatusBadge.tsx
```

**Command:**
```bash
rm frontend/src/pages/agency/drivers/components/StatusBadge.tsx
```

---

### PHASE 2 — Build + Validation Checkpoint

```bash
# Full TypeScript check
cd frontend
npx tsc --noEmit
# Expected: ZERO errors

# Production build
npm run build
# Expected: SUCCESS

# Check bundle size (optional — should be smaller)
ls -lh dist/assets/*.js | sort -k5 -h | tail -5

# Backend compile (unchanged but verify)
cd ../backend
./mvnw compile -q
# Expected: SUCCESS
```

**Git commit:**
```bash
git add -A
git commit -m "simplify(phase-2): remove orphaned agency pages, duplicate layouts, unused components"
```

---

## ─────────────────────────────────────────────────
## PHASE 3 — UI Simplification
## ─────────────────────────────────────────────────
**Total estimated time:** 2–3 hours  
**Risk:** LOW to MEDIUM — requires editing active files  
**Rollback:** `git diff` to see changes; `git checkout <file>` to revert individual files  

---

### TASK 3.1 — Remove Testimonials Section from Landing Page

**Goal:** `TestimonialsSection.tsx` renders fake static testimonials that look unprofessional in an academic demo. Remove it from `Index.tsx`.

**Estimated time:** 5 minutes  
**Risk:** LOW

**Dependency check:**
```bash
grep -rn "TestimonialsSection" frontend/src/
# Only imported in Index.tsx — safe to remove
```

**File to modify:** `frontend/src/pages/Index.tsx`

**Exact changes — REMOVE these 2 lines:**
```tsx
// LINE 7 — DELETE:
import TestimonialsSection from "@/components/landing/TestimonialsSection";

// LINE 21 — DELETE:
<TestimonialsSection />
```

**Then delete the component:**
```bash
rm frontend/src/components/landing/TestimonialsSection.tsx
```

**Validation:**
```bash
cd frontend
npm run dev
# Navigate to http://localhost:5173 — landing page loads, no testimonials section
npm run build
```

---

### TASK 3.2 — Remove `ScanAll` Page and `QRScanner` Component

**Goal:** `/driver/scan-all` is a bulk-scan variant that duplicates the existing `/driver/scan` page. `QRScanner` is only consumed by `ScanAll`. Both the route, the import, and both files can be safely removed.

**Estimated time:** 10 minutes  
**Risk:** LOW-MEDIUM (requires 3-file edits)

**Dependency check:**
```bash
grep -rn "QRScanner" frontend/src/pages/
# Only ScanAll.tsx — safe to remove both
grep -rn "ScanAll" frontend/src/
# Only App.tsx imports it — we'll edit App.tsx
```

**Step 1 — Edit `frontend/src/App.tsx`:**

Remove the import (line 30):
```tsx
// DELETE THIS LINE:
import ScanAll from "./pages/driver/ScanAll";
```

Remove the route (line 175):
```tsx
// DELETE THIS LINE:
<Route path="scan-all" element={<ScanAll />} />
```

**Step 2 — Edit `frontend/src/components/driver/AppSidebar.tsx`:**

Remove the "Centre de Scan" sidebar item (lines 59–63):
```tsx
// DELETE THESE LINES:
{
  title: "Centre de Scan",
  url: "/driver/scan-all",
  icon: QrCode,
},
```

Also remove the `QrCode` icon import if it becomes unused after this:
```tsx
// Check line 1 imports — if QrCode is only used for this item, remove it from:
import { ..., QrCode, ... } from "lucide-react";
```

**Step 3 — Edit `frontend/src/components/driver/DriverBottomNav.tsx`:**

Line 18 — the bottom nav center button links to `/driver/scan-all`. Change it to `/driver/scan`:
```tsx
// BEFORE:
{ id: 'scan', label: 'Scan', icon: QrCode, path: '/driver/scan-all', center: true },

// AFTER:
{ id: 'scan', label: 'Scan', icon: QrCode, path: '/driver/scan', center: true },
```

**Step 4 — Delete the files:**
```bash
rm frontend/src/pages/driver/ScanAll.tsx
rm frontend/src/components/orders/QRScanner.tsx
```

**Validation:**
```bash
cd frontend
npx tsc --noEmit   # Zero TS errors
npm run build      # Clean build
# Test: /driver/scan still works (ScanPage.tsx)
# Test: bottom nav Scan button now goes to /driver/scan
```

---

### TASK 3.3 — Remove `TaskAnalytics` Page and Sidebar Link

**Goal:** `/admin/task-analytics` is a fourth analytics page duplicating data already in `Analytics.tsx`. `Analytics.tsx` already calls the same `adminService.getTaskAnalytics()` endpoint. The standalone page adds zero value.

**Estimated time:** 10 minutes  
**Risk:** LOW-MEDIUM

**Dependency check:**
```bash
grep -rn "TaskAnalyticsPage\|task-analytics" frontend/src/
# Only in App.tsx (import + route) and AdminSidebar.tsx (nav link)
```

**Step 1 — Edit `frontend/src/App.tsx`:**

Remove the import (line 92):
```tsx
// DELETE THIS LINE:
import { TaskAnalyticsPage } from "./pages/admin/TaskAnalytics";
```

Remove the route (line 216):
```tsx
// DELETE THIS LINE:
<Route path="task-analytics" element={<TaskAnalyticsPage />} />
```

**Step 2 — Edit `frontend/src/components/admin/AdminSidebar.tsx`:**

Remove from the 'Intelligence' nav group (line 79):
```tsx
// DELETE THIS LINE:
{ title: 'Task Analytics', icon: Activity, path: '/admin/task-analytics' },
```

If `Activity` icon is no longer used after removing this line, also remove it from the import at the top of `AdminSidebar.tsx`:
```tsx
// Find the lucide-react import line and remove Activity if unused
import { ..., Activity, ... } from "lucide-react";
```

**Step 3 — Delete the file:**
```bash
rm frontend/src/pages/admin/TaskAnalytics.tsx
```

> ⚠️ Do NOT delete the `TaskAnalytics` type from `frontend/src/types/index.ts` yet — `Analytics.tsx` still uses it. Handle in Phase 4.

**Validation:**
```bash
cd frontend
npx tsc --noEmit
npm run build
# Test: /admin/analytics still loads and works
# Test: sidebar no longer shows "Task Analytics"
```

---

### TASK 3.4 — Remove `AuditLogs` Page and Sidebar Link

**Goal:** The audit logs admin page is enterprise-level operational complexity. For a PFE demo the backend logs (`@Slf4j`) are sufficient. Removing the page leaves the backend audit service intact (it's used by wallet/order services internally).

**Estimated time:** 10 minutes  
**Risk:** LOW-MEDIUM

**Dependency check:**
```bash
grep -rn "AuditLogs\b" frontend/src/
# Only App.tsx (import + route) and AdminSidebar.tsx (nav link)
# Backend AuditLog entity is NOT affected — we only remove the frontend page
```

**Step 1 — Edit `frontend/src/App.tsx`:**

Remove the import (line 76):
```tsx
// DELETE THIS LINE:
import AuditLogs from "./pages/admin/AuditLogs";
```

Remove the route (line 207):
```tsx
// DELETE THIS LINE:
<Route path="logs" element={<AuditLogs />} />
```

**Step 2 — Edit `frontend/src/components/admin/AdminSidebar.tsx`:**

Remove from the 'Intelligence' nav group (line 80):
```tsx
// DELETE THIS LINE:
{ title: 'Audit Logs', icon: ShieldAlert, path: '/admin/logs' },
```

> ⚠️ Check if `ShieldAlert` icon is used elsewhere in `AdminSidebar.tsx` before removing from import.

**Step 3 — Delete the file:**
```bash
rm frontend/src/pages/admin/AuditLogs.tsx
```

**Validation:**
```bash
cd frontend
npm run build
# Test: /admin/analytics and other admin pages still work
# Test: sidebar no longer shows "Audit Logs"
```

---

### TASK 3.5 — Remove `AdminsManagement` Page and Sidebar Link

**Goal:** The sub-admin management page (`/admin/admins`) handles CRUD of other admin accounts. For a PFE there is one admin. The backend endpoint for creating agencies (also in `AdminController`) must remain — only the sub-admin CRUD UI is hidden.

**Estimated time:** 8 minutes  
**Risk:** LOW-MEDIUM

**Dependency check:**
```bash
grep -rn "AdminsManagement" frontend/src/
# Only App.tsx import + route

grep -rn "adminUserService" frontend/src/
# Used only in AdminsManagement.tsx — safe to orphan
```

**Step 1 — Edit `frontend/src/App.tsx`:**

Remove the import (line 71):
```tsx
// DELETE THIS LINE:
import AdminsManagement from "./pages/admin/AdminsManagement";
```

Remove the route (line 197):
```tsx
// DELETE THIS LINE:
<Route path="admins" element={<AdminsManagement />} />
```

**Step 2 — Edit `frontend/src/components/admin/AdminSidebar.tsx`:**

Remove from the 'Platform' nav group (line 53):
```tsx
// DELETE THIS LINE:
{ title: 'Admins', icon: ShieldCheck, path: '/admin/admins' },
```

> ⚠️ Check if `ShieldCheck` icon is used elsewhere in AdminSidebar before removing from imports.

**Step 3 — Delete the file:**
```bash
rm frontend/src/pages/admin/AdminsManagement.tsx
```

> Do NOT delete `adminUserService.ts` yet — check Phase 4 first.

**Validation:**
```bash
cd frontend
npm run build
# Confirm /admin/agencies still works (different service)
# Confirm sidebar shows correct nav items
```

---

### TASK 3.6 — Remove Disciplinary Action Modal from Agency Drivers Page

**Goal:** Remove the `DisciplinaryModal` from the driver management UI. The backend entity remains untouched. The filter dropdown that uses `disciplinaryFilter` state is also removed.

**Estimated time:** 20 minutes  
**Risk:** MEDIUM — requires careful surgical edits to `index.tsx`

**File to modify:** `frontend/src/pages/agency/drivers/index.tsx`

**Step 1 — Remove the import:**
```tsx
// LINE 14 — DELETE:
import DisciplinaryModal from './components/DisciplinaryModal';
```

**Step 2 — Remove state declarations** (lines ~32–39):
```tsx
// DELETE THESE:
const [disciplinaryFilter, setDisciplinaryFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'BLACKLISTED_LOCAL'>('ALL');
const [disciplinaryAction, setDisciplinaryAction] = useState<{...}>(...);
const [isDisciplinaryModalOpen, setIsDisciplinaryModalOpen] = useState(false);
```

**Step 3 — Remove the `openDisciplinaryModal` handler** (around line 68):
```tsx
// DELETE the function:
const openDisciplinaryModal = (...) => {
  ...
  setIsDisciplinaryModalOpen(true);
};
```

**Step 4 — Remove disciplinary filter from the `useMemo` filter logic** (lines ~85–91):
```tsx
// BEFORE (keep the rest of the filter, remove the disciplinary part):
const disciplinaryMatch = disciplinaryFilter === 'ALL' || discStatus === disciplinaryFilter;
return (nameMatch || plateMatch || phoneMatch) && statusMatch && availabilityMatch && disciplinaryMatch;

// AFTER:
return (nameMatch || plateMatch || phoneMatch) && statusMatch && availabilityMatch;
```

Also remove:
```tsx
const discStatus = d.disciplinaryStatus || 'ACTIVE';
```

**Step 5 — Remove the disciplinary count** (line ~96):
```tsx
// DELETE:
suspended: drivers.filter((d) => d.disciplinaryStatus === 'SUSPENDED').length,
```

**Step 6 — Remove `<DisciplinaryModal ... />` JSX** wherever it renders in the return.

**Step 7 — Delete the modal component file:**
```bash
rm frontend/src/pages/agency/drivers/components/DisciplinaryModal.tsx
```

**Validation:**
```bash
cd frontend
npx tsc --noEmit   # Zero TS errors
npm run build
# Test: /agency/drivers loads — driver list shows correctly without disciplinary UI
```

---

### TASK 3.7 — Hide `Shift Hub` from Driver Sidebar Navigation

**Goal:** The Shift Hub gamification feature stays in the codebase (DB migration risk) but is removed from the sidebar navigation so it does not appear during the demo.

**Estimated time:** 5 minutes  
**Risk:** LOW — only hides the nav link; the route and component remain functional if accessed directly

**File to modify:** `frontend/src/components/driver/AppSidebar.tsx`

**Exact lines to REMOVE** (lines 64–68):
```tsx
// DELETE THESE LINES:
{
  title: "Shift Hub",
  url: "/driver/shifthub",
  icon: BarChart3,
},
```

> ⚠️ The route `/driver/shift` stays in `App.tsx`. Only the nav link is removed.  
> ⚠️ Check if `BarChart3` icon is used elsewhere in `AppSidebar.tsx` before removing from imports.

**Validation:**
```bash
cd frontend
npm run build
# Test: driver sidebar no longer shows "Shift Hub"
# Test: /driver/shift is still accessible directly (not broken)
```

---

### PHASE 3 — Build + Validation Checkpoint

```bash
# Full type check
cd frontend
npx tsc --noEmit
# Expected: ZERO errors

# Production build
npm run build
# Expected: SUCCESS — note smaller bundle size

# Lint
npm run lint
# Expected: zero new errors

# Manual smoke test checklist:
# ✓ Landing page loads (no Testimonials)
# ✓ Login → Admin dashboard accessible
# ✓ Admin sidebar: no "Task Analytics", no "Audit Logs", no "Admins"
# ✓ Login → Agency dashboard accessible
# ✓ Agency drivers page loads without Disciplinary Modal
# ✓ Login → Driver dashboard accessible
# ✓ Driver sidebar: no "Centre de Scan"
# ✓ Driver bottom nav Scan → goes to /driver/scan (not scan-all)
# ✓ /driver/delivery/:id/proof works
# ✓ /driver/routes works
```

**Git commit:**
```bash
git add -A
git commit -m "simplify(phase-3): remove testimonials, scan-all, task analytics, audit logs page, admins management, disciplinary modal, shift hub nav"
```

---

## ─────────────────────────────────────────────────
## PHASE 4 — Backend Simplification
## ─────────────────────────────────────────────────
**Total estimated time:** 2–3 hours  
**Risk:** MEDIUM — modifying active Java classes; backend must compile and tests must pass  
**Rollback:** `git checkout <file>` per file; backend tests catch regressions  

---

### TASK 4.1 — Remove Batch Optimisation and Clustering Endpoints

**Goal:** Remove the `POST /api/routing/batch-optimise` and `GET /api/routing/clusters` endpoints and their implementation. The core driver route endpoint (`GET /api/routing/driver/{id}/route`) is **preserved**.

**Estimated time:** 25 minutes  
**Risk:** MEDIUM

**Dependency check (run before editing):**
```bash
grep -rn "batch-optimise\|batchOptimis\|clusterOrders\|clusters" backend/src/main/java/ --include="*.java"
# Confirm only RouteOptimisationController + RouteOptimisationServiceImpl + interface + test
grep -rn "batch-optimise\|batchOptimis\|clusterOrders" frontend/src/ --include="*.tsx" --include="*.ts"
# Must return ZERO — no frontend calls these
```

**Step 1 — Edit `RouteOptimisationController.java`**  
File: `backend/src/main/java/com/deliveryplatform/controller/RouteOptimisationController.java`

**Remove these two endpoint methods** (lines 29–40):
```java
// DELETE — entire method:
@PostMapping("/batch-optimise")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<com.deliveryplatform.dto.response.BatchOptimizationResult> performBatchOptimisation() {
    log.info("Batch optimization triggered via API");
    return ResponseEntity.ok(routeOptimisationService.performGlobalBatchOptimization());
}

// DELETE — entire method:
@GetMapping("/clusters")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<Map<Integer, List<UUID>>> getClusters(@RequestParam(defaultValue = "5") int count) {
    return ResponseEntity.ok(routeOptimisationService.clusterOrders(count));
}
```

Also clean up now-unused imports at the top of the controller:
```java
// Remove if no longer used after deletion:
import java.util.List;
import java.util.Map;
```

**Step 2 — Edit `RouteOptimisationService.java` (interface)**  
File: `backend/src/main/java/com/deliveryplatform/service/RouteOptimisationService.java`

Remove these two method signatures:
```java
// DELETE:
Map<Integer, List<java.util.UUID>> clusterOrders(int clusterCount);

// DELETE:
com.deliveryplatform.dto.response.BatchOptimizationResult performGlobalBatchOptimization();
```

Also remove now-unused imports from the interface:
```java
// DELETE if now unused:
import java.util.Map;
```

**Step 3 — Edit `RouteOptimisationServiceImpl.java`**  
File: `backend/src/main/java/com/deliveryplatform/service/impl/RouteOptimisationServiceImpl.java`

Remove the following methods completely (verify by line number before each deletion):
```java
// DELETE — entire method (lines ~31–43):
@Override
public Map<Integer, List<UUID>> clusterOrders(int clusterCount) { ... }

// DELETE — entire method (lines ~45–155, the performGlobalBatchOptimization block):
@Override
public com.deliveryplatform.dto.response.BatchOptimizationResult performGlobalBatchOptimization() { ... }

// DELETE — entire private helper method (lines ~158–215):
private Map<Integer, List<Order>> performKMeansPlusPlus(List<Order> orders, int k) { ... }
```

**Step 4 — Delete the now-orphaned DTO:**
```bash
# Verify nothing else uses BatchOptimizationResult except the now-deleted code:
grep -rn "BatchOptimizationResult" backend/src/main/ --include="*.java"
# Should return ZERO after Step 1-3

rm backend/src/main/java/com/deliveryplatform/dto/response/BatchOptimizationResult.java
```

**Step 5 — Update the test file**  
File: `backend/src/test/java/com/deliveryplatform/service/RouteOptimisationServiceTest.java`

```bash
# Check what the test covers:
grep -n "batchOptimis\|clusterOrders\|BatchOptimizationResult" backend/src/test/java/com/deliveryplatform/service/RouteOptimisationServiceTest.java
```

Remove or comment out the test method that calls `performGlobalBatchOptimization()` (line ~161) and any import for `BatchOptimizationResult` (line 4).

**Validation:**
```bash
cd backend
./mvnw compile -q
# Must succeed

./mvnw test -pl . -Dtest=RouteOptimisationServiceTest
# Remaining tests must pass
```

---

### TASK 4.2 — Remove Dead Dependencies from `pom.xml`

**Goal:** Remove 3 dependencies that serve no purpose in the current codebase: `ortools-java` (commented-out, dead), `logstash-logback-encoder` (ELK stack logger not needed for PFE), `resilience4j-spring-boot3` (circuit breaker pattern not actively used).

**Estimated time:** 10 minutes  
**Risk:** LOW-MEDIUM

**Pre-check for each dependency:**

```bash
# ortools — already commented out (safe)
grep -n "ortools" backend/pom.xml
# Lines 157-164 — it's in an XML comment block — confirm, then delete the comment block

# logstash
grep -rn "logstash\|LogstashEncoder\|JsonEncoder" backend/src/main/java/ --include="*.java"
grep -rn "logstash\|JsonEncoder" backend/src/main/resources/
# If zero matches in code and config — SAFE to remove

# resilience4j
grep -rn "resilience4j\|CircuitBreaker\|Retry\|@CircuitBreaker" backend/src/main/java/ --include="*.java"
# If zero matches — SAFE to remove
```

**File to modify:** `backend/pom.xml`

**Remove these dependency blocks:**

Block 1 — ortools comment block (lines 157–164):
```xml
<!-- DELETE the entire comment block: -->
<!-- Commented out: ortools-win-x86-64 not available in standard repos; uncomment if available from custom repo -->
<!--
<dependency>
    <groupId>com.google.ortools</groupId>
    <artifactId>ortools-java</artifactId>
    <version>9.8.3296</version>
</dependency>
-->
```

Block 2 — logstash (lines 108–111):
```xml
<!-- DELETE: -->
<dependency>
    <groupId>net.logstash.logback</groupId>
    <artifactId>logstash-logback-encoder</artifactId>
    <version>7.4</version>
</dependency>
```

Block 3 — resilience4j (lines 168–171):
```xml
<!-- DELETE: -->
<dependency>
    <groupId>io.github.resilience4j</groupId>
    <artifactId>resilience4j-spring-boot3</artifactId>
    <version>2.2.0</version>
</dependency>
```

**Validation:**
```bash
cd backend
./mvnw clean compile -q
# Must succeed — dependency removed from classpath
./mvnw test -q
# All tests must pass
```

---

### TASK 4.3 — Remove `ReportController` and Report Service Layer

**Goal:** `ReportController` exposes `GET /api/reports/financial` and `GET /api/reports/operations`. No frontend service file calls these endpoints. The `ReportServiceImpl` contains trivial implementations (`orderRepository.count()`). This is unused scaffolding.

**Estimated time:** 15 minutes  
**Risk:** MEDIUM

**Dependency check:**
```bash
grep -rn "/api/reports\|reportService\|ReportService\|ReportController" backend/src/main/java/ --include="*.java"
# Confirm only in ReportController, ReportService, ReportServiceImpl

grep -rn "api/reports\|reportService\|getFinancialReport\|getOperationsReport" frontend/src/ --include="*.tsx" --include="*.ts"
# Must return ZERO
```

**Files to delete:**
```
backend/src/main/java/com/deliveryplatform/controller/ReportController.java
backend/src/main/java/com/deliveryplatform/service/ReportService.java
backend/src/main/java/com/deliveryplatform/service/impl/ReportServiceImpl.java
```

**Commands:**
```bash
rm backend/src/main/java/com/deliveryplatform/controller/ReportController.java
rm backend/src/main/java/com/deliveryplatform/service/ReportService.java
rm backend/src/main/java/com/deliveryplatform/service/impl/ReportServiceImpl.java
```

**Validation:**
```bash
cd backend
./mvnw compile -q
# Must succeed — ReportService was standalone (no other class injected it)
./mvnw test -q
```

---

### TASK 4.4 — Remove TaskAnalytics Service Layer

**Goal:** Now that the `TaskAnalytics.tsx` page is removed (Phase 3), the backend TaskAnalytics service layer is also removable. However, `GeneralAdminService` has `getTaskAnalytics()` in its interface and `GeneralAdminServiceImpl` delegates to `TaskAnalyticsService`. This requires surgical edits to avoid breaking `GeneralAdminController`.

**Estimated time:** 30 minutes  
**Risk:** MEDIUM

**Dependency check:**
```bash
grep -rn "TaskAnalytics\|taskAnalytics" backend/src/main/java/ --include="*.java"
# Affected files:
# - TaskAnalyticsService.java (interface)
# - TaskAnalyticsServiceImpl.java (implementation)
# - TaskAnalyticsResponse.java (DTO)
# - GeneralAdminService.java (interface — has getTaskAnalytics method)
# - GeneralAdminServiceImpl.java (impl — delegates to TaskAnalyticsService)
# - GeneralAdminController.java (has /api/admin/task-analytics endpoint)
```

**Step 1 — Edit `GeneralAdminController.java`**

Find and remove the `getTaskAnalytics` endpoint (around line 119–127):
```java
// DELETE — entire method:
@GetMapping("/task-analytics")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<TaskAnalyticsResponse> getTaskAnalytics(
        @RequestParam(defaultValue = "DAILY") String period) {
    return ResponseEntity.ok(adminService.getTaskAnalytics(period));
}
```

Also remove the now-unused import:
```java
// DELETE if now unused:
import com.deliveryplatform.dto.response.TaskAnalyticsResponse;
```

**Step 2 — Edit `GeneralAdminService.java` (interface)**

Remove the method signature (line 36):
```java
// DELETE:
TaskAnalyticsResponse getTaskAnalytics(String period);
```

Remove the import:
```java
// DELETE:
import com.deliveryplatform.dto.response.TaskAnalyticsResponse;
```

**Step 3 — Edit `GeneralAdminServiceImpl.java`**

Remove the import (line 24):
```java
// DELETE:
import com.deliveryplatform.dto.response.TaskAnalyticsResponse;
```

Remove the TaskAnalyticsService import (line 39):
```java
// DELETE:
import com.deliveryplatform.service.TaskAnalyticsService;
```

Remove the injected field (line 75):
```java
// DELETE:
private final TaskAnalyticsService taskAnalyticsService;
```

Remove the method implementation (lines 608–609):
```java
// DELETE — entire method:
@Override
public TaskAnalyticsResponse getTaskAnalytics(String period) {
    return taskAnalyticsService.getTaskAnalytics(period != null ? period : "DAILY");
}
```

**Step 4 — Delete service and DTO files:**
```bash
rm backend/src/main/java/com/deliveryplatform/service/TaskAnalyticsService.java
rm backend/src/main/java/com/deliveryplatform/service/impl/TaskAnalyticsServiceImpl.java
rm backend/src/main/java/com/deliveryplatform/dto/response/TaskAnalyticsResponse.java
```

**Step 5 — Clean up frontend type** (optional, after confirming `Analytics.tsx` still works):
```bash
# Check if TaskAnalytics type is still needed
grep -rn "TaskAnalytics" frontend/src/ --include="*.tsx" --include="*.ts"
# Analytics.tsx still uses it — KEEP the type in types/index.ts for now
```

**Validation:**
```bash
cd backend
./mvnw compile -q
# Must succeed

./mvnw test -q
# All tests must pass — the admin controller test suite should not reference task-analytics
```

---

### TASK 4.5 — Remove `adminUserService.ts` Frontend Service (Now Orphaned)

**Goal:** `adminUserService.ts` was only imported by `AdminsManagement.tsx` (deleted in Phase 3). It is now an orphaned service file.

**Estimated time:** 5 minutes  
**Risk:** LOW

**Dependency check:**
```bash
grep -rn "adminUserService" frontend/src/ --include="*.tsx" --include="*.ts"
# Must return ZERO results after AdminsManagement.tsx deletion
```

**File to delete:**
```
frontend/src/services/adminUserService.ts
```

**Command:**
```bash
rm frontend/src/services/adminUserService.ts
```

**Validation:**
```bash
cd frontend
npx tsc --noEmit
npm run build
```

---

### PHASE 4 — Build + Validation Checkpoint

```bash
# Backend full build with tests
cd backend
./mvnw clean test
# Expected: BUILD SUCCESS — all tests pass

# Frontend full type check + build
cd ../frontend
npx tsc --noEmit
npm run build
# Expected: SUCCESS

# Lint
npm run lint

# Integration smoke test:
# Start backend: cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
# Start frontend: cd frontend && npm run dev
# ✓ Login as Admin — dashboard loads
# ✓ Login as Agency — dashboard loads
# ✓ Login as Driver — dashboard loads
# ✓ Login as Client — create order works
# ✓ /api/routing/driver/{id}/route still returns data
# ✓ /api/routing/batch-optimise returns 404 (endpoint removed)
```

**Git commit:**
```bash
git add -A
git commit -m "simplify(phase-4): remove batch optimisation, dead pom dependencies, report controller, task analytics service layer, orphaned adminUserService"
```

---

## ─────────────────────────────────────────────────
## PHASE 5 — Optional Advanced Cleanup
## ─────────────────────────────────────────────────
**Total estimated time:** 4–6 hours  
**Risk:** MEDIUM to HIGH  
**Recommendation:** Only execute if time permits AND a full test suite is available  
**Rollback:** Each task has its own rollback — do them one at a time, not together  

---

### TASK 5.1 — Hide Finance Dashboard and Audit Remittances from Admin Nav

**Goal:** Rather than deleting the billing module (DB migration risk), simply hide these pages from navigation so they do not appear during demo. Backend and DB remain intact.

**Estimated time:** 10 minutes  
**Risk:** LOW

**File to modify:** `frontend/src/components/admin/AdminSidebar.tsx`

Remove from the 'Finance' nav group:
```tsx
// Remove or comment out:
{ title: 'Finance', icon: DollarSign, path: '/admin/finance' },
```

Remove from the 'Intelligence' nav group:
```tsx
// Remove or comment out:
{ title: 'Remittances', icon: ShieldAlert, path: '/admin/audit-remittances' },
```

> Keep the routes in `App.tsx` (so URLs still work if needed). Only hide the nav links.

**Validation:**
```bash
cd frontend && npm run build
# Sidebar should show a cleaner Finance section
```

---

### TASK 5.2 — Replace Supabase Storage with Spring Boot File Upload in Settings

**Goal:** `Settings.tsx` uses `@supabase/supabase-js` only for avatar photo upload. The backend already has a `FileController` at `POST /api/files/upload`. Replacing the Supabase upload removes the need for Supabase credentials in the frontend environment.

**Estimated time:** 60–90 minutes  
**Risk:** MEDIUM

**Dependency check:**
```bash
grep -rn "supabase" frontend/src/ --include="*.tsx" --include="*.ts"
# Only lib/supabase.ts and pages/common/Settings.tsx
```

**Step 1 — Edit `Settings.tsx`:**

Replace the Supabase upload logic:
```tsx
// REMOVE these imports:
import { supabase, BUCKETS } from '@/lib/supabase';

// REPLACE the upload block with a fetch call to your backend:
const formData = new FormData();
formData.append('file', file);
const response = await fetch(`${import.meta.env.VITE_API_URL}/api/files/upload`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});
const data = await response.json();
const avatarUrl = data.url; // adjust to match FileController response shape
```

**Step 2 — Check `FileController.java` response format** and match the frontend parsing to its actual JSON structure.

**Step 3 — Delete Supabase client file:**
```bash
rm frontend/src/lib/supabase.ts
```

**Step 4 — Remove Supabase package:**
```bash
cd frontend
npm uninstall @supabase/supabase-js
```

**Step 5 — Remove `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from:**
- `.env` / `.env.example` (frontend)
- GitHub Actions secrets (if applicable)
- `.github/workflows/deploy.yml`

**Validation:**
```bash
cd frontend
npx tsc --noEmit
npm run build
# Test: avatar upload in Settings still works (now hits /api/files/upload)
```

---

### TASK 5.3 — Consolidate AuditLogService and AuditService (Backend)

**Goal:** Two separate audit services exist. Merge into one.

**Estimated time:** 45 minutes  
**Risk:** HIGH — touches `WalletServiceImpl`, `OrderServiceImpl`, `GeneralAdminServiceImpl`, `AgencyServiceImpl`

**Strategy:** Keep `AuditLogService` (used by more classes). Migrate the single method from `AuditService`/`AuditServiceImpl` into `AuditLogService`. Update all callers.

> ⚠️ This task is HIGH RISK. Do it on a separate branch and run all tests after.

**Rollback:** `git checkout backend/src/main/java/com/deliveryplatform/service/`

---

### TASK 5.4 — Remove DriverShift Gamification from DB (Requires Migration)

**Goal:** Remove the `DriverShift`, `DriverBadge`, `BadgeType` entities, their repositories, and the Flyway migration.

**Risk:** HIGH — requires creating a new Flyway migration that drops the tables. If any existing data references these tables, the migration will fail.

**Prerequisite:** Run on a fresh development database only. Never on production.

**New migration file to create:**
```
backend/src/main/resources/db/migration/V{next_version}__drop_gamification_tables.sql
```

```sql
-- V{next}_drop_gamification_tables.sql
DROP TABLE IF EXISTS driver_badge CASCADE;
DROP TABLE IF EXISTS driver_shift CASCADE;
DROP TYPE IF EXISTS badge_type CASCADE;
```

> ⚠️ Check existing Flyway migrations to determine the next version number.  
> ⚠️ Only execute this after confirming the `ShiftHub` page is acceptable to permanently remove.

---

## Testing Checklist After Each Phase

Run this checklist after completing each phase:

### Frontend Checks
```bash
# TypeScript — zero type errors
npx tsc --noEmit

# Production build — must succeed
npm run build

# Linting — zero new errors
npm run lint
```

### Backend Checks
```bash
# Compile only
./mvnw compile -q

# Full test suite
./mvnw test -q

# Verify Spring context loads (integration check)
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev &
sleep 15
curl -s http://localhost:8080/actuator/health | grep '"status":"UP"'
kill %1
```

### Manual Smoke Tests (per role)
```
ADMIN:
  ✓ /admin/dashboard — KPI cards load
  ✓ /admin/agencies — agency list loads
  ✓ /admin/orders — order table loads
  ✓ /admin/users — user list loads
  ✓ /admin/map — live map renders
  ✓ /admin/pricing — pricing config loads
  ✓ /admin/settings — settings page loads

AGENCY:
  ✓ /agency/dashboard — stats load
  ✓ /agency/orders — orders table loads
  ✓ /agency/create-order — form renders
  ✓ /agency/drivers — driver list loads (no DisciplinaryModal)
  ✓ /agency/wallet — wallet page loads
  ✓ /agency/settings — settings load

DRIVER:
  ✓ /driver/dashboard — loads
  ✓ /driver/orders — available orders show
  ✓ /driver/delivery/:id — delivery flow works
  ✓ /driver/delivery/:id/proof — proof upload works
  ✓ /driver/scan — scan page works
  ✓ /driver/wallet — wallet loads
  ✓ /driver/routes — route map renders

CLIENT:
  ✓ /client/dashboard — loads
  ✓ /client/create-order — multi-step form works
  ✓ /client/orders — order list loads
  ✓ /client/orders/:id — order detail + map loads
  ✓ /client/wallet — wallet loads
  ✓ /tracking/:id — public tracking page works (no auth required)
```

---

## Commands Reference Card

```bash
# ── Frontend ──────────────────────────────
cd frontend

# TypeScript check (no output = no errors)
npx tsc --noEmit

# Dev server
npm run dev

# Production build
npm run build

# Lint
npm run lint

# ── Backend ───────────────────────────────
cd backend

# Compile only
./mvnw compile -q

# Run all tests
./mvnw test

# Run single test class
./mvnw test -Dtest=RouteOptimisationServiceTest

# Start dev server
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Clean + test (full check)
./mvnw clean test

# ── Git ───────────────────────────────────
git status
git diff --stat         # See what changed
git stash               # Temporarily store changes
git stash pop           # Restore stashed changes
git checkout <file>     # Revert single file
git revert <commit>     # Revert entire commit safely
```

---

## DO NOT TOUCH

The following files and modules are **critical to the application's core workflow** and must not be modified, moved, or deleted under any circumstances during this simplification:

### Authentication & Security
```
backend/src/main/java/com/deliveryplatform/security/          (entire directory)
backend/src/main/java/com/deliveryplatform/config/SecurityConfig.java
backend/src/main/java/com/deliveryplatform/controller/AuthController.java
backend/src/main/java/com/deliveryplatform/service/AuthService.java
backend/src/main/java/com/deliveryplatform/service/impl/AuthServiceImpl.java
frontend/src/context/AuthContext.tsx
frontend/src/components/auth/AuthGuard.tsx
frontend/src/pages/auth/UnifiedLogin.tsx
frontend/src/pages/auth/PendingApproval.tsx
```

### Order Lifecycle (Core Concept)
```
backend/src/main/java/com/deliveryplatform/controller/OrderController.java
backend/src/main/java/com/deliveryplatform/service/OrderService.java
backend/src/main/java/com/deliveryplatform/service/impl/OrderServiceImpl.java
backend/src/main/java/com/deliveryplatform/domain/entity/Order.java
backend/src/main/java/com/deliveryplatform/domain/entity/OrderStatus.java
backend/src/main/java/com/deliveryplatform/domain/entity/OrderItem.java
```

### Real-Time & WebSocket
```
backend/src/main/java/com/deliveryplatform/config/WebSocketConfig.java
backend/src/main/java/com/deliveryplatform/service/WebSocketEventService.java
backend/src/main/java/com/deliveryplatform/service/impl/WebSocketEventServiceImpl.java
frontend/src/context/SocketContext.tsx
frontend/src/context/NotificationContext.tsx
frontend/src/services/websocket/stompClient.js
frontend/src/components/driver/DriverNotificationHandler.tsx
frontend/src/components/driver/IncomingOrderNotification.tsx
```

### Tracking
```
backend/src/main/java/com/deliveryplatform/controller/TrackingController.java
backend/src/main/java/com/deliveryplatform/service/TrackingService.java
backend/src/main/java/com/deliveryplatform/domain/entity/TrackingHistory.java
frontend/src/pages/common/TrackingPage.tsx
frontend/src/services/api/trackingService.ts
```

### Driver Core Workflow
```
backend/src/main/java/com/deliveryplatform/controller/DriverController.java
backend/src/main/java/com/deliveryplatform/controller/DriverOrderController.java
backend/src/main/java/com/deliveryplatform/service/DriverService.java
frontend/src/pages/driver/DeliveryFlow.tsx
frontend/src/pages/driver/UnifiedProof.tsx
frontend/src/pages/driver/ActiveOrder.tsx
frontend/src/hooks/useActiveDelivery.ts
frontend/src/hooks/useGPS.ts
```

### Agency Core Workflow
```
backend/src/main/java/com/deliveryplatform/controller/AgencyController.java
backend/src/main/java/com/deliveryplatform/controller/AgencyAdminController.java
backend/src/main/java/com/deliveryplatform/controller/AgencyCustomerController.java
backend/src/main/java/com/deliveryplatform/service/AgencyService.java
frontend/src/pages/agency/dashboard/
frontend/src/pages/agency/orders/
frontend/src/pages/agency/customers/
```

### File Upload
```
backend/src/main/java/com/deliveryplatform/controller/FileController.java
backend/src/main/java/com/deliveryplatform/service/CloudStorageService.java
backend/src/main/java/com/deliveryplatform/service/impl/CloudStorageServiceImpl.java
```

### Database & Migrations
```
backend/src/main/resources/db/migration/           (entire directory — NEVER edit existing files)
backend/src/main/java/com/deliveryplatform/domain/entity/User.java
backend/src/main/java/com/deliveryplatform/domain/entity/Agency.java
backend/src/main/java/com/deliveryplatform/domain/entity/Driver.java
backend/src/main/java/com/deliveryplatform/domain/entity/Wallet.java
backend/src/main/java/com/deliveryplatform/domain/entity/Transaction.java
```

### Pricing Engine
```
backend/src/main/java/com/deliveryplatform/controller/PricingController.java
backend/src/main/java/com/deliveryplatform/service/PricingService.java
backend/src/main/java/com/deliveryplatform/domain/entity/PricingConfig.java
frontend/src/pages/admin/PricingManagement.tsx
```

### Route Optimisation — Driver Route Endpoint (partial keep)
```
backend/src/main/java/com/deliveryplatform/controller/RouteOptimisationController.java
  → Keep: GET /api/routing/driver/{driverId}/route
  → Keep: POST /api/routing/reoptimize (if it exists)
  → Remove only: batch-optimise and clusters endpoints
backend/src/main/java/com/deliveryplatform/service/impl/RouteOptimisationServiceImpl.java
  → Keep: optimizeDriverRouteWithStops(), optimizeDriverRoute()
  → Keep: 2-Opt, nearest-neighbor methods
  → Remove only: clusterOrders(), performGlobalBatchOptimization(), performKMeansPlusPlus()
```

### App Entry Points
```
frontend/src/main.tsx
frontend/src/App.tsx               (edit only — never delete)
frontend/src/layouts/DriverLayout.tsx
frontend/src/layouts/ClientLayout.tsx
frontend/src/layouts/AdminLayout.tsx
frontend/src/layouts/agency/index.tsx
backend/src/main/java/com/deliveryplatform/DeliveryPlatformApplication.java
backend/pom.xml                    (edit only — never delete)
```

---

## Summary Table

| Phase | Tasks | Files Affected | Estimated Time | Risk |
|-------|-------|---------------|----------------|------|
| 1 — Zero Risk Cleanup | 6 | ~20 deleted | 45–60 min | ZERO |
| 2 — Orphaned Files | 8 | ~20 deleted | 30–45 min | LOW |
| 3 — UI Simplification | 7 | ~15 edited/deleted | 2–3 hrs | LOW–MEDIUM |
| 4 — Backend Simplification | 5 | ~15 edited/deleted | 2–3 hrs | MEDIUM |
| 5 — Optional Advanced | 4 | varies | 4–6 hrs | MEDIUM–HIGH |
| **Total (P1–P4)** | **26** | **~70 files** | **~8 hrs** | **Managed** |
