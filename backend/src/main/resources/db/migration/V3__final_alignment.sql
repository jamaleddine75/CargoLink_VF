-- V3: Add missing supporting tables
-- Ensures notifications, client_profiles, and order_items exist

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY,
    recipient_id UUID REFERENCES users(id),
    message TEXT NOT NULL,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS client_profiles (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) UNIQUE,
    company_name VARCHAR(255),
    billing_address TEXT,
    tax_id VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY,
    order_id VARCHAR(255) REFERENCES orders(id),
    item_name VARCHAR(255),
    quantity INTEGER,
    weight DOUBLE PRECISION,
    description TEXT
);
