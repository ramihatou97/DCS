/**
 * Medical Writing Style Consistency
 * 
 * Phase 3 Step 2: Enforce consistent medical writing style
 * 
 * Purpose:
 * - Apply consistent tense rules (past for history, present for status)
 * - Enforce voice rules (active vs passive)
 * - Handle abbreviations consistently (expand first mention)
 * - Format numbers and dates consistently
 * - Maintain professional medical tone
 * 
 * @module medicalWritingStyle
 */

/**
 * Medical writing rules
 */
const MEDICAL_WRITING_RULES = {
  // Tense rules by section
  tense: {
    presentation: 'PAST',           // "Patient presented with..."
    history: 'PAST',                // "Patient had a history of..."
    hospitalCourse: 'PAST',         // "Patient underwent..."
    procedures: 'PAST',             // "Craniotomy was performed..."
    complications: 'PAST',          // "Patient developed..."
    dischargeStatus: 'PRESENT',     // "Patient is ambulatory..."
    dischargeMedications: 'PRESENT', // "Patient is prescribed..."
    followUp: 'FUTURE'              // "Patient will follow up..."
  },
  
  // Voice rules
  voice: {
    default: 'ACTIVE',              // "Surgeon performed craniotomy"
    procedures: 'PASSIVE_OK',       // "Craniotomy was performed" (acceptable)
    complications: 'PASSIVE_OK',    // "Vasospasm was noted" (acceptable)
    medications: 'ACTIVE'           // "Patient takes aspirin"
  },
  
  // Abbreviation rules
  abbreviations: {
    firstMention: 'EXPAND',         // "subarachnoid hemorrhage (SAH)"
    subsequent: 'ABBREVIATE'        // "SAH"
  },
  
  // Number formatting rules
  numbers: {
    dates: 'SPELL_OUT',             // "October 1, 2025" not "10/1/25"
    measurements: 'NUMERIC',        // "5mm" not "five millimeters"
    grades: 'NUMERIC',              // "Grade 3" not "Grade III"
    ages: 'NUMERIC',                // "65 years old" not "sixty-five"
    scores: 'NUMERIC'               // "GCS 15" not "GCS fifteen"
  },
  
  // Capitalization rules
  capitalization: {
    sentences: 'CAPITALIZE_FIRST',
    properNouns: 'CAPITALIZE',
    abbreviations: 'UPPERCASE',     // "SAH" not "sah"
    medications: 'CAPITALIZE_FIRST' // "Aspirin" not "ASPIRIN"
  }
};

/**
 * Apply medical writing style to text
 * 
 * @param {string} text - Text to style
 * @param {string} section - Section type (presentation, hospitalCourse, etc.)
 * @param {Object} options - Styling options
 * @returns {string} Styled text
 */
function applyMedicalWritingStyle(text, section = 'hospitalCourse', options = {}) {
  if (!text) return '';
  
  try {
    let styled = text;
    
    // Apply tense rules
    if (options.applyTense !== false) {
      const targetTense = MEDICAL_WRITING_RULES.tense[section] || 'PAST';
      styled = applyTenseRules(styled, targetTense);
    }
    
    // Apply abbreviation rules
    if (options.handleAbbreviations !== false) {
      styled = handleAbbreviations(styled);
    }
    
    // Apply number formatting
    if (options.formatNumbers !== false) {
      styled = formatNumbers(styled, section);
    }
    
    // Apply capitalization rules
    if (options.applyCapitalization !== false) {
      styled = applyCapitalization(styled);
    }
    
    // Clean up spacing and punctuation
    styled = cleanupFormatting(styled);
    
    return styled;
    
  } catch (error) {
    console.error('[Medical Writing Style] Error applying style:', error);
    return text;
  }
}

/**
 * Apply tense rules to text
 */
function applyTenseRules(text, targetTense) {
  // This is a simplified implementation
  // Full implementation would use NLP for accurate tense conversion
  
  if (targetTense === 'PAST') {
    // Convert present tense verbs to past tense (common medical verbs)
    text = text.replace(/\b(is|are)\b/g, 'was');
    text = text.replace(/\bhas\b/g, 'had');
    text = text.replace(/\bhave\b/g, 'had');
    text = text.replace(/\bpresents\b/g, 'presented');
    text = text.replace(/\bundergoes\b/g, 'underwent');
    text = text.replace(/\breceives\b/g, 'received');
    text = text.replace(/\bdevelops\b/g, 'developed');
  } else if (targetTense === 'PRESENT') {
    // Keep present tense or convert to present
    text = text.replace(/\bwas\b/g, 'is');
    text = text.replace(/\bwere\b/g, 'are');
    text = text.replace(/\bhad\b/g, 'has');
  } else if (targetTense === 'FUTURE') {
    // Add "will" for future tense
    text = text.replace(/\b(patient|pt)\s+(follows?|returns?|sees?)\b/gi, '$1 will $2');
  }
  
  return text;
}

/**
 * Handle abbreviations consistently
 */
function handleAbbreviations(text) {
  // Track which abbreviations have been used
  const usedAbbreviations = new Set();
  
  // Common medical abbreviations
  const abbreviations = {
    'SAH': 'subarachnoid hemorrhage',
    'EVD': 'external ventricular drain',
    'ICU': 'intensive care unit',
    'OR': 'operating room',
    'POD': 'post-operative day',
    'GCS': 'Glasgow Coma Scale',
    'mRS': 'modified Rankin Scale',
    'CT': 'computed tomography',
    'MRI': 'magnetic resonance imaging',
    'TBI': 'traumatic brain injury'
  };
  
  // For each abbreviation, expand first mention
  for (const [abbrev, expansion] of Object.entries(abbreviations)) {
    const regex = new RegExp(`\\b${abbrev}\\b`, 'g');
    let firstMatch = true;
    
    text = text.replace(regex, (match) => {
      if (firstMatch && !usedAbbreviations.has(abbrev)) {
        firstMatch = false;
        usedAbbreviations.add(abbrev);
        return `${expansion} (${abbrev})`;
      }
      return match;
    });
  }
  
  return text;
}

/**
 * Format numbers consistently
 */
function formatNumbers(text, section) {
  // Format dates (convert numeric dates to spelled out)
  text = text.replace(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/g, (match, month, day, year) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = months[parseInt(month) - 1] || month;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${monthName} ${parseInt(day)}, ${fullYear}`;
  });
  
  // Ensure measurements are numeric with units
  text = text.replace(/\b(five|ten|fifteen|twenty)\s*(mm|cm|mg|ml)\b/gi, (match, number, unit) => {
    const numMap = {
      'five': '5',
      'ten': '10',
      'fifteen': '15',
      'twenty': '20'
    };
    return `${numMap[number.toLowerCase()]}${unit}`;
  });
  
  // Format grades consistently
  text = text.replace(/\bGrade\s+(I{1,3}|IV|V)\b/g, (match, roman) => {
    const romanToArabic = {
      'I': '1',
      'II': '2',
      'III': '3',
      'IV': '4',
      'V': '5'
    };
    return `Grade ${romanToArabic[roman] || roman}`;
  });
  
  return text;
}

/**
 * Apply capitalization rules
 */
function applyCapitalization(text) {
  // Capitalize first letter of sentences
  text = text.replace(/(^|[.!?]\s+)([a-z])/g, (match, punctuation, letter) => {
    return punctuation + letter.toUpperCase();
  });
  
  // Ensure common abbreviations are uppercase
  const abbreviations = ['sah', 'evd', 'icu', 'or', 'pod', 'gcs', 'mrs', 'ct', 'mri', 'tbi'];
  for (const abbrev of abbreviations) {
    const regex = new RegExp(`\\b${abbrev}\\b`, 'gi');
    text = text.replace(regex, abbrev.toUpperCase());
  }
  
  // Capitalize medication names (first letter only)
  text = text.replace(/\b(aspirin|nimodipine|keppra|levetiracetam|phenytoin|warfarin|heparin)\b/gi, (match) => {
    return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
  });
  
  return text;
}

/**
 * Clean up formatting (spacing, punctuation)
 */
function cleanupFormatting(text) {
  // Remove multiple spaces
  text = text.replace(/\s+/g, ' ');
  
  // Fix spacing around punctuation
  text = text.replace(/\s+([.,;:!?])/g, '$1');
  text = text.replace(/([.,;:!?])([A-Za-z])/g, '$1 $2');
  
  // Ensure space after periods
  text = text.replace(/\.([A-Z])/g, '. $1');
  
  // Remove trailing spaces
  text = text.trim();
  
  return text;
}

/**
 * Convert text to past tense (helper function)
 */
function convertToPastTense(text) {
  return applyTenseRules(text, 'PAST');
}

/**
 * Convert text to present tense (helper function)
 */
function convertToPresentTense(text) {
  return applyTenseRules(text, 'PRESENT');
}

/**
 * Convert text to future tense (helper function)
 */
function convertToFutureTense(text) {
  return applyTenseRules(text, 'FUTURE');
}

/**
 * Validate medical writing style
 * Returns issues found in the text
 */
function validateMedicalWritingStyle(text, section = 'hospitalCourse') {
  const issues = [];
  
  try {
    // Check for inconsistent tense
    const hasPresentTense = /\b(is|are|has|have)\b/.test(text);
    const hasPastTense = /\b(was|were|had)\b/.test(text);
    const expectedTense = MEDICAL_WRITING_RULES.tense[section];
    
    if (expectedTense === 'PAST' && hasPresentTense && !hasPastTense) {
      issues.push({
        type: 'tense',
        message: `Section "${section}" should use past tense`,
        severity: 'warning'
      });
    }
    
    // Check for unexpanded abbreviations
    const commonAbbrevs = ['SAH', 'EVD', 'ICU', 'GCS', 'mRS'];
    for (const abbrev of commonAbbrevs) {
      const regex = new RegExp(`\\b${abbrev}\\b`);
      if (regex.test(text) && !text.includes(`(${abbrev})`)) {
        issues.push({
          type: 'abbreviation',
          message: `Abbreviation "${abbrev}" should be expanded on first use`,
          severity: 'info'
        });
      }
    }
    
    // Check for numeric dates
    if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(text)) {
      issues.push({
        type: 'date_format',
        message: 'Dates should be spelled out (e.g., "October 1, 2025")',
        severity: 'info'
      });
    }
    
    // Check for lowercase abbreviations
    if (/\b(sah|evd|icu|gcs|mrs)\b/.test(text)) {
      issues.push({
        type: 'capitalization',
        message: 'Medical abbreviations should be uppercase',
        severity: 'warning'
      });
    }
    
  } catch (error) {
    console.error('[Medical Writing Style] Error validating style:', error);
  }
  
  return issues;
}

module.exports = {
  applyMedicalWritingStyle,
  validateMedicalWritingStyle,
  convertToPastTense,
  convertToPresentTense,
  convertToFutureTense,
  MEDICAL_WRITING_RULES
};

