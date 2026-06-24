-- Migrate wallets to use user_id instead of driver_id
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS wallet_type VARCHAR(20) DEFAULT 'DRIVER';

-- Try to migrate data if driver_id exists
UPDATE wallets w 
SET user_id = (SELECT d.user_id FROM drivers d WHERE d.id = w.driver_id) 
WHERE w.user_id IS NULL 
AND EXISTS (SELECT 1 FROM drivers d WHERE d.id = w.driver_id);


-- Make user_id NOT NULL if we are sure there are no orphaned wallets, but it's safer to just let Hibernate enforce it or clean them up.
-- For safety, we will leave it as is, or we can drop driver_id if we want.
-- ALTER TABLE wallets ALTER COLUMN user_id SET NOT NULL;
