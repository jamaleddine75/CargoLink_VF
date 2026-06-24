-- V18: Add commission_rate column to agencies table
-- Purpose: Store agency commission rate for payment splitting

ALTER TABLE agencies ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5, 2) DEFAULT 0.15;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_agencies_commission_rate ON agencies(commission_rate);
