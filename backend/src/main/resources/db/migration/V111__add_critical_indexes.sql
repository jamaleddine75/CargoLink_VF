-- Critical performance indexes for orders, transactions, tracking, and notifications

CREATE INDEX IF NOT EXISTS idx_orders_status
    ON orders(status);

CREATE INDEX IF NOT EXISTS idx_orders_client_id
    ON orders(client_id);

CREATE INDEX IF NOT EXISTS idx_orders_driver_id
    ON orders(driver_id);

CREATE INDEX IF NOT EXISTS idx_orders_agency_id
    ON orders(agency_id);

CREATE INDEX IF NOT EXISTS idx_orders_created_at
    ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_wallet_created
    ON transactions(wallet_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_tracking_order_id
    ON tracking_history(order_id);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read
    ON notifications(recipient_id, is_read);
