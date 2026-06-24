-- V48: Sync schema with JPA entities and refactor status constraints
-- Purpose: Support Address Book, Advanced Analytics, and Enum-based Status flows

-- 1. Order City Fields (Supporting reporting and filtering)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sender_city VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receiver_city VARCHAR(100);

-- 2. Transaction Enhancements
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reference_ids TEXT;

-- 3. Transaction Metadata Table (For internal system mappings)
CREATE TABLE IF NOT EXISTS transaction_metadata (
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    metadata_key VARCHAR(255) NOT NULL,
    metadata_value TEXT,
    PRIMARY KEY (transaction_id, metadata_key)
);

-- 4. Fix Withdrawal Request Constraints
-- The previous check constraint only allowed 'PENDING', 'COMPLETED', 'REJECTED', 'FAILED'
-- We added 'PROCESSING' and 'REMITTED' in code, so we must expand the DB constraint.
-- Drop the existing constraint if it exists
ALTER TABLE withdrawal_requests DROP CONSTRAINT IF EXISTS withdrawal_requests_status_check;

-- Add the expanded constraint
ALTER TABLE withdrawal_requests 
ADD CONSTRAINT withdrawal_requests_status_check 
CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'REMITTED', 'REJECTED', 'FAILED'));


-- 5. Saved Addresses (Address Book Feature)
CREATE TABLE IF NOT EXISTS saved_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    contact_name VARCHAR(255),
    contact_phone VARCHAR(20),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saved_addresses_user ON saved_addresses(user_id);
