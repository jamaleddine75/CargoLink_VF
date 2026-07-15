-- V148: Create file_metadata table
CREATE TABLE IF NOT EXISTS file_metadata (
    id UUID PRIMARY KEY,
    object_key VARCHAR(500) NOT NULL UNIQUE,
    bucket VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    file_size BIGINT,
    checksum VARCHAR(255),
    uploaded_by UUID,
    agency_id UUID,
    document_type VARCHAR(100),
    content_type VARCHAR(100),
    uploaded_at TIMESTAMP NOT NULL
);
