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
  console.log('[Narrative Service] === CALLING BACKEND API ===');
  console.log('[Narrative Service] extractedData:', extractedData);
  console.log('[Narrative Service] extractedData type:', typeof extractedData);
  console.log('[Narrative Service] Extracted data fields:', Object.keys(extractedData || {}));
  console.log('[Narrative Service] options:', options);
  console.log('[Narrative Service] ===========================');

  // Defensive check
  if (!extractedData) {
    throw new Error('extractedData is required but was undefined or null');
  }

  if (typeof extractedData !== 'object') {
    throw new Error(`extractedData must be an object, got ${typeof extractedData}`);
  }

  try {
    const result = await narrativeAPI.generate(extractedData, options);

    console.log('[Narrative Service] === NARRATIVE RESULT ===');
    console.log('[Narrative Service] result:', result);
    console.log('[Narrative Service] result keys:', result ? Object.keys(result) : 'undefined');
    console.log('[Narrative Service] Narrative generated successfully');
    console.log(`[Narrative Service] Sections generated: ${Object.keys(result.narrative || {}).length}`);
    console.log('[Narrative Service] ===========================');

    return result;
  } catch (error) {
    console.error('[Narrative Service] === API ERROR ===');
    console.error('[Narrative Service] Error:', error);
    console.error('[Narrative Service] Error message:', error.message);
    console.error('[Narrative Service] Error stack:', error.stack);
    console.error('[Narrative Service] ====================');
    throw new Error(`Failed to generate narrative: ${error.message}`);
  }
}

// Re-export for backward compatibility
export default {
  generateNarrative,
};
