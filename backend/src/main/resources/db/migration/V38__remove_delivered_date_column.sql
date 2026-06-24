-- Preserve any historical values before dropping the deprecated column.
UPDATE orders
SET delivered_at = delivered_date
WHERE delivered_at IS NULL
  AND delivered_date IS NOT NULL;

ALTER TABLE orders DROP COLUMN IF EXISTS delivered_date;
