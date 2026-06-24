-- V124__internal_billing_accounting_system.sql
-- Internal Billing and Accounting System for Agencies
-- Business Model: Customer pays Agency, Agency pays Drivers, Platform takes 5% commission per delivery.

-- 1. AgencyCustomerInvoice
CREATE TABLE IF NOT EXISTS agency_customer_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) NOT NULL,
    agency_id UUID NOT NULL REFERENCES agencies(id),
    customer_id UUID NOT NULL REFERENCES agency_customers(id),
    order_id VARCHAR(255) REFERENCES orders(id),
    issue_date TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP WITHOUT TIME ZONE,
    subtotal DECIMAL(19, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(19, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(19, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(19, 2) NOT NULL DEFAULT 0.00,
    amount_paid DECIMAL(19, 2) NOT NULL DEFAULT 0.00,
    amount_due DECIMAL(19, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, SENT, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT uk_agency_invoice_number UNIQUE (agency_id, invoice_number),
    CONSTRAINT chk_invoice_amounts_non_negative CHECK (subtotal >= 0 AND tax_amount >= 0 AND discount_amount >= 0 AND total_amount >= 0 AND amount_paid >= 0 AND amount_due >= 0)
);

-- 2. AgencyCustomerPayment
CREATE TABLE IF NOT EXISTS agency_customer_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES agency_customer_invoices(id),
    agency_id UUID NOT NULL REFERENCES agencies(id),
    customer_id UUID NOT NULL REFERENCES agency_customers(id),
    amount DECIMAL(19, 2) NOT NULL,
    payment_method VARCHAR(50), -- CASH, BANK_TRANSFER, ONLINE, etc.
    reference VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, SUCCESS, FAILED, REFUNDED
    paid_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT chk_payment_amount_positive CHECK (amount > 0)
);

-- 3. DriverEarning
CREATE TABLE IF NOT EXISTS driver_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id),
    driver_id UUID NOT NULL REFERENCES drivers(id),
    order_id VARCHAR(255) REFERENCES orders(id),
    base_amount DECIMAL(19, 2) NOT NULL DEFAULT 0.00,
    commission_amount DECIMAL(19, 2) NOT NULL DEFAULT 0.00,
    bonus_amount DECIMAL(19, 2) NOT NULL DEFAULT 0.00,
    penalty_amount DECIMAL(19, 2) NOT NULL DEFAULT 0.00,
    net_amount DECIMAL(19, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, PAID
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE
);

-- 4. AgencyLedgerTransaction
CREATE TABLE IF NOT EXISTS agency_ledger_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id),
    transaction_type VARCHAR(50) NOT NULL, -- CUSTOMER_PAYMENT, DRIVER_EARNING, COD_RECEIPT, PENALTY, BONUS, REFUND, ADJUSTMENT, COMMISSION, EXPENSE, INCOME, PLATFORM_FEE
    reference_type VARCHAR(50),
    reference_id UUID,
    description TEXT,
    debit DECIMAL(19, 2) DEFAULT 0.00,
    credit DECIMAL(19, 2) DEFAULT 0.00,
    balance_after DECIMAL(19, 2),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. AgencyWallet (Updating existing table from V16)
-- We add the new fields requested by the user.
ALTER TABLE agency_wallets ADD COLUMN IF NOT EXISTS current_balance DECIMAL(19, 2) DEFAULT 0.00;
ALTER TABLE agency_wallets ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(19, 2) DEFAULT 0.00;
ALTER TABLE agency_wallets ADD COLUMN IF NOT EXISTS total_expenses DECIMAL(19, 2) DEFAULT 0.00;
ALTER TABLE agency_wallets ADD COLUMN IF NOT EXISTS total_profit DECIMAL(19, 2) DEFAULT 0.00;
ALTER TABLE agency_wallets ADD COLUMN IF NOT EXISTS pending_receivables DECIMAL(19, 2) DEFAULT 0.00;
ALTER TABLE agency_wallets ADD COLUMN IF NOT EXISTS pending_payables DECIMAL(19, 2) DEFAULT 0.00;

-- 6. CODReconciliation
CREATE TABLE IF NOT EXISTS cod_reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id),
    order_id VARCHAR(255) REFERENCES orders(id),
    driver_id UUID NOT NULL REFERENCES drivers(id),
    expected_amount DECIMAL(19, 2) NOT NULL DEFAULT 0.00,
    received_amount DECIMAL(19, 2) NOT NULL DEFAULT 0.00,
    difference_amount DECIMAL(19, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, MATCHED, MISMATCHED, CONFIRMED
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_cod_amounts_non_negative CHECK (expected_amount >= 0 AND received_amount >= 0)
);

-- 7. DriverFinancialRecord
CREATE TABLE IF NOT EXISTS driver_financial_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id),
    driver_id UUID NOT NULL REFERENCES drivers(id),
    total_earnings DECIMAL(19, 2) DEFAULT 0.00,
    total_paid DECIMAL(19, 2) DEFAULT 0.00,
    total_penalties DECIMAL(19, 2) DEFAULT 0.00,
    total_bonuses DECIMAL(19, 2) DEFAULT 0.00,
    outstanding_balance DECIMAL(19, 2) DEFAULT 0.00,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_agency_driver_financial UNIQUE (agency_id, driver_id),
    CONSTRAINT fk_dfr_agency FOREIGN KEY (agency_id) REFERENCES agencies(id),
    CONSTRAINT fk_dfr_driver FOREIGN KEY (driver_id) REFERENCES drivers(id)
);

-- 8. PlatformCommissionRecord
CREATE TABLE IF NOT EXISTS platform_commission_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id),
    order_id VARCHAR(255) REFERENCES orders(id),
    gross_amount DECIMAL(19, 2) NOT NULL,
    platform_fee_rate DECIMAL(19, 4) DEFAULT 0.0500, -- 5% commission
    platform_fee_amount DECIMAL(19, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, CALCULATED, SETTLED
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pcr_agency FOREIGN KEY (agency_id) REFERENCES agencies(id),
    CONSTRAINT fk_pcr_order FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_aci_agency_id ON agency_customer_invoices(agency_id);
CREATE INDEX IF NOT EXISTS idx_aci_customer_id ON agency_customer_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_aci_invoice_number ON agency_customer_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_aci_status ON agency_customer_invoices(status);
CREATE INDEX IF NOT EXISTS idx_aci_created_at ON agency_customer_invoices(created_at);

CREATE INDEX IF NOT EXISTS idx_acp_invoice_id ON agency_customer_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_acp_agency_id ON agency_customer_payments(agency_id);
CREATE INDEX IF NOT EXISTS idx_acp_status ON agency_customer_payments(status);
CREATE INDEX IF NOT EXISTS idx_acp_method ON agency_customer_payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_acp_created_at ON agency_customer_payments(created_at);

CREATE INDEX IF NOT EXISTS idx_de_agency_id ON driver_earnings(agency_id);
CREATE INDEX IF NOT EXISTS idx_de_driver_id ON driver_earnings(driver_id);
CREATE INDEX IF NOT EXISTS idx_de_order_id ON driver_earnings(order_id);
CREATE INDEX IF NOT EXISTS idx_de_status ON driver_earnings(status);
CREATE INDEX IF NOT EXISTS idx_de_created_at ON driver_earnings(created_at);

CREATE INDEX IF NOT EXISTS idx_alt_agency_id ON agency_ledger_transactions(agency_id);
CREATE INDEX IF NOT EXISTS idx_alt_type ON agency_ledger_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_alt_ref_id ON agency_ledger_transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_alt_created_at ON agency_ledger_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_cod_agency_id ON cod_reconciliations(agency_id);
CREATE INDEX IF NOT EXISTS idx_cod_order_id ON cod_reconciliations(order_id);
CREATE INDEX IF NOT EXISTS idx_cod_status ON cod_reconciliations(status);

CREATE INDEX IF NOT EXISTS idx_dfr_agency_id ON driver_financial_records(agency_id);
CREATE INDEX IF NOT EXISTS idx_dfr_driver_id ON driver_financial_records(driver_id);

CREATE INDEX IF NOT EXISTS idx_pcr_agency_id ON platform_commission_records(agency_id);
CREATE INDEX IF NOT EXISTS idx_pcr_order_id ON platform_commission_records(order_id);
CREATE INDEX IF NOT EXISTS idx_pcr_status ON platform_commission_records(status);
CREATE INDEX IF NOT EXISTS idx_pcr_created_at ON platform_commission_records(created_at);
