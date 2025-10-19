/**
 * Semantic Deduplication - Backend Stub
 *
 * Provides minimal deduplication functionality.
 * Full implementation can be ported from frontend if needed.
 */

/**
 * Deduplicate entities by semantic similarity (stub)
 * Returns items as-is without deduplication
 */
const deduplicateBySemanticSimilarity = (items) => items;

/**
 * Get statistics about semantic deduplication
 * Returns proper structure to prevent "undefined → undefined" errors
 *
 * @param {Array} original - Original entities before deduplication
 * @param {Array} deduplicated - Deduplicated entities
 * @returns {Object} - Statistics object
 */
const getDeduplicationStats = (original = [], deduplicated = []) => {
  // Defensive checks
  const originalArray = Array.isArray(original) ? original : [];
  const deduplicatedArray = Array.isArray(deduplicated) ? deduplicated : [];

  const merged = deduplicatedArray.filter(e => e && e.merged);
  const references = deduplicatedArray.filter(e => e && e.temporalContext?.isReference);
  const newEvents = deduplicatedArray.filter(e => e && !e.temporalContext?.isReference);

  const reduction = originalArray.length - deduplicatedArray.length;
  const reductionPercent = originalArray.length > 0
    ? ((reduction / originalArray.length) * 100).toFixed(1)
    : '0.0';

  const mergedCount = merged.reduce((sum, e) => sum + (e.mergeCount || 1), 0);
  const avgMergeCount = merged.length > 0
    ? (mergedCount / merged.length).toFixed(1)
    : '0.0';

  return {
    original: originalArray.length,
    deduplicated: deduplicatedArray.length,
    reduction,
    reductionPercent,
    merged: merged.length,
    mergedCount,
    references: references.length,
    newEvents: newEvents.length,
    avgMergeCount
  };
};

module.exports = { deduplicateBySemanticSimilarity, getDeduplicationStats };
