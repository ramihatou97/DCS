# PHASE 2: SUMMARY GENERATION SERVICES

This document contains summary generation, chronological, and narrative services.

---

## 2.6 Create Chronological Engine

**File:** `backend/services/chronologicalEngine.js` (NEW)

```javascript
/**
 * Chronological Engine Service
 * 
 * Builds chronological timelines from extracted data and clinical notes.
 */

/**
 * Build chronological timeline
 * 
 * @param {Object} extractedData - Extracted medical data
 * @param {string|string[]} notes - Original clinical notes
 * @returns {Object} Timeline with sorted events
 */
export function buildChronologicalTimeline(extractedData, notes) {
  const events = [];
  
  // Add admission event
  if (extractedData.dates?.admission) {
    events.push({
      date: extractedData.dates.admission,
      type: 'admission',
      description: 'Patient admitted',
      pod: null,
    });
  }
  
  // Add surgery event
  if (extractedData.dates?.surgery) {
    events.push({
      date: extractedData.dates.surgery,
      type: 'surgery',
      description: extractedData.procedures?.[0]?.name || 'Surgical procedure',
      pod: 0,
    });
  }
  
  // Add complications with dates
  if (extractedData.complications) {
    extractedData.complications.forEach(comp => {
      if (comp.date) {
        events.push({
          date: comp.date,
          type: 'complication',
          description: comp.description || comp,
          pod: calculatePOD(comp.date, extractedData.dates?.surgery),
        });
      }
    });
  }
  
  // Add discharge event
  if (extractedData.dates?.discharge) {
    events.push({
      date: extractedData.dates.discharge,
      type: 'discharge',
      description: `Discharged to ${extractedData.discharge?.destination || 'home'}`,
      pod: calculatePOD(extractedData.dates.discharge, extractedData.dates?.surgery),
    });
  }
  
  // Extract POD events from notes
  const podEvents = extractPODEvents(notes, extractedData.dates?.surgery);
  events.push(...podEvents);
  
  // Sort by date
  events.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Calculate completeness
  const completeness = calculateTimelineCompleteness(events, extractedData);
  
  return {
    events,
    completeness,
    surgeryDate: extractedData.dates?.surgery,
    totalDays: events.length > 0 ? 
      Math.ceil((new Date(events[events.length - 1].date) - new Date(events[0].date)) / (1000 * 60 * 60 * 24)) : 0,
  };
}

/**
 * Calculate POD (Post-Operative Day)
 */
function calculatePOD(eventDate, surgeryDate) {
  if (!eventDate || !surgeryDate) return null;
  
  const event = new Date(eventDate);
  const surgery = new Date(surgeryDate);
  
  const diffTime = event - surgery;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 0 ? diffDays : null;
}

/**
 * Extract POD events from clinical notes
 */
function extractPODEvents(notes, surgeryDate) {
  const events = [];
  const notesText = Array.isArray(notes) ? notes.join('\n') : notes;
  
  // Regex patterns for POD mentions
  const podPatterns = [
    /POD\s*(\d+)[:\s]+([^\n]+)/gi,
    /post[-\s]?op(?:erative)?\s+day\s+(\d+)[:\s]+([^\n]+)/gi,
    /post[-\s]?operative\s+day\s+(\d+)[:\s]+([^\n]+)/gi,
  ];
  
  for (const pattern of podPatterns) {
    let match;
    while ((match = pattern.exec(notesText)) !== null) {
      const pod = parseInt(match[1], 10);
      const description = match[2].trim().substring(0, 200); // Limit length
      
      // Calculate date if surgery date is known
      let date = null;
      if (surgeryDate) {
        const surgeryDateObj = new Date(surgeryDate);
        surgeryDateObj.setDate(surgeryDateObj.getDate() + pod);
        date = surgeryDateObj.toISOString().split('T')[0];
      }
      
      events.push({
        date,
        type: 'pod_event',
        description,
        pod,
      });
    }
  }
  
  return events;
}

/**
 * Calculate timeline completeness
 */
function calculateTimelineCompleteness(events, extractedData) {
  const requiredEvents = [
    'admission',
    'surgery',
    'discharge',
  ];
  
  const foundEvents = new Set(events.map(e => e.type));
  const foundRequired = requiredEvents.filter(type => foundEvents.has(type)).length;
  
  return foundRequired / requiredEvents.length;
}

export default {
  buildChronologicalTimeline,
};
```

---

## 2.7 Create Narrative Engine

**File:** `backend/services/narrativeEngine.js` (NEW)

```javascript
/**
 * Narrative Engine Service
 * 
 * Generates natural language narratives from structured data.
 */

import llmOrchestrator from './llmOrchestrator.js';

/**
 * Generate narrative from extracted data
 * 
 * @param {Object} extractedData - Structured extracted data
 * @param {string|string[]} sourceNotes - Original clinical notes
 * @param {Object} timeline - Chronological timeline
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Generated narrative
 */
export async function generateNarrative(extractedData, sourceNotes, timeline, options = {}) {
  const { style = 'formal', llmProvider = 'claude' } = options;
  
  // Build structured prompt
  const prompt = buildNarrativePrompt(extractedData, timeline, style);
  
  try {
    // Use LLM to generate narrative
    const result = await llmOrchestrator.extractWithLLM(prompt, llmProvider, {
      temperature: 0.4, // Slightly higher for narrative generation
      maxTokens: 2048,
    });
    
    return {
      success: true,
      narrative: result.data?.narrative || '',
      sections: result.data?.sections || {},
    };
    
  } catch (error) {
    console.error('Narrative generation failed:', error);
    
    // Fallback to template-based narrative
    return {
      success: true,
      narrative: generateTemplateNarrative(extractedData, timeline),
      sections: {},
      fallback: true,
    };
  }
}

/**
 * Build prompt for LLM narrative generation
 */
function buildNarrativePrompt(data, timeline, style) {
  return `Generate a ${style} medical discharge summary narrative from the following structured data.

CRITICAL RULES:
1. NEVER extrapolate beyond the provided data
2. NEVER generate medical recommendations
3. Use formal medical language
4. Maintain chronological flow
5. Be concise but complete

PATIENT DATA:
${JSON.stringify(data, null, 2)}

TIMELINE:
${JSON.stringify(timeline.events, null, 2)}

Generate a narrative with the following sections:
1. Hospital Course (chronological narrative)
2. Procedures (detailed description)
3. Complications (if any)
4. Discharge Plan

Return ONLY valid JSON:
{
  "narrative": "Full narrative text...",
  "sections": {
    "hospitalCourse": "...",
    "procedures": "...",
    "complications": "...",
    "dischargePlan": "..."
  }
}`;
}

/**
 * Generate template-based narrative (fallback)
 */
function generateTemplateNarrative(data, timeline) {
  const sections = [];
  
  // Demographics
  if (data.demographics?.age && data.demographics?.gender) {
    sections.push(`This is a ${data.demographics.age}-year-old ${data.demographics.gender}`);
  }
  
  // Diagnosis
  if (data.diagnosis?.primary) {
    sections.push(`with ${data.diagnosis.primary}`);
  }
  
  // Admission
  if (data.dates?.admission) {
    sections.push(`admitted on ${formatDate(data.dates.admission)}`);
  }
  
  // Procedures
  if (data.procedures?.length > 0) {
    sections.push(`who underwent ${data.procedures[0].name || data.procedures[0]}`);
    if (data.dates?.surgery) {
      sections.push(`on ${formatDate(data.dates.surgery)}`);
    }
  }
  
  // Hospital course
  if (timeline.events.length > 0) {
    sections.push('\n\nHospital Course:\n');
    timeline.events.forEach(event => {
      if (event.pod !== null) {
        sections.push(`POD ${event.pod}: ${event.description}`);
      } else {
        sections.push(`${formatDate(event.date)}: ${event.description}`);
      }
    });
  }
  
  // Complications
  if (data.complications?.length > 0) {
    sections.push('\n\nComplications:\n');
    data.complications.forEach(comp => {
      sections.push(`- ${comp.description || comp}`);
    });
  }
  
  // Discharge
  if (data.discharge?.destination) {
    sections.push(`\n\nPatient was discharged to ${data.discharge.destination}`);
    if (data.dates?.discharge) {
      sections.push(`on ${formatDate(data.dates.discharge)}`);
    }
  }
  
  return sections.join(' ').trim();
}

/**
 * Format date for narrative
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default {
  generateNarrative,
};
```

---

## 2.8 Create Summary Engine

**File:** `backend/services/summaryEngine.js` (NEW)

```javascript
/**
 * Summary Engine Service
 * 
 * Main orchestrator for discharge summary generation.
 */

import chronologicalEngine from './chronologicalEngine.js';
import narrativeEngine from './narrativeEngine.js';

/**
 * Generate discharge summary
 * 
 * @param {Object} extractedData - Validated extracted data
 * @param {string|string[]} notes - Original clinical notes
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Complete discharge summary
 */
export async function generateDischargeSummary(extractedData, notes, options = {}) {
  const startTime = Date.now();
  
  const {
    style = 'formal',
    includeTimeline = true,
    llmProvider = 'claude',
  } = options;
  
  try {
    console.log('Generating discharge summary...');
    
    // Build chronological timeline
    let timeline = null;
    if (includeTimeline) {
      console.log('Building timeline...');
      timeline = chronologicalEngine.buildChronologicalTimeline(extractedData, notes);
    }
    
    // Generate narrative
    console.log('Generating narrative...');
    const narrativeResult = await narrativeEngine.generateNarrative(
      extractedData,
      notes,
      timeline,
      { style, llmProvider }
    );
    
    // Calculate quality score
    const qualityScore = calculateQualityScore(extractedData, timeline, narrativeResult);
    
    const processingTime = Date.now() - startTime;
    
    return {
      success: true,
      summary: {
        narrative: narrativeResult.narrative,
        sections: narrativeResult.sections,
        demographics: extractedData.demographics,
        dates: extractedData.dates,
        diagnosis: extractedData.diagnosis,
        procedures: extractedData.procedures,
        complications: extractedData.complications,
        medications: extractedData.medications,
        discharge: extractedData.discharge,
      },
      timeline: includeTimeline ? timeline : null,
      metadata: {
        style,
        llmProvider,
        processingTime,
        qualityScore,
        fallback: narrativeResult.fallback || false,
      },
    };
    
  } catch (error) {
    console.error('Summary generation error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Calculate quality score (0-1)
 */
function calculateQualityScore(data, timeline, narrative) {
  let score = 0;
  let maxScore = 0;
  
  // Demographics completeness (20%)
  maxScore += 20;
  if (data.demographics?.age) score += 7;
  if (data.demographics?.gender) score += 7;
  if (data.demographics?.mrn) score += 6;
  
  // Dates completeness (20%)
  maxScore += 20;
  if (data.dates?.admission) score += 7;
  if (data.dates?.surgery) score += 7;
  if (data.dates?.discharge) score += 6;
  
  // Clinical data completeness (30%)
  maxScore += 30;
  if (data.diagnosis?.primary) score += 10;
  if (data.procedures?.length > 0) score += 10;
  if (data.medications?.discharge?.length > 0) score += 10;
  
  // Timeline completeness (15%)
  maxScore += 15;
  if (timeline && timeline.completeness > 0.5) score += 15 * timeline.completeness;
  
  // Narrative quality (15%)
  maxScore += 15;
  if (narrative.narrative && narrative.narrative.length > 100) score += 10;
  if (narrative.sections && Object.keys(narrative.sections).length > 0) score += 5;
  
  return score / maxScore;
}

export default {
  generateDischargeSummary,
};
```

---

*Continue to next file for routes and frontend updates...*

