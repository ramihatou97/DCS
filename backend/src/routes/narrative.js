/**
 * Narrative Generation API Route
 * Handles narrative generation from extracted data
 */

const express = require('express');
const router = express.Router();
const { generateNarrative, generateSummaryWithLLM } = require('../services/narrativeEngine');

/**
 * POST /api/narrative
 * Generate clinical narrative from extracted data
 * 
 * Body:
 * - extracted: object (extracted medical data)
 * - section: string (specific section to generate)
 * - options: object (generation options)
 */
router.post('/', async (req, res, next) => {
  try {
    const { extracted, section, options = {} } = req.body;

    if (!extracted) {
      return res.status(400).json({
        error: 'Missing required field: extracted',
        message: 'Extracted medical data is required for narrative generation'
      });
    }

    const startTime = Date.now();
    
    let result;
    if (options.useLLM) {
      result = await generateSummaryWithLLM(extracted, options);
    } else {
      result = await generateNarrative(extracted, section, options);
    }
    
    const processingTime = Date.now() - startTime;

    res.json({
      success: true,
      narrative: result,
      metadata: {
        processingTime,
        method: options.useLLM ? 'LLM' : 'template',
        endpoint: '/api/narrative'
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
