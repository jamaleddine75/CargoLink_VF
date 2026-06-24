-- V42: Remove all mission/order data from the database
-- This keeps users, agencies, drivers, and wallets intact while clearing operational delivery data.
-- Refactored for H2 compatibility: replaced TRUNCATE CASCADE with ordered DELETE statements.

-- 1. Delete from child tables that reference orders or incidents
DELETE FROM assignment_history;
DELETE FROM tracking_history;
DELETE FROM order_items;

-- 2. Delete from incidents 
-- Note: incident_messages and other sub-tables are added in later migrations (e.g. V119),
-- so they don't need to be handled here.
DELETE FROM incidents;

-- 3. Remove mission-related financial entries tied to orders.
DELETE FROM transactions
WHERE order_id IS NOT NULL
   OR reference_ids IS NOT NULL;

-- Wipe all missions/orders and cascaded order-owned rows.
DELETE FROM orders;

COMMIT;
