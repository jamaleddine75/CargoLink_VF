-- V50: Add missing Order fields
-- Purpose: Support urgent and heavy flags in orders table as defined in JPA entity

ALTER TABLE orders ADD COLUMN IF NOT EXISTS urgent BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS heavy BOOLEAN DEFAULT FALSE;

-- Also add index for performance on these flags
CREATE INDEX IF NOT EXISTS idx_orders_urgent ON orders(urgent);
CREATE INDEX IF NOT EXISTS idx_orders_heavy ON orders(heavy);
