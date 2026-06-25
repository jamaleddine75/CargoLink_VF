-- V128: Expand phone number columns to support international formats
-- receiver_phone and phone_number were VARCHAR(20), which is too short
-- for formatted international numbers or long strings

ALTER TABLE orders ALTER COLUMN receiver_phone TYPE VARCHAR(50);
ALTER TABLE users ALTER COLUMN phone_number TYPE VARCHAR(50);
