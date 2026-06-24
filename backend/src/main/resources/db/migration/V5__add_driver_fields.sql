-- V5: Add missing fields to drivers table
-- Align with JPA Driver entity

ALTER TABLE drivers ADD COLUMN license_number VARCHAR(100);
ALTER TABLE drivers ADD COLUMN documents TEXT;
ALTER TABLE drivers ADD COLUMN verification_status VARCHAR(50) DEFAULT 'PENDING';
ALTER TABLE drivers ADD COLUMN rejection_reason TEXT;

-- Index for verification status filtering
CREATE INDEX idx_drivers_verification_status ON drivers(verification_status);
