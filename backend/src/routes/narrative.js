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
    console.log('[Narrative Route] === REQUEST RECEIVED ===');
    console.log('[Narrative Route] req.body:', req.body);
    console.log('[Narrative Route] req.body keys:', Object.keys(req.body));
    console.log('[Narrative Route] ===========================');

    const { extracted, section, options = {} } = req.body;

    console.log('[Narrative Route] === DESTRUCTURED VALUES ===');
    console.log('[Narrative Route] extracted:', extracted);
    console.log('[Narrative Route] extracted type:', typeof extracted);
    console.log('[Narrative Route] extracted keys:', extracted ? Object.keys(extracted) : 'undefined');
    console.log('[Narrative Route] section:', section);
    console.log('[Narrative Route] options:', options);
    console.log('[Narrative Route] ===========================');

    if (!extracted) {
      console.error('[Narrative Route] ERROR: extracted is missing!');
      console.error('[Narrative Route] Request body was:', JSON.stringify(req.body, null, 2));
      return res.status(400).json({
        error: 'Missing required field: extracted',
        message: 'Extracted medical data is required for narrative generation'
      });
    }

    const startTime = Date.now();

    let result;
    if (options.useLLM) {
      console.log('[Narrative Route] Using LLM generation...');
      result = await generateSummaryWithLLM(extracted, options);
    } else {
      console.log('[Narrative Route] Using template generation...');
      result = await generateNarrative(extracted, section, options);
    }

    const processingTime = Date.now() - startTime;

    console.log('[Narrative Route] === RESPONSE ===');
    console.log('[Narrative Route] result keys:', result ? Object.keys(result) : 'undefined');
    console.log('[Narrative Route] Processing time:', processingTime, 'ms');
    console.log('[Narrative Route] ====================');

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
    console.error('[Narrative Route] === ERROR ===');
    console.error('[Narrative Route] Error:', error);
    console.error('[Narrative Route] Error message:', error.message);
    console.error('[Narrative Route] Error stack:', error.stack);
    console.error('[Narrative Route] ===================');
    next(error);
  }
});

module.exports = router;
