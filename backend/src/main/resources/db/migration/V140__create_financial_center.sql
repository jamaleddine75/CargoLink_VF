-- V140: Create Financial Center Tables and Views

-- 1. Financial Audit Logs
CREATE TABLE IF NOT EXISTS financial_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_id VARCHAR(255) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    previous_value TEXT,
    new_value TEXT,
    reason TEXT,
    ip_address VARCHAR(45),
    device_info TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_financial_audit_logs_action ON financial_audit_logs(action);
CREATE INDEX idx_financial_audit_logs_target ON financial_audit_logs(target_type, target_id);
CREATE INDEX idx_financial_audit_logs_admin ON financial_audit_logs(admin_id);

-- 2. Financial Settings
CREATE TABLE IF NOT EXISTS financial_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_commission_rate DECIMAL(5, 2) DEFAULT 10.00,
    min_withdrawal_amount DECIMAL(10, 2) DEFAULT 50.00,
    min_wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
    auto_payout_enabled BOOLEAN DEFAULT FALSE,
    currency VARCHAR(10) DEFAULT 'USD',
    tax_rate DECIMAL(5, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial settings if table is empty
INSERT INTO financial_settings (platform_commission_rate, min_withdrawal_amount, currency)
SELECT 10.00, 50.00, 'MAD'
WHERE NOT EXISTS (SELECT 1 FROM financial_settings);

-- 3. Financial KPIs View
-- Real-time aggregations for the Executive Overview
CREATE OR REPLACE VIEW v_financial_kpis AS
SELECT
    (SELECT COALESCE(SUM(balance), 0) FROM wallets) AS total_wallet_balance,
    (SELECT COALESCE(SUM(amount), 0) FROM withdrawal_requests WHERE status = 'PENDING') AS pending_withdrawals_amount,
    (SELECT COUNT(*) FROM wallets WHERE status = 'FROZEN') AS frozen_wallets_count,
    (SELECT COUNT(*) FROM wallets WHERE status = 'ACTIVE') AS active_wallets_count,
    (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'COD_PAYMENT' AND status = 'PENDING') AS cod_pending_amount,
    (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'COD_PAYMENT' AND status = 'COMPLETED') AS cod_collected_amount,
    (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'COMMISSION' AND DATE(created_at) = CURRENT_DATE) AS today_revenue,
    (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'COMMISSION' AND created_at >= date_trunc('week', CURRENT_DATE)) AS weekly_revenue,
    (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'COMMISSION' AND created_at >= date_trunc('month', CURRENT_DATE)) AS monthly_revenue;

-- 4. Analytics Materialized View
-- Heavy aggregations calculated on-demand or via cron
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_analytics_summary AS
SELECT
    agency_id,
    COUNT(id) AS total_transactions,
    SUM(CASE WHEN type = 'DEPOSIT' THEN amount ELSE 0 END) AS total_deposits,
    SUM(CASE WHEN type = 'WITHDRAWAL' THEN amount ELSE 0 END) AS total_withdrawals,
    SUM(CASE WHEN type = 'COMMISSION' THEN amount ELSE 0 END) AS total_commission_paid,
    MAX(created_at) AS last_activity
FROM transactions
WHERE agency_id IS NOT NULL
GROUP BY agency_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_analytics_agency_id ON mv_analytics_summary(agency_id);

-- Additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_type_status_date ON transactions(type, status, created_at);
