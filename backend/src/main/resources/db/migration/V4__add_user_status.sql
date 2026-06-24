-- V4: Add missing status column to users table
-- Reconciles schema with JPA User entity

ALTER TABLE users 
ADD COLUMN status VARCHAR(50) DEFAULT 'PENDING';

-- Optional: Add index if status filtering is frequent
CREATE INDEX idx_users_status ON users(status);
