-- V14__add_task_management_fields.sql
-- Add task management fields: priority, deadline, SLA tracking, reassignment counter

-- Add priority column (default MEDIUM)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'MEDIUM'; 

-- Add deadline column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deadline TIMESTAMP; 

-- Add SLA status column (default ON_TRACK)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sla_status VARCHAR(20) DEFAULT 'ON_TRACK'; 

-- Add reassignment counter (default 0)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reassignment_count INTEGER DEFAULT 0; 

-- Add last assigned timestamp
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_assigned_at TIMESTAMP; 


-- Create index on priority and deadline for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_priority_deadline ON orders(priority, deadline);
CREATE INDEX IF NOT EXISTS idx_orders_sla_status ON orders(sla_status);
CREATE INDEX IF NOT EXISTS idx_orders_deadline ON orders(deadline);
