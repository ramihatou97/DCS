/**
 * Clinical Evolution Service
 * 
 * Reconstructs chronological patient timeline from clinical notes
 * Parses POD (Post-Operative Day) entries, resolves relative dates, and creates narrative
 */

import { parseFlexibleDate, formatDate, calculateDaysBetween } from '../utils/dateUtils.js';
import { addDays } from 'date-fns';

/**
 * Build chronological timeline from clinical notes
 * 
 * @param {Array|String} notes - Clinical notes (array or concatenated string)
 * @param {String|Date} surgeryDate - Surgery/admission date for reference
 * @param {Object} options - Timeline options
 * @returns {Object} { timeline: [...events], narrative: "text", metadata }
 */
export const buildTimeline = (notes, surgeryDate, options = {}) => {
  const {
    includePOD = true,
    includeVitals = false,
    deduplicateSameDay = true,
    sortChronologically = true
  } = options;

  console.log('Building clinical timeline...');

  // Parse surgery date as reference point
  const refDate = surgeryDate ? parseFlexibleDate(surgeryDate) : new Date();
  
  // Convert notes to array if string
  const noteArray = Array.isArray(notes) ? notes : [notes];
  
  // Extract events from all notes
  let events = [];
  for (const note of noteArray) {
    if (typeof note === 'string') {
      events.push(...extractEventsFromNote(note, refDate, { includePOD, includeVitals }));
    } else if (note?.content) {
      events.push(...extractEventsFromNote(note.content, refDate, { includePOD, includeVitals }));
    }
  }

  console.log(`Extracted ${events.length} raw events`);

  // Sort chronologically if enabled
  if (sortChronologically) {
    events.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.getTime() - b.date.getTime();
    });
  }

  // Deduplicate same-day events if enabled
  if (deduplicateSameDay) {
    events = deduplicateEvents(events);
  }

  console.log(`Final timeline: ${events.length} events`);

  // Generate narrative from timeline
  const narrative = generateTimelineNarrative(events, refDate);

  return {
    timeline: events,
    narrative,
    metadata: {
      eventCount: events.length,
      dateRange: getDateRange(events),
      surgeryDate: formatDate(refDate),
      hasGaps: checkForGaps(events)
    }
  };
};

/**
 * Extract events from a single clinical note
 */
const extractEventsFromNote = (noteText, refDate, options) => {
  const { includePOD, includeVitals } = options;
  const events = [];

  // Split into lines for easier parsing
  const lines = noteText.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length === 0) continue;

    // Extract POD entries
    if (includePOD) {
      const podEvents = extractPODEvents(line, refDate);
      events.push(...podEvents);
    }

    // Extract explicit dates
    const dateEvents = extractDateEvents(line, refDate);
    events.push(...dateEvents);

    // Extract vitals if enabled
    if (includeVitals) {
      const vitalEvents = extractVitalEvents(line, refDate);
      events.push(...vitalEvents);
    }

    // Extract clinical events (procedures, complications, etc.)
    const clinicalEvents = extractClinicalEvents(line, refDate);
    events.push(...clinicalEvents);
  }

  return events;
};

/**
 * Extract POD (Post-Operative Day) events
 * Examples: "POD 1:", "POD#3:", "Post-op day 5"
 */
const extractPODEvents = (line, refDate) => {
  const events = [];
  
  // POD patterns
  const podPatterns = [
    /POD\s*#?\s*(\d+)[:\-\s]/i,
    /post[\s-]?op(?:erative)?\s+day\s+(\d+)/i,
    /day\s+(\d+)\s+post[\s-]?op/i
  ];

  for (const pattern of podPatterns) {
    const match = line.match(pattern);
    if (match) {
      const podNumber = parseInt(match[1], 10);
      const eventDate = addDays(refDate, podNumber);
      
      // Extract event description (text after POD marker)
      let description = line.substring(match.index + match[0].length).trim();
      
      // Clean up description
      description = description.replace(/^[:\-\s]+/, '').trim();
      if (description.length > 200) {
        description = description.substring(0, 197) + '...';
      }

      if (description.length > 0) {
        events.push({
          date: eventDate,
          pod: podNumber,
          type: 'pod_entry',
          description,
          source: 'pod_parsing'
        });
      }
      
      break; // Only match first POD pattern per line
    }
  }

  return events;
};

/**
 * Extract events with explicit dates
 * Examples: "1/15/2024: Started on antibiotics", "On 01-15-24, patient..."
 */
const extractDateEvents = (line, refDate) => {
  const events = [];
  
  // Date patterns with event descriptions
  const datePatterns = [
    /(\d{1,2}\/\d{1,2}\/\d{2,4})[:\-\s]+([^\.]+)/,
    /(\d{1,2}-\d{1,2}-\d{2,4})[:\-\s]+([^\.]+)/,
    /on\s+(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+([^\.]+)/i
  ];

  for (const pattern of datePatterns) {
    const match = line.match(pattern);
    if (match) {
      const dateStr = match[1];
      const description = match[2]?.trim();
      const eventDate = parseFlexibleDate(dateStr);

      if (eventDate && description && description.length > 0) {
        events.push({
          date: eventDate,
          type: 'dated_entry',
          description: description.substring(0, 200),
          source: 'date_parsing'
        });
      }
      
      break;
    }
  }

  return events;
};

/**
 * Extract vital sign events
 */
const extractVitalEvents = (line, refDate) => {
  const events = [];
  
  // Vital patterns
  const vitalPatterns = {
    temperature: /temp(?:erature)?\s*:?\s*(\d+\.?\d*)\s*°?[FC]/i,
    heartRate: /HR\s*:?\s*(\d+)|heart\s+rate\s*:?\s*(\d+)/i,
    bloodPressure: /BP\s*:?\s*(\d+\/\d+)|blood\s+pressure\s*:?\s*(\d+\/\d+)/i,
    respiratoryRate: /RR\s*:?\s*(\d+)|resp(?:iratory)?\s+rate\s*:?\s*(\d+)/i,
    oxygenSat: /O2\s+sat\s*:?\s*(\d+)%?|SpO2\s*:?\s*(\d+)%?/i
  };

  for (const [vitalType, pattern] of Object.entries(vitalPatterns)) {
    const match = line.match(pattern);
    if (match) {
      const value = match[1] || match[2];
      events.push({
        date: null, // Vitals need context for dating
        type: 'vital_sign',
        vitalType,
        value,
        description: `${vitalType}: ${value}`,
        source: 'vital_parsing'
      });
    }
  }

  return events;
};

/**
 * Extract clinical events (procedures, complications, medications)
 */
const extractClinicalEvents = (line, refDate) => {
  const events = [];
  
  // Clinical event keywords
  const eventKeywords = {
    procedure: /(?:underwent|performed|procedure|surgery|operation)[:\s]+([^\.]+)/i,
    complication: /(?:complication|adverse event|issue)[:\s]+([^\.]+)/i,
    medication: /(?:started|initiated|began|given)[:\s]+([^\.]+)/i,
    discharge: /(?:discharged|transferred to|moved to)[:\s]+([^\.]+)/i
  };

  for (const [eventType, pattern] of Object.entries(eventKeywords)) {
    const match = line.match(pattern);
    if (match) {
      const description = match[1]?.trim();
      if (description && description.length > 5) {
        events.push({
          date: null, // Will be inferred from context
          type: eventType,
          description: description.substring(0, 200),
          source: 'clinical_parsing'
        });
      }
    }
  }

  return events;
};

/**
 * Deduplicate events occurring on the same day
 */
const deduplicateEvents = (events) => {
  const uniqueEvents = [];
  const seen = new Map();

  for (const event of events) {
    // Create key from date + description
    const dateKey = event.date ? formatDate(event.date) : 'no-date';
    const descKey = event.description?.substring(0, 50).toLowerCase() || '';
    const key = `${dateKey}:${descKey}`;

    if (!seen.has(key)) {
      seen.set(key, true);
      uniqueEvents.push(event);
    }
  }

  return uniqueEvents;
};

/**
 * Generate narrative text from timeline
 */
const generateTimelineNarrative = (events, refDate) => {
  if (events.length === 0) {
    return 'Unable to construct detailed timeline from available notes.';
  }

  const narrativeParts = [];

  // Group events by date
  const eventsByDate = new Map();
  for (const event of events) {
    const dateKey = event.date ? formatDate(event.date) : 'undated';
    if (!eventsByDate.has(dateKey)) {
      eventsByDate.set(dateKey, []);
    }
    eventsByDate.get(dateKey).push(event);
  }

  // Generate narrative for each date
  for (const [dateKey, dayEvents] of eventsByDate) {
    if (dateKey === 'undated') continue;

    // Determine date label (POD if available)
    const podEvent = dayEvents.find(e => e.pod !== undefined);
    const dateLabel = podEvent 
      ? `Post-operative day ${podEvent.pod}`
      : dateKey;

    // Combine descriptions for this day
    const descriptions = dayEvents
      .map(e => e.description)
      .filter(d => d && d.length > 0);

    if (descriptions.length > 0) {
      narrativeParts.push(`${dateLabel}: ${descriptions.join('. ')}`);
    }
  }

  // Handle undated events
  const undatedEvents = eventsByDate.get('undated') || [];
  if (undatedEvents.length > 0) {
    const undatedDescriptions = undatedEvents
      .map(e => e.description)
      .filter(d => d && d.length > 0);
    
    if (undatedDescriptions.length > 0) {
      narrativeParts.push(`During hospitalization: ${undatedDescriptions.join('. ')}`);
    }
  }

  return narrativeParts.join('\n\n');
};

/**
 * Get date range of timeline
 */
const getDateRange = (events) => {
  const datedEvents = events.filter(e => e.date);
  
  if (datedEvents.length === 0) {
    return { start: null, end: null, days: 0 };
  }

  const dates = datedEvents.map(e => e.date);
  const start = new Date(Math.min(...dates.map(d => d.getTime())));
  const end = new Date(Math.max(...dates.map(d => d.getTime())));
  const days = calculateDaysBetween(start, end);

  return {
    start: formatDate(start),
    end: formatDate(end),
    days
  };
};

/**
 * Check for gaps in timeline (days with no events)
 */
const checkForGaps = (events) => {
  const datedEvents = events.filter(e => e.date).sort((a, b) => a.date - b.date);
  
  if (datedEvents.length < 2) return false;

  for (let i = 1; i < datedEvents.length; i++) {
    const daysDiff = calculateDaysBetween(datedEvents[i - 1].date, datedEvents[i].date);
    if (daysDiff > 2) {
      return true; // Gap of more than 2 days
    }
  }

  return false;
};

/**
 * Format timeline for display
 */
export const formatTimelineForDisplay = (timeline) => {
  if (!timeline || timeline.length === 0) {
    return 'No timeline events available.';
  }

  return timeline.map(event => {
    const dateStr = event.date ? formatDate(event.date) : 'Date unknown';
    const podStr = event.pod !== undefined ? ` (POD ${event.pod})` : '';
    return `${dateStr}${podStr}: ${event.description}`;
  }).join('\n');
};

export default {
  buildTimeline,
  formatTimelineForDisplay
};
