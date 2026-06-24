-- V33: Add columns required by current JPA entities
-- Fixes runtime 500 errors caused by schema drift in local/dev databases.

ALTER TABLE drivers
    ADD COLUMN IF NOT EXISTS work_permission_until TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS driver_earnings DOUBLE PRECISION;
