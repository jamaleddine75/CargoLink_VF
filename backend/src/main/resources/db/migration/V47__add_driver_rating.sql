-- Add rating fields to drivers table
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS rating DOUBLE PRECISION DEFAULT 4.8;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- Create driver_ratings table
CREATE TABLE IF NOT EXISTS driver_ratings (
    id UUID PRIMARY KEY,
    driver_id UUID NOT NULL REFERENCES drivers(id),
    client_id UUID NOT NULL REFERENCES users(id),
    order_id VARCHAR(255) NOT NULL REFERENCES orders(id),
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE
);
