/**
 * Feature Flags Management
 *
 * Centralized feature flag system for gradual rollout of Phase 0-3 improvements
 * Uses localStorage for client-side persistence (consistent with existing architecture)
 *
 * @module featureFlags
 */

const FEATURE_FLAGS_KEY = 'dcs_feature_flags';

/**
 * Feature flag definitions
 */
export const FEATURE_FLAGS = {
  // Phase 0: Critical Extraction Fixes
  ENHANCED_DEMOGRAPHICS: 'enhanced_demographics',           // MRN, name, DOB extraction
  ENHANCED_SURGERY_DATES: 'enhanced_surgery_dates',        // Improved surgery date patterns
  ATTENDING_PHYSICIAN: 'attending_physician',              // Attending physician extraction
  DISCHARGE_MEDICATIONS: 'discharge_medications',          // Discharge medication section parser
  LATE_RECOVERY_DETECTION: 'late_recovery_detection',      // POD 15+ recovery events

  // Phase 1.5: Enhancement (if needed)
  ENHANCED_LLM_PROMPTS: 'enhanced_llm_prompts',           // Improved extraction prompts
  EXTRACTION_VALIDATOR: 'extraction_validator',            // Post-extraction validation
  NARRATIVE_VALIDATOR: 'narrative_validator',              // Post-generation validation

  // Phase 3: Quality Enhancement
  SIX_DIMENSION_METRICS: 'six_dimension_metrics',         // Complete quality metrics rewrite
  POST_GENERATION_VALIDATOR: 'post_generation_validator',  // Advanced validation framework
  CLINICAL_REASONING_VALIDATOR: 'clinical_reasoning_validator', // Clinical logic validation
  SECTION_COMPLETER: 'section_completer',                 // Automated section completion
  NARRATIVE_ENHANCER: 'narrative_enhancer',               // Narrative flow enhancement
  EDGE_CASE_HANDLER: 'edge_case_handler'                  // Edge case detection and handling
};

/**
 * Default feature flag states
 */
const DEFAULT_FLAGS = {
  // Phase 0: Enabled by default (critical fixes)
  [FEATURE_FLAGS.ENHANCED_DEMOGRAPHICS]: true,
  [FEATURE_FLAGS.ENHANCED_SURGERY_DATES]: true,
  [FEATURE_FLAGS.ATTENDING_PHYSICIAN]: true,
  [FEATURE_FLAGS.DISCHARGE_MEDICATIONS]: true,
  [FEATURE_FLAGS.LATE_RECOVERY_DETECTION]: true,

  // Phase 1.5: Disabled by default (enhancement)
  [FEATURE_FLAGS.ENHANCED_LLM_PROMPTS]: false,
  [FEATURE_FLAGS.EXTRACTION_VALIDATOR]: false,
  [FEATURE_FLAGS.NARRATIVE_VALIDATOR]: false,

  // Phase 3: Disabled by default (quality enhancement)
  [FEATURE_FLAGS.SIX_DIMENSION_METRICS]: false,
  [FEATURE_FLAGS.POST_GENERATION_VALIDATOR]: false,
  [FEATURE_FLAGS.CLINICAL_REASONING_VALIDATOR]: false,
  [FEATURE_FLAGS.SECTION_COMPLETER]: false,
  [FEATURE_FLAGS.NARRATIVE_ENHANCER]: false,
  [FEATURE_FLAGS.EDGE_CASE_HANDLER]: false
};

/**
 * Get all feature flags
 * @returns {Object} Current feature flag states
 */
export const getFeatureFlags = () => {
  try {
    const stored = localStorage.getItem(FEATURE_FLAGS_KEY);
    if (stored) {
      const flags = JSON.parse(stored);
      // Merge with defaults to ensure all flags exist
      return { ...DEFAULT_FLAGS, ...flags };
    }
    return DEFAULT_FLAGS;
  } catch (error) {
    console.error('[Feature Flags] Error loading flags:', error);
    return DEFAULT_FLAGS;
  }
};

/**
 * Set a specific feature flag
 * @param {string} flag - Flag name from FEATURE_FLAGS
 * @param {boolean} enabled - Whether to enable or disable
 */
export const setFeatureFlag = (flag, enabled) => {
  try {
    const flags = getFeatureFlags();
    flags[flag] = enabled;
    localStorage.setItem(FEATURE_FLAGS_KEY, JSON.stringify(flags));
    console.log(`[Feature Flags] ${flag}: ${enabled ? 'ENABLED' : 'DISABLED'}`);

    // Trigger custom event for UI updates
    window.dispatchEvent(new CustomEvent('featureFlagChanged', {
      detail: { flag, enabled }
    }));

    return true;
  } catch (error) {
    console.error('[Feature Flags] Error setting flag:', error);
    return false;
  }
};

/**
 * Check if a feature is enabled
 * @param {string} flag - Flag name from FEATURE_FLAGS
 * @returns {boolean} Whether the feature is enabled
 */
export const isFeatureEnabled = (flag) => {
  const flags = getFeatureFlags();
  return flags[flag] === true;
};

/**
 * Enable all flags for a specific phase
 * @param {string} phase - Phase name ('phase0', 'phase1.5', 'phase3')
 */
export const enablePhase = (phase) => {
  const phaseFlags = {
    'phase0': [
      FEATURE_FLAGS.ENHANCED_DEMOGRAPHICS,
      FEATURE_FLAGS.ENHANCED_SURGERY_DATES,
      FEATURE_FLAGS.ATTENDING_PHYSICIAN,
      FEATURE_FLAGS.DISCHARGE_MEDICATIONS,
      FEATURE_FLAGS.LATE_RECOVERY_DETECTION
    ],
    'phase1.5': [
      FEATURE_FLAGS.ENHANCED_LLM_PROMPTS,
      FEATURE_FLAGS.EXTRACTION_VALIDATOR,
      FEATURE_FLAGS.NARRATIVE_VALIDATOR
    ],
    'phase3': [
      FEATURE_FLAGS.SIX_DIMENSION_METRICS,
      FEATURE_FLAGS.POST_GENERATION_VALIDATOR,
      FEATURE_FLAGS.CLINICAL_REASONING_VALIDATOR,
      FEATURE_FLAGS.SECTION_COMPLETER,
      FEATURE_FLAGS.NARRATIVE_ENHANCER,
      FEATURE_FLAGS.EDGE_CASE_HANDLER
    ]
  };

  const flagsToEnable = phaseFlags[phase];
  if (flagsToEnable) {
    flagsToEnable.forEach(flag => setFeatureFlag(flag, true));
    console.log(`[Feature Flags] Enabled all ${phase} flags`);
  } else {
    console.warn(`[Feature Flags] Unknown phase: ${phase}`);
  }
};

/**
 * Disable all flags for a specific phase
 * @param {string} phase - Phase name ('phase0', 'phase1.5', 'phase3')
 */
export const disablePhase = (phase) => {
  const phaseFlags = {
    'phase0': [
      FEATURE_FLAGS.ENHANCED_DEMOGRAPHICS,
      FEATURE_FLAGS.ENHANCED_SURGERY_DATES,
      FEATURE_FLAGS.ATTENDING_PHYSICIAN,
      FEATURE_FLAGS.DISCHARGE_MEDICATIONS,
      FEATURE_FLAGS.LATE_RECOVERY_DETECTION
    ],
    'phase1.5': [
      FEATURE_FLAGS.ENHANCED_LLM_PROMPTS,
      FEATURE_FLAGS.EXTRACTION_VALIDATOR,
      FEATURE_FLAGS.NARRATIVE_VALIDATOR
    ],
    'phase3': [
      FEATURE_FLAGS.SIX_DIMENSION_METRICS,
      FEATURE_FLAGS.POST_GENERATION_VALIDATOR,
      FEATURE_FLAGS.CLINICAL_REASONING_VALIDATOR,
      FEATURE_FLAGS.SECTION_COMPLETER,
      FEATURE_FLAGS.NARRATIVE_ENHANCER,
      FEATURE_FLAGS.EDGE_CASE_HANDLER
    ]
  };

  const flagsToDisable = phaseFlags[phase];
  if (flagsToDisable) {
    flagsToDisable.forEach(flag => setFeatureFlag(flag, false));
    console.log(`[Feature Flags] Disabled all ${phase} flags`);
  } else {
    console.warn(`[Feature Flags] Unknown phase: ${phase}`);
  }
};

/**
 * Reset all flags to defaults
 */
export const resetFeatureFlags = () => {
  try {
    localStorage.setItem(FEATURE_FLAGS_KEY, JSON.stringify(DEFAULT_FLAGS));
    console.log('[Feature Flags] Reset to defaults');

    // Trigger custom event for UI updates
    window.dispatchEvent(new CustomEvent('featureFlagsReset'));

    return true;
  } catch (error) {
    console.error('[Feature Flags] Error resetting flags:', error);
    return false;
  }
};

/**
 * Get feature flag stats for debugging/monitoring
 * @returns {Object} Statistics about feature flags
 */
export const getFeatureFlagStats = () => {
  const flags = getFeatureFlags();
  const stats = {
    total: Object.keys(flags).length,
    enabled: Object.values(flags).filter(v => v === true).length,
    disabled: Object.values(flags).filter(v => v === false).length,
    phase0: {
      total: 5,
      enabled: [
        FEATURE_FLAGS.ENHANCED_DEMOGRAPHICS,
        FEATURE_FLAGS.ENHANCED_SURGERY_DATES,
        FEATURE_FLAGS.ATTENDING_PHYSICIAN,
        FEATURE_FLAGS.DISCHARGE_MEDICATIONS,
        FEATURE_FLAGS.LATE_RECOVERY_DETECTION
      ].filter(f => flags[f]).length
    },
    phase1_5: {
      total: 3,
      enabled: [
        FEATURE_FLAGS.ENHANCED_LLM_PROMPTS,
        FEATURE_FLAGS.EXTRACTION_VALIDATOR,
        FEATURE_FLAGS.NARRATIVE_VALIDATOR
      ].filter(f => flags[f]).length
    },
    phase3: {
      total: 6,
      enabled: [
        FEATURE_FLAGS.SIX_DIMENSION_METRICS,
        FEATURE_FLAGS.POST_GENERATION_VALIDATOR,
        FEATURE_FLAGS.CLINICAL_REASONING_VALIDATOR,
        FEATURE_FLAGS.SECTION_COMPLETER,
        FEATURE_FLAGS.NARRATIVE_ENHANCER,
        FEATURE_FLAGS.EDGE_CASE_HANDLER
      ].filter(f => flags[f]).length
    }
  };

  return stats;
};

// Log feature flag status on module load
console.log('[Feature Flags] Module loaded');
const stats = getFeatureFlagStats();
console.log(`[Feature Flags] Status: ${stats.enabled}/${stats.total} enabled`);
console.log(`[Feature Flags] Phase 0: ${stats.phase0.enabled}/${stats.phase0.total} enabled`);
console.log(`[Feature Flags] Phase 1.5: ${stats.phase1_5.enabled}/${stats.phase1_5.total} enabled`);
console.log(`[Feature Flags] Phase 3: ${stats.phase3.enabled}/${stats.phase3.total} enabled`);

export default {
  FEATURE_FLAGS,
  getFeatureFlags,
  setFeatureFlag,
  isFeatureEnabled,
  enablePhase,
  disablePhase,
  resetFeatureFlags,
  getFeatureFlagStats
};