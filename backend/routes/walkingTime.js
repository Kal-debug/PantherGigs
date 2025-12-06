// routes/walkingTime.js
// Test routes for walking time calculations

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { calculateWalkingTime, getBuildingCoordinates } = require('../utils/walkingTime');

// @route   GET /api/walking-time/calculate
// @desc    Calculate walking time between two buildings
// @access  Public
router.get('/calculate', async (req, res) => {
  try {
    const { building1_id, building2_id } = req.query;

    if (!building1_id || !building2_id) {
      return res.status(400).json({
        success: false,
        message: 'Please provide building1_id and building2_id'
      });
    }

    // Get building coordinates
    const building1 = await getBuildingCoordinates(db, building1_id);
    const building2 = await getBuildingCoordinates(db, building2_id);

    if (!building1 || !building2) {
      return res.status(404).json({
        success: false,
        message: 'One or both buildings not found'
      });
    }

    if (!building1.lat || !building1.lng || !building2.lat || !building2.lng) {
      return res.status(400).json({
        success: false,
        message: 'Building coordinates not available'
      });
    }

    // Calculate walking time
    const walkingTimeMinutes = calculateWalkingTime(
      building1.lat,
      building1.lng,
      building2.lat,
      building2.lng
    );

    res.json({
      success: true,
      data: {
        from: {
          building_id: building1.building_id,
          code: building1.code,
          name: building1.name,
          coordinates: {
            lat: building1.lat,
            lng: building1.lng
          }
        },
        to: {
          building_id: building2.building_id,
          code: building2.code,
          name: building2.name,
          coordinates: {
            lat: building2.lat,
            lng: building2.lng
          }
        },
        walkingTimeMinutes: walkingTimeMinutes,
        walkingTimeFormatted: `${walkingTimeMinutes} minute${walkingTimeMinutes !== 1 ? 's' : ''}`
      }
    });

  } catch (error) {
    console.error('Calculate walking time error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating walking time'
    });
  }
});

// @route   GET /api/walking-time/buildings
// @desc    Get all buildings with coordinates
// @access  Public
router.get('/buildings', async (req, res) => {
  try {
    const [buildings] = await db.query(`
      SELECT building_id, code, name, lat, lng
      FROM CampusBuilding
      ORDER BY name
    `);

    res.json({
      success: true,
      count: buildings.length,
      data: buildings
    });

  } catch (error) {
    console.error('Get buildings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching buildings'
    });
  }
});

module.exports = router;
