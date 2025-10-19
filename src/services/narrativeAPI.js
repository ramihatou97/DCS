/**
 * Frontend Narrative Service - API Wrapper
 * 
 * This service now acts as a thin wrapper around the backend API.
 * All narrative generation logic runs on the backend.
 * 
 * @module narrative-api-wrapper
 */

import { narrativeAPI } from './apiClient.js';

/**
 * Generate narrative from extracted medical data
 * NOW CALLS BACKEND API
 * 
 * This replaces the previous client-side narrative generation logic.
 * The backend handles all LLM calls and narrative assembly.
 * 
 * @param {Object} extractedData - Extracted medical entities
 * @param {Object} options - Generation options
 * @param {string} options.style - Writing style (formal, detailed, etc.)
 * @param {boolean} options.includeTimeline - Include temporal context
 * @param {Array<string>} options.sections - Specific sections to generate
 * @returns {Promise<Object>} Generated narrative sections
 */
export async function generateNarrative(extractedData, options = {}) {
  console.log('[Narrative Service] Calling backend API...');
  console.log('[Narrative Service] Extracted data fields:', Object.keys(extractedData || {}));
  
  try {
    const result = await narrativeAPI.generate(extractedData, options);
    
    console.log('[Narrative Service] Narrative generated successfully');
    console.log(`[Narrative Service] Sections generated: ${Object.keys(result.narrative || {}).length}`);
    
    return result;
  } catch (error) {
    console.error('[Narrative Service] API Error:', error);
    throw new Error(`Failed to generate narrative: ${error.message}`);
  }
}

// Re-export for backward compatibility
export default {
  generateNarrative,
};
