-- V127: Convert order ID and all referencing foreign keys to UUID

-- 1. Dynamically drop all foreign key constraints referencing orders(id)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND ccu.table_name = 'orders'
          AND ccu.column_name = 'id'
    ) LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.table_name) || ' DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- 2. Alter primary key of orders table
ALTER TABLE orders ALTER COLUMN id TYPE UUID USING id::uuid;

-- 3. Alter foreign key columns in referencing tables to UUID
ALTER TABLE driver_ratings ALTER COLUMN order_id TYPE UUID USING order_id::uuid;
ALTER TABLE order_items ALTER COLUMN order_id TYPE UUID USING order_id::uuid;
ALTER TABLE tracking_history ALTER COLUMN order_id TYPE UUID USING order_id::uuid;
ALTER TABLE incidents ALTER COLUMN order_id TYPE UUID USING order_id::uuid;
ALTER TABLE agency_customer_invoices ALTER COLUMN order_id TYPE UUID USING order_id::uuid;
ALTER TABLE driver_earnings ALTER COLUMN order_id TYPE UUID USING order_id::uuid;
ALTER TABLE cod_reconciliations ALTER COLUMN order_id TYPE UUID USING order_id::uuid;
ALTER TABLE platform_commission_records ALTER COLUMN order_id TYPE UUID USING order_id::uuid;

-- 4. Re-create foreign key constraints with consistent names
ALTER TABLE driver_ratings ADD CONSTRAINT fk_driver_ratings_order FOREIGN KEY (order_id) REFERENCES orders(id);
ALTER TABLE order_items ADD CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id);
ALTER TABLE tracking_history ADD CONSTRAINT fk_tracking_history_order FOREIGN KEY (order_id) REFERENCES orders(id);
ALTER TABLE incidents ADD CONSTRAINT fk_incidents_order FOREIGN KEY (order_id) REFERENCES orders(id);
ALTER TABLE agency_customer_invoices ADD CONSTRAINT fk_agency_customer_invoices_order FOREIGN KEY (order_id) REFERENCES orders(id);
ALTER TABLE driver_earnings ADD CONSTRAINT fk_driver_earnings_order FOREIGN KEY (order_id) REFERENCES orders(id);
ALTER TABLE cod_reconciliations ADD CONSTRAINT fk_cod_reconciliations_order FOREIGN KEY (order_id) REFERENCES orders(id);
ALTER TABLE platform_commission_records ADD CONSTRAINT fk_pcr_order FOREIGN KEY (order_id) REFERENCES orders(id);
