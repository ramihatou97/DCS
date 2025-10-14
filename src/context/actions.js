/**
 * Action Types for State Management
 */

export const ACTIONS = {
  // Note Upload & Parsing
  SET_NOTES: 'SET_NOTES',
  CLEAR_NOTES: 'CLEAR_NOTES',
  UPDATE_NOTE: 'UPDATE_NOTE',
  
  // Extraction
  START_EXTRACTION: 'START_EXTRACTION',
  SET_EXTRACTED_DATA: 'SET_EXTRACTED_DATA',
  EXTRACTION_ERROR: 'EXTRACTION_ERROR',
  UPDATE_EXTRACTED_FIELD: 'UPDATE_EXTRACTED_FIELD',
  
  // Corrections & Learning
  ADD_CORRECTION: 'ADD_CORRECTION',
  UPDATE_KNOWLEDGE_BASE: 'UPDATE_KNOWLEDGE_BASE',
  UPDATE_LEARNING_METRICS: 'UPDATE_LEARNING_METRICS',
  
  // Summary Generation
  START_SUMMARY_GENERATION: 'START_SUMMARY_GENERATION',
  SET_SUMMARY: 'SET_SUMMARY',
  UPDATE_SUMMARY: 'UPDATE_SUMMARY',
  SUMMARY_ERROR: 'SUMMARY_ERROR',
  
  // Follow-Up Templates
  SET_FOLLOW_UP: 'SET_FOLLOW_UP',
  UPDATE_FOLLOW_UP: 'UPDATE_FOLLOW_UP',
  
  // Export
  SET_EXPORT_READY: 'SET_EXPORT_READY',
  EXPORT_COMPLETE: 'EXPORT_COMPLETE',
  
  // Settings
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  SET_API_KEY: 'SET_API_KEY',
  TOGGLE_AUTO_SAVE: 'TOGGLE_AUTO_SAVE',
  
  // Navigation
  SET_STEP: 'SET_STEP',
  NEXT_STEP: 'NEXT_STEP',
  PREV_STEP: 'PREV_STEP',
  
  // UI State
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_SUCCESS: 'SET_SUCCESS',
  
  // Privacy
  CLEAR_PATIENT_DATA: 'CLEAR_PATIENT_DATA',
  CLEAR_ALL_DRAFTS: 'CLEAR_ALL_DRAFTS',
  
  // Reset
  RESET_STATE: 'RESET_STATE'
};

/**
 * App Steps
 */
export const STEPS = {
  UPLOAD: 'upload',
  EXTRACT: 'extract',
  REVIEW: 'review',
  GENERATE: 'generate',
  EXPORT: 'export'
};

/**
 * Note Types
 */
export const NOTE_TYPES = {
  ADMISSION: 'admission',
  PROGRESS: 'progress',
  OPERATIVE: 'operative',
  PROCEDURE: 'procedure',
  CONSULTANT: 'consultant',
  PT_OT: 'pt_ot',
  MEDICATION: 'medication',
  COMBINED: 'combined'
};

/**
 * LLM Providers
 */
export const LLM_PROVIDERS = {
  ANTHROPIC: 'anthropic',
  OPENAI: 'openai',
  GEMINI: 'gemini',
  PATTERN_ONLY: 'pattern_only'
};

/**
 * Export Formats
 */
export const EXPORT_FORMATS = {
  TEXT: 'text',
  PDF: 'pdf'
};
