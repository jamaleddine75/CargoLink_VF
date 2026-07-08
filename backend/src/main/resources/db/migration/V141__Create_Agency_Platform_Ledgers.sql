-- V141: Create independent ledger tables for Agency and Platform to support Event-Driven Financial Engine without breaking User transactions.

CREATE TABLE agency_transactions (
    id UUID PRIMARY KEY,
    agency_wallet_id UUID NOT NULL REFERENCES agency_wallets(id),
    amount DECIMAL(19, 2) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    order_id UUID,
    reference_id UUID,
    date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agency_transactions_wallet ON agency_transactions(agency_wallet_id);
CREATE INDEX idx_agency_transactions_type ON agency_transactions(type);
CREATE INDEX idx_agency_transactions_date ON agency_transactions(date);

CREATE TABLE platform_transactions (
    id UUID PRIMARY KEY,
    platform_wallet_id UUID NOT NULL REFERENCES platform_wallet(id),
    amount DECIMAL(19, 2) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    order_id UUID,
    reference_id UUID,
    date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_platform_transactions_wallet ON platform_transactions(platform_wallet_id);
CREATE INDEX idx_platform_transactions_type ON platform_transactions(type);
CREATE INDEX idx_platform_transactions_date ON platform_transactions(date);
