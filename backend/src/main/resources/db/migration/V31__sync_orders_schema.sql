-- V31: Definitive sync of orders table with JPA entity
-- Resolves: 500 Internal Server Errors due to missing columns

ALTER TABLE orders ADD COLUMN IF NOT EXISTS barcode VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS barcode_image_path VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'PENDING';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed_by_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;

-- Idempotent Foreign Key for payment confirmation
ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_payment_confirmed_by;
ALTER TABLE orders ADD CONSTRAINT fk_orders_payment_confirmed_by FOREIGN KEY (payment_confirmed_by_id) REFERENCES users(id);
