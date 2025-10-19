/**
 * Health Check Route
 * Simple endpoint to verify backend is running
 */

const express = require('express');
const router = express.Router();

/**
 * GET /api/health
 * Returns health status of the backend service
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'DCS Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;
