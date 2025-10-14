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
 */
export const getActiveLLMProvider = (task = null) => {
  const prefs = getPreferences();
  
  // If specific task provider is set, use it
  if (task === 'extraction' && prefs.extractionProvider && hasApiKey(prefs.extractionProvider)) {
    return prefs.extractionProvider;
  }
  if (task === 'summarization' && prefs.summarizationProvider && hasApiKey(prefs.summarizationProvider)) {
    return prefs.summarizationProvider;
  }
  
  // If preferred provider is set, use it
  if (prefs.preferredProvider && hasApiKey(prefs.preferredProvider)) {
    return prefs.preferredProvider;
  }
  
  // Auto-select by task priority if enabled
  if (prefs.autoSelectByTask && task && TASK_PRIORITIES[task.toUpperCase()]) {
    const priorities = TASK_PRIORITIES[task.toUpperCase()];
    for (const provider of priorities) {
      if (hasApiKey(provider)) {
        return provider;
      }
    }
  }
  
  // Fallback: use default priority order (Claude > OpenAI > Gemini)
  const defaultPriority = ['anthropic', 'openai', 'gemini'];
  for (const provider of defaultPriority) {
    if (hasApiKey(provider)) {
      return provider;
    }
  }
  
  return null;
};

/**
 * Check if LLM is available
 */
export const isLLMAvailable = () => {
  return getActiveLLMProvider() !== null;
};

/**
 * Get available providers (have API keys)
 */
export const getAvailableProviders = () => {
  return Object.values(API_PROVIDERS).filter(provider => hasApiKey(provider));
};

/**
 * Call LLM with unified interface
 */
export const callLLM = async (prompt, options = {}) => {
  const {
    provider = null, // Will auto-select if null
    task = null, // 'extraction' or 'summarization' for smart selection
    systemPrompt = 'You are a medical AI assistant specializing in neurosurgery clinical documentation. Extract information accurately and only from the provided text. Never extrapolate or infer information not explicitly stated.',
    maxTokens = 4000,
    temperature = 0.1,
    responseFormat = 'text' // 'text' or 'json'
  } = options;

  // Select provider based on task priority if not specified
  const selectedProvider = provider || getActiveLLMProvider(task);
  
  if (!selectedProvider) {
    throw new Error('No LLM provider configured. Please add an API key in Settings.');
  }

  const apiKey = getApiKey(selectedProvider);
  if (!apiKey) {
    throw new Error(`No API key found for ${selectedProvider}`);
  }

  const config = LLM_CONFIG[selectedProvider];
  
  console.log(`Using ${config.name} for ${task || 'general'} task`);
  
  try {
    let response;
    
    switch (selectedProvider) {
      case API_PROVIDERS.OPENAI:
        response = await callOpenAI(prompt, systemPrompt, apiKey, config, { maxTokens, temperature, responseFormat });
        break;
      case API_PROVIDERS.ANTHROPIC:
        response = await callAnthropic(prompt, systemPrompt, apiKey, config, { maxTokens, temperature });
        break;
      case API_PROVIDERS.GEMINI:
        response = await callGemini(prompt, systemPrompt, apiKey, config, { maxTokens, temperature });
        break;
      default:
        throw new Error(`Unsupported provider: ${selectedProvider}`);
    }

    return response;
  } catch (error) {
    console.error(`LLM call failed (${provider}):`, error);
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

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: config.headers(apiKey),
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

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: config.headers(apiKey),
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

  const response = await fetch(config.endpoint(apiKey), {
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

  const prompt = `You are analyzing neurosurgery clinical notes to extract structured medical data. Your task is to create a comprehensive, accurate JSON representation of the patient's case.

EXTRACTION PRINCIPLES:
1. CHRONOLOGICAL ACCURACY: Pay careful attention to the timeline of events
2. EXPLICIT ONLY: Extract ONLY information explicitly stated - never guess, infer, or extrapolate
3. NULL VALUES: Use null for any missing information
4. DATE FORMAT: Use YYYY-MM-DD for all dates (extract exact dates when available)
5. CLINICAL PRECISION: Maintain medical accuracy and terminology
6. SAFETY CRITICAL: Special attention to anticoagulation status (bleeding risk)

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

CLINICAL NOTES:
${noteText}

Return ONLY the JSON object with no markdown formatting, no explanation, no code blocks:`;

  const result = await callLLM(prompt, {
    ...options,
    task: 'extraction',
    responseFormat: 'json',
    systemPrompt: 'You are a medical AI assistant specialized in neurosurgery clinical documentation. Extract structured data with perfect chronological accuracy. Return only valid JSON. Extract only explicitly stated information - never infer or extrapolate.'
  });

  return result;
};

/**
 * Generate discharge summary narrative using LLM
 * Optimized for Claude Sonnet 3.5 > GPT-4o > Gemini Pro for natural medical language
 */
export const generateSummaryWithLLM = async (extractedData, sourceNotes, options = {}) => {
  const prompt = `You are a neurosurgery attending physician writing a comprehensive discharge summary. Using the structured data and original clinical notes provided, create a professional, chronologically coherent narrative discharge summary.

STRUCTURED DATA:
${JSON.stringify(extractedData, null, 2)}

ORIGINAL CLINICAL NOTES:
${sourceNotes}

WRITING REQUIREMENTS:

1. CHRONOLOGICAL COHERENCE:
   - Present events in clear temporal sequence
   - Use specific dates when available (e.g., "On October 13, 2025...")
   - Show progression from admission to discharge
   - Connect cause and effect relationships

2. NATURAL MEDICAL LANGUAGE:
   - Write in past tense for completed events
   - Use professional but readable prose
   - Avoid bullet points - use flowing narrative paragraphs
   - Spell out abbreviations on first use (e.g., "External ventricular drain (EVD)")
   - Use proper medical terminology with clarity

3. COMPREHENSIVE BUT CONCISE:
   - Include all clinically significant information
   - Omit redundant or trivial details
   - Each sentence should add meaningful information
   - Maintain professional tone throughout

4. SAFETY-CRITICAL INFORMATION:
   - Prominently mention anticoagulation status if relevant
   - Highlight bleeding risks or complications
   - Note any critical medications held or discontinued

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
    systemPrompt: 'You are an experienced neurosurgery attending physician with expertise in clear, comprehensive medical documentation. Write discharge summaries with impeccable chronological flow and natural medical language. Your writing should be professional, precise, and easily understood by other clinicians.',
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

export default {
  callLLM,
  extractWithLLM,
  generateSummaryWithLLM,
  testApiKey,
  isLLMAvailable,
  getActiveLLMProvider,
  getAvailableProviders
};
