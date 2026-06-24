-- V103: Add missing columns to agencies table to align with JPA Entity
-- Purpose: Support full agency profiles and address details

ALTER TABLE agencies ADD COLUMN IF NOT EXISTS tax_id VARCHAR(100);
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS country VARCHAR(100);

-- Update existing records with default values if necessary
UPDATE agencies SET country = 'Morocco' WHERE country IS NULL;
UPDATE agencies SET city = 'Casablanca' WHERE city IS NULL AND address LIKE '%Casablanca%';
