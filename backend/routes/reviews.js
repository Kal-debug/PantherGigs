// routes/reviews.js
// API routes for reviews

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');

// @route   POST /api/reviews
// @desc    Create a review for a completed booking
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { booking_id, rating, comment } = req.body;
    const reviewer_id = req.user.user_id;

    // Validate
    if (!booking_id || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Please provide booking_id and rating'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if booking exists and is completed
    const [bookings] = await db.query(
      'SELECT * FROM Booking WHERE booking_id = ?',
      [booking_id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const booking = bookings[0];

    // Only customer can review
    if (booking.customer_id !== reviewer_id) {
      return res.status(403).json({
        success: false,
        message: 'Only the customer can review this booking'
      });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed bookings'
      });
    }

    // Check if review already exists
    const [existingReview] = await db.query(
      'SELECT * FROM Review WHERE booking_id = ?',
      [booking_id]
    );

    if (existingReview.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Review already exists for this booking'
      });
    }

    // Insert review
    await db.query(
      'INSERT INTO Review (booking_id, reviewer_id, rating, comment) VALUES (?, ?, ?, ?)',
      [booking_id, reviewer_id, rating, comment || null]
    );

    res.status(201).json({
      success: true,
      message: 'Review created successfully'
    });

  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating review'
    });
  }
});

// @route   GET /api/reviews/service/:serviceId
// @desc    Get all reviews for a service with average rating
// @access  Public
router.get('/service/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;

    // Get all reviews for this service
    const [reviews] = await db.query(`
      SELECT 
        r.*,
        u.name as reviewer_name,
        b.start_at as booking_date
      FROM Review r
      JOIN User u ON r.reviewer_id = u.user_id
      JOIN Booking b ON r.booking_id = b.booking_id
      WHERE b.service_id = ?
      ORDER BY r.created_at DESC
    `, [serviceId]);

    // Calculate average rating
    let avgRating = 0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      avgRating = (sum / reviews.length).toFixed(1);
    }

    res.json({
      success: true,
      data: {
        reviews: reviews,
        averageRating: parseFloat(avgRating),
        totalReviews: reviews.length
      }
    });

  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews'
    });
  }
});

module.exports = router;
