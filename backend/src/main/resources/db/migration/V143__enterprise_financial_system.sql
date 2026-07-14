-- V143__enterprise_financial_system.sql
-- Enterprise Financial System Schema Extension for CargoLink

-- 1. Ledger Accounts (Chart of Accounts)
CREATE TABLE IF NOT EXISTS ledger_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- ASSET, LIABILITY, REVENUE, EXPENSE, EQUITY
    currency VARCHAR(10) NOT NULL DEFAULT 'MAD',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ledger_accounts_code ON ledger_accounts(code);
CREATE INDEX idx_ledger_accounts_type ON ledger_accounts(type);

-- Seed initial Chart of Accounts
INSERT INTO ledger_accounts (code, name, type, currency) VALUES
('PLATFORM_CASH', 'Platform Operating Cash Account', 'ASSET', 'MAD'),
('CLIENT_WALLET_LIABILITY', 'Client Deposited Wallet Liability', 'LIABILITY', 'MAD'),
('PENDING_COD_ASSET', 'Cash on Delivery Receivable in Transit', 'ASSET', 'MAD'),
('DELIVERY_FEE_REVENUE', 'Delivery Service Revenue', 'REVENUE', 'MAD'),
('PLATFORM_COMMISSION_REVENUE', 'Platform Commission Cut', 'REVENUE', 'MAD'),
('DRIVER_EARNINGS_EXPENSE', 'Driver Earning Payments Expense', 'EXPENSE', 'MAD'),
('REFUNDS_EXPENSE', 'Refund Claims Expense', 'EXPENSE', 'MAD')
ON CONFLICT (code) DO NOTHING;

-- 2. Journal Entries
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key VARCHAR(255) UNIQUE,
    description TEXT,
    reference_type VARCHAR(100),
    reference_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, POSTED, REVERSED
    created_by UUID,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    posted_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX idx_journal_ref ON journal_entries(reference_type, reference_id);

-- 3. Ledger Entries
CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id),
    ledger_account_id UUID NOT NULL REFERENCES ledger_accounts(id),
    debit DECIMAL(19, 4) NOT NULL DEFAULT 0.0000,
    credit DECIMAL(19, 4) NOT NULL DEFAULT 0.0000,
    balance_before DECIMAL(19, 4) NOT NULL DEFAULT 0.0000,
    balance_after DECIMAL(19, 4) NOT NULL DEFAULT 0.0000,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_ledger_entry_values CHECK (debit >= 0 AND credit >= 0)
);

CREATE INDEX idx_ledger_entries_account ON ledger_entries(ledger_account_id);
CREATE INDEX idx_ledger_entries_journal ON ledger_entries(journal_entry_id);

-- 4. Wallet Timeline
CREATE TABLE IF NOT EXISTS wallet_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL, -- references wallets or agency_wallets depending on scope
    amount DECIMAL(19, 4) NOT NULL DEFAULT 0.0000,
    event_type VARCHAR(100) NOT NULL, -- ORDER_CREATED, COD_COLLECTED, SETTLEMENT_COMPLETED, WITHDRAWAL_REQUESTED, etc.
    description TEXT,
    reference VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    actor VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wallet_timeline_wallet ON wallet_timeline(wallet_id);

-- 5. Fraud Alerts
CREATE TABLE IF NOT EXISTS fraud_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN', -- OPEN, INVESTIGATING, RESOLVED, DISMISSED
    reference_id VARCHAR(255),
    details TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX idx_fraud_alerts_status ON fraud_alerts(status);

-- 6. Settlement Batches
CREATE TABLE IF NOT EXISTS settlement_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_type VARCHAR(50) NOT NULL, -- DAILY, EVERY_2_DAYS, WEEKLY, MONTHLY, MANUAL
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
    total_amount DECIMAL(19, 4) NOT NULL DEFAULT 0.0000,
    processed_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Reconciliation Reports
CREATE TABLE IF NOT EXISTS reconciliation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expected_cod DECIMAL(19, 4) NOT NULL DEFAULT 0.0000,
    collected_cod DECIMAL(19, 4) NOT NULL DEFAULT 0.0000,
    difference DECIMAL(19, 4) NOT NULL DEFAULT 0.0000,
    status VARCHAR(50) NOT NULL DEFAULT 'MATCHED', -- MATCHED, DISCREPANCY
    details TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
