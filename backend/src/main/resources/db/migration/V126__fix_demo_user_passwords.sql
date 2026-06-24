-- Fix demo user password hashes to match "demo123"
UPDATE users 
SET password = '$2a$10$FUR3T/4XIw.o0NTquas.iuQElXtNyk8Hlg7h6A1gMW9HrrRw2A6q2' 
WHERE email IN (
  'client@cargolink.ma', 
  'driver@cargolink.ma', 
  'admin@cargolink.ma', 
  'agency@cargolink.ma'
);
