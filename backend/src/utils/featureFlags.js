/**
 * Backend Feature Flags Management
 *
 * Mirrors the frontend feature flag system for consistent behavior
 * Uses environment variables for backend-specific configuration
 *
 * @module featureFlags
 */

/**
 * Feature flag definitions (matches frontend)
 */
const FEATURE_FLAGS = {
  // Phase 0: Critical Extraction Fixes
  ENHANCED_DEMOGRAPHICS: 'enhanced_demographics',
  ENHANCED_SURGERY_DATES: 'enhanced_surgery_dates',
  ATTENDING_PHYSICIAN: 'attending_physician',
  DISCHARGE_MEDICATIONS: 'discharge_medications',
  LATE_RECOVERY_DETECTION: 'late_recovery_detection',

  // Phase 1.5: Enhancement
  ENHANCED_LLM_PROMPTS: 'enhanced_llm_prompts',
  EXTRACTION_VALIDATOR: 'extraction_validator',
  NARRATIVE_VALIDATOR: 'narrative_validator',

  // Phase 3: Quality Enhancement
  SIX_DIMENSION_METRICS: 'six_dimension_metrics',
  POST_GENERATION_VALIDATOR: 'post_generation_validator',
  CLINICAL_REASONING_VALIDATOR: 'clinical_reasoning_validator',
  SECTION_COMPLETER: 'section_completer',
  NARRATIVE_ENHANCER: 'narrative_enhancer',
  EDGE_CASE_HANDLER: 'edge_case_handler'
};

/**
 * Default feature flag states (matches frontend defaults)
 */
const DEFAULT_FLAGS = {
  // Phase 0: Enabled by default
  [FEATURE_FLAGS.ENHANCED_DEMOGRAPHICS]: true,
  [FEATURE_FLAGS.ENHANCED_SURGERY_DATES]: true,
  [FEATURE_FLAGS.ATTENDING_PHYSICIAN]: true,
  [FEATURE_FLAGS.DISCHARGE_MEDICATIONS]: true,
  [FEATURE_FLAGS.LATE_RECOVERY_DETECTION]: true,

  // Phase 1.5: ENABLED (Task 1)
  [FEATURE_FLAGS.ENHANCED_LLM_PROMPTS]: true,
  [FEATURE_FLAGS.EXTRACTION_VALIDATOR]: true,
  [FEATURE_FLAGS.NARRATIVE_VALIDATOR]: true,

  // Phase 3: ENABLED (Task 2)
  [FEATURE_FLAGS.SIX_DIMENSION_METRICS]: true,
  [FEATURE_FLAGS.POST_GENERATION_VALIDATOR]: true,
  [FEATURE_FLAGS.CLINICAL_REASONING_VALIDATOR]: true,
  [FEATURE_FLAGS.SECTION_COMPLETER]: true,
  [FEATURE_FLAGS.NARRATIVE_ENHANCER]: true,
  [FEATURE_FLAGS.EDGE_CASE_HANDLER]: true
};

/**
 * Get all feature flags
 * Can be overridden by environment variables: FEATURE_FLAG_<NAME>=true/false
 */
const getFeatureFlags = () => {
  const flags = { ...DEFAULT_FLAGS };

  // Allow environment variable overrides
  Object.keys(FEATURE_FLAGS).forEach(key => {
    const envVar = `FEATURE_FLAG_${key}`;
    if (process.env[envVar] !== undefined) {
      flags[FEATURE_FLAGS[key]] = process.env[envVar] === 'true';
    }
  });

  return flags;
};

/**
 * Check if a feature is enabled
 * @param {string} flag - Flag name from FEATURE_FLAGS
 * @returns {boolean} Whether the feature is enabled
 */
const isFeatureEnabled = (flag) => {
  const flags = getFeatureFlags();
  const enabled = flags[flag] === true;

  // Task 3: Log feature flag checks for debugging
  console.log(`[Backend Feature Flag] ${flag}: ${enabled ? '✅ ENABLED' : '❌ DISABLED'}`);

  return enabled;
};

/**
 * Get feature flag statistics
 */
const getFeatureFlagStats = () => {
  const flags = getFeatureFlags();

  const phase0Flags = [
    FEATURE_FLAGS.ENHANCED_DEMOGRAPHICS,
    FEATURE_FLAGS.ENHANCED_SURGERY_DATES,
    FEATURE_FLAGS.ATTENDING_PHYSICIAN,
    FEATURE_FLAGS.DISCHARGE_MEDICATIONS,
    FEATURE_FLAGS.LATE_RECOVERY_DETECTION
  ];

  const phase15Flags = [
    FEATURE_FLAGS.ENHANCED_LLM_PROMPTS,
    FEATURE_FLAGS.EXTRACTION_VALIDATOR,
    FEATURE_FLAGS.NARRATIVE_VALIDATOR
  ];

  const phase3Flags = [
    FEATURE_FLAGS.SIX_DIMENSION_METRICS,
    FEATURE_FLAGS.POST_GENERATION_VALIDATOR,
    FEATURE_FLAGS.CLINICAL_REASONING_VALIDATOR,
    FEATURE_FLAGS.SECTION_COMPLETER,
    FEATURE_FLAGS.NARRATIVE_ENHANCER,
    FEATURE_FLAGS.EDGE_CASE_HANDLER
  ];

  return {
    total: Object.keys(flags).length,
    enabled: Object.values(flags).filter(v => v === true).length,
    disabled: Object.values(flags).filter(v => v === false).length,
    phase0: {
      total: phase0Flags.length,
      enabled: phase0Flags.filter(f => flags[f]).length,
      flags: phase0Flags.reduce((acc, f) => ({ ...acc, [f]: flags[f] }), {})
    },
    phase1_5: {
      total: phase15Flags.length,
      enabled: phase15Flags.filter(f => flags[f]).length,
      flags: phase15Flags.reduce((acc, f) => ({ ...acc, [f]: flags[f] }), {})
    },
    phase3: {
      total: phase3Flags.length,
      enabled: phase3Flags.filter(f => flags[f]).length,
      flags: phase3Flags.reduce((acc, f) => ({ ...acc, [f]: flags[f] }), {})
    }
  };
};

// Log feature flag status on module load
console.log('═══════════════════════════════════════════════════════════');
console.log('🚩 BACKEND FEATURE FLAGS INITIALIZED');
console.log('═══════════════════════════════════════════════════════════');

const stats = getFeatureFlagStats();
const currentFlags = getFeatureFlags();

console.log(`📊 Overall Status: ${stats.enabled}/${stats.total} features enabled`);
console.log('');

console.log(`📦 Phase 0: ${stats.phase0.enabled}/${stats.phase0.total} enabled`);
console.log(`🔧 Phase 1.5: ${stats.phase1_5.enabled}/${stats.phase1_5.total} enabled`);
console.log(`⭐ Phase 3: ${stats.phase3.enabled}/${stats.phase3.total} enabled`);
console.log('═══════════════════════════════════════════════════════════');

module.exports = {
  isFeatureEnabled,
  FEATURE_FLAGS,
  getFeatureFlags,
  getFeatureFlagStats
};
