-- V123: Add advanced metadata and operational columns to agencies table
-- Purpose: Support unified agency management wizard and detailed configuration

ALTER TABLE agencies ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS sector VARCHAR(100);
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS agency_type VARCHAR(50) DEFAULT 'STANDARD';
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS max_drivers INTEGER DEFAULT 10;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS max_daily_orders INTEGER DEFAULT 100;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS opening_hour VARCHAR(10) DEFAULT '08:00';
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS closing_hour VARCHAR(10) DEFAULT '18:00';
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS working_days TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS manager_salary DECIMAL(10, 2);
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS manager_bonus DECIMAL(10, 2);
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS auto_dispatch BOOLEAN DEFAULT TRUE;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS max_concurrent_deliveries INTEGER DEFAULT 5;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS max_employees INTEGER DEFAULT 10;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS operational_status VARCHAR(50) DEFAULT 'ACTIVE';
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS notes TEXT;

-- Seed default values for existing records
UPDATE agencies SET agency_type = 'STANDARD' WHERE agency_type IS NULL;
UPDATE agencies SET opening_hour = '08:00', closing_hour = '18:00' WHERE opening_hour IS NULL;
UPDATE agencies SET max_drivers = 10, max_daily_orders = 100 WHERE max_drivers IS NULL;
UPDATE agencies SET auto_dispatch = TRUE WHERE auto_dispatch IS NULL;
UPDATE agencies SET operational_status = 'ACTIVE' WHERE operational_status IS NULL;
