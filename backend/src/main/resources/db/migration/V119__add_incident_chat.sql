-- V119__add_incident_chat.sql

CREATE TABLE IF NOT EXISTS incident_messages (
    id UUID PRIMARY KEY,
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE IF NOT EXISTS incident_attachments (
    id UUID PRIMARY KEY,
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_type VARCHAR(50),
    file_size BIGINT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incident_status_history (
    id UUID PRIMARY KEY,
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES users(id),
    comment TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add source column to incidents to track where it came from
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'ADMIN';
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_incident_messages_incident_id ON incident_messages(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_attachments_incident_id ON incident_attachments(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_status_history_incident_id ON incident_status_history(incident_id);
