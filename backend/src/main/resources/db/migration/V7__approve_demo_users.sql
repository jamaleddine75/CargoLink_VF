-- Fix demo users status to APPROVED (allows login)
UPDATE users 
SET status = 'APPROVED' 
WHERE email IN ('client@demo.com', 'driver@demo.com', 'admin@demo.com', 'agency@demo.com');
