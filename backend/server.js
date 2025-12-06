// server.js
// Main server file for PantherGigs backend

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/auth');
const servicesRoutes = require('./routes/services');
const bookingsRoutes = require('./routes/bookings');
const walkingTimeRoutes = require('./routes/walkingTime');
const parserRoutes = require('./routes/parser');
const reviewsRoutes = require('./routes/reviews');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/walking-time', walkingTimeRoutes);
app.use('/api/parser', parserRoutes);
app.use('/api/reviews', reviewsRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'PantherGigs API is running',
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API endpoint: http://localhost:${PORT}`);
});

module.exports = app;
