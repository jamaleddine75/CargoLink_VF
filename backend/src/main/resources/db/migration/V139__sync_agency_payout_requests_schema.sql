-- V139: Sync agency_payout_requests schema with Entity

ALTER TABLE agency_payout_requests ADD COLUMN IF NOT EXISTS paypal_batch_id VARCHAR(255);
ALTER TABLE agency_payout_requests ADD COLUMN IF NOT EXISTS paypal_item_id VARCHAR(255);
ALTER TABLE agency_payout_requests ADD COLUMN IF NOT EXISTS payment_account_id UUID;
ALTER TABLE agency_payout_requests ADD COLUMN IF NOT EXISTS receiver_email_snapshot VARCHAR(255);
ALTER TABLE agency_payout_requests ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'PAYPAL';

-- Temporarily drop the NOT NULL constraint on bank_account in case we don't want to lose data but want to allow new inserts
ALTER TABLE agency_payout_requests ALTER COLUMN bank_account DROP NOT NULL;

-- Fill nulls for NOT NULL columns
UPDATE agency_payout_requests SET receiver_email_snapshot = 'legacy@example.com' WHERE receiver_email_snapshot IS NULL;
UPDATE agency_payout_requests SET provider = 'PAYPAL' WHERE provider IS NULL;

-- We skip setting payment_account_id to NOT NULL to avoid failing if there are no payment accounts in the DB.
-- ALTER TABLE agency_payout_requests ALTER COLUMN payment_account_id SET NOT NULL;

ALTER TABLE agency_payout_requests ALTER COLUMN receiver_email_snapshot SET NOT NULL;
ALTER TABLE agency_payout_requests ALTER COLUMN provider SET NOT NULL;

-- Finally drop bank_account since it was removed from the Entity
ALTER TABLE agency_payout_requests DROP COLUMN IF EXISTS bank_account;
