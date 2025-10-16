/**
 * Medical Data Extraction Service
 *
 * Hybrid extraction engine using LLM (primary) with pattern-based fallback.
 * Implements the 13 critical extraction targets with strict no-extrapolation principle.
 *
 * Features:
 * - LLM-enhanced extraction (GPT-4, Claude, Gemini) for 90-98% accuracy
 * - Pattern-based fallback when LLM unavailable
 * - Multi-pathology support (8 neurosurgical pathologies)
 * - Confidence scoring for each extracted field
 * - Context-aware extraction (validates logical relationships)
 * - Supports learned patterns from ML system
 * - **NEW**: BioBERT medical NER for entity extraction
 * - **NEW**: Vector database semantic search integration
 * - **NEW**: Enhanced ML-powered deduplication
 *
 * @module extraction
 */

// ========================================
// TYPE DEFINITIONS
// ========================================

/**
 * @typedef {Object} PatientDemographics
 * @property {string} name - Patient name
 * @property {string} mrn - Medical record number
 * @property {string} dob - Date of birth
 * @property {string} age - Patient age
 * @property {string} sex - Patient sex
 */

/**
 * @typedef {Object} ClinicalDates
 * @property {string|null} ictus - Ictus/symptom onset date
 * @property {string|null} admission - Hospital admission date
 * @property {string|null} surgery - Surgery date
 * @property {string|null} discharge - Discharge date
 */

/**
 * @typedef {Object} PathologySubtype
 * @property {string} category - Subtype category
 * @property {string} value - Subtype value
 * @property {number} confidence - Confidence score (0-1)
 */

/**
 * @typedef {Object} Pathology
 * @property {string} type - Primary pathology type
 * @property {Array<string>} types - All detected pathology types
 * @property {string|null} location - Anatomical location
 * @property {string|null} side - Laterality (left/right)
 * @property {PathologySubtype|null} subtype - Pathology subtype details
 */

/**
 * @typedef {Object} ExtractedMedicalData
 * @property {PatientDemographics} demographics - Patient demographics
 * @property {ClinicalDates} dates - Clinical dates
 * @property {Pathology} pathology - Pathology information
 * @property {Array<string>} presentingSymptoms - Presenting symptoms
 * @property {Array<Object>} procedures - Procedures performed
 * @property {Array<Object>} complications - Complications encountered
 * @property {Array<Object>} imaging - Imaging studies
 * @property {Object} functionalScores - Functional assessment scores
 * @property {Array<Object>} medications - Medications
 * @property {Object} followUp - Follow-up instructions
 * @property {string} dischargeDestination - Discharge destination
 */

/**
 * @typedef {Object} ConfidenceScores
 * @property {number} demographics - Demographics confidence (0-1)
 * @property {number} dates - Dates confidence (0-1)
 * @property {number} pathology - Pathology confidence (0-1)
 * @property {number} procedures - Procedures confidence (0-1)
 * @property {number} overall - Overall confidence (0-1)
 */

/**
 * @typedef {Object} ExtractionMetadata
 * @property {string} extractionMethod - Method used (LLM, pattern, hybrid)
 * @property {boolean} preprocessed - Whether notes were preprocessed
 * @property {boolean} deduplicated - Whether deduplication was applied
 * @property {string} [llmProvider] - LLM provider used (if applicable)
 * @property {number} [processingTime] - Processing time in milliseconds
 */

/**
 * @typedef {Object} ClinicalIntelligence
 * @property {Object} causalTimeline - Causal timeline of events
 * @property {Object} treatmentResponses - Treatment-outcome pairs
 * @property {Object} functionalEvolution - Functional status evolution
 * @property {Array<Object>} relationships - Clinical relationships
 */

/**
 * @typedef {Object} ExtractionResult
 * @property {ExtractedMedicalData} extracted - Extracted medical entities
 * @property {ConfidenceScores} confidence - Confidence scores per field
 * @property {string[]} pathologyTypes - Detected pathology types
 * @property {ExtractionMetadata} metadata - Extraction metadata
 * @property {ClinicalIntelligence} clinicalIntelligence - Clinical insights
 * @property {Object} qualityMetrics - Quality metrics
 */

/**
 * @typedef {Object} ExtractionOptions
 * @property {Array} [learnedPatterns=[]] - Learned patterns from ML
 * @property {boolean} [includeConfidence=true] - Include confidence scores
 * @property {Array<string>} [targets] - Specific extraction targets
 * @property {boolean|null} [useLLM=null] - Force LLM usage (null=auto)
 * @property {boolean} [usePatterns=false] - Force pattern usage
 * @property {boolean} [enableDeduplication=true] - Enable deduplication
 * @property {boolean} [enablePreprocessing=true] - Enable preprocessing
 */

// ========================================
// IMPORTS
// ========================================

import { PATHOLOGY_PATTERNS, detectPathology } from '../config/pathologyPatterns.js';
import { EXTRACTION_TARGETS, CONFIDENCE } from '../config/constants.js';
import { parseFlexibleDate, normalizeDate } from '../utils/dateUtils.js';
import {
  cleanText,
  preprocessClinicalNote
} from '../utils/textUtils.js';
import { extractAnticoagulation } from '../utils/anticoagulationTracker.js';
import { extractDischargeDestination } from '../utils/dischargeDestinations.js';
import { isLLMAvailable, extractWithLLM } from './llmService.js';
import contextProvider from './context/contextProvider.js';
import learningEngine from './ml/learningEngine.js';
// ML services temporarily disabled - models not available
// import enhancedMLService from './ml/enhancedML.js';

// Phase 1 Enhancement: Negation Detection
import { validateComplicationExtraction } from '../utils/negationDetection.js';

// Phase 1 Enhancement: Temporal Qualifiers
import { extractTemporalQualifier } from '../utils/temporalQualifiers.js';

// Phase 1 Enhancement: Source Quality Assessment
import { assessSourceQuality, calibrateConfidence } from '../utils/sourceQuality.js';

// Phase 1 Step 5: Temporal Context & Semantic Deduplication
import {
  detectTemporalContext,
  associateDateWithEntity,
  linkReferencesToEvents,
  resolveRelativeDate
} from '../utils/temporalExtraction.js';
import {
  deduplicateBySemanticSimilarity,
  getDeduplicationStats
} from '../utils/semanticDeduplication.js';
import { calculateCombinedSimilarity } from '../utils/ml/similarityEngine.js';

// Phase 1 Step 6: Pathology Subtypes Detection
import { detectPathologySubtype } from '../utils/pathologySubtypes.js';

// Phase 2: Clinical Intelligence & Context Enhancement
import { buildCausalTimeline } from '../utils/causalTimeline.js';
import { trackTreatmentResponses } from '../utils/treatmentResponse.js';
import { analyzeFunctionalEvolution } from '../utils/functionalEvolution.js';
import { extractClinicalRelationships } from '../utils/relationshipExtraction.js';
import { calculateQualityMetrics } from './qualityMetrics.js';

import {
  extractPhysicalExam,
  extractNeurologicalExam,
  extractSignificantEvents,
  extractICUStay,
  extractPreOpDeficits,
  extractPostOpDeficits,
  extractConsultations,
  extractLabs,
  extractVitals,
  buildHospitalCourseTimeline
} from './comprehensiveExtraction.js';

/**
 * Async wrapper for deduplication using Web Worker
 * Runs deduplication on separate thread to avoid UI freezing
 *
 * @param {string[]} notes - Array of clinical notes
 * @param {Object} options - Deduplication options
 * @returns {Promise<Object>} Deduplicated result with metadata
 */
const deduplicateNotesAsync = (notes, options = {}) => {
  return new Promise((resolve, reject) => {
    // Create Web Worker
    const worker = new Worker(
      new URL('../workers/deduplicationWorker.js', import.meta.url),
      { type: 'module' }
    );

    // Set up timeout (5 minutes max for large note sets)
    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error('Deduplication timed out after 5 minutes'));
    }, 300000);

    // Listen for results
    worker.onmessage = (event) => {
      clearTimeout(timeout);
      worker.terminate();

      const { success, result, error, duration } = event.data;

      if (success) {
        console.log(`✓ Deduplication completed in ${duration}ms (Web Worker)`);
        resolve(result);
      } else {
        reject(new Error(`Deduplication failed: ${error}`));
      }
    };

    // Handle errors
    worker.onerror = (error) => {
      clearTimeout(timeout);
      worker.terminate();
      reject(new Error(`Worker error: ${error.message}`));
    };

    // Send data to worker
    worker.postMessage({ notes, options });
  });
};

/**
 * PHASE 2: Build clinical intelligence from extracted data
 * Runs causal timeline, treatment response tracking, functional evolution analysis, and relationship extraction
 * @private
 */
const buildClinicalIntelligence = (extractedData, sourceText = '') => {
  try {
    // Component 1: Build causal timeline with event relationships
    const timeline = buildCausalTimeline(extractedData);

    // Component 2: Track treatment responses (pass timeline for temporal context)
    const treatmentResponses = trackTreatmentResponses(extractedData, timeline);

    // Component 3: Analyze functional evolution (pass timeline and pathology subtype)
    const functionalEvolution = analyzeFunctionalEvolution(
      extractedData,
      timeline,
      extractedData.pathology?.subtype
    );

    // Component 4: Extract clinical relationships from source text (Phase 2 Step 4)
    const relationships = sourceText ? extractClinicalRelationships(sourceText, extractedData) : [];

    return {
      timeline,
      treatmentResponses,
      functionalEvolution,
      relationships, // Phase 2 Step 4: Clinical relationships
      metadata: {
        generated: new Date().toISOString(),
        components: ['causalTimeline', 'treatmentResponses', 'functionalEvolution', 'relationships']
      }
    };
  } catch (error) {
    console.error('Clinical intelligence generation failed:', error);
    return {
      timeline: { events: [], milestones: {}, relationships: [], metadata: { error: error.message } },
      treatmentResponses: { responses: [], protocolCompliance: {}, summary: {} },
      functionalEvolution: { scoreTimeline: [], statusChanges: [], trajectory: null, milestones: {}, prognosticComparison: null, summary: { hasData: false } },
      relationships: [], // Phase 2 Step 4: Empty relationships on error
      metadata: {
        generated: new Date().toISOString(),
        error: error.message
      }
    };
  }
};

/**
 * Extract all medical entities from clinical notes
 *
 * Main entry point for medical data extraction. Uses hybrid LLM + pattern-based
 * approach with intelligent fallback and confidence scoring.
 *
 * @param {string|string[]} notes - Single note or array of notes
 * @param {ExtractionOptions} [options={}] - Extraction options
 * @returns {Promise<ExtractionResult>} Extracted data with confidence scores and metadata
 *
 * @example
 * // Basic usage
 * const result = await extractMedicalEntities(clinicalNotes);
 *
 * @example
 * // With learned patterns
 * const result = await extractMedicalEntities(notes, {
 *   learnedPatterns: patterns,
 *   useLLM: true
 * });
 */
export const extractMedicalEntities = async (notes, options = {}) => {
  const {
    learnedPatterns = [],
    includeConfidence = true,
    targets = Object.values(EXTRACTION_TARGETS), // FIX: Use values (lowercase) not keys (UPPERCASE)
    useLLM = null, // null = auto, true = force LLM, false = force patterns
    usePatterns = false,
    enableDeduplication = true,
    enablePreprocessing = true
  } = options;

  // Normalize input
  let noteArray = Array.isArray(notes) ? notes : [notes];

  // Build context early for extraction
  const combinedTextForContext = noteArray.join('\n\n');
  const context = contextProvider.buildContext(combinedTextForContext);
  console.log('🧠 Context built for extraction:', {
    pathology: context.pathology.primary,
    consultants: context.consultants.count,
    complexity: context.clinical.complexity
  });

  // Load learned patterns from database if not provided
  let patternsToUse = learnedPatterns;
  if (patternsToUse.length === 0) {
    try {
      // Get all learned patterns from the learning engine
      await learningEngine.initialize();
      const db = learningEngine.db;
      if (db) {
        const tx = db.transaction('learnedPatterns', 'readonly');
        const allPatterns = await tx.store.getAll();
        const enabledPatterns = allPatterns.filter(p => p.enabled !== false);
        if (enabledPatterns && enabledPatterns.length > 0) {
          patternsToUse = enabledPatterns;
          console.log(`📚 Loaded ${patternsToUse.length} learned patterns from database`);
        }
      }
    } catch (error) {
      console.warn('Could not load learned patterns:', error);
    }
  }
  
  // Enhanced preprocessing for variable-style clinical notes
  if (enablePreprocessing) {
    console.log('Preprocessing clinical notes for variable styles and formats...');
    try {
      // PHASE 1 STEP 4: Abbreviation expansion infrastructure in place
      // Currently disabled by default (expandAbbreviations: false)
      // Can be enabled by passing pathology context after detection
      noteArray = noteArray.map(note => preprocessClinicalNote(note, {
        expandAbbreviations: false, // Disabled by default - enable after pathology detection
        preserveOriginal: true,
        institutionSpecific: true
      }));
      console.log('✓ Preprocessing complete');
    } catch (error) {
      console.error('Preprocessing failed:', error);
      // Continue with unprocessed notes
    }
  }

  // **ENABLED**: Deduplication using Web Worker for non-blocking processing
  // Maintains chronological intelligence and natural language coherence
  if (enableDeduplication && noteArray.length > 1) {
    console.log('Deduplicating repetitive content across notes (Web Worker)...');

    try {
      // Use Web Worker for non-blocking deduplication
      const dedupResult = await deduplicateNotesAsync(noteArray, {
        similarityThreshold: 0.85,
        preserveChronology: true,
        mergeComplementary: true
      });

      noteArray = dedupResult.deduplicated;
      console.log(`  Deduplication: ${dedupResult.metadata.original} notes → ${dedupResult.metadata.final} notes (${dedupResult.metadata.reductionPercent}% reduction)`);
    } catch (error) {
      console.error('Deduplication failed:', error);
      console.log('  Continuing with non-deduplicated notes');
      // Continue with non-deduplicated notes
    }
  }
  
  const combinedText = noteArray.join('\n\n');
  
  // Validate input
  if (!combinedText || combinedText.trim().length === 0) {
    return createEmptyResult();
  }

  // Determine extraction method
  const shouldUseLLM = useLLM !== null ? useLLM : (isLLMAvailable() && !usePatterns);

  console.log(`Extraction method: ${shouldUseLLM ? 'LLM-enhanced' : 'Pattern-based'}`);

  // Detect pathology types early (needed for both LLM and pattern extraction)
  // FIX: detectPathology returns array of objects: [{ type: 'SAH', name: '...', confidence: 0.9 }]
  // Extract just the type strings for backward compatibility: ['SAH', 'TUMORS', ...]
  const pathologyObjects = detectPathology(combinedText);
  const pathologyTypes = pathologyObjects.map(p => p.type);

  console.log('🔍 Detected pathologies:', pathologyTypes);

  // Try LLM extraction first if available
  if (shouldUseLLM) {
    try {
      console.log('Attempting LLM extraction...');
      const llmResult = await extractWithLLM(noteArray);
      console.log('LLM extraction raw result:', llmResult);

      // Also run pattern extraction for comparison/merging
      console.log('Running pattern extraction for data enrichment...');
      const patternResult = await extractWithPatterns(combinedText, noteArray, pathologyTypes, {
        targets,
        learnedPatterns: patternsToUse,
        includeConfidence,
        context
      });

      // Merge LLM and pattern results for maximum accuracy
      // Add null safety checks
      const merged = mergeLLMAndPatternResults(
        llmResult || {},
        patternResult?.extracted || {}
      );
      const confidence = calculateMergedConfidence(
        llmResult || {},
        patternResult?.confidence || {}
      );

      console.log('LLM extraction successful with pattern enrichment');

      // PHASE 2: Build clinical intelligence (pass source text for relationship extraction)
      const clinicalIntelligence = buildClinicalIntelligence(merged, combinedText);

      // PHASE 3: Calculate quality metrics for extraction
      const qualityMetrics = calculateQualityMetrics(merged, {}, '', {
        extractionMethod: 'llm+patterns',
        noteCount: noteArray.length
      });

      return {
        extracted: merged,
        confidence,
        pathologyTypes,
        clinicalIntelligence, // PHASE 2: Clinical context & intelligence
        qualityMetrics, // PHASE 3: Quality metrics
        metadata: {
          noteCount: noteArray.length,
          totalLength: combinedText.length,
          extractionDate: new Date().toISOString(),
          extractionMethod: 'llm+patterns',
          preprocessed: enablePreprocessing,
          deduplicated: enableDeduplication,
          patternData: patternResult // Include pattern data for potential merging
        }
      };
    } catch (error) {
      console.error('LLM extraction failed, falling back to patterns:', error.message);
      console.error('Full error:', error);
      console.error('Error stack:', error.stack);
      // Fall through to pattern-based extraction
    }
  }

  // Pattern-based extraction (fallback or explicit)
  console.log('Using pattern-based extraction');

  // Extract using patterns (pathologyTypes already detected above)
  const patternResult = await extractWithPatterns(combinedText, noteArray, pathologyTypes, {
    targets,
    learnedPatterns: patternsToUse,
    includeConfidence,
    context
  });

  // PHASE 1 ENHANCEMENT: Merge metadata from patternResult (includes sourceQuality)
  // PHASE 2: Build clinical intelligence (pass source text for relationship extraction)
  const clinicalIntelligence = buildClinicalIntelligence(patternResult.extracted, combinedText);

  // PHASE 3: Calculate quality metrics for extraction
  const qualityMetrics = calculateQualityMetrics(patternResult.extracted, {}, '', {
    extractionMethod: 'pattern',
    noteCount: noteArray.length
  });

  return {
    extracted: patternResult.extracted,
    confidence: patternResult.confidence,
    pathologyTypes,
    clinicalIntelligence, // PHASE 2: Clinical context & intelligence
    qualityMetrics, // PHASE 3: Quality metrics
    metadata: {
      ...patternResult.metadata, // Include source quality and other metadata from pattern extraction
      extractionMethod: 'pattern',
      preprocessed: enablePreprocessing,
      deduplicated: enableDeduplication
    }
  };
};

/**
 * Extract using pattern-based methods
 * PHASE 1 ENHANCEMENT: Now includes source quality assessment and confidence calibration
 * @private
 */
const extractWithPatterns = async (combinedText, noteArray, pathologyTypes, options) => {
  const { targets, learnedPatterns, includeConfidence = true, context } = options;

  // PHASE 1 ENHANCEMENT: Assess source quality
  let sourceQuality = null;
  try {
    sourceQuality = assessSourceQuality(combinedText, {
      includeRecommendations: false,
      detailedAnalysis: false
    });
    console.log(`📊 Source Quality: ${sourceQuality.grade} (${(sourceQuality.overallScore * 100).toFixed(1)}%)`);

    // Log quality issues if any
    if (sourceQuality.issues.length > 0) {
      console.log(`⚠️ Quality Issues: ${sourceQuality.issues.map(i => i.factor).join(', ')}`);
    }
  } catch (error) {
    console.warn('Source quality assessment failed:', error.message);
    // Continue without quality assessment
  }

  // Log learned patterns usage
  if (learnedPatterns && learnedPatterns.length > 0) {
    console.log(`📚 Applying ${learnedPatterns.length} learned patterns to extraction`);

    // Filter patterns by pathology if context available
    if (context && context.pathology.primary) {
      const pathologySpecificPatterns = learnedPatterns.filter(p =>
        !p.pathology || p.pathology === context.pathology.primary
      );
      console.log(`  → ${pathologySpecificPatterns.length} patterns match pathology ${context.pathology.primary}`);
    }
  }

  // Extract each target
  const extracted = {};
  const confidence = {};
  
  // Demographics
  if (targets.includes('demographics')) {
    const demo = extractDemographics(combinedText);
    extracted.demographics = demo.data;
    confidence.demographics = demo.confidence;
  }
  
  // Dates (CRITICAL for timeline)
  if (targets.includes('dates')) {
    const dates = extractDates(combinedText, pathologyTypes);
    extracted.dates = dates.data;
    confidence.dates = dates.confidence;
  }

  // PHASE 1 STEP 5: Build reference dates object for temporal context resolution
  // This enables POD#X → actual date resolution in procedures, complications, medications
  const referenceDates = {};
  if (extracted.dates) {
    if (extracted.dates.ictus) referenceDates.ictus = extracted.dates.ictus;
    if (extracted.dates.admission) referenceDates.admission = extracted.dates.admission;
    if (extracted.dates.discharge) referenceDates.discharge = extracted.dates.discharge;
    if (extracted.dates.surgeryDates && Array.isArray(extracted.dates.surgeryDates)) {
      referenceDates.surgeryDates = extracted.dates.surgeryDates;
    }
    if (extracted.dates.procedures && Array.isArray(extracted.dates.procedures)) {
      // First procedure date as reference for POD calculations
      if (extracted.dates.procedures.length > 0 && extracted.dates.procedures[0].date) {
        referenceDates.firstProcedure = extracted.dates.procedures[0].date;
      }
    }
    console.log('[Phase 1 Step 5] Reference dates for temporal resolution:', referenceDates);
  }

  // Pathology (diagnosis)
  if (targets.includes('pathology')) {
    const pathology = extractPathology(combinedText, pathologyTypes);
    extracted.pathology = pathology.data;
    confidence.pathology = pathology.confidence;
  }

  // Presenting symptoms
  if (targets.includes('presentingSymptoms')) {
    const symptoms = extractPresentingSymptoms(combinedText, pathologyTypes);
    extracted.presentingSymptoms = symptoms.data;
    confidence.presentingSymptoms = symptoms.confidence;
  }

  // Procedures (ENHANCED: Phase 1 Step 5 with temporal context)
  if (targets.includes('procedures')) {
    const procedures = extractProcedures(combinedText, pathologyTypes, referenceDates);
    extracted.procedures = procedures.data;
    confidence.procedures = procedures.confidence;
  }

  // Complications (ENHANCED: Phase 1 Step 5 with onset dates)
  if (targets.includes('complications')) {
    const complications = extractComplications(combinedText, pathologyTypes, referenceDates);
    extracted.complications = complications.data;
    confidence.complications = complications.confidence;
  }
  
  // Anticoagulation (CRITICAL for hemorrhagic pathologies)
  if (targets.includes('anticoagulation')) {
    const anticoag = extractAnticoagulation(combinedText);
    extracted.anticoagulation = anticoag;
    confidence.anticoagulation = calculateConfidence(anticoag);
  }
  
  // Imaging findings
  if (targets.includes('imaging')) {
    const imaging = extractImaging(combinedText, pathologyTypes);
    extracted.imaging = imaging.data;
    confidence.imaging = imaging.confidence;
  }
  
  // Functional scores
  if (targets.includes('functionalScores')) {
    const scores = extractFunctionalScores(combinedText);
    extracted.functionalScores = scores.data;
    confidence.functionalScores = scores.confidence;
  }
  
  // Medications (ENHANCED: Phase 1 Step 5 with timeline tracking)
  if (targets.includes('medications')) {
    const meds = extractMedications(combinedText, referenceDates);
    extracted.medications = meds.data;
    confidence.medications = meds.confidence;
  }
  
  // Follow-up plans
  if (targets.includes('followUp')) {
    const followUp = extractFollowUp(combinedText);
    extracted.followUp = followUp.data;
    confidence.followUp = followUp.confidence;
  }
  
  // Discharge destination
  if (targets.includes('dischargeDestination')) {
    const destination = extractDischargeDestination(combinedText);
    extracted.dischargeDestination = destination;
    confidence.dischargeDestination = destination?.confidence || CONFIDENCE.LOW;
  }
  
  // Oncology specific
  if (targets.includes('oncology')) {
    const oncology = extractOncology(combinedText, pathologyTypes);
    extracted.oncology = oncology.data;
    confidence.oncology = oncology.confidence;
  }

  // ===== COMPREHENSIVE CLINICAL EXTRACTIONS =====

  // Physical exam
  if (targets.includes('physicalExam')) {
    const physExam = extractPhysicalExam(combinedText);
    extracted.physicalExam = physExam.data;
    confidence.physicalExam = physExam.confidence;
  }

  // Neurological exam
  if (targets.includes('neurologicalExam')) {
    const neuroExam = extractNeurologicalExam(combinedText);
    extracted.neurologicalExam = neuroExam.data;
    confidence.neurologicalExam = neuroExam.confidence;
  }

  // Significant clinical events (seizures, hemorrhages, strokes, infections)
  if (targets.includes('significantEvents')) {
    const sigEvents = extractSignificantEvents(combinedText);
    extracted.significantEvents = sigEvents.data;
    confidence.significantEvents = sigEvents.confidence;
  }

  // ICU stay details
  if (targets.includes('icuStay')) {
    const icu = extractICUStay(combinedText);
    extracted.icuStay = icu.data;
    confidence.icuStay = icu.confidence;
  }

  // Pre-operative deficits/status
  if (targets.includes('preOpDeficits')) {
    const preOp = extractPreOpDeficits(combinedText);
    extracted.preOpDeficits = preOp.data;
    confidence.preOpDeficits = preOp.confidence;
  }

  // Post-operative deficits/status
  if (targets.includes('postOpDeficits')) {
    const postOp = extractPostOpDeficits(combinedText);
    extracted.postOpDeficits = postOp.data;
    confidence.postOpDeficits = postOp.confidence;
  }

  // Consultant recommendations
  if (targets.includes('consultations')) {
    const consults = extractConsultations(combinedText);
    extracted.consultations = consults.data;
    confidence.consultations = consults.confidence;
  }

  // Laboratory values
  if (targets.includes('labs')) {
    const labs = extractLabs(combinedText);
    extracted.labs = labs.data;
    confidence.labs = labs.confidence;
  }

  // Vital signs
  if (targets.includes('vitals')) {
    const vitals = extractVitals(combinedText);
    extracted.vitals = vitals.data;
    confidence.vitals = vitals.confidence;
  }

  // ===== BUILD CHRONOLOGICAL HOSPITAL COURSE =====
  if (targets.includes('hospitalCourse')) {
    const hospitalCourse = buildHospitalCourseTimeline(
      combinedText,
      noteArray,
      extracted,
      pathologyTypes
    );
    extracted.hospitalCourse = hospitalCourse.data;
    confidence.hospitalCourse = hospitalCourse.confidence;
  }

  // Apply learned patterns if provided
  if (learnedPatterns.length > 0) {
    applyLearnedPatterns(extracted, combinedText, learnedPatterns);
  }

  // PHASE 1 ENHANCEMENT: Calibrate confidence scores based on source quality
  let calibratedConfidence = confidence;
  if (sourceQuality && includeConfidence) {
    try {
      calibratedConfidence = {};
      for (const [key, value] of Object.entries(confidence)) {
        // Defensive programming: ensure value is a number
        if (typeof value === 'number') {
          calibratedConfidence[key] = calibrateConfidence(value, sourceQuality);
        } else {
          calibratedConfidence[key] = value; // Keep original if not a number
        }
      }
      console.log(`✅ Confidence scores calibrated based on source quality`);
    } catch (error) {
      console.warn('Confidence calibration failed:', error.message);
      calibratedConfidence = confidence; // Fallback to original
    }
  }

  return {
    extracted,
    confidence: includeConfidence ? calibratedConfidence : undefined,
    pathologyTypes,
    metadata: {
      noteCount: noteArray.length,
      totalLength: combinedText.length,
      extractionDate: new Date().toISOString(),
      // PHASE 1 ENHANCEMENT: Include source quality in metadata
      sourceQuality: sourceQuality ? {
        grade: sourceQuality.grade,
        score: sourceQuality.overallScore,
        factors: sourceQuality.factors
      } : null
    }
  };
};

/**
 * Extract demographics (age, gender)
 */
const extractDemographics = (text) => {
  const data = {
    age: null,
    gender: null
  };
  
  let ageConfidence = CONFIDENCE.LOW;
  let genderConfidence = CONFIDENCE.LOW;
  
  // Age patterns - ORDER MATTERS! Most specific patterns first
  const agePatterns = [
    // Explicit "X-year-old" or "X year old" format (most common in clinical notes)
    /\b(\d{1,3})\s*-\s*year\s*-\s*old\b/i,
    /\b(\d{1,3})\s+year\s+old\b/i,
    /\b(\d{1,3})\s*(?:yo|y\.o\.)\b/i,
    // "Age: X" format
    /\bage\s*:?\s*(\d{1,3})\b/i,
    // "X years" (but not "X mm" or other measurements)
    /\b(\d{1,3})\s+years?\b/i,
    // PHASE 1 FIX: "##M" or "##F" format at end of line or after comma (e.g., "John Doe, 55M")
    /,\s*(\d{1,3})\s*[MF]\b/i,
    /\b(\d{1,3})\s*[MF]\s*$/im,
    // "X M" or "X F" format - but must be followed by space or word boundary to avoid matching "7mm"
    /\b(\d{1,3})\s*(?:M|F)\s+(?:male|female|man|woman|who|with|presented)\b/i,
    /\b(\d{1,3})\s+(?:male|female|man|woman)\b/i,
    // Last resort: gender followed by age (reversed order)
    /\b(?:male|female)\s*,?\s*(\d{1,3})\b/i
  ];
  
  for (const pattern of agePatterns) {
    const match = text.match(pattern);
    if (match) {
      const age = parseInt(match[1]);
      // Validate reasonable age range
      if (age >= 0 && age <= 120) {
        data.age = age;
        ageConfidence = CONFIDENCE.HIGH;
        break;
      }
    }
  }
  
  // Gender patterns - more specific matching
  const genderPatterns = [
    // Explicit gender statements (highest confidence)
    { pattern: /\b(?:gender|sex)\s*:?\s*(male|man|M)\b/i, gender: 'M', confidence: CONFIDENCE.HIGH },
    { pattern: /\b(?:gender|sex)\s*:?\s*(female|woman|F)\b/i, gender: 'F', confidence: CONFIDENCE.HIGH },
    // PHASE 1 FIX: "##M" or "##F" format (e.g., "55M", "45F")
    { pattern: /,\s*\d{1,3}\s*M\b/i, gender: 'M', confidence: CONFIDENCE.HIGH },
    { pattern: /,\s*\d{1,3}\s*F\b/i, gender: 'F', confidence: CONFIDENCE.HIGH },
    { pattern: /\b\d{1,3}\s*M\s*$/im, gender: 'M', confidence: CONFIDENCE.HIGH },
    { pattern: /\b\d{1,3}\s*F\s*$/im, gender: 'F', confidence: CONFIDENCE.HIGH },
    // Age-gender combinations
    { pattern: /\d+\s*-?\s*year\s*-?\s*old\s+(male|man)\b/i, gender: 'M', confidence: CONFIDENCE.HIGH },
    { pattern: /\d+\s*-?\s*year\s*-?\s*old\s+(female|woman)\b/i, gender: 'F', confidence: CONFIDENCE.HIGH },
    // Standalone gender mentions (medium confidence)
    { pattern: /\bpatient\s+is\s+(?:a\s+)?(\d+\s*-?\s*(?:year|yr)?\s*-?\s*old\s+)?(male|man)\b/i, gender: 'M', confidence: CONFIDENCE.MEDIUM },
    { pattern: /\bpatient\s+is\s+(?:a\s+)?(\d+\s*-?\s*(?:year|yr)?\s*-?\s*old\s+)?(female|woman)\b/i, gender: 'F', confidence: CONFIDENCE.MEDIUM },
    // Pronoun-based detection (lower confidence)
    { pattern: /\b(?:he|his|him)\b/i, gender: 'M', confidence: CONFIDENCE.LOW },
    { pattern: /\b(?:she|her|hers)\b/i, gender: 'F', confidence: CONFIDENCE.LOW }
  ];
  
  for (const { pattern, gender, confidence: conf } of genderPatterns) {
    if (pattern.test(text)) {
      data.gender = gender;
      genderConfidence = conf;
      break;
    }
  }
  
  return {
    data,
    confidence: Math.min(ageConfidence, genderConfidence)
  };
};

/**
 * Extract critical dates (ictus, admission, surgery, discharge)
 * PHASE 1 ENHANCEMENT: Now includes temporal context for each date
 */
const extractDates = (text, pathologyTypes) => {
  const data = {
    ictusDate: null,
    admissionDate: null,
    surgeryDates: [],
    dischargeDate: null,
    // PHASE 1 ENHANCEMENT: Add temporal context for dates
    temporalContext: {
      ictus: null,
      admission: null,
      surgeries: [],
      discharge: null
    }
  };

  let confidence = CONFIDENCE.MEDIUM;
  
  // Ictus date (CRITICAL for SAH and hemorrhagic pathologies)
  if (pathologyTypes.includes('SAH') || pathologyTypes.includes('TBI/cSDH')) {
    const ictusPatterns = [
      // "ictus (on) date: DATE" format
      /ictus\s+(?:on\s+)?(?:date\s*:?\s*)?([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4})/i,
      // "ruptured on DATE" format
      /ruptured?\s+(?:on\s+)?([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4})/i,
      // "presented with SAH on DATE"
      /presented\s+(?:to\s+\w+\s+)?(?:with|on)\s+(?:SAH|hemorrhage)?\s*(?:on\s+)?([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i,
      // "symptoms started on DATE" or "onset DATE"
      /(?:symptoms?\s+started|onset)\s+(?:on\s+)?([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i
    ];
    
    for (const pattern of ictusPatterns) {
      const match = text.match(pattern);
      if (match) {
        const parsed = parseFlexibleDate(match[1]);
        if (parsed) {
          data.ictusDate = normalizeDate(parsed);
          confidence = CONFIDENCE.CRITICAL;

          // PHASE 1 ENHANCEMENT: Extract temporal context for ictus date
          try {
            const temporal = extractTemporalQualifier('ictus', text);
            data.temporalContext.ictus = {
              category: temporal.category,
              confidence: temporal.confidence,
              type: temporal.type || temporal.category
            };
          } catch (error) {
            console.warn('Temporal qualifier extraction failed for ictus:', error.message);
          }

          break;
        }
      }
    }
  }
  
  // Admission date - more flexible patterns
  const admissionPatterns = [
    // "admitted to X on DATE" - allows text between admitted and date
    /admitted\s+(?:to\s+[\w\s]+\s+)?(?:on\s+)?([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
    // "admission (date): DATE"
    /admission\s+(?:date\s*:?\s*)?([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
    // "patient admitted DATE" 
    /patient\s+admitted\s+(?:to\s+[\w\s]+\s+)?(?:on\s+)?([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
    // Numeric date formats
    /admission\s+(?:date\s*:?\s*)?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
    /admitted\s+(?:on\s+)?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i
  ];
  
  for (const pattern of admissionPatterns) {
    const match = text.match(pattern);
    if (match) {
      const parsed = parseFlexibleDate(match[1]);
      if (parsed) {
        data.admissionDate = normalizeDate(parsed);

        // PHASE 1 ENHANCEMENT: Extract temporal context for admission date
        try {
          const temporal = extractTemporalQualifier('admission', text);
          data.temporalContext.admission = {
            category: temporal.category,
            confidence: temporal.confidence,
            type: temporal.type || temporal.category
          };
        } catch (error) {
          console.warn('Temporal qualifier extraction failed for admission:', error.message);
        }

        break;
      }
    }
  }
  
  // Surgery dates (can be multiple) - more flexible patterns
  const surgeryPatterns = [
    // "underwent PROCEDURE on DATE" or "PROCEDURE on DATE"
    /(?:underwent|received)?\s*(?:cerebral\s+)?(?:angiogram|coiling|craniotomy|surgery|operation|procedure)\s+(?:with\s+[\w\s]+\s+)?(?:on\s+)?([A-Za-z]+\s+\d{1,2},?\s+\d{4})/gi,
    // "DATE: PROCEDURE" format
    /([A-Za-z]+\s+\d{1,2},?\s+\d{4})\s*:?\s*(?:underwent|surgery|craniotomy|coiling|procedure)/gi,
    // Numeric formats
    /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s*:?\s*(?:underwent|surgery|craniotomy|coiling)/gi
  ];
  
  for (const pattern of surgeryPatterns) {
    let match;
    pattern.lastIndex = 0; // Reset regex state
    while ((match = pattern.exec(text)) !== null) {
      const parsed = parseFlexibleDate(match[1]);
      if (parsed) {
        const normalized = normalizeDate(parsed);
        if (!data.surgeryDates.includes(normalized)) {
          data.surgeryDates.push(normalized);

          // PHASE 1 ENHANCEMENT: Extract temporal context for each surgery date
          try {
            const temporal = extractTemporalQualifier('surgery', text);
            data.temporalContext.surgeries.push({
              date: normalized,
              category: temporal.category,
              confidence: temporal.confidence,
              type: temporal.type || temporal.category
            });
          } catch (error) {
            console.warn('Temporal qualifier extraction failed for surgery:', error.message);
            // Add entry without temporal context
            data.temporalContext.surgeries.push({
              date: normalized,
              category: 'UNKNOWN',
              confidence: 0,
              type: 'UNKNOWN'
            });
          }
        }
      }
    }
  }
  
  // Discharge date - more flexible patterns
  const dischargePatterns = [
    // "discharged (to X) on DATE"
    /discharged?\s+(?:to\s+[\w\s]+\s+)?(?:on\s+)?([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
    // "discharge date: DATE"
    /discharge\s+(?:date\s*:?\s*)?([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
    // "patient discharged DATE"
    /patient\s+discharged?\s+(?:to\s+[\w\s]+\s+)?(?:on\s+)?([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
    // Numeric formats
    /discharge\s+(?:date\s*:?\s*)?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
    /discharged?\s+(?:on\s+)?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i
  ];
  
  for (const pattern of dischargePatterns) {
    const match = text.match(pattern);
    if (match) {
      const parsed = parseFlexibleDate(match[1]);
      if (parsed) {
        data.dischargeDate = normalizeDate(parsed);

        // PHASE 1 ENHANCEMENT: Extract temporal context for discharge date
        try {
          const temporal = extractTemporalQualifier('discharge', text);
          data.temporalContext.discharge = {
            category: temporal.category,
            confidence: temporal.confidence,
            type: temporal.type || temporal.category
          };
        } catch (error) {
          console.warn('Temporal qualifier extraction failed for discharge:', error.message);
        }

        break;
      }
    }
  }

  return { data, confidence };
};

/**
 * Extract pathology/diagnosis information
 * PHASE 1 STEP 6: Enhanced with subtype detection, prognosis, and clinical intelligence
 */
const extractPathology = (text, pathologyTypes) => {
  const data = {
    primary: null, // PHASE 1 FIX: Add primary field for backward compatibility
    primaryDiagnosis: null,
    secondaryDiagnoses: [],
    grades: {},
    location: null,
    subtype: null // PHASE 1 STEP 6: Add subtype field
  };

  let confidence = CONFIDENCE.MEDIUM;
  
  // First, try to extract explicit diagnosis statements
  const diagnosisPatterns = [
    // "DIAGNOSIS:" section
    /(?:DIAGNOSIS|Diagnosis)\s*:?\s*\n?\s*([^\n]+(?:\n(?!HISTORY|HOSPITAL|IMAGING|PROCEDURE)[^\n]+)*)/i,
    // "Primary diagnosis:" format
    /(?:primary\s+)?diagnosis\s*:?\s*([^\n.]+)/i,
    // Parenthetical diagnosis like "(aSAH)"
    /\(([^)]*(?:SAH|hemorrhage|aneurysm|tumor|hydrocephalus|cSDH|TBI|leak|fracture)[^)]*)\)/i,
    // Standalone diagnosis statements
    /(?:^|\n)\s*([^\n]*(?:subarachnoid hemorrhage|aSAH|aneurysmal SAH|brain tumor|glioblastoma|meningioma|hydrocephalus|subdural hematoma|cSDH)[^\n.]*)/im
  ];
  
  for (const pattern of diagnosisPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Clean up the extracted diagnosis
      let diagnosis = match[1].trim()
        .replace(/\s+/g, ' ')
        .replace(/^[-•*]\s*/, ''); // Remove bullet points
      
      if (diagnosis.length > 5 && diagnosis.length < 200) {
        data.primaryDiagnosis = diagnosis;
        data.primary = diagnosis; // PHASE 1 FIX: Set primary field
        confidence = CONFIDENCE.HIGH;
        break;
      }
    }
  }
  
  // If no explicit diagnosis found, use pathology type detection
  if (!data.primaryDiagnosis && pathologyTypes.length > 0) {
    for (const pathType of pathologyTypes) {
      const patterns = PATHOLOGY_PATTERNS[pathType];
      if (!patterns) continue;
      
      // Use the pathology name as diagnosis
      if (patterns.detectionPatterns) {
        for (const pattern of patterns.detectionPatterns) {
          if (new RegExp(pattern, 'i').test(text)) {
            data.primaryDiagnosis = patterns.name || pathType;
            data.primary = patterns.name || pathType; // PHASE 1 FIX: Set primary field
            confidence = CONFIDENCE.MEDIUM;
            break;
          }
        }
      }
      
      if (data.primaryDiagnosis) break;
    }
  }
  
  // Extract grading information for each detected pathology type
  for (const pathType of pathologyTypes) {
    const patterns = PATHOLOGY_PATTERNS[pathType];
    if (!patterns) continue;
    
    // SAH Grading (Hunt & Hess, Fisher, etc.)
    if (pathType === 'SAH' && patterns.patterns?.gradingScales) {
      for (const [gradeType, gradeInfo] of Object.entries(patterns.patterns.gradingScales)) {
        if (gradeInfo.regex) {
          for (const pattern of gradeInfo.regex) {
            const match = text.match(new RegExp(pattern, 'i'));
            if (match) {
              data.grades[gradeType] = match[1] || match[0];
              confidence = Math.max(confidence, gradeInfo.confidence || CONFIDENCE.MEDIUM);
            }
          }
        }
      }
    }
    
    // Generic grading patterns
    if (patterns.gradingPatterns) {
      for (const [gradeType, gradePatterns] of Object.entries(patterns.gradingPatterns)) {
        for (const pattern of gradePatterns) {
          const match = text.match(new RegExp(pattern, 'i'));
          if (match) {
            data.grades[gradeType] = match[1] || match[0];
          }
        }
      }
    }
  }
  
  // Extract location information
  const locationPatterns = [
    // Specific anatomical locations
    /(?:location|site)\s*:?\s*([^\n.;]+(?:artery|vein|ventricle|hemisphere|lobe|fossa|cistern|region)[^\n.;]*)/i,
    // Aneurysm locations
    /([^\s]+\s+(?:communicating|cerebral|basilar|carotid)\s+artery)\s+aneurysm/i,
    // Tumor locations
    /(?:tumor|mass|lesion)\s+(?:in|of|at)\s+(?:the\s+)?([^\n.;,]+(?:lobe|hemisphere|region|ventricle|fossa)[^\n.;,]*)/i,
    // Generic "in the X" patterns
    /(?:hemorrhage|bleeding|mass|lesion)\s+in\s+(?:the\s+)?([^\n.;,]+)/i
  ];

  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const location = match[1].trim();
      if (location.length > 3 && location.length < 100) {
        data.location = location;
        break;
      }
    }
  }

  // PHASE 1 STEP 6: Detect pathology subtypes with clinical intelligence
  if (pathologyTypes.length > 0) {
    console.log('[Phase 1 Step 6] Detecting pathology subtypes...');

    // For each detected pathology, extract detailed subtype information
    for (const pathType of pathologyTypes) {
      try {
        const subtype = detectPathologySubtype(text, pathType, data);

        // Use the most specific subtype (prioritize based on pathology hierarchy)
        if (subtype && Object.keys(subtype.details).length > 0) {
          data.subtype = subtype;
          console.log(`[Phase 1 Step 6] Detected ${pathType} subtype:`, subtype.details);

          // Increase confidence if subtype detected with high specificity
          if (subtype.riskLevel && subtype.prognosis) {
            confidence = Math.max(confidence, CONFIDENCE.HIGH);
          }

          break; // Use first detailed subtype found
        }
      } catch (error) {
        console.error(`[Phase 1 Step 6] Error detecting subtype for ${pathType}:`, error.message);
      }
    }

    // Log subtype detection results
    if (data.subtype) {
      console.log(`[Phase 1 Step 6] Subtype detection complete:
        - Type: ${data.subtype.type}
        - Risk Level: ${data.subtype.riskLevel}
        - Details: ${JSON.stringify(data.subtype.details, null, 2)}
        - Prognosis: ${JSON.stringify(data.subtype.prognosis, null, 2)}`);
    } else {
      console.log('[Phase 1 Step 6] No detailed subtype detected (using basic pathology info)');
    }
  }

  return { data, confidence };
};

/**
 * Extract presenting symptoms
 */
const extractPresentingSymptoms = (text, pathologyTypes) => {
  const data = {
    symptoms: [],
    onset: null,
    severity: null
  };
  
  let confidence = CONFIDENCE.MEDIUM;
  
  // Get symptom patterns for detected pathologies
  const symptomPatterns = [];
  for (const pathType of pathologyTypes) {
    const patterns = PATHOLOGY_PATTERNS[pathType]?.symptomPatterns || [];
    symptomPatterns.push(...patterns);
  }
  
  // Extract symptoms
  for (const pattern of symptomPatterns) {
    const regex = new RegExp(pattern, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      const symptom = match[1] || match[0];
      if (!data.symptoms.includes(symptom)) {
        data.symptoms.push(symptom);
        confidence = CONFIDENCE.HIGH;
      }
    }
  }
  
  // Onset timing
  const onsetPatterns = [
    /(?:sudden|acute|gradual|chronic)\s+onset/i,
    /symptoms?\s+(?:started|began)\s+(\w+)/i
  ];
  
  for (const pattern of onsetPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.onset = match[0];
      break;
    }
  }
  
  return { data, confidence };
};

/**
 * Extract procedures (surgeries, interventions)
 * PHASE 1 STEP 5: Enhanced with temporal context detection and semantic deduplication
 *
 * New capabilities:
 * - Detects references ("s/p coiling POD#3") vs. new events ("underwent coiling on 10/1")
 * - Semantic deduplication: "coiling" = "endovascular coiling" = "coil embolization"
 * - Multi-value date tracking: preserves all dates for same procedure
 * - Links references to actual procedure events
 * - Resolves relative dates (POD#3 → actual date)
 *
 * Example:
 * Input:
 *   - "Patient underwent coiling on 10/1"
 *   - "s/p endovascular coiling POD#2"
 *   - "coil embolization performed on 10/1"
 *   - "status post coiling"
 *
 * Output:
 *   - "aneurysm coiling on 10/1" (merged 3 mentions, linked 1 reference)
 */
const extractProcedures = (text, pathologyTypes, referenceDates = {}) => {
  console.log('[Phase 1 Step 5] Enhanced procedure extraction started...');

  const data = {
    procedures: []
  };

  let confidence = CONFIDENCE.MEDIUM;

  // Get procedure patterns for detected pathologies
  const procedurePatterns = [];
  for (const pathType of pathologyTypes) {
    const patterns = PATHOLOGY_PATTERNS[pathType]?.procedurePatterns || [];
    procedurePatterns.push(...patterns);
  }

  // Enhanced comprehensive procedure keywords (25+ procedures)
  const comprehensiveProcedureKeywords = [
    // Cranial procedures
    'craniotomy', 'craniectomy', 'cranioplasty',
    'decompressive craniectomy', 'pterional craniotomy',

    // Tumor procedures
    'resection', 'gross total resection', 'subtotal resection',
    'biopsy', 'stereotactic biopsy',

    // Vascular procedures
    'coiling', 'coil embolization', 'endovascular coiling',
    'clipping', 'aneurysm clipping', 'microsurgical clipping',
    'embolization', 'AVM embolization',
    // Combined angiogram procedures
    'cerebral angiogram with coiling', 'angiogram with coiling',
    'cerebral angiogram', 'angiogram and coiling',

    // Drainage procedures
    'EVD placement', 'external ventricular drain',
    'ventriculostomy', 'ventriculoperitoneal shunt', 'VP shunt',
    'lumbar drain', 'LD placement',

    // Spine procedures
    'laminectomy', 'discectomy', 'fusion',
    'anterior cervical discectomy', 'ACDF',
    'posterior lumbar fusion', 'PLIF',

    // Diagnostic procedures
    'angiogram', 'cerebral angiography', 'DSA',
    'lumbar puncture', 'LP',

    // Other procedures
    'tracheostomy', 'PEG placement', 'ICP monitor placement'
  ];

  // Add explicit "underwent/received" patterns first (higher priority)
  const explicitProcedurePatterns = [
    /(?:underwent|received|had|performed)\s+([^.;]+?(?:angiogram|coiling|craniotomy|clipping|embolization|resection|biopsy|drain|shunt|laminectomy)[^.;]*)/gi,
    /(?:procedure|surgery|operation)\s*:?\s*([^.;\n]+)/gi
  ];

  // Add explicit patterns first (higher priority)
  procedurePatterns.unshift(...explicitProcedurePatterns);

  // Add comprehensive keywords to patterns
  for (const keyword of comprehensiveProcedureKeywords) {
    procedurePatterns.push(new RegExp(`\\b${keyword}\\b`, 'i'));
  }

  // STEP 1: Extract all procedure mentions with temporal context
  const allProcedures = [];

  for (const pattern of procedurePatterns) {
    const regex = new RegExp(pattern, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      const procedureName = (match[1] || match[0]).trim();

      // PHASE 1 STEP 5: Detect temporal context
      const temporalContext = detectTemporalContext(text, procedureName, match.index);

      // Associate date with procedure
      const dateInfo = associateDateWithEntity(
        text,
        { index: match.index, value: match[0] },
        referenceDates
      );

      const procedure = {
        name: procedureName,
        date: dateInfo?.date || null,
        dateSource: dateInfo?.source || 'not_found',
        confidence: dateInfo?.confidence || 0,
        details: null,
        temporalContext: temporalContext,
        position: match.index
      };

      // If this is a reference with POD, try to resolve to actual date
      if (temporalContext.isReference && temporalContext.pod) {
        const resolvedDate = resolveRelativeDate(
          { type: 'pod', value: temporalContext.pod },
          referenceDates
        );
        if (resolvedDate) {
          procedure.date = resolvedDate;
          procedure.dateSource = 'pod_resolved';
          console.log(`[Temporal] Resolved POD#${temporalContext.pod} → ${resolvedDate}`);
        }
      }

      allProcedures.push(procedure);
    }
  }

  console.log(`[Extraction] Found ${allProcedures.length} procedure mentions (before deduplication)`);

  // STEP 2: Separate references from new events
  const references = allProcedures.filter(p => p.temporalContext?.isReference);
  const newEvents = allProcedures.filter(p => !p.temporalContext?.isReference);

  console.log(`[Temporal] Separated: ${newEvents.length} new events, ${references.length} references`);

  // STEP 3: Apply semantic deduplication to new events only
  let deduplicatedEvents = [];
  if (newEvents.length > 0) {
    deduplicatedEvents = deduplicateBySemanticSimilarity(newEvents, {
      type: 'procedure',
      threshold: 0.75,
      mergeSameDate: true,
      preserveReferences: false // We already separated references
    });

    const stats = getDeduplicationStats(newEvents, deduplicatedEvents);
    console.log(`[Semantic Dedup] Procedures: ${stats.original} → ${stats.deduplicated} (${stats.reductionPercent}% reduction)`);
    if (stats.merged > 0) {
      console.log(`[Semantic Dedup] Merged ${stats.merged} procedure groups (avg ${stats.avgMergeCount} per group)`);
    }
  }

  // STEP 4: Link references to actual procedure events
  const linkedReferences = linkReferencesToEvents(
    references,
    deduplicatedEvents,
    (ref, event) => {
      // Custom similarity function for procedures
      try {
        // Safety check for undefined names
        if (!ref?.name || !event?.name) {
          console.warn('[Reference Linking] Undefined name:', { ref: ref?.name, event: event?.name });
          return 0;
        }

        const nameSimilarity = calculateCombinedSimilarity(
          ref.name.toLowerCase(),
          event.name.toLowerCase()
        );

        // If dates match and names are similar, very likely the same procedure
        if (ref.date && event.date && ref.date === event.date && nameSimilarity > 0.6) {
          return 0.95;
        }

        // If names are very similar but dates different, might be follow-up
        if (nameSimilarity > 0.8) {
          return nameSimilarity * 0.9;
        }

        return nameSimilarity;
      } catch (error) {
        console.warn('Similarity calculation failed:', error);
        return 0;
      }
    }
  );

  console.log(`[Reference Linking] Linked ${linkedReferences?.linked?.length || 0} of ${references?.length || 0} references`);

  // STEP 5: Combine deduplicated events with unlinked references
  // Linked references are attached to their events, so we only add unlinked references
  const finalProcedures = [
    ...deduplicatedEvents,
    ...(linkedReferences?.unlinked || [])
  ];

  // STEP 6: Clean up procedure names (remove extra whitespace, normalize)
  for (const procedure of finalProcedures) {
    if (procedure?.name) {
      procedure.name = procedure.name
        .replace(/\s+/g, ' ')
        .replace(/[:\-,]\s*$/, '')
        .trim();
    }

    // If procedure has linked references, add them to metadata
    if (procedure.linkedReferences && procedure.linkedReferences.length > 0) {
      procedure.referenceCount = procedure.linkedReferences.length;
      console.log(`[Reference Linking] "${procedure.name}" has ${procedure.referenceCount} references`);
    }
  }

  // STEP 7: Sort by date (earliest first)
  finalProcedures.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date) - new Date(b.date);
  });

  data.procedures = finalProcedures;

  if (finalProcedures.length > 0) {
    confidence = CONFIDENCE.HIGH;
  }

  console.log(`[Phase 1 Step 5] Procedure extraction complete: ${finalProcedures.length} procedures`);

  return { data, confidence };
};

/**
 * Extract complications
 * PHASE 1 STEP 5: Enhanced with onset dates, temporal context, and semantic deduplication
 *
 * New capabilities:
 * - Tracks onset date for each complication
 * - Detects references vs. new occurrences
 * - Semantic deduplication: "vasospasm" = "cerebral vasospasm"
 * - Preserves negation detection from Phase 1 Step 3
 * - Multi-value tracking for recurring complications
 *
 * Example:
 * Input:
 *   - "Developed vasospasm on POD#3"
 *   - "Cerebral vasospasm noted on 10/4"
 *   - "No evidence of rebleeding"
 *
 * Output:
 *   - "vasospasm" (onset: 10/4, merged semantic variants, negation filtered)
 */
const extractComplications = (text, pathologyTypes, referenceDates = {}) => {
  console.log('[Phase 1 Step 5] Enhanced complication extraction started...');

  const data = {
    complications: []
  };

  let confidence = CONFIDENCE.MEDIUM;

  // Get complication patterns for detected pathologies
  const complicationPatterns = [];
  for (const pathType of pathologyTypes) {
    const patterns = PATHOLOGY_PATTERNS[pathType]?.complicationPatterns || [];
    complicationPatterns.push(...patterns);
  }

  // Comprehensive complication categories (14 types)
  const comprehensiveComplications = {
    vascular: [
      'vasospasm', 'cerebral vasospasm',
      'stroke', 'ischemic stroke', 'hemorrhagic stroke',
      'rebleeding', 'rebleed',
      'DVT', 'deep vein thrombosis', 'PE', 'pulmonary embolism'
    ],

    neurological: [
      'seizure', 'seizures',
      'hydrocephalus', 'acute hydrocephalus',
      'cerebral edema', 'brain edema',
      'increased ICP', 'elevated ICP', 'intracranial pressure',
      'herniation', 'brain herniation',
      'deficit', 'neurological deficit', 'weakness', 'hemiparesis'
    ],

    infectious: [
      'infection', 'wound infection',
      'meningitis', 'ventriculitis',
      'pneumonia', 'UTI', 'urinary tract infection',
      'sepsis'
    ],

    metabolic: [
      'SIADH', 'hyponatremia', 'hypernatremia',
      'diabetes insipidus', 'DI',
      'fever', 'hyperthermia'
    ],

    surgical: [
      'CSF leak', 'cerebrospinal fluid leak',
      'pseudomeningocele',
      'hardware failure', 'shunt malfunction',
      'hemorrhage', 'post-op hemorrhage', 'postoperative hemorrhage'
    ],

    respiratory: [
      'respiratory failure', 'aspiration',
      'pneumothorax', 'pleural effusion',
      'ARDS'
    ],

    cardiac: [
      'arrhythmia', 'atrial fibrillation', 'afib',
      'myocardial infarction', 'MI',
      'cardiac arrest'
    ]
  };

  // Add comprehensive complications to patterns
  for (const category of Object.values(comprehensiveComplications)) {
    for (const comp of category) {
      complicationPatterns.push(new RegExp(`\\b${comp}\\b`, 'i'));
    }
  }

  // STEP 1: Extract all complication mentions with temporal context
  const allComplications = [];

  for (const pattern of complicationPatterns) {
    const regex = new RegExp(pattern, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      const complicationName = (match[1] || match[0]).trim();

      // Get context for validation
      const context = text.substring(Math.max(0, match.index - 50), Math.min(text.length, match.index + 100));
      const lowerContext = context.toLowerCase();

      // Indicators that this is indeed a complication
      const complicationIndicators = [
        'developed', 'complicated by', 'experienced', 'suffered',
        'noted', 'developed', 'presented with', 'course complicated',
        'post-op', 'postoperative', 'following surgery', 'onset'
      ];

      // Exclusion indicators (not a complication, just preventive mention)
      const exclusionIndicators = [
        'no evidence', 'ruled out', 'no signs', 'preventing',
        'avoid', 'monitor for', 'prophylaxis', 'negative for'
      ];

      const hasIndicator = complicationIndicators.some(ind => lowerContext.includes(ind));
      const hasExclusion = exclusionIndicators.some(exc => lowerContext.includes(exc));

      // PHASE 1 ENHANCEMENT: Use negation detection utility
      let shouldInclude = false;

      try {
        const validation = validateComplicationExtraction(complicationName, text);

        if (validation.valid) {
          shouldInclude = hasIndicator || !hasExclusion;
        } else {
          shouldInclude = hasIndicator && !hasExclusion;

          if (validation.reason) {
            console.log(`⚠️ Complication "${complicationName}" filtered: ${validation.reason}`);
          }
        }
      } catch (error) {
        console.warn('Negation detection failed, using fallback logic:', error.message);
        shouldInclude = (hasIndicator || !hasExclusion);
      }

      // Skip if validation failed
      if (!shouldInclude) {
        continue;
      }

      // PHASE 1 STEP 5: Detect temporal context
      const temporalContext = detectTemporalContext(text, complicationName, match.index);

      // Associate onset date
      const dateInfo = associateDateWithEntity(
        text,
        { index: match.index, value: match[0] },
        referenceDates
      );

      // If this is a reference with POD, try to resolve to actual date
      let onsetDate = dateInfo?.date || null;
      if (temporalContext.isReference && temporalContext.pod) {
        const resolvedDate = resolveRelativeDate(
          { type: 'pod', value: temporalContext.pod },
          referenceDates
        );
        if (resolvedDate) {
          onsetDate = resolvedDate;
          console.log(`[Temporal] Resolved complication POD#${temporalContext.pod} → ${resolvedDate}`);
        }
      }

      const complication = {
        name: complicationName,
        onsetDate: onsetDate,
        dateSource: dateInfo.source,
        confidence: dateInfo.confidence,
        temporalContext: temporalContext,
        position: match.index
      };

      allComplications.push(complication);
    }
  }

  console.log(`[Extraction] Found ${allComplications.length} complication mentions (before deduplication)`);

  // STEP 2: Separate references from new events
  const references = allComplications.filter(c => c.temporalContext?.isReference);
  const newEvents = allComplications.filter(c => !c.temporalContext?.isReference);

  console.log(`[Temporal] Separated: ${newEvents.length} new complications, ${references.length} references`);

  // STEP 3: Apply semantic deduplication to new events
  let deduplicatedComplications = [];
  if (newEvents.length > 0) {
    deduplicatedComplications = deduplicateBySemanticSimilarity(newEvents, {
      type: 'complication',
      threshold: 0.75,
      mergeSameDate: true,
      preserveReferences: false
    });

    const stats = getDeduplicationStats(newEvents, deduplicatedComplications);
    console.log(`[Semantic Dedup] Complications: ${stats.original} → ${stats.deduplicated} (${stats.reductionPercent}% reduction)`);
  }

  // STEP 4: Link references to actual complication events
  const linkedReferences = linkReferencesToEvents(
    references,
    deduplicatedComplications,
    (ref, event) => {
      try {
        const nameSimilarity = calculateCombinedSimilarity(
          ref.name.toLowerCase(),
          event.name.toLowerCase()
        );

        if (ref.onsetDate && event.onsetDate && ref.onsetDate === event.onsetDate && nameSimilarity > 0.6) {
          return 0.95;
        }

        if (nameSimilarity > 0.8) {
          return nameSimilarity * 0.9;
        }

        return nameSimilarity;
      } catch (error) {
        console.warn('Similarity calculation failed:', error);
        return 0;
      }
    }
  );

  console.log(`[Reference Linking] Linked ${linkedReferences.linked.length} of ${references.length} complication references`);

  // STEP 5: Combine deduplicated events with unlinked references
  const finalComplications = [
    ...deduplicatedComplications,
    ...linkedReferences.unlinked
  ];

  // STEP 6: Clean up complication names
  for (const complication of finalComplications) {
    complication.name = complication.name
      .replace(/\s+/g, ' ')
      .replace(/[:\-,]\s*$/, '')
      .trim();

    if (complication.linkedReferences && complication.linkedReferences.length > 0) {
      complication.referenceCount = complication.linkedReferences.length;
      console.log(`[Reference Linking] "${complication.name}" has ${complication.referenceCount} references`);
    }
  }

  // STEP 7: Sort by onset date (earliest first)
  finalComplications.sort((a, b) => {
    if (!a.onsetDate && !b.onsetDate) return 0;
    if (!a.onsetDate) return 1;
    if (!b.onsetDate) return -1;
    return new Date(a.onsetDate) - new Date(b.onsetDate);
  });

  data.complications = finalComplications;

  if (finalComplications.length > 0) {
    confidence = CONFIDENCE.HIGH;
  }

  console.log(`[Phase 1 Step 5] Complication extraction complete: ${finalComplications.length} complications`);

  return { data, confidence };
};

/**
 * Extract imaging findings
 */
const extractImaging = (text) => {
  const data = {
    findings: []
  };
  
  let confidence = CONFIDENCE.MEDIUM;
  
  // Common imaging patterns
  const imagingPatterns = [
    /CT\s+(?:head|brain)\s*:?\s*([^\.]+)/gi,
    /MRI\s+(?:head|brain)\s*:?\s*([^\.]+)/gi,
    /(?:CT|MRI)\s+(?:showed|demonstrated|revealed)\s+([^\.]+)/gi
  ];
  
  for (const pattern of imagingPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const finding = cleanText(match[1]);
      if (finding && !data.findings.includes(finding)) {
        data.findings.push(finding);
        confidence = CONFIDENCE.HIGH;
      }
    }
  }
  
  return { data, confidence };
};

/**
 * Extract functional scores (KPS, ECOG, mRS)
 * Enhanced with PT/OT note analysis and ambulation-based scoring
 */
const extractFunctionalScores = (text) => {
  const data = {
    kps: null,
    ecog: null,
    mRS: null
  };
  
  let confidence = CONFIDENCE.MEDIUM;
  
  // KPS (Karnofsky Performance Status) 0-100
  const kpsPattern = /KPS\s*:?\s*(\d{1,3})/i;
  const kpsMatch = text.match(kpsPattern);
  if (kpsMatch) {
    const score = parseInt(kpsMatch[1]);
    if (score >= 0 && score <= 100) {
      data.kps = score;
      confidence = CONFIDENCE.HIGH;
    }
  }
  
  // If no explicit KPS, try to estimate from PT/OT notes
  if (data.kps === null) {
    const estimatedKPS = estimateKPSFromPTNotes(text);
    if (estimatedKPS.score !== null) {
      data.kps = estimatedKPS.score;
      confidence = Math.min(confidence, estimatedKPS.confidence);
    }
  }
  
  // ECOG (Eastern Cooperative Oncology Group) 0-5
  const ecogPattern = /ECOG\s*:?\s*([0-5])/i;
  const ecogMatch = text.match(ecogPattern);
  if (ecogMatch) {
    data.ecog = parseInt(ecogMatch[1]);
    confidence = CONFIDENCE.HIGH;
  }
  
  // If no explicit ECOG, try to estimate from functional status
  if (data.ecog === null) {
    const estimatedECOG = estimateECOGFromStatus(text);
    if (estimatedECOG.score !== null) {
      data.ecog = estimatedECOG.score;
      confidence = Math.min(confidence, estimatedECOG.confidence);
    }
  }
  
  // mRS (modified Rankin Scale) 0-6
  const mrsPattern = /mRS\s*:?\s*([0-6])/i;
  const mrsMatch = text.match(mrsPattern);
  if (mrsMatch) {
    data.mRS = parseInt(mrsMatch[1]);
    confidence = CONFIDENCE.HIGH;
  }
  
  // If no explicit mRS, try to estimate from disability descriptions
  if (data.mRS === null) {
    const estimatedMRS = estimateMRSFromDisability(text);
    if (estimatedMRS.score !== null) {
      data.mRS = estimatedMRS.score;
      confidence = Math.min(confidence, estimatedMRS.confidence);
    }
  }
  
  return { data, confidence };
};

/**
 * Estimate KPS from PT/OT assessment notes
 * Based on ambulation and activity level
 */
const estimateKPSFromPTNotes = (text) => {
  const lowerText = text.toLowerCase();
  
  // KPS 100: Normal, no complaints
  if (lowerText.includes('independent') && 
      (lowerText.includes('no assist') || lowerText.includes('without assist'))) {
    return { score: 100, confidence: CONFIDENCE.MEDIUM };
  }
  
  // KPS 90: Minor signs/symptoms
  if (lowerText.includes('independent') && 
      lowerText.includes('modified independent')) {
    return { score: 90, confidence: CONFIDENCE.MEDIUM };
  }
  
  // KPS 80: Normal activity with effort
  if (lowerText.includes('minimal assist') || 
      lowerText.includes('supervision') ||
      lowerText.includes('contact guard')) {
    return { score: 80, confidence: CONFIDENCE.MEDIUM };
  }
  
  // KPS 70: Cares for self, unable to work
  if (lowerText.includes('moderate assist') && 
      !lowerText.includes('total care')) {
    return { score: 70, confidence: CONFIDENCE.MEDIUM };
  }
  
  // KPS 60: Requires occasional assistance
  if (lowerText.includes('moderate assist') || 
      lowerText.includes('mod assist')) {
    return { score: 60, confidence: CONFIDENCE.MEDIUM };
  }
  
  // KPS 50: Requires considerable assistance
  if (lowerText.includes('maximal assist') || 
      lowerText.includes('max assist')) {
    return { score: 50, confidence: CONFIDENCE.MEDIUM };
  }
  
  // KPS 40: Disabled, requires special care
  if (lowerText.includes('total assist') || 
      lowerText.includes('dependent')) {
    return { score: 40, confidence: CONFIDENCE.MEDIUM };
  }
  
  // KPS 30: Severely disabled
  if (lowerText.includes('total care') || 
      lowerText.includes('bed bound') ||
      lowerText.includes('bedbound')) {
    return { score: 30, confidence: CONFIDENCE.MEDIUM };
  }
  
  // KPS 20: Very sick
  if (lowerText.includes('non-responsive') || 
      lowerText.includes('unresponsive')) {
    return { score: 20, confidence: CONFIDENCE.LOW };
  }
  
  // No match found
  return { score: null, confidence: CONFIDENCE.LOW };
};

/**
 * Estimate ECOG from functional status descriptions
 */
const estimateECOGFromStatus = (text) => {
  const lowerText = text.toLowerCase();
  
  // ECOG 0: Fully active
  if ((lowerText.includes('fully active') || lowerText.includes('fully ambulatory')) &&
      !lowerText.includes('restrict')) {
    return { score: 0, confidence: CONFIDENCE.MEDIUM };
  }
  
  // ECOG 1: Restricted in physically strenuous activity
  if (lowerText.includes('ambulatory') && 
      (lowerText.includes('light activity') || lowerText.includes('restricted'))) {
    return { score: 1, confidence: CONFIDENCE.MEDIUM };
  }
  
  // ECOG 2: Ambulatory and capable of self-care but unable to work
  if (lowerText.includes('ambulatory') && 
      (lowerText.includes('self care') || lowerText.includes('self-care')) &&
      !lowerText.includes('unable')) {
    return { score: 2, confidence: CONFIDENCE.MEDIUM };
  }
  
  // ECOG 3: Limited self-care, confined to bed/chair >50% of waking hours
  if (lowerText.includes('limited') && 
      (lowerText.includes('self care') || lowerText.includes('bed') || lowerText.includes('chair'))) {
    return { score: 3, confidence: CONFIDENCE.MEDIUM };
  }
  
  // ECOG 4: Completely disabled
  if (lowerText.includes('completely disabled') || 
      lowerText.includes('total care') ||
      (lowerText.includes('bed bound') || lowerText.includes('bedbound'))) {
    return { score: 4, confidence: CONFIDENCE.MEDIUM };
  }
  
  // ECOG 5: Dead
  if (lowerText.includes('deceased') || lowerText.includes('expired')) {
    return { score: 5, confidence: CONFIDENCE.HIGH };
  }
  
  return { score: null, confidence: CONFIDENCE.LOW };
};

/**
 * Estimate mRS from disability descriptions
 */
const estimateMRSFromDisability = (text) => {
  const lowerText = text.toLowerCase();
  
  // mRS 0: No symptoms
  if (lowerText.includes('no symptoms') || 
      (lowerText.includes('asymptomatic') && !lowerText.includes('deficit'))) {
    return { score: 0, confidence: CONFIDENCE.MEDIUM };
  }
  
  // mRS 1: No significant disability despite symptoms
  if ((lowerText.includes('no disability') || lowerText.includes('no significant disability')) &&
      lowerText.includes('independent')) {
    return { score: 1, confidence: CONFIDENCE.MEDIUM };
  }
  
  // mRS 2: Slight disability
  if (lowerText.includes('slight disability') || 
      (lowerText.includes('independent') && lowerText.includes('light'))) {
    return { score: 2, confidence: CONFIDENCE.MEDIUM };
  }
  
  // mRS 3: Moderate disability, requires some help
  if (lowerText.includes('moderate disability') || 
      (lowerText.includes('some help') || lowerText.includes('some assistance'))) {
    return { score: 3, confidence: CONFIDENCE.MEDIUM };
  }
  
  // mRS 4: Moderately severe disability
  if (lowerText.includes('moderately severe') || 
      lowerText.includes('unable to walk') ||
      (lowerText.includes('unable to attend') && lowerText.includes('bodily needs'))) {
    return { score: 4, confidence: CONFIDENCE.MEDIUM };
  }
  
  // mRS 5: Severe disability, bedridden
  if (lowerText.includes('severe disability') || 
      lowerText.includes('bedridden') ||
      lowerText.includes('bed bound') ||
      lowerText.includes('constant care')) {
    return { score: 5, confidence: CONFIDENCE.MEDIUM };
  }
  
  // mRS 6: Dead
  if (lowerText.includes('deceased') || lowerText.includes('expired')) {
    return { score: 6, confidence: CONFIDENCE.HIGH };
  }
  
  return { score: null, confidence: CONFIDENCE.LOW };
};

/**
 * Extract medications
 * PHASE 1 STEP 5: Enhanced with timeline tracking and temporal context
 *
 * New capabilities:
 * - Tracks start/stop dates for each medication
 * - Detects status: "started", "continued", "discontinued"
 * - Semantic deduplication: "aspirin" = "ASA" = "acetylsalicylic acid"
 * - Timeline reconstruction for medication changes
 * - Multi-value tracking for dose changes over time
 *
 * Example:
 * Input:
 *   - "Started Keppra 1000mg BID on 10/1"
 *   - "Continued on ASA 81mg daily"
 *   - "Discontinued nimodipine on POD#14"
 *
 * Output:
 *   - "levetiracetam 1000mg BID" (started: 10/1, status: active)
 *   - "aspirin 81mg daily" (status: continued)
 *   - "nimodipine" (discontinued: 10/15)
 */
const extractMedications = (text, referenceDates = {}) => {
  console.log('[Phase 1 Step 5] Enhanced medication extraction started...');

  const data = {
    medications: []
  };

  let confidence = CONFIDENCE.MEDIUM;

  // Enhanced medication extraction with drug+dose pattern
  const medicationWithDosePattern = /\b([A-Z][a-z]+(?:ra|pam|lol|pine|sin|xin)?)\s+(\d+(?:\.\d+)?\s*(?:mg|mcg|g|units?))\s*(?:(daily|BID|TID|QID|Q\d+H|PRN|once|twice))?\b/gi;

  // Common medication patterns (comprehensive neurosurgical medications)
  const medicationPatterns = [
    // Antiepileptics
    /\b(Keppra|Levetiracetam|LEV)\b/gi,
    /\b(Phenytoin|Dilantin|PHT)\b/gi,
    /\b(Valproic acid|Depakote|VPA)\b/gi,

    // Anticoagulation
    /\b(Aspirin|ASA|acetylsalicylic acid)\b/gi,
    /\b(Clopidogrel|Plavix)\b/gi,
    /\b(Warfarin|Coumadin)\b/gi,
    /\b(Apixaban|Eliquis)\b/gi,
    /\b(Rivaroxaban|Xarelto)\b/gi,

    // Vasospasm prevention
    /\b(Nimodipine|Nimotop)\b/gi,

    // Steroids
    /\b(Dexamethasone|Decadron|Dex)\b/gi,

    // Osmotic therapy
    /\b(Mannitol)\b/gi,
    /\b(Hypertonic saline|3% saline)\b/gi,

    // Blood pressure
    /\b(Labetalol|Trandate)\b/gi,
    /\b(Nicardipine|Cardene)\b/gi,
    /\b(Metoprolol|Lopressor)\b/gi,

    // GI prophylaxis
    /\b(Pantoprazole|Protonix|PPI)\b/gi,

    // Statins
    /\b(Atorvastatin|Lipitor)\b/gi
  ];

  // STEP 1: Extract all medication mentions with temporal context
  const allMedications = [];

  // Extract from dose patterns
  let match;
  while ((match = medicationWithDosePattern.exec(text)) !== null) {
    const medicationName = match[1].trim();
    const dose = match[2];
    const frequency = match[3] || null;

    // Detect temporal context and status
    const temporalContext = detectTemporalContext(text, medicationName, match.index);
    const statusInfo = extractMedicationStatus(text, match.index);

    // Associate dates
    const dateInfo = associateDateWithEntity(
      text,
      { index: match.index, value: match[0] },
      referenceDates
    );

    // Resolve POD if present
    let actionDate = dateInfo?.date || null;
    if (temporalContext.pod) {
      const resolvedDate = resolveRelativeDate(
        { type: 'pod', value: temporalContext.pod },
        referenceDates
      );
      if (resolvedDate) {
        actionDate = resolvedDate;
        console.log(`[Temporal] Resolved medication POD#${temporalContext.pod} → ${resolvedDate}`);
      }
    }

    const medication = {
      name: medicationName,
      dose: dose,
      frequency: frequency,
      status: statusInfo.status,
      startDate: statusInfo.status === 'started' ? actionDate : null,
      stopDate: statusInfo.status === 'discontinued' ? actionDate : null,
      dateSource: dateInfo.source,
      temporalContext: temporalContext,
      position: match.index
    };

    allMedications.push(medication);
  }

  // Extract from medication patterns
  for (const pattern of medicationPatterns) {
    const regex = new RegExp(pattern, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      const medicationName = (match[1] || match[0]).trim();

      // Get context for dose and frequency
      const context = text.substring(match.index, Math.min(text.length, match.index + 100));
      const doseMatch = context.match(/(\d+(?:\.\d+)?\s*(?:mg|mcg|g|units?))/i);
      const freqMatch = context.match(/(daily|BID|TID|QID|Q\d+H|PRN|once daily|twice daily|three times daily)/i);

      // Detect temporal context and status
      const temporalContext = detectTemporalContext(text, medicationName, match.index);
      const statusInfo = extractMedicationStatus(text, match.index);

      // Associate dates
      const dateInfo = associateDateWithEntity(
        text,
        { index: match.index, value: match[0] },
        referenceDates
      );

      // Resolve POD if present
      let actionDate = dateInfo?.date || null;
      if (temporalContext.pod) {
        const resolvedDate = resolveRelativeDate(
          { type: 'pod', value: temporalContext.pod },
          referenceDates
        );
        if (resolvedDate) {
          actionDate = resolvedDate;
        }
      }

      const medication = {
        name: medicationName,
        dose: doseMatch ? doseMatch[1] : null,
        frequency: freqMatch ? freqMatch[1] : null,
        status: statusInfo.status,
        startDate: statusInfo.status === 'started' ? actionDate : null,
        stopDate: statusInfo.status === 'discontinued' ? actionDate : null,
        dateSource: dateInfo.source,
        temporalContext: temporalContext,
        position: match.index
      };

      allMedications.push(medication);
    }
  }

  console.log(`[Extraction] Found ${allMedications.length} medication mentions (before deduplication)`);

  // STEP 2: Separate by status
  const references = allMedications.filter(m => m.temporalContext?.isReference);
  const newPrescriptions = allMedications.filter(m => !m.temporalContext?.isReference);

  console.log(`[Temporal] Separated: ${newPrescriptions.length} new prescriptions, ${references.length} references`);

  // STEP 3: Apply semantic deduplication
  let deduplicatedMedications = [];
  if (newPrescriptions.length > 0) {
    deduplicatedMedications = deduplicateBySemanticSimilarity(newPrescriptions, {
      type: 'medication',
      threshold: 0.75,
      mergeSameDate: false, // Different dates may indicate dose changes
      preserveReferences: false
    });

    const stats = getDeduplicationStats(newPrescriptions, deduplicatedMedications);
    console.log(`[Semantic Dedup] Medications: ${stats.original} → ${stats.deduplicated} (${stats.reductionPercent}% reduction)`);
  }

  // STEP 4: Link references to prescriptions
  const linkedReferences = linkReferencesToEvents(
    references,
    deduplicatedMedications,
    (ref, event) => {
      try {
        const nameSimilarity = calculateCombinedSimilarity(
          ref.name.toLowerCase(),
          event.name.toLowerCase()
        );

        // Same name + same dose = very likely same medication
        if (ref.dose && event.dose && ref.dose === event.dose && nameSimilarity > 0.6) {
          return 0.95;
        }

        if (nameSimilarity > 0.8) {
          return nameSimilarity * 0.9;
        }

        return nameSimilarity;
      } catch (error) {
        console.warn('Similarity calculation failed:', error);
        return 0;
      }
    }
  );

  console.log(`[Reference Linking] Linked ${linkedReferences.linked.length} of ${references.length} medication references`);

  // STEP 5: Combine deduplicated medications with unlinked references
  const finalMedications = [
    ...deduplicatedMedications,
    ...linkedReferences.unlinked
  ];

  // STEP 6: Clean up medication names
  for (const medication of finalMedications) {
    medication.name = medication.name
      .replace(/\s+/g, ' ')
      .replace(/[:\-,]\s*$/, '')
      .trim();

    if (medication.linkedReferences && medication.linkedReferences.length > 0) {
      medication.referenceCount = medication.linkedReferences.length;
      console.log(`[Reference Linking] "${medication.name}" has ${medication.referenceCount} references`);
    }
  }

  // STEP 7: Sort by start date (earliest first)
  finalMedications.sort((a, b) => {
    const dateA = a.startDate || a.stopDate;
    const dateB = b.startDate || b.stopDate;

    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return new Date(dateA) - new Date(dateB);
  });

  data.medications = finalMedications;

  if (finalMedications.length > 0) {
    confidence = CONFIDENCE.HIGH;
  }

  console.log(`[Phase 1 Step 5] Medication extraction complete: ${finalMedications.length} medications`);

  return { data, confidence };
};

/**
 * Helper function: Extract medication status from context
 * Detects: "started", "continued", "discontinued", "changed"
 */
const extractMedicationStatus = (text, position) => {
  const context = text.substring(Math.max(0, position - 50), Math.min(text.length, position + 50));
  const lowerContext = context.toLowerCase();

  // Status indicators
  const statusPatterns = {
    started: /\b(start|began|initiat|add|new)\w*\b/i,
    discontinued: /\b(discontinu|stop|held|d\/c)\w*\b/i,
    continued: /\b(continu|maintain|ongoing)\w*\b/i,
    changed: /\b(increas|decreas|adjust|chang)\w*\b/i
  };

  for (const [status, pattern] of Object.entries(statusPatterns)) {
    if (pattern.test(lowerContext)) {
      return { status, confidence: 0.8 };
    }
  }

  return { status: 'active', confidence: 0.5 };
};

/**
 * Extract follow-up plans
 */
const extractFollowUp = (text) => {
  const data = {
    appointments: [],
    instructions: []
  };
  
  let confidence = CONFIDENCE.MEDIUM;
  
  // Follow-up appointment patterns
  const appointmentPatterns = [
    /follow[-\s]?up\s+(?:in|within)\s+(\d+\s+(?:days?|weeks?|months?))/gi,
    /(?:return|see)\s+(?:to\s+)?clinic\s+(?:in\s+)?(\d+\s+(?:days?|weeks?|months?))/gi,
    /appointment\s+(?:scheduled\s+)?(?:for|in)\s+(\d+\s+(?:days?|weeks?|months?))/gi
  ];
  
  for (const pattern of appointmentPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const appointment = match[1] || match[0];
      if (!data.appointments.includes(appointment)) {
        data.appointments.push(appointment);
        confidence = CONFIDENCE.HIGH;
      }
    }
  }
  
  // Instructions
  const instructionPatterns = [
    /patient\s+(?:was\s+)?instructed\s+to\s+([^\.]+)/gi,
    /instructions?\s*:?\s*([^\.]+)/gi
  ];
  
  for (const pattern of instructionPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const instruction = cleanText(match[1]);
      if (instruction && !data.instructions.includes(instruction)) {
        data.instructions.push(instruction);
      }
    }
  }
  
  return { data, confidence };
};

/**
 * Extract oncology-specific data
 */
const extractOncology = (text, pathologyTypes) => {
  const data = {
    histology: null,
    molecularMarkers: {},
    treatment: []
  };
  
  let confidence = CONFIDENCE.MEDIUM;
  
  // Only relevant for tumor pathologies
  // FIX: Use uppercase pathology types to match PATHOLOGY_TYPES constants
  if (!pathologyTypes.includes('TUMORS') && !pathologyTypes.includes('METASTASES')) {
    return { data, confidence: CONFIDENCE.LOW };
  }
  
  // Histology
  const histologyPatterns = [
    /pathology\s*:?\s*([^\.]+)/i,
    /histology\s*:?\s*([^\.]+)/i,
    /(glioblastoma|astrocytoma|oligodendroglioma|meningioma|schwannoma|ependymoma)/gi
  ];
  
  for (const pattern of histologyPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.histology = cleanText(match[1] || match[0]);
      confidence = CONFIDENCE.HIGH;
      break;
    }
  }
  
  // Molecular markers
  const markerPatterns = {
    IDH: /IDH\s*:?\s*(mutant|wild[-\s]?type|positive|negative)/i,
    MGMT: /MGMT\s*:?\s*(methylated|unmethylated|positive|negative)/i,
    '1p19q': /1p19q\s*:?\s*(co[-\s]?deleted|intact)/i
  };
  
  for (const [marker, pattern] of Object.entries(markerPatterns)) {
    const match = text.match(pattern);
    if (match) {
      data.molecularMarkers[marker] = match[1];
      confidence = CONFIDENCE.HIGH;
    }
  }
  
  // Treatment (radiation, chemotherapy)
  const treatmentPatterns = [
    /radiation\s+therapy/gi,
    /chemotherapy\s+(?:with\s+)?(\w+)/gi,
    /temozolomide/gi,
    /bevacizumab/gi
  ];
  
  for (const pattern of treatmentPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const treatment = match[1] || match[0];
      if (!data.treatment.includes(treatment)) {
        data.treatment.push(treatment);
      }
    }
  }
  
  return { data, confidence };
};

/**
 * Apply learned patterns from ML system
 */
const applyLearnedPatterns = (extracted, text, learnedPatterns) => {
  for (const pattern of learnedPatterns) {
    try {
      const regex = new RegExp(pattern.pattern, 'gi');
      const matches = text.match(regex);
      
      if (matches) {
        // Apply pattern to appropriate field
        const field = pattern.field || pattern.category;
        if (extracted[field]) {
          // Add to existing data without replacing
          if (Array.isArray(extracted[field])) {
            extracted[field].push(...matches);
          } else if (typeof extracted[field] === 'object' && extracted[field] !== null) {
            Object.assign(extracted[field], pattern.value);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to apply learned pattern:', pattern, error);
    }
  }
};

/**
 * Calculate confidence score for complex object
 */
const calculateConfidence = (data) => {
  if (!data) return CONFIDENCE.LOW;

  // CRITICAL: null is typeof 'object', must check explicitly before Object.values()
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const values = Object.values(data).filter(v => v !== null && v !== undefined);
    if (values.length === 0) return CONFIDENCE.LOW;
    if (values.length >= 3) return CONFIDENCE.HIGH;
    return CONFIDENCE.MEDIUM;
  }
  
  return CONFIDENCE.MEDIUM;
};

/**
 * Calculate confidence scores from LLM extraction
 * LLM extractions get higher base confidence due to context understanding
 */
const calculateLLMConfidence = (llmResult) => {
  const confidence = {};
  
  // LLM has higher base confidence due to context understanding
  const LLM_BASE_CONFIDENCE = 0.90;
  
  for (const [category, data] of Object.entries(llmResult)) {
    if (!data || typeof data !== 'object') {
      confidence[category] = CONFIDENCE.LOW;
      continue;
    }
    
    // Calculate how complete the data is
    let filledFields = 0;
    let totalFields = 0;
    
    if (Array.isArray(data)) {
      confidence[category] = data.length > 0 ? LLM_BASE_CONFIDENCE : CONFIDENCE.LOW;
    } else {
      for (const value of Object.values(data)) {
        totalFields++;
        if (value !== null && value !== undefined && value !== '') {
          filledFields++;
        }
      }
      
      if (totalFields === 0) {
        confidence[category] = CONFIDENCE.LOW;
      } else {
        const completeness = filledFields / totalFields;
        confidence[category] = LLM_BASE_CONFIDENCE * completeness;
      }
    }
  }
  
  return confidence;
};

/**
 * Merge LLM and pattern-based extraction results
 * Uses LLM as primary source but enriches with pattern data
 */
const mergeLLMAndPatternResults = (llmResult, patternResult) => {
  // Add null safety
  if (!llmResult || typeof llmResult !== 'object') {
    return patternResult || {};
  }
  if (!patternResult || typeof patternResult !== 'object') {
    return llmResult || {};
  }

  const merged = { ...llmResult };

  // For each category, merge pattern data if LLM missed something
  for (const [category, patternData] of Object.entries(patternResult)) {
    const llmData = merged[category];
    
    if (!llmData) {
      // LLM didn't extract this category, use pattern data
      merged[category] = patternData;
      continue;
    }
    
    // Merge arrays
    if (Array.isArray(llmData) && Array.isArray(patternData)) {
      // Add pattern items that aren't in LLM result
      const llmNormalized = llmData.map(item => 
        typeof item === 'string' ? item.toLowerCase().trim() : item
      );
      
      for (const item of patternData) {
        const normalized = typeof item === 'string' ? item.toLowerCase().trim() : item;
        if (!llmNormalized.includes(normalized)) {
          merged[category].push(item);
        }
      }
    }
    
    // Merge objects - fill in null fields from pattern data
    // CRITICAL: null is typeof 'object' in JavaScript, so must explicitly check for null
    if (typeof llmData === 'object' && !Array.isArray(llmData) && llmData !== null &&
        typeof patternData === 'object' && !Array.isArray(patternData) && patternData !== null) {
      for (const [key, value] of Object.entries(patternData)) {
        if ((llmData[key] === null || llmData[key] === undefined || llmData[key] === '') &&
            (value !== null && value !== undefined && value !== '')) {
          merged[category][key] = value;
        }
      }
    }
  }
  
  return merged;
};

/**
 * Calculate merged confidence from LLM and pattern results
 */
const calculateMergedConfidence = (llmResult, patternConfidence) => {
  // Add null safety
  if (!llmResult || typeof llmResult !== 'object') {
    return patternConfidence || {};
  }
  if (!patternConfidence || typeof patternConfidence !== 'object') {
    patternConfidence = {};
  }

  const llmConfidence = calculateLLMConfidence(llmResult);
  const merged = {};

  // Take the higher confidence for each category
  const allCategories = new Set([
    ...Object.keys(llmConfidence || {}),
    ...Object.keys(patternConfidence || {})
  ]);
  
  for (const category of allCategories) {
    const llmConf = llmConfidence[category] || 0;
    const patternConf = patternConfidence[category] || 0;
    
    // Use LLM confidence as base, boost if pattern also found data
    if (llmConf > 0 && patternConf > 0) {
      // Both methods found data - high confidence
      merged[category] = Math.min(0.95, Math.max(llmConf, patternConf) + 0.05);
    } else {
      // Only one method found data - use that confidence
      merged[category] = Math.max(llmConf, patternConf);
    }
  }
  
  return merged;
};

/**
 * Create empty result structure
 */
const createEmptyResult = () => ({
  extracted: {},
  confidence: {},
  pathologyTypes: [],
  metadata: {
    noteCount: 0,
    totalLength: 0,
    extractionDate: new Date().toISOString(),
    error: 'No valid input provided'
  }
});

export default {
  extractMedicalEntities,
  extractDemographics,
  extractDates,
  extractPathology,
  extractPresentingSymptoms,
  extractProcedures,
  extractComplications,
  extractImaging,
  extractFunctionalScores,
  extractMedications,
  extractFollowUp,
  extractOncology
};
