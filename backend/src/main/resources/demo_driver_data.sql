-- Migration for Demo Driver Account (driver@demo.com)
-- This script populates the database with realistic test data for the existing demo account.

DO $$
DECLARE
    v_user_id UUID;
    v_driver_id UUID;
    v_wallet_id UUID;
    v_agency_id UUID;
BEGIN
    -- 1. Find or Ensure the User exists (The user said it exists)
    SELECT id INTO v_user_id FROM users WHERE email = 'driver@demo.com';
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'Demo user driver@demo.com not found. Creation might be needed.';
        -- Optionally create user here if missing, but user said it already exists.
    END IF;

    -- 2. Ensure an Agency exists (Required for some logic)
    INSERT INTO agencies (id, name, address, contact_info)
    VALUES (gen_random_uuid(), 'CargoLink Casablanca Central', 'Maarif 12, Casablanca', '0522-123456')
    ON CONFLICT DO NOTHING;
    
    SELECT id INTO v_agency_id FROM agencies LIMIT 1;

    -- 3. Ensure Driver profile exists
    INSERT INTO drivers (id, name, user_id, agency_id, vehicle_plate, vehicle_type, license_number, verification_status, driver_status, phone)
    VALUES (gen_random_uuid(), 'Demo Driver', v_user_id, v_agency_id, '12345-A-1', 'VAN', 'L-99887766', 'APPROVED', 'ONLINE', '1234567891')
    ON CONFLICT (user_id) DO UPDATE SET 
        name = 'Demo Driver',
        verification_status = 'APPROVED',
        driver_status = 'ONLINE',
        agency_id = v_agency_id,
        phone = '1234567891'
    RETURNING id INTO v_driver_id;

    -- 4. Ensure Wallet exists
    INSERT INTO wallets (id, driver_id, balance, is_frozen)
    VALUES (gen_random_uuid(), v_driver_id, 1250.75, false)
    ON CONFLICT (driver_id) DO UPDATE SET balance = 1250.75
    RETURNING id INTO v_wallet_id;

    -- 5. Insert Sample Orders
    -- Order 1: Delivered (History)
    INSERT INTO orders (id, tracking_number, status, pickup_address, delivery_address, pickup_contact_name, receiver_name, receiver_phone, cod_amount, cod_collected, driver_id, agency_id, created_at, delivered_at)
    VALUES (gen_random_uuid()::text, 'CL24001ABC', 'LIVREE', 'Sidi Maalouf, Casablanca', 'Mohammedia Central', 'Ahmed Tazi', 'Sara Benani', '0612345678', 450.00, true, v_driver_id, v_agency_id, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day')
    ON CONFLICT DO NOTHING;

    -- Order 2: Delivered (History)
    INSERT INTO orders (id, tracking_number, status, pickup_address, delivery_address, pickup_contact_name, receiver_name, receiver_phone, cod_amount, cod_collected, driver_id, agency_id, created_at, delivered_at)
    VALUES (gen_random_uuid()::text, 'CL24002XYZ', 'LIVREE', 'Anfa Park', 'Gauthier', 'Karim Alami', 'Meryem Fassi', '0655554433', 0.00, false, v_driver_id, v_agency_id, NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days')
    ON CONFLICT DO NOTHING;

    -- Order 3: Active - En route
    INSERT INTO orders (id, tracking_number, status, pickup_address, delivery_address, pickup_contact_name, receiver_name, receiver_phone, cod_amount, cod_collected, driver_id, agency_id, created_at, pickup_date)
    VALUES (gen_random_uuid()::text, 'CL24003ACT', 'EN_LIVRAISON', 'Ain Diab, Casa', 'Bouskoura Ville', 'Fatima Zahra', 'Omar Radi', '0777112233', 890.00, false, v_driver_id, v_agency_id, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour')
    ON CONFLICT DO NOTHING;

    -- Order 4: Assigned - Pending Pickup
    INSERT INTO orders (id, tracking_number, status, pickup_address, delivery_address, pickup_contact_name, receiver_name, receiver_phone, cod_amount, driver_id, agency_id, created_at)
    VALUES (gen_random_uuid()::text, 'CL24004PEN', 'ASSIGNEE', 'Derb Ghallef', 'Bourgogne', 'Store Moroccan Goods', 'Youssef Mansouri', '0661998877', 120.00, v_driver_id, v_agency_id, NOW() - INTERVAL '3 hours')
    ON CONFLICT DO NOTHING;

    -- Order 5: Fnideq Local (Map Test) - Waiting for Driver
    INSERT INTO orders (id, tracking_number, status, pickup_address, delivery_address, pickup_contact_name, receiver_name, receiver_phone, cod_amount, pickup_lat, pickup_lng, delivery_lat, delivery_lng, distance, estimated_time, agency_id, created_at)
    VALUES (gen_random_uuid()::text, 'FND-2026-01', 'WAITING_FOR_DRIVER', 'Avenue Mohammed V, Fnideq', 'Bab Sebta Market', 'Hassan Fnideqi', 'Moha Sebtaoui', '0611223344', 350.00, 35.8505, -5.3524, 35.8712, -5.3456, 3.2, 8, v_agency_id, NOW() - INTERVAL '15 minutes')
    ON CONFLICT DO NOTHING;

    -- Order 6: Fnideq to Tetouan (Map Test) - Assigned
    INSERT INTO orders (id, tracking_number, status, pickup_address, delivery_address, pickup_contact_name, receiver_name, receiver_phone, cod_amount, pickup_lat, pickup_lng, delivery_lat, delivery_lng, distance, estimated_time, driver_id, agency_id, created_at)
    VALUES (gen_random_uuid()::text, 'FND-2026-02', 'ASSIGNEE', 'Quartier Al Qods, Fnideq', 'Tetouan City Center', 'Smail North', 'Karima Tetouania', '0699887766', 1250.00, 35.8423, -5.3612, 35.5721, -5.3678, 32.5, 45, v_driver_id, v_agency_id, NOW() - INTERVAL '45 minutes')
    ON CONFLICT DO NOTHING;

    -- Order 7: Fnideq to M''diq (Map Test) - En Delivery
    INSERT INTO orders (id, tracking_number, status, pickup_address, delivery_address, pickup_contact_name, receiver_name, receiver_phone, cod_amount, pickup_lat, pickup_lng, delivery_lat, delivery_lng, distance, estimated_time, driver_id, agency_id, created_at, pickup_date)
    VALUES (gen_random_uuid()::text, 'FND-2026-03', 'EN_LIVRAISON', 'Fnideq Port', 'M''diq Marina', 'Reda Port', 'Anas Marina', '0644332211', 0.00, 35.8567, -5.3489, 35.6834, -5.3212, 12.8, 15, v_driver_id, v_agency_id, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '30 minutes')
    ON CONFLICT DO NOTHING;

    -- Order 8: Tetouan local mission
    INSERT INTO orders (id, tracking_number, status, pickup_address, delivery_address, pickup_contact_name, receiver_name, receiver_phone, cod_amount, pickup_lat, pickup_lng, delivery_lat, delivery_lng, distance, estimated_time, driver_id, agency_id, created_at, pickup_date)
    VALUES (gen_random_uuid()::text, 'TET-2026-01', 'EN_LIVRAISON', 'Avenue Hassan II, Tétouan', 'Corniche Martil, Tétouan', 'Nadia Tetouani', 'Yassine El Idrissi', '0655667788', 780.00, 35.5769, -5.3720, 35.6160, -5.2750, 11.4, 24, v_driver_id, v_agency_id, NOW() - INTERVAL '35 minutes', NOW() - INTERVAL '20 minutes')
    ON CONFLICT DO NOTHING;

    -- Order 9: Tetouan available offer
    INSERT INTO orders (id, tracking_number, status, pickup_address, delivery_address, pickup_contact_name, receiver_name, receiver_phone, cod_amount, pickup_lat, pickup_lng, delivery_lat, delivery_lng, distance, estimated_time, agency_id, created_at)
    VALUES (gen_random_uuid()::text, 'TET-2026-02', 'WAITING_FOR_DRIVER', 'Rue Tarik Ibn Ziad, Tétouan', 'Bni Makada, Tétouan', 'Atelier Rif', 'Sara Nadori', '0677001122', 320.00, 35.5666, -5.3594, 35.5728, -5.3067, 6.8, 18, v_agency_id, NOW() - INTERVAL '10 minutes')
    ON CONFLICT DO NOTHING;

    -- 6. Insert Sample Transactions
    INSERT INTO transactions (id, wallet_id, amount, type, description, status, date)
    VALUES (gen_random_uuid(), v_wallet_id, 450.0, 'EARNING', 'Delivery Fee - CL24001ABC', 'COMPLETED', NOW() - INTERVAL '1 day')
    ON CONFLICT DO NOTHING;

    INSERT INTO transactions (id, wallet_id, amount, type, description, status, date)
    VALUES (gen_random_uuid(), v_wallet_id, 35.0, 'EARNING', 'Bonus - Weekly Target', 'COMPLETED', NOW() - INTERVAL '2 days')
    ON CONFLICT DO NOTHING;

    INSERT INTO transactions (id, wallet_id, amount, type, description, status, date)
    VALUES (gen_random_uuid(), v_wallet_id, -120.0, 'PAYOUT', 'Automatic Payout to Bank', 'COMPLETED', NOW() - INTERVAL '3 days')
    ON CONFLICT DO NOTHING;

END $$;
