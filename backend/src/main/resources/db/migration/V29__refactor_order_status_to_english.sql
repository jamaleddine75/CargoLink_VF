-- Migration to refactor order statuses from French to English
-- V29__refactor_order_status_to_english.sql

UPDATE orders SET status = 'PENDING' WHERE status = 'EN_ATTENTE';
UPDATE orders SET status = 'VALIDATED' WHERE status = 'VALIDEE';
UPDATE orders SET status = 'ASSIGNED' WHERE status = 'ASSIGNEE';
UPDATE orders SET status = 'PICKUP_READY' WHERE status = 'EN_RECUPERATION';
UPDATE orders SET status = 'ON_THE_WAY' WHERE status = 'EN_LIVRAISON';
UPDATE orders SET status = 'ARRIVED' WHERE status = 'ARRIVEE';
UPDATE orders SET status = 'DELIVERED' WHERE status = 'LIVREE';
UPDATE orders SET status = 'ISSUE' WHERE status = 'PROBLEME';
UPDATE orders SET status = 'CANCELLED' WHERE status = 'ANNULEE';
UPDATE orders SET status = 'REFUSED' WHERE status = 'REFUSEE';

-- Also update tracking_history if it exists and uses the same statuses
UPDATE tracking_history SET status = 'PENDING' WHERE status = 'EN_ATTENTE';
UPDATE tracking_history SET status = 'VALIDATED' WHERE status = 'VALIDEE';
UPDATE tracking_history SET status = 'ASSIGNED' WHERE status = 'ASSIGNEE';
UPDATE tracking_history SET status = 'PICKUP_READY' WHERE status = 'EN_RECUPERATION';
UPDATE tracking_history SET status = 'ON_THE_WAY' WHERE status = 'EN_LIVRAISON';
UPDATE tracking_history SET status = 'ARRIVED' WHERE status = 'ARRIVEE';
UPDATE tracking_history SET status = 'DELIVERED' WHERE status = 'LIVREE';
UPDATE tracking_history SET status = 'ISSUE' WHERE status = 'PROBLEME';
UPDATE tracking_history SET status = 'CANCELLED' WHERE status = 'ANNULEE';
UPDATE tracking_history SET status = 'REFUSED' WHERE status = 'REFUSEE';
