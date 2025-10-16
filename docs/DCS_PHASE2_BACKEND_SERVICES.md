# PHASE 2: BACKEND SERVICES - COMPLETE CODE

This document contains all backend service implementations for Phase 2.

---

## 2.2.4 Complete LLM Orchestrator (Continued)

**File:** `backend/services/llmOrchestrator.js` (continuation)

```javascript
// ... (previous code from main guide)

/**
 * Call specific provider
 */
async function callProvider(provider, text, options = {}) {
  switch (provider) {
    case 'claude':
      return callClaude(text, options);
    case 'gpt4':
      return callGPT4(text, options);
    case 'gemini':
      return callGemini(text, options);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Extract medical data using LLM with automatic fallback
 * 
 * @param {string} text - Clinical notes to extract from
 * @param {string} provider - Preferred provider (claude, gpt4, gemini)
 * @param {Object} options - Extraction options
 * @returns {Promise<Object>} Extraction result
 */
export async function extractWithLLM(text, provider = 'claude', options = {}) {
  const { temperature = 0.3, maxTokens = 4096, enableFallback = true } = options;
  
  // Validate text
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text input');
  }
  
  // Check if provider is available
  if (!PROVIDER_CONFIG[provider]?.available) {
    if (enableFallback) {
      console.warn(`Provider ${provider} not available, trying fallback...`);
    } else {
      throw new Error(`Provider ${provider} not available`);
    }
  }
  
  // Try primary provider
  if (PROVIDER_CONFIG[provider]?.available) {
    try {
      console.log(`Calling ${provider} for extraction...`);
      const result = await callProvider(provider, text, { temperature, maxTokens });
      return result;
    } catch (error) {
      console.error(`${provider} failed:`, error.message);
      
      if (!enableFallback) {
        throw error;
      }
    }
  }
  
  // Try fallback providers
  if (enableFallback) {
    for (const fallbackProvider of PROVIDER_PRIORITY) {
      if (fallbackProvider === provider) continue;
      
      if (PROVIDER_CONFIG[fallbackProvider]?.available) {
        try {
          console.log(`Trying fallback provider: ${fallbackProvider}...`);
          const result = await callProvider(fallbackProvider, text, { temperature, maxTokens });
          return result;
        } catch (error) {
          console.error(`${fallbackProvider} failed:`, error.message);
          continue;
        }
      }
    }
  }
  
  throw new Error('All LLM providers failed');
}

/**
 * Test provider connection
 */
export async function testProvider(provider) {
  if (!PROVIDER_CONFIG[provider]) {
    return {
      success: false,
      error: 'Unknown provider',
    };
  }
  
  if (!PROVIDER_CONFIG[provider].available) {
    return {
      success: false,
      error: 'API key not configured',
    };
  }
  
  try {
    const testText = 'Patient is a 45-year-old male.';
    const result = await callProvider(provider, testText, { maxTokens: 100 });
    
    return {
      success: true,
      provider: result.provider,
      model: result.model,
      message: 'Connection successful',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get available providers
 */
export function getAvailableProviders() {
  return PROVIDER_PRIORITY.filter(p => PROVIDER_CONFIG[p].available);
}

/**
 * Get provider configuration
 */
export function getProviderConfig(provider) {
  return PROVIDER_CONFIG[provider] || null;
}

export default {
  extractWithLLM,
  testProvider,
  getAvailableProviders,
  getProviderConfig,
};
```

---

## 2.2.5 Create LLM Routes

**File:** `backend/routes/llm.js` (NEW)

```javascript
/**
 * LLM API Routes
 * 
 * Endpoints for LLM-based extraction and testing.
 */

import express from 'express';
import llmOrchestrator from '../services/llmOrchestrator.js';

const router = express.Router();

/**
 * POST /api/llm/extract
 * Extract medical entities using LLM
 */
router.post('/extract', async (req, res) => {
  try {
    const { text, provider = 'claude', options = {} } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Invalid input: text is required and must be a string',
      });
    }
    
    if (text.length > 500000) {
      return res.status(400).json({
        error: 'Text too long (max 500,000 characters)',
      });
    }
    
    console.log(`LLM extraction request: ${text.length} chars, provider: ${provider}`);
    
    const result = await llmOrchestrator.extractWithLLM(text, provider, options);
    
    res.json(result);
    
  } catch (error) {
    console.error('LLM extraction error:', error);
    res.status(500).json({
      error: error.message || 'LLM extraction failed',
    });
  }
});

/**
 * GET /api/llm/test/:provider
 * Test LLM provider connection
 */
router.get('/test/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    
    const validProviders = ['claude', 'gpt4', 'gemini'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({
        error: `Invalid provider. Must be one of: ${validProviders.join(', ')}`,
      });
    }
    
    console.log(`Testing LLM provider: ${provider}`);
    
    const result = await llmOrchestrator.testProvider(provider);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(503).json(result);
    }
    
  } catch (error) {
    console.error('LLM test error:', error);
    res.status(500).json({
      error: error.message || 'LLM test failed',
    });
  }
});

/**
 * GET /api/llm/providers
 * Get list of available providers
 */
router.get('/providers', (_req, res) => {
  try {
    const providers = llmOrchestrator.getAvailableProviders();
    const configs = {};
    
    providers.forEach(provider => {
      const config = llmOrchestrator.getProviderConfig(provider);
      configs[provider] = {
        name: config.name,
        model: config.model,
        available: config.available,
      };
    });
    
    res.json({
      providers,
      configs,
    });
    
  } catch (error) {
    console.error('Error getting providers:', error);
    res.status(500).json({
      error: error.message || 'Failed to get providers',
    });
  }
});

export default router;
```

---

## 2.3 Create Data Merger Service

**File:** `backend/services/dataMerger.js` (NEW)

```javascript
/**
 * Data Merger Service
 * 
 * Intelligently merges pattern-based and LLM-based extraction results.
 * Resolves conflicts and fills gaps.
 */

/**
 * Merge extraction results from pattern-based and LLM-based methods
 * 
 * Strategy:
 * - Use LLM data for contextual/ambiguous fields
 * - Use pattern data for structured/deterministic fields
 * - Combine arrays (deduplicate later)
 * - Prefer higher confidence scores
 */
export function mergeExtractionResults(patternData, llmData, options = {}) {
  const { preferLLM = true } = options;
  
  const merged = {
    demographics: mergeDemographics(patternData.demographics, llmData.demographics, preferLLM),
    dates: mergeDates(patternData.dates, llmData.dates, preferLLM),
    diagnosis: mergeDiagnosis(patternData.diagnosis, llmData.diagnosis, preferLLM),
    procedures: [...(patternData.procedures || []), ...(llmData.procedures || [])],
    imaging: mergeImaging(patternData.imaging, llmData.imaging),
    neuroExam: [...(patternData.neuroExam || []), ...(llmData.neuroExam || [])],
    functionalScores: mergeScores(patternData.functionalScores, llmData.functionalScores, preferLLM),
    complications: [...(patternData.complications || []), ...(llmData.complications || [])],
    medications: mergeMedications(patternData.medications, llmData.medications),
    consultations: [...(patternData.consultations || []), ...(llmData.consultations || [])],
    discharge: mergeDischarge(patternData.discharge, llmData.discharge, preferLLM),
    labs: [...(patternData.labs || []), ...(llmData.labs || [])],
  };
  
  return merged;
}

function mergeDemographics(pattern, llm, preferLLM) {
  return {
    age: selectBest(pattern?.age, llm?.age, preferLLM),
    gender: selectBest(pattern?.gender, llm?.gender, preferLLM),
    mrn: selectBest(pattern?.mrn, llm?.mrn, false), // Prefer pattern for MRN (more reliable)
  };
}

function mergeDates(pattern, llm, preferLLM) {
  return {
    admission: selectBest(pattern?.admission, llm?.admission, false), // Prefer pattern for dates
    surgery: selectBest(pattern?.surgery, llm?.surgery, false),
    discharge: selectBest(pattern?.discharge, llm?.discharge, false),
  };
}

function mergeDiagnosis(pattern, llm, preferLLM) {
  return {
    primary: selectBest(pattern?.primary, llm?.primary, preferLLM),
    pathology: selectBest(pattern?.pathology, llm?.pathology, preferLLM),
    location: selectBest(pattern?.location, llm?.location, preferLLM),
    molecular: selectBest(pattern?.molecular, llm?.molecular, preferLLM),
  };
}

function mergeImaging(pattern, llm) {
  return {
    preOp: [...(pattern?.preOp || []), ...(llm?.preOp || [])],
    postOp: [...(pattern?.postOp || []), ...(llm?.postOp || [])],
  };
}

function mergeScores(pattern, llm, preferLLM) {
  return {
    kps: selectBest(pattern?.kps, llm?.kps, false), // Prefer pattern for scores
    ecog: selectBest(pattern?.ecog, llm?.ecog, false),
    mrs: selectBest(pattern?.mrs, llm?.mrs, false),
    gcs: selectBest(pattern?.gcs, llm?.gcs, false),
  };
}

function mergeMedications(pattern, llm) {
  return {
    preOp: [...(pattern?.preOp || []), ...(llm?.preOp || [])],
    postOp: [...(pattern?.postOp || []), ...(llm?.postOp || [])],
    discharge: [...(pattern?.discharge || []), ...(llm?.discharge || [])],
  };
}

function mergeDischarge(pattern, llm, preferLLM) {
  return {
    destination: selectBest(pattern?.destination, llm?.destination, preferLLM),
    followUp: [...(pattern?.followUp || []), ...(llm?.followUp || [])],
  };
}

function selectBest(patternValue, llmValue, preferLLM) {
  // If only one has a value, use it
  if (patternValue && !llmValue) return patternValue;
  if (!patternValue && llmValue) return llmValue;
  if (!patternValue && !llmValue) return null;
  
  // Both have values - use preference
  return preferLLM ? llmValue : patternValue;
}

export default {
  mergeExtractionResults,
};
```

---

*Continue to next file for more backend services...*

