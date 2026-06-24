-- Simplified Demo Driver Data Initialization
-- Optimized for Spring Boot SQL Parser (no dollar quotes)

-- 1. Ensure an Agency exists (Required for some logic)
INSERT INTO agencies (id, name, address, contact_info)
VALUES (gen_random_uuid(), 'CargoLink Casablanca Central', 'Maarif 12, Casablanca', '0522-123456')
ON CONFLICT DO NOTHING;

-- 2. Ensure Driver profile exists for driver@demo.com
INSERT INTO drivers (id, name, user_id, agency_id, vehicle_plate, vehicle_type, license_number, verification_status, driver_status, phone)
SELECT gen_random_uuid(), 'Demo Driver', u.id, (SELECT id FROM agencies WHERE name = 'CargoLink Casablanca Central' LIMIT 1), '12345-A-1', 'VAN', 'L-99887766', 'APPROVED', 'ONLINE', '1234567891'
FROM users u
WHERE u.email = 'driver@demo.com'
ON CONFLICT (user_id) DO UPDATE SET 
    name = 'Demo Driver',
    verification_status = 'APPROVED',
    driver_status = 'ONLINE',
    phone = '1234567891',
    agency_id = (SELECT id FROM agencies WHERE name = 'CargoLink Casablanca Central' LIMIT 1);

-- 3. Ensure Wallet exists
INSERT INTO wallets (id, driver_id, balance, is_frozen)
SELECT gen_random_uuid(), d.id, 1250.75, false
FROM drivers d
JOIN users u ON d.user_id = u.id
WHERE u.email = 'driver@demo.com'
ON CONFLICT (driver_id) DO UPDATE SET balance = 1250.75;

-- 4. Insert Sample Orders
INSERT INTO orders (id, tracking_number, status, pickup_address, delivery_address, pickup_contact_name, receiver_name, receiver_phone, cod_amount, cod_collected, driver_id, agency_id, created_at, delivered_at)
SELECT gen_random_uuid()::text, 'CL24001ABC', 'LIVREE', 'Sidi Maalouf, Casablanca', 'Mohammedia Central', 'Ahmed Tazi', 'Sara Benani', '0612345678', 450.00, true, d.id, d.agency_id, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'
FROM drivers d JOIN users u ON d.user_id = u.id WHERE u.email = 'driver@demo.com'
ON CONFLICT DO NOTHING;

INSERT INTO orders (id, tracking_number, status, pickup_address, delivery_address, pickup_contact_name, receiver_name, receiver_phone, cod_amount, pickup_lat, pickup_lng, delivery_lat, delivery_lng, distance, estimated_time, driver_id, agency_id, created_at, pickup_date)
SELECT gen_random_uuid()::text, 'TET-2026-01', 'EN_LIVRAISON', 'Avenue Hassan II, Tétouan', 'Corniche Martil, Tétouan', 'Nadia Tetouani', 'Yassine El Idrissi', '0655667788', 780.00, 35.5769, -5.3720, 35.6160, -5.2750, 11.4, 24, d.id, d.agency_id, NOW() - INTERVAL '35 minutes', NOW() - INTERVAL '20 minutes'
FROM drivers d JOIN users u ON d.user_id = u.id WHERE u.email = 'driver@demo.com'
ON CONFLICT DO NOTHING;

INSERT INTO orders (id, tracking_number, status, pickup_address, delivery_address, pickup_contact_name, receiver_name, receiver_phone, cod_amount, pickup_lat, pickup_lng, delivery_lat, delivery_lng, distance, estimated_time, agency_id, created_at)
SELECT gen_random_uuid()::text, 'TET-2026-02', 'WAITING_FOR_DRIVER', 'Rue Tarik Ibn Ziad, Tétouan', 'Bni Makada, Tétouan', 'Atelier Rif', 'Sara Nadori', '0677001122', 320.00, 35.5666, -5.3594, 35.5728, -5.3067, 6.8, 18, d.agency_id, NOW() - INTERVAL '10 minutes'
FROM drivers d JOIN users u ON d.user_id = u.id WHERE u.email = 'driver@demo.com'
ON CONFLICT DO NOTHING;

INSERT INTO orders (id, tracking_number, status, pickup_address, delivery_address, pickup_contact_name, receiver_name, receiver_phone, cod_amount, driver_id, agency_id, created_at)
SELECT gen_random_uuid()::text, 'CL24004PEN', 'ASSIGNEE', 'Derb Ghallef', 'Bourgogne', 'Store Moroccan Goods', 'Youssef Mansouri', '0661998877', 120.00, d.id, d.agency_id, NOW() - INTERVAL '3 hours'
FROM drivers d JOIN users u ON d.user_id = u.id WHERE u.email = 'driver@demo.com'
ON CONFLICT DO NOTHING;

-- 4b. Mission Orders - Tetouan / Fnideq
INSERT INTO orders (id, tracking_number, status, pickup_address, delivery_address, pickup_contact_name, receiver_name, receiver_phone, cod_amount, pickup_lat, pickup_lng, delivery_lat, delivery_lng, distance, estimated_time, driver_id, agency_id, created_at, pickup_date)
SELECT gen_random_uuid()::text, 'FND-2026-03', 'EN_LIVRAISON', 'Fnideq Port, Fnideq', 'Bab Sebta Market, Fnideq', 'Hassan Fnideqi', 'Moha Sebtaoui', '0611223344', 350.00, 35.8567, -5.3489, 35.8712, -5.3456, 3.2, 8, d.id, d.agency_id, NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '10 minutes'
FROM drivers d JOIN users u ON d.user_id = u.id WHERE u.email = 'driver@demo.com'
ON CONFLICT DO NOTHING;

INSERT INTO orders (id, tracking_number, status, pickup_address, delivery_address, pickup_contact_name, receiver_name, receiver_phone, cod_amount, pickup_lat, pickup_lng, delivery_lat, delivery_lng, distance, estimated_time, agency_id, created_at)
SELECT gen_random_uuid()::text, 'TET-2026-03', 'WAITING_FOR_DRIVER', 'Avenue Hassan II, Tétouan', 'Corniche Martil, Tétouan', 'Nadia Tetouani', 'Yassine El Idrissi', '0655667788', 780.00, 35.5769, -5.3720, 35.6160, -5.2750, 11.4, 24, d.agency_id, NOW() - INTERVAL '12 minutes'
FROM drivers d JOIN users u ON d.user_id = u.id WHERE u.email = 'driver@demo.com'
ON CONFLICT DO NOTHING;

-- 5. Insert Sample Transactions
INSERT INTO transactions (id, wallet_id, amount, type, description, status, date)
SELECT gen_random_uuid(), w.id, 450.0, 'EARNING', 'Delivery Fee - CL24001ABC', 'COMPLETED', NOW() - INTERVAL '1 day'
FROM wallets w
JOIN drivers d ON w.driver_id = d.id
JOIN users u ON d.user_id = u.id
WHERE u.email = 'driver@demo.com'
ON CONFLICT DO NOTHING;
