-- Find and delete duplicate wallets, keeping the oldest one for each user
DELETE FROM wallets
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) as rnum
        FROM wallets
    ) t
    WHERE t.rnum > 1
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE wallets ADD CONSTRAINT uk_wallets_user_id UNIQUE (user_id);
