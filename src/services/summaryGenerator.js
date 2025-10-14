/**
 * Summary Generator Service
 * 
 * Final synthesis service that combines extraction, validation, and narrative
 * generation to produce complete discharge summaries.
 * 
 * Features:
 * - Complete workflow orchestration
 * - Quality scoring
 * - Export formatting (PDF, text, HL7, FHIR)
 * - Template customization
 * - Chronological context awareness
 * - Advanced deduplication
 */

import { extractMedicalEntities } from './extraction.js';
import { validateExtraction, getValidationSummary } from './validation.js';
import { generateNarrative, formatNarrativeForExport, generateConciseSummary } from './narrativeEngine.js';
import { buildChronologicalTimeline, generateTimelineNarrative } from './chronologicalContext.js';
import { getTemplateByPathology, generateFromTemplate } from '../utils/templates.js';
import { formatDate } from '../utils/dateUtils.js';

/**
 * Generate complete discharge summary from clinical notes
 * 
 * @param {string|string[]} notes - Clinical notes
 * @param {Object} options - Generation options
 * @returns {Object} Complete discharge summary with metadata
 */
export const generateDischargeSummary = async (notes, options = {}) => {
  const {
    validateData = true,
    includeMetadata = true,
    format = 'structured', // 'structured', 'text', 'template'
    template = null,
    learnedPatterns = []
  } = options;

  const result = {
    success: false,
    summary: null,
    extractedData: null,
    validation: null,
    qualityScore: 0,
    warnings: [],
    errors: [],
    metadata: {
      generatedAt: new Date().toISOString(),
      noteCount: Array.isArray(notes) ? notes.length : 1,
      processingTime: 0
    }
  };

  const startTime = Date.now();

  try {
    // Step 1: Extract data from notes (with preprocessing and deduplication)
    const extraction = await extractMedicalEntities(notes, {
      learnedPatterns,
      includeConfidence: true,
      enableDeduplication: true,
      enablePreprocessing: true
    });

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

    // Step 3: Validate extracted data
    if (validateData) {
      const validation = validateExtraction(
        extraction.extracted,
        notes,
        { strictMode: true }
      );

      result.validation = getValidationSummary(validation);
      
      // Use validated data (with corrections)
      result.extractedData = validation.validatedData;
      result.warnings = validation.warnings;
      result.errors = validation.errors;

      // Check if validation passed
      if (!validation.isValid) {
        result.success = false;
        result.metadata.error = 'Validation failed';
        return result;
      }
    }

    // Step 4: Generate narrative with chronological context
    const pathologyType = extraction.pathologyTypes[0] || 'general';
    
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
 */
const calculateQualityScore = (extractedData, validation, narrative, timeline) => {
  let score = 0;

  // Data completeness (35 points)
  const completenessScore = calculateCompletenessScore(extractedData);
  score += completenessScore * 0.35;

  // Validation confidence (25 points)
  if (validation) {
    score += (validation.confidence / 100) * 0.25;
  } else {
    score += 0.25; // Assume perfect if no validation
  }

  // Narrative coherence (25 points)
  const coherenceScore = calculateCoherenceScore(narrative);
  score += coherenceScore * 0.25;
  
  // Timeline completeness (15 points)
  if (timeline && timeline.metadata && timeline.metadata.completeness) {
    const timelineScore = timeline.metadata.completeness.score / 100;
    score += timelineScore * 0.15;
  } else {
    score += 0.10; // Partial credit if timeline not available
  }

  return Math.round(score * 100);
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
  let totalFields = requiredFields.length + optionalFields.length;

  // Required fields (higher weight)
  requiredFields.forEach(field => {
    if (data[field] && hasContent(data[field])) {
      score += 2; // 2 points per required field
    }
  });

  // Optional fields
  optionalFields.forEach(field => {
    if (data[field] && hasContent(data[field])) {
      score += 1; // 1 point per optional field
    }
  });

  // Normalize to 0-1
  const maxScore = (requiredFields.length * 2) + optionalFields.length;
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
  
  if (typeof field === 'object') {
    return Object.values(field).some(v => v !== null && v !== undefined && v !== '');
  }
  
  return true;
};

/**
 * Calculate narrative coherence score
 */
const calculateCoherenceScore = (narrative) => {
  let score = 0;
  const maxScore = 8; // 8 sections

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

  // Check required sections (higher weight)
  requiredSections.forEach(section => {
    if (narrative[section] && narrative[section] !== 'Not available.') {
      score += 2;
    }
  });

  // Check optional sections
  optionalSections.forEach(section => {
    if (narrative[section] && narrative[section] !== 'Not available.') {
      score += 1;
    }
  });

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
      } else if (typeof merged[key] === 'object' && typeof summary[key] === 'object') {
        // Merge objects
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
