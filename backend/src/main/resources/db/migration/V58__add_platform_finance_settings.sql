CREATE TABLE IF NOT EXISTS platform_finance_settings (
    id UUID PRIMARY KEY,
    platform_fee_rate NUMERIC(10,4) NOT NULL DEFAULT 0.0500,
    default_agency_commission_rate NUMERIC(10,4) NOT NULL DEFAULT 0.1500,
    client_settlement_formula VARCHAR(40) NOT NULL DEFAULT 'COD_MINUS_FEE',
    auto_reconcile_daily_batch BOOLEAN NOT NULL DEFAULT TRUE,
    debt_alert_threshold NUMERIC(15,2) NOT NULL DEFAULT 1000.00,
    updated_by UUID NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO platform_finance_settings (
    id,
    platform_fee_rate,
    default_agency_commission_rate,
    client_settlement_formula,
    auto_reconcile_daily_batch,
    debt_alert_threshold
)
SELECT
    RANDOM_UUID(),
    0.0500,
    0.1500,
    'COD_MINUS_FEE',
    TRUE,
    1000.00
WHERE NOT EXISTS (SELECT 1 FROM platform_finance_settings);
