-- Remove obsolete driver_id from withdrawal_requests to fully transition to User-based withdrawals
ALTER TABLE withdrawal_requests DROP COLUMN driver_id;
