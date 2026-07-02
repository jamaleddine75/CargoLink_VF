-- Fix missing demo profiles and wallets

-- 1. Insert Demo Agency (admin: user 4444...)
INSERT INTO agencies (id, name, address, admin_agency_id, email, phone, status, city, operational_status, deleted, latitude, longitude)
VALUES (
    '99999999-9999-9999-9999-999999999999',
    'Demo Agency Casablanca',
    '123 Main St, Casablanca',
    '44444444-4444-4444-4444-444444444444',
    'agency@cargolink.ma',
    '0600000004',
    'ACTIVE',
    'Casablanca',
    'ACTIVE',
    false,
    33.5731,
    -7.5898
) ON CONFLICT (id) DO NOTHING;

-- Link users to this agency
UPDATE users SET agency_id = '99999999-9999-9999-9999-999999999999'
WHERE email IN ('agency@cargolink.ma', 'driver@cargolink.ma', 'client@cargolink.ma');

-- 2. Insert Demo Driver Profile (user 2222..., linked to agency 9999...)
INSERT INTO drivers (id, user_id, agency_id, name, phone, availability, status, registration_city, latitude, longitude)
VALUES (
    '88888888-8888-8888-8888-888888888888',
    '22222222-2222-2222-2222-222222222222',
    '99999999-9999-9999-9999-999999999999',
    'Demo Driver',
    '1234567891',
    'AVAILABLE',
    'ONLINE',
    'Casablanca',
    33.5731,
    -7.5898
) ON CONFLICT (id) DO NOTHING;

-- 3. Insert Demo Client Profile (user 1111...)
INSERT INTO client_profiles (id, user_id, company_name, billing_address)
VALUES (
    '77777777-7777-7777-7777-777777777777',
    '11111111-1111-1111-1111-111111111111',
    'Demo Client Company',
    'Client Address Casablanca'
) ON CONFLICT (id) DO NOTHING;

-- 4. Insert Wallets
-- Admin (3333...)
INSERT INTO wallets (id, user_id, wallet_type, balance, cash_in_hand, debt_to_system)
VALUES (
    '10000000-0000-0000-0000-000000000001',
    '33333333-3333-3333-3333-333333333333',
    'SYSTEM',
    0, 0, 0
) ON CONFLICT (id) DO NOTHING;

-- Agency (4444...)
INSERT INTO wallets (id, user_id, wallet_type, balance, cash_in_hand, debt_to_system)
VALUES (
    '10000000-0000-0000-0000-000000000002',
    '44444444-4444-4444-4444-444444444444',
    'AGENCY',
    0, 0, 0
) ON CONFLICT (id) DO NOTHING;

-- Driver (2222...)
INSERT INTO wallets (id, user_id, driver_id, wallet_type, balance, cash_in_hand, debt_to_system)
VALUES (
    '10000000-0000-0000-0000-000000000003',
    '22222222-2222-2222-2222-222222222222',
    '88888888-8888-8888-8888-888888888888',
    'DRIVER',
    0, 0, 0
) ON CONFLICT (id) DO NOTHING;

-- Client (1111...)
INSERT INTO wallets (id, user_id, wallet_type, balance, cash_in_hand, debt_to_system)
VALUES (
    '10000000-0000-0000-0000-000000000004',
    '11111111-1111-1111-1111-111111111111',
    'CUSTOMER',
    0, 0, 0
) ON CONFLICT (id) DO NOTHING;
