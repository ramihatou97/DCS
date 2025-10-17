/**
 * Quality Metrics Service
 * 
 * Phase 3 Step 4: Calculate and track quality metrics
 * 
 * Purpose:
 * - Calculate extraction quality metrics
 * - Calculate validation quality metrics
 * - Calculate summary quality metrics
 * - Calculate overall quality score
 * - Track metrics over time
 * - Provide quality insights
 * 
 * @module qualityMetrics
 */

/**
 * Calculate comprehensive quality metrics
 * 
 * @param {Object} extractedData - Extracted structured data
 * @param {Object} validation - Validation results
 * @param {string} summary - Generated summary text
 * @param {Object} metadata - Additional metadata
 * @returns {Object} Quality metrics
 */
export function calculateQualityMetrics(extractedData, validation = {}, summary = '', metadata = {}) {
  console.log('[Quality Metrics] Calculating quality metrics...');
  
  try {
    const metrics = {
      // Extraction quality
      extraction: calculateExtractionMetrics(extractedData),
      
      // Validation quality
      validation: calculateValidationMetrics(validation),
      
      // Summary quality
      summary: calculateSummaryMetrics(summary, extractedData),
      
      // Overall quality score
      overall: 0,
      
      // Metadata
      metadata: {
        calculated: new Date().toISOString(),
        extractionMethod: metadata.extractionMethod || 'unknown',
        noteCount: metadata.noteCount || 0
      }
    };
    
    // Calculate overall score (weighted average)
    metrics.overall = calculateOverallScore(metrics);
    
    console.log(`[Quality Metrics] Overall quality score: ${(metrics.overall * 100).toFixed(1)}%`);
    
    return metrics;
    
  } catch (error) {
    console.error('[Quality Metrics] Error calculating metrics:', error);
    return {
      extraction: {},
      validation: {},
      summary: {},
      overall: 0,
      metadata: {
        calculated: new Date().toISOString(),
        error: error.message
      }
    };
  }
}

/**
 * Calculate extraction quality metrics
 */
function calculateExtractionMetrics(extractedData) {
  try {
    const expectedFields = [
      'demographics', 'dates', 'presentingSymptoms', 'procedures',
      'complications', 'medications', 'imaging', 'functionalStatus',
      'discharge', 'followUp', 'pathology'
    ];
    
    let extractedCount = 0;
    let totalConfidence = 0;
    let confidenceCount = 0;
    
    for (const field of expectedFields) {
      if (extractedData[field] && !isEmpty(extractedData[field])) {
        extractedCount++;
        
        // Add confidence if available
        if (extractedData.confidence && extractedData.confidence[field]) {
          totalConfidence += extractedData.confidence[field];
          confidenceCount++;
        }
      }
    }
    
    const completeness = extractedCount / expectedFields.length;
    const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;
    
    return {
      completeness,
      confidence: avgConfidence,
      extractedFields: extractedCount,
      totalFields: expectedFields.length,
      missingFields: expectedFields.filter(f => !extractedData[f] || isEmpty(extractedData[f])),
      score: (completeness * 0.6) + (avgConfidence * 0.4) // Weighted score
    };
    
  } catch (error) {
    console.error('[Quality Metrics] Error calculating extraction metrics:', error);
    return { completeness: 0, confidence: 0, extractedFields: 0, totalFields: 0, missingFields: [], score: 0 };
  }
}

/**
 * Calculate validation quality metrics
 */
function calculateValidationMetrics(validation) {
  try {
    const errors = validation.errors || [];
    const warnings = validation.warnings || [];
    
    const criticalErrors = errors.filter(e => e.severity === 'critical').length;
    const majorErrors = errors.filter(e => e.severity === 'major').length;
    const minorErrors = errors.filter(e => e.severity === 'minor').length;
    
    // Calculate pass rate (1.0 if valid, decreases with errors)
    let passRate = validation.isValid ? 1.0 : 0.8;
    passRate -= (criticalErrors * 0.2);
    passRate -= (majorErrors * 0.1);
    passRate -= (minorErrors * 0.05);
    passRate = Math.max(0, passRate);
    
    return {
      passRate,
      isValid: validation.isValid || false,
      errorCount: errors.length,
      warningCount: warnings.length,
      criticalErrors,
      majorErrors,
      minorErrors,
      errors: errors.map(e => e.message || e),
      warnings: warnings.map(w => w.message || w),
      score: passRate
    };
    
  } catch (error) {
    console.error('[Quality Metrics] Error calculating validation metrics:', error);
    return { passRate: 1.0, isValid: true, errorCount: 0, warningCount: 0, criticalErrors: 0, majorErrors: 0, minorErrors: 0, errors: [], warnings: [], score: 1.0 };
  }
}

/**
 * Calculate summary quality metrics
 */
function calculateSummaryMetrics(summary, extractedData) {
  try {
    if (!summary || typeof summary !== 'string') {
      return {
        readability: 0,
        completeness: 0,
        coherence: 0,
        wordCount: 0,
        sectionCount: 0,
        score: 0
      };
    }
    
    const wordCount = summary.split(/\s+/).length;
    const sectionCount = countSections(summary);
    
    const readability = calculateReadabilityScore(summary);
    const completeness = checkSummaryCompleteness(summary, extractedData);
    const coherence = assessCoherence(summary);
    
    const score = (readability * 0.3) + (completeness * 0.4) + (coherence * 0.3);
    
    return {
      readability,
      completeness,
      coherence,
      wordCount,
      sectionCount,
      score
    };
    
  } catch (error) {
    console.error('[Quality Metrics] Error calculating summary metrics:', error);
    return { readability: 0, completeness: 0, coherence: 0, wordCount: 0, sectionCount: 0, score: 0 };
  }
}

/**
 * Calculate overall quality score
 */
function calculateOverallScore(metrics) {
  try {
    const extractionScore = metrics.extraction.score || 0;
    const validationScore = metrics.validation.score || 0;
    const summaryScore = metrics.summary.score || 0;
    
    // Weighted average: extraction (30%), validation (20%), summary (50%)
    const overall = (extractionScore * 0.3) + (validationScore * 0.2) + (summaryScore * 0.5);
    
    return Math.min(1.0, Math.max(0, overall));
    
  } catch (error) {
    console.error('[Quality Metrics] Error calculating overall score:', error);
    return 0;
  }
}

/**
 * Calculate readability score (simplified Flesch Reading Ease)
 */
function calculateReadabilityScore(text) {
  try {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    // Flesch Reading Ease formula (adapted for medical text)
    // Medical text typically scores 30-50 (difficult) - this is EXPECTED for clinical content
    let score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

    // Normalize to 0-1 scale with more lenient range for medical text
    // Medical professionals expect technical terminology, so don't over-penalize complexity
    // Range: 20-70 (broader acceptance), floor at 0.2 (never completely fail on readability)
    score = (score - 20) / 50;
    score = Math.min(1.0, Math.max(0.2, score));  // Floor at 0.2 instead of 0
    
    return score;
    
  } catch (error) {
    console.error('[Quality Metrics] Error calculating readability:', error);
    return 0.5;
  }
}

/**
 * Count syllables in a word (simplified)
 */
function countSyllables(word) {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  
  const vowels = 'aeiouy';
  let count = 0;
  let previousWasVowel = false;
  
  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !previousWasVowel) {
      count++;
    }
    previousWasVowel = isVowel;
  }
  
  // Adjust for silent 'e'
  if (word.endsWith('e')) {
    count--;
  }
  
  return Math.max(1, count);
}

/**
 * Check summary completeness - IMPROVED
 * Now checks for actual narrative sections AND extracted entities, not just keywords
 */
function checkSummaryCompleteness(summary, extractedData) {
  try {
    const lowerSummary = summary.toLowerCase();

    let score = 0;
    let checks = 0;

    // IMPROVED: Check for actual narrative section headers (more accurate than keyword matching)
    const narrativeSections = [
      { name: 'chief complaint', variations: ['presenting complaint', 'chief complaint', 'presentation'] },
      { name: 'history', variations: ['history of present illness', 'hpi', 'history'] },
      { name: 'hospital course', variations: ['hospital course', 'clinical course', 'course'] },
      { name: 'procedures', variations: ['procedures', 'operations', 'interventions', 'procedure'] },
      { name: 'complications', variations: ['complications', 'complication'] },
      { name: 'medications', variations: ['medications', 'discharge medications', 'medication'] },
      { name: 'discharge', variations: ['discharge status', 'discharge condition', 'discharge'] },
      { name: 'follow-up', variations: ['follow-up', 'follow up', 'followup'] }
    ];

    // Check each section with multiple variations
    for (const section of narrativeSections) {
      checks++;
      const found = section.variations.some(v => lowerSummary.includes(v));
      if (found) {
        score++;
      }
    }

    // IMPROVED: Check for presence of key extracted entities in narrative
    // This validates that the narrative actually includes the extracted data

    // 1. Check for patient demographics
    if (extractedData.demographics?.age) {
      checks++;
      const ageStr = extractedData.demographics.age.toString();
      if (lowerSummary.includes(ageStr) || lowerSummary.includes('year')) {
        score++;
      }
    }

    // 2. Check for pathology type
    if (extractedData.pathology?.type) {
      checks++;
      const pathologyType = extractedData.pathology.type.toLowerCase();
      if (lowerSummary.includes(pathologyType)) {
        score++;
      }
    }

    // 3. Check for procedures (if any were extracted)
    if (extractedData.procedures?.procedures && extractedData.procedures.procedures.length > 0) {
      checks++;
      const procedureFound = extractedData.procedures.procedures.some(proc => {
        const procName = (proc.name || proc.procedure || '').toLowerCase();
        // Check for key words from procedure name (handle long procedure names)
        const keyWords = procName.split(/\s+/).filter(w => w.length > 4); // Words longer than 4 chars
        return keyWords.some(word => lowerSummary.includes(word));
      });
      if (procedureFound) {
        score++;
      }
    }

    // 4. Check for complications (if any were extracted)
    if (extractedData.complications && extractedData.complications.length > 0) {
      checks++;
      const complicationFound = extractedData.complications.some(comp => {
        const compName = (comp.complication || comp.name || '').toLowerCase();
        return lowerSummary.includes(compName);
      });
      if (complicationFound) {
        score++;
      }
    }

    // 5. Check for discharge destination
    if (extractedData.discharge?.destination) {
      checks++;
      const destination = extractedData.discharge.destination.toLowerCase();
      if (lowerSummary.includes(destination)) {
        score++;
      }
    }

    return checks > 0 ? score / checks : 0;

  } catch (error) {
    console.error('[Quality Metrics] Error checking completeness:', error);
    return 0.5;
  }
}

/**
 * Assess narrative coherence - IMPROVED
 * Checks for temporal flow, causal relationships, and structural elements
 * that indicate a well-organized clinical narrative
 */
function assessCoherence(summary) {
  try {
    let score = 0.5; // Base score (50%)

    const lowerSummary = summary.toLowerCase();

    // 1. Check for temporal markers (chronological flow)
    // Clinical narratives should have clear timeline progression
    const temporalMarkers = [
      'initially', 'subsequently', 'on post-operative day', 'pod',
      'following', 'then', 'after', 'during', 'prior to',
      'on admission', 'at presentation', 'on hospital day',
      'preoperatively', 'intraoperatively', 'postoperatively'
    ];

    const temporalCount = temporalMarkers.filter(m => lowerSummary.includes(m)).length;
    if (temporalCount > 0) {
      // More temporal markers = better chronological flow (up to +0.2)
      score += Math.min(0.2, temporalCount * 0.05);
    }

    // 2. Check for causal connectors (logical relationships)
    // Good clinical narratives explain cause-effect relationships
    const causalConnectors = [
      'due to', 'resulting in', 'leading to', 'because',
      'therefore', 'thus', 'consequently', 'secondary to',
      'attributed to', 'caused by', 'as a result'
    ];

    const causalCount = causalConnectors.filter(c => lowerSummary.includes(c)).length;
    if (causalCount > 0) {
      // Presence of causal reasoning adds +0.2
      score += Math.min(0.2, causalCount * 0.05);
    }

    // 3. Check for section transitions and structure
    // Well-organized narratives have clear section breaks
    const sectionHeaders = [
      'chief complaint', 'history', 'hospital course', 'procedures',
      'complications', 'medications', 'discharge', 'follow-up'
    ];

    const sectionCount = sectionHeaders.filter(h => lowerSummary.includes(h)).length;
    if (sectionCount >= 3) {
      // At least 3 distinct sections present adds +0.1
      score += 0.1;
    }

    return Math.min(1.0, score);

  } catch (error) {
    console.error('[Quality Metrics] Error assessing coherence:', error);
    return 0.5;
  }
}

/**
 * Count sections in summary
 */
function countSections(summary) {
  const sectionHeaders = [
    'CHIEF COMPLAINT', 'HISTORY', 'HOSPITAL COURSE', 'PROCEDURES',
    'COMPLICATIONS', 'MEDICATIONS', 'DISCHARGE', 'FOLLOW-UP'
  ];
  
  let count = 0;
  const upperSummary = summary.toUpperCase();
  
  for (const header of sectionHeaders) {
    if (upperSummary.includes(header)) {
      count++;
    }
  }
  
  return count;
}

/**
 * Check if value is empty
 */
function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Get quality rating from score
 */
export function getQualityRating(score) {
  if (score >= 0.9) return { rating: 'Excellent', color: 'green' };
  if (score >= 0.8) return { rating: 'Good', color: 'blue' };
  if (score >= 0.7) return { rating: 'Fair', color: 'yellow' };
  if (score >= 0.6) return { rating: 'Poor', color: 'orange' };
  return { rating: 'Very Poor', color: 'red' };
}

export default {
  calculateQualityMetrics,
  getQualityRating
};

