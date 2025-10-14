/**
 * Data Merger Service
 * 
 * Intelligently merges pattern-based and LLM-based extraction results
 * Uses confidence scores to determine which source to trust
 */

/**
 * Merge pattern and LLM extraction results
 * Strategy: Prefer LLM when confidence > threshold, otherwise use pattern
 * 
 * @param {Object} patternData - Pattern-based extraction result
 * @param {Object} llmData - LLM-based extraction result
 * @param {Object} options - Merge options
 * @returns {Object} Merged extraction result with metadata
 */
export const mergeExtractionResults = (patternData, llmData, options = {}) => {
  const {
    llmConfidenceThreshold = 0.75,
    preferLLMForArrays = true,
    combineArrays = true
  } = options;

  console.log('Merging extraction results...');
  console.log('Pattern data fields:', Object.keys(patternData || {}));
  console.log('LLM data fields:', Object.keys(llmData || {}));

  // If only one source exists, return it
  if (!patternData && !llmData) {
    return { merged: {}, metadata: { source: 'none' } };
  }
  if (!llmData) {
    return { 
      merged: patternData, 
      metadata: { source: 'pattern-only', confidence: patternData.confidence || {} } 
    };
  }
  if (!patternData) {
    return { 
      merged: llmData, 
      metadata: { source: 'llm-only', confidence: llmData.confidence || {} } 
    };
  }

  const merged = {};
  const mergeMetadata = {
    fields: {},
    overallStrategy: 'intelligent-merge',
    llmConfidenceThreshold
  };

  // Get all unique field names from both sources
  const allFields = new Set([
    ...Object.keys(patternData),
    ...Object.keys(llmData)
  ]);

  // Remove metadata fields
  allFields.delete('confidence');
  allFields.delete('metadata');

  for (const field of allFields) {
    const patternValue = patternData[field];
    const llmValue = llmData[field];
    
    const patternConfidence = patternData.confidence?.[field] || 0;
    const llmConfidence = llmData.confidence?.[field] || 0;

    // Merge logic for this field
    const mergeResult = mergeField(
      field,
      patternValue,
      llmValue,
      patternConfidence,
      llmConfidence,
      { llmConfidenceThreshold, preferLLMForArrays, combineArrays }
    );

    merged[field] = mergeResult.value;
    mergeMetadata.fields[field] = mergeResult.metadata;
  }

  console.log(`Merged ${allFields.size} fields`);
  console.log('Merge metadata:', mergeMetadata.fields);

  return {
    merged,
    metadata: mergeMetadata,
    confidence: calculateMergedConfidence(mergeMetadata)
  };
};

/**
 * Merge a single field from pattern and LLM sources
 */
const mergeField = (
  fieldName,
  patternValue,
  llmValue,
  patternConfidence,
  llmConfidence,
  options
) => {
  const { llmConfidenceThreshold, preferLLMForArrays, combineArrays } = options;

  // Case 1: Both sources have no value
  if (isEmptyValue(patternValue) && isEmptyValue(llmValue)) {
    return {
      value: null,
      metadata: {
        source: 'none',
        confidence: 0,
        reason: 'No data from either source'
      }
    };
  }

  // Case 2: Only pattern has value
  if (!isEmptyValue(patternValue) && isEmptyValue(llmValue)) {
    return {
      value: patternValue,
      metadata: {
        source: 'pattern',
        confidence: patternConfidence,
        reason: 'LLM provided no data'
      }
    };
  }

  // Case 3: Only LLM has value
  if (isEmptyValue(patternValue) && !isEmptyValue(llmValue)) {
    return {
      value: llmValue,
      metadata: {
        source: 'llm',
        confidence: llmConfidence,
        reason: 'Pattern provided no data'
      }
    };
  }

  // Case 4: Both have values - need to choose or combine

  // For arrays (procedures, complications, etc.)
  if (Array.isArray(patternValue) || Array.isArray(llmValue)) {
    return mergeArrayFields(
      fieldName,
      patternValue,
      llmValue,
      patternConfidence,
      llmConfidence,
      { preferLLMForArrays, combineArrays, llmConfidenceThreshold }
    );
  }

  // For objects (demographics, dates, etc.)
  if (typeof patternValue === 'object' && typeof llmValue === 'object') {
    return mergeObjectFields(
      fieldName,
      patternValue,
      llmValue,
      patternConfidence,
      llmConfidence,
      { llmConfidenceThreshold }
    );
  }

  // For primitives (strings, numbers, booleans)
  return mergePrimitiveFields(
    fieldName,
    patternValue,
    llmValue,
    patternConfidence,
    llmConfidence,
    { llmConfidenceThreshold }
  );
};

/**
 * Merge array fields (procedures, complications, medications, etc.)
 */
const mergeArrayFields = (
  fieldName,
  patternArray,
  llmArray,
  patternConfidence,
  llmConfidence,
  options
) => {
  const { preferLLMForArrays, combineArrays, llmConfidenceThreshold } = options;

  // Ensure both are arrays
  const patternArr = Array.isArray(patternArray) ? patternArray : [];
  const llmArr = Array.isArray(llmArray) ? llmArray : [];

  // Strategy 1: Prefer LLM if high confidence
  if (preferLLMForArrays && llmConfidence >= llmConfidenceThreshold && llmArr.length > 0) {
    return {
      value: llmArr,
      metadata: {
        source: 'llm',
        confidence: llmConfidence,
        reason: `LLM confidence (${llmConfidence.toFixed(2)}) above threshold`,
        alternativeCount: patternArr.length
      }
    };
  }

  // Strategy 2: Combine arrays if enabled
  if (combineArrays && patternArr.length > 0 && llmArr.length > 0) {
    // Deduplicate combined array
    const combined = deduplicateArray([...llmArr, ...patternArr]);
    
    return {
      value: combined,
      metadata: {
        source: 'combined',
        confidence: Math.max(patternConfidence, llmConfidence),
        reason: 'Combined and deduplicated both sources',
        patternCount: patternArr.length,
        llmCount: llmArr.length,
        combinedCount: combined.length
      }
    };
  }

  // Strategy 3: Choose the longer array (more information)
  if (llmArr.length >= patternArr.length) {
    return {
      value: llmArr,
      metadata: {
        source: 'llm',
        confidence: llmConfidence,
        reason: 'LLM provided more items',
        count: llmArr.length
      }
    };
  } else {
    return {
      value: patternArr,
      metadata: {
        source: 'pattern',
        confidence: patternConfidence,
        reason: 'Pattern provided more items',
        count: patternArr.length
      }
    };
  }
};

/**
 * Merge object fields (demographics, dates, pathology, etc.)
 */
const mergeObjectFields = (
  fieldName,
  patternObj,
  llmObj,
  patternConfidence,
  llmConfidence,
  options
) => {
  const { llmConfidenceThreshold } = options;

  // Recursively merge object properties
  const mergedObj = {};
  const allKeys = new Set([
    ...Object.keys(patternObj || {}),
    ...Object.keys(llmObj || {})
  ]);

  for (const key of allKeys) {
    const patternVal = patternObj?.[key];
    const llmVal = llmObj?.[key];

    // For each property, choose based on confidence and presence
    if (!isEmptyValue(llmVal) && llmConfidence >= llmConfidenceThreshold) {
      mergedObj[key] = llmVal;
    } else if (!isEmptyValue(patternVal)) {
      mergedObj[key] = patternVal;
    } else if (!isEmptyValue(llmVal)) {
      mergedObj[key] = llmVal;
    } else {
      mergedObj[key] = null;
    }
  }

  return {
    value: mergedObj,
    metadata: {
      source: llmConfidence >= llmConfidenceThreshold ? 'llm-preferred' : 'mixed',
      confidence: Math.max(patternConfidence, llmConfidence),
      reason: 'Merged object properties',
      propertyCount: allKeys.size
    }
  };
};

/**
 * Merge primitive fields (strings, numbers, booleans)
 */
const mergePrimitiveFields = (
  fieldName,
  patternValue,
  llmValue,
  patternConfidence,
  llmConfidence,
  options
) => {
  const { llmConfidenceThreshold } = options;

  // Prefer LLM if high confidence
  if (llmConfidence >= llmConfidenceThreshold) {
    return {
      value: llmValue,
      metadata: {
        source: 'llm',
        confidence: llmConfidence,
        reason: `LLM confidence (${llmConfidence.toFixed(2)}) above threshold`,
        alternative: patternValue
      }
    };
  }

  // Otherwise prefer pattern (more deterministic)
  if (patternConfidence > llmConfidence) {
    return {
      value: patternValue,
      metadata: {
        source: 'pattern',
        confidence: patternConfidence,
        reason: 'Pattern confidence higher',
        alternative: llmValue
      }
    };
  }

  // If LLM confidence is higher but below threshold, still use it
  return {
    value: llmValue,
    metadata: {
      source: 'llm',
      confidence: llmConfidence,
      reason: 'LLM confidence higher (but below threshold)',
      alternative: patternValue
    }
  };
};

/**
 * Deduplicate array items (simple text-based)
 */
const deduplicateArray = (items) => {
  if (!Array.isArray(items)) return [];
  
  // For primitive arrays
  if (items.length > 0 && typeof items[0] !== 'object') {
    return [...new Set(items)];
  }

  // For object arrays - deduplicate by JSON stringification
  // (Simple approach - could be enhanced with similarity matching)
  const seen = new Set();
  const unique = [];

  for (const item of items) {
    const key = JSON.stringify(item);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  return unique;
};

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 */
const isEmptyValue = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
};

/**
 * Calculate overall merged confidence
 */
const calculateMergedConfidence = (mergeMetadata) => {
  const fieldMetadata = Object.values(mergeMetadata.fields);
  
  if (fieldMetadata.length === 0) return {};

  const confidenceBySource = {
    llm: [],
    pattern: [],
    combined: [],
    mixed: []
  };

  for (const meta of fieldMetadata) {
    if (meta.confidence > 0) {
      const source = meta.source;
      if (confidenceBySource[source]) {
        confidenceBySource[source].push(meta.confidence);
      }
    }
  }

  const avgConfidence = (arr) => arr.length > 0 
    ? arr.reduce((a, b) => a + b, 0) / arr.length 
    : 0;

  return {
    overall: avgConfidence(fieldMetadata.map(m => m.confidence)),
    bySource: {
      llm: avgConfidence(confidenceBySource.llm),
      pattern: avgConfidence(confidenceBySource.pattern),
      combined: avgConfidence(confidenceBySource.combined),
      mixed: avgConfidence(confidenceBySource.mixed)
    },
    fieldCount: {
      total: fieldMetadata.length,
      llm: confidenceBySource.llm.length,
      pattern: confidenceBySource.pattern.length,
      combined: confidenceBySource.combined.length,
      mixed: confidenceBySource.mixed.length
    }
  };
};

/**
 * Simple merge for backward compatibility
 * Just prefers LLM over pattern for all fields
 */
export const simpleMerge = (patternData, llmData) => {
  if (!llmData) return patternData;
  if (!patternData) return llmData;

  return {
    ...patternData,
    ...llmData,
    confidence: {
      ...(patternData.confidence || {}),
      ...(llmData.confidence || {})
    }
  };
};

export default {
  mergeExtractionResults,
  simpleMerge
};
