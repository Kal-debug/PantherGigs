# PantherGigs API Testing

## Quick Start
1. Start server: `npm run dev`
2. Server runs on: `http://localhost:3000`
3. All protected routes require JWT token in Authorization header

## Authentication

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Student",
    "email": "teststudent@gsu.edu",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teststudent@gsu.edu",
    "password": "password123"
  }'
```
**Save the token from response!**

---

## Services API

### Get All Services
```bash
curl http://localhost:3000/api/services
```

### Get Services with Filters
```bash
# Filter by category
curl "http://localhost:3000/api/services?category=Academic"

# Search by keyword
curl "http://localhost:3000/api/services?search=tutoring"

# Price range
curl "http://localhost:3000/api/services?min_price=20&max_price=50"

# Active services only
curl "http://localhost:3000/api/services?active=true"

# Combine filters
curl "http://localhost:3000/api/services?category=Academic&max_price=30"
```

### Get Single Service
```bash
curl http://localhost:3000/api/services/1
```

### Get Service Categories
```bash
curl http://localhost:3000/api/services/categories/list
```

### Create Service (Protected)
```bash
curl -X POST http://localhost:3000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Python Programming Help",
    "category": "Academic",
    "description": "Help with Python assignments and projects",
    "duration_min": 60,
    "base_price_usd": 30.00
  }'
```

### Update Service (Protected)
```bash
curl -X PUT http://localhost:3000/api/services/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Updated Service Title",
    "base_price_usd": 35.00
  }'
```

### Delete Service (Protected)
```bash
curl -X DELETE http://localhost:3000/api/services/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Bookings API

### Get All User Bookings (Protected)
```bash
# Get all bookings (as customer or provider)
curl http://localhost:3000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get bookings as provider
curl "http://localhost:3000/api/bookings?role=provider" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get bookings as customer
curl "http://localhost:3000/api/bookings?role=customer" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Filter by status
curl "http://localhost:3000/api/bookings?status=confirmed" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Single Booking (Protected)
```bash
curl http://localhost:3000/api/bookings/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Booking (Protected)
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "service_id": 1,
    "building_id": 2,
    "start_at": "2025-12-10 14:00:00",
    "ends_at": "2025-12-10 15:00:00"
  }'
```

### Update Booking Status (Protected)
```bash
# Confirm booking (provider only)
curl -X PUT http://localhost:3000/api/bookings/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "status": "confirmed"
  }'

# Complete booking (provider only)
curl -X PUT http://localhost:3000/api/bookings/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "status": "completed"
  }'

# Cancel booking (customer or provider)
curl -X PUT http://localhost:3000/api/bookings/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "status": "cancelled"
  }'
```

### Delete Booking (Protected)
```bash
curl -X DELETE http://localhost:3000/api/bookings/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Testing Workflow

### 1. Register and Login
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"jdoe@gsu.edu","password":"test123"}'

# Login (save the token!)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jdoe@gsu.edu","password":"test123"}'
```

### 2. Browse Services
```bash
# See all services
curl http://localhost:3000/api/services

# Search for tutoring
curl "http://localhost:3000/api/services?search=tutoring"
```

### 3. Create a Service
```bash
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:3000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Data Structures Tutoring",
    "category": "Academic",
    "description": "Expert help with DS&A",
    "duration_min": 90,
    "base_price_usd": 40.00
  }'
```

### 4. Book a Service
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "service_id": 1,
    "building_id": 2,
    "start_at": "2025-12-15 10:00:00",
    "ends_at": "2025-12-15 11:00:00"
  }'
```

### 5. Check Your Bookings
```bash
curl http://localhost:3000/api/bookings \
  -H "Authorization: Bearer $TOKEN"
```

---

## Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (missing/invalid data)
- `401` - Unauthorized (no token)
- `403` - Forbidden (not authorized)
- `404` - Not Found
- `500` - Server Error

## Notes

- All timestamps should be in format: `YYYY-MM-DD HH:MM:SS`
- GSU email required: must end with `@gsu.edu`
- JWT tokens expire after 24 hours
- Protected routes require `Authorization: Bearer <token>` header
