-- Create audit_logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    actor_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    target VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create system_settings table
CREATE TABLE system_settings (
    id UUID PRIMARY KEY,
    platform_name VARCHAR(255) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    jwt_expiry BIGINT NOT NULL
);

-- Index for performance
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
