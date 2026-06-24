-- Align core entity fields used by Agency, Driver, and Notification.

ALTER TABLE agencies ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE';

CREATE UNIQUE INDEX IF NOT EXISTS uk_agencies_email
    ON agencies(email);


ALTER TABLE drivers ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'OFFLINE';

UPDATE drivers
SET name = (SELECT NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), '')
            FROM users u WHERE u.id = drivers.user_id)
WHERE name IS NULL
AND EXISTS (SELECT 1 FROM users u WHERE u.id = drivers.user_id);

UPDATE drivers
SET name = 'Driver'
WHERE name IS NULL;

ALTER TABLE drivers
    ALTER COLUMN name SET NOT NULL;

ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS title VARCHAR(255);

UPDATE notifications
SET title = COALESCE(NULLIF(type, ''), 'Notification')
WHERE title IS NULL;

ALTER TABLE notifications
    ALTER COLUMN title SET NOT NULL;
