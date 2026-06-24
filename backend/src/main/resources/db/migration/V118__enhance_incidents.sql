-- V118__enhance_incidents.sql

-- Add new columns to support comprehensive incident management
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'MEDIUM';
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS attachments TEXT;

-- Create an index for faster querying by priority and assigned_to
CREATE INDEX IF NOT EXISTS idx_incidents_priority ON incidents(priority);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned_to ON incidents(assigned_to);
