-- PantherGigs Test Data
-- Seed data for development and testing

USE panthergigs;

-- Insert test users
INSERT INTO User (name, email, gsu_verified) VALUES
('John Smith', 'jsmith@gsu.edu', TRUE),
('Sarah Johnson', 'sjohnson@gsu.edu', TRUE),
('Mike Chen', 'mchen@gsu.edu', FALSE),
('Emily Davis', 'edavis@gsu.edu', TRUE),
('Alex Martinez', 'amartinez@gsu.edu', TRUE);

-- Insert GSU campus buildings with real coordinates
INSERT INTO CampusBuilding (code, name, lat, lng) VALUES
('CLSN', 'Classroom South', 33.753047, -84.385483),
('LIB', 'Library South', 33.753525, -84.387789),
('LANG', 'Langdale Hall', 33.753215, -84.388321),
('SC', 'Student Center', 33.753891, -84.386542),
('REC', 'Recreation Center', 33.754123, -84.385012),
('SPARKS', 'Sparks Hall', 33.753678, -84.386234),
('ADERHOLD', 'Aderhold Learning Center', 33.754456, -84.387123);

-- Insert sample services
INSERT INTO Services (provider_id, title, category, description, duration_min, base_price_usd, active) VALUES
(1, 'Math Tutoring', 'Academic', 'Help with calculus and algebra', 60, 25.00, TRUE),
(1, 'Moving Help', 'Physical', 'Assist with moving boxes and furniture', 120, 40.00, TRUE),
(2, 'Resume Review', 'Professional', 'Professional resume editing and feedback', 45, 30.00, TRUE),
(2, 'Python Coding Help', 'Academic', 'Tutoring for intro to programming courses', 90, 35.00, TRUE),
(4, 'Photography Session', 'Creative', 'Portrait and event photography', 90, 50.00, TRUE),
(4, 'Graphic Design', 'Creative', 'Logo and poster design services', 120, 60.00, TRUE),
(5, 'Fitness Training', 'Health', 'Personal training sessions at campus gym', 60, 30.00, TRUE);

-- Insert availability slots for providers
INSERT INTO AvailabilitySlot (provider_id, availability_id, dow, starttime, endtime) VALUES
(1, 1, 'Monday', '09:00:00', '12:00:00'),
(1, 2, 'Wednesday', '14:00:00', '17:00:00'),
(1, 3, 'Friday', '10:00:00', '13:00:00'),
(2, 1, 'Tuesday', '10:00:00', '15:00:00'),
(2, 2, 'Thursday', '13:00:00', '18:00:00'),
(4, 1, 'Friday', '13:00:00', '18:00:00'),
(4, 2, 'Saturday', '09:00:00', '17:00:00'),
(5, 1, 'Monday', '16:00:00', '20:00:00'),
(5, 2, 'Wednesday', '16:00:00', '20:00:00'),
(5, 3, 'Friday', '15:00:00', '19:00:00');

-- Insert sample bookings
INSERT INTO Booking (service_id, provider_id, customer_id, building_id, start_at, ends_at, status, price_usd) VALUES
(1, 1, 3, 2, '2025-11-15 10:00:00', '2025-11-15 11:00:00', 'confirmed', 25.00),
(3, 2, 1, 4, '2025-11-16 14:00:00', '2025-11-16 14:45:00', 'completed', 30.00),
(5, 4, 3, 6, '2025-11-17 15:00:00', '2025-11-17 16:30:00', 'confirmed', 50.00),
(7, 5, 2, 5, '2025-11-18 17:00:00', '2025-11-18 18:00:00', 'pending', 30.00);

-- Insert sample reviews
INSERT INTO Review (booking_id, reviewer_id, rating, comment) VALUES
(1, 3, 5, 'Great tutor! Really helped me understand calculus.'),
(2, 1, 4, 'Professional and helpful feedback on my resume.');
