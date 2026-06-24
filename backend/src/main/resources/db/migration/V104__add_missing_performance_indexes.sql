-- V104: Add missing database indexes for critical performance optimization
-- Part of the MVP stabilization and performance plan

-- 1. Optimize Order queries (ensure DESC index for rapid access to recent orders)
DROP INDEX IF EXISTS idx_orders_created_at;
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- 2. Optimize Transaction history (wallet_id + date DESC for recent transactions)
-- Note: 'date' is the column name used for creation timestamp in the transactions table
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_date ON transactions(wallet_id, date DESC);

-- 3. Optimize Tracking history lookups (crucial for map polyline rendering)
CREATE INDEX IF NOT EXISTS idx_tracking_order_id ON tracking_history(order_id);

-- 4. Optimize Notification queries (filtering for unread messages)
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON notifications(recipient_id, is_read);

-- 5. Ensure core order filters have indexes (redundancy with V46 for safety)
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_agency_id ON orders(agency_id);
