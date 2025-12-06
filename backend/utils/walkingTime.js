// utils/walkingTime.js
// Calculate walking time between campus buildings and check scheduling conflicts

/**
 * Haversine formula to calculate distance between two GPS coordinates
 * Returns distance in kilometers
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
}

/**
 * Calculate walking time between two buildings
 * Walking speed: 5 km/h (83.3 meters/minute)
 * Campus factor: 1.3x (accounts for sidewalks, crosswalks, stairs)
 * Returns walking time in minutes (rounded up)
 */
function calculateWalkingTime(lat1, lon1, lat2, lon2) {
  const distanceKm = haversineDistance(lat1, lon1, lat2, lon2);
  const walkingSpeedKmPerHour = 5;
  const campusFactor = 1.3;
  
  const walkingTimeMinutes = (distanceKm / walkingSpeedKmPerHour) * 60 * campusFactor;
  
  return Math.ceil(walkingTimeMinutes);
}

/**
 * Check if provider has enough time to travel between bookings
 * Includes 5-minute buffer for safety
 */
function canMakeBooking(booking1End, booking2Start, walkingTimeMinutes, bufferMinutes = 5) {
  // Convert to Date objects if strings
  if (typeof booking1End === 'string') {
    booking1End = new Date(booking1End);
  }
  if (typeof booking2Start === 'string') {
    booking2Start = new Date(booking2Start);
  }
  
  const timeDiffMs = booking2Start.getTime() - booking1End.getTime();
  const timeDiffMinutes = Math.floor(timeDiffMs / (1000 * 60));
  const requiredTime = walkingTimeMinutes + bufferMinutes;
  
  return timeDiffMinutes >= requiredTime;
}

/**
 * Main function: Check if new booking conflicts with provider's existing schedule
 * considering walking time between campus buildings
 */
async function checkWalkingTimeConflicts(db, providerId, newBuildingId, newStartTime, newEndTime) {
  try {
    // Convert strings to Date objects if needed
    if (typeof newStartTime === 'string') {
      newStartTime = new Date(newStartTime);
    }
    if (typeof newEndTime === 'string') {
      newEndTime = new Date(newEndTime);
    }

    // Get new building location
    const [newBuilding] = await db.query(
      'SELECT * FROM CampusBuilding WHERE building_id = ?',
      [newBuildingId]
    );

    if (newBuilding.length === 0) {
      return {
        canBook: false,
        message: 'Building not found'
      };
    }

    const newBuildingData = newBuilding[0];

    // Get provider's bookings within a 2-hour window before and after
    const windowStart = new Date(newStartTime.getTime() - 2 * 60 * 60 * 1000);
    const windowEnd = new Date(newEndTime.getTime() + 2 * 60 * 60 * 1000);

    const [existingBookings] = await db.query(`
      SELECT 
        b.*,
        building.lat,
        building.lng,
        building.name as building_name,
        building.code as building_code
      FROM Booking b
      JOIN CampusBuilding building ON b.building_id = building.building_id
      WHERE b.provider_id = ?
        AND b.status IN ('pending', 'confirmed')
        AND (
          (b.start_at < ? AND b.ends_at > ?)
          OR (b.start_at >= ? AND b.start_at < ?)
        )
      ORDER BY b.start_at
    `, [providerId, newEndTime, newStartTime, windowStart, windowEnd]);

    console.log(`Found ${existingBookings.length} existing bookings in window`);

    // Check for exact time overlaps
    for (const booking of existingBookings) {
      const bookingStart = new Date(booking.start_at);
      const bookingEnd = new Date(booking.ends_at);

      // Check if times overlap
      if (
        (newStartTime >= bookingStart && newStartTime < bookingEnd) ||
        (newEndTime > bookingStart && newEndTime <= bookingEnd) ||
        (newStartTime <= bookingStart && newEndTime >= bookingEnd)
      ) {
        return {
          canBook: false,
          message: `Time conflict: Provider already has a booking from ${bookingStart.toLocaleTimeString()} to ${bookingEnd.toLocaleTimeString()}`,
          conflictType: 'time_overlap',
          details: {
            existingBooking: {
              booking_id: booking.booking_id,
              start_at: booking.start_at,
              ends_at: booking.ends_at,
              building: booking.building_name
            }
          }
        };
      }
    }

    // Check walking time for bookings before the new one
    const bookingsBefore = existingBookings.filter(b => new Date(b.ends_at) <= newStartTime);
    if (bookingsBefore.length > 0) {
      const previousBooking = bookingsBefore[bookingsBefore.length - 1];
      const walkingTime = calculateWalkingTime(
        previousBooking.lat,
        previousBooking.lng,
        newBuildingData.lat,
        newBuildingData.lng
      );

      const previousEnd = new Date(previousBooking.ends_at);
      const timeDiffMs = newStartTime.getTime() - previousEnd.getTime();
      const availableMinutes = Math.floor(timeDiffMs / (1000 * 60));
      const requiredMinutes = walkingTime + 5; // 5 min buffer

      console.log(`Previous booking check: ${availableMinutes} min available, ${requiredMinutes} min required`);

      if (availableMinutes < requiredMinutes) {
        return {
          canBook: false,
          message: `Cannot make booking: Walking time from ${previousBooking.building_name} (${previousBooking.building_code}) to ${newBuildingData.name} (${newBuildingData.code}) requires ${walkingTime} minutes, but only ${availableMinutes} minutes available between bookings.`,
          conflictType: 'walking_time_after',
          details: {
            previousBooking: {
              booking_id: previousBooking.booking_id,
              ends_at: previousBooking.ends_at,
              building: previousBooking.building_name,
              building_code: previousBooking.building_code
            },
            requiredWalkingTime: walkingTime,
            availableTime: availableMinutes,
            newBooking: {
              start_at: newStartTime,
              building: newBuildingData.name,
              building_code: newBuildingData.code
            }
          }
        };
      }
    }

    // Check walking time for bookings after the new one
    const bookingsAfter = existingBookings.filter(b => new Date(b.start_at) >= newEndTime);
    if (bookingsAfter.length > 0) {
      const nextBooking = bookingsAfter[0];
      const walkingTime = calculateWalkingTime(
        newBuildingData.lat,
        newBuildingData.lng,
        nextBooking.lat,
        nextBooking.lng
      );

      const nextStart = new Date(nextBooking.start_at);
      const timeDiffMs = nextStart.getTime() - newEndTime.getTime();
      const availableMinutes = Math.floor(timeDiffMs / (1000 * 60));
      const requiredMinutes = walkingTime + 5; // 5 min buffer

      console.log(`Next booking check: ${availableMinutes} min available, ${requiredMinutes} min required`);

      if (availableMinutes < requiredMinutes) {
        return {
          canBook: false,
          message: `Cannot make booking: Walking time from ${newBuildingData.name} (${newBuildingData.code}) to ${nextBooking.building_name} (${nextBooking.building_code}) requires ${walkingTime} minutes, but only ${availableMinutes} minutes available between bookings.`,
          conflictType: 'walking_time_before',
          details: {
            nextBooking: {
              booking_id: nextBooking.booking_id,
              start_at: nextBooking.start_at,
              building: nextBooking.building_name,
              building_code: nextBooking.building_code
            },
            requiredWalkingTime: walkingTime,
            availableTime: availableMinutes,
            newBooking: {
              ends_at: newEndTime,
              building: newBuildingData.name,
              building_code: newBuildingData.code
            }
          }
        };
      }
    }

    console.log('No scheduling conflicts detected');
    
    // No conflicts found
    return {
      canBook: true,
      message: 'No scheduling conflicts'
    };

  } catch (error) {
    console.error('Error checking walking time conflicts:', error);
    return {
      canBook: false,
      message: 'Error checking schedule conflicts',
      error: error.message
    };
  }
}

module.exports = {
  haversineDistance,
  calculateWalkingTime,
  canMakeBooking,
  checkWalkingTimeConflicts
};