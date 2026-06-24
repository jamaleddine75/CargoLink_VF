-- V28__final_status_unification.sql
-- Ensure all order statuses are consistently French in the database
-- This completes Phase A task B-10

-- 1. Sync Orders table
UPDATE orders SET status = 'EN_ATTENTE' WHERE status IN ('PENDING', 'WAITING_FOR_DRIVER', 'WAITING');
UPDATE orders SET status = 'VALIDEE' WHERE status = 'VALIDATED';
UPDATE orders SET status = 'ASSIGNEE' WHERE status IN ('ASSIGNED');
UPDATE orders SET status = 'EN_RECUPERATION' WHERE status IN ('PICKING_UP', 'PICKUP_READY', 'AWAITING_PICKUP');
UPDATE orders SET status = 'EN_LIVRAISON' WHERE status IN ('ON_THE_WAY', 'EN_ROUTE_DELIVERY');
UPDATE orders SET status = 'ARRIVEE' WHERE status = 'ARRIVED';
UPDATE orders SET status = 'LIVREE' WHERE status IN ('DELIVERED', 'COMPLETED');
UPDATE orders SET status = 'PROBLEME' WHERE status = 'ISSUE';
UPDATE orders SET status = 'ANNULEE' WHERE status = 'CANCELLED';
UPDATE orders SET status = 'REFUSEE' WHERE status = 'REFUSED';

-- 2. Sync tracking_history table
UPDATE tracking_history SET status = 'EN_ATTENTE' WHERE status IN ('PENDING', 'WAITING_FOR_DRIVER', 'WAITING');
UPDATE tracking_history SET status = 'VALIDEE' WHERE status = 'VALIDATED';
UPDATE tracking_history SET status = 'ASSIGNEE' WHERE status IN ('ASSIGNED');
UPDATE tracking_history SET status = 'EN_RECUPERATION' WHERE status IN ('PICKING_UP', 'PICKUP_READY', 'AWAITING_PICKUP');
UPDATE tracking_history SET status = 'EN_LIVRAISON' WHERE status IN ('ON_THE_WAY', 'EN_ROUTE_DELIVERY');
UPDATE tracking_history SET status = 'ARRIVEE' WHERE status = 'ARRIVED';
UPDATE tracking_history SET status = 'LIVREE' WHERE status IN ('DELIVERED', 'COMPLETED');
UPDATE tracking_history SET status = 'PROBLEME' WHERE status = 'ISSUE';
UPDATE tracking_history SET status = 'ANNULEE' WHERE status = 'CANCELLED';
UPDATE tracking_history SET status = 'REFUSEE' WHERE status = 'REFUSED';
