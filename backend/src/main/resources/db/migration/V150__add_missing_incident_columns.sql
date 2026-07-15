-- V150__add_missing_incident_columns.sql
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS resolution VARCHAR(255);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE;
