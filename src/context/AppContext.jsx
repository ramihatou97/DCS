/**
 * Global Application Context
 * 
 * Provides state management for entire application
 */

import { createContext, useContext, useReducer, useEffect } from 'react';
import appReducer, { getInitialState } from './AppReducer';
import { ACTIONS } from './actions';
import storageService from '../services/storage/storageService';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, getInitialState());
  
  // Initialize storage service on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await storageService.initialize();
        
        // Load settings from storage
        const autoSaveSetting = await storageService.getSetting('autoSaveEnabled');
        if (autoSaveSetting) {
          dispatch({
            type: ACTIONS.UPDATE_SETTINGS,
            payload: { autoSaveEnabled: autoSaveSetting.value }
          });
        }
        
        // Load knowledge base stats
        const stats = await storageService.getStatistics();
        dispatch({
          type: ACTIONS.UPDATE_LEARNING_METRICS,
          payload: {
            patternsLearned: stats.totalPatterns,
            totalCorrections: stats.totalCorrections
          }
        });
        
        console.log('✅ App initialized successfully');
      } catch (error) {
        console.error('❌ App initialization error:', error);
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: {
            type: 'initialization',
            message: 'Failed to initialize app',
            details: error.message
          }
        });
      }
    };
    
    initializeApp();
  }, []);
  
  // Auto-save draft when data changes (if enabled)
  useEffect(() => {
    const saveDraft = async () => {
      if (!state.settings.autoSaveEnabled) return;
      if (!state.extractedData && !state.summary) return;
      
      try {
        const draft = {
          notes: state.notes,
          extractedData: state.extractedData,
          summary: state.summary,
          followUpPlan: state.followUpPlan,
          currentStep: state.currentStep,
          timestamp: new Date().toISOString()
        };
        
        await storageService.saveDraft(draft);
        console.log('💾 Draft auto-saved');
      } catch (error) {
        console.error('Auto-save error:', error);
      }
    };
    
    // Debounce auto-save
    const timeoutId = setTimeout(saveDraft, 2000);
    return () => clearTimeout(timeoutId);
  }, [state.extractedData, state.summary, state.settings.autoSaveEnabled]);
  
  // Context value
  const value = {
    state,
    dispatch,
    
    // Convenience methods
    setNotes: (notes, metadata) => {
      dispatch({
        type: ACTIONS.SET_NOTES,
        payload: { notes, metadata }
      });
    },
    
    setExtractedData: (data, metadata) => {
      dispatch({
        type: ACTIONS.SET_EXTRACTED_DATA,
        payload: { data, metadata }
      });
    },
    
    updateField: (field, value) => {
      dispatch({
        type: ACTIONS.UPDATE_EXTRACTED_FIELD,
        payload: { field, value }
      });
    },
    
    addCorrection: (correction) => {
      dispatch({
        type: ACTIONS.ADD_CORRECTION,
        payload: correction
      });
    },
    
    setSummary: (summary) => {
      dispatch({
        type: ACTIONS.SET_SUMMARY,
        payload: summary
      });
    },
    
    setFollowUp: (followUp) => {
      dispatch({
        type: ACTIONS.SET_FOLLOW_UP,
        payload: followUp
      });
    },
    
    updateSettings: (settings) => {
      dispatch({
        type: ACTIONS.UPDATE_SETTINGS,
        payload: settings
      });
    },
    
    setApiKey: (provider, key) => {
      dispatch({
        type: ACTIONS.SET_API_KEY,
        payload: { provider, key }
      });
    },
    
    toggleAutoSave: async (enabled) => {
      dispatch({
        type: ACTIONS.TOGGLE_AUTO_SAVE,
        payload: enabled
      });
      
      // Persist to storage
      await storageService.setSetting('autoSaveEnabled', enabled);
    },
    
    setStep: (step) => {
      dispatch({
        type: ACTIONS.SET_STEP,
        payload: step
      });
    },
    
    nextStep: () => {
      dispatch({ type: ACTIONS.NEXT_STEP });
    },
    
    prevStep: () => {
      dispatch({ type: ACTIONS.PREV_STEP });
    },
    
    setLoading: (loading) => {
      dispatch({
        type: ACTIONS.SET_LOADING,
        payload: loading
      });
    },
    
    setError: (error) => {
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: error
      });
    },
    
    clearError: () => {
      dispatch({ type: ACTIONS.CLEAR_ERROR });
    },
    
    setSuccess: (message) => {
      dispatch({
        type: ACTIONS.SET_SUCCESS,
        payload: message
      });
    },
    
    clearPatientData: async () => {
      // Clear from state
      dispatch({ type: ACTIONS.CLEAR_PATIENT_DATA });
      
      // Clear from storage
      await storageService.clearAllDrafts();
      
      console.log('🗑️ Patient data cleared (ML learning preserved)');
    },
    
    resetApp: () => {
      dispatch({ type: ACTIONS.RESET_STATE });
    }
  };
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * Custom hook to use app context
 */
export const useApp = () => {
  const context = useContext(AppContext);
  
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  
  return context;
};

// Alias for compatibility
export const useAppContext = useApp;

export default AppContext;
