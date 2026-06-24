-- Add Proof of Delivery fields to Tracking History
-- Add Proof of Delivery fields to Tracking History
ALTER TABLE tracking_history ADD COLUMN IF NOT EXISTS scan_value VARCHAR(255);
ALTER TABLE tracking_history ADD COLUMN IF NOT EXISTS comment TEXT;

-- Add category to incidents if needed
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS category VARCHAR(100);

