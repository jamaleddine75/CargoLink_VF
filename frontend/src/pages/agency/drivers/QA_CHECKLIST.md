# Driver Management QA Testing Checklist

## 1. Permit Expiration Detection
- [ ] Verify that drivers with `workPermissionUntil` in the past show as "Expired" with a rose-colored badge.
- [ ] Verify that drivers with `workPermissionUntil` in the future show as "Active" with an emerald-colored badge.
- [ ] Verify that drivers with no `workPermissionUntil` (null/undefined) show as "No Permit" / "Expired".
- [ ] Check that the exact expiry date is formatted correctly (e.g., "May 6, 2026").

## 2. Extend Work Permission Action
- [ ] Verify the "Extend" button ONLY appears for drivers with expired permits.
- [ ] Verify that clicking "Extend" triggers the `PUT /drivers/{id}/extend-permission` API call.
- [ ] Verify the loading state (spinner) appears inside the button during the request.
- [ ] Verify the button is disabled during the request to prevent duplicate clicks.
- [ ] Verify that on success:
    - [ ] A success toast notification appears with a "Sparkles" icon.
    - [ ] The driver list refreshes automatically.
    - [ ] The "Extend" button disappears (since the permit is now active).
- [ ] Verify that on failure:
    - [ ] An error toast notification appears.
    - [ ] The button becomes interactive again.

## 3. Search & Filtering
- [ ] **Search**:
    - [ ] Search by first/last name (case-insensitive).
    - [ ] Search by vehicle plate number.
    - [ ] Search by phone number.
    - [ ] Verify the "X" (clear) button resets the search term.
- [ ] **Permit Filters**:
    - [ ] "ALL" shows everyone.
    - [ ] "ACTIVE" shows only drivers with valid permits.
    - [ ] "EXPIRED" shows only drivers with expired permits.
- [ ] **Availability Filters**:
    - [ ] "ALL" shows everyone.
    - [ ] "LIVE" shows only ONLINE drivers.
    - [ ] "IDLE" shows only OFFLINE drivers.

## 4. Mobile Responsiveness
- [ ] Check layout on mobile screen sizes (e.g., 375px width).
- [ ] Ensure cards stack vertically (1 column).
- [ ] Ensure filter bars wrap correctly without horizontal scrolling.
- [ ] Verify that action buttons are easily tappable (large enough target).
- [ ] Check that text doesn't overflow or become unreadable.

## 5. UI/UX & Aesthetics
- [ ] Verify the mesh background glows are visible and animate subtley.
- [ ] Check that the "Glow effect" on cards matches the driver's online status (emerald for online, blue for offline).
- [ ] Verify that "Refresh Node" button spins during manual refresh.
- [ ] Ensure "No units matching signature" empty state is displayed when filters yield no results.
- [ ] Check framer-motion animations (staggered entrance, layout transitions).

## 6. Architecture & Code Quality
- [ ] Verify all types are handled via TypeScript interfaces.
- [ ] Ensure utility functions are unit-testable (e.g., `permitUtils.ts`).
- [ ] Check that API services are modularized in `agencyService.ts`.
