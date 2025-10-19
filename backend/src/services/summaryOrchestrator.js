/**
 * Summary Orchestrator - Phase 4
 *
 * Unified orchestration layer that coordinates all services to produce
 * the most precise, accurate, specific, structured, and informative
 * discharge summaries possible.
 *
 * Key Features:
 * - Intelligent workflow coordination
 * - Cross-component feedback loops
 * - Quality-driven iterative refinement
 * - Context-aware decision making
 * - Learning from validation errors
 *
 * @module summaryOrchestrator
 */

// ========================================
// TYPE DEFINITIONS
// ========================================

/**
 * @typedef {Object} OrchestrationOptions
 * @property {Object|null} [extractedData=null] - Pre-extracted data from UI corrections
 * @property {boolean} [enableLearning=true] - Enable learning from validation errors
 * @property {boolean} [enableFeedbackLoops=true] - Enable cross-component feedback
 * @property {number} [maxRefinementIterations=2] - Maximum refinement iterations
 * @property {number} [qualityThreshold=0.7] - Quality threshold for refinement (0-1)
 */

/**
 * @typedef {Object} OrchestrationMetadata
 * @property {string} startTime - ISO timestamp of orchestration start
 * @property {number} processingTime - Total processing time in milliseconds
 * @property {string} orchestrationMethod - Orchestration method used
 * @property {number} refinementIterations - Number of refinement passes performed
 */

/**
 * @typedef {Object} OrchestrationResult
 * @property {boolean} success - Whether orchestration succeeded
 * @property {Object|null} summary - Generated narrative sections
 * @property {Object|null} extractedData - Extracted medical data
 * @property {Object|null} validation - Validation results
 * @property {Object|null} intelligence - Clinical intelligence insights
 * @property {Object|null} qualityMetrics - Quality assessment metrics
 * @property {number} refinementIterations - Number of refinement passes
 * @property {OrchestrationMetadata} metadata - Orchestration metadata
 */

// ========================================
// IMPORTS
// ========================================

const { extractMedicalEntities } = require('./extraction.js');
const { validateExtraction, getValidationSummary } = require('./validation.js');
const { generateNarrative } = require('./narrativeEngine.js');
const intelligenceHub = require('./intelligenceHub.js');
const learningEngine = require('./ml/learningEngine.js');
const contextProvider = require('./context/contextProvider.js');
const { calculateQualityMetrics } = require('./qualityMetrics.js');
const performanceMonitor = require('../utils/performanceMonitor.js');

// ========================================
// MAIN FUNCTIONS
// ========================================

/**
 * Orchestrate complete discharge summary generation with intelligence
 *
 * This is the Phase 4 intelligent orchestration layer that coordinates all
 * services with feedback loops and iterative refinement for optimal quality.
 *
 * @param {string|string[]} notes - Clinical notes
 * @param {OrchestrationOptions} [options={}] - Orchestration options
 * @returns {Promise<OrchestrationResult>} Complete discharge summary with intelligence
 *
 * @example
 * const result = await orchestrateSummaryGeneration(notes, {
 *   enableLearning: true,
 *   enableFeedbackLoops: true,
 *   maxRefinementIterations: 2,
 *   qualityThreshold: 0.7
 * });
 */
async function orchestrateSummaryGeneration(notes, options = {}) {
  const {
    extractedData = null, // Pre-extracted data (from UI corrections)
    enableLearning = true,
    enableFeedbackLoops = true,
    maxRefinementIterations = 2,
    qualityThreshold = 0.7
  } = options;

  console.log('[Orchestrator] Starting intelligent summary generation...');

  // Start overall orchestration timing
  const orchestrationTimerId = performanceMonitor.startTimer(
    'Complete Orchestration',
    'orchestration',
    { enableLearning, enableFeedbackLoops, qualityThreshold }
  );

  const startTime = Date.now();
  const orchestrationResult = {
    success: false,
    summary: null,
    extractedData: null,
    validation: null,
    intelligence: null,
    qualityMetrics: null,
    refinementIterations: 0,
    metadata: {
      startTime: new Date().toISOString(),
      processingTime: 0,
      performanceMetrics: {}
    }
  };

  try {
    // PHASE 4 STEP 1: Gather initial intelligence
    const noteText = Array.isArray(notes) ? notes.join('\n\n') : notes;

    // DEBUG: Log notes received
    console.log('[Orchestrator] Notes received:', {
      type: Array.isArray(notes) ? 'array' : typeof notes,
      count: Array.isArray(notes) ? notes.length : 1,
      totalLength: noteText?.length || 0,
      isEmpty: !noteText || noteText.trim().length === 0,
      sample: noteText ? noteText.substring(0, 100) + '...' : 'EMPTY'
    });

    const contextTimerId = performanceMonitor.startTimer(
      'Context Building',
      'intelligence',
      { noteLength: noteText.length }
    );
    const context = contextProvider.buildContext(noteText);
    orchestrationResult.metadata.performanceMetrics.contextBuilding =
      performanceMonitor.endTimer(contextTimerId);

    console.log('[Orchestrator] Context built:', {
      pathology: context.pathology.primary,
      complexity: context.clinical.complexity
    });

    // PHASE 4 STEP 2: Extract or use pre-extracted data
    let extraction;
    if (extractedData) {
      console.log('[Orchestrator] Using pre-extracted data from UI corrections');
      extraction = {
        extracted: extractedData,
        confidence: {},
        pathologyTypes: extractedData.pathology?.types || [],
        clinicalIntelligence: extractedData.clinicalIntelligence || {},
        qualityMetrics: extractedData.qualityMetrics || {},
        metadata: { extractionMethod: 'pre-extracted' }
      };
      orchestrationResult.metadata.performanceMetrics.extraction = { duration: 0, skipped: true };
    } else {
      console.log('[Orchestrator] Extracting data from notes...');
      const extractionTimerId = performanceMonitor.startTimer(
        'Phase 1: Extraction',
        'extraction',
        { noteLength: noteText.length }
      );

      try {
        extraction = await extractMedicalEntities(notes, {
          includeConfidence: true,
          enableDeduplication: true,
          enablePreprocessing: true
        });
      } catch (error) {
        console.error('[Orchestrator] Extraction error:', error);
        // Create minimal extraction result
        extraction = {
          extracted: {},
          confidence: {},
          pathologyTypes: [],
          clinicalIntelligence: {},
          qualityMetrics: {},
          metadata: { extractionMethod: 'failed', error: error.message }
        };
      } finally {
        orchestrationResult.metadata.performanceMetrics.extraction =
          performanceMonitor.endTimer(extractionTimerId);
      }
    }

    orchestrationResult.extractedData = extraction.extracted;

    // PHASE 4 STEP 3: Validate extraction
    console.log('[Orchestrator] Validating extraction...');
    const validationTimerId = performanceMonitor.startTimer(
      'Validation',
      'validation',
      { extractionMethod: extraction.metadata?.extractionMethod }
    );

    const validationResult = validateExtraction(
      extraction.extracted,
      noteText,
      {
        checkCompleteness: true,
        checkConsistency: true
      }
    );

    const validation = getValidationSummary(validationResult);
    orchestrationResult.validation = validation;

    orchestrationResult.metadata.performanceMetrics.validation =
      performanceMonitor.endTimer(validationTimerId);

    // PHASE 4 STEP 4: Gather comprehensive intelligence
    console.log('[Orchestrator] Gathering comprehensive intelligence...');
    const intelligenceTimerId = performanceMonitor.startTimer(
      'Phase 2: Intelligence',
      'intelligence',
      { pathology: context.pathology.primary }
    );

    let intelligence;
    try {
      intelligence = await intelligenceHub.gatherIntelligence(
        notes,
        extraction.extracted,
        {
          includeValidation: true,
          validation: validationResult,
          context
        }
      );

      orchestrationResult.intelligence = intelligence;
    } catch (error) {
      console.error('[Orchestrator] Intelligence gathering error:', error);
      // Create minimal intelligence result
      intelligence = {
        quality: { score: 0 },
        insights: [],
        recommendations: []
      };
      orchestrationResult.intelligence = intelligence;
    } finally {
      orchestrationResult.metadata.performanceMetrics.intelligence =
        performanceMonitor.endTimer(intelligenceTimerId);
    }

    // PHASE 4 STEP 5: Feedback loop - Learn from validation errors
    if (enableFeedbackLoops && enableLearning && validation.errors.critical > 0) {
      console.log('[Orchestrator] Learning from validation errors...');
      await learnFromValidationErrors(validationResult, extraction.extracted, noteText);
    }

    // PHASE 4 STEP 6: Iterative refinement based on quality
    let currentQuality = intelligence.quality?.score || 0;
    let refinedExtraction = extraction.extracted;
    let refinementIteration = 0;

    while (
      enableFeedbackLoops &&
      currentQuality < qualityThreshold &&
      refinementIteration < maxRefinementIterations
    ) {
      refinementIteration++;
      console.log(`[Orchestrator] Refinement iteration ${refinementIteration}...`);

      // Apply intelligence suggestions to improve extraction
      refinedExtraction = await applyIntelligenceSuggestions(
        refinedExtraction,
        intelligence.suggestions,
        noteText
      );

      // Re-validate
      const refinedValidation = validateExtraction(refinedExtraction, noteText);
      const refinedIntelligence = await intelligenceHub.gatherIntelligence(
        notes,
        refinedExtraction
      );

      currentQuality = refinedIntelligence.quality?.score || 0;
      
      if (currentQuality > intelligence.quality?.score) {
        console.log(`[Orchestrator] Quality improved: ${(currentQuality * 100).toFixed(1)}%`);
        orchestrationResult.extractedData = refinedExtraction;
        orchestrationResult.intelligence = refinedIntelligence;
        orchestrationResult.validation = getValidationSummary(refinedValidation);
      } else {
        console.log('[Orchestrator] No quality improvement, stopping refinement');
        break;
      }
    }

    orchestrationResult.refinementIterations = refinementIteration;

    // PHASE 4 STEP 7: Generate narrative with full intelligence context
    console.log('[Orchestrator] Generating narrative with intelligence context...');

    // DEBUG: Log what we're passing to narrative generation
    console.log('[Orchestrator] Narrative generation input:', {
      notesType: Array.isArray(notes) ? 'array' : typeof notes,
      notesCount: Array.isArray(notes) ? notes.length : 1,
      notesLength: noteText?.length || 0,
      hasExtractedData: !!orchestrationResult.extractedData,
      pathology: context.pathology.primary
    });

    const narrativeTimerId = performanceMonitor.startTimer(
      'Phase 3: Narrative Generation',
      'narrative',
      { pathology: context.pathology.primary, style: 'formal' }
    );

    let narrative;
    try {
      narrative = await generateNarrative(
        orchestrationResult.extractedData,
        noteText, // Use noteText instead of notes array
        {
          pathologyType: context.pathology.primary,
          style: 'formal',
          useLLM: null, // Auto-detect
          intelligence: orchestrationResult.intelligence, // Pass intelligence for context
          clinicalIntelligence: extraction.clinicalIntelligence // Pass Phase 2 intelligence
        }
      );

      orchestrationResult.summary = narrative;
    } catch (error) {
      console.error('[Orchestrator] Narrative generation error:', error);
      // Create fallback narrative
      orchestrationResult.summary = {
        chiefComplaint: 'Error generating narrative',
        error: error.message
      };
    } finally {
      // Always end the timer, even if there was an error
      orchestrationResult.metadata.performanceMetrics.narrative =
        performanceMonitor.endTimer(narrativeTimerId);
    }

    // PHASE 4 STEP 8: Calculate final quality metrics
    const qualityTimerId = performanceMonitor.startTimer(
      'Quality Metrics Calculation',
      'quality_metrics'
    );

    try {
      // FIX: Pass correct parameters to calculateQualityMetrics
      // Signature: calculateQualityMetrics(extractedData, narrative, sourceNotes, metrics, options)
      orchestrationResult.qualityMetrics = calculateQualityMetrics(
        orchestrationResult.extractedData,                    // Param 1: extractedData
        narrative,                                             // Param 2: narrative object (FIXED: was validationResult)
        noteText,                                              // Param 3: source notes (FIXED: was fullSummaryText)
        orchestrationResult.metadata.performanceMetrics,       // Param 4: performance metrics
        {                                                      // Param 5: options
          extractionMethod: extraction.metadata?.extractionMethod,
          noteCount: Array.isArray(notes) ? notes.length : 1,
          refinementIterations: refinementIteration,
          pathologyType: orchestrationResult.extractedData?.pathology?.type,
          strictMode: false,
          strictValidation: true,
          checkHallucinations: true,
          checkCrossReferences: true,
          checkReadability: true,
          checkProfessionalism: true
        }
      );

      console.log(`[Orchestrator] Quality metrics calculated: ${orchestrationResult.qualityMetrics.overall.percentage}% overall`);
      console.log(`[Orchestrator] Completeness: ${(orchestrationResult.qualityMetrics.dimensions.completeness.score * 100).toFixed(1)}%`);
      console.log(`[Orchestrator] Critical issues: ${orchestrationResult.qualityMetrics.summary.criticalIssues}`);

    } catch (error) {
      console.error('[Orchestrator] Quality metrics calculation error:', error);
      orchestrationResult.qualityMetrics = {
        overall: 0,
        extraction: 0,
        validation: 0,
        summary: 0
      };
    } finally {
      orchestrationResult.metadata.performanceMetrics.qualityMetrics =
        performanceMonitor.endTimer(qualityTimerId);
    }

    // PHASE 4 STEP 9: Share insights for future learning
    if (enableLearning) {
      await shareOrchestrationInsights(orchestrationResult, context);
    }

    orchestrationResult.success = true;
    orchestrationResult.metadata.processingTime = Date.now() - startTime;

    // End overall orchestration timing
    const orchestrationMetric = performanceMonitor.endTimer(orchestrationTimerId, {
      success: true,
      refinementIterations: refinementIteration,
      qualityScore: orchestrationResult.qualityMetrics.overall?.percentage || orchestrationResult.qualityMetrics.overall
    });

    orchestrationResult.metadata.performanceMetrics.overall = orchestrationMetric;

    console.log(`[Orchestrator] Summary generation complete in ${orchestrationResult.metadata.processingTime}ms`);
    const finalQualityScore = orchestrationResult.qualityMetrics.overall?.percentage || orchestrationResult.qualityMetrics.overall;
    console.log(`[Orchestrator] Final quality: ${typeof finalQualityScore === 'number' ? finalQualityScore : 0}%`);

    // Log performance breakdown
    if (orchestrationMetric?.severity === 'warning' || orchestrationMetric?.severity === 'critical') {
      console.warn('[Orchestrator] [WARN] Performance warning - operation took longer than expected');
      console.log('[Orchestrator] Performance breakdown:');
      console.log(`  - Context: ${orchestrationResult.metadata.performanceMetrics.contextBuilding?.duration || 0}ms`);
      console.log(`  - Extraction: ${orchestrationResult.metadata.performanceMetrics.extraction?.duration || 0}ms`);
      console.log(`  - Intelligence: ${orchestrationResult.metadata.performanceMetrics.intelligence?.duration || 0}ms`);
      console.log(`  - Validation: ${orchestrationResult.metadata.performanceMetrics.validation?.duration || 0}ms`);
      console.log(`  - Narrative: ${orchestrationResult.metadata.performanceMetrics.narrative?.duration || 0}ms`);
      console.log(`  - Quality Metrics: ${orchestrationResult.metadata.performanceMetrics.qualityMetrics?.duration || 0}ms`);
    }

    return orchestrationResult;

  } catch (error) {
    console.error('[Orchestrator] Error during summary generation:', error);

    // End orchestration timing with error
    performanceMonitor.endTimer(orchestrationTimerId, {
      success: false,
      error: error.message
    });

    orchestrationResult.success = false;
    orchestrationResult.error = error.message;
    orchestrationResult.metadata.processingTime = Date.now() - startTime;
    return orchestrationResult;
  }
}

/**
 * Learn from validation errors to improve future extractions
 * @private
 */
async function learnFromValidationErrors(validationResult, extractedData, sourceText) {
  try {
    const errors = validationResult.errors.filter(e => e.severity === 'critical');
    
    for (const error of errors) {
      // Create correction record for learning
      const correction = {
        field: error.field,
        originalValue: error.value,
        correctedValue: null, // Will be learned from user corrections
        context: error.context || '',
        sourceText: sourceText.substring(0, 500), // First 500 chars for context
        errorType: error.type,
        timestamp: new Date().toISOString()
      };

      // Track for future learning
      await learningEngine.trackValidationError(correction);
    }

    console.log(`[Orchestrator] Tracked ${errors.length} validation errors for learning`);
  } catch (error) {
    console.error('[Orchestrator] Error learning from validation:', error);
  }
}

/**
 * Apply intelligence suggestions to improve extraction
 * @private
 */
async function applyIntelligenceSuggestions(extractedData, suggestions, sourceText) {
  if (!suggestions || suggestions.length === 0) {
    return extractedData;
  }

  const improved = { ...extractedData };

  for (const suggestion of suggestions) {
    try {
      if (suggestion.type === 'MISSING_FIELD' && suggestion.field) {
        // Try to extract missing field with focused extraction
        const value = await extractMissingField(suggestion.field, sourceText);
        if (value) {
          improved[suggestion.category] = improved[suggestion.category] || {};
          improved[suggestion.category][suggestion.field] = value;
          console.log(`[Orchestrator] Applied suggestion: Added ${suggestion.field}`);
        }
      }
    } catch (error) {
      console.warn(`[Orchestrator] Could not apply suggestion for ${suggestion.field}:`, error);
    }
  }

  return improved;
}

/**
 * Extract a specific missing field
 * @private
 */
async function extractMissingField(field, sourceText) {
  // Simplified focused extraction - can be enhanced
  // This is a placeholder for targeted re-extraction
  return null;
}

/**
 * Share orchestration insights for learning
 * @private
 */
async function shareOrchestrationInsights(result, context) {
  try {
    const insights = {
      type: 'ORCHESTRATION',
      pathology: context.pathology.primary,
      qualityScore: result.qualityMetrics.overall?.percentage || result.qualityMetrics.overall || 0,
      refinementIterations: result.refinementIterations,
      validationErrors: result.validation.errors.total,
      processingTime: result.metadata.processingTime,
      timestamp: new Date().toISOString()
    };

    intelligenceHub.shareInsight(insights);
    console.log('[Orchestrator] Shared orchestration insights');
  } catch (error) {
    console.error('[Orchestrator] Error sharing insights:', error);
  }
}

module.exports = {
  orchestrateSummaryGeneration
};

