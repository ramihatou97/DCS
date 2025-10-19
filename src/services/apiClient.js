/**
 * Centralized API Client for DCS Backend
 * Handles all communication with Express backend
 * 
 * @module apiClient
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Request timeout (30 seconds for LLM operations)
const REQUEST_TIMEOUT = 30000;

/**
 * Base fetch wrapper with error handling
 * @private
 */
async function apiFetch(endpoint, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        message: response.statusText 
      }));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - operation took too long');
    }
    
    if (!navigator.onLine) {
      throw new Error('No internet connection');
    }
    
    throw error;
  }
}

/**
 * Extraction API
 */
export const extractionAPI = {
  /**
   * Extract medical entities from clinical notes
   * @param {Array<string>|string} notes - Array of clinical note text or single note
   * @param {Object} options - Extraction options
   * @returns {Promise<Object>} Extraction result with extracted data, confidence, metadata
   */
  extract: async (notes, options = {}) => {
    console.log('[API Client] Calling /api/extract...');
    
    // Backend expects 'text' as a single string, so join array if needed
    const text = Array.isArray(notes) ? notes.join('\n\n---\n\n') : notes;
    
    return apiFetch('/extract', {
      method: 'POST',
      body: JSON.stringify({ text, options }),
    });
  },
};

/**
 * Narrative API
 */
export const narrativeAPI = {
  /**
   * Generate narrative from extracted data
   * @param {Object} extractedData - Extracted medical entities
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated narrative sections
   */
  generate: async (extractedData, options = {}) => {
    console.log('[API Client] Calling /api/narrative...');
    return apiFetch('/narrative', {
      method: 'POST',
      body: JSON.stringify({ extractedData, options }),
    });
  },
};

/**
 * Summary API
 */
export const summaryAPI = {
  /**
   * Generate complete discharge summary
   * @param {Array<string>|string} notes - Array of clinical note text or single note
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Complete discharge summary
   */
  generate: async (notes, options = {}) => {
    console.log('[API Client] Calling /api/summary...');
    
    // Backend accepts notes as string or array, so join array if needed for consistency
    const clinicalNotes = Array.isArray(notes) ? notes.join('\n\n---\n\n') : notes;
    
    return apiFetch('/summary', {
      method: 'POST',
      body: JSON.stringify({ notes: clinicalNotes, options }),
    });
  },
};

/**
 * Health API
 */
export const healthAPI = {
  /**
   * Check backend health status
   * @returns {Promise<Object>} Health status
   */
  check: async () => {
    console.log('[API Client] Calling /api/health...');
    return apiFetch('/health');
  },
};

// Default export with all APIs
export default {
  extraction: extractionAPI,
  narrative: narrativeAPI,
  summary: summaryAPI,
  health: healthAPI,
};
