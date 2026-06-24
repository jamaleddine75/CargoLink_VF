-- Add profile settings fields to users table
ALTER TABLE users ADD COLUMN address TEXT;
ALTER TABLE users ADD COLUMN avatar_url TEXT;
