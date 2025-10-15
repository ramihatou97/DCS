/**
 * Summary Corrections Service
 *
 * Tracks corrections made to generated discharge summaries (narrative-level learning).
 * This is different from extraction corrections - it learns narrative style, structure,
 * terminology preferences, and composition patterns.
 *
 * Features:
 * - Track section-level edits to generated summaries
 * - Compare original vs corrected narrative text
 * - Anonymize all corrections before storage (no PHI)
 * - Learn narrative patterns from corrections
 * - Store in IndexedDB for privacy-first learning
 *
 * Learning Types:
 * 1. Style Preferences: Concise vs detailed, formal vs casual
 * 2. Terminology: Abbreviation preferences, medical term usage
 * 3. Structure: Section ordering, paragraph organization
 * 4. Transition Phrases: How sections flow together
 * 5. Detail Level: What to include/exclude
 * 6. Clinical Focus: What aspects to emphasize
 */

import { openDB } from 'idb';
import { anonymizeText } from './anonymizer.js';
import learningEngine from './learningEngine.js';

/**
 * Database configuration
 */
const DB_NAME = 'dcs-summary-corrections';
const DB_VERSION = 1;
const STORE_CORRECTIONS = 'summaryCorrections';
const STORE_PATTERNS = 'narrativePatterns';
const STORE_STATS = 'summaryStats';

/**
 * Correction types
 */
export const CORRECTION_TYPES = {
  STYLE_CHANGE: 'style_change',           // Changed writing style
  TERMINOLOGY: 'terminology',             // Changed medical terms/abbreviations
  DETAIL_ADDED: 'detail_added',          // Added more detail
  DETAIL_REMOVED: 'detail_removed',      // Removed unnecessary detail
  STRUCTURE_CHANGE: 'structure_change',   // Reordered or restructured
  CLINICAL_FOCUS: 'clinical_focus',       // Changed clinical emphasis
  FACTUAL_CORRECTION: 'factual_correction', // Fixed factual error
  TRANSITION_ADDED: 'transition_added',   // Added transition phrases
  ABBREVIATION: 'abbreviation'            // Changed abbreviation usage
};

/**
 * Summary Corrections Tracker
 */
class SummaryCorrectionTracker {
  constructor() {
    this.db = null;
    this.sessionCorrections = [];
  }

  /**
   * Initialize database
   */
  async initialize() {
    if (this.db) return;

    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Summary corrections store
        if (!db.objectStoreNames.contains(STORE_CORRECTIONS)) {
          const correctionStore = db.createObjectStore(STORE_CORRECTIONS, {
            keyPath: 'id',
            autoIncrement: true
          });
          correctionStore.createIndex('section', 'section');
          correctionStore.createIndex('pathology', 'pathology');
          correctionStore.createIndex('correctionType', 'correctionType');
          correctionStore.createIndex('timestamp', 'timestamp');
        }

        // Narrative patterns store
        if (!db.objectStoreNames.contains(STORE_PATTERNS)) {
          const patternStore = db.createObjectStore(STORE_PATTERNS, {
            keyPath: 'id',
            autoIncrement: true
          });
          patternStore.createIndex('section', 'section');
          patternStore.createIndex('patternType', 'patternType');
          patternStore.createIndex('pathology', 'pathology');
          patternStore.createIndex('confidence', 'confidence');
        }

        // Statistics store
        if (!db.objectStoreNames.contains(STORE_STATS)) {
          db.createObjectStore(STORE_STATS, { keyPath: 'key' });
        }
      }
    });

    console.log('✅ Summary corrections database initialized');
  }

  /**
   * Track a summary correction
   *
   * @param {Object} correction - Correction details
   * @param {string} correction.section - Section name (e.g., 'hospitalCourse')
   * @param {string} correction.originalText - Original generated text
   * @param {string} correction.correctedText - User-corrected text
   * @param {Object} correction.context - Context (pathology, extractedData, etc.)
   * @returns {Promise<Object>} Saved correction record
   */
  async trackCorrection(correction) {
    await this.initialize();

    // Validate input
    if (!correction.section || !correction.originalText || !correction.correctedText) {
      throw new Error('Correction must include section, originalText, and correctedText');
    }

    // Skip if no actual change
    if (correction.originalText.trim() === correction.correctedText.trim()) {
      console.log('⏭️  No change detected, skipping correction tracking');
      return null;
    }

    // Anonymize texts
    const anonymizedOriginal = anonymizeText(correction.originalText);
    const anonymizedCorrected = anonymizeText(correction.correctedText);

    // Classify correction type
    const correctionType = this._classifyCorrectionType(
      correction.originalText,
      correction.correctedText
    );

    // Calculate similarity and change metrics
    const metrics = this._calculateChangeMetrics(
      correction.originalText,
      correction.correctedText
    );

    // Create correction record
    const record = {
      section: correction.section,
      originalText: anonymizedOriginal.anonymized,
      correctedText: anonymizedCorrected.anonymized,
      originalLength: correction.originalText.length,
      correctedLength: correction.correctedText.length,
      correctionType,
      metrics,
      pathology: correction.context?.pathology || 'unknown',
      extractedData: correction.context?.extractedData || null,
      timestamp: new Date().toISOString(),
      metadata: {
        sessionId: this._getSessionId(),
        phiRemoved: anonymizedOriginal.metadata.itemsAnonymized + anonymizedCorrected.metadata.itemsAnonymized,
        similarity: metrics.similarity,
        changeRatio: metrics.changeRatio
      }
    };

    // Save to database
    const tx = this.db.transaction(STORE_CORRECTIONS, 'readwrite');
    const id = await tx.store.add(record);
    await tx.done;

    record.id = id;

    // Add to session corrections
    this.sessionCorrections.push(record);

    console.log(`✅ Summary correction tracked: ${correction.section} (${correctionType})`);

    // Update statistics
    await this._updateStats(record);

    return record;
  }

  /**
   * Track multiple corrections at once
   */
  async trackCorrections(corrections) {
    const results = [];
    for (const correction of corrections) {
      try {
        const result = await this.trackCorrection(correction);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        console.error('Failed to track correction:', error);
      }
    }
    return results;
  }

  /**
   * Get corrections by section
   */
  async getCorrectionsBySection(section) {
    await this.initialize();
    const tx = this.db.transaction(STORE_CORRECTIONS, 'readonly');
    const index = tx.store.index('section');
    const corrections = await index.getAll(section);
    await tx.done;
    return corrections;
  }

  /**
   * Get corrections by pathology
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
   * Get all corrections
   */
  async getAllCorrections() {
    await this.initialize();
    const tx = this.db.transaction(STORE_CORRECTIONS, 'readonly');
    const corrections = await tx.store.getAll();
    await tx.done;
    return corrections;
  }

  /**
   * Get correction statistics
   */
  async getStats() {
    await this.initialize();
    const tx = this.db.transaction(STORE_STATS, 'readonly');
    const stats = await tx.store.get('global');
    await tx.done;
    return stats?.data || {
      totalCorrections: 0,
      totalSummaries: 0,
      correctionsBySection: {},
      correctionsByType: {},
      correctionsByPathology: {}
    };
  }

  /**
   * Clear all corrections (for testing/reset)
   */
  async clearAll() {
    await this.initialize();
    const tx = this.db.transaction([STORE_CORRECTIONS, STORE_PATTERNS, STORE_STATS], 'readwrite');
    await tx.objectStore(STORE_CORRECTIONS).clear();
    await tx.objectStore(STORE_PATTERNS).clear();
    await tx.objectStore(STORE_STATS).clear();
    await tx.done;
    this.sessionCorrections = [];
    console.log('⚠️  All summary corrections cleared');
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Classify correction type
   * @private
   */
  _classifyCorrectionType(original, corrected) {
    const origLower = original.toLowerCase();
    const corrLower = corrected.toLowerCase();

    // Check for abbreviation changes
    if (this._hasAbbreviationChanges(original, corrected)) {
      return CORRECTION_TYPES.ABBREVIATION;
    }

    // Check for detail changes
    if (corrected.length > original.length * 1.3) {
      return CORRECTION_TYPES.DETAIL_ADDED;
    }
    if (corrected.length < original.length * 0.7) {
      return CORRECTION_TYPES.DETAIL_REMOVED;
    }

    // Check for terminology changes
    if (this._hasTerminologyChanges(original, corrected)) {
      return CORRECTION_TYPES.TERMINOLOGY;
    }

    // Check for structure changes
    if (this._hasStructureChanges(original, corrected)) {
      return CORRECTION_TYPES.STRUCTURE_CHANGE;
    }

    // Check for transition phrases
    if (this._hasTransitionChanges(original, corrected)) {
      return CORRECTION_TYPES.TRANSITION_ADDED;
    }

    // Default to style change
    return CORRECTION_TYPES.STYLE_CHANGE;
  }

  /**
   * Calculate change metrics
   * @private
   */
  _calculateChangeMetrics(original, corrected) {
    const origWords = original.split(/\s+/).filter(w => w.length > 0);
    const corrWords = corrected.split(/\s+/).filter(w => w.length > 0);

    // Calculate word-level similarity
    const commonWords = origWords.filter(w => corrWords.includes(w));
    const similarity = commonWords.length / Math.max(origWords.length, corrWords.length);

    // Calculate change ratio
    const changeRatio = Math.abs(corrWords.length - origWords.length) / origWords.length;

    return {
      similarity,
      changeRatio,
      wordsAdded: corrWords.length - origWords.length,
      originalWordCount: origWords.length,
      correctedWordCount: corrWords.length
    };
  }

  /**
   * Check for abbreviation changes
   * @private
   */
  _hasAbbreviationChanges(original, corrected) {
    // Common medical abbreviations
    const abbrevPatterns = [
      /\b(SAH|ICH|SDH|TBI|EVD|ICP|GCS|mRS|KPS)\b/g,
      /\b(POD|HD|s\/p|c\/o|w\/)\b/gi,
      /\b(CT|MRI|CTA|MRA|DSA)\b/g
    ];

    for (const pattern of abbrevPatterns) {
      const origMatches = (original.match(pattern) || []).length;
      const corrMatches = (corrected.match(pattern) || []).length;
      if (Math.abs(origMatches - corrMatches) > 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check for terminology changes
   * @private
   */
  _hasTerminologyChanges(original, corrected) {
    // Look for medical term substitutions
    const medicalTerms = [
      'aneurysm', 'hemorrhage', 'craniotomy', 'vasospasm',
      'hydrocephalus', 'ischemia', 'infarction', 'edema'
    ];

    for (const term of medicalTerms) {
      const origHas = original.toLowerCase().includes(term);
      const corrHas = corrected.toLowerCase().includes(term);
      if (origHas !== corrHas) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check for structure changes
   * @private
   */
  _hasStructureChanges(original, corrected) {
    const origSentences = original.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const corrSentences = corrected.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Significant change in sentence count
    return Math.abs(origSentences.length - corrSentences.length) > 2;
  }

  /**
   * Check for transition phrase changes
   * @private
   */
  _hasTransitionChanges(original, corrected) {
    const transitions = [
      'subsequently', 'following', 'after', 'during', 'on post-operative day',
      'the patient', 'he was', 'she was', 'they were', 'additionally', 'furthermore'
    ];

    const origCount = transitions.filter(t => original.toLowerCase().includes(t)).length;
    const corrCount = transitions.filter(t => corrected.toLowerCase().includes(t)).length;

    return corrCount > origCount;
  }

  /**
   * Get or create session ID
   * @private
   */
  _getSessionId() {
    if (!this.sessionId) {
      this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.sessionId;
  }

  /**
   * Update statistics
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
          correctionsBySection: {},
          correctionsByType: {},
          correctionsByPathology: {},
          lastUpdated: new Date().toISOString()
        }
      };
    }

    // Update counts
    stats.data.totalCorrections++;

    // Update section counts
    if (!stats.data.correctionsBySection[correction.section]) {
      stats.data.correctionsBySection[correction.section] = 0;
    }
    stats.data.correctionsBySection[correction.section]++;

    // Update type counts
    if (!stats.data.correctionsByType[correction.correctionType]) {
      stats.data.correctionsByType[correction.correctionType] = 0;
    }
    stats.data.correctionsByType[correction.correctionType]++;

    // Update pathology counts
    if (!stats.data.correctionsByPathology[correction.pathology]) {
      stats.data.correctionsByPathology[correction.pathology] = 0;
    }
    stats.data.correctionsByPathology[correction.pathology]++;

    stats.data.lastUpdated = new Date().toISOString();

    await tx.store.put(stats);
    await tx.done;
  }
}

// Create singleton instance
const summaryCorrectionTracker = new SummaryCorrectionTracker();

// Export singleton and functions
export default summaryCorrectionTracker;
export const trackSummaryCorrection = (correction) => summaryCorrectionTracker.trackCorrection(correction);
export const trackSummaryCorrections = (corrections) => summaryCorrectionTracker.trackCorrections(corrections);
export const getCorrectionsBySection = (section) => summaryCorrectionTracker.getCorrectionsBySection(section);
export const getCorrectionsByPathology = (pathology) => summaryCorrectionTracker.getCorrectionsByPathology(pathology);
export const getSummaryStats = () => summaryCorrectionTracker.getStats();

