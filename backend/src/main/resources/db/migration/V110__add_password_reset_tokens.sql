-- V110__add_password_reset_tokens.sql
-- Add password reset token columns and index for users

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token_expiry TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(password_reset_token);

