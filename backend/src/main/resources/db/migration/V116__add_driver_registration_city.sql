-- Add registration_city to drivers for region-based agency auto-assignment
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS registration_city VARCHAR(100);

-- Make agency_id nullable so drivers can register without a matching agency
-- (orphan drivers are then manually assigned by admin)
ALTER TABLE drivers ALTER COLUMN agency_id DROP NOT NULL;
