# PantherGigs Database

MySQL database schema for the PantherGigs student service marketplace platform.

## Database Overview

PantherGigs uses a MySQL database with 6 core tables to manage student service listings, bookings, and reviews within the Georgia State University community.

### Tables

1. **User** - Student accounts and authentication
2. **CampusBuilding** - GSU building locations with GPS coordinates
3. **Services** - Service listings created by providers
4. **AvailabilitySlot** - Provider availability schedules
5. **Booking** - Service booking transactions
6. **Review** - Booking reviews and ratings

## Setup Instructions

### Prerequisites

- MySQL 8.0 or higher
- Database client (MySQL Workbench, DBeaver, or command line)

### Installation

1. **Create the database**
   ```bash
   mysql -u root -p
   CREATE DATABASE panthergigs;
   ```

2. **Run the schema script**
   ```bash
   mysql -u root -p panthergigs < schema.sql
   ```

3. **Load test data (optional)**
   ```bash
   mysql -u root -p panthergigs < seed.sql
   ```

### Alternative: Run in DBeaver

1. Connect to your MySQL server
2. Create new database: `panthergigs`
3. Open `schema.sql` and execute
4. Open `seed.sql` and execute (optional)

## Database Schema

### Entity Relationship

```
User (1) ─────< (Many) Services
User (1) ─────< (Many) AvailabilitySlot
User (1) ─────< (Many) Booking (as provider)
User (1) ─────< (Many) Booking (as customer)
Services (1) ─< (Many) Booking
CampusBuilding (1) ─< (Many) Booking
Booking (1) ───< (1) Review
```

### Key Relationships

- A **User** can be both a service provider and a customer
- **Services** are offered by users (providers)
- **AvailabilitySlot** defines when providers are available
- **Booking** connects customers with services at specific buildings
- **Review** is tied to a completed booking

## Test Data

The `seed.sql` file includes:
- 5 test users (GSU students)
- 7 campus buildings with real coordinates
- 7 sample services across different categories
- 10 availability time slots
- 4 sample bookings
- 2 reviews

## Database Configuration

### Connection Details (Development)

```
Host: localhost
Port: 3306
Database: panthergigs
Username: root
Password: [your-password]
```

### Recommended Settings

- Character Set: `utf8mb4`
- Collation: `utf8mb4_unicode_ci`
- Time Zone: `UTC`

## Maintenance

### Reset Database

To completely reset the database:

```sql
DROP DATABASE IF EXISTS panthergigs;
CREATE DATABASE panthergigs;
USE panthergigs;
SOURCE schema.sql;
SOURCE seed.sql;
```

### Backup

```bash
mysqldump -u root -p panthergigs > backup_$(date +%Y%m%d).sql
```

## Future Enhancements

- Add password hashing for user authentication
- Implement payment transaction tracking
- Add service categories table for better organization
- Include message/chat functionality between users
- Add notification preferences table

## Contributors

PantherGigs Database Team - Fall 2025
