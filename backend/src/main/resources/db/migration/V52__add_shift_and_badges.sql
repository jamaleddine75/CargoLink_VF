-- Driver shifts
CREATE TABLE IF NOT EXISTS driver_shifts (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id       UUID NOT NULL REFERENCES drivers(id),
    started_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMP,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    total_deliveries     INT NOT NULL DEFAULT 0,
    successful_deliveries INT NOT NULL DEFAULT 0,
    failed_deliveries    INT NOT NULL DEFAULT 0,
    total_earnings       DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_cod            DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_distance_km    DECIMAL(8,2) NOT NULL DEFAULT 0,
    avg_delivery_time_min INT NOT NULL DEFAULT 0,
    sla_breaches     INT NOT NULL DEFAULT 0,
    incident_count   INT NOT NULL DEFAULT 0,
    created_at       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shifts_driver_active ON driver_shifts(driver_id, is_active);

-- Driver badges
CREATE TABLE IF NOT EXISTS driver_badges (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id   UUID NOT NULL REFERENCES drivers(id),
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    icon        VARCHAR(10),
    badge_type  VARCHAR(20) NOT NULL CHECK (badge_type IN ('GOLD','SILVER','BRONZE')),
    earned_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_badges_driver ON driver_badges(driver_id);
