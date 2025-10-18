/**
 * Clinical Template LLM Service
 * 
 * Enhanced LLM prompt for generating clinical template format discharge summaries.
 * Uses institutional neurosurgery template structure with comprehensive narrative sections.
 * 
 * Features:
 * - LLM-enhanced narrative generation for *** sections
 * - Follows institutional template format
 * - Professional medical writing style
 * - Comprehensive clinical detail
 * 
 * @module clinicalTemplateLLM
 */

import { callLLMWithFallback } from './llmService.js';
import { generateClinicalTemplateFormat } from '../utils/clinicalTemplate.js';

// ========================================
// LLM-ENHANCED CLINICAL TEMPLATE GENERATION
// ========================================

/**
 * Generate clinical template discharge summary using LLM
 * 
 * This function uses an enhanced LLM prompt that instructs the model to generate
 * comprehensive narrative sections following the institutional template format.
 * 
 * @param {Object} extractedData - Extracted medical data
 * @param {string|string[]} sourceNotes - Original clinical notes
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Formatted clinical template
 */
export async function generateClinicalTemplateSummary(extractedData, sourceNotes, options = {}) {
  const {
    useFastModel = false,
    enableCache = true,
    timeout = 120000
  } = options;

  // Prepare source notes
  const notesText = Array.isArray(sourceNotes) ? sourceNotes.join('\n\n---\n\n') : sourceNotes;

  // Build enhanced prompt for clinical template format
  const prompt = buildClinicalTemplatePrompt(extractedData, notesText);

  try {
    // Call LLM with enhanced prompt
    const narrativeSections = await callLLMWithFallback(prompt, {
      task: 'clinical_template_generation',
      systemPrompt: buildSystemPrompt(),
      maxTokens: 5000,
      temperature: 0.15,
      enableCache,
      enableFallback: true,
      timeout
    });

    // Parse LLM response into narrative sections
    const parsedNarrative = parseLLMNarrativeResponse(narrativeSections);

    // Generate final clinical template with LLM-enhanced narratives
    const clinicalTemplate = generateClinicalTemplateFormat(extractedData, parsedNarrative);

    return clinicalTemplate;

  } catch (error) {
    console.error('[Clinical Template LLM] Error generating template:', error);
    
    // Fallback: Generate template without LLM enhancement
    console.log('[Clinical Template LLM] Falling back to template-only generation');
    return generateClinicalTemplateFormat(extractedData, {});
  }
}

// ========================================
// PROMPT BUILDING
// ========================================

/**
 * Build system prompt for clinical template generation
 */
function buildSystemPrompt() {
  return `You are an expert neurosurgery attending physician writing a comprehensive discharge summary following institutional template format.

Your task is to generate detailed narrative sections that will fill the *** markers in the clinical template.

WRITING STYLE:
- Use professional medical language
- Write in complete sentences and paragraphs (NOT bullet points)
- Use past tense for historical events
- Use present tense for current status
- Be comprehensive but concise
- Include all relevant clinical details
- Maintain chronological flow

NARRATIVE QUALITY:
- Synthesize information from multiple notes
- Connect clinical events to outcomes
- Explain clinical reasoning
- Provide context for decisions
- Describe patient's clinical trajectory

OUTPUT FORMAT:
Return a JSON object with these sections:
{
  "historyOfPresentIllness": "Comprehensive HPI narrative...",
  "hospitalCourse": "Detailed hospital course narrative...",
  "dischargeStatus": "Functional status description...",
  "neurologicalExam": "Neurological examination findings...",
  "procedures": "Procedure details and outcomes...",
  "followUpPlan": "Follow-up instructions..."
}`;
}

/**
 * Build clinical template prompt
 */
function buildClinicalTemplatePrompt(extractedData, sourceNotes) {
  const demographics = extractedData.demographics || {};
  const pathology = extractedData.pathology || {};
  const dates = extractedData.dates || {};
  const procedures = extractedData.procedures?.procedures || extractedData.procedures || [];
  const complications = extractedData.complications?.complications || extractedData.complications || [];
  const functionalScores = extractedData.functionalScores || {};
  const medications = extractedData.medications?.discharge || extractedData.dischargeMedications || [];

  return `Generate comprehensive narrative sections for a neurosurgery discharge summary following institutional template format.

PATIENT INFORMATION:
- Name: ${demographics.name || '[Name]'}
- Age: ${demographics.age || '[Age]'}
- Gender: ${demographics.sex || demographics.gender || '[Gender]'}
- MRN: ${demographics.mrn || '[MRN]'}

CLINICAL SUMMARY:
- Diagnosis: ${pathology.primaryDiagnosis || pathology.type || '[Diagnosis]'}
- Location: ${pathology.location || 'Not specified'}
- Admission Date: ${dates.admissionDate || dates.admission || '[Date]'}
- Discharge Date: ${dates.dischargeDate || dates.discharge || '[Date]'}

PROCEDURES PERFORMED:
${procedures.length > 0 ? procedures.map((p, i) => {
  const name = p.name || p.procedure || p;
  const date = p.date || 'Date not specified';
  return `${i + 1}. ${name} (${date})`;
}).join('\n') : 'None documented'}

COMPLICATIONS:
${complications.length > 0 ? complications.map(c => {
  const comp = typeof c === 'string' ? c : (c.complication || c.name);
  return `- ${comp}`;
}).join('\n') : 'None'}

FUNCTIONAL STATUS AT DISCHARGE:
${functionalScores.gcs ? `- GCS: ${functionalScores.gcs}` : ''}
${functionalScores.mRS !== null && functionalScores.mRS !== undefined ? `- mRS: ${functionalScores.mRS}` : ''}
${functionalScores.kps ? `- KPS: ${functionalScores.kps}` : ''}

DISCHARGE MEDICATIONS:
${medications.length > 0 ? medications.map((m, i) => {
  const name = m.name || m.medication || m;
  const dose = m.dose || m.dosage || '';
  const frequency = m.frequency || '';
  return `${i + 1}. ${name} ${dose} ${frequency}`;
}).join('\n') : 'None'}

ORIGINAL CLINICAL NOTES:
${sourceNotes.substring(0, 15000)}

INSTRUCTIONS:
Generate the following narrative sections in JSON format:

1. **historyOfPresentIllness**: 
   - Start with "who presented with [symptoms]"
   - Describe onset, progression, and initial presentation
   - Include relevant timeline and clinical context
   - 3-5 sentences, comprehensive narrative

2. **hospitalCourse**:
   - Chronological narrative of hospital stay
   - Include admission, procedures, complications, recovery
   - Connect events to outcomes
   - Explain clinical decisions
   - 5-8 sentences, detailed narrative

3. **dischargeStatus**:
   - Current functional status
   - Include GCS, mRS, KPS if available
   - Describe neurological status
   - 2-3 sentences

4. **neurologicalExam**:
   - Comprehensive neurological examination
   - Mental status, cranial nerves, motor, sensory, reflexes, coordination, gait
   - Use standard medical terminology
   - Format as paragraph or structured list

5. **procedures**:
   - Detailed description of primary procedure
   - Include approach, findings, technique
   - Mention any intraoperative events
   - 2-3 sentences

6. **followUpPlan**:
   - Follow-up appointments and timeframes
   - Imaging studies needed
   - Activity restrictions
   - Warning signs to watch for
   - 3-4 sentences

Return ONLY the JSON object with these six sections. Use complete sentences and professional medical language.`;
}

// ========================================
// RESPONSE PARSING
// ========================================

/**
 * Parse LLM narrative response into sections
 */
function parseLLMNarrativeResponse(response) {
  try {
    // Try to parse as JSON
    if (typeof response === 'string') {
      // Remove markdown code blocks if present
      let cleaned = response.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```\s*/g, '').replace(/```\s*$/g, '');
      }
      
      const parsed = JSON.parse(cleaned);
      return parsed;
    }
    
    return response;
  } catch (error) {
    console.error('[Clinical Template LLM] Error parsing response:', error);
    
    // Fallback: Try to extract sections from text
    return extractSectionsFromText(response);
  }
}

/**
 * Extract sections from unstructured text response
 */
function extractSectionsFromText(text) {
  const sections = {};
  
  // Try to extract each section using patterns
  const patterns = {
    historyOfPresentIllness: /history of present illness[:\s]+(.*?)(?=hospital course|discharge status|$)/is,
    hospitalCourse: /hospital course[:\s]+(.*?)(?=discharge status|neurological exam|$)/is,
    dischargeStatus: /discharge status[:\s]+(.*?)(?=neurological exam|procedures|$)/is,
    neurologicalExam: /neurological exam(?:ination)?[:\s]+(.*?)(?=procedures|follow[- ]up|$)/is,
    procedures: /procedures[:\s]+(.*?)(?=follow[- ]up|$)/is,
    followUpPlan: /follow[- ]up(?: plan)?[:\s]+(.*?)$/is
  };
  
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match && match[1]) {
      sections[key] = match[1].trim();
    }
  }
  
  return sections;
}

// ========================================
// EXPORTS
// ========================================

export default {
  generateClinicalTemplateSummary
};
