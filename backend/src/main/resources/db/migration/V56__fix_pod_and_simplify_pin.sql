-- V56: Comprehensive Proof of Delivery System Stabilization
-- Ensures all Phase 5 columns exist and resets test data for the driver proof workflow

-- 1. Ensure all columns exist in 'orders' table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_proof_type VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_proof_photo_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_proof_pin VARCHAR(10) DEFAULT '0000';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITHOUT TIME ZONE;

-- 2. Ensure loyalty points exist for drivers
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;

-- 3. Reset any stuck orders for testing
-- This sets orders that are not DELIVERED back to ON_THE_WAY if they have a driver
-- allowing the user to test the POD page immediately.
UPDATE orders 
SET status = 'ON_THE_WAY', 
    delivery_proof_pin = '0000'
WHERE driver_id IS NOT NULL 
  AND status NOT IN ('DELIVERED', 'CANCELLED', 'RETURNED');

-- 4. Create indexes for performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_orders_delivery_proof_type ON orders(delivery_proof_type);
CREATE INDEX IF NOT EXISTS idx_orders_delivered_at ON orders(delivered_at);
