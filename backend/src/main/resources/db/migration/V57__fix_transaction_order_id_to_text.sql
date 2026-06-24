-- V57: Fix transactions.order_id column type to TEXT
-- Fixes: "value too long for type character varying(255)"
-- The order_id in transactions stores order IDs which may exceed 255 chars
-- when composed tracking numbers or internal IDs are used.

-- Also fix cash_in_hand and debt_to_system columns on wallets if not already TEXT/NUMERIC

ALTER TABLE transactions ALTER COLUMN order_id TYPE TEXT;

-- Ensure reference_ids is TEXT (may have been created as VARCHAR somewhere)
ALTER TABLE transactions ALTER COLUMN reference_ids TYPE TEXT;

-- Ensure description is TEXT (safety)
ALTER TABLE transactions ALTER COLUMN description TYPE TEXT;

-- Add wallet COD columns if they don't exist yet (idempotent guard)
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS cash_in_hand NUMERIC(15,2) NOT NULL DEFAULT 0;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS debt_to_system NUMERIC(15,2) NOT NULL DEFAULT 0;
