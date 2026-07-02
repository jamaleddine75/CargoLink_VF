ALTER TABLE transactions ALTER COLUMN order_id TYPE UUID USING order_id::uuid;
