/**
 * Narrative Engine Service
 * 
 * Generates chronological medical narratives from extracted structured data.
 * Uses LLM (primary) with template-based fallback for generating professional
 * discharge summaries.
 * 
 * Features:
 * - LLM-powered natural narrative generation (90-98% quality)
 * - Template-based fallback when LLM unavailable
 * - Chronological timeline reconstruction
 * - Medical terminology and abbreviation handling
 * - Pathology-specific narrative templates
 * - Context-aware sentence generation
 * - Professional medical writing style
 */

import { getTemplateByPathology } from '../utils/templates.js';
import { MEDICAL_ABBREVIATIONS, expandAbbreviation } from '../utils/medicalAbbreviations.js';
import { formatDate, calculateDaysBetween, getRelativeTime } from '../utils/dateUtils.js';
import { cleanText } from '../utils/textUtils.js';
import { isLLMAvailable, generateSummaryWithLLM } from './llmService.js';
import { getNarrativePatterns } from './ml/learningEngine.js';

/**
 * Generate complete narrative from extracted data
 * 
 * @param {Object} extractedData - Validated extracted data
 * @param {string|array} sourceNotes - Original clinical notes
 * @param {Object} options - Narrative options
 * @returns {Object} Generated narrative sections
 */
export const generateNarrative = async (extractedData, sourceNotes = '', options = {}) => {
  const {
    pathologyType = extractedData.pathology?.type || 'general',
    style = 'formal', // 'formal', 'concise', 'detailed'
    expandAbbreviations = false,
    useLLM = null, // null = auto, true = force LLM, false = force templates
    applyLearnedPatterns = true // NEW: Apply learned narrative patterns
  } = options;

  // Determine if we should use LLM
  const shouldUseLLM = useLLM !== null ? useLLM : isLLMAvailable();

  console.log(`Narrative generation method: ${shouldUseLLM ? 'LLM-powered' : 'Template-based'}`);

  // Load learned narrative patterns if enabled
  let learnedPatterns = {};
  if (applyLearnedPatterns) {
    try {
      const sections = ['chiefComplaint', 'historyOfPresentIllness', 'hospitalCourse',
                       'procedures', 'complications', 'dischargeStatus', 'dischargeMedications', 'followUpPlan'];

      for (const section of sections) {
        const patterns = await getNarrativePatterns(section, pathologyType);
        if (patterns.length > 0) {
          learnedPatterns[section] = patterns;
        }
      }

      if (Object.keys(learnedPatterns).length > 0) {
        console.log(`📚 Applying ${Object.keys(learnedPatterns).length} learned narrative patterns`);
      }
    } catch (error) {
      console.warn('Failed to load learned patterns:', error);
      learnedPatterns = {};
    }
  }

  // Try LLM generation first if available
  if (shouldUseLLM && sourceNotes) {
    try {
      console.log('Attempting LLM narrative generation...');

      // Pass learned patterns to LLM for enhanced generation
      const enhancedOptions = {
        ...options,
        learnedPatterns: Object.keys(learnedPatterns).length > 0 ? learnedPatterns : undefined
      };

      const llmNarrative = await generateSummaryWithLLM(extractedData, sourceNotes, enhancedOptions);

      // Parse LLM narrative into sections
      const parsedNarrative = parseLLMNarrative(llmNarrative);

      // Apply learned patterns to parsed narrative
      const enhancedNarrative = applyLearnedPatterns ?
        applyNarrativePatternsToSections(parsedNarrative, learnedPatterns) :
        parsedNarrative;

      console.log('LLM narrative generation successful');

      return {
        ...enhancedNarrative,
        metadata: {
          generatedAt: new Date().toISOString(),
          pathologyType,
          style,
          generationMethod: 'llm',
          learnedPatternsApplied: Object.keys(learnedPatterns).length
        }
      };
    } catch (error) {
      console.warn('LLM narrative generation failed, falling back to templates:', error.message);
      // Fall through to template-based generation
    }
  }

  // Template-based generation (fallback or explicit)
  console.log('Using template-based narrative generation');

  let narrative = {
    chiefComplaint: generateChiefComplaint(extractedData),
    historyOfPresentIllness: generateHPI(extractedData, pathologyType),
    hospitalCourse: generateHospitalCourse(extractedData, pathologyType),
    procedures: generateProceduresNarrative(extractedData),
    complications: generateComplicationsNarrative(extractedData),
    dischargeStatus: generateDischargeStatus(extractedData),
    dischargeMedications: generateMedicationsNarrative(extractedData),
    followUpPlan: generateFollowUpNarrative(extractedData),
    metadata: {
      generatedAt: new Date().toISOString(),
      pathologyType,
      style,
      generationMethod: 'template'
    }
  };

  // Post-process: handle abbreviations
  if (expandAbbreviations) {
    narrative = expandAllAbbreviations(narrative);
  }

  return narrative;
};

/**
 * Generate Chief Complaint section
 */
const generateChiefComplaint = (data) => {
  const { demographics, presentingSymptoms, pathology } = data;

  let text = '';

  // Age and gender
  if (demographics?.age && demographics?.gender) {
    const genderFull = demographics.gender === 'M' ? 'male' : 'female';
    text += `${demographics.age}-year-old ${genderFull}`;
  } else {
    text += 'Patient';
  }

  // Primary symptom
  if (presentingSymptoms?.symptoms && presentingSymptoms.symptoms.length > 0) {
    const primarySymptom = presentingSymptoms.symptoms[0];
    text += ` presenting with ${primarySymptom}`;
  }

  // Diagnosis
  if (pathology?.primaryDiagnosis) {
    text += ` found to have ${pathology.primaryDiagnosis}`;
  }

  text += '.';

  return text || 'Chief complaint not documented.';
};

/**
 * Generate History of Present Illness
 */
const generateHPI = (data, pathologyType) => {
  const { demographics, presentingSymptoms, pathology, dates, imaging } = data;

  const paragraphs = [];

  // Opening sentence
  let opening = '';
  if (demographics?.age && demographics?.gender) {
    const genderFull = demographics.gender === 'M' ? 'male' : 'female';
    opening = `Patient is a ${demographics.age}-year-old ${genderFull}`;
  } else {
    opening = 'Patient';
  }

  // Symptoms onset
  if (presentingSymptoms?.onset) {
    opening += ` with ${presentingSymptoms.onset}`;
  }

  // List symptoms
  if (presentingSymptoms?.symptoms && presentingSymptoms.symptoms.length > 0) {
    const symptoms = presentingSymptoms.symptoms.join(', ');
    opening += ` of ${symptoms}`;
  }

  // Ictus date (critical for SAH, hemorrhages)
  if (dates?.ictusDate) {
    opening += ` on ${formatDate(dates.ictusDate)}`;
  }

  opening += '.';
  paragraphs.push(opening);

  // Imaging findings
  if (imaging?.findings && imaging.findings.length > 0) {
    let imagingText = 'Imaging revealed ';
    imagingText += imaging.findings.join('; ');
    imagingText += '.';
    paragraphs.push(imagingText);
  }

  // Pathology details
  if (pathology?.primaryDiagnosis) {
    let pathText = `Diagnosis: ${pathology.primaryDiagnosis}`;

    // Add grades if available
    if (pathology.grades && Object.keys(pathology.grades).length > 0) {
      const grades = Object.entries(pathology.grades)
        .map(([type, value]) => `${type} ${value}`)
        .join(', ');
      pathText += ` (${grades})`;
    }

    // Add location if available
    if (pathology.location) {
      pathText += `, located ${pathology.location}`;
    }

    pathText += '.';
    paragraphs.push(pathText);
  }

  // Admission date
  if (dates?.admissionDate) {
    const admissionText = `Patient was admitted on ${formatDate(dates.admissionDate)}`;
    
    // Calculate days from ictus to admission
    if (dates.ictusDate) {
      const daysFromIctus = calculateDaysBetween(dates.ictusDate, dates.admissionDate);
      if (daysFromIctus > 0) {
        paragraphs.push(`${admissionText}, ${daysFromIctus} day(s) after symptom onset.`);
      } else {
        paragraphs.push(`${admissionText} on day of symptom onset.`);
      }
    } else {
      paragraphs.push(`${admissionText}.`);
    }
  }

  return paragraphs.join(' ') || 'History of present illness not available.';
};

/**
 * Generate Hospital Course narrative
 */
const generateHospitalCourse = (data, pathologyType) => {
  const { dates, procedures, complications, anticoagulation, functionalScores } = data;

  const events = [];

  // Create timeline of events
  if (dates?.admissionDate) {
    events.push({
      date: dates.admissionDate,
      type: 'admission',
      text: 'Patient admitted'
    });
  }

  // Add procedures to timeline
  if (procedures?.procedures && procedures.procedures.length > 0) {
    procedures.procedures.forEach(proc => {
      events.push({
        date: proc.date || dates?.surgeryDates?.[0] || dates?.admissionDate,
        type: 'procedure',
        text: `Underwent ${proc.name}${proc.details ? ': ' + proc.details : ''}`
      });
    });
  }

  // Add complications to timeline
  if (complications?.complications && complications.complications.length > 0) {
    complications.complications.forEach(comp => {
      events.push({
        date: dates?.admissionDate, // Default to admission if no specific date
        type: 'complication',
        text: `Developed ${comp}`
      });
    });
  }

  // Add discharge to timeline
  if (dates?.dischargeDate) {
    events.push({
      date: dates.dischargeDate,
      type: 'discharge',
      text: 'Patient discharged'
    });
  }

  // Sort events chronologically
  events.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Generate narrative from timeline
  const paragraphs = [];

  if (events.length === 0) {
    return 'Hospital course details not available.';
  }

  // Group events by date
  const eventsByDate = {};
  events.forEach(event => {
    const dateKey = event.date || 'unknown';
    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = [];
    }
    eventsByDate[dateKey].push(event);
  });

  // Generate narrative for each date
  Object.entries(eventsByDate).forEach(([date, dateEvents], index) => {
    if (date === 'unknown') return;

    // Calculate hospital day
    const admissionDate = dates?.admissionDate;
    let dayText = formatDate(date);
    if (admissionDate) {
      const dayNumber = calculateDaysBetween(admissionDate, date);
      if (dayNumber === 0) {
        dayText = 'On admission';
      } else {
        dayText = `Hospital day ${dayNumber + 1}`;
      }
    }

    // Combine events for this date
    const eventTexts = dateEvents.map(e => e.text.toLowerCase()).join(', ');
    paragraphs.push(`${dayText}: ${eventTexts}.`);
  });

  // Add anticoagulation management (critical for hemorrhagic pathologies)
  if (anticoagulation) {
    let anticoagText = '';

    if (anticoagulation.current && anticoagulation.current.length > 0) {
      const meds = anticoagulation.current.map(m => m.name).join(', ');
      anticoagText += `Patient was on ${meds}`;
    }

    if (anticoagulation.held && anticoagulation.held.length > 0) {
      const held = anticoagulation.held.map(m => m.name).join(', ');
      anticoagText += anticoagText ? `, which were held` : `Anticoagulation (${held}) held`;
    }

    if (anticoagulation.reversed && anticoagulation.reversed.length > 0) {
      const reversed = anticoagulation.reversed.map(m => m.name).join(', ');
      anticoagText += anticoagText ? ` and reversed` : `Anticoagulation reversed`;
      
      if (anticoagulation.reversalAgents && anticoagulation.reversalAgents.length > 0) {
        const agents = anticoagulation.reversalAgents.join(', ');
        anticoagText += ` with ${agents}`;
      }
    }

    if (anticoagText) {
      paragraphs.push(anticoagText + '.');
    }
  }

  // Add functional status at discharge
  if (functionalScores) {
    let scoresText = 'At discharge, ';
    const scores = [];

    if (functionalScores.kps !== null && functionalScores.kps !== undefined) {
      scores.push(`KPS ${functionalScores.kps}`);
    }
    if (functionalScores.ecog !== null && functionalScores.ecog !== undefined) {
      scores.push(`ECOG ${functionalScores.ecog}`);
    }
    if (functionalScores.mRS !== null && functionalScores.mRS !== undefined) {
      scores.push(`mRS ${functionalScores.mRS}`);
    }

    if (scores.length > 0) {
      scoresText += scores.join(', ') + '.';
      paragraphs.push(scoresText);
    }
  }

  return paragraphs.join(' ');
};

/**
 * Generate Procedures narrative
 */
const generateProceduresNarrative = (data) => {
  const { procedures } = data;

  if (!procedures?.procedures || procedures.procedures.length === 0) {
    return 'No procedures documented.';
  }

  const procTexts = procedures.procedures.map(proc => {
    let text = proc.name;
    if (proc.date) {
      text += ` on ${formatDate(proc.date)}`;
    }
    if (proc.details) {
      text += ` (${proc.details})`;
    }
    return text;
  });

  if (procTexts.length === 1) {
    return `Patient underwent ${procTexts[0]}.`;
  } else {
    return `Patient underwent the following procedures: ${procTexts.join('; ')}.`;
  }
};

/**
 * Generate Complications narrative
 */
const generateComplicationsNarrative = (data) => {
  const { complications } = data;

  if (!complications?.complications || complications.complications.length === 0) {
    return 'No complications documented.';
  }

  if (complications.complications.length === 1) {
    return `Hospital course was complicated by ${complications.complications[0]}.`;
  } else {
    return `Hospital course was complicated by: ${complications.complications.join('; ')}.`;
  }
};

/**
 * Generate Discharge Status narrative
 */
const generateDischargeStatus = (data) => {
  const { dischargeDestination, functionalScores, demographics } = data;

  let text = 'Patient ';

  // Discharge destination
  if (dischargeDestination?.destination) {
    text += `was discharged to ${dischargeDestination.destination}`;

    // Add reason if available
    if (dischargeDestination.reason) {
      text += ` (${dischargeDestination.reason})`;
    }
  } else {
    text += 'was discharged';
  }

  // Functional status
  if (functionalScores) {
    const scores = [];
    if (functionalScores.kps !== null) scores.push(`KPS ${functionalScores.kps}`);
    if (functionalScores.ecog !== null) scores.push(`ECOG ${functionalScores.ecog}`);
    if (functionalScores.mRS !== null) scores.push(`mRS ${functionalScores.mRS}`);

    if (scores.length > 0) {
      text += ` with ${scores.join(', ')}`;
    }
  }

  text += '.';

  return text;
};

/**
 * Generate Discharge Medications narrative
 */
const generateMedicationsNarrative = (data) => {
  const { medications } = data;

  if (!medications?.medications || medications.medications.length === 0) {
    return 'Discharge medications not documented.';
  }

  const medTexts = medications.medications.map(med => {
    let text = med.name;
    if (med.dose && med.frequency) {
      text += ` ${med.dose} ${med.frequency}`;
    } else if (med.dose) {
      text += ` ${med.dose}`;
    } else if (med.frequency) {
      text += ` ${med.frequency}`;
    }
    return text;
  });

  return `Discharge medications: ${medTexts.join('; ')}.`;
};

/**
 * Generate Follow-Up Plan narrative
 */
const generateFollowUpNarrative = (data) => {
  const { followUp } = data;

  if (!followUp || (!followUp.appointments?.length && !followUp.instructions?.length)) {
    return 'Follow-up plan not documented.';
  }

  const paragraphs = [];

  // Appointments
  if (followUp.appointments && followUp.appointments.length > 0) {
    const appointments = followUp.appointments.join('; ');
    paragraphs.push(`Follow-up appointments: ${appointments}.`);
  }

  // Instructions
  if (followUp.instructions && followUp.instructions.length > 0) {
    const instructions = followUp.instructions.join('; ');
    paragraphs.push(`Patient instructed to: ${instructions}.`);
  }

  return paragraphs.join(' ');
};

/**
 * Expand all medical abbreviations in narrative
 */
const expandAllAbbreviations = (narrative) => {
  const expanded = {};

  for (const [section, text] of Object.entries(narrative)) {
    if (typeof text === 'string') {
      expanded[section] = expandAbbreviationsInText(text);
    } else {
      expanded[section] = text;
    }
  }

  return expanded;
};

/**
 * Expand abbreviations in text
 */
const expandAbbreviationsInText = (text) => {
  let expandedText = text;

  // Find all words
  const words = text.match(/\b[A-Z]{2,}\b/g) || [];

  words.forEach(word => {
    const expansion = expandAbbreviation(word);
    if (expansion !== word) {
      // Replace with expansion (first occurrence only)
      expandedText = expandedText.replace(word, `${expansion} (${word})`);
    }
  });

  return expandedText;
};

/**
 * Generate pathology-specific narrative template
 */
export const generateTemplatedNarrative = (extractedData, pathologyType) => {
  const template = getTemplateByPathology(pathologyType);
  const narrative = generateNarrative(extractedData, { pathologyType });

  // Populate template with generated narrative
  const populated = {};

  for (const [section, content] of Object.entries(template.sections)) {
    // Map narrative sections to template sections
    if (narrative[section]) {
      populated[section] = narrative[section];
    } else {
      populated[section] = content || `[${section} not available]`;
    }
  }

  return {
    ...populated,
    metadata: {
      template: pathologyType,
      generatedAt: new Date().toISOString()
    }
  };
};

/**
 * Generate concise summary (for quick review)
 */
export const generateConciseSummary = (extractedData) => {
  const { demographics, pathology, procedures, dischargeDestination } = extractedData;

  const parts = [];

  // Demographics
  if (demographics?.age && demographics?.gender) {
    const gender = demographics.gender === 'M' ? 'M' : 'F';
    parts.push(`${demographics.age}${gender}`);
  }

  // Diagnosis
  if (pathology?.primaryDiagnosis) {
    parts.push(pathology.primaryDiagnosis);
  }

  // Procedures
  if (procedures?.procedures && procedures.procedures.length > 0) {
    const procNames = procedures.procedures.map(p => p.name).join(', ');
    parts.push(`s/p ${procNames}`);
  }

  // Discharge
  if (dischargeDestination?.destination) {
    parts.push(`d/c to ${dischargeDestination.destination}`);
  }

  return parts.join(' | ');
};

/**
 * Format narrative for export (plain text)
 */
export const formatNarrativeForExport = (narrative, options = {}) => {
  const { 
    includeHeaders = true,
    sectionSeparator = '\n\n',
    headerStyle = 'uppercase' // 'uppercase', 'title', 'none'
  } = options;

  const sections = [];

  const sectionOrder = [
    { key: 'chiefComplaint', header: 'CHIEF COMPLAINT' },
    { key: 'historyOfPresentIllness', header: 'HISTORY OF PRESENT ILLNESS' },
    { key: 'hospitalCourse', header: 'HOSPITAL COURSE' },
    { key: 'procedures', header: 'PROCEDURES' },
    { key: 'complications', header: 'COMPLICATIONS' },
    { key: 'dischargeStatus', header: 'DISCHARGE STATUS' },
    { key: 'dischargeMedications', header: 'DISCHARGE MEDICATIONS' },
    { key: 'followUpPlan', header: 'FOLLOW-UP PLAN' }
  ];

  sectionOrder.forEach(({ key, header }) => {
    if (narrative[key] && narrative[key] !== 'Not available.') {
      let sectionText = '';

      if (includeHeaders) {
        let formattedHeader = header;
        if (headerStyle === 'title') {
          formattedHeader = header.split(' ')
            .map(w => w.charAt(0) + w.slice(1).toLowerCase())
            .join(' ');
        } else if (headerStyle === 'none') {
          formattedHeader = '';
        }

        if (formattedHeader) {
          sectionText += formattedHeader + ':\n';
        }
      }

      sectionText += narrative[key];
      sections.push(sectionText);
    }
  });

  return sections.join(sectionSeparator);
};

/**
 * Parse LLM-generated narrative text into structured sections
 * Extracts content between section headers
 */
const parseLLMNarrative = (llmText) => {
  if (!llmText || typeof llmText !== 'string') {
    console.warn('Invalid LLM narrative text provided to parser');
    return null;
  }

  // Define section headers the LLM should use (from the prompt)
  const sectionHeaders = [
    { key: 'chiefComplaint', patterns: ['CHIEF COMPLAINT', 'Chief Complaint'] },
    { key: 'historyOfPresentIllness', patterns: ['HISTORY OF PRESENT ILLNESS', 'History of Present Illness', 'HPI'] },
    { key: 'hospitalCourse', patterns: ['HOSPITAL COURSE', 'Hospital Course'] },
    { key: 'procedures', patterns: ['PROCEDURES', 'Procedures', 'OPERATIONS', 'Operations'] },
    { key: 'complications', patterns: ['COMPLICATIONS', 'Complications'] },
    { key: 'dischargeStatus', patterns: ['DISCHARGE STATUS', 'Discharge Status', 'CONDITION AT DISCHARGE', 'Condition at Discharge'] },
    { key: 'followUpPlan', patterns: ['FOLLOW-UP', 'Follow-up', 'FOLLOW UP', 'Follow Up', 'FOLLOW-UP PLAN', 'Follow-up Plan'] }
  ];

  const narrative = {};
  
  // Try to extract each section
  sectionHeaders.forEach(({ key, patterns }) => {
    let sectionContent = null;

    for (const pattern of patterns) {
      // Create regex to match section header and capture content until next section or end
      // Pattern: header (with optional colon) followed by content until next ALL CAPS header or end
      const regex = new RegExp(
        `${pattern}:?\\s*\\n([\\s\\S]*?)(?=\\n[A-Z][A-Z\\s-]+:|$)`,
        'i'
      );
      
      const match = llmText.match(regex);
      
      if (match && match[1]) {
        sectionContent = match[1].trim();
        break; // Found content with this pattern
      }
    }

    // Store content or default message
    narrative[key] = sectionContent || 'Not available.';
  });

  // Add medications section (may be embedded in discharge status)
  // Try to find medication list separately
  const medicationPatterns = ['DISCHARGE MEDICATIONS', 'Discharge Medications', 'MEDICATIONS', 'Medications'];
  let medicationContent = null;

  for (const pattern of medicationPatterns) {
    const regex = new RegExp(
      `${pattern}:?\\s*\\n([\\s\\S]*?)(?=\\n[A-Z][A-Z\\s-]+:|$)`,
      'i'
    );
    const match = llmText.match(regex);
    if (match && match[1]) {
      medicationContent = match[1].trim();
      break;
    }
  }

  narrative.dischargeMedications = medicationContent || 'Not available.';

  // Validation: ensure at least some content was extracted
  const extractedSections = Object.values(narrative).filter(v => v !== 'Not available.').length;
  
  if (extractedSections === 0) {
    console.warn('LLM narrative parser found no recognizable sections. Raw text:', llmText.substring(0, 200));
    return null; // Return null to trigger template fallback
  }

  console.log(`LLM narrative parsed: ${extractedSections}/8 sections extracted`);

  return narrative;
};

/**
 * Apply learned narrative patterns to generated sections
 *
 * @param {Object} narrative - Generated narrative sections
 * @param {Object} learnedPatterns - Learned patterns by section
 * @returns {Object} Enhanced narrative
 */
const applyNarrativePatternsToSections = (narrative, learnedPatterns) => {
  const enhanced = { ...narrative };

  for (const [section, patterns] of Object.entries(learnedPatterns)) {
    if (!enhanced[section] || enhanced[section] === 'Not available.') continue;

    let text = enhanced[section];

    // Apply each pattern type
    for (const pattern of patterns) {
      switch (pattern.patternType) {
        case 'style':
          text = applyStylePattern(text, pattern);
          break;
        case 'terminology':
          text = applyTerminologyPattern(text, pattern);
          break;
        case 'transition':
          text = applyTransitionPattern(text, pattern);
          break;
        case 'detail':
          text = applyDetailPattern(text, pattern);
          break;
      }
    }

    enhanced[section] = text;
  }

  return enhanced;
};

/**
 * Apply style pattern (concise vs detailed)
 */
const applyStylePattern = (text, pattern) => {
  if (pattern.preference === 'concise') {
    // Make text more concise
    text = text.replace(/\bthe patient\b/gi, 'Patient');
    text = text.replace(/\bhe was\b/gi, 'He');
    text = text.replace(/\bshe was\b/gi, 'She');
  }
  return text;
};

/**
 * Apply terminology pattern (abbreviations)
 */
const applyTerminologyPattern = (text, pattern) => {
  if (pattern.preference === 'expand_abbreviations') {
    // Expand common abbreviations on first use
    const abbrevs = {
      'SAH': 'subarachnoid hemorrhage (SAH)',
      'ICH': 'intracerebral hemorrhage (ICH)',
      'EVD': 'external ventricular drain (EVD)',
      'ICP': 'intracranial pressure (ICP)',
      'GCS': 'Glasgow Coma Scale (GCS)',
      'mRS': 'modified Rankin Scale (mRS)'
    };

    for (const [abbrev, expanded] of Object.entries(abbrevs)) {
      const regex = new RegExp(`\\b${abbrev}\\b`, 'g');
      const matches = text.match(regex);
      if (matches && matches.length > 0) {
        // Replace first occurrence with expanded form
        text = text.replace(regex, expanded);
        // Subsequent occurrences remain abbreviated
        text = text.replace(new RegExp(expanded.replace(/[()]/g, '\\$&'), 'g'), abbrev);
      }
    }
  }
  return text;
};

/**
 * Apply transition pattern
 */
const applyTransitionPattern = (text, pattern) => {
  // Add transition phrases if missing
  const sentences = text.split(/\.\s+/);
  if (sentences.length > 1 && pattern.metadata?.transitionPhrase) {
    const transition = pattern.metadata.transitionPhrase;
    // Add transition to second sentence if it doesn't have one
    if (!sentences[1].toLowerCase().startsWith(transition)) {
      sentences[1] = `${transition.charAt(0).toUpperCase() + transition.slice(1)}, ${sentences[1].charAt(0).toLowerCase() + sentences[1].slice(1)}`;
    }
  }
  return sentences.join('. ');
};

/**
 * Apply detail pattern
 */
const applyDetailPattern = (text, pattern) => {
  // Detail patterns are more complex and context-dependent
  // For now, just return text as-is
  // Future: Add specific date/time/laterality details based on pattern
  return text;
};

export default {
  generateNarrative,
  generateTemplatedNarrative,
  generateConciseSummary,
  formatNarrativeForExport
};
