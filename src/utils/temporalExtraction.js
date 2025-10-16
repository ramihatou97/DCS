/**
 * Temporal Extraction Utilities
 *
 * Phase 1 Step 5: Multi-Value Extraction with Temporal Context
 *
 * Detects temporal context for medical entities:
 * - Identifies "s/p", "POD X", "status post" as references to past events
 * - Classifies mentions as new events vs. references
 * - Extracts and resolves relative dates
 * - Links references to actual events
 *
 * Critical for chronological intelligence:
 * "coiling mentioned 5 times" → 1 procedure + 4 references (not 5 procedures)
 */

import { parseFlexibleDate, normalizeDate } from './dateUtils.js';
import { extractTemporalQualifier } from './temporalQualifiers.js';

/**
 * Reference phrase patterns
 * Detects when entity mention is referencing a past event
 */
const REFERENCE_PATTERNS = {
  // "s/p" (status post) - MOST COMMON
  statusPost: /\b(s\/p|status\s+post)\s+/i,

  // POD (Post-Operative Day) references
  pod: /\b(POD[#\s]*\d+|post-?operative\s+day\s+\d+)\s+/i,

  // Post-operative/procedural references
  postOp: /\b(post-?operative|post-?op|post-?procedur[ae]|following|after)\s+/i,

  // Past tense indicators
  past: /\b(prior|previous|earlier|history\s+of|h\/o)\s+/i,

  // Temporal adverbs indicating past
  temporal: /\b(yesterday|last\s+week|days?\s+ago|weeks?\s+ago)\b/i,

  // Continuation phrases (indicate ongoing state from past event)
  continuation: /\b(continues|continued|ongoing|persistent)\s+(to|with|after)\s+/i
};

/**
 * New event indicators
 * These phrases suggest a NEW event, not a reference
 */
const NEW_EVENT_PATTERNS = {
  // Active verbs indicating current/new event
  active: /\b(underwent|receiving|taken\s+to|brought\s+to|performed|completed)\s+/i,

  // Temporal adverbs indicating present/recent
  present: /\b(today|this\s+morning|this\s+afternoon|tonight|now|currently|just\s+completed)\b/i,

  // Explicit date mentions (suggests specific new event)
  dated: /\b(on\s+\d{1,2}\/\d{1,2}|dated|performed\s+on)\b/i
};

/**
 * Detect reference phrases in context
 *
 * @param {string} context - Text context around entity mention (±100 chars)
 * @returns {Object} Reference detection result
 *
 * @example
 * detectReferencePhrase("Patient s/p coiling doing well")
 * // Returns: { isReference: true, confidence: 0.95, type: 'status_post', pattern: 's/p' }
 *
 * detectReferencePhrase("Patient underwent coiling today")
 * // Returns: { isReference: false, confidence: 0.9, type: 'new_event', pattern: 'underwent' }
 */
export const detectReferencePhrase = (context) => {
  if (!context || typeof context !== 'string') {
    return {
      isReference: false,
      confidence: 0,
      type: 'unknown',
      pattern: null
    };
  }

  const lowerContext = context.toLowerCase();

  // Check for new event indicators FIRST (higher priority)
  for (const [type, pattern] of Object.entries(NEW_EVENT_PATTERNS)) {
    if (pattern.test(lowerContext)) {
      const match = lowerContext.match(pattern);
      return {
        isReference: false,
        confidence: 0.9,
        type: 'new_event',
        indicator: type,
        pattern: match ? match[0] : type
      };
    }
  }

  // Check for reference patterns
  for (const [type, pattern] of Object.entries(REFERENCE_PATTERNS)) {
    if (pattern.test(lowerContext)) {
      const match = lowerContext.match(pattern);

      // Higher confidence for explicit patterns
      let confidence = 0.8;
      if (type === 'statusPost') confidence = 0.95; // "s/p" is very reliable
      if (type === 'pod') confidence = 0.9; // POD# is very reliable

      return {
        isReference: true,
        confidence,
        type: type,
        pattern: match ? match[0].trim() : type
      };
    }
  }

  // No clear indicators - assume it's a new event (conservative)
  return {
    isReference: false,
    confidence: 0.5,
    type: 'ambiguous',
    pattern: null
  };
};

/**
 * Extract POD (Post-Operative Day) context from text
 *
 * @param {string} text - Full text or context
 * @param {number} position - Position of entity mention in text
 * @returns {Object} POD context information
 *
 * @example
 * extractPODContext("POD#3 s/p craniotomy doing well", 0)
 * // Returns: { pod: 3, confidence: 0.95, text: "POD#3", position: 0 }
 */
export const extractPODContext = (text, position = 0) => {
  if (!text) {
    return { pod: null, confidence: 0, text: null, position: null };
  }

  // Extract context window around position (±100 chars)
  const start = Math.max(0, position - 100);
  const end = Math.min(text.length, position + 100);
  const context = text.substring(start, end);

  // POD patterns (various formats)
  const podPatterns = [
    /POD[#\s]*(\d+)/i,
    /post-?operative\s+day\s+(\d+)/i,
    /post-?op\s+day\s+(\d+)/i,
    /HD[#\s]*(\d+)/i, // Hospital Day (sometimes used interchangeably)
  ];

  for (const pattern of podPatterns) {
    const match = context.match(pattern);
    if (match) {
      return {
        pod: parseInt(match[1]),
        confidence: 0.9,
        text: match[0],
        position: start + match.index,
        type: pattern.source.includes('HD') ? 'hospital_day' : 'postop_day'
      };
    }
  }

  return { pod: null, confidence: 0, text: null, position: null };
};

/**
 * Detect temporal context for an entity mention
 * Combines reference detection + POD extraction + temporal qualifiers
 *
 * @param {string} text - Full text
 * @param {string} entityName - Name of the entity (procedure, complication, etc.)
 * @param {number} entityPosition - Position in text where entity was mentioned
 * @returns {Object} Comprehensive temporal context
 *
 * @example
 * detectTemporalContext(text, "coiling", 150)
 * // Returns: {
 * //   isReference: true,
 * //   referenceType: 'status_post',
 * //   pod: 3,
 * //   category: 'POSTOPERATIVE',
 * //   confidence: 0.92
 * // }
 */
export const detectTemporalContext = (text, entityName, entityPosition) => {
  if (!text || !entityName) {
    return {
      isReference: false,
      referenceType: null,
      pod: null,
      category: 'UNKNOWN',
      confidence: 0
    };
  }

  // Extract context window
  const start = Math.max(0, entityPosition - 100);
  const end = Math.min(text.length, entityPosition + 100);
  const context = text.substring(start, end);

  // 1. Detect reference phrases
  const refDetection = detectReferencePhrase(context);

  // 2. Extract POD if present
  const podContext = extractPODContext(text, entityPosition);

  // 3. Get temporal qualifier category (ACUTE, CHRONIC, POSTOPERATIVE, etc.)
  let temporalCategory = 'UNKNOWN';
  let temporalConfidence = 0;

  try {
    const temporal = extractTemporalQualifier(entityName, text);
    temporalCategory = temporal.category || 'UNKNOWN';
    temporalConfidence = temporal.confidence || 0;
  } catch (error) {
    // Temporal qualifier extraction failed - not critical
    console.debug('Temporal qualifier extraction failed:', error.message);
  }

  // 4. Combine all signals for final determination
  let isReference = refDetection.isReference;
  let confidence = refDetection.confidence;

  // Override: If POD is present, it's almost certainly a reference
  if (podContext.pod !== null) {
    isReference = true;
    confidence = Math.max(confidence, 0.9);
  }

  // Override: If temporal category is POSTOPERATIVE, likely a reference
  if (temporalCategory === 'POSTOPERATIVE' && temporalConfidence > 0.7) {
    isReference = true;
    confidence = Math.max(confidence, 0.85);
  }

  return {
    isReference,
    referenceType: refDetection.type,
    referencePattern: refDetection.pattern,
    pod: podContext.pod,
    podType: podContext.type,
    category: temporalCategory,
    confidence: Math.min(confidence, 1.0), // Cap at 1.0
    context: context.substring(0, 150) // Include for debugging
  };
};

/**
 * Classify event type based on context and temporal information
 *
 * @param {string} context - Text context around mention
 * @param {Object} temporalQualifier - Temporal qualifier object
 * @returns {string} Event type: 'new_event', 'reference', or 'ambiguous'
 */
export const classifyEventType = (context, temporalQualifier = {}) => {
  const refDetection = detectReferencePhrase(context);

  // Clear reference
  if (refDetection.isReference && refDetection.confidence > 0.8) {
    return 'reference';
  }

  // Clear new event
  if (!refDetection.isReference && refDetection.type === 'new_event') {
    return 'new_event';
  }

  // Use temporal qualifier as tiebreaker
  if (temporalQualifier.category === 'POSTOPERATIVE' || temporalQualifier.category === 'PAST') {
    return 'reference';
  }

  if (temporalQualifier.category === 'ACUTE' || temporalQualifier.category === 'RECENT') {
    return 'new_event';
  }

  return 'ambiguous';
};

/**
 * Associate date with entity using proximity and context
 * Finds the closest date mention to the entity
 *
 * @param {string} text - Full text
 * @param {Object} entityMatch - Entity match object with position
 * @param {Object} referenceDates - Reference dates object (ictusDate, admissionDate, etc.)
 * @returns {string|null} Normalized date or null
 */
export const associateDateWithEntity = (text, entityMatch, referenceDates = {}) => {
  if (!text || !entityMatch) {
    return {
      date: null,
      source: 'not_found',
      confidence: 0
    };
  }

  const { position } = entityMatch;

  // Extract context window (±200 chars for better date detection)
  const start = Math.max(0, position - 200);
  const end = Math.min(text.length, position + 200);
  const context = text.substring(start, end);

  // Date patterns (various formats)
  const datePatterns = [
    /\d{1,2}\/\d{1,2}\/\d{2,4}/g,  // MM/DD/YY or MM/DD/YYYY
    /\d{1,2}-\d{1,2}-\d{2,4}/g,    // MM-DD-YY
    /[A-Za-z]+\s+\d{1,2},?\s+\d{4}/g, // Month DD, YYYY
  ];

  let closestDate = null;
  let closestDistance = Infinity;

  for (const pattern of datePatterns) {
    let match;
    pattern.lastIndex = 0; // Reset regex

    while ((match = pattern.exec(context)) !== null) {
      const datePosition = start + match.index;
      const distance = Math.abs(datePosition - position);

      if (distance < closestDistance) {
        const parsed = parseFlexibleDate(match[0]);
        if (parsed) {
          closestDate = normalizeDate(parsed);
          closestDistance = distance;
        }
      }
    }
  }

  // If no date found nearby, try to infer from POD + reference dates
  if (!closestDate) {
    const podContext = extractPODContext(text, position);
    if (podContext.pod !== null && referenceDates.surgeryDates && referenceDates.surgeryDates.length > 0) {
      closestDate = resolveRelativeDate({ pod: podContext.pod }, referenceDates);
    }
  }

  // Return structured object instead of just the date
  if (closestDate) {
    return {
      date: closestDate,
      source: closestDistance < 50 ? 'nearby' : 'context',
      confidence: closestDistance < 50 ? 0.9 : 0.7
    };
  }

  return {
    date: null,
    source: 'not_found',
    confidence: 0
  };
};

/**
 * Resolve relative date reference (e.g., POD#3) to actual date
 *
 * @param {Object} relativeRef - Relative reference { pod: 3 }
 * @param {Object} referenceDates - Reference dates with surgeryDates
 * @returns {string|null} Resolved date or null
 *
 * @example
 * resolveRelativeDate({ pod: 3 }, { surgeryDates: ['2023-10-01'] })
 * // Returns: '2023-10-04' (surgery date + 3 days)
 */
export const resolveRelativeDate = (relativeRef, referenceDates) => {
  if (!relativeRef || !referenceDates) return null;

  const { pod, type } = relativeRef;

  if (pod === null || pod === undefined) return null;

  // Determine the reference date to use for POD calculation
  let referenceDate = null;

  // Priority order: firstProcedure > admission > ictus > surgeryDates array
  if (referenceDates.firstProcedure) {
    referenceDate = referenceDates.firstProcedure;
  } else if (referenceDates.admission) {
    referenceDate = referenceDates.admission;
  } else if (referenceDates.ictus) {
    referenceDate = referenceDates.ictus;
  } else if (referenceDates.surgeryDates && Array.isArray(referenceDates.surgeryDates)) {
    // Fallback to surgeryDates array (legacy support)
    const surgeryDates = referenceDates.surgeryDates;
    if (surgeryDates.length > 0) {
      referenceDate = surgeryDates[surgeryDates.length - 1]; // Most recent
    }
  }

  if (!referenceDate) return null;

  try {
    // Parse reference date using parseFlexibleDate to avoid timezone issues
    const baseDate = parseFlexibleDate(referenceDate);
    if (!baseDate) return null;

    // Create new date object and add POD days
    const podDate = new Date(baseDate);
    podDate.setDate(podDate.getDate() + pod);

    return normalizeDate(podDate);
  } catch (error) {
    console.error('Error resolving relative date:', error);
    return null;
  }
};

/**
 * Group entities by date
 *
 * @param {Array} entities - Array of entities with date property
 * @returns {Object} Entities grouped by date
 *
 * @example
 * groupByDate([
 *   { name: 'coiling', date: '2023-10-01' },
 *   { name: 'EVD placement', date: '2023-10-01' },
 *   { name: 'craniotomy', date: '2023-10-05' }
 * ])
 * // Returns: {
 * //   '2023-10-01': [{ name: 'coiling', ... }, { name: 'EVD placement', ... }],
 * //   '2023-10-05': [{ name: 'craniotomy', ... }]
 * // }
 */
export const groupByDate = (entities) => {
  if (!Array.isArray(entities)) return {};

  const grouped = {};

  for (const entity of entities) {
    const date = entity.date || 'undated';

    if (!grouped[date]) {
      grouped[date] = [];
    }

    grouped[date].push(entity);
  }

  return grouped;
};

/**
 * Link references to actual events
 * Finds which references correspond to which actual events
 *
 * @param {Array} references - Array of reference mentions
 * @param {Array} events - Array of actual events
 * @param {Function} similarityFn - Function to check if names are similar
 * @returns {Array} Events with linked references
 *
 * @example
 * linkReferencesToEvents(
 *   [{ name: 's/p coiling', pod: 2, isReference: true }],
 *   [{ name: 'endovascular coiling', date: '2023-10-01', isReference: false }],
 *   (a, b) => a.toLowerCase().includes('coiling') && b.toLowerCase().includes('coiling')
 * )
 * // Returns events array with references attached
 */
export const linkReferencesToEvents = (references, events, similarityFn) => {
  if (!Array.isArray(references) || !Array.isArray(events)) {
    return events;
  }

  // Clone events to avoid mutation
  const eventsWithReferences = events.map(event => ({
    ...event,
    references: []
  }));

  // For each reference, find matching event
  for (const ref of references) {
    let bestMatch = null;
    let bestScore = 0;

    for (const event of eventsWithReferences) {
      // Use similarity function if provided
      if (similarityFn) {
        // Call similarity function with full objects, not just names
        const score = similarityFn(ref, event);
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = event;
        }
      } else {
        // Fallback: simple string similarity
        if (!ref?.name || !event?.name) continue;
        
        const refNameLower = ref.name.toLowerCase();
        const eventNameLower = event.name.toLowerCase();

        if (refNameLower.includes(eventNameLower) || eventNameLower.includes(refNameLower)) {
          bestMatch = event;
          break;
        }
      }
    }

    // Link reference to event
    if (bestMatch) {
      bestMatch.references.push({
        text: ref.name,
        pod: ref.pod,
        date: ref.date,
        type: ref.referenceType || 'unknown',
        context: ref.context
      });
    }
  }

  return {
    linked: eventsWithReferences.filter(e => e.references && e.references.length > 0),
    unlinked: references.filter(ref => {
      // Check if this reference was linked to any event
      return !eventsWithReferences.some(event => 
        event.references && event.references.some(r => r.text === ref.name && r.pod === ref.pod)
      );
    })
  };
};

/**
 * Check if mention is a reference to past event (simplified)
 * Quick check without full context analysis
 *
 * @param {string} text - Text context
 * @returns {boolean} True if likely a reference
 */
export const isReferenceToPatient = (text) => {
  if (!text) return false;

  const lowerText = text.toLowerCase();

  // Quick pattern checks
  const referenceIndicators = [
    /\bs\/p\s/,
    /\bstatus\s+post\s/,
    /\bPOD[#\s]*\d+/,
    /\bpost-?operative/,
    /\bfollowing\s+/,
    /\bafter\s+/,
    /\bprior\s+/,
    /\bh\/o\s+/
  ];

  return referenceIndicators.some(pattern => pattern.test(lowerText));
};

/**
 * Check if mention is a new event (simplified)
 * Quick check without full context analysis
 *
 * @param {string} text - Text context
 * @returns {boolean} True if likely a new event
 */
export const isNewEvent = (text) => {
  if (!text) return false;

  const lowerText = text.toLowerCase();

  // Quick pattern checks
  const newEventIndicators = [
    /\bunderwent\s/,
    /\breceiving\s/,
    /\btaken\s+to\s/,
    /\bperformed\s+on\s/,
    /\btoday\b/,
    /\bthis\s+morning\b/,
    /\bon\s+\d{1,2}\/\d{1,2}/
  ];

  return newEventIndicators.some(pattern => pattern.test(lowerText));
};

export default {
  detectReferencePhrase,
  extractPODContext,
  detectTemporalContext,
  classifyEventType,
  associateDateWithEntity,
  resolveRelativeDate,
  groupByDate,
  linkReferencesToEvents,
  isReferenceToPatient,
  isNewEvent
};
