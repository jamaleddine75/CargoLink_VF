-- V133: Add Multi-Currency Payout Fields

ALTER TABLE withdrawal_requests 
ADD COLUMN payout_amount DECIMAL(12, 2),
ADD COLUMN payout_currency VARCHAR(10);

ALTER TABLE payout_logs 
ADD COLUMN original_amount_mad DECIMAL(12, 2),
ADD COLUMN payout_amount DECIMAL(12, 2),
ADD COLUMN payout_currency VARCHAR(10),
ADD COLUMN exchange_rate DECIMAL(12, 4);
