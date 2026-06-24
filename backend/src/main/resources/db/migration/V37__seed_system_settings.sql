-- Seed default system settings
INSERT INTO system_settings (id, platform_name, currency, timezone, maintenance_mode, jwt_expiry)
VALUES (gen_random_uuid(), 'Cargologic', 'MAD', 'UTC+1', FALSE, 86400000);
