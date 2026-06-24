-- Add missing fields to agency_customers table
ALTER TABLE agency_customers ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE;
ALTER TABLE agency_customers ADD COLUMN IF NOT EXISTS is_high_risk BOOLEAN DEFAULT FALSE;

-- Add index for VIP/High Risk filtering
CREATE INDEX IF NOT EXISTS idx_agency_customers_risk_vip ON agency_customers(is_vip, is_high_risk);
