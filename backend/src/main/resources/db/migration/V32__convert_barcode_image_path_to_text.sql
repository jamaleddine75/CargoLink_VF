-- V32: Convert barcode_image_path to TEXT to support Base64 strings
ALTER TABLE orders ALTER COLUMN barcode_image_path TYPE TEXT;
