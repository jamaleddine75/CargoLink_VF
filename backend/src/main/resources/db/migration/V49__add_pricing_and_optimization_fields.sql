-- V49: Add Product Management and Optimization fields
-- Purpose: Support Product Catalog, Route Optimization sequencing, and real-time ETA

-- 1. Products Table (Product Catalog Feature)
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DOUBLE PRECISION,
    category VARCHAR(100),
    image_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Pricing Configs Table (Dynamic Pricing)
CREATE TABLE IF NOT EXISTS pricing_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    base_delivery_fee DOUBLE PRECISION,
    price_per_km DOUBLE PRECISION,
    cod_handling_fee DOUBLE PRECISION,
    urgent_delivery_fee DOUBLE PRECISION,
    heavy_package_fee DOUBLE PRECISION,
    earnings_model VARCHAR(50),
    driver_percentage DOUBLE PRECISION,
    driver_base_fee DOUBLE PRECISION,
    driver_rate_per_km DOUBLE PRECISION,
    active BOOLEAN DEFAULT TRUE
);

-- 3. Optimization and ETA Fields for Orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sequence_index INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS current_eta TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delay_alert_sent BOOLEAN DEFAULT FALSE;

-- 4. Indexes for new fields
CREATE INDEX IF NOT EXISTS idx_orders_sequence ON orders(sequence_index);
CREATE INDEX IF NOT EXISTS idx_orders_eta ON orders(current_eta);
