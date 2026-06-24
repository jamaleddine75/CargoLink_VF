-- V43: Force activate all demo users (CRITICAL FIX)
-- Purpose: Ensure demo users can log in without approval requirement
-- This is the definitive fix for demo account login issues

-- Update all demo users to be active and approved
UPDATE users 
SET 
  is_active = true,
  status = 'APPROVED',
  updated_at = NOW()
WHERE email IN ('admin@demo.com', 'driver@demo.com', 'client@demo.com', 'agency@demo.com');

-- Verify the update
SELECT email, is_active, status FROM users 
WHERE email IN ('admin@demo.com', 'driver@demo.com', 'client@demo.com', 'agency@demo.com');
