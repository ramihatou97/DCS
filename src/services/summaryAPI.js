/**
 * Frontend Summary Service - API Wrapper
 * 
 * This service now acts as a thin wrapper around the backend API.
 * All summary orchestration logic runs on the backend.
 * 
 * @module summary-api-wrapper
 */

import { summaryAPI, narrativeAPI } from './apiClient.js';

/**
 * Generate complete discharge summary
 * NOW CALLS BACKEND API FOR FULL ORCHESTRATION
 * 
 * This replaces the previous client-side summary orchestration logic.
 * The backend handles extraction → narrative → summary assembly.
 * 
 * @param {Array<string>} notes - Clinical notes
 * @param {Object} options - Generation options
 * @param {string} options.format - Output format (standard, detailed, brief)
 * @param {boolean} options.includeMetrics - Include quality metrics
 * @param {Array<string>} options.sections - Specific sections to include
 * @returns {Promise<Object>} Complete discharge summary
 */
export async function generateCompleteSummary(notes, options = {}) {
  console.log('[Summary Service] Calling backend API...');
  console.log(`[Summary Service] Notes count: ${Array.isArray(notes) ? notes.length : 1}`);
  console.log('[Summary Service] Options:', options);
  
  try {
    // Ensure notes is an array
    const notesArray = Array.isArray(notes) ? notes : [notes];
    
    const result = await summaryAPI.generate(notesArray, options);
    
    console.log('[Summary Service] Summary generated successfully');
    console.log(`[Summary Service] Processing time: ${result.metadata?.processingTime}ms`);
    console.log(`[Summary Service] Quality score: ${result.qualityMetrics?.overall}`);
    
    return result;
  } catch (error) {
    console.error('[Summary Service] API Error:', error);
    throw new Error(`Failed to generate summary: ${error.message}`);
  }
}

/**
 * Generate summary from already extracted data
 * Useful when extraction was done separately
 */
export async function generateSummaryFromExtraction(extractedData, options = {}) {
  console.log('[Summary Service] === GENERATING SUMMARY FROM EXTRACTION ===');
  console.log('[Summary Service] extractedData:', extractedData);
  console.log('[Summary Service] extractedData type:', typeof extractedData);
  console.log('[Summary Service] extractedData keys:', extractedData ? Object.keys(extractedData) : 'undefined');
  console.log('[Summary Service] options:', options);

  // Defensive check
  if (!extractedData) {
    throw new Error('extractedData is required but was undefined or null');
  }

  if (typeof extractedData !== 'object') {
    throw new Error(`extractedData must be an object, got ${typeof extractedData}`);
  }

  try {
    // For now, use the narrative API since it takes extracted data
    // In future, backend could have a dedicated endpoint for this
    console.log('[Summary Service] Calling narrativeAPI.generate...');
    const narrativeResult = await narrativeAPI.generate(extractedData, options);

    console.log('[Summary Service] === NARRATIVE RESULT ===');
    console.log('[Summary Service] narrativeResult:', narrativeResult);
    console.log('[Summary Service] narrativeResult keys:', narrativeResult ? Object.keys(narrativeResult) : 'undefined');
    console.log('[Summary Service] ===========================');

    return {
      summary: narrativeResult.narrative,
      metadata: narrativeResult.metadata,
      qualityMetrics: narrativeResult.qualityMetrics || {},
    };
  } catch (error) {
    console.error('[Summary Service] === API ERROR ===');
    console.error('[Summary Service] Error:', error);
    console.error('[Summary Service] Error message:', error.message);
    console.error('[Summary Service] Error stack:', error.stack);
    console.error('[Summary Service] ====================');
    throw new Error(`Failed to generate summary from extraction: ${error.message}`);
  }
}

// Re-export for backward compatibility
export default {
  generateCompleteSummary,
  generateSummaryFromExtraction,
};
