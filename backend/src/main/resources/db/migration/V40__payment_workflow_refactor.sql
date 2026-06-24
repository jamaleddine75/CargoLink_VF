-- V39: Refine payment workflow for customer -> driver -> agency flows
-- Adds schema support for delivery payment statuses, COD tracking, and fast reporting.

-- Normalize and document payment status values used by the application
UPDATE orders
SET payment_status = 'PENDING'
WHERE payment_status IS NULL OR payment_status NOT IN (
    'PENDING',
    'COLLECTED_BY_DRIVER',
    'REMITTED_TO_AGENCY',
    'CONFIRMED_BY_AGENCY',
    'CANCELLED'
);

ALTER TABLE orders
    ALTER COLUMN payment_status SET DEFAULT 'PENDING';

COMMENT ON COLUMN orders.payment_status IS 'Payment workflow state: PENDING, COLLECTED_BY_DRIVER, REMITTED_TO_AGENCY, CONFIRMED_BY_AGENCY, CANCELLED';
COMMENT ON COLUMN orders.payment_confirmed_at IS 'Timestamp when agency confirmed the payment/COD workflow';
COMMENT ON COLUMN orders.payment_confirmed_by_id IS 'Agency admin or operator who confirmed the payment workflow';

-- Ensure order payment lookups stay fast
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_confirmed_at ON orders(payment_confirmed_at);
CREATE INDEX IF NOT EXISTS idx_orders_driver_payment_status ON orders(driver_id, payment_status);

-- Ensure COD and remittance tracking on transactions stays fast
ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS reference_ids TEXT;

CREATE INDEX IF NOT EXISTS idx_transactions_reference_ids
    ON transactions(reference_ids);

COMMENT ON COLUMN transactions.reference_ids IS 'Comma-separated order IDs used to group COD remittance transactions';
