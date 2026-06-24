-- V26__align_order_statuses.sql
-- Align order statuses with French names used in the frontend

-- Update orders table
UPDATE orders SET status = 'EN_ATTENTE' WHERE status IN ('PENDING', 'WAITING_FOR_DRIVER', 'WAITING');
UPDATE orders SET status = 'ASSIGNEE' WHERE status IN ('ASSIGNED', 'VALIDEE');
UPDATE orders SET status = 'EN_RECUPERATION' WHERE status IN ('PICKING_UP', 'PICKUP_READY', 'EN_ROUTE_PICKUP', 'PICKUP_COMPLETE', 'AWAITING_PICKUP');
UPDATE orders SET status = 'EN_LIVRAISON' WHERE status IN ('ON_THE_WAY', 'EN_ROUTE_DELIVERY');
UPDATE orders SET status = 'LIVREE' WHERE status IN ('DELIVERED');
UPDATE orders SET status = 'PROBLEME' WHERE status IN ('ISSUE');
UPDATE orders SET status = 'ANNULEE' WHERE status IN ('CANCELLED');
UPDATE orders SET status = 'REFUSEE' WHERE status IN ('REFUSED');
-- ARRIVED stays as ARRIVED or we can make it French too? 
-- The user didn't list it in the "French-named statuses" list but it's used in the flow.
-- For now, I'll keep it as ARRIVED to avoid breaking the frontend flow which specifically sends 'ARRIVED'.

-- Update tracking_history table
UPDATE tracking_history SET status = 'EN_ATTENTE' WHERE status IN ('PENDING', 'WAITING_FOR_DRIVER', 'WAITING');
UPDATE tracking_history SET status = 'ASSIGNEE' WHERE status IN ('ASSIGNED', 'VALIDEE');
UPDATE tracking_history SET status = 'EN_RECUPERATION' WHERE status IN ('PICKING_UP', 'PICKUP_READY', 'EN_ROUTE_PICKUP', 'PICKUP_COMPLETE', 'AWAITING_PICKUP');
UPDATE tracking_history SET status = 'EN_LIVRAISON' WHERE status IN ('ON_THE_WAY', 'EN_ROUTE_DELIVERY');
UPDATE tracking_history SET status = 'LIVREE' WHERE status IN ('DELIVERED');
UPDATE tracking_history SET status = 'PROBLEME' WHERE status IN ('ISSUE');
UPDATE tracking_history SET status = 'ANNULEE' WHERE status IN ('CANCELLED');
UPDATE tracking_history SET status = 'REFUSEE' WHERE status IN ('REFUSED');
