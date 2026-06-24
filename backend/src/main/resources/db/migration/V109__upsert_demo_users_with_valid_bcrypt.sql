-- Seed demo users with @cargolink.ma domain and password "demo123"
-- Password hash (BCrypt 10 rounds): $2a$10$FUR3T/4XIw.o0NTquas.iuQElXtNyk8Hlg7h6A1gMW9HrrRw2A6q2

INSERT INTO users (id, email, password, first_name, last_name, phone_number, role, is_active, status, created_at, updated_at) 
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'client@cargolink.ma', '$2a$10$FUR3T/4XIw.o0NTquas.iuQElXtNyk8Hlg7h6A1gMW9HrrRw2A6q2', 'Demo', 'Client', '1234567890', 'CUSTOMER', true, 'ACTIVE', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'driver@cargolink.ma', '$2a$10$FUR3T/4XIw.o0NTquas.iuQElXtNyk8Hlg7h6A1gMW9HrrRw2A6q2', 'Demo', 'Driver', '1234567891', 'DRIVER', true, 'ACTIVE', NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'admin@cargolink.ma', '$2a$10$FUR3T/4XIw.o0NTquas.iuQElXtNyk8Hlg7h6A1gMW9HrrRw2A6q2', 'Demo', 'Admin', '1234567892', 'ADMIN', true, 'ACTIVE', NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', 'agency@cargolink.ma', '$2a$10$FUR3T/4XIw.o0NTquas.iuQElXtNyk8Hlg7h6A1gMW9HrrRw2A6q2', 'Demo', 'Agency', '1234567893', 'AGENCY_ADMIN', true, 'ACTIVE', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET 
    password = EXCLUDED.password,
    status = 'ACTIVE',
    is_active = true,
    updated_at = NOW();
