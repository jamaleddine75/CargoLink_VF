-- V22: Comprehensive schema alignment — fix all missing columns detected by Hibernate validate
-- Adds missing columns to: drivers, orders, transactions, users, agency_wallets
-- All ALTER COLUMN uses IF NOT EXISTS for idempotency (safe to re-run)

-- =====================================================
-- 1. DRIVERS TABLE
--    Entity uses 'availability' VARCHAR enum column
--    Old schema had 'is_available' BOOLEAN + 'driver_status' VARCHAR
-- =====================================================
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS availability VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Migrate existing is_available → availability (best effort)
UPDATE drivers
SET availability = CASE
    WHEN is_available = TRUE THEN 'AVAILABLE'
    ELSE 'BUSY'
END
WHERE is_available IS NOT NULL AND availability = 'AVAILABLE';

CREATE INDEX IF NOT EXISTS idx_drivers_availability ON drivers(availability);

-- =====================================================
-- 2. ORDERS TABLE
--    Add fields added in recent entity updates
-- =====================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee DOUBLE PRECISION;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_proof_type VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_proof_photo_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_proof_pin VARCHAR(10);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

-- =====================================================
-- 3. TRANSACTIONS TABLE
--    Add reference_ids for COD_REMIS batch references
-- =====================================================
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reference_ids TEXT;

-- =====================================================
-- 4. USERS TABLE
--    Add agency_id FK for AGENCY_ADMIN role
-- =====================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id);

CREATE INDEX IF NOT EXISTS idx_users_agency_id ON users(agency_id);

-- =====================================================
-- 5. AGENCY_WALLETS TABLE
--    Add COD tracking columns
-- =====================================================
ALTER TABLE agency_wallets ADD COLUMN IF NOT EXISTS total_collected DOUBLE PRECISION NOT NULL DEFAULT 0.0;
ALTER TABLE agency_wallets ADD COLUMN IF NOT EXISTS total_paid_out DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- =====================================================
-- Documentation
-- =====================================================
COMMENT ON COLUMN drivers.availability IS 'Driver availability: AVAILABLE, BUSY, OFFLINE';
COMMENT ON COLUMN drivers.version IS 'Optimistic locking version field';
COMMENT ON COLUMN agency_wallets.total_collected IS 'Total COD collected and confirmed by agency';
COMMENT ON COLUMN agency_wallets.total_paid_out IS 'Total amount paid out from agency wallet';
COMMENT ON COLUMN transactions.reference_ids IS 'Comma-separated order IDs for COD_REMIS transactions';
