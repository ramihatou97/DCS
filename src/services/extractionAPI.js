/**
 * Frontend Extraction Service - API Wrapper
 * 
 * This service now acts as a thin wrapper around the backend API.
 * All actual extraction logic runs on the backend for security and performance.
 * 
 * @module extraction-api-wrapper
 */

import { extractionAPI } from './apiClient.js';

/**
 * Extract medical entities from clinical notes
 * NOW CALLS BACKEND API INSTEAD OF CLIENT-SIDE PROCESSING
 * 
 * This replaces the previous 3,000+ lines of client-side extraction logic.
 * The backend handles all LLM calls, pattern matching, and data processing.
 * 
 * @param {Array<string>} notes - Clinical notes text
 * @param {Object} options - Extraction options
 * @param {boolean} options.includeConfidence - Include confidence scores
 * @param {Array} options.learnedPatterns - Learned patterns from ML
 * @param {boolean} options.useLLM - Force LLM usage
 * @param {boolean} options.usePatterns - Force pattern usage
 * @param {boolean} options.enableDeduplication - Enable deduplication
 * @param {boolean} options.enablePreprocessing - Enable preprocessing
 * @returns {Promise<Object>} Extraction result with extracted data, confidence, metadata
 */
export async function extractMedicalEntities(notes, options = {}) {
  console.log('[Extraction Service] Calling backend API...');
  console.log(`[Extraction Service] Notes count: ${Array.isArray(notes) ? notes.length : 1}`);
  console.log(`[Extraction Service] Options:`, options);
  
  try {
    // Ensure notes is an array
    const notesArray = Array.isArray(notes) ? notes : [notes];
    
    // Call backend API
    const result = await extractionAPI.extract(notesArray, options);
    
    console.log('[Extraction Service] Backend response received');
    console.log(`[Extraction Service] Extraction method: ${result.metadata?.extractionMethod}`);
    console.log(`[Extraction Service] Overall confidence: ${result.confidence?.overall}`);
    console.log(`[Extraction Service] Pathology types: ${result.pathologyTypes?.join(', ')}`);
    
    return result;
  } catch (error) {
    console.error('[Extraction Service] API Error:', error);
    throw new Error(`Failed to extract medical entities: ${error.message}`);
  }
}

// Re-export for backward compatibility with default export pattern
export default {
  extractMedicalEntities,
};
