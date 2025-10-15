/**
 * Negation Detection Utility
 * 
 * Detects negated medical concepts to prevent false positive extractions.
 * Uses NegEx algorithm adapted for clinical notes.
 * 
 * Examples:
 * - "no evidence of vasospasm" → vasospasm is NEGATED
 * - "denies headache" → headache is NEGATED
 * - "patient has no focal deficits" → focal deficits are NEGATED
 */

/**
 * Negation triggers (words/phrases that indicate negation)
 * Organized by scope (how many words after trigger are affected)
 */
const NEGATION_TRIGGERS = {
  // Pre-negation (negates concepts that follow)
  pre: {
    immediate: [
      'no', 'not', 'without', 'denies', 'denied', 'negative for',
      'absence of', 'absent', 'free of', 'ruled out', 'rules out'
    ],
    extended: [
      'no evidence of', 'no signs of', 'no symptoms of',
      'did not', 'does not', 'cannot', 'unable to',
      'fails to', 'failed to', 'never', 'neither'
    ]
  },
  
  // Post-negation (negates concepts that precede)
  post: {
    immediate: [
      'unlikely', 'ruled out', 'was ruled out', 'is ruled out',
      'not present', 'not seen', 'not noted', 'not observed'
    ]
  },
  
  // Pseudo-negation (looks like negation but isn't)
  pseudo: [
    'not only', 'no increase', 'no change', 'no longer',
    'not certain', 'not sure', 'no significant change'
  ]
};

/**
 * Negation scope terminators (words that end negation scope)
 */
const SCOPE_TERMINATORS = [
  'but', 'however', 'although', 'except', 'besides',
  'yet', 'though', 'still', 'nevertheless'
];

/**
 * Check if a medical concept is negated in the given text
 * 
 * @param {string} concept - Medical concept to check (e.g., "vasospasm", "headache")
 * @param {string} text - Text containing the concept
 * @param {Object} options - Detection options
 * @returns {Object} { isNegated: boolean, trigger: string, confidence: number }
 */
export const isConceptNegated = (concept, text, options = {}) => {
  const {
    windowSize = 6, // Number of words to check before/after concept
    caseSensitive = false
  } = options;
  
  // Normalize text
  const normalizedText = caseSensitive ? text : text.toLowerCase();
  const normalizedConcept = caseSensitive ? concept : concept.toLowerCase();
  
  // Find concept position
  const conceptIndex = normalizedText.indexOf(normalizedConcept);
  if (conceptIndex === -1) {
    return { isNegated: false, trigger: null, confidence: 0 };
  }
  
  // Extract window around concept
  const beforeText = normalizedText.substring(Math.max(0, conceptIndex - 100), conceptIndex);
  const afterText = normalizedText.substring(conceptIndex + normalizedConcept.length, conceptIndex + normalizedConcept.length + 100);
  
  // Split into words
  const beforeWords = beforeText.trim().split(/\s+/).slice(-windowSize);
  const afterWords = afterText.trim().split(/\s+/).slice(0, windowSize);
  
  // Check for pseudo-negation first (these override real negation)
  for (const pseudo of NEGATION_TRIGGERS.pseudo) {
    if (beforeText.includes(pseudo) || afterText.includes(pseudo)) {
      return { isNegated: false, trigger: pseudo, confidence: 0.9, reason: 'pseudo-negation' };
    }
  }
  
  // Check for pre-negation triggers (before concept)
  for (const trigger of NEGATION_TRIGGERS.pre.immediate) {
    if (beforeWords.includes(trigger)) {
      // Check if scope is terminated
      const triggerIndex = beforeWords.indexOf(trigger);
      const betweenWords = beforeWords.slice(triggerIndex + 1);
      const hasTerminator = betweenWords.some(word => SCOPE_TERMINATORS.includes(word));
      
      if (!hasTerminator) {
        return { isNegated: true, trigger, confidence: 0.95, position: 'pre' };
      }
    }
  }
  
  // Check for extended pre-negation triggers (phrases)
  for (const trigger of NEGATION_TRIGGERS.pre.extended) {
    if (beforeText.includes(trigger)) {
      const triggerPos = beforeText.lastIndexOf(trigger);
      const betweenText = beforeText.substring(triggerPos + trigger.length);
      const hasTerminator = SCOPE_TERMINATORS.some(term => betweenText.includes(term));
      
      if (!hasTerminator) {
        return { isNegated: true, trigger, confidence: 0.9, position: 'pre' };
      }
    }
  }
  
  // Check for post-negation triggers (after concept)
  for (const trigger of NEGATION_TRIGGERS.post.immediate) {
    if (afterWords.includes(trigger) || afterText.includes(trigger)) {
      return { isNegated: true, trigger, confidence: 0.85, position: 'post' };
    }
  }
  
  return { isNegated: false, trigger: null, confidence: 0 };
};

/**
 * Filter extracted values to remove negated concepts
 * 
 * @param {Array} extractedValues - Array of extracted values with source text
 * @param {string} sourceText - Full source text
 * @returns {Array} Filtered values with negation flags
 */
export const filterNegatedConcepts = (extractedValues, sourceText) => {
  return extractedValues.map(item => {
    const negationCheck = isConceptNegated(item.value, sourceText);
    
    return {
      ...item,
      isNegated: negationCheck.isNegated,
      negationTrigger: negationCheck.trigger,
      negationConfidence: negationCheck.confidence,
      shouldExclude: negationCheck.isNegated && negationCheck.confidence > 0.8
    };
  }).filter(item => !item.shouldExclude);
};

/**
 * Check if a sentence contains negation
 * 
 * @param {string} sentence - Sentence to check
 * @returns {boolean} True if sentence contains negation
 */
export const sentenceContainsNegation = (sentence) => {
  const normalized = sentence.toLowerCase();
  
  // Check all negation triggers
  const allTriggers = [
    ...NEGATION_TRIGGERS.pre.immediate,
    ...NEGATION_TRIGGERS.pre.extended,
    ...NEGATION_TRIGGERS.post.immediate
  ];
  
  return allTriggers.some(trigger => normalized.includes(trigger));
};

/**
 * Extract affirmative and negative findings separately
 * 
 * @param {string} text - Clinical text
 * @param {Array} concepts - Medical concepts to extract
 * @returns {Object} { positive: [], negative: [] }
 */
export const extractWithNegation = (text, concepts) => {
  const results = {
    positive: [],
    negative: []
  };
  
  for (const concept of concepts) {
    // Find all occurrences of concept
    const regex = new RegExp(`\\b${concept}\\b`, 'gi');
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const contextStart = Math.max(0, match.index - 100);
      const contextEnd = Math.min(text.length, match.index + concept.length + 100);
      const context = text.substring(contextStart, contextEnd);
      
      const negationCheck = isConceptNegated(concept, context);
      
      if (negationCheck.isNegated) {
        results.negative.push({
          concept,
          context,
          trigger: negationCheck.trigger,
          confidence: negationCheck.confidence
        });
      } else {
        results.positive.push({
          concept,
          context,
          confidence: 1.0 - (negationCheck.confidence || 0)
        });
      }
    }
  }
  
  return results;
};

/**
 * Validate extracted complication against negation
 * 
 * @param {string} complication - Complication name
 * @param {string} sourceText - Source text
 * @returns {Object} Validation result
 */
export const validateComplicationExtraction = (complication, sourceText) => {
  const negationCheck = isConceptNegated(complication, sourceText);
  
  if (negationCheck.isNegated && negationCheck.confidence > 0.8) {
    return {
      valid: false,
      reason: `Complication "${complication}" appears to be negated (trigger: "${negationCheck.trigger}")`,
      confidence: negationCheck.confidence,
      recommendation: 'Exclude from complications list'
    };
  }
  
  return {
    valid: true,
    confidence: 1.0,
    recommendation: 'Include in complications list'
  };
};

/**
 * Enhanced extraction with negation awareness
 * Wrapper for existing extraction functions
 * 
 * @param {Function} extractionFn - Original extraction function
 * @param {string} text - Text to extract from
 * @param {Array} patterns - Extraction patterns
 * @returns {Object} Extraction results with negation filtering
 */
export const extractWithNegationAwareness = (extractionFn, text, patterns) => {
  // Run original extraction
  const rawResults = extractionFn(text, patterns);
  
  // Filter out negated results
  if (Array.isArray(rawResults)) {
    return rawResults.filter(result => {
      const negationCheck = isConceptNegated(result.value || result, text);
      return !negationCheck.isNegated || negationCheck.confidence < 0.7;
    });
  }
  
  return rawResults;
};

/**
 * Batch validate multiple concepts for negation
 *
 * @param {Array} concepts - Array of concepts to check
 * @param {string} text - Source text
 * @returns {Array} Results for each concept
 */
export const batchValidateNegation = (concepts, text) => {
  return concepts.map(concept => ({
    concept,
    ...isConceptNegated(concept, text)
  }));
};

/**
 * Get negation statistics for a document
 *
 * @param {string} text - Document text
 * @returns {Object} Statistics about negation usage
 */
export const getNegationStatistics = (text) => {
  const stats = {
    totalNegationTriggers: 0,
    byType: {
      pre: 0,
      post: 0,
      pseudo: 0
    },
    mostCommonTriggers: []
  };

  const normalized = text.toLowerCase();
  const triggerCounts = {};

  // Count all triggers
  const allTriggers = [
    ...NEGATION_TRIGGERS.pre.immediate,
    ...NEGATION_TRIGGERS.pre.extended,
    ...NEGATION_TRIGGERS.post.immediate
  ];

  for (const trigger of allTriggers) {
    const count = (normalized.match(new RegExp(trigger, 'g')) || []).length;
    if (count > 0) {
      triggerCounts[trigger] = count;
      stats.totalNegationTriggers += count;
    }
  }

  // Sort by frequency
  stats.mostCommonTriggers = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([trigger, count]) => ({ trigger, count }));

  return stats;
};

export default {
  isConceptNegated,
  filterNegatedConcepts,
  sentenceContainsNegation,
  extractWithNegation,
  validateComplicationExtraction,
  extractWithNegationAwareness,
  batchValidateNegation,
  getNegationStatistics
};

