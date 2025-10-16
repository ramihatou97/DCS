/**
 * Causal Timeline Builder
 *
 * Phase 2 Component 1: Builds chronological timelines with causal relationships
 *
 * Purpose:
 * - Merges events from all categories (procedures, complications, medications, etc.)
 * - Sorts chronologically to create unified timeline
 * - Categorizes events by clinical significance
 * - Detects causal relationships between events
 * - Identifies key milestones
 *
 * @module causalTimeline
 */

import { parseFlexibleDate } from './dateUtils.js';

/**
 * Event type categories
 */
export const EVENT_TYPES = {
  DIAGNOSTIC: 'DIAGNOSTIC',      // Imaging, labs, exams
  THERAPEUTIC: 'THERAPEUTIC',    // Procedures, medications, interventions
  COMPLICATION: 'COMPLICATION',  // Adverse events, complications
  OUTCOME: 'OUTCOME'             // Functional scores, discharge, milestones
};

/**
 * Event categories mapping
 */
const CATEGORY_MAPPING = {
  // Diagnostic
  imaging: EVENT_TYPES.DIAGNOSTIC,
  lab: EVENT_TYPES.DIAGNOSTIC,
  exam: EVENT_TYPES.DIAGNOSTIC,

  // Therapeutic
  procedure: EVENT_TYPES.THERAPEUTIC,
  medication_start: EVENT_TYPES.THERAPEUTIC,
  medication_change: EVENT_TYPES.THERAPEUTIC,
  intervention: EVENT_TYPES.THERAPEUTIC,

  // Complication
  complication: EVENT_TYPES.COMPLICATION,
  adverse_event: EVENT_TYPES.COMPLICATION,

  // Outcome
  functional_score: EVENT_TYPES.OUTCOME,
  discharge: EVENT_TYPES.OUTCOME,
  milestone: EVENT_TYPES.OUTCOME
};

/**
 * Relationship types
 */
export const RELATIONSHIP_TYPES = {
  CAUSES: 'causes',              // Event A caused Event B
  TRIGGERS: 'triggers',          // Event A triggered intervention B
  RESPONDS_TO: 'responds_to',    // Outcome B responds to intervention A
  LEADS_TO: 'leads_to',          // Event A led to Event B
  PREVENTS: 'prevents'           // Intervention A prevented complication B
};

/**
 * Build a unified chronological timeline from extracted data
 *
 * @param {Object} extractedData - Complete extracted data object
 * @returns {Object} Timeline with events, relationships, and milestones
 */
export function buildCausalTimeline(extractedData) {
  try {
    console.log('[Phase 2] Building causal timeline...');

    // Step 1: Collect all events from different categories
    const rawEvents = collectEvents(extractedData);

    // Step 2: Parse and standardize dates
    const parsedEvents = parseEventDates(rawEvents);

    // Step 3: Sort chronologically
    const sortedEvents = sortChronologically(parsedEvents);

    // Step 4: Assign unique IDs
    const events = assignEventIds(sortedEvents);

    // Step 5: Identify key milestones
    const milestones = identifyMilestones(events, extractedData);

    // Step 6: Detect causal relationships (will implement in next step)
    const relationships = detectRelationships(events, extractedData);

    // Step 7: Attach relationships to events
    attachRelationshipsToEvents(events, relationships);

    const timeline = {
      events,
      milestones,
      relationships,
      metadata: {
        totalEvents: events.length,
        totalRelationships: relationships.length,
        totalMilestones: milestones.length,
        dateRange: getDateRange(events)
      }
    };

    console.log(`[Phase 2] Timeline built: ${events.length} events, ${relationships.length} relationships, ${milestones.length} milestones`);

    return timeline;

  } catch (error) {
    console.error('[Phase 2] Error building timeline:', error);
    return {
      events: [],
      milestones: [],
      relationships: [],
      metadata: { error: error.message }
    };
  }
}

/**
 * Collect all events from extracted data
 *
 * @param {Object} extractedData - Extracted medical data
 * @returns {Array} Raw events from all categories
 */
function collectEvents(extractedData) {
  const events = [];

  // Collect procedures
  if (extractedData.procedures?.procedures) {
    extractedData.procedures.procedures.forEach(proc => {
      events.push({
        category: 'procedure',
        type: EVENT_TYPES.THERAPEUTIC,
        description: proc.name || proc,
        date: proc.date,
        details: proc.details || proc.operator,
        source: 'procedures'
      });
    });
  }

  // Collect complications
  if (extractedData.complications?.complications) {
    extractedData.complications.complications.forEach(comp => {
      events.push({
        category: 'complication',
        type: EVENT_TYPES.COMPLICATION,
        description: comp.name || comp,
        date: comp.date || comp.onset,
        severity: comp.severity,
        management: comp.management,
        source: 'complications'
      });
    });
  }

  // Collect medication changes
  if (extractedData.medications?.current) {
    extractedData.medications.current.forEach(med => {
      events.push({
        category: 'medication_start',
        type: EVENT_TYPES.THERAPEUTIC,
        description: `Started ${med.name || med}`,
        date: med.startDate || med.date,
        details: `${med.dose || ''} ${med.frequency || ''}`.trim(),
        source: 'medications'
      });
    });
  }

  // Collect imaging
  if (extractedData.imaging?.findings) {
    // Imaging often lacks specific dates, use admission date or closest reference
    const imagingDate = extractedData.dates?.admissionDate;
    extractedData.imaging.findings.forEach((finding, idx) => {
      events.push({
        category: 'imaging',
        type: EVENT_TYPES.DIAGNOSTIC,
        description: finding.description || finding,
        date: extractedData.imaging.dates?.[idx] || imagingDate,
        source: 'imaging'
      });
    });
  }

  // Collect functional scores
  if (extractedData.functionalScores) {
    const { kps, ecog, mRS, gcs } = extractedData.functionalScores;

    // For now, map to discharge date (will improve with temporal tracking)
    const scoreDate = extractedData.dates?.dischargeDate || extractedData.dates?.admissionDate;

    if (kps) {
      events.push({
        category: 'functional_score',
        type: EVENT_TYPES.OUTCOME,
        description: `KPS: ${kps}`,
        date: scoreDate,
        score: kps,
        scoreType: 'KPS',
        source: 'functionalScores'
      });
    }

    if (ecog !== null && ecog !== undefined) {
      events.push({
        category: 'functional_score',
        type: EVENT_TYPES.OUTCOME,
        description: `ECOG: ${ecog}`,
        date: scoreDate,
        score: ecog,
        scoreType: 'ECOG',
        source: 'functionalScores'
      });
    }

    if (mRS !== null && mRS !== undefined) {
      events.push({
        category: 'functional_score',
        type: EVENT_TYPES.OUTCOME,
        description: `mRS: ${mRS}`,
        date: scoreDate,
        score: mRS,
        scoreType: 'mRS',
        source: 'functionalScores'
      });
    }
  }

  // Collect key dates as milestone events
  if (extractedData.dates) {
    const { admissionDate, ictusDate, dischargeDate } = extractedData.dates;

    if (admissionDate) {
      events.push({
        category: 'milestone',
        type: EVENT_TYPES.OUTCOME,
        description: 'Hospital Admission',
        date: admissionDate,
        significance: 'high',
        source: 'dates'
      });
    }

    if (ictusDate) {
      events.push({
        category: 'milestone',
        type: EVENT_TYPES.OUTCOME,
        description: 'Ictus/Onset',
        date: ictusDate,
        significance: 'high',
        source: 'dates'
      });
    }

    if (dischargeDate) {
      events.push({
        category: 'milestone',
        type: EVENT_TYPES.OUTCOME,
        description: 'Hospital Discharge',
        date: dischargeDate,
        significance: 'high',
        source: 'dates'
      });
    }
  }

  return events;
}

/**
 * Parse and standardize event dates
 *
 * @param {Array} events - Raw events
 * @returns {Array} Events with parsed dates
 */
function parseEventDates(events) {
  return events.map(event => {
    if (!event.date) {
      return { ...event, timestamp: null, parsedDate: null };
    }

    try {
      const parsedDate = parseFlexibleDate(event.date);
      return {
        ...event,
        parsedDate,
        timestamp: parsedDate ? parsedDate.getTime() : null
      };
    } catch (error) {
      console.warn(`[Phase 2] Failed to parse date: ${event.date}`, error);
      return { ...event, timestamp: null, parsedDate: null };
    }
  });
}

/**
 * Sort events chronologically
 *
 * @param {Array} events - Events with timestamps
 * @returns {Array} Sorted events
 */
function sortChronologically(events) {
  return events.sort((a, b) => {
    // Events with dates come before events without dates
    if (a.timestamp === null && b.timestamp === null) return 0;
    if (a.timestamp === null) return 1;
    if (b.timestamp === null) return -1;

    // Sort by timestamp
    if (a.timestamp !== b.timestamp) {
      return a.timestamp - b.timestamp;
    }

    // If same timestamp, sort by type priority
    const typePriority = {
      [EVENT_TYPES.DIAGNOSTIC]: 1,
      [EVENT_TYPES.THERAPEUTIC]: 2,
      [EVENT_TYPES.COMPLICATION]: 3,
      [EVENT_TYPES.OUTCOME]: 4
    };

    return (typePriority[a.type] || 5) - (typePriority[b.type] || 5);
  });
}

/**
 * Assign unique IDs to events
 *
 * @param {Array} events - Sorted events
 * @returns {Array} Events with IDs
 */
function assignEventIds(events) {
  return events.map((event, index) => ({
    ...event,
    id: `event_${String(index + 1).padStart(3, '0')}`,
    index,
    relationships: []
  }));
}

/**
 * Identify key milestones in the timeline
 *
 * @param {Array} events - Timeline events
 * @param {Object} extractedData - Complete extracted data
 * @returns {Array} Milestones
 */
function identifyMilestones(events, extractedData) {
  const milestones = [];

  // Milestone 1: Ictus/Onset
  const ictusEvent = events.find(e => e.category === 'milestone' && e.description.includes('Ictus'));
  if (ictusEvent) {
    milestones.push({
      date: ictusEvent.date,
      label: 'Symptom Onset',
      significance: 'high',
      eventId: ictusEvent.id
    });
  }

  // Milestone 2: Admission
  const admissionEvent = events.find(e => e.category === 'milestone' && e.description.includes('Admission'));
  if (admissionEvent) {
    milestones.push({
      date: admissionEvent.date,
      label: 'Hospital Admission',
      significance: 'high',
      eventId: admissionEvent.id
    });
  }

  // Milestone 3: First major procedure
  const firstProcedure = events.find(e => e.category === 'procedure');
  if (firstProcedure && firstProcedure.date) {
    milestones.push({
      date: firstProcedure.date,
      label: 'Primary Surgery',
      significance: 'high',
      eventId: firstProcedure.id
    });
  }

  // Milestone 4: First complication (if any)
  const firstComplication = events.find(e => e.category === 'complication');
  if (firstComplication && firstComplication.date) {
    milestones.push({
      date: firstComplication.date,
      label: 'First Complication',
      significance: 'medium',
      eventId: firstComplication.id
    });
  }

  // Milestone 5: Discharge
  const dischargeEvent = events.find(e => e.category === 'milestone' && e.description.includes('Discharge'));
  if (dischargeEvent) {
    milestones.push({
      date: dischargeEvent.date,
      label: 'Hospital Discharge',
      significance: 'high',
      eventId: dischargeEvent.id
    });
  }

  return milestones;
}

/**
 * Detect causal relationships between events
 *
 * @param {Array} events - Timeline events
 * @param {Object} extractedData - Complete extracted data
 * @returns {Array} Detected relationships
 */
function detectRelationships(events, extractedData) {
  const relationships = [];

  // Detect complication → intervention relationships (TRIGGERS)
  relationships.push(...detectComplicationTriggers(events));

  // Detect procedure → complication relationships (LEADS_TO)
  relationships.push(...detectProcedureComplications(events));

  // Detect intervention → outcome relationships (RESPONDS_TO)
  relationships.push(...detectTreatmentResponses(events));

  // Detect prevention relationships (PREVENTS)
  relationships.push(...detectPreventions(events, extractedData));

  return relationships;
}

/**
 * Detect complication → intervention triggers
 *
 * @param {Array} events - Timeline events
 * @returns {Array} Trigger relationships
 */
function detectComplicationTriggers(events) {
  const relationships = [];
  const TIME_WINDOW = 48 * 60 * 60 * 1000; // 48 hours in milliseconds

  events.forEach((complication, idx) => {
    if (complication.type !== EVENT_TYPES.COMPLICATION || !complication.timestamp) return;

    // Look for therapeutic interventions within 48 hours after complication
    for (let i = idx + 1; i < events.length; i++) {
      const intervention = events[i];

      if (!intervention.timestamp) continue;
      if (intervention.timestamp - complication.timestamp > TIME_WINDOW) break;

      if (intervention.type === EVENT_TYPES.THERAPEUTIC) {
        relationships.push({
          from: complication.id,
          to: intervention.id,
          type: RELATIONSHIP_TYPES.TRIGGERS,
          description: `${complication.description} triggered ${intervention.description}`,
          confidence: 0.8,
          timeWindow: `${Math.round((intervention.timestamp - complication.timestamp) / (60 * 60 * 1000))}h`,
          urgency: intervention.timestamp - complication.timestamp < 24 * 60 * 60 * 1000 ? 'urgent' : 'routine'
        });
      }
    }
  });

  return relationships;
}

/**
 * Detect procedure → complication relationships
 *
 * @param {Array} events - Timeline events
 * @returns {Array} Leads-to relationships
 */
function detectProcedureComplications(events) {
  const relationships = [];
  const TIME_WINDOW = 14 * 24 * 60 * 60 * 1000; // 14 days post-procedure

  events.forEach((procedure, idx) => {
    if (procedure.category !== 'procedure' || !procedure.timestamp) return;

    // Look for complications within 14 days after procedure
    for (let i = idx + 1; i < events.length; i++) {
      const complication = events[i];

      if (!complication.timestamp) continue;
      if (complication.timestamp - procedure.timestamp > TIME_WINDOW) break;

      if (complication.type === EVENT_TYPES.COMPLICATION) {
        const daysDiff = Math.round((complication.timestamp - procedure.timestamp) / (24 * 60 * 60 * 1000));

        relationships.push({
          from: procedure.id,
          to: complication.id,
          type: RELATIONSHIP_TYPES.LEADS_TO,
          description: `${procedure.description} led to ${complication.description}`,
          confidence: daysDiff <= 7 ? 0.85 : 0.7,
          timeWindow: `POD ${daysDiff}`,
          severity: complication.severity || 'unknown'
        });
      }
    }
  });

  return relationships;
}

/**
 * Detect intervention → outcome responses
 *
 * @param {Array} events - Timeline events
 * @returns {Array} Response relationships
 */
function detectTreatmentResponses(events) {
  const relationships = [];
  const TIME_WINDOW = 21 * 24 * 60 * 60 * 1000; // 21 days for response

  events.forEach((intervention, idx) => {
    if (intervention.type !== EVENT_TYPES.THERAPEUTIC || !intervention.timestamp) return;

    // Look for outcome measures after intervention
    for (let i = idx + 1; i < events.length; i++) {
      const outcome = events[i];

      if (!outcome.timestamp) continue;
      if (outcome.timestamp - intervention.timestamp > TIME_WINDOW) break;

      if (outcome.type === EVENT_TYPES.OUTCOME) {
        relationships.push({
          from: intervention.id,
          to: outcome.id,
          type: RELATIONSHIP_TYPES.RESPONDS_TO,
          description: `Outcome following ${intervention.description}`,
          confidence: 0.7,
          timeWindow: `${Math.round((outcome.timestamp - intervention.timestamp) / (24 * 60 * 60 * 1000))} days`
        });
      }
    }
  });

  return relationships;
}

/**
 * Detect prevention relationships (prophylaxis that prevented complications)
 *
 * @param {Array} events - Timeline events
 * @param {Object} extractedData - Complete extracted data
 * @returns {Array} Prevention relationships
 */
function detectPreventions(events, extractedData) {
  const relationships = [];

  // Example: Check for nimodipine (SAH vasospasm prophylaxis)
  const nimodipineEvent = events.find(e =>
    e.category === 'medication_start' &&
    e.description &&
    e.description.toLowerCase().includes('nimodipine')
  );

  if (nimodipineEvent) {
    // Check if vasospasm occurred
    const vasospasmEvent = events.find(e =>
      e.type === EVENT_TYPES.COMPLICATION &&
      e.description &&
      e.description.toLowerCase().includes('vasospasm')
    );

    if (!vasospasmEvent) {
      // No vasospasm detected → nimodipine was preventive
      relationships.push({
        from: nimodipineEvent.id,
        to: null,  // No target event (prevented)
        type: RELATIONSHIP_TYPES.PREVENTS,
        description: 'Nimodipine prevented vasospasm',
        confidence: 0.75,
        effectiveness: 'successful'
      });
    }
  }

  return relationships;
}

/**
 * Attach relationships to events
 *
 * @param {Array} events - Timeline events
 * @param {Array} relationships - Detected relationships
 */
function attachRelationshipsToEvents(events, relationships) {
  relationships.forEach(rel => {
    const fromEvent = events.find(e => e.id === rel.from);
    if (fromEvent) {
      fromEvent.relationships.push(rel);
    }
  });
}

/**
 * Get date range of timeline
 *
 * @param {Array} events - Timeline events
 * @returns {Object} Start and end dates
 */
function getDateRange(events) {
  const datedEvents = events.filter(e => e.timestamp !== null);

  if (datedEvents.length === 0) {
    return { start: null, end: null };
  }

  const timestamps = datedEvents.map(e => e.timestamp);
  return {
    start: new Date(Math.min(...timestamps)).toISOString().split('T')[0],
    end: new Date(Math.max(...timestamps)).toISOString().split('T')[0]
  };
}

export default {
  buildCausalTimeline,
  EVENT_TYPES,
  RELATIONSHIP_TYPES
};
