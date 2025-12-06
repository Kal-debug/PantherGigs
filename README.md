# PantherGigs - Campus Service Marketplace

**Georgia State University | Fall 2025**  
**Course:** Database Systems  
**Team:** Kaleab (Backend/Full-Stack), Naol (Frontend/Database Design)

---

## Overview

PantherGigs is a web platform that connects GSU students who need services (tutoring, photography, moving help, etc.) with other students who provide them. We built this to solve a real problem on campus - it's hard to find reliable student services, and there's no central place to book them.

The project uses a MySQL database with 6 related tables, a Node.js backend API, and a React frontend. We also implemented two advanced features: a walking-time scheduler that prevents impossible booking conflicts, and a social media parser that auto-fills service forms from Instagram captions.

---

## Database Design

We designed 6 tables that work together to handle users, services, bookings, and reviews:

### Core Tables

**User** - Student accounts with GSU email verification
```sql
CREATE TABLE User (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  gsu_verified BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Services** - Service listings (tutoring, photography, etc.)
```sql
CREATE TABLE Services (
  service_id INT PRIMARY KEY AUTO_INCREMENT,
  provider_id INT NOT NULL,
  title VARCHAR(150),
  category VARCHAR(80) NOT NULL,
  description TEXT,
  duration_min INT,
  base_price_usd DECIMAL(10,2),
  active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (provider_id) REFERENCES User(user_id)
);
```

**Booking** - Tracks all service bookings
```sql
CREATE TABLE Booking (
  booking_id INT PRIMARY KEY AUTO_INCREMENT,
  service_id INT,
  provider_id INT,
  customer_id INT,
  building_id INT,
  start_at DATETIME,
  ends_at DATETIME,
  status VARCHAR(32),
  price_usd DECIMAL(10,2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES Services(service_id),
  FOREIGN KEY (provider_id) REFERENCES User(user_id),
  FOREIGN KEY (customer_id) REFERENCES User(user_id),
  FOREIGN KEY (building_id) REFERENCES CampusBuilding(building_id)
);
```

**Review** - Customer reviews after completed bookings
```sql
CREATE TABLE Review (
  review_id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT UNIQUE NOT NULL,
  reviewer_id INT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES Booking(booking_id)
);
```

**CampusBuilding** - GSU buildings with GPS coordinates
```sql
CREATE TABLE CampusBuilding (
  building_id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(16) UNIQUE NOT NULL,
  name VARCHAR(150),
  lat DECIMAL(9,6) NOT NULL,
  lng DECIMAL(9,6) NOT NULL
);
```

**AvailabilitySlot** - Provider availability windows
```sql
CREATE TABLE AvailabilitySlot (
  provider_id INT NOT NULL,
  availability_id INT NOT NULL,
  dow ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'),
  starttime TIME,
  endtime TIME,
  PRIMARY KEY (provider_id, availability_id)
);
```

### Relationships
- One User can provide many Services (1:N)
- One Service can have many Bookings (1:N)
- One Booking has one Review (1:1)
- One CampusBuilding can host many Bookings (1:N)

---

## Tech Stack

**Backend:**
- Node.js + Express.js for REST API
- MySQL database with mysql2 driver
- JWT for authentication
- bcrypt for password hashing

**Frontend:**
- React with hooks
- Tailwind CSS for styling
- Axios for API calls
- React Router for navigation

**Tools:**
- DBeaver for database management
- Postman/cURL for API testing
- Git/GitHub for version control
- Faker.js for generating test data

---

## Features

### Basic CRUD Operations

**User Authentication:**
- Register with @gsu.edu email (we validate this)
- Login returns JWT token (expires in 24 hours)
- Protected routes require valid token

**Service Management:**
- Create, read, update, delete services
- Filter by category, price range, keywords
- Only service owner can edit/delete their listings

**Booking System:**
- Book services at specific times and campus buildings
- Status flow: pending → confirmed → completed → (can be cancelled)
- Prevents users from booking their own services
- Shows all bookings in "My Dashboard"

**Reviews:**
- Leave 1-5 star rating + comment on completed bookings
- One review per booking (enforced with UNIQUE constraint)
- Service cards show average rating

### Advanced Features

#### 1. Walking-Time Scheduler

**The Problem:**  
If a provider has back-to-back bookings at different campus buildings, they might not have enough time to walk between them.

**Our Solution:**  
We use GPS coordinates from the CampusBuilding table and the Haversine formula to calculate walking distance, then check if the provider has enough time to travel.

**How it works:**
```javascript
// Calculate distance between two GPS points
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Convert to walking time (we use 5 km/h + 30% campus factor)
function calculateWalkingTime(lat1, lon1, lat2, lon2) {
  const distance = haversineDistance(lat1, lon1, lat2, lon2);
  const walkingSpeed = 5; // km/h
  const campusFactor = 1.3; // accounts for sidewalks, stairs, etc.
  
  const minutes = (distance / walkingSpeed) * 60 * campusFactor;
  return Math.ceil(minutes); // round up for safety
}
```

Then we check the provider's schedule:
- Get existing bookings in a 2-hour window
- Check for time overlaps
- Calculate walking time between locations
- Add 5-minute buffer
- Reject if there's not enough time

**Example:**
```
Booking 1: Library South, ends 2:00 PM
Booking 2: Recreation Center, starts 2:01 PM

Walking time: 2 minutes
Available time: 1 minute
Buffer: 5 minutes
Result: ❌ REJECTED - only 1 minute but need 7 total
```

#### 2. Social Media Parser

**The Problem:**  
Typing out all service details manually is tedious. Students already post about their services on Instagram.

**Our Solution:**  
Parse Instagram/Facebook captions using regex to extract title, price, duration, and category automatically.

**Example Input:**
```
📚 Math Tutoring Available! $25/hour for Calculus & Algebra help. 
Sessions are 60 minutes. DM me to book! #GSUTutoring #MathHelp
```

**Extracted Output:**
```javascript
{
  title: "Math Tutoring",
  category: "Academic",
  description: "Math Tutoring Available! for Calculus Algebra help...",
  duration_min: 60,
  base_price_usd: 25
}
```

**How we extract data:**

Price patterns:
```javascript
/\$(\d+(?:\.\d{2})?)/           // Matches: $25, $25.00
/(\d+)\s*dollars?/i             // Matches: 25 dollars, 20 bucks
```

Duration patterns:
```javascript
/(\d+)\s*minutes?/i             // Matches: 60 minutes, 90 mins
/(\d+)\s*hours?/i               // Matches: 1 hour, 1.5 hours (converts to minutes)
```

Category classification:
```javascript
// We map keywords to categories
const categories = {
  'Academic': ['tutor', 'homework', 'study', 'test', 'math'],
  'Creative': ['photo', 'design', 'art', 'video'],
  // etc...
};

// Count keyword matches and pick best category
```

The parser also gives a confidence score (0-100%) based on how many fields it successfully extracted.

---

## API Endpoints

### Authentication
```
POST /api/auth/register    - Create account
POST /api/auth/login       - Get JWT token
GET  /api/auth/me          - Get current user (protected)
```

### Services
```
GET    /api/services              - List services (with filters)
GET    /api/services/:id          - Get single service
POST   /api/services              - Create service (protected)
PUT    /api/services/:id          - Update service (protected)
DELETE /api/services/:id          - Delete service (protected)
GET    /api/services/categories/list - Get all categories
```

Filters: `?category=Academic&min_price=20&max_price=50&search=tutoring`

### Bookings
```
GET    /api/bookings       - Get user's bookings
GET    /api/bookings/:id   - Get single booking
POST   /api/bookings       - Create booking (with walking time check)
PUT    /api/bookings/:id   - Update status
DELETE /api/bookings/:id   - Cancel booking
```

### Reviews
```
POST /api/reviews                - Create review (completed bookings only)
GET  /api/reviews/service/:id    - Get service reviews + average rating
```

### Parser
```
POST /api/parser/parse-social-post - Parse Instagram caption
GET  /api/parser/test-examples     - Get example captions
```

### Walking Time
```
GET /api/walking-time/calculate?building1_id=1&building2_id=5
GET /api/walking-time/buildings
```

---

## Setup Instructions

**1. Clone repo and install dependencies**
```bash
git clone https://github.com/Kal-debug/PantherGigs.git
cd PantherGigs/backend
npm install
```

**2. Set up database**
```bash
mysql -u root -p
source database/schema.sql
source database/seed.sql
```

**3. Configure environment (create `.env` in backend/)**
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=panthergigs
DB_PORT=3306
JWT_SECRET=your_secret_key
PORT=3000
```

**4. Start backend**
```bash
npm run dev
```

**5. Start frontend (in new terminal)**
```bash
cd frontend
npm install
npm start
```

Frontend runs on http://localhost:3001  
Backend runs on http://localhost:3000

---

## Testing

We tested everything with cURL commands. Here are some examples:

**Register user:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@gsu.edu","password":"password123"}'
```

**Create service:**
```bash
curl -X POST http://localhost:3000/api/services \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Math Tutoring","category":"Academic","duration_min":60,"base_price_usd":25}'
```

**Test walking time conflict:**
```bash
# Make first booking
curl -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer TOKEN" \
  -d '{"service_id":1,"building_id":1,"start_at":"2025-12-10 14:00:00","ends_at":"2025-12-10 15:00:00"}'

# Try second booking too close (should fail)
curl -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer TOKEN" \
  -d '{"service_id":1,"building_id":5,"start_at":"2025-12-10 15:01:00","ends_at":"2025-12-10 16:00:00"}'
# Returns 409 Conflict with walking time error message
```

---

## Challenges We Faced

**MySQL Password Issues:**  
After installing MySQL, we couldn't remember the root password. Had to reset it using safe mode (`--skip-grant-tables`). Learned about MySQL user management.

**Walking Time Date Conversion:**  
The walking time function kept throwing "getTime is not a function" errors because the database was returning date strings, not Date objects. Fixed by adding type checking:
```javascript
if (typeof newStartTime === 'string') {
  newStartTime = new Date(newStartTime);
}
```

**Tailwind CSS Not Working:**  
Spent 30 minutes wondering why nothing was styled. Turns out we needed to create `tailwind.config.js` and add the directives to `index.css`. Also had to restart the dev server.

**Review Duplicates:**  
Initially users could review the same booking multiple times. Added UNIQUE constraint on `booking_id` in the Review table and added a `has_review` flag in the booking queries to hide the review button after submission.

**Service Rating Display:**  
MySQL returns DECIMAL as string, so we were calling `.toFixed()` on a string. Fixed with `parseFloat(service.averageRating).toFixed(1)`.

---

## What We Learned

**Database:**
- How to design normalized schemas with foreign keys
- Writing complex JOIN queries across multiple tables
- Using aggregate functions (AVG, COUNT) with GROUP BY
- Importance of constraints (UNIQUE, CHECK, NOT NULL)

**Backend:**
- Building RESTful APIs with Express
- JWT authentication and middleware
- SQL injection prevention with parameterized queries
- Password hashing with bcrypt

**Frontend:**
- React hooks (useState, useEffect)
- API integration with Axios
- React Router for multi-page apps
- Tailwind CSS for rapid styling

**Algorithms:**
- Haversine formula for GPS distance calculation
- Regular expressions for text parsing
- Conflict detection logic for scheduling

---

## Future Improvements

- Email notifications for booking confirmations
- Payment integration (Stripe)
- Calendar export (Google Calendar, iCal)
- Chat between provider and customer
- Mobile app (React Native)
- Provider analytics dashboard

---

## Team

- **Kaleab** - Backend API, Database Design, Full-Stack Development
- **Naol Seyum** - Frontend UI/UX, Database Design

**Course:** Database Systems - Fall 2025  
**University:** Georgia State University

---

## Repository

https://github.com/Kal-debug/PantherGigs
