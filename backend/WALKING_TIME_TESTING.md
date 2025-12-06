# Walking Time Scheduler - Testing Guide

## Overview
The walking time scheduler prevents providers from accepting bookings that would require impossible travel times between GSU campus buildings. It uses GPS coordinates and the Haversine formula to calculate walking distances.

## How It Works

1. **Distance Calculation**: Uses lat/long coordinates from CampusBuilding table
2. **Walking Speed**: Average 5 km/h (83.3 meters/minute)
3. **Campus Factor**: 1.3x multiplier for sidewalks, crosswalks, stairs
4. **Buffer Time**: 5-minute buffer added to walking time
5. **Conflict Detection**: Checks bookings before and after proposed time

## Test 1: Calculate Walking Time Between Buildings

### Get all buildings with coordinates
```bash
curl http://localhost:3000/api/walking-time/buildings
```

### Calculate walking time between two buildings
```bash
# Example: From Classroom South (ID: 1) to Library South (ID: 2)
curl "http://localhost:3000/api/walking-time/calculate?building1_id=1&building2_id=2"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "from": {
      "building_id": 1,
      "code": "CLSN",
      "name": "Classroom South",
      "coordinates": { "lat": 33.753047, "lng": -84.385483 }
    },
    "to": {
      "building_id": 2,
      "code": "LIB",
      "name": "Library South",
      "coordinates": { "lat": 33.753525, "lng": -84.387789 }
    },
    "walkingTimeMinutes": 3,
    "walkingTimeFormatted": "3 minutes"
  }
}
```

## Test 2: Booking with Walking Time Validation

### Scenario: Create back-to-back bookings that are TOO CLOSE

**Step 1: Login as a user**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jsmith@gsu.edu","password":"password123"}'
```
Save the token!

**Step 2: Create first booking (as customer)**
```bash
TOKEN="your_token_here"

# Book service at Classroom South (building_id: 1)
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "service_id": 1,
    "building_id": 1,
    "start_at": "2025-12-10 14:00:00",
    "ends_at": "2025-12-10 15:00:00"
  }'
```

**Step 3: Try to create conflicting booking (as provider of service 1)**

First, login as the provider (user who owns service_id 1):
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jsmith@gsu.edu","password":"password123"}'
```

Then try to book another service immediately after at a distant location:
```bash
PROVIDER_TOKEN="provider_token_here"

# Try to book at Recreation Center (building_id: 5) right after - only 3 minutes gap
# This should FAIL because walking time from CLSN to REC is ~5-6 minutes
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -d '{
    "service_id": 2,
    "building_id": 5,
    "start_at": "2025-12-10 15:03:00",
    "ends_at": "2025-12-10 16:00:00"
  }'
```

**Expected Response (CONFLICT):**
```json
{
  "success": false,
  "message": "Cannot make booking: Walking time from Classroom South (CLSN) to Recreation Center (REC) requires 6 minutes, but only 3 minutes available between bookings.",
  "conflictType": "walking_time_after",
  "details": {
    "previousBooking": {
      "booking_id": 1,
      "ends_at": "2025-12-10T15:00:00.000Z",
      "building": "Classroom South",
      "building_code": "CLSN"
    },
    "requiredWalkingTime": 6,
    "availableTime": 3,
    "newBooking": {
      "start_at": "2025-12-10T15:03:00.000Z",
      "building": "Recreation Center",
      "building_code": "REC"
    }
  }
}
```

## Test 3: Successful Booking with Adequate Time

```bash
# Book with 15 minutes gap - should SUCCEED
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -d '{
    "service_id": 2,
    "building_id": 5,
    "start_at": "2025-12-10 15:15:00",
    "ends_at": "2025-12-10 16:00:00"
  }'
```

**Expected Response (SUCCESS):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking_id": 2,
    "service_title": "Moving Help",
    "building_name": "Recreation Center",
    ...
  }
}
```

## Key Features Demonstrated

1. ✅ **GPS Distance Calculation**: Uses Haversine formula with real GSU coordinates
2. ✅ **Walking Speed Adjustment**: Accounts for campus terrain (1.3x factor)
3. ✅ **Buffer Time**: Adds 5-minute safety buffer
4. ✅ **Conflict Detection**: Checks both before and after existing bookings
5. ✅ **Clear Error Messages**: Tells user exactly why booking failed and how much time is needed

## Testing Checklist

- [ ] Calculate walking time between all building pairs
- [ ] Create booking at Building A
- [ ] Try to create booking at distant Building B immediately after (should fail)
- [ ] Create booking at Building B with adequate time gap (should succeed)
- [ ] Verify error messages include specific building names and times
- [ ] Test with multiple back-to-back bookings

## Database Queries to Verify

```sql
-- See all bookings for a provider with building info
SELECT 
  b.*,
  building.code,
  building.name,
  building.lat,
  building.lng
FROM Booking b
LEFT JOIN CampusBuilding building ON b.building_id = building.building_id
WHERE b.provider_id = 1
ORDER BY b.start_at;

-- Calculate distance between all buildings
SELECT 
  b1.code as from_code,
  b1.name as from_name,
  b2.code as to_code,
  b2.name as to_name,
  ROUND(
    6371 * 2 * ASIN(
      SQRT(
        POW(SIN((RADIANS(b2.lat) - RADIANS(b1.lat)) / 2), 2) +
        COS(RADIANS(b1.lat)) * COS(RADIANS(b2.lat)) *
        POW(SIN((RADIANS(b2.lng) - RADIANS(b1.lng)) / 2), 2)
      )
    ) * 1000, 0
  ) as distance_meters
FROM CampusBuilding b1
CROSS JOIN CampusBuilding b2
WHERE b1.building_id < b2.building_id
ORDER BY distance_meters DESC;
```
