-- V21: Add total_collected and total_paid_out columns to agency_wallets
-- These columns track the total COD cash collected and paid out by the agency

ALTER TABLE agency_wallets
    ADD COLUMN IF NOT EXISTS total_collected DOUBLE PRECISION NOT NULL DEFAULT 0.0;

ALTER TABLE agency_wallets
    ADD COLUMN IF NOT EXISTS total_paid_out DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- Add agency_id column to users table (for AGENCY_ADMIN users)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id);

-- Add reference_ids column to transactions (for COD_REMIS: comma-separated order IDs)
ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS reference_ids TEXT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agency_wallets_total_collected ON agency_wallets(total_collected);
CREATE INDEX IF NOT EXISTS idx_users_agency_id ON users(agency_id);

-- Documentation
COMMENT ON COLUMN agency_wallets.total_collected IS 'Total COD cash collected from drivers via confirmed remittances';
COMMENT ON COLUMN agency_wallets.total_paid_out IS 'Total amount paid out from agency wallet to settle obligations';
COMMENT ON COLUMN transactions.reference_ids IS 'For COD_REMIS: comma-separated list of order IDs covered by this remittance';
