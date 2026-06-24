-- V51: Add loyalty points to drivers and earned points to orders
ALTER TABLE drivers ADD COLUMN loyalty_points INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN points_earned INTEGER;
