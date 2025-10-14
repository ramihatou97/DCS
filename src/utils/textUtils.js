/**
 * Text Processing Utilities
 * 
 * For cleaning, normalizing, and processing medical text
 */

/**
 * Normalize text for comparison (lowercase, remove extra whitespace, remove punctuation)
 */
export const normalizeText = (text) => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
};

/**
 * Clean and normalize medical text
 */
export const cleanText = (text) => {
  if (!text) return '';
  
  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\t/g, ' ') // Replace tabs with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
};

/**
 * Remove common medical note headers/footers
 */
export const removeBoilerplate = (text) => {
  if (!text) return '';
  
  // Remove common headers
  const patterns = [
    /^.*?(?:PROGRESS NOTE|ADMISSION NOTE|OPERATIVE NOTE|CONSULTATION NOTE)/im,
    /Electronically signed by.*/gi,
    /^Date:.*?\n/gm,
    /^Time:.*?\n/gm,
    /^Attending:.*?\n/gm,
    /^Resident:.*?\n/gm,
    /^Medical Record Number:.*?\n/gm,
    /^MRN:.*?\n/gm
  ];
  
  let cleaned = text;
  for (const pattern of patterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  return cleaned.trim();
};

/**
 * Split text into sentences intelligently (handles medical abbreviations)
 */
export const splitIntoSentences = (text) => {
  if (!text) return [];
  
  // Medical abbreviations that shouldn't trigger sentence breaks
  const abbreviations = [
    'Dr', 'Mr', 'Mrs', 'Ms', 'vs', 'etc', 'e.g', 'i.e',
    'POD', 'HD', 'POD', 'CT', 'MRI', 'EEG', 'LP'
  ];
  
  // Temporarily replace abbreviations
  let processed = text;
  abbreviations.forEach((abbr, index) => {
    const placeholder = `__ABBR${index}__`;
    processed = processed.replace(new RegExp(`${abbr}\\.`, 'g'), placeholder);
  });
  
  // Split on sentence terminators
  const sentences = processed.split(/[.!?]+\s+/);
  
  // Restore abbreviations
  return sentences.map(sentence => {
    let restored = sentence;
    abbreviations.forEach((abbr, index) => {
      const placeholder = `__ABBR${index}__`;
      restored = restored.replace(new RegExp(placeholder, 'g'), `${abbr}.`);
    });
    return restored.trim();
  }).filter(s => s.length > 0);
};

/**
 * Extract abbreviations with expansions
 */
export const extractAbbreviations = (text) => {
  const pattern = /\b([A-Z]{2,})\s*\(([^)]+)\)/g;
  const found = [];
  
  let match;
  while ((match = pattern.exec(text)) !== null) {
    found.push({
      abbreviation: match[1],
      expansion: match[2],
      position: match.index
    });
  }
  
  return found;
};

/**
 * Extract text between two markers
 */
export const extractTextBetween = (text, startMarker, endMarker) => {
  if (!text || !startMarker || !endMarker) return '';
  
  const startIndex = text.indexOf(startMarker);
  if (startIndex === -1) return '';
  
  const searchStart = startIndex + startMarker.length;
  const endIndex = text.indexOf(endMarker, searchStart);
  if (endIndex === -1) return '';
  
  return text.substring(searchStart, endIndex).trim();
};

/**
 * Calculate text similarity (Jaccard index)
 */
export const calculateSimilarity = (text1, text2) => {
  if (!text1 || !text2) return 0;
  
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
};

/**
 * Levenshtein distance (for fuzzy matching)
 */
export const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

/**
 * Check if texts are similar enough (configurable threshold)
 */
export const areTextsSimilar = (text1, text2, threshold = 0.85) => {
  const similarity = calculateSimilarity(text1, text2);
  return similarity >= threshold;
};

/**
 * Extract medical terms (capitalized phrases, abbreviations)
 */
export const extractMedicalTerms = (text) => {
  const terms = new Set();
  
  // Abbreviations (2+ capital letters)
  const abbrevs = text.match(/\b[A-Z]{2,}\b/g);
  if (abbrevs) {
    abbrevs.forEach(term => terms.add(term));
  }
  
  // Capitalized phrases (excluding sentence starts)
  const phrases = text.match(/(?<=[.!?]\s+)[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g);
  if (phrases) {
    phrases.forEach(term => terms.add(term));
  }
  
  return Array.from(terms);
};

/**
 * Highlight text segments for review
 */
export const highlightSegments = (text, segments) => {
  if (!segments || segments.length === 0) return text;
  
  let highlighted = text;
  
  // Sort segments by position (descending) to avoid offset issues
  const sorted = [...segments].sort((a, b) => b.start - a.start);
  
  for (const segment of sorted) {
    const before = highlighted.substring(0, segment.start);
    const content = highlighted.substring(segment.start, segment.end);
    const after = highlighted.substring(segment.end);
    
    highlighted = before + `<mark class="highlight-${segment.type}">${content}</mark>` + after;
  }
  
  return highlighted;
};

/**
 * Truncate text intelligently (at sentence boundaries)
 */
export const truncateText = (text, maxLength = 200) => {
  if (!text || text.length <= maxLength) return text;
  
  // Try to truncate at sentence boundary
  const sentences = splitIntoSentences(text);
  let result = '';
  
  for (const sentence of sentences) {
    if ((result + sentence).length > maxLength) {
      break;
    }
    result += sentence + '. ';
  }
  
  return result.trim() || text.substring(0, maxLength) + '...';
};

/**
 * Count words in text
 */
export const countWords = (text) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
};

/**
 * Count occurrences of a substring in text
 */
export const countOccurrences = (text, substring, caseSensitive = false) => {
  if (!text || !substring) return 0;
  
  const searchText = caseSensitive ? text : text.toLowerCase();
  const searchSubstring = caseSensitive ? substring : substring.toLowerCase();
  
  let count = 0;
  let position = 0;
  
  while ((position = searchText.indexOf(searchSubstring, position)) !== -1) {
    count++;
    position += searchSubstring.length;
  }
  
  return count;
};

/**
 * Estimate reading time (words per minute)
 */
export const estimateReadingTime = (text, wpm = 200) => {
  const words = countWords(text);
  const minutes = Math.ceil(words / wpm);
  return minutes;
};

/**
 * Normalize whitespace and formatting
 */
export const normalizeWhitespace = (text) => {
  if (!text) return '';
  
  return text
    .replace(/[ \t]+/g, ' ') // Multiple spaces/tabs to single space
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Multiple blank lines to double line break
    .trim();
};

/**
 * Extract numeric values with units
 */
export const extractNumericValues = (text) => {
  const pattern = /(\d+(?:\.\d+)?)\s*(mg|g|kg|ml|L|mm|cm|%|mmHg|units?)/gi;
  const found = [];
  
  let match;
  while ((match = pattern.exec(text)) !== null) {
    found.push({
      value: parseFloat(match[1]),
      unit: match[2],
      text: match[0],
      position: match.index
    });
  }
  
  return found;
};
