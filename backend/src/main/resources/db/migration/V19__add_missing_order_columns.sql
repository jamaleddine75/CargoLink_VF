-- V19: Add missing columns to orders table for Phase 5 compatibility
-- This migration ensures all Order entity fields have corresponding database columns

-- Add delivery_fee column if not exists
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee DOUBLE PRECISION;

-- Re-add delivered_at if V17 update didn't apply properly
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP DEFAULT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_delivered_at ON orders(delivered_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_at ON orders(assigned_at DESC);
