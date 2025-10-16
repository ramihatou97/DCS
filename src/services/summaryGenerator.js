/**
 * Summary Generator Service
 *
 * Final synthesis service that combines extraction, validation, and narrative
 * generation to produce complete discharge summaries.
 *
 * Features:
 * - Complete workflow orchestration (Phase 4: Enhanced with intelligent orchestration)
 * - Quality scoring
 * - Export formatting (PDF, text, HL7, FHIR)
 * - Template customization
 * - Chronological context awareness
 * - Advanced deduplication
 * - Cross-component feedback loops (Phase 4)
 *
 * @module summaryGenerator
 */

import { extractMedicalEntities } from './extraction.js';
import { validateExtraction, getValidationSummary } from './validation.js';
import { generateNarrative, formatNarrativeForExport, generateConciseSummary } from './narrativeEngine.js';
import { buildChronologicalTimeline } from './chronologicalContext.js';
import { generateFromTemplate } from '../utils/templates.js';
import { formatDate } from '../utils/dateUtils.js';
import { orchestrateSummaryGeneration } from './summaryOrchestrator.js';

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
 * @typedef {Object} Pathology
 * @property {string} type - Primary pathology type
 * @property {Array<string>} types - All detected pathology types
 * @property {string|null} location - Anatomical location
 * @property {string|null} side - Laterality (left/right)
 * @property {Object|null} subtype - Pathology subtype details
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
 * @typedef {Object} ExtractionMetadata
 * @property {string} extractionMethod - Method used (LLM, pattern, hybrid, pre-extracted)
 * @property {boolean} preprocessed - Whether notes were preprocessed
 * @property {boolean} deduplicated - Whether deduplication was applied
 */

/**
 * @typedef {Object} ExtractionResult
 * @property {ExtractedMedicalData} extracted - Extracted medical entities
 * @property {Object} confidence - Confidence scores per field
 * @property {string[]} pathologyTypes - Detected pathology types
 * @property {ExtractionMetadata} metadata - Extraction metadata
 * @property {Object} clinicalIntelligence - Clinical insights
 * @property {Object} qualityMetrics - Quality metrics
 */

/**
 * @typedef {Object} ValidationError
 * @property {string} field - Field that failed validation
 * @property {*} value - Invalid value
 * @property {string} reason - Why validation failed
 * @property {'critical'|'warning'|'info'} [severity] - Error severity
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Overall validation status
 * @property {number} overallConfidence - Confidence score (0-1)
 * @property {Array<ValidationError>} warnings - Warning messages
 * @property {Array<ValidationError>} errors - Error messages
 * @property {Array<Object>} flags - Validation flags
 * @property {Object} validatedData - Validated and corrected data
 * @property {Array<string>} invalidFields - List of invalid field names
 */

/**
 * @typedef {Object} ValidationSummary
 * @property {boolean} isValid - Overall validation status
 * @property {number} errorCount - Number of errors
 * @property {number} warningCount - Number of warnings
 * @property {number} flagCount - Number of flags
 * @property {number} confidence - Overall confidence score
 */

/**
 * @typedef {Object} NarrativeResult
 * @property {string} chiefComplaint - Chief complaint section
 * @property {string} historyOfPresentIllness - HPI section
 * @property {string} hospitalCourse - Hospital course narrative
 * @property {string} dischargeStatus - Discharge status section
 * @property {string} procedures - Procedures performed
 * @property {string} complications - Complications encountered
 * @property {string} dischargeMedications - Discharge medications
 * @property {string} followUpPlan - Follow-up instructions
 * @property {Object} metadata - Narrative generation metadata
 */

/**
 * @typedef {Object} QualityMetrics
 * @property {number} overall - Overall quality score (0-100)
 * @property {number} extraction - Extraction quality (0-100)
 * @property {number} validation - Validation quality (0-100)
 * @property {number} summary - Summary quality (0-100)
 * @property {Object} details - Detailed metrics breakdown
 */

/**
 * @typedef {Object} ClinicalIntelligence
 * @property {Object} pathology - Pathology analysis
 * @property {Object} quality - Quality assessment
 * @property {Object} completeness - Completeness check
 * @property {Object} consistency - Consistency validation
 * @property {Array<Object>} learnedPatterns - Learned patterns
 * @property {Array<Object>} suggestions - Improvement suggestions
 */

/**
 * @typedef {Object} OrchestrationMetadata
 * @property {string} startTime - ISO timestamp of start
 * @property {number} processingTime - Processing time in milliseconds
 * @property {string} orchestrationMethod - Orchestration method used
 */

/**
 * @typedef {Object} OrchestrationResult
 * @property {boolean} success - Whether orchestration succeeded
 * @property {NarrativeResult|null} summary - Generated summary sections
 * @property {ExtractedMedicalData|null} extractedData - Extracted medical data
 * @property {ValidationResult|null} validation - Validation results
 * @property {ClinicalIntelligence|null} intelligence - Clinical intelligence insights
 * @property {QualityMetrics|null} qualityMetrics - Quality assessment metrics
 * @property {number} refinementIterations - Number of refinement passes
 * @property {OrchestrationMetadata} metadata - Generation metadata
 */

/**
 * @typedef {Object} SummaryMetadata
 * @property {string} generatedAt - ISO timestamp of generation
 * @property {number} noteCount - Number of input notes
 * @property {string[]} pathologyTypes - Detected pathology types
 * @property {string} extractionMethod - Extraction method used
 * @property {boolean} preprocessed - Whether notes were preprocessed
 * @property {boolean} deduplicated - Whether deduplication was applied
 * @property {Object|null} timelineCompleteness - Timeline completeness metrics
 * @property {boolean} useOrchestrator - Whether orchestrator was used
 * @property {number} refinementIterations - Number of refinement passes
 * @property {number} processingTime - Processing time in milliseconds
 * @property {string} [error] - Error message if generation failed
 */

/**
 * @typedef {Object} SummaryResult
 * @property {boolean} success - Whether generation succeeded
 * @property {NarrativeResult|string|null} summary - Generated summary
 * @property {ExtractedMedicalData|null} extractedData - Extracted medical data
 * @property {ValidationSummary|null} validation - Validation results
 * @property {number} qualityScore - Overall quality score (0-100)
 * @property {QualityMetrics|null} qualityMetrics - Detailed quality metrics
 * @property {ClinicalIntelligence|null} intelligence - Clinical intelligence insights
 * @property {Array<ValidationError>} warnings - Warning messages
 * @property {Array<ValidationError>} errors - Error messages
 * @property {Object|null} timeline - Chronological timeline
 * @property {SummaryMetadata} metadata - Generation metadata
 */

/**
 * @typedef {Object} GenerationOptions
 * @property {boolean} [validateData=true] - Whether to validate extracted data
 * @property {boolean} [includeMetadata=true] - Include generation metadata
 * @property {'structured'|'text'|'template'} [format='structured'] - Output format
 * @property {Object|null} [template=null] - Custom template to use
 * @property {Array} [learnedPatterns=[]] - ML learned patterns to apply
 * @property {ExtractedMedicalData|null} [extractedData=null] - Pre-extracted data (skips extraction)
 * @property {boolean} [useOrchestrator=true] - Use Phase 4 intelligent orchestration
 * @property {'formal'|'concise'|'detailed'} [style='formal'] - Narrative style
 */

// ========================================
// MAIN FUNCTIONS
// ========================================

/**
 * Generate complete discharge summary from clinical notes
 *
 * This is the main entry point for discharge summary generation. It supports
 * both standard extraction and intelligent orchestration (Phase 4).
 *
 * @param {string|string[]} notes - Clinical notes (single string or array)
 * @param {GenerationOptions} [options={}] - Generation options
 * @returns {Promise<SummaryResult>} Complete discharge summary with metadata
 *
 * @example
 * // Basic usage
 * const result = await generateDischargeSummary(clinicalNotes);
 *
 * @example
 * // With pre-extracted data (skip extraction)
 * const result = await generateDischargeSummary(notes, {
 *   extractedData: reviewedData,
 *   validateData: false
 * });
 *
 * @example
 * // With custom options
 * const result = await generateDischargeSummary(notes, {
 *   format: 'text',
 *   style: 'concise',
 *   useOrchestrator: true
 * });
 */
export const generateDischargeSummary = async (notes, options = {}) => {
  const {
    validateData = true,
    format = 'structured', // 'structured', 'text', 'template'
    template = null,
    learnedPatterns = [],
    extractedData = null, // Pre-extracted and corrected data (optional)
    useOrchestrator = true // PHASE 4: Use intelligent orchestration
  } = options;

  // PHASE 4: Use intelligent orchestrator for better quality
  if (useOrchestrator) {
    console.log('[Summary Generator] Using Phase 4 intelligent orchestrator...');
    try {
      /** @type {OrchestrationResult} */
      const orchestratorResult = await orchestrateSummaryGeneration(notes, {
        extractedData,
        enableLearning: true,
        enableFeedbackLoops: true,
        maxRefinementIterations: 2,
        qualityThreshold: 0.7
      });

      if (orchestratorResult.success) {
        return {
          success: true,
          summary: orchestratorResult.summary,
          extractedData: orchestratorResult.extractedData,
          validation: orchestratorResult.validation,
          qualityScore: orchestratorResult.qualityMetrics?.overall || 0,
          qualityMetrics: orchestratorResult.qualityMetrics,
          intelligence: orchestratorResult.intelligence,
          warnings: [],
          errors: [],
          metadata: {
            ...orchestratorResult.metadata,
            generatedAt: new Date().toISOString(),
            noteCount: Array.isArray(notes) ? notes.length : 1,
            useOrchestrator: true,
            refinementIterations: orchestratorResult.refinementIterations
          }
        };
      } else {
        console.warn('[Summary Generator] Orchestrator failed, falling back to standard generation');
      }
    } catch (error) {
      console.error('[Summary Generator] Orchestrator error, falling back:', error);
    }
  }

  // Standard generation (fallback or explicit)
  console.log('[Summary Generator] Using standard generation...');

  /** @type {SummaryResult} */
  const result = {
    success: false,
    summary: null,
    extractedData: null,
    validation: null,
    qualityScore: 0,
    qualityMetrics: null,
    intelligence: null,
    warnings: [],
    errors: [],
    timeline: null,
    metadata: {
      generatedAt: new Date().toISOString(),
      noteCount: Array.isArray(notes) ? notes.length : 1,
      pathologyTypes: [],
      extractionMethod: '',
      preprocessed: false,
      deduplicated: false,
      timelineCompleteness: null,
      useOrchestrator: false,
      refinementIterations: 0,
      processingTime: 0
    }
  };

  const startTime = Date.now();

  try {
    // Step 1: Extract data from notes (or use pre-extracted data)
    /** @type {ExtractionResult} */
    let extraction;

    if (extractedData) {
      // Use pre-extracted and corrected data
      console.log('Using pre-extracted and corrected data');
      extraction = {
        extracted: extractedData,
        confidence: {},
        pathologyTypes: extractedData.pathology?.types || [],
        metadata: {
          extractionMethod: 'pre-extracted',
          preprocessed: true,
          deduplicated: true
        },
        clinicalIntelligence: {},
        qualityMetrics: {}
      };
    } else {
      // Extract data from notes (with preprocessing and deduplication)
      console.log('Extracting data from notes');
      extraction = await extractMedicalEntities(notes, {
        learnedPatterns,
        includeConfidence: true,
        enableDeduplication: true,
        enablePreprocessing: true
      });
    }

    result.extractedData = extraction.extracted;
    result.metadata.pathologyTypes = extraction.pathologyTypes;
    result.metadata.extractionMethod = extraction.metadata.extractionMethod;
    result.metadata.preprocessed = extraction.metadata.preprocessed;
    result.metadata.deduplicated = extraction.metadata.deduplicated;

    // Step 2: Build chronological timeline with context awareness
    console.log('Building chronological timeline...');
    const timeline = buildChronologicalTimeline(
      extraction.extracted,
      Array.isArray(notes) ? notes : [notes],
      {
        resolveRelativeDates: true,
        sortEvents: true,
        deduplicateEvents: true,
        includeContext: true
      }
    );
    
    result.timeline = timeline;
    result.metadata.timelineCompleteness = timeline.metadata.completeness;

    // Step 3: Validate extracted data (only if not pre-extracted)
    if (validateData && !extractedData) {
      const validation = validateExtraction(
        extraction.extracted,
        notes,
        { strictMode: false } // Use lenient mode - user can correct in review
      );

      result.validation = getValidationSummary(validation);

      // Use validated data (with corrections)
      result.extractedData = validation.validatedData;
      result.warnings = validation.warnings;
      result.errors = validation.errors;

      // Only fail on critical errors, not warnings or low confidence
      if (validation.errors && validation.errors.length > 0) {
        result.success = false;
        result.metadata.error = 'Validation failed with critical errors';
        return result;
      }
    }

    // Step 4: Generate narrative with chronological context
    const pathologyType = extraction.pathologyTypes[0] || 'general';

    /** @type {NarrativeResult} */
    let narrative;
    if (format === 'template' && template) {
      // Use specific template
      narrative = generateFromTemplate(template, result.extractedData);
    } else {
      // Generate narrative with source notes and timeline
      const sourceNotes = Array.isArray(notes) ? notes.join('\n\n') : notes;
      narrative = await generateNarrative(result.extractedData, sourceNotes, {
        pathologyType,
        style: options.style || 'formal',
      });
    }

    // Step 5: Format summary
    if (format === 'text') {
      result.summary = formatNarrativeForExport(narrative, {
        includeHeaders: true,
        sectionSeparator: '\n\n'
      });
    } else {
      result.summary = narrative;
    }

    // Step 6: Calculate quality score (including timeline completeness)
    result.qualityScore = calculateQualityScore(
      result.extractedData,
      result.validation,
      narrative,
      timeline
    );

    // Success
    result.success = true;
    result.metadata.processingTime = Date.now() - startTime;

  } catch (error) {
    result.success = false;
    result.errors.push({
      message: 'Summary generation failed',
      error: error.message
    });
    result.metadata.error = error.message;
  }

  return result;
};

/**
 * Calculate quality score for generated summary
 *
 * Score based on:
 * - Data completeness (35%)
 * - Validation confidence (25%)
 * - Narrative coherence (25%)
 * - Timeline completeness (15%)
 *
 * @param {ExtractedMedicalData} extractedData - Extracted medical data
 * @param {ValidationSummary|null} validation - Validation results
 * @param {NarrativeResult} narrative - Generated narrative
 * @param {Object|null} timeline - Chronological timeline
 * @returns {number} Quality score (0-100)
 * @private
 */
const calculateQualityScore = (extractedData, validation, narrative, timeline) => {
  let score = 0;

  console.log('\n🔍 ===== QUALITY SCORE BREAKDOWN =====');

  // Data completeness (35 points)
  const completenessScore = calculateCompletenessScore(extractedData);
  const completenessContribution = completenessScore * 0.35;
  console.log(`📊 Completeness: ${(completenessScore * 100).toFixed(1)}% → ${(completenessContribution * 100).toFixed(1)}% contribution`);
  score += completenessContribution;

  // Validation confidence (25 points)
  if (validation) {
    const validationContribution = (validation.confidence / 100) * 0.25;
    console.log(`✅ Validation: ${validation.confidence}% → ${(validationContribution * 100).toFixed(1)}% contribution`);
    score += validationContribution;
  } else {
    console.log(`✅ Validation: No validation (full credit) → 25.0% contribution`);
    score += 0.25;
  }

  // Narrative coherence (25 points)
  const coherenceScore = calculateCoherenceScore(narrative);
  const coherenceContribution = coherenceScore * 0.25;
  console.log(`📝 Coherence: ${(coherenceScore * 100).toFixed(1)}% → ${(coherenceContribution * 100).toFixed(1)}% contribution`);
  score += coherenceContribution;

  // Timeline completeness (15 points)
  if (timeline && timeline.metadata && timeline.metadata.completeness) {
    const timelineScore = timeline.metadata.completeness.score / 100;
    const timelineContribution = timelineScore * 0.15;
    console.log(`⏱️  Timeline: ${(timelineScore * 100).toFixed(1)}% → ${(timelineContribution * 100).toFixed(1)}% contribution`);
    score += timelineContribution;
  } else {
    console.log(`⏱️  Timeline: Missing/incomplete (partial credit) → 10.0% contribution`);
    score += 0.10;
  }

  const finalScore = Math.round(score * 100);
  console.log(`\n🎯 TOTAL QUALITY SCORE: ${finalScore}%`);
  console.log('=====================================\n');

  return finalScore;
};

/**
 * Calculate data completeness score
 */
const calculateCompletenessScore = (data) => {
  const requiredFields = [
    'demographics',
    'dates',
    'pathology',
    'procedures',
    'dischargeDestination'
  ];

  const optionalFields = [
    'presentingSymptoms',
    'complications',
    'anticoagulation',
    'imaging',
    'functionalScores',
    'medications',
    'followUp'
  ];

  let score = 0;

  console.log('  📋 Required Fields (2 pts each):');
  // Required fields (higher weight)
  requiredFields.forEach(field => {
    const hasData = data[field] && hasContent(data[field]);
    console.log(`    ${hasData ? '✅' : '❌'} ${field}`);
    if (hasData) {
      score += 2; // 2 points per required field
    }
  });

  console.log('  📋 Optional Fields (1 pt each):');
  // Optional fields
  optionalFields.forEach(field => {
    const hasData = data[field] && hasContent(data[field]);
    console.log(`    ${hasData ? '✅' : '❌'} ${field}`);
    if (hasData) {
      score += 1; // 1 point per optional field
    }
  });

  // Normalize to 0-1
  const maxScore = (requiredFields.length * 2) + optionalFields.length;
  console.log(`  📊 Score: ${score}/${maxScore} points`);
  return score / maxScore;
};

/**
 * Check if field has meaningful content
 */
const hasContent = (field) => {
  if (!field) return false;
  
  if (Array.isArray(field)) {
    return field.length > 0;
  }

  // CRITICAL: null is typeof 'object', must check explicitly before Object.values()
  if (typeof field === 'object' && field !== null && !Array.isArray(field)) {
    return Object.values(field).some(v => v !== null && v !== undefined && v !== '');
  }

  return true;
};

/**
 * Calculate narrative coherence score
 */
const calculateCoherenceScore = (narrative) => {
  let score = 0;
  const maxScore = 12; // (4 required × 2) + (4 optional × 1)

  const requiredSections = [
    'chiefComplaint',
    'historyOfPresentIllness',
    'hospitalCourse',
    'dischargeStatus'
  ];

  const optionalSections = [
    'procedures',
    'complications',
    'dischargeMedications',
    'followUpPlan'
  ];

  console.log('  📝 Required Narrative Sections (2 pts each):');
  // Check required sections (higher weight)
  requiredSections.forEach(section => {
    const hasData = narrative[section] && narrative[section] !== 'Not available.';
    console.log(`    ${hasData ? '✅' : '❌'} ${section}`);
    if (hasData) {
      score += 2;
    }
  });

  console.log('  📝 Optional Narrative Sections (1 pt each):');
  // Check optional sections
  optionalSections.forEach(section => {
    const hasData = narrative[section] && narrative[section] !== 'Not available.';
    console.log(`    ${hasData ? '✅' : '❌'} ${section}`);
    if (hasData) {
      score += 1;
    }
  });

  console.log(`  📊 Score: ${score}/${maxScore} points`);
  return Math.min(score / maxScore, 1.0);
};

/**
 * Export summary to various formats
 */
export const exportSummary = async (summary, format, options = {}) => {
  const {
    filename = `discharge-summary-${Date.now()}`,
    includeMetadata = false
  } = options;

  switch (format) {
    case 'text':
      return exportToText(summary, options);
    
    case 'pdf':
      return exportToPDF(summary, filename, options);
    
    case 'json':
      return exportToJSON(summary, includeMetadata);
    
    case 'hl7':
      return exportToHL7(summary, options);
    
    case 'fhir':
      return exportToFHIR(summary, options);
    
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};

/**
 * Export to plain text
 */
const exportToText = (summary, options) => {
  if (typeof summary === 'string') {
    return summary;
  }

  return formatNarrativeForExport(summary, {
    includeHeaders: true,
    sectionSeparator: '\n\n',
    headerStyle: options.headerStyle || 'uppercase'
  });
};

/**
 * Export to PDF (using jsPDF)
 */
const exportToPDF = async (summary, filename, options) => {
  // This will be implemented with jsPDF in the component
  // Return formatted text for PDF generation
  const text = exportToText(summary, options);
  
  return {
    format: 'pdf',
    content: text,
    filename: `${filename}.pdf`,
    metadata: {
      title: 'Discharge Summary',
      author: 'DCS App',
      subject: 'Medical Discharge Summary',
      createdAt: new Date().toISOString()
    }
  };
};

/**
 * Export to JSON
 */
const exportToJSON = (summary, includeMetadata) => {
  const data = {
    summary,
    exportedAt: new Date().toISOString(),
    format: 'json',
    version: '1.0'
  };

  if (includeMetadata && summary.metadata) {
    data.metadata = summary.metadata;
  }

  return JSON.stringify(data, null, 2);
};

/**
 * Export to HL7 v2.5.1 format
 */
const exportToHL7 = (summary, options) => {
  const {
    facilityName = 'HOSPITAL',
    sendingApplication = 'DCS'
  } = options;

  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const messageId = Date.now().toString();

  // Convert narrative to plain text
  const text = exportToText(summary).replace(/\n/g, '\r\n');

  // Build HL7 message (MDM^T02 - Document Notification)
  const hl7Message = [
    `MSH|^~\\&|${sendingApplication}|${facilityName}|||${timestamp}||MDM^T02|${messageId}|P|2.5.1`,
    `PID|1||PATIENT_ID||PATIENT_NAME^FIRST||DOB|SEX`,
    `TXA|1|DS|TX|${timestamp}|||PROVIDER_NAME`,
    `OBX|1|TX|DS^Discharge Summary||${text}||||||F`
  ].join('\r\n');

  return hl7Message;
};

/**
 * Export to FHIR R4 format
 */
const exportToFHIR = (summary, options) => {
  const {
    patientId = 'unknown',
    practitionerId = 'unknown'
  } = options;

  const text = exportToText(summary);

  const fhirDocument = {
    resourceType: 'DocumentReference',
    id: `discharge-summary-${Date.now()}`,
    status: 'current',
    type: {
      coding: [{
        system: 'http://loinc.org',
        code: '18842-5',
        display: 'Discharge summary'
      }]
    },
    category: [{
      coding: [{
        system: 'http://hl7.org/fhir/us/core/CodeSystem/us-core-documentreference-category',
        code: 'clinical-note',
        display: 'Clinical Note'
      }]
    }],
    subject: {
      reference: `Patient/${patientId}`
    },
    date: new Date().toISOString(),
    author: [{
      reference: `Practitioner/${practitionerId}`
    }],
    content: [{
      attachment: {
        contentType: 'text/plain',
        data: btoa(text), // Base64 encode
        title: 'Discharge Summary',
        creation: new Date().toISOString()
      }
    }]
  };

  return JSON.stringify(fhirDocument, null, 2);
};

/**
 * Generate summary preview (for UI display)
 */
export const generateSummaryPreview = (extractedData) => {
  return {
    concise: generateConciseSummary(extractedData),
    demographics: getDemographicsPreview(extractedData),
    diagnosis: getDiagnosisPreview(extractedData),
    procedures: getProceduresPreview(extractedData),
    discharge: getDischargePreview(extractedData)
  };
};

/**
 * Get demographics preview
 */
const getDemographicsPreview = (data) => {
  const { demographics } = data;
  if (!demographics) return 'Not available';

  const parts = [];
  if (demographics.age) parts.push(`${demographics.age} years old`);
  if (demographics.gender) {
    const gender = demographics.gender === 'M' ? 'Male' : 'Female';
    parts.push(gender);
  }

  return parts.join(', ') || 'Not available';
};

/**
 * Get diagnosis preview
 */
const getDiagnosisPreview = (data) => {
  const { pathology } = data;
  if (!pathology?.primaryDiagnosis) return 'Not documented';

  let text = pathology.primaryDiagnosis;

  if (pathology.location) {
    text += `, ${pathology.location}`;
  }

  if (pathology.grades && Object.keys(pathology.grades).length > 0) {
    const grades = Object.entries(pathology.grades)
      .map(([type, value]) => `${type} ${value}`)
      .join(', ');
    text += ` (${grades})`;
  }

  return text;
};

/**
 * Get procedures preview
 */
const getProceduresPreview = (data) => {
  const { procedures } = data;
  if (!procedures?.procedures || procedures.procedures.length === 0) {
    return 'None documented';
  }

  return procedures.procedures.map(p => p.name).join(', ');
};

/**
 * Get discharge preview
 */
const getDischargePreview = (data) => {
  const { dischargeDestination, dates } = data;

  const parts = [];

  if (dates?.dischargeDate) {
    parts.push(formatDate(dates.dischargeDate));
  }

  if (dischargeDestination?.destination) {
    parts.push(`to ${dischargeDestination.destination}`);
  }

  return parts.join(' ') || 'Not documented';
};

/**
 * Compare two summaries (for learning/review)
 */
export const compareSummaries = (original, corrected) => {
  const differences = {
    changed: [],
    added: [],
    removed: []
  };

  // Compare each section
  const allSections = new Set([
    ...Object.keys(original),
    ...Object.keys(corrected)
  ]);

  allSections.forEach(section => {
    if (section === 'metadata') return;

    const origValue = original[section];
    const corrValue = corrected[section];

    if (!origValue && corrValue) {
      differences.added.push({ section, value: corrValue });
    } else if (origValue && !corrValue) {
      differences.removed.push({ section, value: origValue });
    } else if (origValue !== corrValue) {
      differences.changed.push({
        section,
        before: origValue,
        after: corrValue
      });
    }
  });

  return differences;
};

/**
 * Merge multiple summaries (for case reviews)
 */
export const mergeSummaries = (summaries) => {
  if (!summaries || summaries.length === 0) {
    return null;
  }

  if (summaries.length === 1) {
    return summaries[0];
  }

  // Merge strategy: prefer most recent, combine unique items
  const merged = { ...summaries[0] };

  summaries.slice(1).forEach(summary => {
    Object.keys(summary).forEach(key => {
      if (key === 'metadata') return;

      if (Array.isArray(merged[key]) && Array.isArray(summary[key])) {
        // Combine arrays, remove duplicates
        merged[key] = [...new Set([...merged[key], ...summary[key]])];
      } else if (typeof merged[key] === 'object' && merged[key] !== null && !Array.isArray(merged[key]) &&
                 typeof summary[key] === 'object' && summary[key] !== null && !Array.isArray(summary[key])) {
        // Merge objects (CRITICAL: null check before spread operator)
        merged[key] = { ...merged[key], ...summary[key] };
      } else if (!merged[key] && summary[key]) {
        // Use value if current is empty
        merged[key] = summary[key];
      }
    });
  });

  return merged;
};

export default {
  generateDischargeSummary,
  exportSummary,
  generateSummaryPreview,
  compareSummaries,
  mergeSummaries
};
