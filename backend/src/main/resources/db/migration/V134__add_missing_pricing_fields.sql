-- V134: Add missing fields to pricing_configs to make rules fully dynamic
ALTER TABLE pricing_configs ADD COLUMN IF NOT EXISTS distance_threshold_km DOUBLE PRECISION DEFAULT 5.0;
ALTER TABLE pricing_configs ADD COLUMN IF NOT EXISTS max_delivery_fee DOUBLE PRECISION DEFAULT 45.0;
ALTER TABLE pricing_configs ADD COLUMN IF NOT EXISTS max_service_distance_km DOUBLE PRECISION DEFAULT 40.0;

-- Populate default values for existing records
UPDATE pricing_configs SET
    distance_threshold_km = COALESCE(distance_threshold_km, 5.0),
    max_delivery_fee = COALESCE(max_delivery_fee, 45.0),
    max_service_distance_km = COALESCE(max_service_distance_km, 40.0);
