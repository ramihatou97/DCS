/**
 * Correction Tracker Service
 *
 * Tracks user corrections to extracted data for ML learning.
 * Captures: what was extracted incorrectly, what the correct value is, and context.
 *
 * Purpose:
 * - Learn from mistakes (improve extraction patterns)
 * - Identify weak extraction areas
 * - Calculate field-level accuracy over time
 * - Enable automatic pattern refinement
 *
 * Privacy:
 * - All corrections are anonymized before storage
 * - No PHI is retained in the learning system
 * - Only patterns and structures are learned
 */

import { anonymizeText } from './anonymizer.js';
import { openDB } from 'idb';
import { extractTextBetween, calculateSimilarity } from '../../utils/textUtils.js';

/**
 * Correction storage database
 */
const DB_NAME = 'dcs-corrections';
const DB_VERSION = 1;
const STORE_CORRECTIONS = 'corrections';
const STORE_PATTERNS = 'learnedPatterns';
const STORE_STATS = 'correctionStats';

/**
 * Initialize correction database
 */
async function initCorrectionDB() {
  return await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Corrections store
      if (!db.objectStoreNames.contains(STORE_CORRECTIONS)) {
        const correctionStore = db.createObjectStore(STORE_CORRECTIONS, {
          keyPath: 'id',
          autoIncrement: true
        });
        correctionStore.createIndex('field', 'field');
        correctionStore.createIndex('pathology', 'pathology');
        correctionStore.createIndex('timestamp', 'timestamp');
        correctionStore.createIndex('correctionType', 'correctionType');
      }

      // Learned patterns store
      if (!db.objectStoreNames.contains(STORE_PATTERNS)) {
        const patternStore = db.createObjectStore(STORE_PATTERNS, {
          keyPath: 'id',
          autoIncrement: true
        });
        patternStore.createIndex('field', 'field');
        patternStore.createIndex('confidence', 'confidence');
        patternStore.createIndex('successCount', 'successCount');
      }

      // Statistics store
      if (!db.objectStoreNames.contains(STORE_STATS)) {
        db.createObjectStore(STORE_STATS, { keyPath: 'key' });
      }
    }
  });
}

/**
 * Correction Tracker Class
 */
class CorrectionTracker {
  constructor() {
    this.db = null;
    this.sessionCorrections = []; // Current session corrections (before save)
  }

  /**
   * Initialize the tracker
   */
  async initialize() {
    if (!this.db) {
      this.db = await initCorrectionDB();
      console.log('✅ Correction Tracker initialized');
    }
  }

  /**
   * Track a correction made by the user
   *
   * @param {Object} correction - Correction details
   * @param {string} correction.field - Field name (e.g., 'demographics.age', 'medications[0].name')
   * @param {any} correction.originalValue - What the system extracted
   * @param {any} correction.correctedValue - What the user changed it to
   * @param {string} correction.sourceText - Context from source notes
   * @param {number} correction.originalConfidence - Confidence of original extraction (0-1)
   * @param {string} correction.pathology - Pathology type (e.g., 'SAH', 'tumor')
   * @param {string} correction.extractionMethod - 'llm' or 'pattern'
   * @returns {Promise<Object>} Saved correction record
   */
  async trackCorrection(correction) {
    await this.initialize();

    // Validate input
    if (!correction.field || correction.originalValue === undefined || correction.correctedValue === undefined) {
      throw new Error('Correction must include field, originalValue, and correctedValue');
    }

    // Determine correction type
    const correctionType = this._classifyCorrectionType(
      correction.originalValue,
      correction.correctedValue
    );

    // Anonymize source text
    const anonymizedContext = correction.sourceText
      ? anonymizeText(correction.sourceText).anonymized
      : null;

    // Anonymize values (if they contain PHI)
    const anonymizedOriginal = this._anonymizeValue(correction.originalValue);
    const anonymizedCorrected = this._anonymizeValue(correction.correctedValue);

    // Create correction record
    const record = {
      field: correction.field,
      originalValue: anonymizedOriginal,
      correctedValue: anonymizedCorrected,
      originalValueType: typeof correction.originalValue,
      correctedValueType: typeof correction.correctedValue,
      sourceContext: anonymizedContext,
      originalConfidence: correction.originalConfidence || 0,
      pathology: correction.pathology || 'unknown',
      extractionMethod: correction.extractionMethod || 'unknown',
      correctionType,
      timestamp: new Date().toISOString(),
      metadata: {
        sessionId: this._getSessionId(),
        userAgent: navigator.userAgent,
        similarity: this._calculateValueSimilarity(correction.originalValue, correction.correctedValue),
      }
    };

    // Save to database
    const tx = this.db.transaction(STORE_CORRECTIONS, 'readwrite');
    const id = await tx.store.add(record);
    await tx.done;

    record.id = id;

    // Add to session corrections
    this.sessionCorrections.push(record);

    console.log(`✅ Correction tracked: ${correction.field}`, {
      type: correctionType,
      originalConfidence: correction.originalConfidence
    });

    // Update statistics
    await this._updateStats(record);

    return record;
  }

  /**
   * Track multiple corrections at once
   *
   * @param {Array} corrections - Array of correction objects
   * @returns {Promise<Array>} Saved correction records
   */
  async trackCorrections(corrections) {
    const saved = [];
    for (const correction of corrections) {
      try {
        const record = await this.trackCorrection(correction);
        saved.push(record);
      } catch (error) {
        console.error('Failed to track correction:', correction, error);
      }
    }
    return saved;
  }

  /**
   * Get all corrections for a specific field
   *
   * @param {string} field - Field name
   * @returns {Promise<Array>} Corrections for the field
   */
  async getCorrectionsByField(field) {
    await this.initialize();
    const tx = this.db.transaction(STORE_CORRECTIONS, 'readonly');
    const index = tx.store.index('field');
    const corrections = await index.getAll(field);
    await tx.done;
    return corrections;
  }

  /**
   * Get all corrections for a specific pathology
   *
   * @param {string} pathology - Pathology type
   * @returns {Promise<Array>} Corrections for the pathology
   */
  async getCorrectionsByPathology(pathology) {
    await this.initialize();
    const tx = this.db.transaction(STORE_CORRECTIONS, 'readonly');
    const index = tx.store.index('pathology');
    const corrections = await index.getAll(pathology);
    await tx.done;
    return corrections;
  }

  /**
   * Get corrections within a date range
   *
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Corrections in range
   */
  async getCorrectionsByDateRange(startDate, endDate) {
    await this.initialize();
    const tx = this.db.transaction(STORE_CORRECTIONS, 'readonly');
    const index = tx.store.index('timestamp');
    const range = IDBKeyRange.bound(
      startDate.toISOString(),
      endDate.toISOString()
    );
    const corrections = await index.getAll(range);
    await tx.done;
    return corrections;
  }

  /**
   * Get all corrections (with optional limit)
   *
   * @param {number} limit - Maximum number of corrections to return
   * @returns {Promise<Array>} All corrections
   */
  async getAllCorrections(limit = null) {
    await this.initialize();
    const tx = this.db.transaction(STORE_CORRECTIONS, 'readonly');
    let corrections = await tx.store.getAll();
    await tx.done;

    // Sort by timestamp (newest first)
    corrections.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (limit) {
      corrections = corrections.slice(0, limit);
    }

    return corrections;
  }

  /**
   * Analyze corrections to identify patterns
   *
   * @param {string} field - Field to analyze (optional, analyzes all if not provided)
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeCorrections(field = null) {
    await this.initialize();

    const corrections = field
      ? await this.getCorrectionsByField(field)
      : await this.getAllCorrections();

    if (corrections.length === 0) {
      return {
        totalCorrections: 0,
        patterns: [],
        commonMistakes: [],
        recommendations: []
      };
    }

    // Group corrections by type
    const byType = this._groupBy(corrections, 'correctionType');

    // Identify common mistakes
    const commonMistakes = this._identifyCommonMistakes(corrections);

    // Extract patterns from corrections
    const patterns = this._extractPatternsFromCorrections(corrections);

    // Generate recommendations
    const recommendations = this._generateRecommendations(corrections, commonMistakes);

    return {
      totalCorrections: corrections.length,
      byType,
      commonMistakes,
      patterns,
      recommendations,
      fields: this._groupBy(corrections, 'field'),
      pathologies: this._groupBy(corrections, 'pathology'),
      extractionMethods: this._groupBy(corrections, 'extractionMethod'),
    };
  }

  /**
   * Get correction statistics
   *
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics() {
    await this.initialize();

    const tx = this.db.transaction(STORE_STATS, 'readonly');
    const stats = await tx.store.get('global');
    await tx.done;

    if (!stats) {
      return {
        totalCorrections: 0,
        totalSummaries: 0,
        averageCorrectionsPerSummary: 0,
        accuracyRate: 100,
        mostCorrectedFields: [],
        correctionsByPathology: {},
      };
    }

    return stats.data;
  }

  /**
   * Calculate field-level accuracy
   *
   * @param {string} field - Field name
   * @returns {Promise<Object>} Accuracy metrics
   */
  async getFieldAccuracy(field) {
    const corrections = await this.getCorrectionsByField(field);
    const stats = await this.getStatistics();

    // Total extractions for this field (approximation based on summaries)
    const totalExtractions = stats.totalSummaries || corrections.length * 2;

    // Corrections = errors
    const errors = corrections.length;

    // Accuracy = (total - errors) / total
    const accuracy = ((totalExtractions - errors) / totalExtractions) * 100;

    // Calculate average confidence of mistakes
    const avgMistakeConfidence = corrections.length > 0
      ? corrections.reduce((sum, c) => sum + (c.originalConfidence || 0), 0) / corrections.length
      : 0;

    // Identify correction types distribution
    const typeDistribution = this._groupBy(corrections, 'correctionType');

    return {
      field,
      accuracy: Math.max(0, Math.min(100, accuracy)),
      totalCorrections: errors,
      totalExtractions,
      avgMistakeConfidence,
      typeDistribution,
      trend: await this._calculateAccuracyTrend(field),
    };
  }

  /**
   * Calculate overall accuracy across all fields
   *
   * @returns {Promise<Object>} Overall accuracy
   */
  async getOverallAccuracy() {
    const stats = await this.getStatistics();
    const corrections = await this.getAllCorrections();

    // Estimate total fields extracted (13 main categories × summaries)
    const fieldsPerSummary = 13;
    const totalFields = (stats.totalSummaries || 1) * fieldsPerSummary;

    const accuracy = ((totalFields - corrections.length) / totalFields) * 100;

    return {
      accuracy: Math.max(0, Math.min(100, accuracy)),
      totalCorrections: corrections.length,
      totalFields,
      totalSummaries: stats.totalSummaries || 0,
      avgCorrectionsPerSummary: stats.averageCorrectionsPerSummary || 0,
    };
  }

  /**
   * Clear all corrections (use with caution!)
   */
  async clearAllCorrections() {
    await this.initialize();
    const tx = this.db.transaction(STORE_CORRECTIONS, 'readwrite');
    await tx.store.clear();
    await tx.done;
    this.sessionCorrections = [];
    console.log('⚠️  All corrections cleared');
  }

  /**
   * Export corrections for sharing/backup
   *
   * @returns {Promise<Object>} Exported data
   */
  async exportCorrections() {
    const corrections = await this.getAllCorrections();
    const stats = await this.getStatistics();
    const analysis = await this.analyzeCorrections();

    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      corrections,
      statistics: stats,
      analysis,
      metadata: {
        totalCorrections: corrections.length,
        dateRange: {
          earliest: corrections.length > 0 ? corrections[corrections.length - 1].timestamp : null,
          latest: corrections.length > 0 ? corrections[0].timestamp : null,
        }
      }
    };
  }

  /**
   * Import corrections from export
   *
   * @param {Object} data - Exported correction data
   * @returns {Promise<number>} Number of corrections imported
   */
  async importCorrections(data) {
    if (!data.corrections || !Array.isArray(data.corrections)) {
      throw new Error('Invalid correction data format');
    }

    await this.initialize();
    let imported = 0;

    for (const correction of data.corrections) {
      try {
        // Remove id to let database assign new one
        const { id, ...correctionData } = correction;
        const tx = this.db.transaction(STORE_CORRECTIONS, 'readwrite');
        await tx.store.add(correctionData);
        await tx.done;
        imported++;
      } catch (error) {
        console.error('Failed to import correction:', error);
      }
    }

    console.log(`✅ Imported ${imported} corrections`);
    return imported;
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Classify the type of correction
   * @private
   */
  _classifyCorrectionType(originalValue, correctedValue) {
    // Missing → filled
    if (!originalValue || originalValue === '' || originalValue === null) {
      return 'addition';
    }

    // Filled → removed
    if (!correctedValue || correctedValue === '' || correctedValue === null) {
      return 'deletion';
    }

    // Array handling
    if (Array.isArray(originalValue) && Array.isArray(correctedValue)) {
      if (correctedValue.length > originalValue.length) {
        return 'addition';
      } else if (correctedValue.length < originalValue.length) {
        return 'deletion';
      } else {
        return 'modification';
      }
    }

    // String/number modification
    const similarity = this._calculateValueSimilarity(originalValue, correctedValue);

    if (similarity > 0.8) {
      return 'minor_edit'; // Small change (typo, format)
    } else if (similarity > 0.5) {
      return 'modification'; // Moderate change
    } else {
      return 'replacement'; // Complete replacement
    }
  }

  /**
   * Anonymize a single value if it contains PHI
   * @private
   */
  _anonymizeValue(value) {
    if (typeof value === 'string') {
      const result = anonymizeText(value);
      return result.anonymized;
    } else if (Array.isArray(value)) {
      return value.map(v => this._anonymizeValue(v));
    } else if (typeof value === 'object' && value !== null) {
      const anonymized = {};
      for (const [key, val] of Object.entries(value)) {
        anonymized[key] = this._anonymizeValue(val);
      }
      return anonymized;
    }
    return value;
  }

  /**
   * Calculate similarity between two values
   * @private
   */
  _calculateValueSimilarity(val1, val2) {
    const str1 = String(val1).toLowerCase();
    const str2 = String(val2).toLowerCase();

    if (str1 === str2) return 1.0;

    return calculateSimilarity(str1, str2);
  }

  /**
   * Get or create session ID
   * @private
   */
  _getSessionId() {
    if (!this.sessionId) {
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.sessionId;
  }

  /**
   * Update global statistics
   * @private
   */
  async _updateStats(correction) {
    const tx = this.db.transaction(STORE_STATS, 'readwrite');
    let stats = await tx.store.get('global');

    if (!stats) {
      stats = {
        key: 'global',
        data: {
          totalCorrections: 0,
          totalSummaries: 0,
          averageCorrectionsPerSummary: 0,
          mostCorrectedFields: {},
          correctionsByPathology: {},
          lastUpdated: new Date().toISOString(),
        }
      };
    }

    // Update counts
    stats.data.totalCorrections++;

    // Update field counts
    if (!stats.data.mostCorrectedFields[correction.field]) {
      stats.data.mostCorrectedFields[correction.field] = 0;
    }
    stats.data.mostCorrectedFields[correction.field]++;

    // Update pathology counts
    if (!stats.data.correctionsByPathology[correction.pathology]) {
      stats.data.correctionsByPathology[correction.pathology] = 0;
    }
    stats.data.correctionsByPathology[correction.pathology]++;

    // Update timestamp
    stats.data.lastUpdated = new Date().toISOString();

    await tx.store.put(stats);
    await tx.done;
  }

  /**
   * Group array by property
   * @private
   */
  _groupBy(array, property) {
    return array.reduce((groups, item) => {
      const key = item[property] || 'unknown';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});
  }

  /**
   * Identify common mistakes
   * @private
   */
  _identifyCommonMistakes(corrections) {
    const mistakes = {};

    for (const correction of corrections) {
      const key = `${correction.field}_${correction.correctionType}`;
      if (!mistakes[key]) {
        mistakes[key] = {
          field: correction.field,
          type: correction.correctionType,
          count: 0,
          examples: []
        };
      }
      mistakes[key].count++;
      if (mistakes[key].examples.length < 3) {
        mistakes[key].examples.push({
          original: correction.originalValue,
          corrected: correction.correctedValue
        });
      }
    }

    // Return top 10 most common mistakes
    return Object.values(mistakes)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Extract patterns from corrections
   * @private
   */
  _extractPatternsFromCorrections(corrections) {
    const patterns = [];

    // Group by field
    const byField = this._groupBy(corrections, 'field');

    for (const [field, fieldCorrections] of Object.entries(byField)) {
      // Look for repeated correction patterns
      const correctionPairs = fieldCorrections.map(c => ({
        from: String(c.originalValue),
        to: String(c.correctedValue)
      }));

      // Find most common corrections
      const pairCounts = {};
      for (const pair of correctionPairs) {
        const key = `${pair.from}→${pair.to}`;
        pairCounts[key] = (pairCounts[key] || 0) + 1;
      }

      // Extract patterns with count > 1
      for (const [key, count] of Object.entries(pairCounts)) {
        if (count > 1) {
          const [from, to] = key.split('→');
          patterns.push({
            field,
            pattern: { from, to },
            frequency: count,
            confidence: count / fieldCorrections.length
          });
        }
      }
    }

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Generate recommendations based on corrections
   * @private
   */
  _generateRecommendations(corrections, commonMistakes) {
    const recommendations = [];

    // High-frequency correction fields
    const fieldCounts = this._groupBy(corrections, 'field');
    for (const [field, fieldCorrections] of Object.entries(fieldCounts)) {
      if (fieldCorrections.length > 5) {
        recommendations.push({
          type: 'pattern_refinement',
          priority: 'high',
          field,
          message: `Field "${field}" has ${fieldCorrections.length} corrections. Consider refining extraction patterns.`,
          action: 'review_patterns'
        });
      }
    }

    // Low confidence extractions that needed correction
    const lowConfidenceErrors = corrections.filter(c => c.originalConfidence < 0.5);
    if (lowConfidenceErrors.length > 0) {
      recommendations.push({
        type: 'confidence_threshold',
        priority: 'medium',
        message: `${lowConfidenceErrors.length} corrections were from low-confidence extractions. Consider flagging these for review.`,
        action: 'adjust_confidence_threshold'
      });
    }

    return recommendations;
  }

  /**
   * Calculate accuracy trend for a field
   * @private
   */
  async _calculateAccuracyTrend(field) {
    const corrections = await this.getCorrectionsByField(field);

    if (corrections.length < 2) {
      return 'insufficient_data';
    }

    // Group by month
    const byMonth = {};
    for (const correction of corrections) {
      const month = correction.timestamp.substring(0, 7); // YYYY-MM
      byMonth[month] = (byMonth[month] || 0) + 1;
    }

    const months = Object.keys(byMonth).sort();
    if (months.length < 2) {
      return 'insufficient_data';
    }

    // Compare first half vs second half
    const midpoint = Math.floor(months.length / 2);
    const firstHalfAvg = months.slice(0, midpoint).reduce((sum, m) => sum + byMonth[m], 0) / midpoint;
    const secondHalfAvg = months.slice(midpoint).reduce((sum, m) => sum + byMonth[m], 0) / (months.length - midpoint);

    if (secondHalfAvg < firstHalfAvg * 0.8) {
      return 'improving'; // 20% reduction in errors
    } else if (secondHalfAvg > firstHalfAvg * 1.2) {
      return 'declining'; // 20% increase in errors
    } else {
      return 'stable';
    }
  }
}

// Singleton instance
const correctionTracker = new CorrectionTracker();

// Export singleton instance and convenience functions
export default correctionTracker;

export const trackCorrection = (correction) => correctionTracker.trackCorrection(correction);
export const trackCorrections = (corrections) => correctionTracker.trackCorrections(corrections);
export const getCorrectionsByField = (field) => correctionTracker.getCorrectionsByField(field);
export const getCorrectionsByPathology = (pathology) => correctionTracker.getCorrectionsByPathology(pathology);
export const analyzeCorrections = (field) => correctionTracker.analyzeCorrections(field);
export const getFieldAccuracy = (field) => correctionTracker.getFieldAccuracy(field);
export const getOverallAccuracy = () => correctionTracker.getOverallAccuracy();
export const getCorrectionStatistics = () => correctionTracker.getStatistics();
export const exportCorrections = () => correctionTracker.exportCorrections();
export const importCorrections = (data) => correctionTracker.importCorrections(data);
