/**
 * LLM Service
 * 
 * Unified interface for multiple LLM providers (OpenAI, Anthropic, Google Gemini)
 * Handles API calls, error handling, retry logic, and fallback mechanisms
 * 
 * Provider Priority (based on medical text quality):
 * 1. Claude Sonnet 3.5 - Best for structured extraction and natural language
 * 2. GPT-4o - Excellent medical knowledge and reasoning
 * 3. Gemini Pro - Good performance, most cost-effective
 * 
 * CORS Proxy Support:
 * - Set USE_PROXY = true to use backend proxy server (solves CORS issues)
 * - Proxy server must be running on http://localhost:3001
 */

import { getApiKey, hasApiKey, API_PROVIDERS } from '../utils/apiKeys.js';
import { getPreferences, TASK_PRIORITIES } from '../utils/llmPreferences.js';
import knowledgeBase from './knowledge/knowledgeBase.js';
import contextProvider from './context/contextProvider.js';

/**
 * Configuration: Set to true to use proxy server for Anthropic/OpenAI
 * Proxy solves CORS issues by routing requests through backend
 */
const USE_PROXY = true; // Set to false to call APIs directly (will fail for Anthropic/OpenAI due to CORS)
const PROXY_URL = 'http://localhost:3001';

/**
 * LLM Provider configurations
 */
const LLM_CONFIG = {
  [API_PROVIDERS.OPENAI]: {
    name: 'OpenAI GPT-4o',
    endpoint: USE_PROXY ? `${PROXY_URL}/api/openai` : 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o',
    maxTokens: 4000,
    temperature: 0.1, // Low for medical accuracy
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': USE_PROXY ? undefined : `Bearer ${apiKey}` // Proxy handles auth
    })
  },
  [API_PROVIDERS.ANTHROPIC]: {
    name: 'Anthropic Claude 3.5 Sonnet',
    endpoint: USE_PROXY ? `${PROXY_URL}/api/anthropic` : 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 4000,
    temperature: 0.1,
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'x-api-key': USE_PROXY ? undefined : apiKey, // Proxy handles auth
      'anthropic-version': '2023-06-01'
    })
  },
  [API_PROVIDERS.GEMINI]: {
    name: 'Google Gemini 1.5 Pro',
    endpoint: (apiKey) => USE_PROXY ? `${PROXY_URL}/api/gemini` : `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
    model: 'gemini-1.5-pro',
    maxTokens: 4000,
    temperature: 0.1,
    headers: () => ({
      'Content-Type': 'application/json'
    })
  }
};

/**
 * Get active LLM provider based on preferences and task
 * Since API keys are on backend, we just return the preferred provider
 * Backend will handle availability
 */
export const getActiveLLMProvider = (task = null) => {
  const prefs = getPreferences();

  // If specific task provider is set, use it
  if (task === 'extraction' && prefs.extractionProvider) {
    return prefs.extractionProvider;
  }
  if (task === 'summarization' && prefs.summarizationProvider) {
    return prefs.summarizationProvider;
  }

  // If preferred provider is set, use it
  if (prefs.preferredProvider) {
    return prefs.preferredProvider;
  }

  // Auto-select by task priority if enabled
  if (prefs.autoSelectByTask && task && TASK_PRIORITIES[task.toUpperCase()]) {
    const priorities = TASK_PRIORITIES[task.toUpperCase()];
    return priorities[0]; // Return first priority
  }

  // Fallback: use OpenAI GPT-4 (Anthropic has low credits)
  return 'openai';
};

/**
 * Check if LLM is available
 * Always return true since API keys are on backend (not frontend)
 * The backend will handle the actual availability check
 */
export const isLLMAvailable = () => {
  // Always try backend - it has the API keys
  return true;
};

/**
 * Get available providers (have API keys)
 */
export const getAvailableProviders = () => {
  return Object.values(API_PROVIDERS).filter(provider => hasApiKey(provider));
};

/**
 * Timeout wrapper for promises
 */
function withTimeout(promise, timeoutMs = 120000, operation = 'Operation') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

/**
 * Call LLM with unified interface
 */
export const callLLM = async (prompt, options = {}) => {
  const {
    provider = null, // Will auto-select if null
    task = null, // 'extraction' or 'summarization' for smart selection
    systemPrompt = 'You are an expert medical AI assistant specializing in neurosurgery clinical documentation with advanced natural language understanding. Use your medical knowledge and reasoning to deeply comprehend clinical narratives, intelligently deduce information from context, and synthesize multi-source documentation. Apply chronological intelligence and understand the holistic clinical picture beyond discrete data points.',
    maxTokens = 4000,
    temperature = 0.1,
    responseFormat = 'text', // 'text' or 'json'
    timeout = 120000 // 2 minutes default timeout
  } = options;

  // Select provider based on task priority if not specified
  const selectedProvider = provider || getActiveLLMProvider(task);

  if (!selectedProvider) {
    throw new Error('No LLM provider configured. Please add an API key in Settings.');
  }

  // API keys are on backend - we don't need to check frontend
  // Backend will handle authentication
  const apiKey = null; // Not needed - backend has the keys

  const config = LLM_CONFIG[selectedProvider];
  
  console.log(`Using ${config.name} for ${task || 'general'} task`);

  try {
    let response;

    // Wrap LLM call with timeout
    const llmCall = async () => {
      switch (selectedProvider) {
        case API_PROVIDERS.OPENAI:
          return await callOpenAI(prompt, systemPrompt, apiKey, config, { maxTokens, temperature, responseFormat });
        case API_PROVIDERS.ANTHROPIC:
          return await callAnthropic(prompt, systemPrompt, apiKey, config, { maxTokens, temperature });
        case API_PROVIDERS.GEMINI:
          return await callGemini(prompt, systemPrompt, apiKey, config, { maxTokens, temperature });
        default:
          throw new Error(`Unsupported provider: ${selectedProvider}`);
      }
    };

    response = await withTimeout(
      llmCall(),
      timeout,
      `${config.name} API call`
    );

    return response;
  } catch (error) {
    console.error(`LLM call failed (${selectedProvider}):`, error);
    throw error;
  }
};

/**
 * Call OpenAI API
 */
const callOpenAI = async (prompt, systemPrompt, apiKey, config, options) => {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt }
  ];

  const body = {
    model: config.model,
    messages,
    max_tokens: options.maxTokens,
    temperature: options.temperature
  };

  // Add JSON mode if requested
  if (options.responseFormat === 'json') {
    body.response_format = { type: 'json_object' };
    messages[0].content += '\n\nRespond with valid JSON only.';
  }

  // Get headers and remove undefined values (proxy doesn't need auth headers)
  const headers = config.headers(apiKey);
  const cleanHeaders = Object.fromEntries(
    Object.entries(headers).filter(([_, v]) => v !== undefined)
  );

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: cleanHeaders,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No content in OpenAI response');
  }

  return options.responseFormat === 'json' ? JSON.parse(content) : content;
};

/**
 * Call Anthropic API
 */
const callAnthropic = async (prompt, systemPrompt, apiKey, config, options) => {
  const body = {
    model: config.model,
    max_tokens: options.maxTokens,
    temperature: options.temperature,
    system: systemPrompt,
    messages: [
      { role: 'user', content: prompt }
    ]
  };

  // Get headers and remove undefined values (proxy doesn't need auth headers)
  const headers = config.headers(apiKey);
  const cleanHeaders = Object.fromEntries(
    Object.entries(headers).filter(([_, v]) => v !== undefined)
  );

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: cleanHeaders,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.content[0]?.text;

  if (!content) {
    throw new Error('No content in Anthropic response');
  }

  // Try to parse as JSON if it looks like JSON
  if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
    try {
      return JSON.parse(content);
    } catch (e) {
      return content;
    }
  }

  return content;
};

/**
 * Call Google Gemini API
 */
const callGemini = async (prompt, systemPrompt, apiKey, config, options) => {
  const fullPrompt = `${systemPrompt}\n\n${prompt}`;

  const body = {
    contents: [{
      parts: [{ text: fullPrompt }]
    }],
    generationConfig: {
      temperature: options.temperature,
      maxOutputTokens: options.maxTokens
    }
  };

  // Endpoint can be a function (Gemini with API key in URL) or string (proxy)
  const endpoint = typeof config.endpoint === 'function' ? config.endpoint(apiKey) : config.endpoint;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: config.headers(),
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error('No content in Gemini response');
  }

  // Try to parse as JSON if it looks like JSON
  if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
    try {
      return JSON.parse(content);
    } catch (e) {
      return content;
    }
  }

  return content;
};

/**
 * Extract medical entities using LLM
 * Optimized for Claude Sonnet 3.5 > GPT-4o > Gemini Pro
 */
export const extractWithLLM = async (notes, options = {}) => {
  const noteText = Array.isArray(notes) ? notes.join('\n\n') : notes;

  // Build context for extraction
  const context = contextProvider.buildContext(noteText);
  console.log('🧠 Context built for extraction:', {
    pathology: context.pathology.primary,
    consultants: context.consultants.count,
    hasPTOT: context.consultants.hasPTOT,
    complexity: context.clinical.complexity
  });

  // Get relevant knowledge
  const examProtocol = context.pathology.examProtocol;
  const gradingScales = context.pathology.gradingScales;
  const expectedFields = context.pathology.expectedFields;

  // Build knowledge-enhanced prompt
  let knowledgeContext = '';

  // Add pathology-specific guidance
  if (context.pathology.primary !== 'general') {
    knowledgeContext += `\n\n🎯 PATHOLOGY CONTEXT: ${context.pathology.primary}\n`;
    knowledgeContext += `Expected critical fields: ${expectedFields.join(', ')}\n`;

    // Add grading scale information
    if (gradingScales) {
      knowledgeContext += `\nGRADING SCALES:\n`;
      Object.entries(gradingScales).forEach(([scale, info]) => {
        if (info.range) {
          knowledgeContext += `- ${info.name}: Range ${info.range[0]}-${info.range[1]}\n`;
        }
      });
    }
  }

  // Add consultant context
  if (context.consultants.present) {
    knowledgeContext += `\n\n👥 CONSULTANT NOTES PRESENT (${context.consultants.count}):\n`;
    context.consultants.services.forEach(c => {
      knowledgeContext += `- ${c.service.toUpperCase()}: Focus on ${c.focus.join(', ')}\n`;
    });
    if (context.consultants.hasPTOT) {
      knowledgeContext += `⚠️ PT/OT notes are GOLD STANDARD for functional status - prioritize their assessments!\n`;
    }
  }

  // Add clinical reasoning context
  if (context.clinical.reasoning.length > 0) {
    knowledgeContext += `\n\n🔍 CLINICAL REASONING CLUES:\n`;
    context.clinical.reasoning.forEach(r => {
      knowledgeContext += `- ${r.observation} → ${r.inference}\n`;
      knowledgeContext += `  Expected: ${r.expectedFindings.join(', ')}\n`;
    });
  }

  const prompt = `You are an expert neurosurgery AI with advanced natural language understanding. Your mission is to deeply comprehend the clinical narrative, deduce implicit information, and extract a complete picture of the patient's journey.
${knowledgeContext}

These notes represent the FULL CLINICAL STORY - formal EMR documentation, informal progress notes, consultant updates (neurology, PT/OT, radiology), and evolving assessments. Use your advanced medical reasoning to create a comprehensive understanding.

CORE INTELLIGENCE PRINCIPLES:

1. DEEP NATURAL LANGUAGE UNDERSTANDING:
   - Understand medical context beyond literal text - deduce implicit information from clinical reasoning
   - Recognize when "patient improving neurologically" implies better GCS/motor function
   - Infer functional status from OT/PT notes ("ambulating 50 feet" = improving mobility)
   - Understand causality: "started nimodipine for vasospasm prevention" implies aSAH risk
   - Parse consultant-specific language (neurology focuses on deficits, PT on mobility, radiology on imaging evolution)

2. CHRONOLOGICAL INTELLIGENCE & DEDUPLICATION:
   - CRITICAL: If "coiling" or any procedure is mentioned in 5 daily notes, this is ONE procedure, not five
   - Identify the ACTUAL procedure date (usually first mention or with explicit date/operator)
   - Subsequent mentions are follow-up references ("s/p coiling", "post-coiling day 3")
   - Same principle for complications: "vasospasm" mentioned daily = one complication with ongoing management
   - Track temporal evolution: initial presentation → intervention → complications → recovery trajectory
   - Convert relative dates ("POD#3", "HD#5", "3 days ago") to absolute dates using note timestamps

3. INFERENCE & DEDUCTION (Use Medical Reasoning):
   - Deduce Hunt-Hess grade from clinical description if not explicitly stated
   - Infer mRS/functional status from discharge destination and support level
   - Understand medication implications (aspirin held → bleeding concern, nimodipine started → vasospasm risk)
   - Connect symptoms to diagnosis (sudden headache + SAH = likely aneurysmal bleed)
   - Recognize implied procedures (EVD mentioned → EVD placement occurred)

4. HOLISTIC CLINICAL COURSE UNDERSTANDING:
   - Go beyond discrete data points - understand the NARRATIVE ARC of hospitalization
   - Capture clinical evolution: initial severity → intervention response → trajectory
   - Synthesize information across multiple note types into coherent story
   - Identify turning points (clinical improvement, complications, change in management)
   - Understand overall prognosis indicators embedded in notes

5. MULTI-SOURCE INTEGRATION:
   - Synthesize formal attending notes + brief resident updates + consultant recommendations
   - Extract functional status from OT notes ("requires moderate assist", "wheelchair level")
   - Parse PT assessments for mobility and independence levels
   - Integrate imaging reports (radiologist impressions) with clinical correlation
   - Recognize different writing styles: attendings (comprehensive), residents (brief), consultants (specialty-focused)

6. VARIABLE STYLE MASTERY:
   - Handle telegraphic notes: "63F aSAH H&H3 s/p coiling POD#2 stable"
   - Parse formal discharge summaries with complete sentences
   - Understand abbreviations in context (C/O, S/P, W/, POD, HD, NT/ND, PERRL, MAE)
   - Recognize section headers OR parse unstructured narrative equally well

7. SAFETY-CRITICAL AWARENESS:
   - Track anticoagulation status meticulously (held vs discontinued vs active)
   - Note bleeding risk factors and reversal agents
   - Identify critical complications requiring urgent intervention

8. CLINICAL PRECISION:
   - Maintain medical accuracy and exact terminology
   - Use null only when information truly cannot be determined
   - Date format: YYYY-MM-DD (infer year from context if needed)
   - Distinguish between past medical history and current presentation

FOUNDATIONAL EXTRACTION PRINCIPLES (Essential Accuracy):

9. CHRONOLOGICAL ACCURACY:
   - Distinguish initial presentation from complications from follow-up events
   - Track temporal markers precisely (POD#3, HD#5, "3 days ago", timestamps)
   - Recognize timeline transitions (admission → ICU → floor → discharge)

10. NULL VALUE DISCIPLINE:
    - Use null for missing information - NEVER fill gaps with assumptions
    - Only extract what can be determined from the notes (explicitly stated OR reasonably deduced)
    - Empty fields remain null unless medical reasoning provides clear inference

11. DATE FORMAT STANDARDIZATION:
    - Always use YYYY-MM-DD format for all dates
    - Convert MM/DD/YY to YYYY-MM-DD when needed
    - Extract exact dates when available, use null if truly unknown

12. CLINICAL PRECISION:
    - Maintain medical accuracy and terminology exactly as stated
    - Preserve specific values (GCS 13, mRS 2, Hunt-Hess 3)
    - Keep medication names, doses, and frequencies accurate

13. CONTEXT AWARENESS:
    - Distinguish between past medical history (PMH) and current presentation
    - Separate chronic conditions from acute events
    - Recognize "history of stroke" (past) vs "presented with stroke" (current)

14. VARIABLE STYLE MASTERY (Already covered above, ensuring completeness):
    - Handle informal abbreviations: C/O (complains of), S/P (status post), W/ (with), POD (post-op day), HD (hospital day)
    - Parse telegraphic notes and formal documentation equally well

15. STRUCTURED & UNSTRUCTURED PARSING:
    - Recognize common note sections (HPI, PE, Imaging, Assessment, Plan) even without headers
    - Extract from progress notes when formal sections absent
    - Recognize procedures mentioned casually ("EVD placed today", "underwent coiling", "s/p craniotomy")
    - Parse vital changes and exam findings embedded in narrative text
    - Identify complications mentioned anywhere (not just in dedicated sections)

EXTRACTION WORKFLOW:
Step 1: Read ALL notes chronologically to understand the complete story
Step 2: Identify the PRIMARY EVENT (admission reason, ictus)
Step 3: Track INTERVENTIONS (procedures with actual dates, not repeated mentions)
Step 4: Monitor COMPLICATIONS (new events vs ongoing management)
Step 5: Assess FUNCTIONAL EVOLUTION (initial status → discharge status)
Step 6: Synthesize NARRATIVE ARC (clinical trajectory)
Step 7: Apply NULL discipline - missing data stays null unless deducible

REQUIRED JSON STRUCTURE:
{
  "demographics": {
    "age": number or null,
    "gender": "M" or "F" or null
  },
  "dates": {
    "ictusDate": "YYYY-MM-DD" or null,  // Symptom onset / ictus event
    "admissionDate": "YYYY-MM-DD" or null,
    "dischargeDate": "YYYY-MM-DD" or null
  },
  "pathology": {
    "type": "aSAH" | "ICH" | "SDH" | "brain tumor" | "TBI" | etc or null,
    "location": string or null,  // e.g., "left MCA aneurysm", "right temporal ICH"
    "huntHess": number (1-5) or null,  // For SAH only
    "fisher": number (1-4) or null,  // For SAH only
    "size": string or null  // e.g., "5mm", "30cc"
  },
  "presentingSymptoms": [
    "symptom1", "symptom2"  // e.g., "sudden severe headache", "altered mental status"
  ],
  "procedures": [
    {
      "name": "procedure name",  // e.g., "coiling", "EVD placement", "craniotomy"
      "date": "YYYY-MM-DD" or null,
      "operator": string or null
    }
  ],
  "complications": [
    {
      "name": "complication name",  // e.g., "vasospasm", "hydrocephalus", "CSF leak"
      "date": "YYYY-MM-DD" or null,
      "severity": "mild" | "moderate" | "severe" or null,
      "management": string or null  // How it was treated
    }
  ],
  "anticoagulation": {
    "medications": [
      {
        "name": "medication name",  // e.g., "aspirin", "warfarin", "heparin"
        "status": "active" | "held" | "discontinued",
        "date": "YYYY-MM-DD" or null,  // When status changed
        "reversalAgent": string or null  // e.g., "vitamin K", "PCC"
      }
    ],
    "critical": boolean  // True if patient on anticoagulation requiring reversal
  },
  "imaging": {
    "findings": [string],  // List of imaging findings in chronological order
    "dates": ["YYYY-MM-DD"]  // Corresponding dates
  },
  "functionalScores": {
    "mRS": number (0-6) or null,  // Modified Rankin Scale
    "KPS": number (0-100) or null,  // Karnofsky Performance Status
    "GCS": number (3-15) or null  // Glasgow Coma Scale
  },
  "medications": [
    {
      "name": string,
      "dose": string or null,
      "frequency": string or null,
      "route": string or null
    }
  ],
  "followUp": {
    "appointments": [
      {
        "specialty": string,  // e.g., "Neurosurgery", "Neurology"
        "timeframe": string  // e.g., "2 weeks", "3 months"
      }
    ],
    "imaging": [string]  // e.g., "CTA in 6 weeks", "MRI brain in 3 months"
  },
  "dischargeDestination": {
    "location": "Home" | "Rehab" | "SNF" | "LTAC" | "Hospice" | etc,
    "support": string or null  // e.g., "with family", "home health", "24/7 care"
  }
}

CRITICAL INTELLIGENCE REMINDERS:

✓ CHRONOLOGICAL DEDUPLICATION: Procedure mentioned 5 times = 1 procedure (find actual date)
✓ NATURAL LANGUAGE INFERENCE: Use medical reasoning to deduce implicit information
✓ MULTI-SOURCE SYNTHESIS: Integrate attending + resident + PT/OT + consultant notes
✓ CONSULTANT NOTES ARE CRITICAL: When present, consultant notes (neurology, PT/OT, cardiology, etc.) provide specialty expertise and critical recommendations - prioritize their findings and integrate their assessments into the clinical picture
✓ FUNCTIONAL STATUS: Extract mobility/independence from OT/PT descriptions (these are often ONLY in PT/OT consult notes)
✓ CLINICAL EVOLUTION: Capture the narrative arc, not just discrete data points
✓ CONSULTANT STYLES: Understand neurology (deficit-focused), PT (mobility-focused), cardiology (cardiac risk), ID (antibiotic stewardship), etc.
✓ TEMPORAL INTELLIGENCE: "POD#3" → actual date, "improving" → better functional scores

EXAMPLE OF CHRONOLOGICAL INTELLIGENCE:
Note 1 (Oct 1): "Underwent coiling of PCOM aneurysm by Dr. Smith"  → EXTRACT THIS as procedure with date
Note 2 (Oct 2): "S/P coiling, monitoring for vasospasm"  → Reference only, NOT a new procedure
Note 3 (Oct 3): "Post-coiling day 2, stable"  → Reference only, NOT a new procedure
Note 4 (Oct 4): "Continues to do well post-coiling"  → Reference only, NOT a new procedure
Result: ONE procedure on Oct 1, not four procedures

EXAMPLE OF NATURAL LANGUAGE INFERENCE:
"Patient discharged home with family support, ambulating independently"
→ Deduce: mRS likely 0-2, KPS likely 80-90, good functional outcome

"Requires moderate assist for transfers, wheelchair level mobility"
→ Deduce: mRS likely 4-5, KPS likely 40-50, significant disability

CLINICAL NOTES:
${noteText}

Return ONLY the JSON object with no markdown formatting, no explanation, no code blocks:`;

  const result = await callLLM(prompt, {
    ...options,
    task: 'extraction',
    responseFormat: 'json',
    systemPrompt: 'You are an expert neurosurgery AI with advanced natural language understanding and clinical reasoning capabilities. Your mission is to deeply comprehend clinical narratives, intelligently deduce implicit information using medical knowledge, and synthesize multi-source documentation (EMR notes, consultant updates, PT/OT assessments) into a complete clinical picture. Apply chronological intelligence to deduplicate repeated procedure mentions (procedure mentioned 5x = 1 procedure). Use inference to extract functional status from descriptive text. Understand the holistic clinical evolution beyond discrete data points. Handle variable writing styles from different providers seamlessly. Return only valid JSON with comprehensive, medically-reasoned extraction.'
  });

  // Validate extracted data against knowledge base
  const validation = knowledgeBase.validateExtractedData(result, context.pathology.primary);

  if (!validation.valid) {
    console.warn('⚠️ Validation errors found:', validation.errors);
    // Attach validation errors to result for user review
    result._validationErrors = validation.errors;
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️ Validation warnings:', validation.warnings);
    result._validationWarnings = validation.warnings;
  }

  // Suggest missing critical fields
  const suggestions = knowledgeBase.suggestMissingFields(result, context.pathology.primary);
  if (suggestions.length > 0) {
    console.log('💡 Suggested missing fields:', suggestions);
    result._suggestions = suggestions;
  }

  return result;
};

/**
 * Generate discharge summary narrative using LLM
 * Optimized for Claude Sonnet 3.5 > GPT-4o > Gemini Pro for natural medical language
 */
export const generateSummaryWithLLM = async (extractedData, sourceNotes, options = {}) => {
  // Get pathology type for pathology-specific prompts
  // Defensive programming: Handle different pathology data structures
  let pathologyType = 'general';

  if (extractedData.pathology) {
    if (typeof extractedData.pathology === 'string') {
      pathologyType = extractedData.pathology;
    } else if (typeof extractedData.pathology === 'object') {
      pathologyType = extractedData.pathology.type || extractedData.pathology.primaryDiagnosis || 'general';
    }
  }

  // Ensure pathologyType is a string
  if (typeof pathologyType !== 'string') {
    console.warn('⚠️ pathologyType is not a string:', typeof pathologyType, pathologyType);
    pathologyType = 'general';
  }

  // Build context for summary generation
  const context = contextProvider.buildContext(sourceNotes, extractedData);
  console.log('🧠 Context built for summary generation:', {
    pathology: context.pathology.primary,
    consultants: context.consultants.count,
    complexity: context.clinical.complexity
  });

  // Get relevant knowledge
  const redFlags = knowledgeBase.getRedFlags(pathologyType);
  const followUpProtocol = knowledgeBase.getFollowUpProtocol(pathologyType);

  // Get learned patterns if provided
  const learnedPatterns = options.learnedPatterns || {};

  // Build pathology-specific guidance
  const pathologyGuidance = getPathologySpecificGuidance(pathologyType);

  // Build learned patterns guidance
  const learnedPatternsGuidance = buildLearnedPatternsGuidance(learnedPatterns);

  // Build knowledge-enhanced guidance
  let knowledgeGuidance = '';

  if (redFlags && redFlags.length > 0) {
    knowledgeGuidance += `\n\n🚨 RED FLAGS TO INCLUDE IN DISCHARGE INSTRUCTIONS:\n`;
    redFlags.forEach(flag => {
      knowledgeGuidance += `- ${flag}\n`;
    });
  }

  if (followUpProtocol) {
    knowledgeGuidance += `\n\n📅 FOLLOW-UP PROTOCOL FOR ${pathologyType.toUpperCase()}:\n`;
    if (followUpProtocol.clinic) {
      knowledgeGuidance += `Clinic visits: ${followUpProtocol.clinic.join(', ')}\n`;
    }
    if (followUpProtocol.imaging) {
      knowledgeGuidance += `Imaging: ${JSON.stringify(followUpProtocol.imaging)}\n`;
    }
  }

  // Add consultant context
  if (context.consultants.present) {
    knowledgeGuidance += `\n\n👥 CONSULTANT EXPERTISE AVAILABLE:\n`;
    context.consultants.services.forEach(c => {
      knowledgeGuidance += `- ${c.service.toUpperCase()}: Integrate their ${c.focus.join(', ')} assessments\n`;
    });
  }

  const prompt = `You are an expert neurosurgery attending physician with exceptional clinical narrative writing skills. Your task is to craft a comprehensive discharge summary that tells the complete CLINICAL STORY - synthesizing structured data, multiple note types, and your medical understanding into a coherent, insightful narrative.

STRUCTURED DATA (Extracted by AI):
${JSON.stringify(extractedData, null, 2)}

ORIGINAL CLINICAL NOTES (All Sources - Attending, Resident, Consultant, PT/OT):
${sourceNotes}

${pathologyGuidance}

${learnedPatternsGuidance}

${knowledgeGuidance}

ADVANCED WRITING PRINCIPLES:

1. CLINICAL NARRATIVE ARC (Tell the Story):
   - This is not just a data dump - it's the patient's JOURNEY through their neurosurgical event
   - Capture the narrative: ictus → presentation → diagnosis → intervention → evolution → outcome
   - Show cause-effect relationships: "Given persistent vasospasm, nimodipine was escalated..."
   - Highlight turning points: "Clinical course complicated by...", "Patient showed marked improvement after..."
   - Convey the overall trajectory: deterioration → stabilization → recovery OR stable → discharge

2. DEEP NATURAL LANGUAGE SYNTHESIS:
   - Synthesize insights from MULTIPLE sources: formal attending notes, brief resident updates, PT/OT functional assessments, consultant recommendations
   - **PRIORITIZE CONSULTANT NOTES**: When present, consultant notes (neurology, PT/OT, cardiology, ID, etc.) provide critical specialty expertise - integrate their findings, recommendations, and assessments prominently into the narrative
   - Extract the "signal" from repetitive notes: mentioned "coiling" 5x = describe once with clinical context
   - Understand consultant perspectives: Neurology (neurological deficits, seizure risk), PT (mobility/transfers/gait), OT (ADL independence/cognition), Cardiology (cardiac risk), ID (antibiotic selection), Endocrine (glucose management)
   - **PT/OT assessments are GOLD STANDARD for functional status** - use their specific descriptions ("requires moderate assist for transfers", "wheelchair level mobility", "modified independent for ADLs")
   - Infer functional status evolution: "Initially required maximal assist, progressed to modified independence per PT/OT"
   - Connect clinical events to functional outcomes: "Following EVD removal, patient's mental status cleared significantly per neurology consult"

3. CHRONOLOGICAL INTELLIGENCE:
   - Present events in clear temporal flow with specific dates when available
   - Use medical time markers naturally: "On hospital day 3...", "Post-operative day 5...", "By discharge..."
   - Deduplicate repetitive content - if procedure mentioned daily, describe ONCE at actual occurrence
   - Track evolution over time: initial exam → post-intervention exam → discharge exam
   - Show temporal relationships: "Three days following coiling, patient developed symptomatic vasospasm..."

4. HOLISTIC CLINICAL COURSE UNDERSTANDING:
   - Go beyond discrete events - paint the COMPLETE PICTURE
   - Integrate imaging evolution with clinical correlation
   - Connect procedures to indications and outcomes
   - Describe complication management comprehensively (recognition → intervention → resolution)
   - Synthesize functional status from multiple sources: formal scores + PT/OT assessments + discharge destination

5. PROFESSIONAL MEDICAL PROSE:
   - Write for attending-level physicians - sophisticated yet clear
   - Use flowing narrative paragraphs (not bullet points unless listing procedures/medications)
   - Past tense for completed events, present tense for current status
   - Spell out abbreviations on first use, then use standard abbreviations
   - Natural medical language: "The patient tolerated the procedure well and was extubated on POD#1"

6. COMPREHENSIVE YET FOCUSED:
   - Include ALL clinically significant information (from any source)
   - Omit trivial daily vital signs unless clinically relevant
   - Every sentence should convey meaningful clinical information
   - Synthesize repetitive content into comprehensive statements

7. SAFETY-CRITICAL EMPHASIS:
   - Anticoagulation status prominently featured (held, when to resume, rationale)
   - Bleeding risk factors clearly stated
   - Critical medication changes explained with clinical context

REQUIRED SECTIONS:

**CHIEF COMPLAINT:**
Brief 1-2 sentence statement of presenting problem and admission reason.

**HISTORY OF PRESENT ILLNESS:**
Detailed chronological narrative from symptom onset (ictus) through admission. Include presenting symptoms, initial imaging findings, Hunt-Hess and Fisher grades if applicable, and admission decision rationale.

**HOSPITAL COURSE:**
Comprehensive day-by-day or system-by-system narrative of the hospitalization. Include:
- Initial management and interventions
- Procedures performed (with dates and operators)
- Complications encountered and their management
- Response to treatment
- Imaging findings over time
- Changes in neurological status
- ICU vs floor care transitions

**PROCEDURES:**
List all surgical/interventional procedures with:
- Full procedure name (spelled out)
- Date performed
- Operator name
- Brief indication/outcome if relevant

**COMPLICATIONS:**
If any complications occurred, describe each with:
- Nature of complication
- Date of occurrence
- Severity
- Management approach
- Resolution status

**DISCHARGE STATUS:**
- Current functional status (GCS, mRS, KPS scores if available)
- Neurological examination findings at discharge
- Discharge medications (with indication for new medications)
- Anticoagulation status (CRITICAL - if held, when to resume)
- Discharge destination and support level

**FOLLOW-UP:**
- Clinic appointments (specialty, timeframe)
- Follow-up imaging studies needed
- Any specific instructions or precautions

NARRATIVE STYLE EXAMPLE:
"The patient is a 58-year-old woman who presented on October 1, 2025 with sudden onset severe headache while at work. Initial CT head revealed diffuse subarachnoid hemorrhage, Hunt-Hess grade 3, Fisher grade 4. CTA demonstrated a 5mm left posterior communicating artery aneurysm. She was admitted to the neurosurgical ICU for close monitoring..."

Generate the complete discharge summary:`;

  const narrative = await callLLM(prompt, {
    ...options,
    task: 'summarization',
    systemPrompt: 'You are an expert neurosurgery attending physician with exceptional clinical narrative writing skills and advanced natural language understanding. Synthesize multiple note types (attending, resident, PT/OT, consultants) into a coherent clinical story. Apply chronological intelligence to deduplicate repetitive mentions. Use medical reasoning to connect clinical events, functional evolution, and outcomes. Write sophisticated yet clear discharge summaries that capture the complete patient journey - not just discrete data points, but the narrative arc of their hospitalization. Your writing demonstrates deep understanding of neurosurgical pathology, clinical reasoning, and holistic patient care.',
    maxTokens: 4000,
    temperature: 0.2  // Slightly higher for more natural language
  });

  return narrative;
};

/**
 * Test API key validity
 */
export const testApiKey = async (provider) => {
  const testPrompt = 'Respond with only the word "SUCCESS" if you can read this.';
  
  try {
    const response = await callLLM(testPrompt, { 
      provider,
      systemPrompt: 'You are a test assistant.',
      maxTokens: 10
    });
    
    return {
      valid: true,
      provider,
      model: LLM_CONFIG[provider].model,
      response: response.trim()
    };
  } catch (error) {
    return {
      valid: false,
      provider,
      error: error.message
    };
  }
};

/**
 * Get pathology-specific guidance for LLM narrative generation
 * @param {string} pathologyType - Pathology type
 * @returns {string} Pathology-specific guidance
 */
const getPathologySpecificGuidance = (pathologyType) => {
  // Defensive programming: Ensure pathologyType is a string
  if (typeof pathologyType !== 'string') {
    console.warn('⚠️ getPathologySpecificGuidance received non-string:', typeof pathologyType, pathologyType);
    return getPathologySpecificGuidance('general');
  }

  const pathologyLower = pathologyType.toLowerCase();

  if (pathologyLower.includes('sah') || pathologyLower.includes('subarachnoid')) {
    return `
PATHOLOGY-SPECIFIC GUIDANCE (Subarachnoid Hemorrhage):
- Emphasize Hunt-Hess and Fisher grades in presentation
- Detail vasospasm monitoring and management (TCDs, angiography, interventions)
- Highlight nimodipine therapy and blood pressure management
- Describe aneurysm securing method (coiling vs clipping) with specific details
- Track neurological status evolution (GCS, focal deficits)
- Mention hydrocephalus development and EVD management if applicable
- Include follow-up angiography plans
- Specify antiplatelet/anticoagulation status and resumption plans`;
  }

  if (pathologyLower.includes('tumor') || pathologyLower.includes('glioma') || pathologyLower.includes('meningioma')) {
    return `
PATHOLOGY-SPECIFIC GUIDANCE (Brain Tumor):
- Specify tumor location, size, and imaging characteristics
- Detail extent of resection (gross total, subtotal, biopsy only)
- Mention histopathology results if available
- Describe neurological deficits and their evolution
- Highlight steroid therapy (dexamethasone dosing and taper plan)
- Include seizure prophylaxis details (Keppra, etc.)
- Specify adjuvant therapy plans (radiation, chemotherapy)
- Detail follow-up imaging schedule
- Mention functional status and rehabilitation needs`;
  }

  if (pathologyLower.includes('ich') || pathologyLower.includes('hemorrhage')) {
    return `
PATHOLOGY-SPECIFIC GUIDANCE (Intracerebral Hemorrhage):
- Specify hemorrhage location, volume, and mass effect
- Detail blood pressure management targets
- Describe anticoagulation reversal if applicable (agents, timing)
- Mention surgical evacuation vs medical management rationale
- Track neurological status and GCS evolution
- Highlight ICP management if applicable
- Include imaging evolution (hematoma stability, resorption)
- Specify anticoagulation resumption plans and timing
- Detail rehabilitation needs and discharge disposition`;
  }

  if (pathologyLower.includes('trauma') || pathologyLower.includes('tbi')) {
    return `
PATHOLOGY-SPECIFIC GUIDANCE (Traumatic Brain Injury):
- Describe mechanism of injury and initial GCS
- Detail CT findings (skull fractures, contusions, SDH, EDH, SAH)
- Specify ICP monitoring and management if applicable
- Mention surgical interventions (craniotomy, craniectomy, ICP monitor)
- Track GCS trajectory and neurological recovery
- Highlight seizure prophylaxis
- Include rehabilitation assessment and needs
- Specify follow-up imaging plans
- Detail restrictions (driving, contact sports, etc.)`;
  }

  if (pathologyLower.includes('spine') || pathologyLower.includes('cervical') || pathologyLower.includes('lumbar')) {
    return `
PATHOLOGY-SPECIFIC GUIDANCE (Spine Surgery):
- Specify levels operated, approach (anterior/posterior), and instrumentation
- Detail preoperative neurological status (motor/sensory levels, bowel/bladder)
- Describe surgical procedure and any complications
- Track postoperative neurological status and changes
- Mention steroid use if applicable (spinal cord injury)
- Include mobilization status and brace requirements
- Specify activity restrictions and lifting precautions
- Detail pain management plan
- Include follow-up imaging and clinic visit schedule`;
  }

  // Default neurosurgical guidance
  return `
PATHOLOGY-SPECIFIC GUIDANCE (General Neurosurgery):
- Provide detailed neurological examination findings
- Track GCS and focal deficits over time
- Describe imaging findings and evolution
- Detail surgical interventions with specific techniques
- Mention ICP management if applicable
- Include medication management (steroids, antiepileptics, etc.)
- Specify rehabilitation needs and functional status
- Detail follow-up plans and imaging schedule`;
};

/**
 * Build guidance from learned narrative patterns
 */
const buildLearnedPatternsGuidance = (learnedPatterns) => {
  if (!learnedPatterns || Object.keys(learnedPatterns).length === 0) {
    return '';
  }

  const guidance = ['LEARNED PREFERENCES (Apply these patterns based on user corrections):'];

  for (const [section, patterns] of Object.entries(learnedPatterns)) {
    const sectionGuidance = [];

    for (const pattern of patterns) {
      if (pattern.patternType === 'style') {
        if (pattern.preference === 'concise') {
          sectionGuidance.push('- Use concise, direct language (avoid verbose phrasing)');
        } else if (pattern.preference === 'detailed') {
          sectionGuidance.push('- Provide detailed, comprehensive descriptions');
        }
      }

      if (pattern.patternType === 'terminology') {
        if (pattern.preference === 'expand_abbreviations') {
          sectionGuidance.push('- Spell out medical abbreviations on first use, then use abbreviation');
        } else if (pattern.preference === 'use_abbreviations') {
          sectionGuidance.push('- Use standard medical abbreviations (SAH, ICH, EVD, etc.)');
        }
      }

      if (pattern.patternType === 'transition') {
        sectionGuidance.push(`- Use transition phrases like "${pattern.metadata?.transitionPhrase}" between sentences`);
      }

      if (pattern.patternType === 'detail') {
        if (pattern.preference === 'add_dates') {
          sectionGuidance.push('- Include specific dates for all events');
        }
        if (pattern.preference === 'add_laterality') {
          sectionGuidance.push('- Always specify laterality (left/right/bilateral)');
        }
      }
    }

    if (sectionGuidance.length > 0) {
      guidance.push(`\n${section.toUpperCase()}:`);
      guidance.push(...sectionGuidance);
    }
  }

  return guidance.length > 1 ? guidance.join('\n') : '';
};

export default {
  callLLM,
  extractWithLLM,
  generateSummaryWithLLM,
  testApiKey,
  isLLMAvailable,
  getActiveLLMProvider,
  getAvailableProviders
};
