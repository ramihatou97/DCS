/**
 * App State Reducer
 * 
 * Manages all application state with privacy-first principles
 */

import { ACTIONS, STEPS } from './actions';

const appReducer = (state, action) => {
  switch (action.type) {
    // ==================== NOTES ====================
    case ACTIONS.SET_NOTES:
      return {
        ...state,
        notes: action.payload.notes,
        notesMetadata: action.payload.metadata,
        currentStep: STEPS.EXTRACT,
        error: null
      };
    
    case ACTIONS.CLEAR_NOTES:
      return {
        ...state,
        notes: [],
        notesMetadata: { total: 0, parsed: 0, types: {} }
      };
    
    case ACTIONS.UPDATE_NOTE:
      return {
        ...state,
        notes: state.notes.map(note =>
          note.id === action.payload.id
            ? { ...note, ...action.payload.updates }
            : note
        )
      };
    
    // ==================== EXTRACTION ====================
    case ACTIONS.START_EXTRACTION:
      return {
        ...state,
        loading: true,
        error: null,
        extractionMetadata: {
          ...state.extractionMetadata,
          startTime: new Date().toISOString()
        }
      };
    
    case ACTIONS.SET_EXTRACTED_DATA:
      return {
        ...state,
        extractedData: action.payload.data,
        extractionMetadata: {
          ...action.payload.metadata,
          endTime: new Date().toISOString()
        },
        currentStep: STEPS.REVIEW,
        loading: false,
        error: null
      };
    
    case ACTIONS.EXTRACTION_ERROR:
      return {
        ...state,
        loading: false,
        error: {
          type: 'extraction',
          message: action.payload.message,
          details: action.payload.details
        }
      };
    
    case ACTIONS.UPDATE_EXTRACTED_FIELD:
      return {
        ...state,
        extractedData: {
          ...state.extractedData,
          [action.payload.field]: action.payload.value
        },
        // Track that this field was manually corrected
        extractionMetadata: {
          ...state.extractionMetadata,
          manuallyEdited: [
            ...(state.extractionMetadata.manuallyEdited || []),
            action.payload.field
          ]
        }
      };
    
    // ==================== CORRECTIONS & LEARNING ====================
    case ACTIONS.ADD_CORRECTION:
      return {
        ...state,
        corrections: [...state.corrections, action.payload],
        learningMetrics: {
          ...state.learningMetrics,
          totalCorrections: state.learningMetrics.totalCorrections + 1
        }
      };
    
    case ACTIONS.UPDATE_KNOWLEDGE_BASE:
      return {
        ...state,
        knowledgeBase: action.payload,
        learningMetrics: {
          ...state.learningMetrics,
          patternsLearned: action.payload.totalPatterns || 0,
          lastLearningUpdate: new Date().toISOString()
        }
      };
    
    case ACTIONS.UPDATE_LEARNING_METRICS:
      return {
        ...state,
        learningMetrics: {
          ...state.learningMetrics,
          ...action.payload
        }
      };
    
    // ==================== SUMMARY ====================
    case ACTIONS.START_SUMMARY_GENERATION:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case ACTIONS.SET_SUMMARY:
      return {
        ...state,
        summary: action.payload,
        currentStep: STEPS.EXPORT,
        loading: false,
        error: null
      };
    
    case ACTIONS.UPDATE_SUMMARY:
      return {
        ...state,
        summary: {
          ...state.summary,
          ...action.payload
        }
      };
    
    case ACTIONS.SUMMARY_ERROR:
      return {
        ...state,
        loading: false,
        error: {
          type: 'summary',
          message: action.payload.message,
          details: action.payload.details
        }
      };
    
    // ==================== FOLLOW-UP ====================
    case ACTIONS.SET_FOLLOW_UP:
      return {
        ...state,
        followUpPlan: action.payload
      };
    
    case ACTIONS.UPDATE_FOLLOW_UP:
      return {
        ...state,
        followUpPlan: {
          ...state.followUpPlan,
          ...action.payload
        }
      };
    
    // ==================== EXPORT ====================
    case ACTIONS.SET_EXPORT_READY:
      return {
        ...state,
        exportReady: action.payload
      };
    
    case ACTIONS.EXPORT_COMPLETE:
      return {
        ...state,
        exportMetadata: {
          timestamp: new Date().toISOString(),
          format: action.payload.format,
          filename: action.payload.filename
        }
      };
    
    // ==================== SETTINGS ====================
    case ACTIONS.UPDATE_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload
        }
      };
    
    case ACTIONS.SET_API_KEY:
      return {
        ...state,
        settings: {
          ...state.settings,
          apiKeys: {
            ...state.settings.apiKeys,
            [action.payload.provider]: action.payload.key
          }
        }
      };
    
    case ACTIONS.TOGGLE_AUTO_SAVE:
      return {
        ...state,
        settings: {
          ...state.settings,
          autoSaveEnabled: action.payload
        }
      };
    
    // ==================== NAVIGATION ====================
    case ACTIONS.SET_STEP:
      return {
        ...state,
        currentStep: action.payload
      };
    
    case ACTIONS.NEXT_STEP:
      const stepOrder = [STEPS.UPLOAD, STEPS.EXTRACT, STEPS.REVIEW, STEPS.GENERATE, STEPS.EXPORT];
      const currentIndex = stepOrder.indexOf(state.currentStep);
      const nextIndex = Math.min(currentIndex + 1, stepOrder.length - 1);
      return {
        ...state,
        currentStep: stepOrder[nextIndex]
      };
    
    case ACTIONS.PREV_STEP:
      const stepOrderPrev = [STEPS.UPLOAD, STEPS.EXTRACT, STEPS.REVIEW, STEPS.GENERATE, STEPS.EXPORT];
      const currentIndexPrev = stepOrderPrev.indexOf(state.currentStep);
      const prevIndex = Math.max(currentIndexPrev - 1, 0);
      return {
        ...state,
        currentStep: stepOrderPrev[prevIndex]
      };
    
    // ==================== UI STATE ====================
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    
    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case ACTIONS.SET_SUCCESS:
      return {
        ...state,
        success: action.payload
      };
    
    // ==================== PRIVACY ====================
    case ACTIONS.CLEAR_PATIENT_DATA:
      // CRITICAL: Clear all patient data but preserve ML learning
      return {
        ...state,
        notes: [],
        extractedData: null,
        summary: null,
        followUpPlan: null,
        notesMetadata: { total: 0, parsed: 0, types: {} },
        extractionMetadata: {
          confidence: {},
          patterns: {},
          needsReview: [],
          timestamp: null
        },
        exportMetadata: null,
        // Preserve learning data
        corrections: state.corrections,
        knowledgeBase: state.knowledgeBase,
        learningMetrics: state.learningMetrics,
        settings: state.settings
      };
    
    case ACTIONS.CLEAR_ALL_DRAFTS:
      return {
        ...state,
        notes: [],
        extractedData: null,
        summary: null,
        followUpPlan: null,
        notesMetadata: { total: 0, parsed: 0, types: {} }
      };
    
    // ==================== RESET ====================
    case ACTIONS.RESET_STATE:
      return {
        ...getInitialState(),
        // Preserve settings and learning
        settings: state.settings,
        knowledgeBase: state.knowledgeBase,
        learningMetrics: state.learningMetrics
      };
    
    default:
      console.warn(`Unknown action type: ${action.type}`);
      return state;
  }
};

/**
 * Get initial state
 */
export const getInitialState = () => ({
  // Input stage
  notes: [],
  notesMetadata: {
    total: 0,
    parsed: 0,
    types: {}
  },
  
  // Extraction stage
  extractedData: null,
  extractionMetadata: {
    confidence: {},
    patterns: {},
    needsReview: [],
    timestamp: null,
    pathologies: [],
    manuallyEdited: []
  },
  
  // Learning stage
  corrections: [],
  knowledgeBase: null,
  learningMetrics: {
    totalCorrections: 0,
    patternsLearned: 0,
    accuracyTrend: [],
    lastLearningUpdate: null
  },
  
  // Summary stage
  summary: null,
  followUpPlan: null,
  exportReady: false,
  exportMetadata: null,
  
  // Settings
  settings: {
    llmProvider: 'anthropic', // Default to Claude
    apiKeys: {
      anthropic: '',
      openai: '',
      gemini: ''
    },
    learningEnabled: true,
    autoSaveEnabled: false, // Default OFF for privacy
    confidenceThreshold: 0.7,
    theme: 'light'
  },
  
  // UI state
  currentStep: STEPS.UPLOAD,
  loading: false,
  error: null,
  success: null
});

export default appReducer;
