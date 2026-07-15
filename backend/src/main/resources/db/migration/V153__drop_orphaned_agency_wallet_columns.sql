-- =============================================================================
-- V152: Drop orphaned agency_wallet columns
--
-- These columns were made @Transient in the Java entity (see AgencyWallet.java)
-- and are no longer read or written by any application code:
--
--   current_balance  — fully redundant with balance (always kept in sync)
--   total_profit     — always computed as total_revenue - total_expenses
--
-- Both were added in V124 and reset to 0 in V146. No views, stored procedures,
-- native queries, or reports reference them.
-- =============================================================================

ALTER TABLE agency_wallets DROP COLUMN IF EXISTS current_balance;
ALTER TABLE agency_wallets DROP COLUMN IF EXISTS total_profit;
