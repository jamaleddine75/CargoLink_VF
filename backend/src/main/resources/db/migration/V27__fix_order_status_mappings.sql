-- V27: Final alignment of order statuses with Java OrderStatus enum
-- This migration fixes the "No enum constant" errors by converting legacy strings to French enum names

-- 1. Sync Orders table
UPDATE orders SET status = 'EN_ATTENTE' WHERE status IN ('PENDING', 'WAITING_FOR_DRIVER', 'WAITING');
UPDATE orders SET status = 'VALIDEE' WHERE status = 'VALIDATED';
UPDATE orders SET status = 'ASSIGNEE' WHERE status IN ('ASSIGNED', 'ASSIGNEE');
UPDATE orders SET status = 'EN_LIVRAISON' WHERE status = 'ON_THE_WAY';
UPDATE orders SET status = 'EN_RECUPERATION' WHERE status = 'PICKING_UP';
UPDATE orders SET status = 'LIVREE' WHERE status IN ('DELIVERED', 'COMPLETED');
UPDATE orders SET status = 'ANNULEE' WHERE status = 'CANCELLED';
UPDATE orders SET status = 'REFUSEE' WHERE status = 'REFUSED';

-- 1.1 Sync Driver and User statuses
-- Ensure driver statuses match Java DriverStatus enum (ONLINE/OFFLINE)
-- availability enum: AVAILABLE, BUSY, OFFLINE
UPDATE drivers SET status = 'ONLINE' WHERE status IN ('AVAILABLE', 'ONLINE');
UPDATE drivers SET status = 'OFFLINE' WHERE status IN ('OFFLINE', 'UNAVAILABLE')
;

-- Update legacy driver_status column if it exists to be consistent
UPDATE drivers SET driver_status = status;


UPDATE users SET status = 'ACTIVE' WHERE status IN ('APPROVED', 'ACTIVATED', 'A
CTIVE');
UPDATE users SET status = 'INACTIVE' WHERE status IN ('PENDING', 'INACTIVE');

-- 2. Sync tracking_history table
UPDATE tracking_history SET status = 'EN_ATTENTE' WHERE status IN ('PENDING', 'WAITING_FOR_DRIVER', 'WAITING');
UPDATE tracking_history SET status = 'VALIDEE' WHERE status = 'VALIDATED';
UPDATE tracking_history SET status = 'ASSIGNEE' WHERE status IN ('ASSIGNED', 'ASSIGNEE');
UPDATE tracking_history SET status = 'EN_LIVRAISON' WHERE status = 'ON_THE_WAY';
UPDATE tracking_history SET status = 'EN_RECUPERATION' WHERE status = 'PICKING_UP';
UPDATE tracking_history SET status = 'LIVREE' WHERE status IN ('DELIVERED', 'COMPLETED');
UPDATE tracking_history SET status = 'ANNULEE' WHERE status = 'CANCELLED';
UPDATE tracking_history SET status = 'REFUSEE' WHERE status = 'REFUSED';
