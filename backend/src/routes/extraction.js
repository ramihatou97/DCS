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

  console.log('[Extraction Route] === EXTRACTION SERVICE RESULT ===');
  console.log('[Extraction Route] Result keys:', Object.keys(result));
  console.log('[Extraction Route] result.extracted:', result.extracted);
  console.log('[Extraction Route] result.extracted keys:', result.extracted ? Object.keys(result.extracted) : 'undefined');
  console.log('[Extraction Route] result.extracted.dates:', result.extracted?.dates);
  console.log('[Extraction Route] ====================================');

  // Return result with metadata
  const response = {
    success: true,
    data: result.extracted,
    confidence: result.confidence,
    pathologyTypes: result.pathologyTypes,
    metadata: {
      ...result.metadata,
      processingTime,
      endpoint: '/api/extract'
    }
  };

  console.log('[Extraction Route] === RESPONSE TO FRONTEND ===');
  console.log('[Extraction Route] Response keys:', Object.keys(response));
  console.log('[Extraction Route] response.data:', response.data);
  console.log('[Extraction Route] response.data keys:', response.data ? Object.keys(response.data) : 'undefined');
  console.log('[Extraction Route] response.data.dates:', response.data?.dates);
  console.log('[Extraction Route] ===================================');

  res.json(response);
}));

module.exports = router;
