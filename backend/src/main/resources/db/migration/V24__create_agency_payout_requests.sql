CREATE TABLE IF NOT EXISTS agency_payout_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    agency_id UUID NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    bank_account VARCHAR(255) NOT NULL,
    requested_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_payout_agency FOREIGN KEY (agency_id) REFERENCES users(id)
);

CREATE INDEX idx_payout_agency ON agency_payout_requests(agency_id);
CREATE INDEX idx_payout_status ON agency_payout_requests(status);