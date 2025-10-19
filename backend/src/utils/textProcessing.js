/**
 * Text Processing Utilities
 * 
 * For cleaning, normalizing, and processing medical text
 */

/**
 * Normalize text for comparison (lowercase, remove extra whitespace, remove punctuation)
 */
const normalizeText = (text) => {
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
const cleanText = (text) => {
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
const removeBoilerplate = (text) => {
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
const splitIntoSentences = (text) => {
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
const extractAbbreviations = (text) => {
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
const extractTextBetween = (text, startMarker, endMarker) => {
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
const calculateSimilarity = (text1, text2) => {
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
const levenshteinDistance = (str1, str2) => {
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
const areTextsSimilar = (text1, text2, threshold = 0.85) => {
  const similarity = calculateSimilarity(text1, text2);
  return similarity >= threshold;
};

/**
 * Extract medical terms (capitalized phrases, abbreviations)
 */
const extractMedicalTerms = (text) => {
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
const highlightSegments = (text, segments) => {
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
const truncateText = (text, maxLength = 200) => {
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
const countWords = (text) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
};

/**
 * Count occurrences of a substring in text
 */
const countOccurrences = (text, substring, caseSensitive = false) => {
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
const estimateReadingTime = (text, wpm = 200) => {
  const words = countWords(text);
  const minutes = Math.ceil(words / wpm);
  return minutes;
};

/**
 * Normalize whitespace and formatting
 */
const normalizeWhitespace = (text) => {
  if (!text) return '';
  
  return text
    .replace(/[ \t]+/g, ' ') // Multiple spaces/tabs to single space
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Multiple blank lines to double line break
    .trim();
};

/**
 * Extract numeric values with units
 */
const extractNumericValues = (text) => {
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

/**
 * Escape special regex characters in a string
 * Used for creating regex patterns from user input
 */
const escapeRegExp = (string) => {
  if (!string) return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Advanced text preprocessing for variable-style clinical notes
 * Normalizes different formatting styles, timestamps, headers, and structure
 *
 * PHASE 1 STEP 4: Added abbreviation expansion support
 *
 * @param {string} text - Clinical note text
 * @param {object} options - Preprocessing options
 * @param {boolean} options.expandAbbreviations - Enable abbreviation expansion (default: false)
 * @param {string|string[]} options.pathology - Detected pathology types for context-aware expansion
 * @param {boolean} options.preserveOriginal - Keep original abbreviation in parentheses (default: true)
 * @param {boolean} options.institutionSpecific - Include institution-specific abbreviations (default: true)
 * @returns {string} Preprocessed text
 */
const preprocessClinicalNote = (text, options = {}) => {
  if (!text) return '';

  // Ensure text is a string (handle objects with content property)
  if (typeof text !== 'string') {
    if (text.content && typeof text.content === 'string') {
      text = text.content;
    } else {
      console.warn('preprocessClinicalNote received non-string input:', typeof text);
      return '';
    }
  }

  let processed = text;

  // 1. Normalize line endings
  processed = processed.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // 2. Normalize timestamps (various formats to YYYY-MM-DD HH:MM)
  // Handle formats like: 10/10/24 0847, 10/10/2024 08:47, Oct 10 2024 8:47am
  processed = processed.replace(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):?(\d{2})/g, (_match, m, d, y, h, min) => {
    const year = y.length === 2 ? '20' + y : y;
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')} ${h.padStart(2, '0')}:${min}`;
  });

  // 3. Normalize section headers (various styles)
  // e.g., "NEURO EXAM:", "Neuro Exam -", "**NEURO EXAM**", "===NEURO EXAM==="
  processed = processed.replace(/^[\s*=\-]*([A-Z][A-Z\s&/]+?)[\s*:=\-]*$/gm, (_match, header) => {
    return '\n' + header.trim() + ':\n';
  });
  
  // 4. Normalize bullet points and lists
  processed = processed.replace(/^[\s]*[•\-\*\+]\s+/gm, '- ');
  
  // 5. Normalize abbreviations (consistent spacing)
  // e.g., "C / O" -> "C/O", "s / p" -> "s/p"
  processed = processed.replace(/([A-Za-z])\s*\/\s*([A-Za-z])/g, '$1/$2');
  
  // 6. Normalize medical abbreviations case (common ones)
  const abbrevs = {
    'c/o': 'C/O',
    's/p': 'S/P',
    'w/': 'W/',
    'w/o': 'W/O',
    'h/o': 'H/O',
    'n/v': 'N/V',
    'a&o': 'A&O',
    'lol': 'LOL' // Level of alertness context
  };
  
  for (const [lower, upper] of Object.entries(abbrevs)) {
    const regex = new RegExp('\\b' + escapeRegExp(lower) + '\\b', 'gi');
    processed = processed.replace(regex, upper);
  }
  
  // 7. Normalize POD notation (Post-Operative Day)
  // Handle: POD #3, POD3, POD-3, post-op day 3
  processed = processed.replace(/(?:POD|post-?op(?:erative)?\s+day)\s*[#\-]?\s*(\d+)/gi, 'POD#$1');
  
  // 8. Normalize HD notation (Hospital Day)
  processed = processed.replace(/(?:HD|hospital\s+day)\s*[#\-]?\s*(\d+)/gi, 'HD#$1');
  
  // 9. Remove excessive whitespace while preserving structure
  processed = processed.replace(/[ \t]+/g, ' '); // Multiple spaces to single
  processed = processed.replace(/\n{4,}/g, '\n\n\n'); // Max 2 blank lines
  
  // 10. Trim each line
  processed = processed.split('\n').map(line => line.trim()).join('\n');

  // PHASE 1 STEP 4: Expand abbreviations with context awareness
  if (options.expandAbbreviations) {
    try {
      // Import abbreviation expansion function
      const { expandAbbreviationsInText } = require('./medicalAbbreviations.js');

      // Get pathology context (handle both string and array)
      const pathology = Array.isArray(options.pathology)
        ? options.pathology[0]
        : options.pathology;

      // Expand abbreviations with context
      processed = expandAbbreviationsInText(processed, {
        pathology,
        preserveOriginal: options.preserveOriginal !== false,
        institutionSpecific: options.institutionSpecific !== false
      });

      console.log('[OK] Abbreviations expanded with context awareness');
    } catch (error) {
      console.warn('[WARN]Abbreviation expansion failed, continuing without expansion:', error.message);
      // Continue without expansion - no breaking change
    }
  }

  return processed.trim();
};

/**
 * Segment clinical note into structured sections
 * Identifies common section headers and extracts content
 */
const segmentClinicalNote = (text) => {
  if (!text) return { sections: {}, unclassified: text };
  
  const sections = {};
  const sectionPatterns = {
    'chief_complaint': /(?:CHIEF COMPLAINT|CC|PRESENTING COMPLAINT):/i,
    'history_present_illness': /(?:HISTORY OF PRESENT ILLNESS|HPI|PRESENT ILLNESS):/i,
    'past_medical_history': /(?:PAST MEDICAL HISTORY|PMH|MEDICAL HISTORY):/i,
    'medications': /(?:MEDICATIONS|MEDS|HOME MEDICATIONS):/i,
    'allergies': /(?:ALLERGIES|ALLERGY):/i,
    'physical_exam': /(?:PHYSICAL EXAM|EXAMINATION|EXAM):/i,
    'neuro_exam': /(?:NEURO(?:LOGICAL)? EXAM):/i,
    'assessment': /(?:ASSESSMENT|A&P|IMPRESSION):/i,
    'plan': /(?:PLAN|MANAGEMENT|DISPOSITION):/i,
    'imaging': /(?:IMAGING|RADIOLOGY|CT|MRI):/i,
    'labs': /(?:LABS|LABORATORY|LAB RESULTS):/i,
    'procedures': /(?:PROCEDURE|OPERATION|OPERATIVE):/i,
    'complications': /(?:COMPLICATIONS|COMPLICATIONS?|ADVERSE EVENTS):/i,
    'discharge': /(?:DISCHARGE|DC|DISPOSITION):/i,
    'follow_up': /(?:FOLLOW-?UP|F\/U|FOLLOW UP PLAN):/i
  };
  
  // Find all section headers with their positions
  const foundSections = [];
  for (const [sectionName, pattern] of Object.entries(sectionPatterns)) {
    const match = text.match(pattern);
    if (match) {
      foundSections.push({
        name: sectionName,
        start: match.index,
        headerLength: match[0].length
      });
    }
  }
  
  // Sort by position
  foundSections.sort((a, b) => a.start - b.start);
  
  // Extract content for each section
  for (let i = 0; i < foundSections.length; i++) {
    const current = foundSections[i];
    const next = foundSections[i + 1];
    
    const contentStart = current.start + current.headerLength;
    const contentEnd = next ? next.start : text.length;
    
    sections[current.name] = text.substring(contentStart, contentEnd).trim();
  }
  
  // Extract unclassified content (before first section)
  const unclassified = foundSections.length > 0 
    ? text.substring(0, foundSections[0].start).trim()
    : text;
  
  return { sections, unclassified };
};

/**
 * Detect and normalize temporal references
 * Converts relative dates to structured format
 */
const extractTemporalReferences = (text) => {
  if (!text) return [];
  
  const references = [];
  
  // Absolute dates: MM/DD/YY, MM/DD/YYYY
  const absolutePattern = /(\d{1,2}\/\d{1,2}\/\d{2,4})/g;
  let match;
  while ((match = absolutePattern.exec(text)) !== null) {
    references.push({
      type: 'absolute',
      text: match[1],
      position: match.index,
      context: text.substring(Math.max(0, match.index - 20), Math.min(text.length, match.index + match[0].length + 20))
    });
  }
  
  // Relative dates: POD#3, HD#5, "3 days ago", "yesterday"
  const relativePatterns = [
    { pattern: /POD#?(\d+)/gi, type: 'pod' },
    { pattern: /HD#?(\d+)/gi, type: 'hd' },
    { pattern: /(\d+)\s+days?\s+ago/gi, type: 'days_ago' },
    { pattern: /(\d+)\s+weeks?\s+ago/gi, type: 'weeks_ago' },
    { pattern: /yesterday/gi, type: 'yesterday' },
    { pattern: /today/gi, type: 'today' },
    { pattern: /this\s+morning/gi, type: 'this_morning' },
    { pattern: /this\s+afternoon/gi, type: 'this_afternoon' },
    { pattern: /tonight/gi, type: 'tonight' }
  ];
  
  for (const { pattern, type } of relativePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      references.push({
        type: 'relative',
        subtype: type,
        text: match[0],
        value: match[1] || null,
        position: match.index,
        context: text.substring(Math.max(0, match.index - 20), Math.min(text.length, match.index + match[0].length + 20))
      });
    }
  }
  
  return references.sort((a, b) => a.position - b.position);
};

/**
 * Remove duplicate sentences/phrases across multiple notes
 * Uses semantic similarity for robust deduplication
 */
const deduplicateContent = (texts, similarityThreshold = 0.85) => {
  if (!texts || texts.length === 0) return [];
  if (texts.length === 1) return texts;
  
  const allSentences = [];
  
  // Extract sentences from each text with source tracking
  texts.forEach((text, textIndex) => {
    const sentences = splitIntoSentences(text);
    sentences.forEach(sentence => {
      if (sentence.length > 10) { // Filter out very short sentences
        allSentences.push({
          text: sentence,
          normalized: normalizeText(sentence),
          sourceIndex: textIndex,
          isDuplicate: false
        });
      }
    });
  });
  
  // Mark duplicates
  for (let i = 0; i < allSentences.length; i++) {
    if (allSentences[i].isDuplicate) continue;
    
    for (let j = i + 1; j < allSentences.length; j++) {
      if (allSentences[j].isDuplicate) continue;
      
      // Check similarity
      const similarity = calculateSimilarity(
        allSentences[i].normalized,
        allSentences[j].normalized
      );
      
      if (similarity >= similarityThreshold) {
        allSentences[j].isDuplicate = true;
      }
    }
  }
  
  // Reconstruct texts without duplicates
  const deduplicatedTexts = texts.map(() => []);
  
  allSentences.forEach(sentence => {
    if (!sentence.isDuplicate) {
      deduplicatedTexts[sentence.sourceIndex].push(sentence.text);
    }
  });
  
  return deduplicatedTexts.map(sentences => sentences.join('. ') + '.');
};

/**
 * Extract structured medical events from text
 * Identifies procedures, complications, interventions
 */
const extractMedicalEvents = (text) => {
  if (!text) return [];
  
  const events = [];
  
  // Event patterns with contextual keywords
  const eventPatterns = [
    {
      type: 'procedure',
      patterns: [
        /(?:underwent|performed|completed)\s+([^.]+?procedure[^.]*)/gi,
        /(?:EVD|craniotomy|coiling|clipping|surgery|operation)[^.]*performed/gi,
        /PROCEDURE:\s*([^.\n]+)/gi
      ]
    },
    {
      type: 'complication',
      patterns: [
        /(?:complicated by|developed|c\/b)\s+([^.]+)/gi,
        /(?:vasospasm|hydrocephalus|infection|hemorrhage|stroke)\s+(?:noted|detected|developed)/gi
      ]
    },
    {
      type: 'intervention',
      patterns: [
        /(?:started|initiated|began)\s+([^.]+therapy|[^.]+treatment)/gi,
        /(?:given|administered)\s+([^.]+)/gi
      ]
    }
  ];
  
  for (const { type, patterns } of eventPatterns) {
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        events.push({
          type,
          text: match[0],
          details: match[1] || match[0],
          position: match.index
        });
      }
    }
  }
  
  return events.sort((a, b) => a.position - b.position);
};

/**
 * Identify and normalize medical abbreviations in context
 * Returns expanded forms when context allows
 */
const expandMedicalAbbreviations = (text, abbreviationDict = {}) => {
  if (!text) return text;
  
  let expanded = text;
  
  // Common medical abbreviations with context-aware expansions
  const contextualAbbrevs = {
    'HA': { expanded: 'headache', context: /\b(?:severe|sudden|worst|throbbing)\s+HA\b/i },
    'LOC': { expanded: 'loss of consciousness', context: /\bLOC\b(?!\s+hours)/i },
    'SOB': { expanded: 'shortness of breath', context: /\bSOB\b/i },
    'CP': { expanded: 'chest pain', context: /\bCP\b(?!\s*aneurysm)/i },
    'N\/V': { expanded: 'nausea and vomiting', context: null },
    'S\/P': { expanded: 'status post', context: null },
    'C\/O': { expanded: 'complaining of', context: null },
    'W\/': { expanded: 'with', context: null },
    'W\/O': { expanded: 'without', context: null }
  };
  
  for (const [abbrev, { expanded: exp, context }] of Object.entries(contextualAbbrevs)) {
    if (context) {
      // Context-dependent expansion
      expanded = expanded.replace(context, (match) => {
        return match.replace(new RegExp('\\b' + escapeRegExp(abbrev) + '\\b', 'g'), exp);
      });
    } else {
      // Always expand
      const regex = new RegExp('\\b' + escapeRegExp(abbrev) + '\\b', 'g');
      expanded = expanded.replace(regex, exp);
    }
  }
  
  // Apply custom dictionary
  for (const [abbrev, expansion] of Object.entries(abbreviationDict)) {
    const regex = new RegExp('\\b' + escapeRegExp(abbrev) + '\\b', 'g');
    expanded = expanded.replace(regex, expansion);
  }
  
  return expanded;
};

module.exports = {
  normalizeText,
  cleanText,
  removeBoilerplate,
  splitIntoSentences,
  extractAbbreviations,
  extractTextBetween,
  calculateSimilarity,
  levenshteinDistance,
  areTextsSimilar,
  extractMedicalTerms,
  highlightSegments,
  truncateText,
  countWords,
  countOccurrences,
  estimateReadingTime,
  normalizeWhitespace,
  extractNumericValues,
  escapeRegExp,
  preprocessClinicalNote,
  segmentClinicalNote,
  extractTemporalReferences,
  deduplicateContent,
  extractMedicalEvents,
  expandMedicalAbbreviations
};
