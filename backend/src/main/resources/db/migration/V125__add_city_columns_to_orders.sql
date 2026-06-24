-- V125__add_city_columns_to_orders.sql
-- Add senderCity and receiverCity columns for city-level filtering

-- Check if columns already exist, add them if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'sender_city'
    ) THEN
        ALTER TABLE orders ADD COLUMN sender_city VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'receiver_city'
    ) THEN
        ALTER TABLE orders ADD COLUMN receiver_city VARCHAR(100);
    END IF;
END $$;

-- Create indices for city filtering for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_sender_city ON orders(sender_city);
CREATE INDEX IF NOT EXISTS idx_orders_receiver_city ON orders(receiver_city);
CREATE INDEX IF NOT EXISTS idx_orders_city_status ON orders(sender_city, receiver_city, status);
CREATE INDEX IF NOT EXISTS idx_orders_agency_city ON orders(agency_id, receiver_city);
