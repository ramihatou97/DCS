/**
 * Frontend Summary Service - API Wrapper
 * 
 * This service now acts as a thin wrapper around the backend API.
 * All summary orchestration logic runs on the backend.
 * 
 * @module summary-api-wrapper
 */

import { summaryAPI } from './apiClient.js';

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
  console.log('[Summary Service] Generating summary from extracted data...');
  
  try {
    // For now, use the narrative API since it takes extracted data
    // In future, backend could have a dedicated endpoint for this
    const narrativeResult = await narrativeAPI.generate(extractedData, options);
    
    return {
      summary: narrativeResult.narrative,
      metadata: narrativeResult.metadata,
      qualityMetrics: narrativeResult.qualityMetrics || {},
    };
  } catch (error) {
    console.error('[Summary Service] API Error:', error);
    throw new Error(`Failed to generate summary from extraction: ${error.message}`);
  }
}

// Re-export for backward compatibility
export default {
  generateCompleteSummary,
  generateSummaryFromExtraction,
};
