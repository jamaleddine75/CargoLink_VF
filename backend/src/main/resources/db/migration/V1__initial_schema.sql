-- Initial schema for CargoLink
-- Database: PostgreSQL

CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    role VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE agencies (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE drivers (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    agency_id UUID REFERENCES agencies(id),
    vehicle_plate VARCHAR(20),
    vehicle_type VARCHAR(20),
    driver_status VARCHAR(20) DEFAULT 'OFFLINE',
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id VARCHAR(255) PRIMARY KEY,
    tracking_number VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL,
    pickup_address TEXT,
    delivery_address TEXT,
    pickup_contact_name VARCHAR(255),
    receiver_name VARCHAR(255),
    receiver_phone VARCHAR(20),
    pickup_lat DOUBLE PRECISION,
    pickup_lng DOUBLE PRECISION,
    delivery_lat DOUBLE PRECISION,
    delivery_lng DOUBLE PRECISION,
    distance DOUBLE PRECISION,
    estimated_time INTEGER,
    cod_amount DOUBLE PRECISION,
    cod_collected BOOLEAN DEFAULT FALSE,
    client_id UUID REFERENCES users(id),
    driver_id UUID REFERENCES drivers(id),
    agency_id UUID REFERENCES agencies(id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    pickup_date TIMESTAMP WITHOUT TIME ZONE,
    delivery_started_date TIMESTAMP WITHOUT TIME ZONE,
    delivered_date TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE wallets (
    id UUID PRIMARY KEY,
    driver_id UUID REFERENCES drivers(id) UNIQUE,
    balance DOUBLE PRECISION DEFAULT 0.0,
    is_frozen BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    wallet_id UUID REFERENCES wallets(id),
    amount DOUBLE PRECISION NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    order_id VARCHAR(255),
    status VARCHAR(20),
    date TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tracking_history (
    id UUID PRIMARY KEY,
    order_id VARCHAR(255) REFERENCES orders(id),
    status VARCHAR(50),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    photo_url TEXT,
    timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE incidents (
    id UUID PRIMARY KEY,
    order_id VARCHAR(255) REFERENCES orders(id),
    title VARCHAR(255),
    description TEXT,
    status VARCHAR(50),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    recipient_id UUID REFERENCES users(id),
    message TEXT NOT NULL,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE client_profiles (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) UNIQUE,
    company_name VARCHAR(255),
    billing_address TEXT,
    tax_id VARCHAR(100)
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY,
    order_id VARCHAR(255) REFERENCES orders(id),
    item_name VARCHAR(255),
    quantity INTEGER,
    weight DOUBLE PRECISION,
    description TEXT
);
