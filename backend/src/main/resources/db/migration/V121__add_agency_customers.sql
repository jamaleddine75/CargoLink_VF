-- Create agency_customers table
CREATE TABLE IF NOT EXISTS agency_customers (
    id UUID PRIMARY KEY,
    agency_id UUID NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    city VARCHAR(255),
    address VARCHAR(255),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL,
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(19,2) DEFAULT 0.00,
    success_rate DOUBLE PRECISION DEFAULT 0.0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_agency_customer_agency FOREIGN KEY (agency_id) REFERENCES agencies(id)
);

-- Add customer_id to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE orders ADD CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES agency_customers(id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_agency_customers_agency_id ON agency_customers(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_customers_phone ON agency_customers(phone);
CREATE INDEX IF NOT EXISTS idx_agency_customers_email ON agency_customers(email);
CREATE INDEX IF NOT EXISTS idx_agency_customers_status ON agency_customers(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
