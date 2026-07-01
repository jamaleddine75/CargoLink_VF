-- src/test/resources/data.sql
-- QA Test Fixtures

-- Insert Client
INSERT INTO users (id, first_name, last_name, email, password, role, is_active, created_at)
VALUES ('e7d2a3b0-9015-4eee-a083-17b0805d5dea', 'Test', 'Client', 'client@example.com', '$2a$10$DowM6g0wXf.x5Hq/K.wQO.h6w4zM3.4fL7u7Fh0g5kQ/QG5T/5QG2', 'CUSTOMER', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Driver
INSERT INTO users (id, first_name, last_name, email, password, role, is_active, created_at)
VALUES ('74655442-0266-4718-b731-1a2b7370bd89', 'Test', 'Driver', 'driver@example.com', '$2a$10$DowM6g0wXf.x5Hq/K.wQO.h6w4zM3.4fL7u7Fh0g5kQ/QG5T/5QG2', 'DRIVER', true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO drivers (id, user_id, active, current_lat, current_lng, vehicle_type, max_capacity, rating)
VALUES ('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', '74655442-0266-4718-b731-1a2b7370bd89', true, 33.5, -7.5, 'VAN', 1000.0, 5.0)
ON CONFLICT (id) DO NOTHING;

-- Insert Agency
INSERT INTO users (id, first_name, last_name, email, password, role, is_active, created_at)
VALUES ('f25373a6-5748-43d7-8ab0-1282c0f6fcf8', 'Test', 'Agency', 'agency@example.com', '$2a$10$DowM6g0wXf.x5Hq/K.wQO.h6w4zM3.4fL7u7Fh0g5kQ/QG5T/5QG2', 'AGENCY', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Admin
INSERT INTO users (id, first_name, last_name, email, password, role, is_active, created_at)
VALUES ('9c44569e-1e9a-4e2b-bb0a-2db4764b8bb2', 'Test', 'Admin', 'admin@example.com', '$2a$10$DowM6g0wXf.x5Hq/K.wQO.h6w4zM3.4fL7u7Fh0g5kQ/QG5T/5QG2', 'ADMIN', true, NOW())
ON CONFLICT (id) DO NOTHING;
