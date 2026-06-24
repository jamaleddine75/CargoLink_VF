-- Add deleted column to orders and users for soft deletion support
ALTER TABLE orders ADD COLUMN deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN deleted BOOLEAN DEFAULT FALSE;

-- Update existing records
UPDATE orders SET deleted = FALSE WHERE deleted IS NULL;
UPDATE users SET deleted = FALSE WHERE deleted IS NULL;

-- Add index for performance on filtered queries
CREATE INDEX idx_orders_deleted ON orders(deleted);
CREATE INDEX idx_users_deleted ON users(deleted);
