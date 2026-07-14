-- V147: Add frozen_reason column to agency_wallets
-- The entity class maps @Column(name = "frozen_reason", length = 500) but the column was never created.

ALTER TABLE agency_wallets
    ADD COLUMN IF NOT EXISTS frozen_reason VARCHAR(500);
