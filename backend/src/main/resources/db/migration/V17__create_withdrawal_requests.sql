-- V17: Create withdrawal_requests table for Phase 5 Driver Earnings
-- Purpose: Track driver withdrawal requests for payout processing

CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    driver_id UUID NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    bank_account VARCHAR(255) NOT NULL,
    account_holder VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'REJECTED', 'FAILED')),
    rejection_reason VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for query optimization (use IF NOT EXISTS to avoid conflicts)
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_driver_id ON withdrawal_requests(driver_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON withdrawal_requests(created_at DESC);

-- Add withdrawal proof fields to orders table (if not already present)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_proof_type VARCHAR(50) DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_proof_photo_url VARCHAR(500) DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_proof_pin VARCHAR(255) DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP DEFAULT NULL;

-- Add index for delivery status queries
CREATE INDEX IF NOT EXISTS idx_orders_driver_status ON orders(driver_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
