// routes/bookings.js
// API routes for bookings with review status

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');
const { checkWalkingTimeConflicts } = require('../utils/walkingTime');

// @route   GET /api/bookings
// @desc    Get user's bookings with review status
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { status, role } = req.query;

    let query = `
      SELECT 
        b.*,
        s.title as service_title,
        provider.name as provider_name,
        customer.name as customer_name,
        building.name as building_name,
        building.code as building_code,
        r.rating,
        r.comment,
        CASE WHEN r.review_id IS NOT NULL THEN 1 ELSE 0 END as has_review
      FROM Booking b
      JOIN Services s ON b.service_id = s.service_id
      JOIN User provider ON b.provider_id = provider.user_id
      JOIN User customer ON b.customer_id = customer.user_id
      LEFT JOIN CampusBuilding building ON b.building_id = building.building_id
      LEFT JOIN Review r ON b.booking_id = r.booking_id
    `;

    const conditions = [];
    const params = [];

    // Filter by role
    if (role === 'customer') {
      conditions.push('b.customer_id = ?');
      params.push(user_id);
    } else if (role === 'provider') {
      conditions.push('b.provider_id = ?');
      params.push(user_id);
    } else {
      // Get both customer and provider bookings
      conditions.push('(b.customer_id = ? OR b.provider_id = ?)');
      params.push(user_id, user_id);
    }

    if (status) {
      conditions.push('b.status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY b.start_at DESC';

    const [bookings] = await db.query(query, params);

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings'
    });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get single booking by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;

    const [bookings] = await db.query(`
      SELECT 
        b.*,
        s.title as service_title,
        s.category as service_category,
        provider.name as provider_name,
        provider.email as provider_email,
        customer.name as customer_name,
        customer.email as customer_email,
        building.name as building_name,
        building.code as building_code,
        building.lat as building_lat,
        building.lng as building_lng,
        CASE WHEN r.review_id IS NOT NULL THEN 1 ELSE 0 END as has_review
      FROM Booking b
      JOIN Services s ON b.service_id = s.service_id
      JOIN User provider ON b.provider_id = provider.user_id
      JOIN User customer ON b.customer_id = customer.user_id
      LEFT JOIN CampusBuilding building ON b.building_id = building.building_id
      LEFT JOIN Review r ON b.booking_id = r.booking_id
      WHERE b.booking_id = ?
    `, [id]);

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const booking = bookings[0];

    // Check if user is involved in this booking
    if (booking.customer_id !== user_id && booking.provider_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.json({
      success: true,
      data: booking
    });

  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking'
    });
  }
});

// @route   POST /api/bookings
// @desc    Create a new booking with walking time validation
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { service_id, building_id, start_at, ends_at } = req.body;
    const customer_id = req.user.user_id;

    // Validation
    if (!service_id || !building_id || !start_at || !ends_at) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Get service info
    const [services] = await db.query(
      'SELECT * FROM Services WHERE service_id = ? AND active = 1',
      [service_id]
    );

    if (services.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or inactive'
      });
    }

    const service = services[0];

    // Check if user is trying to book their own service
    if (service.provider_id === customer_id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book your own service'
      });
    }

    // Check walking time conflicts
    const walkingTimeCheck = await checkWalkingTimeConflicts(
      db,
      service.provider_id,
      building_id,
      start_at,
      ends_at
    );

    if (!walkingTimeCheck.canBook) {
      return res.status(409).json({
        success: false,
        message: walkingTimeCheck.message,
        conflictType: walkingTimeCheck.conflictType,
        details: walkingTimeCheck.details
      });
    }

    // Create booking
    const [result] = await db.query(
      `INSERT INTO Booking 
       (service_id, provider_id, customer_id, building_id, start_at, ends_at, status, price_usd) 
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [service_id, service.provider_id, customer_id, building_id, start_at, ends_at, service.base_price_usd]
    );

    // Get created booking with full details
    const [newBooking] = await db.query(`
      SELECT 
        b.*,
        s.title as service_title,
        provider.name as provider_name,
        customer.name as customer_name,
        building.name as building_name
      FROM Booking b
      JOIN Services s ON b.service_id = s.service_id
      JOIN User provider ON b.provider_id = provider.user_id
      JOIN User customer ON b.customer_id = customer.user_id
      LEFT JOIN CampusBuilding building ON b.building_id = building.building_id
      WHERE b.booking_id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: newBooking[0]
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking'
    });
  }
});

// @route   PUT /api/bookings/:id
// @desc    Update booking status
// @access  Private
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user_id = req.user.user_id;

    // Validation
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Get booking
    const [bookings] = await db.query(
      'SELECT * FROM Booking WHERE booking_id = ?',
      [id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const booking = bookings[0];

    // Authorization checks
    if (status === 'confirmed' || status === 'completed') {
      // Only provider can confirm or complete
      if (booking.provider_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Only the provider can confirm or complete bookings'
        });
      }
    } else if (status === 'cancelled') {
      // Both provider and customer can cancel
      if (booking.provider_id !== user_id && booking.customer_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to cancel this booking'
        });
      }
    }

    // Update status
    await db.query(
      'UPDATE Booking SET status = ? WHERE booking_id = ?',
      [status, id]
    );

    res.json({
      success: true,
      message: 'Booking status updated successfully'
    });

  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking'
    });
  }
});

// @route   DELETE /api/bookings/:id
// @desc    Cancel/delete a booking
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;

    // Get booking
    const [bookings] = await db.query(
      'SELECT * FROM Booking WHERE booking_id = ?',
      [id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const booking = bookings[0];

    // Check authorization
    if (booking.provider_id !== user_id && booking.customer_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Update to cancelled instead of deleting
    await db.query(
      'UPDATE Booking SET status = ? WHERE booking_id = ?',
      ['cancelled', id]
    );

    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking'
    });
  }
});

module.exports = router;
