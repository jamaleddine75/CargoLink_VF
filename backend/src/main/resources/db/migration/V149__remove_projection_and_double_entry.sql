-- V149: Remove projection columns and double-entry tables
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS frozen_reason VARCHAR(500);

ALTER TABLE wallets DROP COLUMN IF EXISTS projection_rebuilt_at;
ALTER TABLE wallets DROP COLUMN IF EXISTS projection_source_journal_id;
ALTER TABLE wallets DROP COLUMN IF EXISTS projection_status;

ALTER TABLE platform_wallet DROP COLUMN IF EXISTS projection_rebuilt_at;
ALTER TABLE platform_wallet DROP COLUMN IF EXISTS projection_source_journal_id;
ALTER TABLE platform_wallet DROP COLUMN IF EXISTS projection_status;

ALTER TABLE agency_wallets DROP COLUMN IF EXISTS projection_rebuilt_at;
ALTER TABLE agency_wallets DROP COLUMN IF EXISTS projection_source_journal_id;
ALTER TABLE agency_wallets DROP COLUMN IF EXISTS projection_status;

DROP TABLE IF EXISTS ledger_entries CASCADE;
DROP TABLE IF EXISTS journal_entries CASCADE;
DROP TABLE IF EXISTS ledger_accounts CASCADE;
DROP TABLE IF EXISTS reconciliation_reports CASCADE;
DROP TABLE IF EXISTS fraud_alerts CASCADE;
