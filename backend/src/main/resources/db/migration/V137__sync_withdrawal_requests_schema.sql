-- V137: Sync withdrawal_requests schema with JPA entity

-- Drop obsolete columns
ALTER TABLE withdrawal_requests DROP COLUMN IF EXISTS bank_account;
ALTER TABLE withdrawal_requests DROP COLUMN IF EXISTS account_holder;

-- Add missing columns
ALTER TABLE withdrawal_requests 
    ADD COLUMN user_id UUID NOT NULL,
    ADD COLUMN payment_account_id UUID NOT NULL,
    ADD COLUMN receiver_email_snapshot VARCHAR(255) NOT NULL,
    ADD COLUMN provider VARCHAR(50) NOT NULL DEFAULT 'PAYPAL',
    ADD COLUMN paypal_batch_id VARCHAR(255),
    ADD COLUMN paypal_item_id VARCHAR(255);

-- Add Foreign Keys
ALTER TABLE withdrawal_requests 
    ADD CONSTRAINT fk_withdrawal_requests_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE withdrawal_requests 
    ADD CONSTRAINT fk_withdrawal_requests_payment_account 
    FOREIGN KEY (payment_account_id) REFERENCES payment_accounts(id) ON DELETE CASCADE;

-- Add Indexes
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_payment_account_id ON withdrawal_requests(payment_account_id);
