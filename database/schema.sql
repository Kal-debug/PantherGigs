-- PantherGigs Database Schema
-- Created: November 2025
-- Description: MySQL database schema for GSU student service marketplace

USE panthergigs;

-- Table 1: User
-- Stores student user information
CREATE TABLE User (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    gsu_verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT NOW()
);

-- Table 2: CampusBuilding
-- Stores GSU campus building locations
CREATE TABLE CampusBuilding (
    building_id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(16) UNIQUE NOT NULL,
    name VARCHAR(150),
    lat DECIMAL(9,6),
    lng DECIMAL(9,6)
);

-- Table 3: Services
-- Stores service listings created by providers
CREATE TABLE Services (
    service_id INT PRIMARY KEY AUTO_INCREMENT,
    provider_id INT NOT NULL,
    title VARCHAR(150),
    category VARCHAR(80),
    description TEXT,
    duration_min INT,
    base_price_usd DECIMAL(10,2),
    active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (provider_id) REFERENCES User(user_id) ON DELETE CASCADE
);

-- Table 4: AvailabilitySlot
-- Stores provider availability schedules
CREATE TABLE AvailabilitySlot (
    provider_id INT NOT NULL,
    availability_id INT NOT NULL,
    dow ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
    starttime TIME,
    endtime TIME,
    PRIMARY KEY (provider_id, availability_id),
    FOREIGN KEY (provider_id) REFERENCES User(user_id) ON DELETE CASCADE
);

-- Table 5: Booking
-- Stores service booking transactions
CREATE TABLE Booking (
    booking_id INT PRIMARY KEY AUTO_INCREMENT,
    service_id INT NOT NULL,
    provider_id INT NOT NULL,
    customer_id INT NOT NULL,
    building_id INT,
    start_at DATETIME,
    ends_at DATETIME,
    buffer_min INT,
    walk_minute_from_prev INT,
    status VARCHAR(32),
    price_usd DECIMAL(10,2),
    created_at DATETIME DEFAULT NOW(),
    FOREIGN KEY (service_id) REFERENCES Services(service_id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES User(user_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES User(user_id) ON DELETE CASCADE,
    FOREIGN KEY (building_id) REFERENCES CampusBuilding(building_id) ON DELETE SET NULL
);

-- Table 6: Review
-- Stores booking reviews and ratings
CREATE TABLE Review (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT UNIQUE NOT NULL,
    reviewer_id INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at DATETIME DEFAULT NOW(),
    FOREIGN KEY (booking_id) REFERENCES Booking(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES User(user_id) ON DELETE CASCADE
);
