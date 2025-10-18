/**
 * Quality Metrics Service - 6-Dimension Quality System
 *
 * Phase 3 Enhancement: Comprehensive quality assessment using 6 dimensions
 *
 * Purpose:
 * - Calculate 6-dimension quality scores
 * - Provide detailed diagnostic information
 * - Track quality metrics over time
 * - Identify areas for improvement
 *
 * Dimensions:
 * 1. Completeness (30%) - All sections and fields present
 * 2. Accuracy (25%) - Data validated against source
 * 3. Consistency (20%) - Internal coherence and alignment
 * 4. Narrative Quality (15%) - Flow, terminology, clarity
 * 5. Specificity (5%) - Precise vs vague language
 * 6. Timeliness (5%) - Processing speed and freshness
 *
 * @module qualityMetrics
 */

// Import 6-dimension scorers
import { calculateCompletenessScore } from './quality/completenessScorer.js';
import { calculateAccuracyScore } from './quality/accuracyScorer.js';
import { calculateConsistencyScore } from './quality/consistencyScorer.js';
import { calculateNarrativeQualityScore } from './quality/narrativeQualityScorer.js';
import { calculateSpecificityScore } from './quality/specificityScorer.js';
import { calculateTimelinessScore } from './quality/timelinessScorer.js';

// Feature flag for 6-dimension quality system
const USE_6_DIMENSION_QUALITY = true; // Can be controlled via environment

/**
 * Calculate comprehensive quality metrics using 6-dimension system
 *
 * @param {Object} extractedData - Extracted structured data
 * @param {Object} narrative - Generated narrative sections
 * @param {string} sourceNotes - Original clinical notes
 * @param {Object} metrics - Performance metrics
 * @param {Object} options - Configuration options
 * @returns {Object} Quality metrics with 6 dimensions
 */
export function calculateQualityMetrics(extractedData, narrative, sourceNotes, metrics = {}, options = {}) {
  console.log('[Quality Metrics] Calculating 6-dimension quality metrics...');

  // Use legacy system if flag is disabled
  if (!USE_6_DIMENSION_QUALITY) {
    return calculateLegacyMetrics(extractedData, {}, narrative, metrics);
  }

  try {
    const startTime = Date.now();

    // Calculate each dimension
    const dimensions = {
      completeness: calculateCompletenessScore(narrative, extractedData, {
        pathologyType: extractedData.pathology?.type,
        strictMode: options.strictMode
      }),

      accuracy: calculateAccuracyScore(extractedData, sourceNotes, narrative, {
        strictValidation: options.strictValidation,
        checkHallucinations: options.checkHallucinations !== false
      }),

      consistency: calculateConsistencyScore(extractedData, narrative, {
        strictDateValidation: options.strictDateValidation,
        checkCrossReferences: options.checkCrossReferences !== false
      }),

      narrativeQuality: calculateNarrativeQualityScore(narrative, extractedData, {
        checkReadability: options.checkReadability !== false,
        checkProfessionalism: options.checkProfessionalism !== false
      }),

      specificity: calculateSpecificityScore(narrative, extractedData, {
        requirePreciseValues: options.requirePreciseValues
      }),

      timeliness: calculateTimelinessScore(metrics, extractedData, {
        targetProcessingTime: options.targetProcessingTime || 3000,
        maxAcceptableTime: options.maxAcceptableTime || 10000,
        checkDataFreshness: options.checkDataFreshness !== false
      })
    };

    // Calculate overall score (weighted average)
    const overallScore =
      dimensions.completeness.weighted +
      dimensions.accuracy.weighted +
      dimensions.consistency.weighted +
      dimensions.narrativeQuality.weighted +
      dimensions.specificity.weighted +
      dimensions.timeliness.weighted;

    // Collect all issues across dimensions
    const allIssues = [
      ...dimensions.completeness.issues,
      ...dimensions.accuracy.issues,
      ...dimensions.consistency.issues,
      ...dimensions.narrativeQuality.issues,
      ...dimensions.specificity.issues,
      ...dimensions.timeliness.issues
    ];

    // Sort issues by severity and impact
    allIssues.sort((a, b) => {
      const severityOrder = { critical: 0, major: 1, minor: 2, warning: 3 };
      const severityDiff = (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3);
      if (severityDiff !== 0) return severityDiff;
      return (b.impact || 0) - (a.impact || 0);
    });

    // Get top recommendations
    const recommendations = generateRecommendations(dimensions, allIssues);

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    const result = {
      overall: {
        score: overallScore,
        percentage: Math.round(overallScore * 100),
        rating: getQualityRating(overallScore),
        confidence: calculateConfidence(dimensions)
      },

      dimensions,

      summary: {
        totalIssues: allIssues.length,
        criticalIssues: allIssues.filter(i => i.severity === 'critical').length,
        majorIssues: allIssues.filter(i => i.severity === 'major').length,
        minorIssues: allIssues.filter(i => i.severity === 'minor').length,
        warnings: allIssues.filter(i => i.severity === 'warning').length
      },

      issues: allIssues.slice(0, 10), // Top 10 issues
      recommendations,

      metadata: {
        calculated: new Date().toISOString(),
        processingTime,
        extractionMethod: options.extractionMethod || 'hybrid',
        noteCount: options.noteCount || 0,
        version: '6-dimension-v1.0'
      }
    };

    console.log(`[Quality Metrics] Overall quality score: ${result.overall.percentage}% (${result.overall.rating.rating})`);
    console.log(`[Quality Metrics] Issues found: ${result.summary.criticalIssues} critical, ${result.summary.majorIssues} major, ${result.summary.minorIssues} minor`);

    return result;

  } catch (error) {
    console.error('[Quality Metrics] Error calculating 6-dimension metrics:', error);

    // Fallback to legacy system on error
    return calculateLegacyMetrics(extractedData, {}, narrative, metrics);
  }
}

/**
 * Generate actionable recommendations based on quality assessment
 */
function generateRecommendations(dimensions, issues) {
  const recommendations = [];

  // Check lowest scoring dimension
  const dimensionScores = [
    { name: 'completeness', score: dimensions.completeness.score, weight: 0.30 },
    { name: 'accuracy', score: dimensions.accuracy.score, weight: 0.25 },
    { name: 'consistency', score: dimensions.consistency.score, weight: 0.20 },
    { name: 'narrativeQuality', score: dimensions.narrativeQuality.score, weight: 0.15 },
    { name: 'specificity', score: dimensions.specificity.score, weight: 0.05 },
    { name: 'timeliness', score: dimensions.timeliness.score, weight: 0.05 }
  ].sort((a, b) => a.score - b.score);

  const lowestDimension = dimensionScores[0];

  // Dimension-specific recommendations
  if (lowestDimension.name === 'completeness' && lowestDimension.score < 0.7) {
    recommendations.push({
      priority: 'high',
      dimension: 'completeness',
      action: 'Add missing critical sections',
      details: dimensions.completeness.details.criticalSections.issues
        .map(i => i.section)
        .join(', ')
    });
  }

  if (lowestDimension.name === 'accuracy' && lowestDimension.score < 0.7) {
    recommendations.push({
      priority: 'high',
      dimension: 'accuracy',
      action: 'Verify and correct data accuracy',
      details: 'Focus on medications and dates which have highest error rates'
    });
  }

  if (lowestDimension.name === 'consistency' && lowestDimension.score < 0.7) {
    recommendations.push({
      priority: 'high',
      dimension: 'consistency',
      action: 'Resolve internal contradictions',
      details: 'Check date alignment and medication cross-references'
    });
  }

  // Critical issue recommendations
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  if (criticalIssues.length > 0) {
    const issueTypes = [...new Set(criticalIssues.map(i => i.type))];
    recommendations.push({
      priority: 'critical',
      dimension: 'multiple',
      action: 'Address critical issues immediately',
      details: issueTypes.slice(0, 3).join(', ')
    });
  }

  // Performance recommendations
  if (dimensions.timeliness.bottlenecks && dimensions.timeliness.bottlenecks.length > 0) {
    const bottleneck = dimensions.timeliness.bottlenecks[0];
    recommendations.push({
      priority: 'medium',
      dimension: 'timeliness',
      action: `Optimize ${bottleneck.component} processing`,
      details: bottleneck.recommendation
    });
  }

  // Narrative improvement recommendations
  if (dimensions.narrativeQuality.score < 0.6) {
    recommendations.push({
      priority: 'low',
      dimension: 'narrativeQuality',
      action: 'Improve narrative structure',
      details: 'Add transitions, use medical terminology, ensure logical flow'
    });
  }

  return recommendations.slice(0, 5); // Top 5 recommendations
}

/**
 * Calculate confidence in quality assessment
 */
function calculateConfidence(dimensions) {
  // Higher confidence when:
  // 1. Scores are consistent across dimensions
  // 2. Few critical issues
  // 3. Good data completeness

  const scores = [
    dimensions.completeness.score,
    dimensions.accuracy.score,
    dimensions.consistency.score,
    dimensions.narrativeQuality.score,
    dimensions.specificity.score,
    dimensions.timeliness.score
  ];

  // Calculate standard deviation
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  // Lower std dev = higher confidence (more consistent scores)
  let confidence = 1 - (stdDev * 2); // Scale std dev impact

  // Reduce confidence if many critical issues
  const criticalCount = [
    ...dimensions.completeness.issues,
    ...dimensions.accuracy.issues,
    ...dimensions.consistency.issues
  ].filter(i => i.severity === 'critical').length;

  confidence -= (criticalCount * 0.05);

  // Ensure confidence is between 0 and 1
  return Math.max(0.3, Math.min(1, confidence)); // Floor at 30%
}

/**
 * Get quality rating from score
 */
export function getQualityRating(score) {
  if (score >= 0.9) return { rating: 'Excellent', color: 'green', emoji: '✅' };
  if (score >= 0.8) return { rating: 'Good', color: 'blue', emoji: '👍' };
  if (score >= 0.7) return { rating: 'Fair', color: 'yellow', emoji: '⚠️' };
  if (score >= 0.6) return { rating: 'Poor', color: 'orange', emoji: '⚠️' };
  return { rating: 'Very Poor', color: 'red', emoji: '❌' };
}

/**
 * Legacy quality metrics calculation (fallback)
 * Preserved for backward compatibility
 */
function calculateLegacyMetrics(extractedData, validation = {}, summary = '', metadata = {}) {
  console.log('[Quality Metrics] Using legacy quality metrics...');

  try {
    const metrics = {
      extraction: calculateExtractionMetrics(extractedData),
      validation: calculateValidationMetrics(validation),
      summary: calculateSummaryMetrics(summary, extractedData),
      overall: 0,
      metadata: {
        calculated: new Date().toISOString(),
        extractionMethod: metadata.extractionMethod || 'unknown',
        noteCount: metadata.noteCount || 0,
        version: 'legacy'
      }
    };

    // Calculate overall score (weighted average)
    metrics.overall = calculateOverallScore(metrics);

    console.log(`[Quality Metrics] Legacy overall score: ${(metrics.overall * 100).toFixed(1)}%`);

    return metrics;

  } catch (error) {
    console.error('[Quality Metrics] Error in legacy calculation:', error);
    return {
      extraction: {},
      validation: {},
      summary: {},
      overall: 0,
      metadata: {
        calculated: new Date().toISOString(),
        error: error.message,
        version: 'legacy'
      }
    };
  }
}

// Legacy helper functions (preserved for backward compatibility)
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
      score: (completeness * 0.6) + (avgConfidence * 0.4)
    };

  } catch (error) {
    console.error('[Quality Metrics] Error calculating extraction metrics:', error);
    return { completeness: 0, confidence: 0, extractedFields: 0, totalFields: 0, missingFields: [], score: 0 };
  }
}

function calculateValidationMetrics(validation) {
  try {
    const errors = validation.errors || [];
    const warnings = validation.warnings || [];

    const criticalErrors = errors.filter(e => e.severity === 'critical').length;
    const majorErrors = errors.filter(e => e.severity === 'major').length;
    const minorErrors = errors.filter(e => e.severity === 'minor').length;

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

function calculateOverallScore(metrics) {
  try {
    const extractionScore = metrics.extraction.score || 0;
    const validationScore = metrics.validation.score || 0;
    const summaryScore = metrics.summary.score || 0;

    const overall = (extractionScore * 0.3) + (validationScore * 0.2) + (summaryScore * 0.5);

    return Math.min(1.0, Math.max(0, overall));

  } catch (error) {
    console.error('[Quality Metrics] Error calculating overall score:', error);
    return 0;
  }
}

// Helper functions
function calculateReadabilityScore(text) {
  try {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

    if (sentences.length === 0 || words.length === 0) return 0;

    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    let score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    score = (score - 20) / 50;
    score = Math.min(1.0, Math.max(0.2, score));

    return score;

  } catch (error) {
    console.error('[Quality Metrics] Error calculating readability:', error);
    return 0.5;
  }
}

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

  if (word.endsWith('e')) {
    count--;
  }

  return Math.max(1, count);
}

function checkSummaryCompleteness(summary, extractedData) {
  try {
    const lowerSummary = summary.toLowerCase();
    let score = 0;
    let checks = 0;

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

    for (const section of narrativeSections) {
      checks++;
      const found = section.variations.some(v => lowerSummary.includes(v));
      if (found) {
        score++;
      }
    }

    return checks > 0 ? score / checks : 0;

  } catch (error) {
    console.error('[Quality Metrics] Error checking completeness:', error);
    return 0.5;
  }
}

function assessCoherence(summary) {
  try {
    let score = 0.5;
    const lowerSummary = summary.toLowerCase();

    const temporalMarkers = [
      'initially', 'subsequently', 'on post-operative day', 'pod',
      'following', 'then', 'after', 'during', 'prior to',
      'on admission', 'at presentation', 'on hospital day',
      'preoperatively', 'intraoperatively', 'postoperatively'
    ];

    const temporalCount = temporalMarkers.filter(m => lowerSummary.includes(m)).length;
    if (temporalCount > 0) {
      score += Math.min(0.2, temporalCount * 0.05);
    }

    const causalConnectors = [
      'due to', 'resulting in', 'leading to', 'because',
      'therefore', 'thus', 'consequently', 'secondary to',
      'attributed to', 'caused by', 'as a result'
    ];

    const causalCount = causalConnectors.filter(c => lowerSummary.includes(c)).length;
    if (causalCount > 0) {
      score += Math.min(0.2, causalCount * 0.05);
    }

    const sectionHeaders = [
      'chief complaint', 'history', 'hospital course', 'procedures',
      'complications', 'medications', 'discharge', 'follow-up'
    ];

    const sectionCount = sectionHeaders.filter(h => lowerSummary.includes(h)).length;
    if (sectionCount >= 3) {
      score += 0.1;
    }

    return Math.min(1.0, score);

  } catch (error) {
    console.error('[Quality Metrics] Error assessing coherence:', error);
    return 0.5;
  }
}

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

function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

export default {
  calculateQualityMetrics,
  getQualityRating
};