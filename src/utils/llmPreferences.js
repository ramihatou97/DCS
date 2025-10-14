/**
 * LLM Preferences Management
 * 
 * Manages user preferences for LLM provider selection
 */

const PREFERENCES_KEY = 'dsg_llm_preferences';

/**
 * Provider priority order for different tasks
 */
export const TASK_PRIORITIES = {
  EXTRACTION: ['anthropic', 'openai', 'gemini'], // Claude best for structured extraction
  SUMMARIZATION: ['anthropic', 'openai', 'gemini'] // Claude best for natural language
};

/**
 * Get stored preferences
 */
export const getPreferences = () => {
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    return stored ? JSON.parse(stored) : {
      preferredProvider: null, // Auto-detect by priority
      extractionProvider: null, // Can override for extraction
      summarizationProvider: null, // Can override for summarization
      autoSelectByTask: true // Use TASK_PRIORITIES if true
    };
  } catch (error) {
    console.error('Error loading LLM preferences:', error);
    return {
      preferredProvider: null,
      extractionProvider: null,
      summarizationProvider: null,
      autoSelectByTask: true
    };
  }
};

/**
 * Save preferences
 */
export const savePreferences = (preferences) => {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    return true;
  } catch (error) {
    console.error('Error saving LLM preferences:', error);
    return false;
  }
};

/**
 * Set preferred provider for all tasks
 */
export const setPreferredProvider = (provider) => {
  const prefs = getPreferences();
  prefs.preferredProvider = provider;
  return savePreferences(prefs);
};

/**
 * Set provider for specific task
 */
export const setTaskProvider = (task, provider) => {
  const prefs = getPreferences();
  if (task === 'extraction') {
    prefs.extractionProvider = provider;
  } else if (task === 'summarization') {
    prefs.summarizationProvider = provider;
  }
  return savePreferences(prefs);
};

/**
 * Enable/disable auto-select by task
 */
export const setAutoSelectByTask = (enabled) => {
  const prefs = getPreferences();
  prefs.autoSelectByTask = enabled;
  return savePreferences(prefs);
};

/**
 * Clear all preferences
 */
export const clearPreferences = () => {
  try {
    localStorage.removeItem(PREFERENCES_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing preferences:', error);
    return false;
  }
};

export default {
  getPreferences,
  savePreferences,
  setPreferredProvider,
  setTaskProvider,
  setAutoSelectByTask,
  clearPreferences,
  TASK_PRIORITIES
};
