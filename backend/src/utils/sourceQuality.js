/**
 * Source Quality Assessment
 * 
 * Assesses the quality of clinical notes to calibrate extraction confidence.
 * Higher quality sources → higher confidence in extracted data.
 * Lower quality sources → lower confidence, more validation needed.
 */

/**
 * Quality factors and their weights
 */
const QUALITY_FACTORS = {
  structure: 0.25,      // Well-structured with clear sections
  completeness: 0.25,   // Contains expected clinical elements
  formality: 0.15,      // Professional medical language
  detail: 0.20,         // Sufficient clinical detail
  consistency: 0.15     // Internally consistent information
};

/**
 * Assess the quality of clinical note text
 * 
 * @param {string} text - Clinical note text
 * @param {Object} options - Assessment options
 * @returns {Object} Quality assessment with score and factors
 */
const assessSourceQuality = (text, options = {}) => {
  const {
    includeRecommendations = true,
    detailedAnalysis = false
  } = options;
  
  const quality = {
    overallScore: 0,
    grade: 'UNKNOWN',
    factors: {},
    issues: [],
    strengths: [],
    recommendations: []
  };
  
  // Factor 1: Structure (0-1)
  quality.factors.structure = assessStructure(text);
  
  // Factor 2: Completeness (0-1)
  quality.factors.completeness = assessCompleteness(text);
  
  // Factor 3: Formality (0-1)
  quality.factors.formality = assessFormality(text);
  
  // Factor 4: Detail (0-1)
  quality.factors.detail = assessDetail(text);
  
  // Factor 5: Consistency (0-1)
  quality.factors.consistency = assessConsistency(text);
  
  // Calculate weighted overall score
  quality.overallScore = Object.entries(quality.factors).reduce((score, [factor, value]) => {
    return score + (value * QUALITY_FACTORS[factor]);
  }, 0);
  
  // Assign grade
  if (quality.overallScore >= 0.9) quality.grade = 'EXCELLENT';
  else if (quality.overallScore >= 0.75) quality.grade = 'GOOD';
  else if (quality.overallScore >= 0.6) quality.grade = 'FAIR';
  else if (quality.overallScore >= 0.4) quality.grade = 'POOR';
  else quality.grade = 'VERY_POOR';
  
  // Identify issues and strengths
  for (const [factor, score] of Object.entries(quality.factors)) {
    if (score < 0.5) {
      quality.issues.push({
        factor,
        score,
        severity: score < 0.3 ? 'HIGH' : 'MEDIUM',
        description: getFactorDescription(factor, 'issue')
      });
    } else if (score > 0.8) {
      quality.strengths.push({
        factor,
        score,
        description: getFactorDescription(factor, 'strength')
      });
    }
  }
  
  // Generate recommendations
  if (includeRecommendations) {
    quality.recommendations = generateRecommendations(quality);
  }
  
  return quality;
};

/**
 * Assess structure quality
 */
const assessStructure = (text) => {
  let score = 0.5; // Base score
  
  // Check for standard sections
  const sections = [
    /(?:HISTORY|HPI|CHIEF COMPLAINT):/i,
    /(?:PHYSICAL EXAM|EXAMINATION|NEURO EXAM):/i,
    /(?:ASSESSMENT|IMPRESSION):/i,
    /(?:PLAN|RECOMMENDATIONS):/i
  ];
  
  const foundSections = sections.filter(pattern => pattern.test(text)).length;
  score += (foundSections / sections.length) * 0.4;
  
  // Check for clear paragraph breaks
  const paragraphs = text.split(/\n\s*\n/).length;
  if (paragraphs >= 3) score += 0.1;
  
  return Math.min(1.0, score);
};

/**
 * Assess completeness
 */
const assessCompleteness = (text) => {
  let score = 0;
  const expectedElements = [
    { pattern: /\b(?:age|yo|year[- ]old)\b/i, weight: 0.1, name: 'age' },
    { pattern: /\b(?:diagnosis|diagnosed with|presents with)\b/i, weight: 0.15, name: 'diagnosis' },
    { pattern: /\b(?:BP|blood pressure|HR|heart rate|RR|respiratory rate)\b/i, weight: 0.1, name: 'vitals' },
    { pattern: /\b(?:exam|examination|physical|neuro)\b/i, weight: 0.15, name: 'exam' },
    { pattern: /\b(?:CT|MRI|imaging|scan)\b/i, weight: 0.1, name: 'imaging' },
    { pattern: /\b(?:procedure|surgery|operation|intervention)\b/i, weight: 0.1, name: 'procedure' },
    { pattern: /\b(?:medication|drug|therapy|treatment)\b/i, weight: 0.1, name: 'medications' },
    { pattern: /\b(?:follow[- ]?up|f\/u|appointment|clinic)\b/i, weight: 0.1, name: 'followup' },
    { pattern: /\b(?:discharge|disposition|plan)\b/i, weight: 0.1, name: 'discharge' }
  ];
  
  for (const element of expectedElements) {
    if (element.pattern.test(text)) {
      score += element.weight;
    }
  }
  
  return Math.min(1.0, score);
};

/**
 * Assess formality (professional medical language)
 */
const assessFormality = (text) => {
  let score = 1.0; // Start high, deduct for informal markers
  
  // Informal abbreviations (deduct points)
  const informalMarkers = [
    { pattern: /\bpt\b/gi, penalty: 0.05, name: 'pt instead of patient' },
    { pattern: /\bc\/o\b/gi, penalty: 0.03, name: 'c/o abbreviation' },
    { pattern: /\bw\//gi, penalty: 0.03, name: 'w/ abbreviation' },
    { pattern: /\bw\/o\b/gi, penalty: 0.03, name: 'w/o abbreviation' },
    { pattern: /\bs\/p\b/gi, penalty: 0.03, name: 's/p abbreviation' },
    { pattern: /\b(?:gonna|wanna|gotta)\b/gi, penalty: 0.1, name: 'colloquial language' }
  ];
  
  for (const marker of informalMarkers) {
    const matches = (text.match(marker.pattern) || []).length;
    score -= Math.min(0.3, matches * marker.penalty);
  }
  
  // Professional terminology (add points)
  const professionalMarkers = [
    /\b(?:presented with|admitted for|underwent)\b/i,
    /\b(?:examination revealed|assessment shows)\b/i,
    /\b(?:subsequently|following|during the course)\b/i
  ];
  
  const professionalCount = professionalMarkers.filter(p => p.test(text)).length;
  score += professionalCount * 0.05;
  
  return Math.max(0, Math.min(1.0, score));
};

/**
 * Assess level of detail
 */
const assessDetail = (text) => {
  let score = 0;
  
  // Word count (more detail = higher score)
  const wordCount = text.split(/\s+/).length;
  if (wordCount > 500) score += 0.3;
  else if (wordCount > 200) score += 0.2;
  else if (wordCount > 100) score += 0.1;
  
  // Specific measurements
  const measurements = [
    /\d+\s*(?:mm|cm|ml|mg|mcg|units)/gi,
    /\d+\/\d+\s*(?:mmHg)?/gi, // Blood pressure
    /\d+\s*bpm/gi, // Heart rate
    /\d+\s*%/gi // Percentages
  ];
  
  const measurementCount = measurements.reduce((count, pattern) => {
    return count + (text.match(pattern) || []).length;
  }, 0);
  
  score += Math.min(0.3, measurementCount * 0.05);
  
  // Specific dates/times
  const datePatterns = [
    /\d{1,2}\/\d{1,2}\/\d{2,4}/g,
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}/gi,
    /POD\s*#?\s*\d+/gi,
    /HD\s*#?\s*\d+/gi
  ];
  
  const dateCount = datePatterns.reduce((count, pattern) => {
    return count + (text.match(pattern) || []).length;
  }, 0);
  
  score += Math.min(0.2, dateCount * 0.05);
  
  // Clinical reasoning phrases
  const reasoningPhrases = [
    /\b(?:due to|because of|secondary to|as a result of)\b/gi,
    /\b(?:therefore|thus|consequently)\b/gi,
    /\b(?:given|in light of|considering)\b/gi
  ];
  
  const reasoningCount = reasoningPhrases.reduce((count, pattern) => {
    return count + (text.match(pattern) || []).length;
  }, 0);
  
  score += Math.min(0.2, reasoningCount * 0.05);
  
  return Math.min(1.0, score);
};

/**
 * Assess internal consistency
 */
const assessConsistency = (text) => {
  let score = 1.0; // Start high, deduct for inconsistencies
  
  // Check for contradictory statements
  const contradictions = [
    { positive: /\bimproved\b/i, negative: /\bworsened\b/i },
    { positive: /\bstable\b/i, negative: /\bdeteriorated\b/i },
    { positive: /\bno\s+(?:deficit|weakness)\b/i, negative: /\b(?:deficit|weakness)\s+noted\b/i }
  ];
  
  for (const { positive, negative } of contradictions) {
    if (positive.test(text) && negative.test(text)) {
      score -= 0.15; // Potential contradiction
    }
  }
  
  return Math.max(0, score);
};

/**
 * Get description for a quality factor
 */
const getFactorDescription = (factor, type) => {
  const descriptions = {
    structure: {
      issue: 'Note lacks clear section headers and organization',
      strength: 'Note is well-structured with clear sections'
    },
    completeness: {
      issue: 'Note is missing key clinical elements',
      strength: 'Note contains comprehensive clinical information'
    },
    formality: {
      issue: 'Note uses informal abbreviations and language',
      strength: 'Note uses professional medical terminology'
    },
    detail: {
      issue: 'Note lacks specific measurements and details',
      strength: 'Note includes specific measurements and clinical details'
    },
    consistency: {
      issue: 'Note contains potentially contradictory information',
      strength: 'Note is internally consistent'
    }
  };
  
  return descriptions[factor]?.[type] || `${factor} ${type}`;
};

/**
 * Generate recommendations based on quality assessment
 */
const generateRecommendations = (quality) => {
  const recommendations = [];
  
  if (quality.overallScore < 0.6) {
    recommendations.push({
      priority: 'HIGH',
      message: 'Source quality is below acceptable threshold. Consider requesting additional documentation or manual review.',
      action: 'MANUAL_REVIEW'
    });
  }
  
  for (const issue of quality.issues) {
    if (issue.severity === 'HIGH') {
      recommendations.push({
        priority: 'HIGH',
        message: `${issue.description}. This may affect extraction accuracy.`,
        action: 'INCREASE_VALIDATION',
        factor: issue.factor
      });
    }
  }
  
  if (quality.factors.completeness < 0.5) {
    recommendations.push({
      priority: 'MEDIUM',
      message: 'Note is missing key clinical elements. Extracted data may be incomplete.',
      action: 'REQUEST_ADDITIONAL_INFO'
    });
  }
  
  return recommendations;
};

/**
 * Calibrate extraction confidence based on source quality
 * 
 * @param {number} extractionConfidence - Original confidence (0-1)
 * @param {Object} sourceQuality - Quality assessment result
 * @returns {number} Calibrated confidence
 */
const calibrateConfidence = (extractionConfidence, sourceQuality) => {
  // Apply quality multiplier
  const qualityMultiplier = 0.5 + (sourceQuality.overallScore * 0.5);
  const calibrated = extractionConfidence * qualityMultiplier;
  
  return Math.max(0, Math.min(1.0, calibrated));
};

/**
 * Batch assess quality for multiple notes
 * 
 * @param {Array} notes - Array of note texts
 * @returns {Object} Aggregated quality assessment
 */
const assessMultipleNotes = (notes) => {
  const assessments = notes.map(note => assessSourceQuality(note));
  
  const aggregate = {
    averageScore: assessments.reduce((sum, a) => sum + a.overallScore, 0) / assessments.length,
    bestScore: Math.max(...assessments.map(a => a.overallScore)),
    worstScore: Math.min(...assessments.map(a => a.overallScore)),
    grades: assessments.map(a => a.grade),
    commonIssues: aggregateIssues(assessments),
    overallRecommendation: null
  };
  
  // Overall recommendation
  if (aggregate.averageScore >= 0.75) {
    aggregate.overallRecommendation = 'Source quality is good. Proceed with standard extraction.';
  } else if (aggregate.averageScore >= 0.6) {
    aggregate.overallRecommendation = 'Source quality is fair. Apply additional validation.';
  } else {
    aggregate.overallRecommendation = 'Source quality is poor. Manual review recommended.';
  }
  
  return aggregate;
};

/**
 * Aggregate issues across multiple assessments
 */
const aggregateIssues = (assessments) => {
  const issueCounts = {};
  
  for (const assessment of assessments) {
    for (const issue of assessment.issues) {
      issueCounts[issue.factor] = (issueCounts[issue.factor] || 0) + 1;
    }
  }
  
  return Object.entries(issueCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([factor, count]) => ({
      factor,
      frequency: count / assessments.length,
      description: getFactorDescription(factor, 'issue')
    }));
};

module.exports = {
  assessSourceQuality,
  calibrateConfidence,
  assessMultipleNotes,
  QUALITY_FACTORS
};


// Export all functions
module.exports = {
  assessSourceQuality,
  calibrateConfidence,
  assessMultipleNotes,
  QUALITY_FACTORS
};
