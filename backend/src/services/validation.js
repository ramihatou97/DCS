/**
 * Data Validation Service
 *
 * Validates extracted data against source text with strict no-extrapolation guard.
 * This is a CRITICAL safety mechanism to prevent AI hallucination and ensure all
 * extracted data is directly sourced from clinical notes.
 *
 * Features:
 * - No-extrapolation validation (verifies data exists in source)
 * - Confidence score calculation
 * - Logical relationship validation (dates, procedures, etc.)
 * - Medical terminology validation
 * - Flag suspicious extractions for review
 *
 * @module validation
 */

// ========================================
// TYPE DEFINITIONS
// ========================================

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
 * @property {number} confidence - Overall confidence score (0-100)
 */

/**
 * @typedef {Object} ValidationOptions
 * @property {boolean} [strictMode=true] - Use strict validation
 * @property {number} [minConfidence] - Minimum confidence threshold
 * @property {boolean} [allowAbbreviations=true] - Allow medical abbreviations
 * @property {boolean} [checkCompleteness=true] - Check data completeness
 * @property {boolean} [checkConsistency=true] - Check logical consistency
 */

// ========================================
// IMPORTS
// ========================================

const { CONFIDENCE, EXTRACTION_TARGETS } = require('../config/constants.js');
const { parseFlexibleDate, compareDates, isValidDate } = require('../utils/dateUtils.js');
const { normalizeText, cleanText, calculateSimilarity } = require('../utils/textUtils.js');
const { MEDICAL_ABBREVIATIONS, expandAbbreviation } = require('../utils/medicalAbbreviations.js');

// ========================================
// MAIN FUNCTIONS
// ========================================

/**
 * Validate extracted data against source text
 *
 * Performs comprehensive validation including no-extrapolation checks,
 * confidence scoring, and logical relationship validation.
 *
 * @param {Object} extractedData - Data extracted by extraction service
 * @param {string|string[]} sourceNotes - Original clinical notes
 * @param {ValidationOptions} [options={}] - Validation options
 * @returns {ValidationResult} Validation result with flags and confidence scores
 *
 * @example
 * const validation = validateExtraction(extractedData, sourceNotes, {
 *   strictMode: true,
 *   minConfidence: 0.7
 * });
 */
const validateExtraction = (extractedData, sourceNotes, options = {}) => {
  const {
    strictMode = true,
    minConfidence = CONFIDENCE.MEDIUM,
    allowAbbreviations = true
  } = options;

  // Normalize source text
  const sourceText = Array.isArray(sourceNotes) 
    ? sourceNotes.join('\n\n') 
    : sourceNotes;

  const validationResult = {
    isValid: true,
    overallConfidence: 1.0,
    warnings: [],
    errors: [],
    flags: [],
    validatedData: {},
    invalidFields: []
  };

  // Validate each field in extracted data
  for (const [category, data] of Object.entries(extractedData)) {
    if (!data || typeof data !== 'object') continue;

    const categoryValidation = validateCategory(
      category, 
      data, 
      sourceText, 
      { strictMode, allowAbbreviations }
    );

    validationResult.validatedData[category] = categoryValidation.data;
    validationResult.warnings.push(...categoryValidation.warnings);
    validationResult.errors.push(...categoryValidation.errors);
    validationResult.flags.push(...categoryValidation.flags);

    if (categoryValidation.confidence < minConfidence) {
      validationResult.invalidFields.push({
        field: category,
        confidence: categoryValidation.confidence,
        reason: 'Below minimum confidence threshold'
      });
    }

    // Update overall confidence (weighted average)
    validationResult.overallConfidence *= categoryValidation.confidence;
  }

  // Logical relationship validation
  const logicalValidation = validateLogicalRelationships(validationResult.validatedData);
  validationResult.warnings.push(...logicalValidation.warnings);
  validationResult.errors.push(...logicalValidation.errors);

  // Final validity check
  validationResult.isValid = 
    validationResult.errors.length === 0 &&
    validationResult.overallConfidence >= minConfidence;

  return validationResult;
};

/**
 * Validate a category of data (demographics, dates, etc.)
 */
const validateCategory = (category, data, sourceText, options) => {
  const result = {
    data: { ...data },
    confidence: 1.0,
    warnings: [],
    errors: [],
    flags: []
  };

  switch (category) {
    case 'demographics':
      return validateDemographics(data, sourceText, options);
    case 'dates':
      return validateDates(data, sourceText, options);
    case 'pathology':
      return validatePathology(data, sourceText, options);
    case 'presentingSymptoms':
      return validateSymptoms(data, sourceText, options);
    case 'procedures':
      return validateProcedures(data, sourceText, options);
    case 'complications':
      return validateComplications(data, sourceText, options);
    case 'anticoagulation':
      return validateAnticoagulation(data, sourceText, options);
    case 'imaging':
      return validateImaging(data, sourceText, options);
    case 'functionalScores':
      return validateFunctionalScores(data, sourceText, options);
    case 'medications':
      return validateMedications(data, sourceText, options);
    case 'followUp':
      return validateFollowUp(data, sourceText, options);
    case 'dischargeDestination':
      return validateDischargeDestination(data, sourceText, options);
    case 'oncology':
      return validateOncology(data, sourceText, options);
    default:
      return result;
  }
};

/**
 * Validate demographics data
 */
const validateDemographics = (data, sourceText, options) => {
  const result = {
    data: { ...data },
    confidence: 1.0,
    warnings: [],
    errors: [],
    flags: []
  };

  // Validate age
  if (data.age !== null && data.age !== undefined) {
    if (!verifyInSource(data.age.toString(), sourceText, options)) {
      result.flags.push({
        field: 'demographics.age',
        value: data.age,
        reason: 'Age not found in source text',
        severity: 'high'
      });
      result.confidence *= 0.5;
    }

    // Age range validation
    if (data.age < 0 || data.age > 120) {
      result.errors.push({
        field: 'demographics.age',
        value: data.age,
        reason: 'Age outside valid range (0-120)'
      });
      result.data.age = null;
      result.confidence *= 0.3;
    }
  }

  // Validate gender
  if (data.gender) {
    if (!verifyGenderInSource(data.gender, sourceText)) {
      result.warnings.push({
        field: 'demographics.gender',
        value: data.gender,
        reason: 'Gender inference may be inaccurate'
      });
      result.confidence *= 0.8;
    }
  }

  return result;
};

/**
 * Validate dates (CRITICAL for timeline)
 */
const validateDates = (data, sourceText, options) => {
  const result = {
    data: { ...data },
    confidence: 1.0,
    warnings: [],
    errors: [],
    flags: []
  };

  // Validate ictus date
  if (data.ictusDate) {
    if (!isValidDate(data.ictusDate)) {
      result.errors.push({
        field: 'dates.ictusDate',
        value: data.ictusDate,
        reason: 'Invalid date format'
      });
      result.data.ictusDate = null;
      result.confidence *= 0.3;
    } else if (!verifyDateInSource(data.ictusDate, sourceText, options)) {
      result.flags.push({
        field: 'dates.ictusDate',
        value: data.ictusDate,
        reason: 'Ictus date not explicitly stated in source',
        severity: 'critical'
      });
      result.confidence *= 0.6;
    }
  }

  // Validate admission date
  if (data.admissionDate) {
    if (!isValidDate(data.admissionDate)) {
      result.errors.push({
        field: 'dates.admissionDate',
        value: data.admissionDate,
        reason: 'Invalid date format'
      });
      result.data.admissionDate = null;
      result.confidence *= 0.3;
    }
  }

  // Validate surgery dates
  if (data.surgeryDates && data.surgeryDates.length > 0) {
    const validSurgeryDates = [];
    data.surgeryDates.forEach((date, index) => {
      if (isValidDate(date)) {
        validSurgeryDates.push(date);
      } else {
        result.warnings.push({
          field: `dates.surgeryDates[${index}]`,
          value: date,
          reason: 'Invalid surgery date removed'
        });
      }
    });
    result.data.surgeryDates = validSurgeryDates;
  }

  // Validate discharge date
  if (data.dischargeDate) {
    if (!isValidDate(data.dischargeDate)) {
      result.errors.push({
        field: 'dates.dischargeDate',
        value: data.dischargeDate,
        reason: 'Invalid date format'
      });
      result.data.dischargeDate = null;
      result.confidence *= 0.3;
    }
  }

  return result;
};

/**
 * Validate pathology data
 */
const validatePathology = (data, sourceText, options) => {
  const result = {
    data: { ...data },
    confidence: 1.0,
    warnings: [],
    errors: [],
    flags: []
  };

  // Validate primary diagnosis
  if (data.primaryDiagnosis) {
    if (!verifyInSource(data.primaryDiagnosis, sourceText, options)) {
      result.flags.push({
        field: 'pathology.primaryDiagnosis',
        value: data.primaryDiagnosis,
        reason: 'Diagnosis not explicitly stated in source',
        severity: 'high'
      });
      result.confidence *= 0.7;
    }
  }

  // Validate grades
  if (data.grades && Object.keys(data.grades).length > 0) {
    for (const [gradeType, gradeValue] of Object.entries(data.grades)) {
      if (!verifyInSource(gradeValue, sourceText, options)) {
        result.warnings.push({
          field: `pathology.grades.${gradeType}`,
          value: gradeValue,
          reason: 'Grade not found in source text'
        });
        result.confidence *= 0.9;
      }
    }
  }

  // Validate location
  if (data.location) {
    if (!verifyInSource(data.location, sourceText, options)) {
      result.warnings.push({
        field: 'pathology.location',
        value: data.location,
        reason: 'Location not explicitly stated'
      });
      result.confidence *= 0.85;
    }
  }

  return result;
};

/**
 * Validate symptoms
 */
const validateSymptoms = (data, sourceText, options) => {
  const result = {
    data: { ...data },
    confidence: 1.0,
    warnings: [],
    errors: [],
    flags: []
  };

  if (data.symptoms && data.symptoms.length > 0) {
    const validSymptoms = [];
    
    data.symptoms.forEach(symptom => {
      if (verifyInSource(symptom, sourceText, options)) {
        validSymptoms.push(symptom);
      } else {
        result.flags.push({
          field: 'presentingSymptoms.symptoms',
          value: symptom,
          reason: 'Symptom not found in source text',
          severity: 'medium'
        });
        result.confidence *= 0.95;
      }
    });

    result.data.symptoms = validSymptoms;
  }

  return result;
};

/**
 * Validate procedures
 */
const validateProcedures = (data, sourceText, options) => {
  const result = {
    data: { ...data },
    confidence: 1.0,
    warnings: [],
    errors: [],
    flags: []
  };

  if (data.procedures && data.procedures.length > 0) {
    const validProcedures = [];

    data.procedures.forEach(procedure => {
      if (verifyInSource(procedure.name, sourceText, options)) {
        validProcedures.push(procedure);
      } else {
        result.flags.push({
          field: 'procedures',
          value: procedure.name,
          reason: 'Procedure not documented in source',
          severity: 'high'
        });
        result.confidence *= 0.8;
      }
    });

    result.data.procedures = validProcedures;
  }

  return result;
};

/**
 * Validate complications
 */
const validateComplications = (data, sourceText, options) => {
  const result = {
    data: { ...data },
    confidence: 1.0,
    warnings: [],
    errors: [],
    flags: []
  };

  if (data.complications && data.complications.length > 0) {
    const validComplications = [];

    data.complications.forEach(complication => {
      if (verifyInSource(complication, sourceText, options)) {
        validComplications.push(complication);
      } else {
        result.flags.push({
          field: 'complications',
          value: complication,
          reason: 'Complication not documented in source',
          severity: 'critical'
        });
        result.confidence *= 0.7;
      }
    });

    result.data.complications = validComplications;
  }

  return result;
};

/**
 * Validate anticoagulation data (CRITICAL for hemorrhagic pathologies)
 */
const validateAnticoagulation = (data, sourceText, options) => {
  const result = {
    data: { ...data },
    confidence: 1.0,
    warnings: [],
    errors: [],
    flags: []
  };

  if (data.current && data.current.length > 0) {
    data.current.forEach(med => {
      if (!verifyInSource(med.name, sourceText, options)) {
        result.flags.push({
          field: 'anticoagulation.current',
          value: med.name,
          reason: 'Anticoagulant not documented in source',
          severity: 'critical'
        });
        result.confidence *= 0.6;
      }
    });
  }

  return result;
};

/**
 * Validate imaging findings
 */
const validateImaging = (data, sourceText, options) => {
  const result = {
    data: { ...data },
    confidence: 1.0,
    warnings: [],
    errors: [],
    flags: []
  };

  if (data.findings && data.findings.length > 0) {
    const validFindings = [];

    data.findings.forEach(finding => {
      const similarity = calculateTextSimilarity(finding, sourceText);
      if (similarity > 0.3) {
        validFindings.push(finding);
      } else {
        result.flags.push({
          field: 'imaging.findings',
          value: finding,
          reason: 'Imaging finding not found in source',
          severity: 'medium'
        });
        result.confidence *= 0.9;
      }
    });

    result.data.findings = validFindings;
  }

  return result;
};

/**
 * Validate functional scores (KPS, ECOG, mRS)
 * NOTE: This is the ONLY exception to no-extrapolation rule
 */
const validateFunctionalScores = (data, sourceText, options) => {
  const result = {
    data: { ...data },
    confidence: 1.0,
    warnings: [],
    errors: [],
    flags: []
  };

  // KPS: 0-100, increments of 10
  if (data.kps !== null && data.kps !== undefined) {
    if (data.kps < 0 || data.kps > 100) {
      result.errors.push({
        field: 'functionalScores.kps',
        value: data.kps,
        reason: 'KPS must be between 0-100'
      });
      result.data.kps = null;
    } else if (data.kps % 10 !== 0) {
      result.warnings.push({
        field: 'functionalScores.kps',
        value: data.kps,
        reason: 'KPS typically in increments of 10'
      });
    }
  }

  // ECOG: 0-5
  if (data.ecog !== null && data.ecog !== undefined) {
    if (data.ecog < 0 || data.ecog > 5) {
      result.errors.push({
        field: 'functionalScores.ecog',
        value: data.ecog,
        reason: 'ECOG must be between 0-5'
      });
      result.data.ecog = null;
    }
  }

  // mRS: 0-6
  if (data.mRS !== null && data.mRS !== undefined) {
    if (data.mRS < 0 || data.mRS > 6) {
      result.errors.push({
        field: 'functionalScores.mRS',
        value: data.mRS,
        reason: 'mRS must be between 0-6'
      });
      result.data.mRS = null;
    }
  }

  return result;
};

/**
 * Validate medications
 */
const validateMedications = (data, sourceText, options) => {
  const result = {
    data: { ...data },
    confidence: 1.0,
    warnings: [],
    errors: [],
    flags: []
  };

  if (data.medications && data.medications.length > 0) {
    const validMedications = [];

    data.medications.forEach(med => {
      if (verifyInSource(med.name, sourceText, options)) {
        validMedications.push(med);
      } else {
        result.flags.push({
          field: 'medications',
          value: med.name,
          reason: 'Medication not documented in source',
          severity: 'medium'
        });
        result.confidence *= 0.9;
      }
    });

    result.data.medications = validMedications;
  }

  return result;
};

/**
 * Validate follow-up data
 */
const validateFollowUp = (data, sourceText, options) => {
  const result = {
    data: { ...data },
    confidence: 1.0,
    warnings: [],
    errors: [],
    flags: []
  };

  // Follow-up appointments
  if (data.appointments && data.appointments.length > 0) {
    data.appointments.forEach(appointment => {
      if (!verifyInSource(appointment, sourceText, options)) {
        result.warnings.push({
          field: 'followUp.appointments',
          value: appointment,
          reason: 'Follow-up not explicitly stated'
        });
        result.confidence *= 0.95;
      }
    });
  }

  return result;
};

/**
 * Validate discharge destination
 */
const validateDischargeDestination = (data, sourceText, options) => {
  const result = {
    data: { ...data },
    confidence: 1.0,
    warnings: [],
    errors: [],
    flags: []
  };

  if (data.destination && !verifyInSource(data.destination, sourceText, options)) {
    result.flags.push({
      field: 'dischargeDestination',
      value: data.destination,
      reason: 'Discharge destination not explicitly stated',
      severity: 'high'
    });
    result.confidence *= 0.8;
  }

  return result;
};

/**
 * Validate oncology data
 */
const validateOncology = (data, sourceText, options) => {
  const result = {
    data: { ...data },
    confidence: 1.0,
    warnings: [],
    errors: [],
    flags: []
  };

  if (data.histology && !verifyInSource(data.histology, sourceText, options)) {
    result.flags.push({
      field: 'oncology.histology',
      value: data.histology,
      reason: 'Histology not documented in source',
      severity: 'high'
    });
    result.confidence *= 0.7;
  }

  return result;
};

/**
 * Validate logical relationships between data points
 */
const validateLogicalRelationships = (data) => {
  const warnings = [];
  const errors = [];

  // Validate date sequence
  if (data.dates) {
    const { ictusDate, admissionDate, surgeryDates, dischargeDate } = data.dates;

    // Ictus should be before or equal to admission
    if (ictusDate && admissionDate) {
      if (compareDates(ictusDate, admissionDate) > 0) {
        warnings.push({
          field: 'dates',
          reason: 'Ictus date is after admission date (unusual)',
          severity: 'medium'
        });
      }
    }

    // Surgery dates should be after admission
    if (admissionDate && surgeryDates && surgeryDates.length > 0) {
      surgeryDates.forEach(surgeryDate => {
        if (compareDates(surgeryDate, admissionDate) < 0) {
          errors.push({
            field: 'dates.surgeryDates',
            value: surgeryDate,
            reason: 'Surgery date before admission date'
          });
        }
      });
    }

    // Discharge should be after admission
    if (admissionDate && dischargeDate) {
      if (compareDates(dischargeDate, admissionDate) < 0) {
        errors.push({
          field: 'dates.dischargeDate',
          reason: 'Discharge date before admission date'
        });
      }
    }
  }

  // Validate anticoagulation consistency
  if (data.anticoagulation && data.pathology) {
    // Defensive programming: Ensure primaryDiagnosis is a string
    const primaryDiagnosis = typeof data.pathology === 'string'
      ? data.pathology
      : data.pathology.primaryDiagnosis || '';

    const hasHemorrhage = ['SAH', 'TBI/cSDH', 'ICH'].includes(primaryDiagnosis);
    const onAnticoagulation = data.anticoagulation.current && data.anticoagulation.current.length > 0;

    if (hasHemorrhage && onAnticoagulation) {
      warnings.push({
        field: 'anticoagulation',
        reason: 'Patient on anticoagulation with hemorrhagic pathology - verify reversal documented',
        severity: 'critical'
      });
    }
  }

  return { warnings, errors };
};

/**
 * Verify text exists in source (no-extrapolation guard)
 */
const verifyInSource = (text, sourceText, options) => {
  if (!text || !sourceText) return false;

  const normalizedText = normalizeText(text.toString());
  const normalizedSource = normalizeText(sourceText);

  // Direct match
  if (normalizedSource.includes(normalizedText)) {
    return true;
  }

  // Check with abbreviation expansion
  if (options.allowAbbreviations) {
    const expanded = expandAbbreviation(normalizedText);
    if (expanded !== normalizedText && normalizedSource.includes(expanded)) {
      return true;
    }
  }

  // Fuzzy match for minor variations
  const similarity = calculateTextSimilarity(normalizedText, normalizedSource);
  return similarity > 0.8;
};

/**
 * Verify gender is implied in source
 */
const verifyGenderInSource = (gender, sourceText) => {
  const normalizedSource = normalizeText(sourceText);
  
  if (gender === 'M') {
    return /\b(male|man|gentleman|he|his|him)\b/i.test(normalizedSource);
  } else if (gender === 'F') {
    return /\b(female|woman|lady|she|her|hers)\b/i.test(normalizedSource);
  }
  
  return false;
};

/**
 * Verify date exists in source
 */
const verifyDateInSource = (date, sourceText, options) => {
  if (!date || !sourceText) return false;

  // Try multiple date formats
  const dateFormats = [
    date, // Original format
    new Date(date).toLocaleDateString('en-US'),
    new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    new Date(date).toISOString().split('T')[0]
  ];

  for (const format of dateFormats) {
    if (verifyInSource(format, sourceText, options)) {
      return true;
    }
  }

  return false;
};

/**
 * Calculate text similarity (0-1)
 */
const calculateTextSimilarity = (text1, text2) => {
  const normalized1 = normalizeText(text1);
  const normalized2 = normalizeText(text2);

  // Simple word overlap similarity
  const words1 = new Set(normalized1.split(/\s+/));
  const words2 = new Set(normalized2.split(/\s+/));

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
};

/**
 * Get validation summary for display
 *
 * Converts detailed validation result into a summary format suitable
 * for UI display and decision making.
 *
 * @param {ValidationResult} validationResult - Detailed validation result
 * @returns {ValidationSummary} Validation summary with counts and recommendations
 */
const getValidationSummary = (validationResult) => {
  return {
    isValid: validationResult.isValid,
    confidence: Math.round(validationResult.overallConfidence * 100),
    errorCount: validationResult.errors.length,
    warningCount: validationResult.warnings.length,
    flagCount: validationResult.flags.length,
    errors: validationResult.errors,
    warnings: validationResult.warnings,
    flags: validationResult.flags,
    criticalFlags: validationResult.flags.filter(f => f.severity === 'critical'),
    recommendations: generateRecommendations(validationResult)
  };
};

/**
 * Generate validation recommendations
 */
const generateRecommendations = (validationResult) => {
  const recommendations = [];

  // Critical flags
  const criticalFlags = validationResult.flags.filter(f => f.severity === 'critical');
  if (criticalFlags.length > 0) {
    recommendations.push({
      priority: 'critical',
      message: `${criticalFlags.length} critical fields require manual review`,
      action: 'Review flagged fields before proceeding'
    });
  }

  // Low confidence
  if (validationResult.overallConfidence < CONFIDENCE.MEDIUM) {
    recommendations.push({
      priority: 'high',
      message: 'Overall confidence is low',
      action: 'Consider adding more detailed notes or correcting extracted data'
    });
  }

  // Many warnings
  if (validationResult.warnings.length > 5) {
    recommendations.push({
      priority: 'medium',
      message: `${validationResult.warnings.length} warnings detected`,
      action: 'Review warnings to improve data quality'
    });
  }

  return recommendations;
};

module.exports = {
  validateExtraction,
  getValidationSummary,
  verifyInSource
};
