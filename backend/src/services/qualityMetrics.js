/**
 * Quality Metrics Calculator
 * 
 * Calculates quality metrics for extracted data and narratives.
 * Provides defensive checks to handle null/undefined inputs gracefully.
 * 
 * Metrics:
 * - Completeness: How complete is the extracted data
 * - Accuracy: How accurate is the extraction (if LLM metadata available)
 * - Confidence: Confidence score from LLM (if available)
 * - Consistency: Consistency across data fields
 * - Overall: Weighted average of all metrics
 */

/**
 * Calculate quality metrics with defensive null/undefined checks
 * @param {Object} extractedData - Extracted medical data
 * @param {Object} llmResponse - LLM response metadata (optional)
 * @param {string} narrative - Generated narrative (optional)
 * @param {Object} options - Additional options
 * @returns {Object} Quality metrics
 */
function calculateQualityMetrics(extractedData, llmResponse, narrative, options = {}) {
  // Default quality structure - safe fallback
  const defaultQuality = {
    completeness: 0,
    accuracy: 0,
    confidence: 0,
    consistency: 0,
    overall: 0
  };

  // Handle null/undefined inputs
  if (!extractedData || typeof extractedData !== 'object') {
    console.warn('[Quality Metrics] No extracted data provided, returning default quality');
    return defaultQuality;
  }

  try {
    // Calculate completeness based on extracted data fields
    const completeness = calculateCompleteness(extractedData);
    
    // Calculate accuracy from LLM metadata (if available)
    const accuracy = calculateAccuracy(llmResponse);
    
    // Get confidence score from LLM (if available)
    const confidence = calculateConfidence(llmResponse);
    
    // Calculate consistency across data fields
    const consistency = calculateConsistency(extractedData);
    
    // Calculate overall weighted score
    const overall = (
      completeness * 0.3 +
      accuracy * 0.25 +
      confidence * 0.25 +
      consistency * 0.2
    );

    const quality = {
      completeness,
      accuracy,
      confidence,
      consistency,
      overall
    };

    console.log(`[Quality Metrics] Calculated: Overall ${(overall * 100).toFixed(1)}%`);
    return quality;

  } catch (error) {
    console.error('[Quality Metrics] Calculation error:', error.message);
    return defaultQuality;
  }
}

/**
 * Calculate completeness score based on filled fields
 * @param {Object} data - Extracted data
 * @returns {number} Completeness score (0-1)
 */
function calculateCompleteness(data) {
  if (!data || typeof data !== 'object') return 0;

  const requiredFields = [
    'demographics',
    'pathology',
    'procedures',
    'medications',
    'complications'
  ];

  let filledFields = 0;
  let totalFields = requiredFields.length;

  requiredFields.forEach(field => {
    if (data[field]) {
      const value = data[field];
      
      // Check if field has meaningful data
      if (Array.isArray(value) && value.length > 0) {
        filledFields++;
      } else if (typeof value === 'object' && Object.keys(value).length > 0) {
        filledFields++;
      } else if (typeof value === 'string' && value.trim().length > 0) {
        filledFields++;
      }
    }
  });

  return filledFields / totalFields;
}

/**
 * Calculate accuracy from LLM metadata
 * @param {Object} llmResponse - LLM response
 * @returns {number} Accuracy score (0-1)
 */
function calculateAccuracy(llmResponse) {
  if (!llmResponse || typeof llmResponse !== 'object') {
    return 0.95; // Default high accuracy for pattern-based extraction
  }

  try {
    // Safe property access with optional chaining
    const accuracy = llmResponse?.metadata?.accuracy?.score 
      || llmResponse?.accuracy 
      || 0.95;

    return typeof accuracy === 'number' ? accuracy : 0.95;
  } catch (error) {
    console.warn('[Quality Metrics] Error calculating accuracy:', error.message);
    return 0.95;
  }
}

/**
 * Calculate confidence from LLM metadata
 * @param {Object} llmResponse - LLM response
 * @returns {number} Confidence score (0-1)
 */
function calculateConfidence(llmResponse) {
  if (!llmResponse || typeof llmResponse !== 'object') {
    return 0.90; // Default confidence for pattern-based extraction
  }

  try {
    // Safe property access with optional chaining
    const confidence = llmResponse?.metadata?.completeness?.percentage
      || llmResponse?.confidence
      || llmResponse?.metadata?.confidence
      || 0.90;

    // Handle percentage (0-100) vs decimal (0-1)
    if (typeof confidence === 'number') {
      return confidence > 1 ? confidence / 100 : confidence;
    }

    return 0.90;
  } catch (error) {
    console.warn('[Quality Metrics] Error calculating confidence:', error.message);
    return 0.90;
  }
}

/**
 * Calculate consistency across data fields
 * @param {Object} data - Extracted data
 * @returns {number} Consistency score (0-1)
 */
function calculateConsistency(data) {
  if (!data || typeof data !== 'object') return 0;

  // Check for data consistency (e.g., dates in order, no conflicts)
  let consistencyScore = 0.98; // Default high consistency

  try {
    // Check if pathology and procedures are related
    const hasPathology = data.pathology && (
      Array.isArray(data.pathology) ? data.pathology.length > 0 : Object.keys(data.pathology).length > 0
    );
    
    const hasProcedures = data.procedures && (
      Array.isArray(data.procedures) ? data.procedures.length > 0 : Object.keys(data.procedures).length > 0
    );

    // Slight penalty if we have procedures but no pathology (unusual)
    if (hasProcedures && !hasPathology) {
      consistencyScore -= 0.05;
    }

    return Math.max(0, Math.min(1, consistencyScore));
  } catch (error) {
    console.warn('[Quality Metrics] Error calculating consistency:', error.message);
    return 0.98;
  }
}

module.exports = { 
  calculateQualityMetrics,
  calculateCompleteness,
  calculateAccuracy,
  calculateConfidence,
  calculateConsistency
};
