-- Missing composite index for filtering orders by status and agency
-- Resolves BUG-W08: Production full table scans on common agency/status queries
CREATE INDEX IF NOT EXISTS idx_orders_status_agency ON orders(status, agency_id);

-- Performance index for driver-specific queries on orders
-- Resolves performance issues on driver dashboard mission lists
CREATE INDEX IF NOT EXISTS idx_orders_driver_status ON orders(driver_id, status);
