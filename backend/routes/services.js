// routes/services.js
// API routes for services with review statistics

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');

// @route   GET /api/services
// @desc    Get all services with filters and review stats
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, search, min_price, max_price, provider_id, active } = req.query;

    // Base query with review stats
    let query = `
      SELECT 
        s.*,
        u.name as provider_name,
        u.email as provider_email,
        COALESCE(AVG(r.rating), 0) as averageRating,
        COUNT(DISTINCT r.review_id) as totalReviews
      FROM Services s
      JOIN User u ON s.provider_id = u.user_id
      LEFT JOIN Booking b ON s.service_id = b.service_id
      LEFT JOIN Review r ON b.booking_id = r.booking_id
    `;

    const conditions = [];
    const params = [];

    // Filters
    if (active !== undefined) {
      conditions.push('s.active = ?');
      params.push(active === 'true' ? 1 : 0);
    }

    if (category) {
      conditions.push('s.category = ?');
      params.push(category);
    }

    if (search) {
      conditions.push('(s.title LIKE ? OR s.description LIKE ? OR s.category LIKE ?)');
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    if (min_price) {
      conditions.push('s.base_price_usd >= ?');
      params.push(min_price);
    }

    if (max_price) {
      conditions.push('s.base_price_usd <= ?');
      params.push(max_price);
    }

    if (provider_id) {
      conditions.push('s.provider_id = ?');
      params.push(provider_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Group by and order
    query += ' GROUP BY s.service_id ORDER BY s.service_id DESC';

    const [services] = await db.query(query, params);

    res.json({
      success: true,
      count: services.length,
      data: services
    });

  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching services'
    });
  }
});

// @route   GET /api/services/:id
// @desc    Get single service by ID with review stats
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [services] = await db.query(`
      SELECT 
        s.*,
        u.name as provider_name,
        u.email as provider_email,
        COALESCE(AVG(r.rating), 0) as averageRating,
        COUNT(DISTINCT r.review_id) as totalReviews
      FROM Services s
      JOIN User u ON s.provider_id = u.user_id
      LEFT JOIN Booking b ON s.service_id = b.service_id
      LEFT JOIN Review r ON b.booking_id = r.booking_id
      WHERE s.service_id = ?
      GROUP BY s.service_id
    `, [id]);

    if (services.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Get availability slots
    const [availability] = await db.query(
      'SELECT * FROM AvailabilitySlot WHERE provider_id = ?',
      [services[0].provider_id]
    );

    res.json({
      success: true,
      data: {
        ...services[0],
        availability: availability
      }
    });

  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching service'
    });
  }
});

// @route   POST /api/services
// @desc    Create a new service
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, category, description, duration_min, base_price_usd } = req.body;
    const provider_id = req.user.user_id;

    // Validation
    if (!title || !category || !duration_min || !base_price_usd) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const [result] = await db.query(
      'INSERT INTO Services (provider_id, title, category, description, duration_min, base_price_usd) VALUES (?, ?, ?, ?, ?, ?)',
      [provider_id, title, category, description, duration_min, base_price_usd]
    );

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: {
        service_id: result.insertId
      }
    });

  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating service'
    });
  }
});

// @route   PUT /api/services/:id
// @desc    Update a service
// @access  Private
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const user_id = req.user.user_id;

    // Check if service exists and belongs to user
    const [services] = await db.query(
      'SELECT * FROM Services WHERE service_id = ?',
      [id]
    );

    if (services.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    if (services[0].provider_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this service'
      });
    }

    // Build update query
    const allowedFields = ['title', 'category', 'description', 'duration_min', 'base_price_usd', 'active'];
    const updateFields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    values.push(id);

    await db.query(
      `UPDATE Services SET ${updateFields.join(', ')} WHERE service_id = ?`,
      values
    );

    res.json({
      success: true,
      message: 'Service updated successfully'
    });

  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating service'
    });
  }
});

// @route   DELETE /api/services/:id
// @desc    Delete a service
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;

    // Check if service exists and belongs to user
    const [services] = await db.query(
      'SELECT * FROM Services WHERE service_id = ?',
      [id]
    );

    if (services.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    if (services[0].provider_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this service'
      });
    }

    await db.query('DELETE FROM Services WHERE service_id = ?', [id]);

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });

  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting service'
    });
  }
});

// @route   GET /api/services/categories/list
// @desc    Get all categories with counts
// @access  Public
router.get('/categories/list', async (req, res) => {
  try {
    const [categories] = await db.query(`
      SELECT category, COUNT(*) as count
      FROM Services
      WHERE active = 1
      GROUP BY category
      ORDER BY category
    `);

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
});

module.exports = router;
