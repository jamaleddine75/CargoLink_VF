-- V136: Create payment_accounts table
-- Maps to com.deliveryplatform.domain.entity.PaymentAccount

CREATE TABLE IF NOT EXISTS payment_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    provider VARCHAR(50) NOT NULL,
    account_identifier VARCHAR(255) NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMP WITHOUT TIME ZONE,
    verification_status VARCHAR(50),
    provider_user_id VARCHAR(100),
    is_default BOOLEAN NOT NULL DEFAULT false,
    preferred_currency VARCHAR(10) NOT NULL DEFAULT 'MAD',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    last_used TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_payment_accounts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payment_accounts_user_id ON payment_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_accounts_provider ON payment_accounts(provider);
