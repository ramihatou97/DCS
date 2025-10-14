/**
 * Validation Utilities
 * 
 * For validating extracted data and ensuring data integrity
 */

/**
 * Validate age (reasonable range for medical context)
 */
export const validateAge = (age) => {
  if (age === null || age === undefined) return { valid: false, reason: 'Missing age' };
  
  const ageNum = parseInt(age);
  
  if (isNaN(ageNum)) return { valid: false, reason: 'Age must be a number' };
  if (ageNum < 0) return { valid: false, reason: 'Age cannot be negative' };
  if (ageNum > 120) return { valid: false, reason: 'Age exceeds reasonable range' };
  
  return { valid: true };
};

/**
 * Validate sex
 */
export const validateSex = (sex) => {
  if (!sex) return { valid: false, reason: 'Missing sex' };
  
  const normalized = sex.toUpperCase();
  const validValues = ['M', 'F', 'MALE', 'FEMALE', 'OTHER', 'UNKNOWN'];
  
  if (!validValues.includes(normalized)) {
    return { valid: false, reason: 'Invalid sex value' };
  }
  
  return { valid: true };
};

/**
 * Validate date
 */
export const validateDate = (date) => {
  if (!date) return { valid: false, reason: 'Missing date' };
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return { valid: false, reason: 'Invalid date format' };
  }
  
  // Check if date is not in future (for admission/surgery dates)
  if (dateObj > new Date()) {
    return { valid: false, reason: 'Date cannot be in the future' };
  }
  
  // Check if date is not too far in past (reasonable medical record)
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
  
  if (dateObj < tenYearsAgo) {
    return { valid: false, reason: 'Date is unusually old (>10 years)', warning: true };
  }
  
  return { valid: true };
};

/**
 * Validate confidence score
 */
export const validateConfidence = (confidence) => {
  if (confidence === null || confidence === undefined) {
    return { valid: false, reason: 'Missing confidence score' };
  }
  
  const conf = parseFloat(confidence);
  
  if (isNaN(conf)) return { valid: false, reason: 'Confidence must be a number' };
  if (conf < 0 || conf > 1) return { valid: false, reason: 'Confidence must be between 0 and 1' };
  
  return { valid: true };
};

/**
 * Validate extracted data completeness
 */
export const validateExtractedData = (data) => {
  const errors = [];
  const warnings = [];
  
  // Required fields
  const requiredFields = ['demographics', 'presentation', 'management'];
  
  for (const field of requiredFields) {
    if (!data[field] || Object.keys(data[field]).length === 0) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Validate demographics if present
  if (data.demographics) {
    const ageValidation = validateAge(data.demographics.age);
    if (!ageValidation.valid) {
      errors.push(`Demographics: ${ageValidation.reason}`);
    }
    
    const sexValidation = validateSex(data.demographics.sex);
    if (!sexValidation.valid) {
      errors.push(`Demographics: ${sexValidation.reason}`);
    }
  }
  
  // Check for low confidence extractions
  if (data.metadata && data.metadata.confidence) {
    const lowConfidenceThreshold = 0.7;
    
    for (const [field, confidence] of Object.entries(data.metadata.confidence.byCategory || {})) {
      if (confidence < lowConfidenceThreshold && confidence > 0) {
        warnings.push(`Low confidence for ${field}: ${(confidence * 100).toFixed(0)}%`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    completeness: calculateCompleteness(data)
  };
};

/**
 * Calculate data completeness percentage
 */
export const calculateCompleteness = (data) => {
  const expectedFields = [
    'demographics',
    'anticoagulation',
    'medicalHistory',
    'presentation',
    'diagnosticWorkup',
    'management',
    'clinicalEvolution',
    'consultations',
    'complications',
    'neurologicalExams',
    'dischargeStatus',
    'followUp'
  ];
  
  let completed = 0;
  
  for (const field of expectedFields) {
    if (data[field] && (
      (typeof data[field] === 'object' && Object.keys(data[field]).length > 0) ||
      (typeof data[field] === 'string' && data[field].trim() !== '') ||
      (Array.isArray(data[field]) && data[field].length > 0)
    )) {
      completed++;
    }
  }
  
  return (completed / expectedFields.length) * 100;
};

/**
 * Validate no extrapolation (check for recommendation language)
 */
export const validateNoExtrapolation = (text) => {
  if (!text) return { valid: true };
  
  // Patterns that indicate recommendations or extrapolation
  const recommendationPatterns = [
    /\b(?:should|recommend|advise|suggest|consider|would|could|may|might)\b/gi,
    /\b(?:plan to|intend to|will)\b/gi,
    /\b(?:follow up|follow-up)\s+(?:with|in)\b/gi, // Only if not quoting existing plan
    /\b(?:patient needs|requires)\b/gi,
    /\bif\b.*\bthen\b/gi // Conditional recommendations
  ];
  
  const found = [];
  
  for (const pattern of recommendationPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      found.push(...matches);
    }
  }
  
  if (found.length > 0) {
    return {
      valid: false,
      reason: 'Potential extrapolation/recommendation detected',
      matches: [...new Set(found)] // Unique matches
    };
  }
  
  return { valid: true };
};

/**
 * Validate text against source (ensure extraction is grounded in source text)
 */
export const validateAgainstSource = (extracted, sourceText, threshold = 0.5) => {
  if (!extracted || !sourceText) {
    return { valid: false, reason: 'Missing extracted text or source' };
  }
  
  // Check if key terms from extraction appear in source
  const extractedWords = extracted.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const sourceWords = new Set(sourceText.toLowerCase().split(/\s+/));
  
  let foundCount = 0;
  for (const word of extractedWords) {
    if (sourceWords.has(word)) {
      foundCount++;
    }
  }
  
  const matchRatio = foundCount / extractedWords.length;
  
  if (matchRatio < threshold) {
    return {
      valid: false,
      reason: `Only ${(matchRatio * 100).toFixed(0)}% of extracted text found in source`,
      matchRatio
    };
  }
  
  return { valid: true, matchRatio };
};

/**
 * Validate medical terminology consistency
 */
export const validateMedicalTerms = (text) => {
  const warnings = [];
  
  // Check for mixed abbreviation usage
  const commonPairs = [
    ['SAH', 'subarachnoid hemorrhage'],
    ['EVD', 'external ventricular drain'],
    ['GCS', 'Glasgow Coma Scale'],
    ['CT', 'computed tomography'],
    ['MRI', 'magnetic resonance imaging']
  ];
  
  for (const [abbrev, full] of commonPairs) {
    const hasAbbrev = new RegExp(`\\b${abbrev}\\b`, 'i').test(text);
    const hasFull = new RegExp(full, 'i').test(text);
    
    if (hasAbbrev && hasFull) {
      warnings.push(`Mixed usage of "${abbrev}" and "${full}" - consider consistency`);
    }
  }
  
  return {
    consistent: warnings.length === 0,
    warnings
  };
};

/**
 * Validate pathology-specific requirements
 */
export const validatePathologyRequirements = (pathology, data) => {
  const requirements = {
    SAH: ['ictusDate', 'gradingScale', 'intervention'],
    TUMORS: ['resectionExtent', 'pathology', 'dexamethasone'],
    HYDROCEPHALUS: ['shuntType', 'valveType'],
    TBI_CSDH: ['gcs', 'hemorrhageType'],
    CSF_LEAK: ['beta2Transferrin', 'endocrineWorkup'],
    SPINE: ['motorExams', 'levels'],
    SEIZURES: ['seizureType', 'aed'],
    METASTASES: ['primaryCancer', 'numberOfMets']
  };
  
  const required = requirements[pathology];
  if (!required) return { valid: true };
  
  const missing = [];
  
  for (const field of required) {
    if (!data[field] || (typeof data[field] === 'object' && Object.keys(data[field]).length === 0)) {
      missing.push(field);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
    pathology
  };
};

/**
 * Sanitize input (prevent injection attacks)
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};
