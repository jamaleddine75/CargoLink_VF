-- Add missing projection tracking columns required by AgencyWallet entity
-- These fields are read by the admin finance queries and must exist in the schema.

ALTER TABLE agency_wallets
    ADD COLUMN IF NOT EXISTS projection_rebuilt_at TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE agency_wallets
    ADD COLUMN IF NOT EXISTS projection_source_journal_id UUID;

ALTER TABLE agency_wallets
    ADD COLUMN IF NOT EXISTS projection_status VARCHAR(30) NOT NULL DEFAULT 'CURRENT';

COMMENT ON COLUMN agency_wallets.projection_rebuilt_at IS 'Timestamp of the last ledger projection rebuild';
COMMENT ON COLUMN agency_wallets.projection_source_journal_id IS 'Journal entry that produced the current projected balance';
COMMENT ON COLUMN agency_wallets.projection_status IS 'Projection sync state for the wallet balance';