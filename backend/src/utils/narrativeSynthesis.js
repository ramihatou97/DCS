/**
 * Advanced Narrative Synthesis
 * 
 * Phase 3 Step 1: Multi-Source Narrative Synthesis
 * 
 * Purpose:
 * - Synthesize information from multiple note sources
 * - Prioritize authoritative sources (attending > resident > consultant)
 * - Create coherent clinical story from timeline
 * - Generate natural transitions between events
 * - Maintain medical writing style consistency
 * 
 * @module narrativeSynthesis
 */

/**
 * Note source types and their authority levels
 */
const SOURCE_AUTHORITY = {
  attending: 10,
  staff: 9,
  fellow: 8,
  resident: 7,
  intern: 6,
  consultant: 8,
  pt: 5,
  ot: 5,
  st: 5,
  nursing: 4,
  unknown: 3
};

/**
 * Synthesize multi-source narrative from extracted data and source notes
 * 
 * @param {Object} extractedData - Extracted structured data
 * @param {string|Array} sourceNotes - Original clinical notes
 * @param {Object} timeline - Causal timeline (optional)
 * @returns {Object} Synthesized narrative sections
 */
function synthesizeMultiSourceNarrative(extractedData, sourceNotes, timeline = null) {
  console.log('[Phase 3 Step 1] Synthesizing multi-source narrative...');
  
  try {
    // Parse and categorize source notes
    const sources = categorizeSourceNotes(sourceNotes);
    
    // Build narrative sections
    const narrative = {
      clinicalStory: synthesizeClinicalStory(sources, timeline, extractedData),
      functionalOutcome: synthesizeFunctionalOutcome(sources, extractedData),
      consultantInsights: synthesizeConsultantFindings(sources),
      dischargePlan: synthesizeDischargePlan(sources, extractedData)
    };
    
    console.log('[Phase 3 Step 1] Narrative synthesis complete');
    
    return narrative;
    
  } catch (error) {
    console.error('[Phase 3 Step 1] Error synthesizing narrative:', error);
    return {
      clinicalStory: '',
      functionalOutcome: '',
      consultantInsights: '',
      dischargePlan: ''
    };
  }
}

/**
 * Categorize source notes by author type
 */
function categorizeSourceNotes(sourceNotes) {
  const noteText = Array.isArray(sourceNotes) ? sourceNotes.join('\n\n') : sourceNotes;
  
  const sources = {
    attending: [],
    resident: [],
    consultants: [],
    ptot: [],
    nursing: [],
    unknown: []
  };
  
  // Split into individual notes (by date headers or section breaks)
  const notes = noteText.split(/\n\n+/);
  
  for (const note of notes) {
    if (!note.trim()) continue;
    
    const sourceType = identifyNoteSource(note);
    
    if (sourceType === 'attending' || sourceType === 'staff') {
      sources.attending.push(note);
    } else if (sourceType === 'resident' || sourceType === 'intern') {
      sources.resident.push(note);
    } else if (sourceType === 'consultant') {
      sources.consultants.push(note);
    } else if (sourceType === 'pt' || sourceType === 'ot' || sourceType === 'st') {
      sources.ptot.push(note);
    } else if (sourceType === 'nursing') {
      sources.nursing.push(note);
    } else {
      sources.unknown.push(note);
    }
  }
  
  return sources;
}

/**
 * Identify note source from content
 */
function identifyNoteSource(note) {
  const lowerNote = note.toLowerCase();
  
  // Check for explicit author mentions
  if (/attending|staff physician|attending physician/i.test(note)) return 'attending';
  if (/resident|intern|pgy-?\d/i.test(note)) return 'resident';
  if (/consult|consultant|infectious disease|cardiology|neurology/i.test(note)) return 'consultant';
  if (/physical therapy|pt note|occupational therapy|ot note|speech therapy|st note/i.test(note)) return 'pt';
  if (/nursing|rn note|nurse/i.test(note)) return 'nursing';
  
  // Infer from content style
  if (/assessment and plan|a\/p:|impression:/i.test(note)) return 'attending';
  if (/recommend|suggest|advise/i.test(note)) return 'consultant';
  if (/ambulation|mobility|transfers|adls/i.test(note)) return 'pt';
  
  return 'unknown';
}

/**
 * Synthesize clinical story from sources and timeline
 */
function synthesizeClinicalStory(sources, timeline, extractedData) {
  let story = '';
  
  try {
    // Start with presentation
    const presentation = extractPresentation(sources, extractedData);
    if (presentation) {
      story += presentation + ' ';
    }
    
    // Add hospital course from timeline
    if (timeline && timeline.events && timeline.events.length > 0) {
      const courseNarrative = buildCourseFromTimeline(timeline, sources);
      if (courseNarrative) {
        story += courseNarrative + ' ';
      }
    } else {
      // Fallback to source-based course
      const courseNarrative = extractHospitalCourse(sources);
      if (courseNarrative) {
        story += courseNarrative + ' ';
      }
    }
    
    // Add complications if any
    if (extractedData.complications && extractedData.complications.complications?.length > 0) {
      const complicationsNarrative = synthesizeComplications(extractedData.complications, sources);
      if (complicationsNarrative) {
        story += complicationsNarrative + ' ';
      }
    }
    
    return story.trim();
    
  } catch (error) {
    console.error('[Phase 3 Step 1] Error synthesizing clinical story:', error);
    return '';
  }
}

/**
 * Extract presentation from sources
 */
function extractPresentation(sources, extractedData) {
  // Prioritize attending notes
  const relevantSources = [
    ...sources.attending,
    ...sources.resident,
    ...sources.unknown
  ];
  
  for (const source of relevantSources) {
    // Look for presentation patterns
    const presentationMatch = source.match(/(?:presented with|presenting with|chief complaint|cc:)\s+([^\.]+)/i);
    if (presentationMatch) {
      return `Patient presented with ${presentationMatch[1].trim()}.`;
    }
  }
  
  // Fallback to extracted presenting symptoms
  if (extractedData.presentingSymptoms && extractedData.presentingSymptoms.symptoms?.length > 0) {
    const symptoms = extractedData.presentingSymptoms.symptoms.join(', ');
    return `Patient presented with ${symptoms}.`;
  }
  
  return '';
}

/**
 * Build course narrative from timeline
 */
function buildCourseFromTimeline(timeline, sources) {
  let narrative = '';
  
  try {
    const events = timeline.events || [];
    
    // Group events by significance
    const significantEvents = events.filter(e => 
      e.type === 'THERAPEUTIC' || e.type === 'COMPLICATION'
    );
    
    for (let i = 0; i < significantEvents.length; i++) {
      const event = significantEvents[i];
      
      // Add transition if not first event
      if (i > 0) {
        narrative += ' Subsequently, ';
      }
      
      // Add event description
      narrative += event.description;
      
      // Add period if not present
      if (!narrative.endsWith('.')) {
        narrative += '.';
      }
    }
    
    return narrative;
    
  } catch (error) {
    console.error('[Phase 3 Step 1] Error building course from timeline:', error);
    return '';
  }
}

/**
 * Extract hospital course from sources
 */
function extractHospitalCourse(sources) {
  const relevantSources = [
    ...sources.attending,
    ...sources.resident,
    ...sources.unknown
  ];
  
  for (const source of relevantSources) {
    const courseMatch = source.match(/(?:hospital course|course)[:\s]+([^]+?)(?:\n\n|DISCHARGE|MEDICATIONS)/i);
    if (courseMatch) {
      return courseMatch[1].trim();
    }
  }
  
  return '';
}

/**
 * Synthesize complications narrative
 */
function synthesizeComplications(complications, sources) {
  const compList = complications.complications || [];
  
  if (compList.length === 0) return '';
  
  if (compList.length === 1) {
    return `The hospital course was complicated by ${compList[0].name || compList[0]}.`;
  }
  
  const compNames = compList.map(c => c.name || c);
  const lastComp = compNames.pop();
  return `The hospital course was complicated by ${compNames.join(', ')}, and ${lastComp}.`;
}

/**
 * Synthesize functional outcome from PT/OT notes
 */
function synthesizeFunctionalOutcome(sources, extractedData) {
  try {
    // Prioritize PT/OT notes
    const ptotNotes = sources.ptot || [];
    
    if (ptotNotes.length > 0) {
      // Extract functional status from PT/OT notes
      for (const note of ptotNotes) {
        const functionalMatch = note.match(/(?:patient|pt)\s+(?:is|was)\s+([^\.]+?)(?:with|and|\.)/i);
        if (functionalMatch) {
          return `From a functional standpoint, ${functionalMatch[1].trim()}.`;
        }
      }
    }
    
    // Fallback to extracted functional status
    if (extractedData.functionalStatus) {
      const fs = extractedData.functionalStatus;
      
      if (fs.kps) {
        return `Patient's Karnofsky Performance Status is ${fs.kps}.`;
      }
      
      if (fs.mRS !== undefined && fs.mRS !== null) {
        return `Patient's modified Rankin Scale score is ${fs.mRS}.`;
      }
    }
    
    return '';
    
  } catch (error) {
    console.error('[Phase 3 Step 1] Error synthesizing functional outcome:', error);
    return '';
  }
}

/**
 * Synthesize consultant findings
 */
function synthesizeConsultantFindings(sources) {
  try {
    const consultantNotes = sources.consultants || [];
    
    if (consultantNotes.length === 0) return '';
    
    let findings = '';
    
    for (const note of consultantNotes) {
      // Extract consultant recommendations
      const recMatch = note.match(/(?:recommend|suggest|advise)[:\s]+([^\.]+)/i);
      if (recMatch) {
        findings += `Consultant recommendations include ${recMatch[1].trim()}. `;
      }
    }
    
    return findings.trim();
    
  } catch (error) {
    console.error('[Phase 3 Step 1] Error synthesizing consultant findings:', error);
    return '';
  }
}

/**
 * Synthesize discharge plan
 */
function synthesizeDischargePlan(sources, extractedData) {
  try {
    let plan = '';
    
    // Discharge destination
    if (extractedData.discharge?.destination) {
      plan += `Patient will be discharged to ${extractedData.discharge.destination}. `;
    }
    
    // Follow-up
    if (extractedData.followUp) {
      const followUp = extractedData.followUp;
      
      if (followUp.appointments && followUp.appointments.length > 0) {
        const appointments = followUp.appointments.map(apt => 
          `${apt.provider || 'clinic'} in ${apt.timeframe || 'follow-up'}`
        ).join(', ');
        
        plan += `Follow-up appointments scheduled with ${appointments}. `;
      }
    }
    
    // Medications
    if (extractedData.medications?.discharge && extractedData.medications.discharge.length > 0) {
      plan += `Discharge medications have been prescribed. `;
    }
    
    return plan.trim();
    
  } catch (error) {
    console.error('[Phase 3 Step 1] Error synthesizing discharge plan:', error);
    return '';
  }
}

module.exports = {
  synthesizeMultiSourceNarrative,
  SOURCE_AUTHORITY
};

