-- V45: Add validation tracking fields to orders table
-- This aligns the schema with the latest Order entity state

-- Add validated boolean column
ALTER TABLE orders 
    ADD COLUMN IF NOT EXISTS validated BOOLEAN DEFAULT FALSE;

-- Add validated_at timestamp column
ALTER TABLE orders 
    ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP DEFAULT NULL;

-- Add index for performance when filtering by validation status
CREATE INDEX IF NOT EXISTS idx_orders_validated ON orders(validated);
CREATE INDEX IF NOT EXISTS idx_orders_validated_at ON orders(validated_at DESC);

-- Update comments for clarity
COMMENT ON COLUMN orders.validated IS 'True if the order has been officially validated/approved for pickup';
COMMENT ON COLUMN orders.validated_at IS 'The timestamp when the order was validated';
