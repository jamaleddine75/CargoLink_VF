-- Add the optimistic locking column required by AgencyWallet.@Version

ALTER TABLE agency_wallets
    ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN agency_wallets.version IS 'Optimistic locking version for agency wallet rows';