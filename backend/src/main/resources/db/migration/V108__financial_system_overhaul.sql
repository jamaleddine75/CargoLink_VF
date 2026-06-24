-- Create platform_wallet table
CREATE TABLE IF NOT EXISTS platform_wallet (
    id UUID PRIMARY KEY,
    balance DECIMAL(19, 2) NOT NULL DEFAULT 0.00,
    total_revenue DECIMAL(19, 2) NOT NULL DEFAULT 0.00,
    platform_profit DECIMAL(19, 2) NOT NULL DEFAULT 0.00,
    total_driver_payout DECIMAL(19, 2) NOT NULL DEFAULT 0.00,
    total_agency_payout DECIMAL(19, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP
);

-- Initialize global wallet
INSERT INTO platform_wallet (id, balance, total_revenue, platform_profit, total_driver_payout, total_agency_payout, updated_at)
SELECT gen_random_uuid(), 0.00, 0.00, 0.00, 0.00, 0.00, NOW()
WHERE NOT EXISTS (SELECT 1 FROM platform_wallet);
