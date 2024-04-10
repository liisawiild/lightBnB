DROP TABLE IF EXISTS users, properties, reservations, property_reviews CASCADE;

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL
);

-- Create properties table
CREATE TABLE properties (
  id SERIAL PRIMARY KEY NOT NULL,
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT TRUE, 
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail VARCHAR(255) NOT NULL,
  cover_photo VARCHAR(255) NOT NULL,
  cost_night INTEGER NOT NULL DEFAULT 0,
  parking_spaces INTEGER NOT NULL DEFAULT 0,
  number_bathrooms INTEGER NOT NULL DEFAULT 0,
  number_bedrooms INTEGER NOT NULL DEFAULT 0,
  country VARCHAR(255) NOT NULL,
  street VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  province VARCHAR(255) NOT NULL,
  postal_code VARCHAR(255) NOT NULL
);

-- Create reservations table
CREATE TABLE reservations (
  id SERIAL PRIMARY KEY NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  guest_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

-- Create property reviews table
CREATE TABLE property_reviews (
  id SERIAL PRIMARY KEY NOT NULL,
  guest_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  reservation_id INTEGER REFERENCES reservations(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL DEFAULT 0,
  message TEXT
);