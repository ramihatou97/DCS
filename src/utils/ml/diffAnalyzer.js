/**
 * Diff Analyzer for ML Learning
 * 
 * Analyzes differences between original and corrected text
 */

/**
 * Analyze diff between original and corrected text
 */
export const analyzeDiff = (original, corrected, context = null) => {
  if (!original || !corrected) return null;
  
  return {
    // Basic changes
    additions: findAdditions(original, corrected),
    deletions: findDeletions(original, corrected),
    modifications: findModifications(original, corrected),
    
    // Change statistics
    changeType: classifyChangeType(original, corrected),
    changeIntensity: calculateChangeIntensity(original, corrected),
    
    // Pattern analysis
    patternBefore: detectPattern(original),
    patternAfter: detectPattern(corrected),
    patternEvolution: analyzePatternEvolution(original, corrected),
    
    // Metadata
    timestamp: Date.now(),
    context: context
  };
};

/**
 * Find additions (text in corrected but not in original)
 */
const findAdditions = (original, corrected) => {
  const originalWords = new Set(tokenize(original));
  const correctedWords = tokenize(corrected);
  
  const additions = correctedWords.filter(word => !originalWords.has(word));
  
  return {
    words: additions,
    count: additions.length,
    examples: additions.slice(0, 5)
  };
};

/**
 * Find deletions (text in original but not in corrected)
 */
const findDeletions = (original, corrected) => {
  const originalWords = tokenize(original);
  const correctedWords = new Set(tokenize(corrected));
  
  const deletions = originalWords.filter(word => !correctedWords.has(word));
  
  return {
    words: deletions,
    count: deletions.length,
    examples: deletions.slice(0, 5)
  };
};

/**
 * Find modifications (structural changes)
 */
const findModifications = (original, corrected) => {
  const modifications = [];
  
  // Check for case changes
  if (original.toLowerCase() === corrected.toLowerCase() && original !== corrected) {
    modifications.push({ type: 'case_change', details: 'Capitalization modified' });
  }
  
  // Check for punctuation changes
  const originalPunct = extractPunctuation(original);
  const correctedPunct = extractPunctuation(corrected);
  if (originalPunct !== correctedPunct) {
    modifications.push({ type: 'punctuation_change', details: 'Punctuation modified' });
  }
  
  // Check for number changes
  const originalNums = extractNumbers(original);
  const correctedNums = extractNumbers(corrected);
  if (JSON.stringify(originalNums) !== JSON.stringify(correctedNums)) {
    modifications.push({ 
      type: 'number_change', 
      details: `Numbers changed from ${originalNums} to ${correctedNums}` 
    });
  }
  
  return modifications;
};

/**
 * Tokenize text
 */
const tokenize = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
};

/**
 * Extract punctuation
 */
const extractPunctuation = (text) => {
  return text.replace(/[^\W]/g, '');
};

/**
 * Extract numbers
 */
const extractNumbers = (text) => {
  const matches = text.match(/\d+(?:\.\d+)?/g);
  return matches || [];
};

/**
 * Classify change type
 */
const classifyChangeType = (original, corrected) => {
  const similarity = calculateSimilarity(original, corrected);
  
  if (similarity >= 0.9) return 'minor_edit';
  if (similarity >= 0.7) return 'moderate_edit';
  if (similarity >= 0.4) return 'major_edit';
  return 'complete_replacement';
};

/**
 * Calculate change intensity (0-1)
 */
const calculateChangeIntensity = (original, corrected) => {
  const originalLen = original.length;
  const correctedLen = corrected.length;
  const similarity = calculateSimilarity(original, corrected);
  
  // Consider both similarity and length change
  const lengthDiff = Math.abs(correctedLen - originalLen) / Math.max(originalLen, correctedLen, 1);
  const intensityFromSimilarity = 1 - similarity;
  const intensityFromLength = lengthDiff;
  
  return (intensityFromSimilarity * 0.7 + intensityFromLength * 0.3);
};

/**
 * Calculate simple similarity
 */
const calculateSimilarity = (text1, text2) => {
  const words1 = new Set(tokenize(text1));
  const words2 = new Set(tokenize(text2));
  
  const intersection = [...words1].filter(x => words2.has(x)).length;
  const union = new Set([...words1, ...words2]).size;
  
  return union > 0 ? intersection / union : 0;
};

/**
 * Detect pattern
 */
const detectPattern = (text) => {
  const patterns = [];
  
  if (/\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(text)) patterns.push('date');
  if (/\d+\s*(?:year|yo)/.test(text)) patterns.push('age');
  if (/\d+\s*(?:mm|cm|mg)/.test(text)) patterns.push('measurement');
  if (/(?:craniotomy|resection|biopsy)/.test(text)) patterns.push('procedure');
  
  return patterns;
};

/**
 * Analyze pattern evolution
 */
const analyzePatternEvolution = (original, corrected) => {
  const before = detectPattern(original);
  const after = detectPattern(corrected);
  
  return {
    before,
    after,
    added: after.filter(p => !before.includes(p)),
    removed: before.filter(p => !after.includes(p)),
    preserved: before.filter(p => after.includes(p))
  };
};

/**
 * Generate diff visualization
 */
export const generateDiffVisualization = (original, corrected) => {
  const originalWords = original.split(/\s+/);
  const correctedWords = corrected.split(/\s+/);
  
  const diff = [];
  let i = 0, j = 0;
  
  while (i < originalWords.length || j < correctedWords.length) {
    if (i >= originalWords.length) {
      diff.push({ type: 'addition', text: correctedWords[j] });
      j++;
    } else if (j >= correctedWords.length) {
      diff.push({ type: 'deletion', text: originalWords[i] });
      i++;
    } else if (originalWords[i] === correctedWords[j]) {
      diff.push({ type: 'unchanged', text: originalWords[i] });
      i++;
      j++;
    } else {
      // Check if next word matches
      if (i + 1 < originalWords.length && originalWords[i + 1] === correctedWords[j]) {
        diff.push({ type: 'deletion', text: originalWords[i] });
        i++;
      } else if (j + 1 < correctedWords.length && originalWords[i] === correctedWords[j + 1]) {
        diff.push({ type: 'addition', text: correctedWords[j] });
        j++;
      } else {
        diff.push({ type: 'modification', before: originalWords[i], after: correctedWords[j] });
        i++;
        j++;
      }
    }
  }
  
  return diff;
};

/**
 * Calculate diff metrics
 */
export const calculateDiffMetrics = (diff) => {
  const additions = diff.additions.count;
  const deletions = diff.deletions.count;
  const modifications = diff.modifications.length;
  
  const totalChanges = additions + deletions + modifications;
  
  return {
    totalChanges,
    additions,
    deletions,
    modifications,
    changeIntensity: diff.changeIntensity,
    changeType: diff.changeType
  };
};

export default {
  analyzeDiff,
  generateDiffVisualization,
  calculateDiffMetrics
};
