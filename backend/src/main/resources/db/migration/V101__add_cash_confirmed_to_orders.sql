-- V101: Add cash confirmation tracking fields to orders table
-- This allows tracking when COD payments are confirmed by an administrator or agency

-- Add cash_confirmed boolean column
ALTER TABLE orders 
    ADD COLUMN IF NOT EXISTS cash_confirmed BOOLEAN DEFAULT FALSE;

-- Add cash_confirmed_at timestamp column
ALTER TABLE orders 
    ADD COLUMN IF NOT EXISTS cash_confirmed_at TIMESTAMP DEFAULT NULL;

-- Add index for performance when filtering by cash confirmation status
CREATE INDEX IF NOT EXISTS idx_orders_cash_confirmed ON orders(cash_confirmed);
CREATE INDEX IF NOT EXISTS idx_orders_cash_confirmed_at ON orders(cash_confirmed_at DESC);

-- Update comments for clarity
COMMENT ON COLUMN orders.cash_confirmed IS 'True if the COD cash payment has been confirmed by an authorized person';
COMMENT ON COLUMN orders.cash_confirmed_at IS 'The timestamp when the cash payment was confirmed';
