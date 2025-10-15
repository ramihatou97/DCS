/**
 * Extraction API Routes
 * 
 * Backend endpoints for powerful clinical data extraction
 * Combines LLM-based extraction with neurosurgery-specific pattern matching
 */

import express from 'express';
import { extractNeurosurgicalData, expandAbbreviations } from '../services/neurosurgeryExtractor.js';
import { callAnthropic } from '../services/anthropic.js';
import { callOpenAI } from '../services/openai.js';
import { callGemini } from '../services/gemini.js';
import {
  validateExtractionRequest,
  validateAbbreviationRequest,
  validateScoresRequest
} from '../middleware/validation.js';

const router = express.Router();

/**
 * Main extraction endpoint
 * POST /api/extract
 * 
 * Body:
 * - notes: string or array of strings (clinical notes)
 * - method: 'pattern' | 'llm' | 'hybrid' (default: hybrid)
 * - llmProvider: 'anthropic' | 'openai' | 'gemini' (default: anthropic)
 * - options: extraction options
 */
router.post('/extract', validateExtractionRequest, async (req, res) => {
  try {
    const { 
      notes, 
      method = 'hybrid',
      llmProvider = 'anthropic',
      options = {} 
    } = req.body;

    if (!notes) {
      return res.status(400).json({ 
        error: 'No clinical notes provided' 
      });
    }

    // Normalize notes to string
    const noteText = Array.isArray(notes) ? notes.join('\n\n') : notes;
    
    // Track extraction results
    let extractionResults = {};
    
    // 1. Pattern-based extraction (always run for baseline)
    console.log('[Extraction] Running pattern-based extraction...');
    const patternResults = await extractNeurosurgicalData(noteText, {
      ...options,
      expandAbbreviations: true,
      deduplicateSentences: true,
      includeConfidence: true
    });
    extractionResults.pattern = patternResults;

    // 2. LLM-based extraction (if requested)
    if (method === 'llm' || method === 'hybrid') {
      console.log(`[Extraction] Running LLM extraction with ${llmProvider}...`);
      
      const llmPrompt = createExtractionPrompt(noteText);
      let llmResults = null;

      try {
        switch (llmProvider) {
          case 'anthropic':
            llmResults = await callAnthropic(llmPrompt);
            break;
          case 'openai':
            llmResults = await callOpenAI(llmPrompt);
            break;
          case 'gemini':
            llmResults = await callGemini(llmPrompt);
            break;
          default:
            console.warn(`[Extraction] Unknown LLM provider: ${llmProvider}`);
        }
        
        if (llmResults) {
          extractionResults.llm = parseLLMResponse(llmResults);
        }
      } catch (error) {
        console.error(`[Extraction] LLM extraction failed:`, error);
        extractionResults.llmError = error.message;
      }
    }

    // 3. Merge results if hybrid mode
    let finalResults;
    if (method === 'hybrid' && extractionResults.llm) {
      console.log('[Extraction] Merging pattern and LLM results...');
      finalResults = mergeExtractionResults(
        extractionResults.pattern, 
        extractionResults.llm
      );
    } else if (method === 'llm' && extractionResults.llm) {
      finalResults = extractionResults.llm;
    } else {
      finalResults = extractionResults.pattern;
    }

    // Add metadata
    finalResults.metadata = {
      method,
      llmProvider: method !== 'pattern' ? llmProvider : null,
      extractionTime: new Date().toISOString(),
      noteLength: noteText.length,
      confidence: calculateOverallConfidence(finalResults)
    };

    res.json({
      success: true,
      data: finalResults,
      debug: process.env.NODE_ENV === 'development' ? extractionResults : undefined
    });

  } catch (error) {
    console.error('[Extraction] Error:', error);
    res.status(500).json({ 
      error: 'Extraction failed',
      message: error.message 
    });
  }
});

/**
 * Abbreviation expansion endpoint
 * POST /api/expand-abbreviations
 */
router.post('/expand-abbreviations', validateAbbreviationRequest, (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        error: 'No text provided' 
      });
    }

    const expanded = expandAbbreviations(text);
    
    res.json({
      success: true,
      original: text,
      expanded: expanded,
      changes: text !== expanded
    });

  } catch (error) {
    console.error('[Expansion] Error:', error);
    res.status(500).json({ 
      error: 'Abbreviation expansion failed',
      message: error.message 
    });
  }
});

/**
 * Clinical score extraction endpoint
 * POST /api/extract-scores
 */
router.post('/extract-scores', validateScoresRequest, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        error: 'No text provided' 
      });
    }

    const { extractClinicalScores } = await import('../services/neurosurgeryExtractor.js');
    const scores = extractClinicalScores(text);
    
    res.json({
      success: true,
      scores: scores,
      hasScores: Object.keys(scores).length > 0
    });

  } catch (error) {
    console.error('[Score Extraction] Error:', error);
    res.status(500).json({ 
      error: 'Score extraction failed',
      message: error.message 
    });
  }
});

/**
 * Create extraction prompt for LLM
 */
function createExtractionPrompt(text) {
  return `You are a neurosurgery clinical data extraction specialist. Extract the following information from the clinical note. Provide your response in valid JSON format.

Extract:
1. Demographics: MRN, age, sex
2. Important Dates: ictus/onset, admission, surgery, discharge
3. Diagnosis: primary pathology and location
4. Clinical Scores: Hunt-Hess, Fisher, GCS, mRS, KPS, ECOG (if present)
5. Procedures: all neurosurgical procedures with dates
6. Complications: any complications during admission
7. Medications: current medications at discharge, anticoagulation status
8. Imaging: key imaging findings
9. Discharge: destination and follow-up plan
10. Neurological Exam: motor, sensory, cranial nerves deficits

Return ONLY valid JSON in this exact format:
{
  "demographics": {
    "mrn": "",
    "age": "",
    "sex": ""
  },
  "dates": {
    "ictus": "",
    "admission": "",
    "surgery": "",
    "discharge": ""
  },
  "diagnosis": {
    "primary": "",
    "location": "",
    "details": ""
  },
  "clinicalScores": {
    "huntHess": null,
    "fisher": null,
    "gcs": null,
    "mRS": null,
    "kps": null,
    "ecog": null
  },
  "procedures": [],
  "complications": [],
  "medications": {
    "current": [],
    "anticoagulation": []
  },
  "imaging": [],
  "discharge": {
    "destination": "",
    "followUp": []
  },
  "neurologicalExam": {
    "motor": "",
    "sensory": "",
    "cranialNerves": ""
  }
}

Clinical Note:
${text}

Remember: Extract ONLY what is explicitly stated. Do not infer or assume information.`;
}

/**
 * Parse LLM response to structured data
 */
function parseLLMResponse(response) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // If no JSON found, try to parse the entire response
    return JSON.parse(response);
  } catch (error) {
    console.error('[Parser] Failed to parse LLM response:', error);
    
    // Return a structured fallback
    return {
      parseError: true,
      rawResponse: response,
      demographics: {},
      dates: {},
      diagnosis: {},
      clinicalScores: {},
      procedures: [],
      complications: [],
      medications: {},
      imaging: [],
      discharge: {},
      neurologicalExam: {}
    };
  }
}

/**
 * Merge pattern and LLM extraction results
 */
function mergeExtractionResults(patternResults, llmResults) {
  const merged = {
    demographics: llmResults.demographics || {},
    dates: mergeDates(patternResults.dates, llmResults.dates),
    diagnosis: llmResults.diagnosis || {},
    clinicalScores: mergeScores(patternResults.clinicalScores, llmResults.clinicalScores),
    procedures: mergeProcedures(patternResults.procedures, llmResults.procedures),
    complications: mergeComplications(patternResults.complications, llmResults.complications),
    medications: mergeMedications(patternResults.medications, llmResults.medications),
    imaging: mergeImaging(patternResults.imaging, llmResults.imaging),
    discharge: llmResults.discharge || {},
    neurologicalExam: llmResults.neurologicalExam || {}
  };
  
  return merged;
}

function mergeDates(patternDates, llmDates) {
  if (!llmDates) return patternDates;
  
  // Prefer LLM dates if available, fallback to pattern
  return {
    ictus: llmDates.ictus || patternDates.ictus,
    admission: llmDates.admission || patternDates.admission,
    surgery: llmDates.surgery || patternDates.surgery,
    discharge: llmDates.discharge || patternDates.discharge
  };
}

function mergeScores(patternScores, llmScores) {
  if (!llmScores) return patternScores;
  
  // Merge scores, preferring non-null values
  return {
    huntHess: llmScores.huntHess ?? patternScores.huntHess,
    fisher: llmScores.fisher ?? patternScores.fisher,
    gcs: llmScores.gcs ?? patternScores.gcs,
    mRS: llmScores.mRS ?? patternScores.mRS,
    kps: llmScores.kps ?? patternScores.kps,
    ecog: llmScores.ecog ?? patternScores.ecog
  };
}

function mergeProcedures(patternProcs, llmProcs) {
  if (!llmProcs) return patternProcs;
  
  // Combine and deduplicate procedures
  const allProcs = [...(patternProcs || []), ...(llmProcs || [])];
  const unique = [];
  const seen = new Set();
  
  for (const proc of allProcs) {
    const key = typeof proc === 'string' ? proc : (proc.name || JSON.stringify(proc));
    if (!seen.has(key.toLowerCase())) {
      seen.add(key.toLowerCase());
      unique.push(proc);
    }
  }
  
  return unique;
}

function mergeComplications(patternComps, llmComps) {
  if (!llmComps) return patternComps;
  
  // Similar to procedures, combine and deduplicate
  const allComps = [...(patternComps || []), ...(llmComps || [])];
  const unique = [];
  const seen = new Set();
  
  for (const comp of allComps) {
    const key = typeof comp === 'string' ? comp : (comp.name || JSON.stringify(comp));
    if (!seen.has(key.toLowerCase())) {
      seen.add(key.toLowerCase());
      unique.push(comp);
    }
  }
  
  return unique;
}

function mergeMedications(patternMeds, llmMeds) {
  if (!llmMeds) return patternMeds;
  
  return {
    current: [...(patternMeds.current || []), ...(llmMeds.current || [])],
    discontinued: [...(patternMeds.discontinued || []), ...(llmMeds.discontinued || [])],
    anticoagulation: [...(patternMeds.anticoagulation || []), ...(llmMeds.anticoagulation || [])],
    antiepileptic: [...(patternMeds.antiepileptic || []), ...(llmMeds.antiepileptic || [])],
    antibiotics: [...(patternMeds.antibiotics || []), ...(llmMeds.antibiotics || [])]
  };
}

function mergeImaging(patternImaging, llmImaging) {
  if (!llmImaging) return patternImaging;
  
  // Combine imaging findings
  return [...(patternImaging || []), ...(llmImaging || [])];
}

/**
 * Calculate overall confidence score
 */
function calculateOverallConfidence(results) {
  let score = 0;
  let count = 0;
  
  // Check presence of key fields
  const checks = [
    results.demographics?.age,
    results.dates?.admission,
    results.diagnosis?.primary,
    Object.keys(results.clinicalScores || {}).length > 0,
    (results.procedures || []).length > 0,
    (results.medications?.current || []).length > 0,
    results.discharge?.destination
  ];
  
  for (const check of checks) {
    if (check) score++;
    count++;
  }
  
  return count > 0 ? (score / count) : 0;
}

export default router;