# 🏛️ TempleDB — Campus Service Booking Platform

TempleDB is a full-stack web application designed to help Georgia State University students discover, book, and review campus-based peer services such as tutoring, photography, hairstyling, or fitness training.  
It streamlines student to student service exchange by combining verified profiles, real-time availability, and integrated reviews  all connected through a central MySQL database.


Features

 Basic Functions
- **User Registration & Login** — secure authentication using bcrypt + JWT.  
- **Service Listings** — create, update, search, and delete listings by category.  
- **Booking System** — schedule services, view active/past bookings, cancel sessions.  
- **Reviews** — leave ratings and comments after completed bookings.  
- **Admin Dashboard** — view all services and users (future implementation).

 Advanced Features
- **Walking-Time Scheduler:** calculates travel feasibility between GSU campus buildings using latitude/longitude coordinates.  
- **Social Media Parser:** extracts service data (title, price, duration, category) from Instagram or Facebook captions using regex and NLP parsing.  
- **Optimized Queries:** supports joins across multiple tables and aggregate queries (e.g., average provider rating, popular categories).

---

 Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | React.js + Vite (hosted on Vercel) |
| **Backend** | Node.js + Express.js (hosted on Railway) |
| **Database** | MySQL + Sequelize ORM |
| **Authentication** | JWT + bcryptjs |
| **Testing Tools** | Postman API Collection |
| **Version Control** | Git & GitHub |



Relational Schema Overview

**User**(`user_id`, `name`, `email`, `gsu_verified`, `created_at`)  
**CampusBuilding**(`building_id`, `code`, `name`, `lat`, `lng`)  
**Services**(`service_id`, `provider_id`, `title`, `category`, `description`, `duration_min`, `base_price_usd`, `active`)  
**AvailabilitySlot**(`provider_id`, `availability_id`, `dow`, `starttime`, `endtime`)  
**Booking**(`booking_id`, `service_id`, `provider_id`, `customer_id`, `building_id`, `start_at`, `ends_at`, `status`, `price_usd`)  
**Review**(`review_id`, `booking_id`, `reviewer_id`, `rating`, `comment`, `created_at`)


Installation & Setup

 Clone Repository
```bash
git clone https://github.com/yourusername/templedb.git
cd templedb/backend
