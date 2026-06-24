-- V55: Ensure all Phase 5 Proof of Delivery columns exist
-- This handles potential mismatches between JPA entities and database state

ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_proof_type VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_proof_photo_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_proof_pin VARCHAR(10);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS points_earned INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE drivers ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;

-- Ensure indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_points_earned ON orders(points_earned);
