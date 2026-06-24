-- V16: Add agency_wallets table for agency commission tracking
-- Stores commission balance, transaction history, and payout management per agency

CREATE TABLE IF NOT EXISTS agency_wallets (
    id UUID PRIMARY KEY,
    agency_id UUID UNIQUE NOT NULL REFERENCES agencies(id),
    balance DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    total_commission_earned DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    pending_commission DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    commission_rate DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_agency_wallets_agency_id ON agency_wallets(agency_id);

-- Add comment for documentation
COMMENT ON TABLE agency_wallets IS 'Tracks commission earnings and payouts for delivery agencies';
COMMENT ON COLUMN agency_wallets.balance IS 'Current available commission balance';
COMMENT ON COLUMN agency_wallets.total_commission_earned IS 'Cumulative lifetime commission earnings';
COMMENT ON COLUMN agency_wallets.pending_commission IS 'Commission earned but not yet credited/confirmed';
COMMENT ON COLUMN agency_wallets.commission_rate IS 'Percentage of delivery fee taken as commission (e.g., 0.15 = 15%)';
