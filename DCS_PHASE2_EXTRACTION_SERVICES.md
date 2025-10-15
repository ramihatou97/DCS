# PHASE 2: EXTRACTION & DEDUPLICATION SERVICES

This document contains extraction engine and deduplication services.

---

## 2.4 Create Deduplication Service

**File:** `backend/services/deduplication.js` (NEW)

```javascript
/**
 * Deduplication Service
 * 
 * Removes duplicate entries from extracted data while preserving unique information.
 */

/**
 * Deduplicate extracted data
 */
export function deduplicateExtractedData(data) {
  return {
    ...data,
    procedures: deduplicateArray(data.procedures || [], compareProcedures),
    imaging: {
      preOp: deduplicateArray(data.imaging?.preOp || [], compareImaging),
      postOp: deduplicateArray(data.imaging?.postOp || [], compareImaging),
    },
    neuroExam: deduplicateArray(data.neuroExam || [], compareNeuroExam),
    complications: deduplicateArray(data.complications || [], compareComplications),
    medications: {
      preOp: deduplicateMedications(data.medications?.preOp || []),
      postOp: deduplicateMedications(data.medications?.postOp || []),
      discharge: deduplicateMedications(data.medications?.discharge || []),
    },
    consultations: deduplicateArray(data.consultations || [], compareConsultations),
    labs: deduplicateArray(data.labs || [], compareLabs),
  };
}

/**
 * Generic array deduplication with custom comparator
 */
function deduplicateArray(arr, comparator) {
  const unique = [];
  
  for (const item of arr) {
    const isDuplicate = unique.some(existing => comparator(item, existing));
    if (!isDuplicate) {
      unique.push(item);
    }
  }
  
  return unique;
}

/**
 * Deduplicate medications (special handling for dosage)
 */
function deduplicateMedications(meds) {
  const medicationMap = new Map();
  
  for (const med of meds) {
    const name = normalizeMedicationName(med.name || med);
    
    if (!medicationMap.has(name)) {
      medicationMap.set(name, med);
    } else {
      // Merge dosage information if available
      const existing = medicationMap.get(name);
      if (typeof med === 'object' && med.dosage && !existing.dosage) {
        medicationMap.set(name, { ...existing, dosage: med.dosage });
      }
    }
  }
  
  return Array.from(medicationMap.values());
}

/**
 * Normalize medication name for comparison
 */
function normalizeMedicationName(name) {
  if (typeof name !== 'string') return String(name);
  
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\(.*?\)/g, '') // Remove parentheses
    .trim();
}

/**
 * Compare procedures
 */
function compareProcedures(a, b) {
  const nameA = (a.name || a).toLowerCase();
  const nameB = (b.name || b).toLowerCase();
  
  return similarity(nameA, nameB) > 0.8;
}

/**
 * Compare imaging findings
 */
function compareImaging(a, b) {
  const textA = (a.finding || a).toLowerCase();
  const textB = (b.finding || b).toLowerCase();
  
  return similarity(textA, textB) > 0.85;
}

/**
 * Compare neuro exam findings
 */
function compareNeuroExam(a, b) {
  const textA = (a.finding || a).toLowerCase();
  const textB = (b.finding || b).toLowerCase();
  
  return similarity(textA, textB) > 0.9;
}

/**
 * Compare complications
 */
function compareComplications(a, b) {
  const textA = (a.description || a).toLowerCase();
  const textB = (b.description || b).toLowerCase();
  
  return similarity(textA, textB) > 0.85;
}

/**
 * Compare consultations
 */
function compareConsultations(a, b) {
  const nameA = (a.service || a).toLowerCase();
  const nameB = (b.service || b).toLowerCase();
  
  return nameA === nameB;
}

/**
 * Compare lab results
 */
function compareLabs(a, b) {
  const nameA = (a.test || a).toLowerCase();
  const nameB = (b.test || b).toLowerCase();
  
  return nameA === nameB;
}

/**
 * Calculate string similarity (Jaccard similarity)
 */
function similarity(str1, str2) {
  const set1 = new Set(str1.split(/\s+/));
  const set2 = new Set(str2.split(/\s+/));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

export default {
  deduplicateExtractedData,
};
```

---

## 2.5 Create Extraction Engine

**File:** `backend/services/extractionEngine.js` (NEW)

```javascript
/**
 * Extraction Engine Service
 * 
 * Main extraction orchestrator that combines pattern-based and LLM-based extraction.
 */

import llmOrchestrator from './llmOrchestrator.js';
import neurosurgeryExtractor from './neurosurgeryExtractor.js';
import dataMerger from './dataMerger.js';
import deduplication from './deduplication.js';

/**
 * Extract medical entities from clinical notes
 * 
 * @param {string|string[]} notes - Clinical notes
 * @param {Object} options - Extraction options
 * @returns {Promise<Object>} Extraction result
 */
export async function extractMedicalEntities(notes, options = {}) {
  const startTime = Date.now();
  
  const {
    enableLLM = true,
    enablePatternBased = true,
    llmProvider = 'claude',
    enableDeduplication = true,
    includeConfidence = true,
    learnedPatterns = {},
  } = options;
  
  try {
    // Normalize notes to array
    const notesArray = Array.isArray(notes) ? notes : [notes];
    const combinedNotes = notesArray.join('\n\n---\n\n');
    
    console.log(`Extracting from ${notesArray.length} note(s), ${combinedNotes.length} chars`);
    
    let patternData = {};
    let llmData = {};
    
    // Pattern-based extraction
    if (enablePatternBased) {
      console.log('Running pattern-based extraction...');
      patternData = neurosurgeryExtractor.extractAll(combinedNotes, learnedPatterns);
    }
    
    // LLM-based extraction
    if (enableLLM) {
      console.log(`Running LLM-based extraction (${llmProvider})...`);
      try {
        const llmResult = await llmOrchestrator.extractWithLLM(
          combinedNotes,
          llmProvider,
          { enableFallback: true }
        );
        llmData = llmResult.data || {};
      } catch (error) {
        console.error('LLM extraction failed:', error.message);
        // Continue with pattern data only
      }
    }
    
    // Merge results
    console.log('Merging extraction results...');
    let mergedData = dataMerger.mergeExtractionResults(patternData, llmData, {
      preferLLM: true,
    });
    
    // Deduplication
    if (enableDeduplication) {
      console.log('Deduplicating data...');
      mergedData = deduplication.deduplicateExtractedData(mergedData);
    }
    
    // Calculate confidence scores
    const confidence = includeConfidence ? calculateConfidence(mergedData, patternData, llmData) : {};
    
    // Calculate completeness
    const completeness = calculateCompleteness(mergedData);
    
    const processingTime = Date.now() - startTime;
    
    return {
      success: true,
      extracted: mergedData,
      confidence,
      metadata: {
        extractionMethod: [
          enablePatternBased && 'pattern-based',
          enableLLM && 'llm-based',
        ].filter(Boolean),
        llmProvider: enableLLM ? llmProvider : null,
        processingTime,
        noteCount: notesArray.length,
        completeness,
      },
    };
    
  } catch (error) {
    console.error('Extraction error:', error);
    return {
      success: false,
      error: error.message,
      extracted: {},
    };
  }
}

/**
 * Extract clinical scores (KPS, ECOG, mRS, GCS)
 */
export function extractClinicalScores(text, options = {}) {
  try {
    const scores = neurosurgeryExtractor.extractScores(text);
    
    return {
      success: true,
      scores,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Calculate confidence scores for extracted fields
 */
function calculateConfidence(merged, pattern, llm) {
  const confidence = {};
  
  // Demographics
  confidence.demographics = {
    age: calculateFieldConfidence(merged.demographics?.age, pattern.demographics?.age, llm.demographics?.age),
    gender: calculateFieldConfidence(merged.demographics?.gender, pattern.demographics?.gender, llm.demographics?.gender),
    mrn: calculateFieldConfidence(merged.demographics?.mrn, pattern.demographics?.mrn, llm.demographics?.mrn),
  };
  
  // Dates
  confidence.dates = {
    admission: calculateFieldConfidence(merged.dates?.admission, pattern.dates?.admission, llm.dates?.admission),
    surgery: calculateFieldConfidence(merged.dates?.surgery, pattern.dates?.surgery, llm.dates?.surgery),
    discharge: calculateFieldConfidence(merged.dates?.discharge, pattern.dates?.discharge, llm.dates?.discharge),
  };
  
  // Diagnosis
  confidence.diagnosis = {
    primary: calculateFieldConfidence(merged.diagnosis?.primary, pattern.diagnosis?.primary, llm.diagnosis?.primary),
    pathology: calculateFieldConfidence(merged.diagnosis?.pathology, pattern.diagnosis?.pathology, llm.diagnosis?.pathology),
  };
  
  return confidence;
}

/**
 * Calculate confidence for a single field
 */
function calculateFieldConfidence(mergedValue, patternValue, llmValue) {
  if (!mergedValue) return 0;
  
  // Both methods agree
  if (patternValue && llmValue && patternValue === llmValue) {
    return 0.95;
  }
  
  // Only LLM found it
  if (!patternValue && llmValue) {
    return 0.75;
  }
  
  // Only pattern found it
  if (patternValue && !llmValue) {
    return 0.85;
  }
  
  // Both found different values (conflict)
  if (patternValue && llmValue && patternValue !== llmValue) {
    return 0.65;
  }
  
  return 0.5;
}

/**
 * Calculate completeness score (0-1)
 */
function calculateCompleteness(data) {
  const requiredFields = [
    data.demographics?.age,
    data.demographics?.gender,
    data.dates?.admission,
    data.diagnosis?.primary,
    data.procedures?.length > 0,
  ];
  
  const filledFields = requiredFields.filter(Boolean).length;
  
  return filledFields / requiredFields.length;
}

export default {
  extractMedicalEntities,
  extractClinicalScores,
};
```

---

*Continue to next file for summary generation services...*

