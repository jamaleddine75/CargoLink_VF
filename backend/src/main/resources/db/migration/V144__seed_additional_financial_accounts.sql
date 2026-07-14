-- V144__seed_additional_financial_accounts.sql
-- Seed extra accounts for new double entry flow

INSERT INTO ledger_accounts (code, name, type, currency) VALUES
('CASH_IN_TRANSIT', 'Cash In Transit', 'ASSET', 'MAD'),
('MERCHANT_PAYABLE', 'Merchant Payable', 'LIABILITY', 'MAD'),
('DRIVER_PAYROLL_PAYABLE', 'Driver Payroll Payable', 'LIABILITY', 'MAD'),
('PLATFORM_REVENUE', 'Platform Revenue', 'REVENUE', 'MAD')
ON CONFLICT (code) DO NOTHING;
