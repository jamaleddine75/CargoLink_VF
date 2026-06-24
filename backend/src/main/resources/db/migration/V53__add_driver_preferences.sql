-- V53: Add driver preference fields and updatedAt for sync
ALTER TABLE drivers ADD COLUMN auto_accept BOOLEAN DEFAULT FALSE;
ALTER TABLE drivers ADD COLUMN notifications_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE drivers ADD COLUMN sound_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE drivers ADD COLUMN google_maps_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE drivers ADD COLUMN dark_map_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE drivers ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing rows to have a valid updated_at
UPDATE drivers SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
