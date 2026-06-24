-- Add disciplinary fields to drivers table
ALTER TABLE drivers ADD COLUMN disciplinary_status VARCHAR(50) DEFAULT 'ACTIVE';
ALTER TABLE drivers ADD COLUMN last_disciplinary_reason TEXT;

-- Create disciplinary history table
CREATE TABLE driver_disciplinary_actions (
    id UUID PRIMARY KEY,
    driver_id UUID NOT NULL,
    agency_id UUID NOT NULL,
    performed_by_id UUID NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    action VARCHAR(50),
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_disciplinary_driver FOREIGN KEY (driver_id) REFERENCES drivers(id),
    CONSTRAINT fk_disciplinary_agency FOREIGN KEY (agency_id) REFERENCES agencies(id),
    CONSTRAINT fk_disciplinary_performer FOREIGN KEY (performed_by_id) REFERENCES users(id)
);

-- Add index for faster history lookups
CREATE INDEX idx_disciplinary_driver_id ON driver_disciplinary_actions(driver_id);
CREATE INDEX idx_disciplinary_agency_id ON driver_disciplinary_actions(agency_id);
