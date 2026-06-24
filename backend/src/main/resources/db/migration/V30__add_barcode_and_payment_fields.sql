-- Add missing payment and barcode fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS barcode VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS barcode_image_path VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'PENDING';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed_by_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;

-- Add foreign key for payment_confirmed_by_id
ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_payment_confirmed_by;
ALTER TABLE orders ADD CONSTRAINT fk_orders_payment_confirmed_by FOREIGN KEY (payment_confirmed_by_id) REFERENCES users(id);

