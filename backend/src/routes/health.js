/**
 * Health Check Route
 * Simple endpoint to verify backend is running
 * Task 3: Added feature flag status information
 */

const express = require('express');
const router = express.Router();
const { getFeatureFlagStats } = require('../utils/featureFlags');

/**
 * GET /api/health
 * Returns health status of the backend service
 * Includes feature flag status for debugging
 */
router.get('/', (req, res) => {
  const featureFlagStats = getFeatureFlagStats();

  res.json({
    status: 'healthy',
    service: 'DCS Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    featureFlags: {
      total: featureFlagStats.total,
      enabled: featureFlagStats.enabled,
      disabled: featureFlagStats.disabled,
      phases: {
        phase0: {
          enabled: featureFlagStats.phase0.enabled,
          total: featureFlagStats.phase0.total,
          percentage: Math.round((featureFlagStats.phase0.enabled / featureFlagStats.phase0.total) * 100)
        },
        phase1_5: {
          enabled: featureFlagStats.phase1_5.enabled,
          total: featureFlagStats.phase1_5.total,
          percentage: Math.round((featureFlagStats.phase1_5.enabled / featureFlagStats.phase1_5.total) * 100)
        },
        phase3: {
          enabled: featureFlagStats.phase3.enabled,
          total: featureFlagStats.phase3.total,
          percentage: Math.round((featureFlagStats.phase3.enabled / featureFlagStats.phase3.total) * 100)
        }
      }
    }
  });
});

module.exports = router;
