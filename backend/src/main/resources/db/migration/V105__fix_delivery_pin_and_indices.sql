-- V105: Increase delivery_proof_pin size for hashed values and add missing indexes
ALTER TABLE orders ALTER COLUMN delivery_proof_pin TYPE VARCHAR(255);

-- Ensure critical indexes exist (safety check)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_date ON transactions(wallet_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_order_id ON tracking_history(order_id);
