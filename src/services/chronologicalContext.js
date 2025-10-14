/**
 * Context-Aware Chronological Service
 * 
 * Enhances chronological event ordering with contextual understanding
 * Resolves relative dates, orders events, and builds coherent timelines
 */

import { parseFlexibleDate, formatDate, calculateDaysBetween } from '../utils/dateUtils.js';
import { extractTemporalReferences } from '../utils/textUtils.js';
import { addDays, subDays, parseISO, isValid } from 'date-fns';

/**
 * Build chronologically ordered timeline from extracted data
 * Resolves relative dates and orders events with context awareness
 * 
 * @param {Object} extractedData - Extracted medical data
 * @param {string[]} sourceNotes - Original clinical notes
 * @param {Object} options - Timeline options
 * @returns {Object} Chronological timeline with resolved dates
 */
export const buildChronologicalTimeline = (extractedData, sourceNotes = [], options = {}) => {
  const {
    resolveRelativeDates = true,
    sortEvents = true,
    deduplicateEvents = true,
    includeContext = true
  } = options;
  
  console.log('Building chronological timeline with context awareness...');
  
  // Extract reference dates
  const referenceDates = extractReferenceDates(extractedData);
  console.log('  Reference dates:', referenceDates);
  
  // Extract all events from extracted data
  const events = extractEvents(extractedData, referenceDates);
  console.log(`  Extracted ${events.length} events`);
  
  // Resolve relative dates to absolute dates
  let resolvedEvents = events;
  if (resolveRelativeDates) {
    resolvedEvents = resolveEventDates(events, referenceDates);
    const resolvedCount = resolvedEvents.filter(e => e.dateResolved).length;
    console.log(`  Resolved ${resolvedCount} relative dates`);
  }
  
  // Sort chronologically
  if (sortEvents) {
    resolvedEvents = sortEventsByDate(resolvedEvents);
  }
  
  // Deduplicate similar events
  if (deduplicateEvents) {
    const originalCount = resolvedEvents.length;
    resolvedEvents = deduplicateSimilarEvents(resolvedEvents);
    console.log(`  Deduplicated: ${originalCount} → ${resolvedEvents.length} events`);
  }
  
  // Add contextual relationships
  if (includeContext) {
    resolvedEvents = addEventContext(resolvedEvents);
  }
  
  return {
    timeline: resolvedEvents,
    referenceDates,
    metadata: {
      totalEvents: resolvedEvents.length,
      dateRange: getDateRange(resolvedEvents),
      completeness: calculateTimelineCompleteness(resolvedEvents)
    }
  };
};

/**
 * Extract key reference dates for timeline construction
 */
const extractReferenceDates = (extractedData) => {
  const dates = {
    ictus: null,
    admission: null,
    discharge: null,
    procedures: []
  };
  
  // Extract from dates object
  if (extractedData.dates) {
    if (extractedData.dates.ictusDate) {
      dates.ictus = parseFlexibleDate(extractedData.dates.ictusDate);
    }
    if (extractedData.dates.admissionDate) {
      dates.admission = parseFlexibleDate(extractedData.dates.admissionDate);
    }
    if (extractedData.dates.dischargeDate) {
      dates.discharge = parseFlexibleDate(extractedData.dates.dischargeDate);
    }
  }
  
  // Extract procedure dates
  if (extractedData.procedures && Array.isArray(extractedData.procedures)) {
    for (const proc of extractedData.procedures) {
      if (proc.date) {
        const date = parseFlexibleDate(proc.date);
        if (date) {
          dates.procedures.push({
            date,
            name: proc.name,
            type: 'procedure'
          });
        }
      }
    }
  }
  
  return dates;
};

/**
 * Extract all events from extracted data
 * Enhanced with POD (Post-Operative Day) pattern extraction
 */
const extractEvents = (extractedData, referenceDates) => {
  const events = [];
  
  // Ictus/Onset event
  if (referenceDates.ictus) {
    events.push({
      type: 'onset',
      date: referenceDates.ictus,
      dateType: 'absolute',
      description: 'Symptom onset',
      details: extractedData.presentingSymptoms || [],
      priority: 1
    });
  }
  
  // Admission event
  if (referenceDates.admission) {
    events.push({
      type: 'admission',
      date: referenceDates.admission,
      dateType: 'absolute',
      description: 'Hospital admission',
      details: extractedData.pathology || {},
      priority: 2
    });
  }
  
  // Procedure events
  if (extractedData.procedures && Array.isArray(extractedData.procedures)) {
    for (const proc of extractedData.procedures) {
      events.push({
        type: 'procedure',
        date: proc.date ? parseFlexibleDate(proc.date) : null,
        dateType: proc.date ? 'absolute' : 'unknown',
        description: proc.name,
        details: proc,
        priority: 3
      });
    }
  }
  
  // Complication events
  if (extractedData.complications && Array.isArray(extractedData.complications)) {
    for (const comp of extractedData.complications) {
      events.push({
        type: 'complication',
        date: comp.date ? parseFlexibleDate(comp.date) : null,
        dateType: comp.date ? 'absolute' : 'unknown',
        description: comp.name,
        details: comp,
        priority: 4
      });
    }
  }
  
  // Imaging events
  if (extractedData.imaging && extractedData.imaging.findings) {
    const findings = extractedData.imaging.findings;
    const dates = extractedData.imaging.dates || [];
    
    findings.forEach((finding, index) => {
      events.push({
        type: 'imaging',
        date: dates[index] ? parseFlexibleDate(dates[index]) : null,
        dateType: dates[index] ? 'absolute' : 'unknown',
        description: finding,
        details: { finding },
        priority: 5
      });
    });
  }
  
  // Discharge event
  if (referenceDates.discharge) {
    events.push({
      type: 'discharge',
      date: referenceDates.discharge,
      dateType: 'absolute',
      description: 'Hospital discharge',
      details: extractedData.dischargeDestination || {},
      priority: 6
    });
  }
  
  // Extract POD (Post-Operative Day) events from source notes if available
  // This captures daily progress notes with POD markers
  // Pattern: POD#3 or POD 3 or Post-op day 3
  if (extractedData.clinicalEvolution) {
    const podEvents = extractPODEvents(extractedData.clinicalEvolution, referenceDates);
    events.push(...podEvents);
  }
  
  return events;
};

/**
 * Extract POD (Post-Operative Day) events from clinical evolution
 * Enhanced pattern matching for multiple POD formats
 */
const extractPODEvents = (clinicalEvolution, referenceDates) => {
  const events = [];
  
  if (!clinicalEvolution || typeof clinicalEvolution !== 'string') {
    return events;
  }
  
  // Multiple POD patterns to match various documentation styles
  const podPatterns = [
    /POD[#\s]*(\d+)[:\s]*([^POD]*?)(?=POD|$)/gi,  // POD#3: details or POD 3: details
    /post[-\s]*op(?:erative)?\s+day\s+(\d+)[:\s]*([^\.]*)/gi,  // Post-op day 3: details
    /day\s+(\d+)\s+post[-\s]*op[:\s]*([^\.]*)/gi  // Day 3 post-op: details
  ];
  
  for (const pattern of podPatterns) {
    let match;
    while ((match = pattern.exec(clinicalEvolution)) !== null) {
      const podNumber = parseInt(match[1]);
      const description = match[2] ? match[2].trim() : '';
      
      // Skip if no description
      if (!description || description.length < 10) continue;
      
      // Calculate date from POD if we have a procedure date
      let eventDate = null;
      if (referenceDates.procedures && referenceDates.procedures.length > 0) {
        // Use the first procedure date as reference
        const procedureDate = referenceDates.procedures[0].date;
        eventDate = addDays(procedureDate, podNumber);
      } else if (referenceDates.admission) {
        // Fallback to admission date + POD
        eventDate = addDays(referenceDates.admission, podNumber);
      }
      
      events.push({
        type: 'pod_update',
        date: eventDate,
        dateType: eventDate ? 'calculated' : 'relative',
        description: `POD ${podNumber}: ${description.substring(0, 100)}`,
        details: { pod: podNumber, notes: description },
        priority: 4,
        podNumber
      });
    }
  }
  
  // Sort by POD number and deduplicate by day
  const deduplicated = deduplicatePODEvents(events);
  
  return deduplicated;
};

/**
 * Deduplicate POD events - merge events from same POD
 */
const deduplicatePODEvents = (events) => {
  const byPOD = new Map();
  
  for (const event of events) {
    if (!event.podNumber) continue;
    
    const key = event.podNumber;
    
    if (!byPOD.has(key)) {
      byPOD.set(key, event);
    } else {
      // Merge descriptions if multiple entries for same POD
      const existing = byPOD.get(key);
      existing.description = `${existing.description}; ${event.description}`;
      existing.details.notes = `${existing.details.notes} ${event.details.notes}`;
    }
  }
  
  return Array.from(byPOD.values());
};

/**
 * Resolve relative dates to absolute dates using reference points
 */
const resolveEventDates = (events, referenceDates) => {
  return events.map(event => {
    if (event.dateType === 'absolute' && event.date) {
      return { ...event, dateResolved: true };
    }
    
    // Try to infer date from context
    const inferredDate = inferEventDate(event, events, referenceDates);
    
    if (inferredDate) {
      return {
        ...event,
        date: inferredDate,
        dateType: 'inferred',
        dateResolved: true
      };
    }
    
    return { ...event, dateResolved: false };
  });
};

/**
 * Infer event date from context and related events
 */
const inferEventDate = (event, allEvents, referenceDates) => {
  // For procedures without dates, place them between admission and discharge
  if (event.type === 'procedure' && !event.date) {
    if (referenceDates.admission && referenceDates.discharge) {
      // Place in middle of hospital stay
      const admissionTime = referenceDates.admission.getTime();
      const dischargeTime = referenceDates.discharge.getTime();
      const midpoint = new Date((admissionTime + dischargeTime) / 2);
      return midpoint;
    } else if (referenceDates.admission) {
      // Place a few days after admission (typical for neurosurgery)
      return addDays(referenceDates.admission, 2);
    }
  }
  
  // For complications, typically occur after procedures
  if (event.type === 'complication' && !event.date) {
    // Find the most recent procedure
    const procedures = allEvents.filter(e => e.type === 'procedure' && e.date);
    if (procedures.length > 0) {
      const lastProcedure = procedures[procedures.length - 1];
      // Complications typically 3-7 days post-procedure
      return addDays(lastProcedure.date, 5);
    }
  }
  
  return null;
};

/**
 * Sort events chronologically
 */
const sortEventsByDate = (events) => {
  return events.sort((a, b) => {
    // Events with dates come before those without
    if (!a.date && !b.date) {
      // Sort by priority if no dates
      return a.priority - b.priority;
    }
    if (!a.date) return 1;
    if (!b.date) return -1;
    
    // Sort by date
    const dateCompare = a.date.getTime() - b.date.getTime();
    if (dateCompare !== 0) return dateCompare;
    
    // If same date, sort by priority
    return a.priority - b.priority;
  });
};

/**
 * Deduplicate similar events (same type and description on same day)
 */
const deduplicateSimilarEvents = (events) => {
  const unique = [];
  const seen = new Set();
  
  for (const event of events) {
    const key = `${event.type}:${event.description}:${event.date ? formatDate(event.date) : 'nodate'}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(event);
    }
  }
  
  return unique;
};

/**
 * Add contextual relationships between events
 */
const addEventContext = (events) => {
  return events.map((event, index) => {
    const context = {
      isFirst: index === 0,
      isLast: index === events.length - 1,
      previousEvent: index > 0 ? events[index - 1].type : null,
      nextEvent: index < events.length - 1 ? events[index + 1].type : null
    };
    
    // Add temporal relationship to previous event
    if (index > 0 && events[index - 1].date && event.date) {
      const daysSince = calculateDaysBetween(events[index - 1].date, event.date);
      context.daysSincePrevious = daysSince;
      
      if (daysSince === 0) {
        context.temporalRelation = 'same day';
      } else if (daysSince === 1) {
        context.temporalRelation = 'next day';
      } else if (daysSince <= 3) {
        context.temporalRelation = 'shortly after';
      } else if (daysSince <= 7) {
        context.temporalRelation = 'days later';
      } else {
        context.temporalRelation = 'weeks later';
      }
    }
    
    return {
      ...event,
      context
    };
  });
};

/**
 * Get date range of timeline
 */
const getDateRange = (events) => {
  const datedEvents = events.filter(e => e.date);
  
  if (datedEvents.length === 0) {
    return { start: null, end: null, duration: null };
  }
  
  const dates = datedEvents.map(e => e.date);
  const start = new Date(Math.min(...dates.map(d => d.getTime())));
  const end = new Date(Math.max(...dates.map(d => d.getTime())));
  const duration = calculateDaysBetween(start, end);
  
  return {
    start: formatDate(start),
    end: formatDate(end),
    duration
  };
};

/**
 * Calculate timeline completeness score
 */
const calculateTimelineCompleteness = (events) => {
  const total = events.length;
  if (total === 0) return 0;
  
  const withDates = events.filter(e => e.date).length;
  const resolved = events.filter(e => e.dateResolved).length;
  
  return {
    score: (withDates / total) * 100,
    withDates,
    total,
    resolved
  };
};

/**
 * Generate narrative description of timeline
 */
export const generateTimelineNarrative = (timeline) => {
  if (!timeline || timeline.length === 0) {
    return 'Unable to construct timeline from available information.';
  }
  
  const parts = [];
  
  for (let i = 0; i < timeline.length; i++) {
    const event = timeline[i];
    
    let sentence = '';
    
    // Add temporal marker
    if (event.date) {
      if (i === 0) {
        sentence += `On ${formatDate(event.date)}, `;
      } else if (event.context?.temporalRelation) {
        sentence += `${event.context.temporalRelation.charAt(0).toUpperCase() + event.context.temporalRelation.slice(1)}, `;
      } else {
        sentence += `On ${formatDate(event.date)}, `;
      }
    }
    
    // Add event description
    sentence += `the patient ${getEventNarrative(event)}`;
    
    parts.push(sentence);
  }
  
  return parts.join('. ') + '.';
};

/**
 * Get narrative description for an event
 */
const getEventNarrative = (event) => {
  switch (event.type) {
    case 'onset':
      return `presented with ${event.details.join(', ')}`;
    case 'admission':
      return `was admitted to the hospital`;
    case 'procedure':
      return `underwent ${event.description}`;
    case 'complication':
      return `developed ${event.description}`;
    case 'imaging':
      return `had imaging showing ${event.description}`;
    case 'discharge':
      return `was discharged`;
    default:
      return event.description;
  }
};

export default {
  buildChronologicalTimeline,
  generateTimelineNarrative
};
