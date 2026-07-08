-- V133: Add Multi-Currency Payout Fields

ALTER TABLE withdrawal_requests 
ADD COLUMN payout_amount DECIMAL(12, 2),
ADD COLUMN payout_currency VARCHAR(10);

CREATE TABLE IF NOT EXISTS payout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    withdrawal_id UUID NOT NULL,
    original_amount_mad DECIMAL(12, 2),
    payout_amount DECIMAL(12, 2),
    payout_currency VARCHAR(10),
    exchange_rate DECIMAL(12, 4),
    paypal_batch_id VARCHAR(255),
    paypal_item_id VARCHAR(255),
    paypal_debug_id VARCHAR(255),
    http_status INTEGER,
    retry_count INTEGER NOT NULL DEFAULT 0,
    request_payload TEXT,
    response_payload TEXT,
    webhook_payload TEXT,
    status VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
