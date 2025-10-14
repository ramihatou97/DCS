/**
 * Learning Engine Service
 *
 * Automatically learns and refines extraction patterns from user corrections.
 * This is the "brain" of the ML system - it turns corrections into improved patterns.
 *
 * Learning Strategies:
 * 1. Pattern Generation: Create new regex patterns from repeated corrections
 * 2. Pattern Refinement: Improve existing patterns based on failures
 * 3. Confidence Adjustment: Update confidence scores based on success/failure rates
 * 4. Context Learning: Learn contextual clues for better extraction
 * 5. Negative Learning: Learn what NOT to extract (false positives)
 *
 * Output:
 * - Learned patterns (stored in IndexedDB)
 * - Enhanced extraction rules
 * - Confidence scores
 * - Pattern metadata (success count, failure count, last used)
 */

import correctionTracker from './correctionTracker.js';
import { openDB } from 'idb';
import { escapeRegExp } from '../../utils/textUtils.js';

/**
 * Learning database configuration
 */
const DB_NAME = 'dcs-learning';
const DB_VERSION = 1;
const STORE_PATTERNS = 'learnedPatterns';
const STORE_RULES = 'extractionRules';
const STORE_CONTEXT = 'contextualClues';

/**
 * Initialize learning database
 */
async function initLearningDB() {
  return await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Learned patterns store
      if (!db.objectStoreNames.contains(STORE_PATTERNS)) {
        const patternStore = db.createObjectStore(STORE_PATTERNS, {
          keyPath: 'id',
          autoIncrement: true
        });
        patternStore.createIndex('field', 'field');
        patternStore.createIndex('pathology', 'pathology');
        patternStore.createIndex('confidence', 'confidence');
        patternStore.createIndex('successCount', 'successCount');
        patternStore.createIndex('enabled', 'enabled');
      }

      // Extraction rules store
      if (!db.objectStoreNames.contains(STORE_RULES)) {
        const ruleStore = db.createObjectStore(STORE_RULES, {
          keyPath: 'id',
          autoIncrement: true
        });
        ruleStore.createIndex('field', 'field');
        ruleStore.createIndex('type', 'type');
      }

      // Contextual clues store
      if (!db.objectStoreNames.contains(STORE_CONTEXT)) {
        const contextStore = db.createObjectStore(STORE_CONTEXT, {
          keyPath: 'id',
          autoIncrement: true
        });
        contextStore.createIndex('field', 'field');
        contextStore.createIndex('strength', 'strength');
      }
    }
  });
}

/**
 * Pattern types for learning
 */
const PATTERN_TYPES = {
  REGEX: 'regex',
  EXACT_MATCH: 'exact_match',
  FUZZY_MATCH: 'fuzzy_match',
  CONTEXTUAL: 'contextual',
  TRANSFORMATION: 'transformation',
};

/**
 * Learning thresholds
 */
const LEARNING_THRESHOLDS = {
  MIN_CORRECTIONS_FOR_PATTERN: 3, // Need 3+ identical corrections to generate pattern
  MIN_CONFIDENCE_TO_ENABLE: 0.6, // Pattern must have 60%+ confidence to be enabled
  MAX_PATTERNS_PER_FIELD: 20, // Limit patterns per field to avoid bloat
  SUCCESS_RATE_THRESHOLD: 0.7, // 70%+ success rate to keep pattern
  DECAY_FACTOR: 0.95, // Confidence decay for unused patterns
};

/**
 * Learning Engine Class
 */
class LearningEngine {
  constructor() {
    this.db = null;
    this.learnedPatterns = new Map(); // In-memory cache
    this.learningQueue = []; // Queue for async learning
  }

  /**
   * Initialize the learning engine
   */
  async initialize() {
    if (!this.db) {
      this.db = await initLearningDB();
      await this._loadPatternsIntoMemory();
      console.log('✅ Learning Engine initialized');
    }
  }

  /**
   * Learn from all corrections (main learning loop)
   *
   * @param {Object} options - Learning options
   * @returns {Promise<Object>} Learning results
   */
  async learnFromCorrections(options = {}) {
    await this.initialize();

    const {
      minCorrections = LEARNING_THRESHOLDS.MIN_CORRECTIONS_FOR_PATTERN,
      fields = null, // Learn for specific fields only, or null for all
      pathology = null // Learn for specific pathology only
    } = options;

    console.log('🧠 Starting learning process...');

    // Get corrections to learn from
    const corrections = pathology
      ? await correctionTracker.getCorrectionsByPathology(pathology)
      : await correctionTracker.getAllCorrections();

    if (corrections.length === 0) {
      console.log('ℹ️  No corrections to learn from');
      return { patternsLearned: 0, rulesCreated: 0 };
    }

    console.log(`📊 Analyzing ${corrections.length} corrections...`);

    // Group corrections by field
    const byField = this._groupByField(corrections);

    let patternsLearned = 0;
    let rulesCreated = 0;

    // Learn patterns for each field
    for (const [field, fieldCorrections] of Object.entries(byField)) {
      // Skip if filtering by fields
      if (fields && !fields.includes(field)) continue;

      // Skip if not enough corrections
      if (fieldCorrections.length < minCorrections) continue;

      console.log(`📝 Learning patterns for field: ${field} (${fieldCorrections.length} corrections)`);

      // Strategy 1: Exact match patterns (repeated corrections)
      const exactPatterns = await this._learnExactMatchPatterns(field, fieldCorrections);
      patternsLearned += exactPatterns.length;

      // Strategy 2: Regex patterns (similar corrections with variations)
      const regexPatterns = await this._learnRegexPatterns(field, fieldCorrections);
      patternsLearned += regexPatterns.length;

      // Strategy 3: Transformation rules (from → to mappings)
      const transformRules = await this._learnTransformationRules(field, fieldCorrections);
      rulesCreated += transformRules.length;

      // Strategy 4: Contextual clues (what appears near correct values)
      const contextClues = await this._learnContextualClues(field, fieldCorrections);
      rulesCreated += contextClues.length;
    }

    // Clean up low-performing patterns
    await this._pruneWeakPatterns();

    console.log(`✅ Learning complete: ${patternsLearned} patterns, ${rulesCreated} rules`);

    return {
      patternsLearned,
      rulesCreated,
      corrections: corrections.length,
      fields: Object.keys(byField),
    };
  }

  /**
   * Get all learned patterns for a field
   *
   * @param {string} field - Field name
   * @param {boolean} enabledOnly - Return only enabled patterns
   * @returns {Promise<Array>} Learned patterns
   */
  async getPatternsForField(field, enabledOnly = true) {
    await this.initialize();

    const tx = this.db.transaction(STORE_PATTERNS, 'readonly');
    const index = tx.store.index('field');
    let patterns = await index.getAll(field);
    await tx.done;

    if (enabledOnly) {
      patterns = patterns.filter(p => p.enabled);
    }

    // Sort by confidence (highest first)
    patterns.sort((a, b) => b.confidence - a.confidence);

    return patterns;
  }

  /**
   * Apply learned patterns during extraction
   *
   * @param {string} text - Text to extract from
   * @param {string} field - Field to extract
   * @param {string} pathology - Pathology type
   * @returns {Promise<Object>} Extraction result with learned patterns applied
   */
  async applyLearnedPatterns(text, field, pathology = null) {
    await this.initialize();

    // Get patterns for this field
    const patterns = await this.getPatternsForField(field);

    if (patterns.length === 0) {
      return { extracted: null, confidence: 0, patternsUsed: [] };
    }

    const results = [];

    // Try each pattern
    for (const pattern of patterns) {
      // Skip if pattern is pathology-specific and doesn't match
      if (pattern.pathology && pathology && pattern.pathology !== pathology) {
        continue;
      }

      let match = null;

      switch (pattern.type) {
        case PATTERN_TYPES.REGEX:
          match = this._applyRegexPattern(text, pattern);
          break;

        case PATTERN_TYPES.EXACT_MATCH:
          match = this._applyExactMatchPattern(text, pattern);
          break;

        case PATTERN_TYPES.FUZZY_MATCH:
          match = this._applyFuzzyMatchPattern(text, pattern);
          break;

        case PATTERN_TYPES.CONTEXTUAL:
          match = this._applyContextualPattern(text, pattern);
          break;
      }

      if (match) {
        results.push({
          value: match.value,
          confidence: pattern.confidence * match.matchQuality,
          pattern: pattern.id,
          type: pattern.type
        });

        // Update pattern usage stats
        await this._recordPatternSuccess(pattern.id);
      }
    }

    // Return best match
    if (results.length === 0) {
      return { extracted: null, confidence: 0, patternsUsed: [] };
    }

    const best = results.sort((a, b) => b.confidence - a.confidence)[0];

    return {
      extracted: best.value,
      confidence: best.confidence,
      patternsUsed: results.map(r => r.pattern),
      allMatches: results
    };
  }

  /**
   * Record successful pattern application
   *
   * @param {number} patternId - Pattern ID
   */
  async recordPatternSuccess(patternId) {
    await this._recordPatternSuccess(patternId);
  }

  /**
   * Record failed pattern application
   *
   * @param {number} patternId - Pattern ID
   */
  async recordPatternFailure(patternId) {
    await this._recordPatternFailure(patternId);
  }

  /**
   * Get learning statistics
   *
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics() {
    await this.initialize();

    const tx = this.db.transaction(STORE_PATTERNS, 'readonly');
    const allPatterns = await tx.store.getAll();
    await tx.done;

    const enabled = allPatterns.filter(p => p.enabled);
    const byField = this._groupByField(allPatterns);
    const byType = this._groupBy(allPatterns, 'type');
    const byPathology = this._groupBy(allPatterns, 'pathology');

    // Calculate average confidence
    const avgConfidence = allPatterns.length > 0
      ? allPatterns.reduce((sum, p) => sum + p.confidence, 0) / allPatterns.length
      : 0;

    // Calculate success rate
    const totalApplications = allPatterns.reduce((sum, p) => sum + p.successCount + p.failureCount, 0);
    const totalSuccesses = allPatterns.reduce((sum, p) => sum + p.successCount, 0);
    const successRate = totalApplications > 0 ? (totalSuccesses / totalApplications) * 100 : 0;

    return {
      totalPatterns: allPatterns.length,
      enabledPatterns: enabled.length,
      disabledPatterns: allPatterns.length - enabled.length,
      byField: Object.keys(byField).reduce((acc, field) => {
        acc[field] = byField[field].length;
        return acc;
      }, {}),
      byType: Object.keys(byType).reduce((acc, type) => {
        acc[type] = byType[type].length;
        return acc;
      }, {}),
      byPathology: Object.keys(byPathology).reduce((acc, pathology) => {
        acc[pathology || 'general'] = byPathology[pathology].length;
        return acc;
      }, {}),
      avgConfidence,
      successRate,
      totalApplications,
      totalSuccesses,
    };
  }

  /**
   * Export learned patterns
   *
   * @returns {Promise<Object>} Exported data
   */
  async exportLearning() {
    await this.initialize();

    const patterns = await this.db.transaction(STORE_PATTERNS, 'readonly').store.getAll();
    const rules = await this.db.transaction(STORE_RULES, 'readonly').store.getAll();
    const context = await this.db.transaction(STORE_CONTEXT, 'readonly').store.getAll();

    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      patterns,
      rules,
      context,
      statistics: await this.getStatistics(),
    };
  }

  /**
   * Import learned patterns
   *
   * @param {Object} data - Exported learning data
   * @returns {Promise<Object>} Import results
   */
  async importLearning(data) {
    await this.initialize();

    let patternsImported = 0;
    let rulesImported = 0;
    let contextImported = 0;

    // Import patterns
    if (data.patterns) {
      for (const pattern of data.patterns) {
        try {
          const { id, ...patternData } = pattern;
          const tx = this.db.transaction(STORE_PATTERNS, 'readwrite');
          await tx.store.add(patternData);
          await tx.done;
          patternsImported++;
        } catch (error) {
          console.error('Failed to import pattern:', error);
        }
      }
    }

    // Import rules
    if (data.rules) {
      for (const rule of data.rules) {
        try {
          const { id, ...ruleData } = rule;
          const tx = this.db.transaction(STORE_RULES, 'readwrite');
          await tx.store.add(ruleData);
          await tx.done;
          rulesImported++;
        } catch (error) {
          console.error('Failed to import rule:', error);
        }
      }
    }

    // Import context
    if (data.context) {
      for (const ctx of data.context) {
        try {
          const { id, ...ctxData } = ctx;
          const tx = this.db.transaction(STORE_CONTEXT, 'readwrite');
          await tx.store.add(ctxData);
          await tx.done;
          contextImported++;
        } catch (error) {
          console.error('Failed to import context:', error);
        }
      }
    }

    console.log(`✅ Import complete: ${patternsImported} patterns, ${rulesImported} rules, ${contextImported} context clues`);

    // Reload patterns into memory
    await this._loadPatternsIntoMemory();

    return { patternsImported, rulesImported, contextImported };
  }

  /**
   * Clear all learned patterns (reset learning)
   */
  async clearAllLearning() {
    await this.initialize();

    const tx = this.db.transaction([STORE_PATTERNS, STORE_RULES, STORE_CONTEXT], 'readwrite');
    await tx.objectStore(STORE_PATTERNS).clear();
    await tx.objectStore(STORE_RULES).clear();
    await tx.objectStore(STORE_CONTEXT).clear();
    await tx.done;

    this.learnedPatterns.clear();

    console.log('⚠️  All learning data cleared');
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Load patterns into memory for fast access
   * @private
   */
  async _loadPatternsIntoMemory() {
    const tx = this.db.transaction(STORE_PATTERNS, 'readonly');
    const patterns = await tx.store.getAll();
    await tx.done;

    this.learnedPatterns.clear();

    for (const pattern of patterns) {
      if (!this.learnedPatterns.has(pattern.field)) {
        this.learnedPatterns.set(pattern.field, []);
      }
      this.learnedPatterns.get(pattern.field).push(pattern);
    }

    console.log(`📚 Loaded ${patterns.length} patterns into memory`);
  }

  /**
   * Learn exact match patterns (repeated identical corrections)
   * @private
   */
  async _learnExactMatchPatterns(field, corrections) {
    const patterns = [];

    // Group corrections by original→corrected pair
    const pairs = {};
    for (const correction of corrections) {
      const key = `${correction.originalValue}→${correction.correctedValue}`;
      if (!pairs[key]) {
        pairs[key] = {
          original: correction.originalValue,
          corrected: correction.correctedValue,
          count: 0,
          contexts: [],
          pathologies: new Set()
        };
      }
      pairs[key].count++;
      if (correction.sourceContext) {
        pairs[key].contexts.push(correction.sourceContext);
      }
      if (correction.pathology) {
        pairs[key].pathologies.add(correction.pathology);
      }
    }

    // Create patterns for frequently repeated corrections
    for (const pair of Object.values(pairs)) {
      if (pair.count >= LEARNING_THRESHOLDS.MIN_CORRECTIONS_FOR_PATTERN) {
        const pattern = {
          field,
          type: PATTERN_TYPES.EXACT_MATCH,
          pattern: pair.original,
          replacement: pair.corrected,
          confidence: Math.min(0.95, 0.5 + (pair.count * 0.1)), // Higher confidence with more examples
          successCount: pair.count,
          failureCount: 0,
          pathology: pair.pathologies.size === 1 ? Array.from(pair.pathologies)[0] : null,
          enabled: true,
          createdAt: new Date().toISOString(),
          lastUsed: null,
          metadata: {
            learningSource: 'user_corrections',
            exampleCount: pair.count
          }
        };

        // Save to database
        const tx = this.db.transaction(STORE_PATTERNS, 'readwrite');
        const id = await tx.store.add(pattern);
        await tx.done;

        pattern.id = id;
        patterns.push(pattern);

        console.log(`✅ Learned exact match: "${pair.original}" → "${pair.corrected}" (${pair.count} examples)`);
      }
    }

    return patterns;
  }

  /**
   * Learn regex patterns (generalized patterns from similar corrections)
   * @private
   */
  async _learnRegexPatterns(field, corrections) {
    const patterns = [];

    // Look for patterns in corrected values
    // For example: "aspirin 81mg daily" → extract pattern: [drug] [dose] [frequency]

    const correctedValues = corrections.map(c => String(c.correctedValue));

    // Strategy: Find common structure
    const structureMap = this._analyzeStructure(correctedValues);

    for (const [structure, examples] of Object.entries(structureMap)) {
      if (examples.length >= LEARNING_THRESHOLDS.MIN_CORRECTIONS_FOR_PATTERN) {
        // Generate regex pattern
        const regexPattern = this._generateRegexFromStructure(structure, examples);

        if (regexPattern) {
          const pattern = {
            field,
            type: PATTERN_TYPES.REGEX,
            pattern: regexPattern,
            confidence: Math.min(0.85, 0.5 + (examples.length * 0.08)),
            successCount: examples.length,
            failureCount: 0,
            pathology: null,
            enabled: true,
            createdAt: new Date().toISOString(),
            lastUsed: null,
            metadata: {
              learningSource: 'user_corrections',
              exampleCount: examples.length,
              structure
            }
          };

          const tx = this.db.transaction(STORE_PATTERNS, 'readwrite');
          const id = await tx.store.add(pattern);
          await tx.done;

          pattern.id = id;
          patterns.push(pattern);

          console.log(`✅ Learned regex pattern for ${field}: ${regexPattern} (${examples.length} examples)`);
        }
      }
    }

    return patterns;
  }

  /**
   * Learn transformation rules (value mappings)
   * @private
   */
  async _learnTransformationRules(field, corrections) {
    const rules = [];

    // Find common transformations (e.g., "ASA" → "aspirin 81mg")
    const transformations = {};

    for (const correction of corrections) {
      const original = String(correction.originalValue).toLowerCase().trim();
      const corrected = String(correction.correctedValue);

      if (!transformations[original]) {
        transformations[original] = {
          from: original,
          to: new Set(),
          count: 0
        };
      }

      transformations[original].to.add(corrected);
      transformations[original].count++;
    }

    // Create rules for frequent transformations
    for (const transform of Object.values(transformations)) {
      if (transform.count >= 2 && transform.to.size === 1) {
        // Consistent transformation
        const rule = {
          field,
          type: 'transformation',
          from: transform.from,
          to: Array.from(transform.to)[0],
          count: transform.count,
          confidence: Math.min(0.9, 0.6 + (transform.count * 0.1)),
          createdAt: new Date().toISOString()
        };

        const tx = this.db.transaction(STORE_RULES, 'readwrite');
        await tx.store.add(rule);
        await tx.done;

        rules.push(rule);

        console.log(`✅ Learned transformation: "${rule.from}" → "${rule.to}"`);
      }
    }

    return rules;
  }

  /**
   * Learn contextual clues (what appears near correct values)
   * @private
   */
  async _learnContextualClues(field, corrections) {
    const clues = [];

    for (const correction of corrections) {
      if (!correction.sourceContext) continue;

      // Extract words surrounding the corrected value
      const context = correction.sourceContext;
      const value = String(correction.correctedValue);

      // Find value in context
      const index = context.indexOf(value);
      if (index === -1) continue;

      // Get preceding words (context clues)
      const precedingText = context.substring(Math.max(0, index - 50), index);
      const words = precedingText.split(/\s+/).filter(w => w.length > 2);

      if (words.length > 0) {
        const clue = {
          field,
          clueWords: words.slice(-3), // Last 3 words before value
          strength: 0.5,
          createdAt: new Date().toISOString()
        };

        const tx = this.db.transaction(STORE_CONTEXT, 'readwrite');
        await tx.store.add(clue);
        await tx.done;

        clues.push(clue);
      }
    }

    return clues;
  }

  /**
   * Prune weak patterns (low success rate)
   * @private
   */
  async _pruneWeakPatterns() {
    const tx = this.db.transaction(STORE_PATTERNS, 'readwrite');
    const patterns = await tx.store.getAll();

    let pruned = 0;

    for (const pattern of patterns) {
      const totalApplications = pattern.successCount + pattern.failureCount;

      if (totalApplications > 10) {
        const successRate = pattern.successCount / totalApplications;

        if (successRate < LEARNING_THRESHOLDS.SUCCESS_RATE_THRESHOLD) {
          // Disable weak patterns
          pattern.enabled = false;
          await tx.store.put(pattern);
          pruned++;
        }
      }
    }

    await tx.done;

    if (pruned > 0) {
      console.log(`🧹 Pruned ${pruned} weak patterns`);
    }
  }

  /**
   * Record pattern success
   * @private
   */
  async _recordPatternSuccess(patternId) {
    const tx = this.db.transaction(STORE_PATTERNS, 'readwrite');
    const pattern = await tx.store.get(patternId);

    if (pattern) {
      pattern.successCount++;
      pattern.lastUsed = new Date().toISOString();

      // Boost confidence slightly
      pattern.confidence = Math.min(0.99, pattern.confidence + 0.01);

      await tx.store.put(pattern);
    }

    await tx.done;
  }

  /**
   * Record pattern failure
   * @private
   */
  async _recordPatternFailure(patternId) {
    const tx = this.db.transaction(STORE_PATTERNS, 'readwrite');
    const pattern = await tx.store.get(patternId);

    if (pattern) {
      pattern.failureCount++;

      // Reduce confidence
      pattern.confidence = Math.max(0.1, pattern.confidence - 0.05);

      // Disable if too many failures
      const totalApplications = pattern.successCount + pattern.failureCount;
      const successRate = pattern.successCount / totalApplications;

      if (totalApplications > 5 && successRate < 0.5) {
        pattern.enabled = false;
      }

      await tx.store.put(pattern);
    }

    await tx.done;
  }

  /**
   * Apply regex pattern
   * @private
   */
  _applyRegexPattern(text, pattern) {
    try {
      const regex = new RegExp(pattern.pattern, 'gi');
      const match = text.match(regex);

      if (match) {
        return {
          value: match[0],
          matchQuality: 1.0
        };
      }
    } catch (error) {
      console.error('Invalid regex pattern:', pattern.pattern, error);
    }

    return null;
  }

  /**
   * Apply exact match pattern
   * @private
   */
  _applyExactMatchPattern(text, pattern) {
    const index = text.indexOf(pattern.pattern);

    if (index !== -1) {
      return {
        value: pattern.replacement,
        matchQuality: 1.0
      };
    }

    return null;
  }

  /**
   * Apply fuzzy match pattern
   * @private
   */
  _applyFuzzyMatchPattern(text, pattern) {
    // TODO: Implement fuzzy matching (Levenshtein distance, etc.)
    return null;
  }

  /**
   * Apply contextual pattern
   * @private
   */
  _applyContextualPattern(text, pattern) {
    // TODO: Implement contextual matching
    return null;
  }

  /**
   * Group corrections by field
   * @private
   */
  _groupByField(corrections) {
    return corrections.reduce((groups, correction) => {
      const field = correction.field || 'unknown';
      if (!groups[field]) {
        groups[field] = [];
      }
      groups[field].push(correction);
      return groups;
    }, {});
  }

  /**
   * Group by property
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
   * Analyze structure of values
   * @private
   */
  _analyzeStructure(values) {
    const structures = {};

    for (const value of values) {
      const structure = this._getStructure(value);
      if (!structures[structure]) {
        structures[structure] = [];
      }
      structures[structure].push(value);
    }

    return structures;
  }

  /**
   * Get structure signature of a value
   * @private
   */
  _getStructure(value) {
    // Convert value to structure (e.g., "aspirin 81mg daily" → "word number-unit word")
    return String(value)
      .replace(/\d+(\.\d+)?/g, 'NUM')
      .replace(/[a-z]+/gi, 'WORD')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Generate regex from structure
   * @private
   */
  _generateRegexFromStructure(structure, examples) {
    // Convert structure to regex
    // "WORD NUM-WORD WORD" → "\w+\s+\d+\s*\w+\s+\w+"
    let regex = structure
      .replace(/WORD/g, '\\w+')
      .replace(/NUM/g, '\\d+(?:\\.\\d+)?')
      .replace(/\s+/g, '\\s+');

    return regex;
  }
}

// Singleton instance
const learningEngine = new LearningEngine();

// Export singleton and convenience functions
export default learningEngine;

export const learnFromCorrections = (options) => learningEngine.learnFromCorrections(options);
export const getPatternsForField = (field, enabledOnly) => learningEngine.getPatternsForField(field, enabledOnly);
export const applyLearnedPatterns = (text, field, pathology) => learningEngine.applyLearnedPatterns(text, field, pathology);
export const recordPatternSuccess = (patternId) => learningEngine.recordPatternSuccess(patternId);
export const recordPatternFailure = (patternId) => learningEngine.recordPatternFailure(patternId);
export const getLearningStatistics = () => learningEngine.getStatistics();
export const exportLearning = () => learningEngine.exportLearning();
export const importLearning = (data) => learningEngine.importLearning(data);
export const clearAllLearning = () => learningEngine.clearAllLearning();
