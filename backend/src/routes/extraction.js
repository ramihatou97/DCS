/**
 * Extraction API Route
 * Handles medical data extraction from clinical notes
 */

const express = require('express');
const router = express.Router();
const { extractMedicalEntities } = require('../services/extraction');
const { handleAsync } = require('../utils/errors');
const { validateClinicalNote } = require('../middleware/validation');
const { llmLimiter } = require('../middleware/rateLimiter');

/**
 * POST /api/extract
 * Extract medical data from clinical notes
 * 
 * Body:
 * - text: string (clinical note text) [REQUIRED]
 * - options: object (extraction options)
 *   - pathology: string (detected pathology type)
 *   - usePatterns: boolean (use pattern-based extraction)
 *   - deduplication: boolean (apply deduplication)
 */
router.post('/', llmLimiter, validateClinicalNote, handleAsync(async (req, res) => {
  const { text, options = {} } = req.body;

  // Perform extraction
  const startTime = Date.now();
  const result = await extractMedicalEntities(text, options);
  const processingTime = Date.now() - startTime;

  // Return result with metadata
  res.json({
    success: true,
    data: result.extracted,
    confidence: result.confidence,
    pathologyTypes: result.pathologyTypes,
    metadata: {
      ...result.metadata,
      processingTime,
      endpoint: '/api/extract'
    }
  });
}));

module.exports = router;
