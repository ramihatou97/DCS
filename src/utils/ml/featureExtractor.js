/**
 * Feature Extractor for ML Learning
 * 
 * Extracts learning features from corrections and text for pattern learning
 */

/**
 * Extract features from a correction
 */
export const extractCorrectionFeatures = (original, corrected, context) => {
  if (!original || !corrected) return null;
  
  return {
    // Basic features
    originalValue: original,
    correctedValue: corrected,
    
    // Text characteristics
    originalLength: original.length,
    correctedLength: corrected.length,
    lengthDifference: corrected.length - original.length,
    
    // Word-level features
    originalWords: extractWords(original),
    correctedWords: extractWords(corrected),
    addedWords: getAddedWords(original, corrected),
    removedWords: getRemovedWords(original, corrected),
    
    // Pattern features
    originalPattern: detectPattern(original),
    correctedPattern: detectPattern(corrected),
    patternChange: detectPatternChange(original, corrected),
    
    // Context features
    surroundingContext: extractSurroundingContext(context, 50),
    contextPattern: detectContextPattern(context),
    contextKeywords: extractContextKeywords(context),
    
    // Structural features
    hasNumbers: /\d/.test(corrected),
    hasDate: /\d{1,2}[-/]\d{1,2}/.test(corrected),
    hasMedicalTerm: detectMedicalTerms(corrected).length > 0,
    hasAbbreviation: detectAbbreviations(corrected).length > 0,
    
    // Transformation type
    transformationType: detectTransformationType(original, corrected),
    
    // Confidence indicators
    certaintyIndicators: detectCertaintyIndicators(corrected),
    
    // Extraction metadata
    timestamp: Date.now(),
    extractionDifficulty: calculateExtractionDifficulty(context)
  };
};

/**
 * Extract words from text
 */
const extractWords = (text) => {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
};

/**
 * Get words added in correction
 */
const getAddedWords = (original, corrected) => {
  const originalWords = new Set(extractWords(original));
  const correctedWords = extractWords(corrected);
  
  return correctedWords.filter(word => !originalWords.has(word));
};

/**
 * Get words removed in correction
 */
const getRemovedWords = (original, corrected) => {
  const originalWords = extractWords(original);
  const correctedWords = new Set(extractWords(corrected));
  
  return originalWords.filter(word => !correctedWords.has(word));
};

/**
 * Detect pattern in text
 */
const detectPattern = (text) => {
  const patterns = [];
  
  // Number patterns
  if (/\b\d+\b/.test(text)) {
    patterns.push('number');
  }
  
  // Date patterns
  if (/\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(text)) {
    patterns.push('date');
  }
  
  // Age pattern
  if (/\d+\s*(?:year|yo|y\.o\.)/.test(text)) {
    patterns.push('age');
  }
  
  // Measurement pattern
  if (/\d+\s*(?:mm|cm|mg|ml|units?)/.test(text)) {
    patterns.push('measurement');
  }
  
  // Grade/scale pattern
  if (/(?:grade|score|scale)\s*[:\s]*\d+/.test(text)) {
    patterns.push('grade');
  }
  
  // Procedure pattern
  if (/(?:craniotomy|craniectomy|resection|biopsy|coiling|clipping)/.test(text)) {
    patterns.push('procedure');
  }
  
  // Medication pattern
  if (/\d+\s*(?:mg|mcg|units?)\s+(?:daily|BID|TID|QID|PRN)/.test(text)) {
    patterns.push('medication');
  }
  
  return patterns;
};

/**
 * Detect pattern change between original and corrected
 */
const detectPatternChange = (original, corrected) => {
  const originalPatterns = detectPattern(original);
  const correctedPatterns = detectPattern(corrected);
  
  return {
    added: correctedPatterns.filter(p => !originalPatterns.includes(p)),
    removed: originalPatterns.filter(p => !correctedPatterns.includes(p)),
    preserved: originalPatterns.filter(p => correctedPatterns.includes(p))
  };
};

/**
 * Extract surrounding context
 */
const extractSurroundingContext = (fullText, windowSize = 50) => {
  if (!fullText || fullText.length < windowSize * 2) {
    return fullText || '';
  }
  
  // Return window of text around the relevant portion
  const start = Math.max(0, fullText.length / 2 - windowSize);
  const end = Math.min(fullText.length, fullText.length / 2 + windowSize);
  
  return fullText.substring(start, end);
};

/**
 * Detect context pattern
 */
const detectContextPattern = (context) => {
  if (!context) return [];
  
  const patterns = [];
  const lowerContext = context.toLowerCase();
  
  // Section indicators
  if (/(?:history|presentation|admission)/.test(lowerContext)) {
    patterns.push('presentation_section');
  }
  if (/(?:procedure|operative|surgery)/.test(lowerContext)) {
    patterns.push('procedure_section');
  }
  if (/(?:evolution|progress|pod|post[- ]op)/.test(lowerContext)) {
    patterns.push('evolution_section');
  }
  if (/(?:discharge|disposition|follow[- ]up)/.test(lowerContext)) {
    patterns.push('discharge_section');
  }
  
  // Temporal indicators
  if (/(?:on|date|day|pod)\s+\d+/.test(lowerContext)) {
    patterns.push('temporal_reference');
  }
  
  return patterns;
};

/**
 * Extract context keywords
 */
const extractContextKeywords = (context) => {
  if (!context) return [];
  
  const keywords = [];
  const lowerContext = context.toLowerCase();
  
  // Medical keywords
  const medicalKeywords = [
    'patient', 'procedure', 'surgery', 'diagnosis', 'treatment',
    'medication', 'imaging', 'examination', 'history', 'presentation',
    'complication', 'outcome', 'discharge', 'follow-up'
  ];
  
  for (const keyword of medicalKeywords) {
    if (lowerContext.includes(keyword)) {
      keywords.push(keyword);
    }
  }
  
  return keywords;
};

/**
 * Detect medical terms
 */
const detectMedicalTerms = (text) => {
  const medicalTermPatterns = [
    /\b(?:craniotomy|craniectomy|resection|biopsy)\b/i,
    /\b(?:aneurysm|hemorrhage|tumor|lesion)\b/i,
    /\b(?:CT|MRI|CTA|DSA|angiography)\b/i,
    /\b(?:aspirin|clopidogrel|warfarin|apixaban)\b/i,
    /\b(?:SAH|GBM|EVD|VP shunt)\b/i
  ];
  
  const found = [];
  for (const pattern of medicalTermPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      found.push(...matches);
    }
  }
  
  return [...new Set(found)]; // Remove duplicates
};

/**
 * Detect abbreviations
 */
const detectAbbreviations = (text) => {
  // Match uppercase abbreviations (2-5 letters)
  const abbrevPattern = /\b[A-Z]{2,5}\b/g;
  const matches = text.match(abbrevPattern) || [];
  return [...new Set(matches)];
};

/**
 * Detect transformation type
 */
const detectTransformationType = (original, corrected) => {
  if (!original || !corrected) return 'unknown';
  
  const originalLower = original.toLowerCase();
  const correctedLower = corrected.toLowerCase();
  
  // Exact match (case change only)
  if (originalLower === correctedLower) return 'case_change';
  
  // Abbreviation expansion
  if (corrected.length > original.length * 1.5 && correctedLower.includes(originalLower)) {
    return 'abbreviation_expansion';
  }
  
  // Number extraction
  if (!/\d/.test(original) && /\d/.test(corrected)) {
    return 'number_extraction';
  }
  
  // Date formatting
  if (/\d/.test(original) && /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(corrected)) {
    return 'date_formatting';
  }
  
  // Complete replacement
  const similarity = calculateSimilarity(originalLower, correctedLower);
  if (similarity < 0.3) return 'complete_replacement';
  
  // Partial correction
  if (similarity >= 0.3 && similarity < 0.7) return 'partial_correction';
  
  // Minor correction
  if (similarity >= 0.7) return 'minor_correction';
  
  return 'transformation';
};

/**
 * Calculate simple text similarity
 */
const calculateSimilarity = (text1, text2) => {
  const words1 = new Set(extractWords(text1));
  const words2 = new Set(extractWords(text2));
  
  const intersection = [...words1].filter(w => words2.has(w)).length;
  const union = new Set([...words1, ...words2]).size;
  
  return union > 0 ? intersection / union : 0;
};

/**
 * Detect certainty indicators
 */
const detectCertaintyIndicators = (text) => {
  const indicators = {
    high: [],
    medium: [],
    low: []
  };
  
  const lowerText = text.toLowerCase();
  
  // High certainty
  if (/\b(?:confirmed|definite|documented)\b/.test(lowerText)) {
    indicators.high.push('confirmed');
  }
  
  // Medium certainty
  if (/\b(?:likely|probable|appears)\b/.test(lowerText)) {
    indicators.medium.push('probable');
  }
  
  // Low certainty
  if (/\b(?:possible|unclear|uncertain)\b/.test(lowerText)) {
    indicators.low.push('uncertain');
  }
  
  return indicators;
};

/**
 * Calculate extraction difficulty
 */
const calculateExtractionDifficulty = (context) => {
  if (!context) return 0.5;
  
  let difficulty = 0.3; // Base difficulty
  
  // Increase for longer context
  if (context.length > 500) difficulty += 0.1;
  if (context.length > 1000) difficulty += 0.1;
  
  // Increase for complex medical terms
  const medicalTerms = detectMedicalTerms(context);
  if (medicalTerms.length > 5) difficulty += 0.1;
  if (medicalTerms.length > 10) difficulty += 0.2;
  
  // Increase for many abbreviations
  const abbreviations = detectAbbreviations(context);
  if (abbreviations.length > 5) difficulty += 0.1;
  
  return Math.min(difficulty, 1.0);
};

/**
 * Extract features from imported summary
 */
export const extractSummaryFeatures = (summary) => {
  if (!summary) return null;
  
  return {
    // Basic metrics
    totalLength: summary.length,
    wordCount: extractWords(summary).length,
    sentenceCount: (summary.match(/[.!?]+/g) || []).length,
    
    // Structure
    sections: detectSections(summary),
    sectionCount: detectSections(summary).length,
    
    // Content analysis
    medicalTerms: detectMedicalTerms(summary),
    abbreviations: detectAbbreviations(summary),
    dates: extractDates(summary),
    numbers: extractNumbers(summary),
    
    // Style features
    avgSentenceLength: calculateAvgSentenceLength(summary),
    avgWordLength: calculateAvgWordLength(summary),
    
    // Temporal markers
    hasTimeline: /(?:POD|post[- ]operative day|day \d+)/i.test(summary),
    hasChronology: /(?:initially|subsequently|eventually|finally)/i.test(summary),
    
    timestamp: Date.now()
  };
};

/**
 * Detect sections in summary
 */
const detectSections = (text) => {
  const sections = [];
  const sectionPattern = /^([A-Z][A-Z\s]+)[:]/gm;
  let match;
  
  while ((match = sectionPattern.exec(text)) !== null) {
    sections.push({
      title: match[1].trim(),
      position: match.index
    });
  }
  
  return sections;
};

/**
 * Extract dates from text
 */
const extractDates = (text) => {
  const datePattern = /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/g;
  return text.match(datePattern) || [];
};

/**
 * Extract numbers from text
 */
const extractNumbers = (text) => {
  const numberPattern = /\b\d+(?:\.\d+)?\b/g;
  return text.match(numberPattern) || [];
};

/**
 * Calculate average sentence length
 */
const calculateAvgSentenceLength = (text) => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) return 0;
  
  const totalWords = sentences.reduce((sum, s) => sum + extractWords(s).length, 0);
  return totalWords / sentences.length;
};

/**
 * Calculate average word length
 */
const calculateAvgWordLength = (text) => {
  const words = extractWords(text);
  if (words.length === 0) return 0;
  
  const totalLength = words.reduce((sum, w) => sum + w.length, 0);
  return totalLength / words.length;
};

export default {
  extractCorrectionFeatures,
  extractSummaryFeatures,
  detectPattern,
  detectMedicalTerms,
  detectAbbreviations,
  calculateSimilarity
};
