/**
 * Temporal Qualifier Extraction
 * 
 * Extracts temporal context for medical events and findings.
 * Helps distinguish between past, present, and future events.
 * 
 * Examples:
 * - "prior history of stroke" → PAST
 * - "currently on aspirin" → PRESENT
 * - "will follow up in clinic" → FUTURE
 * - "on admission" → ADMISSION_TIME
 * - "at discharge" → DISCHARGE_TIME
 */

/**
 * Temporal qualifier patterns
 */
export const TEMPORAL_QUALIFIERS = {
  // Past events
  past: {
    patterns: [
      /\b(?:prior|previous|past|history of|h\/o|hx of)\b/i,
      /\b(?:previously|formerly|earlier)\b/i,
      /\b(?:had|was|were)\b/i,
      /\b(?:before admission|prior to admission|pre-admission)\b/i,
      /\b(?:chronic|longstanding|long-standing)\b/i,
      /\b(?:\d+\s+(?:years?|months?|weeks?|days?)\s+ago)\b/i
    ],
    weight: 0.9,
    category: 'PAST'
  },
  
  // Present/current events
  present: {
    patterns: [
      /\b(?:current|currently|present|now|active)\b/i,
      /\b(?:is|are|has|have)\b/i,
      /\b(?:ongoing|continues|continuing)\b/i,
      /\b(?:at this time|at present)\b/i,
      /\b(?:today|this morning|this afternoon)\b/i
    ],
    weight: 0.85,
    category: 'PRESENT'
  },
  
  // Future events
  future: {
    patterns: [
      /\b(?:will|shall|plan to|planning to)\b/i,
      /\b(?:scheduled|to be scheduled)\b/i,
      /\b(?:follow[- ]?up|f\/u)\b/i,
      /\b(?:anticipated|expected)\b/i,
      /\b(?:on discharge|at discharge|upon discharge)\b/i
    ],
    weight: 0.8,
    category: 'FUTURE'
  },
  
  // Admission-specific
  admission: {
    patterns: [
      /\b(?:on admission|at admission|admission)\b/i,
      /\b(?:initially|initial|presenting)\b/i,
      /\b(?:on arrival|upon arrival)\b/i,
      /\b(?:in (?:the )?ED|in (?:the )?emergency)\b/i
    ],
    weight: 0.95,
    category: 'ADMISSION'
  },
  
  // Discharge-specific
  discharge: {
    patterns: [
      /\b(?:on discharge|at discharge|discharge)\b/i,
      /\b(?:final|final exam|final assessment)\b/i,
      /\b(?:at time of discharge)\b/i
    ],
    weight: 0.95,
    category: 'DISCHARGE'
  },
  
  // Post-operative
  postop: {
    patterns: [
      /\b(?:post-?op(?:erative)?|after surgery|following surgery)\b/i,
      /\b(?:POD|post-?operative day)\s*#?\s*\d+/i,
      /\b(?:immediately post-?op|in PACU)\b/i
    ],
    weight: 0.9,
    category: 'POSTOP'
  },
  
  // Pre-operative
  preop: {
    patterns: [
      /\b(?:pre-?op(?:erative)?|before surgery|prior to surgery)\b/i,
      /\b(?:baseline|pre-?surgical)\b/i
    ],
    weight: 0.9,
    category: 'PREOP'
  },
  
  // Acute/sudden onset
  acute: {
    patterns: [
      /\b(?:acute|sudden|abrupt|rapid)\b/i,
      /\b(?:new onset|newly|recent)\b/i,
      /\b(?:developed|began|started)\b/i
    ],
    weight: 0.85,
    category: 'ACUTE'
  },
  
  // Chronic/persistent
  chronic: {
    patterns: [
      /\b(?:chronic|persistent|ongoing|continued)\b/i,
      /\b(?:long-?standing|longstanding)\b/i,
      /\b(?:for (?:the past )?\d+\s+(?:years?|months?))\b/i
    ],
    weight: 0.85,
    category: 'CHRONIC'
  }
};

/**
 * Extract temporal qualifier for a medical concept
 * 
 * @param {string} concept - Medical concept
 * @param {string} text - Text containing the concept
 * @param {Object} options - Extraction options
 * @returns {Object} Temporal qualifier result
 */
export const extractTemporalQualifier = (concept, text, options = {}) => {
  const {
    windowSize = 50, // Characters before/after concept to check
    returnAll = false // Return all matches or just highest confidence
  } = options;
  
  // Find concept position
  const conceptIndex = text.toLowerCase().indexOf(concept.toLowerCase());
  if (conceptIndex === -1) {
    return { category: 'UNKNOWN', confidence: 0, matches: [] };
  }
  
  // Extract window around concept
  const start = Math.max(0, conceptIndex - windowSize);
  const end = Math.min(text.length, conceptIndex + concept.length + windowSize);
  const window = text.substring(start, end);
  
  // Check all temporal qualifiers
  const matches = [];
  
  for (const [type, config] of Object.entries(TEMPORAL_QUALIFIERS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(window)) {
        matches.push({
          category: config.category,
          type,
          confidence: config.weight,
          pattern: pattern.source,
          matchedText: window.match(pattern)?.[0]
        });
      }
    }
  }
  
  if (matches.length === 0) {
    return { category: 'PRESENT', confidence: 0.5, matches: [], reason: 'default' };
  }
  
  if (returnAll) {
    return { matches };
  }
  
  // Return highest confidence match
  matches.sort((a, b) => b.confidence - a.confidence);
  return matches[0];
};

/**
 * Categorize extracted data by temporal context
 * 
 * @param {Array} extractedItems - Array of extracted items with text
 * @param {string} sourceText - Full source text
 * @returns {Object} Categorized by temporal context
 */
export const categorizeByTemporalContext = (extractedItems, sourceText) => {
  const categorized = {
    PAST: [],
    PRESENT: [],
    FUTURE: [],
    ADMISSION: [],
    DISCHARGE: [],
    PREOP: [],
    POSTOP: [],
    ACUTE: [],
    CHRONIC: [],
    UNKNOWN: []
  };
  
  for (const item of extractedItems) {
    const temporal = extractTemporalQualifier(
      item.value || item.text || item,
      sourceText
    );
    
    const category = temporal.category || 'UNKNOWN';
    categorized[category].push({
      ...item,
      temporalContext: temporal
    });
  }
  
  return categorized;
};

/**
 * Determine if a finding is historical vs current
 * 
 * @param {string} finding - Medical finding
 * @param {string} text - Source text
 * @returns {Object} Classification result
 */
export const isHistoricalFinding = (finding, text) => {
  const temporal = extractTemporalQualifier(finding, text);
  
  const historicalCategories = ['PAST', 'CHRONIC', 'PREOP'];
  const currentCategories = ['PRESENT', 'ADMISSION', 'ACUTE', 'POSTOP'];
  
  if (historicalCategories.includes(temporal.category)) {
    return {
      isHistorical: true,
      confidence: temporal.confidence,
      category: temporal.category,
      recommendation: 'Include in past medical history, not active problems'
    };
  }
  
  if (currentCategories.includes(temporal.category)) {
    return {
      isHistorical: false,
      confidence: temporal.confidence,
      category: temporal.category,
      recommendation: 'Include in active problems/current status'
    };
  }
  
  return {
    isHistorical: null,
    confidence: 0.5,
    category: 'UNKNOWN',
    recommendation: 'Review manually - unclear temporal context'
  };
};

/**
 * Extract timeline with temporal qualifiers
 * 
 * @param {Array} events - Array of events
 * @param {string} sourceText - Source text
 * @returns {Array} Events with temporal context
 */
export const enrichEventsWithTemporalContext = (events, sourceText) => {
  return events.map(event => {
    const temporal = extractTemporalQualifier(
      event.description || event.text || event,
      sourceText,
      { returnAll: true }
    );
    
    return {
      ...event,
      temporalQualifiers: temporal.matches || [],
      primaryTemporal: temporal.matches?.[0] || { category: 'UNKNOWN', confidence: 0 },
      isHistorical: temporal.matches?.[0]?.category === 'PAST',
      isCurrent: ['PRESENT', 'ADMISSION', 'POSTOP'].includes(temporal.matches?.[0]?.category),
      isFuture: temporal.matches?.[0]?.category === 'FUTURE'
    };
  });
};

/**
 * Filter complications by temporal context
 * Excludes historical complications that are not active
 * 
 * @param {Array} complications - Extracted complications
 * @param {string} sourceText - Source text
 * @returns {Array} Filtered complications
 */
export const filterActiveComplications = (complications, sourceText) => {
  return complications.filter(comp => {
    const temporal = extractTemporalQualifier(comp.name || comp, sourceText);
    
    // Exclude if clearly historical
    if (temporal.category === 'PAST' && temporal.confidence > 0.8) {
      return false;
    }
    
    // Include if current or unclear
    return true;
  }).map(comp => ({
    ...comp,
    temporalContext: extractTemporalQualifier(comp.name || comp, sourceText)
  }));
};

/**
 * Separate baseline vs discharge status
 * 
 * @param {Object} extractedData - Extracted data
 * @param {string} sourceText - Source text
 * @returns {Object} { baseline: {}, discharge: {} }
 */
export const separateBaselineAndDischarge = (extractedData, sourceText) => {
  const result = {
    baseline: {},
    discharge: {},
    unclear: {}
  };
  
  for (const [key, value] of Object.entries(extractedData)) {
    if (!value) continue;
    
    const temporal = extractTemporalQualifier(
      JSON.stringify(value),
      sourceText
    );
    
    if (temporal.category === 'ADMISSION' || temporal.category === 'PREOP') {
      result.baseline[key] = { ...value, temporalContext: temporal };
    } else if (temporal.category === 'DISCHARGE' || temporal.category === 'POSTOP') {
      result.discharge[key] = { ...value, temporalContext: temporal };
    } else {
      result.unclear[key] = { ...value, temporalContext: temporal };
    }
  }
  
  return result;
};

export default {
  extractTemporalQualifier,
  categorizeByTemporalContext,
  isHistoricalFinding,
  enrichEventsWithTemporalContext,
  filterActiveComplications,
  separateBaselineAndDischarge,
  TEMPORAL_QUALIFIERS
};

