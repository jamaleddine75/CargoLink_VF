-- V44__remove_super_admin_role.sql
-- Update all users with role 'SUPER_ADMIN' to 'ADMIN'

UPDATE users SET role = 'ADMIN' WHERE role = 'SUPER_ADMIN';

-- Ensure there are no lingering SUPER_ADMIN references in other tables if any exist
-- (None expected based on initial schema analysis, but safe to verify)
