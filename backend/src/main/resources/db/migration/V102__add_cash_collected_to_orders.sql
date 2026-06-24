-- V102: Add cash collection tracking fields for drivers
-- This allows drivers to explicitly mark an order as cash collected

-- Add cash_collected boolean column
ALTER TABLE orders 
    ADD COLUMN IF NOT EXISTS cash_collected BOOLEAN DEFAULT FALSE;

-- Add cash_collected_at timestamp column
ALTER TABLE orders 
    ADD COLUMN IF NOT EXISTS cash_collected_at TIMESTAMP DEFAULT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_orders_cash_collected ON orders(cash_collected);
CREATE INDEX IF NOT EXISTS idx_orders_cash_collected_at ON orders(cash_collected_at DESC);

-- Update comments for clarity
COMMENT ON COLUMN orders.cash_collected IS 'True if the driver has marked the cash as collected from the receiver';
COMMENT ON COLUMN orders.cash_collected_at IS 'The timestamp when the driver marked the cash as collected';
