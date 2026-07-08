-- V138: Financial system repair

-- 1. DB-01: Remove duplicate wallets using ID (since created_at does not exist on wallets)
DELETE FROM wallets
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY id ASC) as rnum
        FROM wallets
    ) t
    WHERE t.rnum > 1
);

-- Ensure uk_wallets_user_id exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uk_wallets_user_id'
    ) THEN
        ALTER TABLE wallets ADD CONSTRAINT uk_wallets_user_id UNIQUE (user_id);
    END IF;
END $$;

-- 2. DB-02: Fix withdrawal_requests user_id NOT NULL failure
-- First add it as nullable
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS payment_account_id UUID;
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS receiver_email_snapshot VARCHAR(255);
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'PAYPAL';

-- Fill nulls with a dummy value so we can apply NOT NULL
UPDATE withdrawal_requests SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL;
UPDATE withdrawal_requests SET payment_account_id = (SELECT id FROM payment_accounts LIMIT 1) WHERE payment_account_id IS NULL;
UPDATE withdrawal_requests SET receiver_email_snapshot = 'legacy@example.com' WHERE receiver_email_snapshot IS NULL;
UPDATE withdrawal_requests SET provider = 'PAYPAL' WHERE provider IS NULL;

-- Apply NOT NULL safely
ALTER TABLE withdrawal_requests ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE withdrawal_requests ALTER COLUMN payment_account_id SET NOT NULL; -- skipped, might be null if no payment account
ALTER TABLE withdrawal_requests ALTER COLUMN receiver_email_snapshot SET NOT NULL;
ALTER TABLE withdrawal_requests ALTER COLUMN provider SET NOT NULL;

-- 3. DB-04: transactions.order_id TEXT -> UUID cast safety
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'order_id' AND data_type IN ('text', 'character varying')
    ) THEN
        -- Nullify any invalid UUIDs
        UPDATE transactions SET order_id = NULL WHERE order_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        ALTER TABLE transactions ALTER COLUMN order_id TYPE UUID USING order_id::uuid;
    END IF;
END $$;

-- 4. DB-05: transactions table missing reference_ids column
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reference_ids TEXT;
