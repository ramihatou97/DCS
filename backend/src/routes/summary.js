/**
 * Summary Generation API Route
 * Orchestrates the complete discharge summary generation process
 */

const express = require('express');
const router = express.Router();
const { orchestrateSummaryGeneration } = require('../services/summaryOrchestrator');

/**
 * POST /api/summary
 * Generate complete discharge summary from clinical notes
 * 
 * This is the main endpoint that orchestrates:
 * 1. Data extraction
 * 2. Intelligence gathering
 * 3. Narrative generation
 * 4. Quality validation
 * 
 * Body:
 * - notes: string | array of strings (clinical notes)
 * - options: object (generation options)
 */
router.post('/', async (req, res, next) => {
  try {
    const { notes, options = {} } = req.body;

    if (!notes) {
      return res.status(400).json({
        error: 'Missing required field: notes',
        message: 'Clinical notes are required for summary generation'
      });
    }

    const startTime = Date.now();
    
    // Orchestrate full summary generation
    const result = await orchestrateSummaryGeneration(notes, options);
    
    const processingTime = Date.now() - startTime;

    res.json({
      success: true,
      summary: result.summary,
      extracted: result.extracted,
      intelligence: result.intelligence,
      quality: result.quality,
      metadata: {
        ...result.metadata,
        processingTime,
        endpoint: '/api/summary'
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
