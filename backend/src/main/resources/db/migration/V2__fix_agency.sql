-- V2: Fix Agency table schema

-- Rename column user_id to admin_agency_id
ALTER TABLE agencies RENAME COLUMN user_id TO admin_agency_id;

-- Add contact_info column if it does not exist
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS contact_info TEXT;
