-- V15__create_assignment_history.sql
-- Create assignment_history table to track order assignments and reassignments

CREATE TABLE IF NOT EXISTS assignment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    order_id VARCHAR(255) NOT NULL,
    previous_driver_id UUID,
    new_driver_id UUID NOT NULL,
    reason VARCHAR(255) NOT NULL,
    notes TEXT,
    assigned_by VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_assignment_history_order_id ON assignment_history(order_id);
CREATE INDEX IF NOT EXISTS idx_assignment_history_new_driver_id ON assignment_history(new_driver_id);
CREATE INDEX IF NOT EXISTS idx_assignment_history_previous_driver_id ON assignment_history(previous_driver_id);
CREATE INDEX IF NOT EXISTS idx_assignment_history_assigned_at ON assignment_history(assigned_at);
