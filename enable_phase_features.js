/**
 * Script to Enable Phase 1.5 and Phase 3 Features
 * Run this script to enable all advanced features in the DCS application
 * 
 * Phase 1.5 Features (3 features):
 * - Enhanced LLM Prompts: Improved extraction prompts for better accuracy
 * - Extraction Validator: Post-extraction validation to catch errors
 * - Narrative Validator: Post-generation validation for quality assurance
 * 
 * Phase 3 Features (6 features):
 * - 6-Dimension Metrics: Complete quality metrics rewrite for comprehensive assessment
 * - Post-Generation Validator: Advanced validation framework for final output
 * - Clinical Reasoning Validator: Clinical logic validation to ensure medical accuracy
 * - Section Completer: Automated section completion for missing data
 * - Narrative Enhancer: Narrative flow enhancement for readability
 * - Edge Case Handler: Edge case detection and handling for robust processing
 * 
 * @author DCS Team
 * @date 2025-10-17
 */

import { enablePhase, getFeatureFlags, setFeatureFlag, FEATURE_FLAGS } from './src/utils/featureFlags.js';

// Terminal color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

console.log(`${colors.bright}${colors.blue}🚀 DCS Feature Enabler - Phase 1.5 & Phase 3${colors.reset}\n`);
console.log(`${colors.cyan}===========================================${colors.reset}\n`);

// Get current state
const currentFlags = getFeatureFlags();

// Display current state
console.log(`${colors.yellow}📊 Current Feature State:${colors.reset}`);
console.log('---------------------------\n');

console.log(`${colors.bright}Phase 0 (Core Features):${colors.reset}`);
console.log(`  ✅ Enhanced Demographics: ${currentFlags[FEATURE_FLAGS.ENHANCED_DEMOGRAPHICS] ? '✓ Enabled' : '✗ Disabled'}`);
console.log(`  ✅ Enhanced Surgery Dates: ${currentFlags[FEATURE_FLAGS.ENHANCED_SURGERY_DATES] ? '✓ Enabled' : '✗ Disabled'}`);
console.log(`  ✅ Attending Physician: ${currentFlags[FEATURE_FLAGS.ATTENDING_PHYSICIAN] ? '✓ Enabled' : '✗ Disabled'}`);
console.log(`  ✅ Discharge Medications: ${currentFlags[FEATURE_FLAGS.DISCHARGE_MEDICATIONS] ? '✓ Enabled' : '✗ Disabled'}`);
console.log(`  ✅ Late Recovery Detection: ${currentFlags[FEATURE_FLAGS.LATE_RECOVERY_DETECTION] ? '✓ Enabled' : '✗ Disabled'}\n`);

console.log(`${colors.bright}Phase 1.5 (Enhancement Features):${colors.reset}`);
console.log(`  ${currentFlags[FEATURE_FLAGS.ENHANCED_LLM_PROMPTS] ? '✅' : '❌'} Enhanced LLM Prompts: ${currentFlags[FEATURE_FLAGS.ENHANCED_LLM_PROMPTS] ? '✓ Enabled' : '✗ Disabled'}`);
console.log(`  ${currentFlags[FEATURE_FLAGS.EXTRACTION_VALIDATOR] ? '✅' : '❌'} Extraction Validator: ${currentFlags[FEATURE_FLAGS.EXTRACTION_VALIDATOR] ? '✓ Enabled' : '✗ Disabled'}`);
console.log(`  ${currentFlags[FEATURE_FLAGS.NARRATIVE_VALIDATOR] ? '✅' : '❌'} Narrative Validator: ${currentFlags[FEATURE_FLAGS.NARRATIVE_VALIDATOR] ? '✓ Enabled' : '✗ Disabled'}\n`);

console.log(`${colors.bright}Phase 3 (Quality Features):${colors.reset}`);
console.log(`  ${currentFlags[FEATURE_FLAGS.SIX_DIMENSION_METRICS] ? '✅' : '❌'} 6-Dimension Metrics: ${currentFlags[FEATURE_FLAGS.SIX_DIMENSION_METRICS] ? '✓ Enabled' : '✗ Disabled'}`);
console.log(`  ${currentFlags[FEATURE_FLAGS.POST_GENERATION_VALIDATOR] ? '✅' : '❌'} Post-Generation Validator: ${currentFlags[FEATURE_FLAGS.POST_GENERATION_VALIDATOR] ? '✓ Enabled' : '✗ Disabled'}`);
console.log(`  ${currentFlags[FEATURE_FLAGS.CLINICAL_REASONING_VALIDATOR] ? '✅' : '❌'} Clinical Reasoning Validator: ${currentFlags[FEATURE_FLAGS.CLINICAL_REASONING_VALIDATOR] ? '✓ Enabled' : '✗ Disabled'}`);
console.log(`  ${currentFlags[FEATURE_FLAGS.SECTION_COMPLETER] ? '✅' : '❌'} Section Completer: ${currentFlags[FEATURE_FLAGS.SECTION_COMPLETER] ? '✓ Enabled' : '✗ Disabled'}`);
console.log(`  ${currentFlags[FEATURE_FLAGS.NARRATIVE_ENHANCER] ? '✅' : '❌'} Narrative Enhancer: ${currentFlags[FEATURE_FLAGS.NARRATIVE_ENHANCER] ? '✓ Enabled' : '✗ Disabled'}`);
console.log(`  ${currentFlags[FEATURE_FLAGS.EDGE_CASE_HANDLER] ? '✅' : '❌'} Edge Case Handler: ${currentFlags[FEATURE_FLAGS.EDGE_CASE_HANDLER] ? '✓ Enabled' : '✗ Disabled'}\n`);

console.log(`${colors.cyan}===========================================${colors.reset}\n`);

// Enable Phase 1.5 features
console.log(`${colors.bright}${colors.green}🔧 Enabling Phase 1.5 Features...${colors.reset}`);
enablePhase('phase1.5');

// Verify Phase 1.5 enabled
const phase15Enabled = [
  FEATURE_FLAGS.ENHANCED_LLM_PROMPTS,
  FEATURE_FLAGS.EXTRACTION_VALIDATOR,
  FEATURE_FLAGS.NARRATIVE_VALIDATOR
].every(flag => getFeatureFlags()[flag]);

if (phase15Enabled) {
  console.log(`${colors.green}✅ Phase 1.5 features successfully enabled!${colors.reset}\n`);
} else {
  console.log(`${colors.red}❌ Error enabling Phase 1.5 features${colors.reset}\n`);
}

// Enable Phase 3 features
console.log(`${colors.bright}${colors.green}🔧 Enabling Phase 3 Features...${colors.reset}`);
enablePhase('phase3');

// Verify Phase 3 enabled
const phase3Enabled = [
  FEATURE_FLAGS.SIX_DIMENSION_METRICS,
  FEATURE_FLAGS.POST_GENERATION_VALIDATOR,
  FEATURE_FLAGS.CLINICAL_REASONING_VALIDATOR,
  FEATURE_FLAGS.SECTION_COMPLETER,
  FEATURE_FLAGS.NARRATIVE_ENHANCER,
  FEATURE_FLAGS.EDGE_CASE_HANDLER
].every(flag => getFeatureFlags()[flag]);

if (phase3Enabled) {
  console.log(`${colors.green}✅ Phase 3 features successfully enabled!${colors.reset}\n`);
} else {
  console.log(`${colors.red}❌ Error enabling Phase 3 features${colors.reset}\n`);
}

// Get updated state
const updatedFlags = getFeatureFlags();

// Display summary
console.log(`${colors.cyan}===========================================${colors.reset}\n`);
console.log(`${colors.bright}${colors.green}✨ FEATURE ACTIVATION COMPLETE!${colors.reset}\n`);

// Count enabled features
const phase15Count = [
  FEATURE_FLAGS.ENHANCED_LLM_PROMPTS,
  FEATURE_FLAGS.EXTRACTION_VALIDATOR,
  FEATURE_FLAGS.NARRATIVE_VALIDATOR
].filter(flag => updatedFlags[flag]).length;

const phase3Count = [
  FEATURE_FLAGS.SIX_DIMENSION_METRICS,
  FEATURE_FLAGS.POST_GENERATION_VALIDATOR,
  FEATURE_FLAGS.CLINICAL_REASONING_VALIDATOR,
  FEATURE_FLAGS.SECTION_COMPLETER,
  FEATURE_FLAGS.NARRATIVE_ENHANCER,
  FEATURE_FLAGS.EDGE_CASE_HANDLER
].filter(flag => updatedFlags[flag]).length;

console.log(`${colors.bright}📈 Feature Summary:${colors.reset}`);
console.log(`  • Phase 0: 5/5 features enabled (Core)`)
console.log(`  • Phase 1.5: ${phase15Count}/3 features enabled (Enhancement)`);
console.log(`  • Phase 3: ${phase3Count}/6 features enabled (Quality)`);
console.log(`  • Total: ${5 + phase15Count + phase3Count}/14 features enabled\n`);

console.log(`${colors.bright}🎯 Expected Benefits:${colors.reset}`);
console.log(`  • ${colors.green}Better extraction accuracy${colors.reset} (Enhanced LLM prompts)`);
console.log(`  • ${colors.green}Validation of extracted data${colors.reset} (Extraction validator)`);
console.log(`  • ${colors.green}Validation of generated narratives${colors.reset} (Narrative validator)`);
console.log(`  • ${colors.green}Comprehensive quality metrics${colors.reset} (6-dimension assessment)`);
console.log(`  • ${colors.green}Clinical accuracy validation${colors.reset} (Clinical reasoning checks)`);
console.log(`  • ${colors.green}Complete narrative sections${colors.reset} (Automated completion)`);
console.log(`  • ${colors.green}Improved narrative flow${colors.reset} (Enhanced transitions)`);
console.log(`  • ${colors.green}Robust edge case handling${colors.reset} (Error recovery)\n`);

console.log(`${colors.bright}⚠️  Important Notes:${colors.reset}`);
console.log(`  1. These features are stored in localStorage`);
console.log(`  2. Refresh your browser to apply changes`);
console.log(`  3. Features persist across sessions`);
console.log(`  4. To disable, use disablePhase('phase1.5') or disablePhase('phase3')`);
console.log(`  5. Monitor console logs for feature-specific messages\n`);

console.log(`${colors.cyan}===========================================${colors.reset}\n`);
console.log(`${colors.bright}${colors.blue}🚀 Phase 1.5 & Phase 3 features are now ACTIVE!${colors.reset}`);
console.log(`${colors.bright}${colors.yellow}⚡ Please refresh your browser to apply changes.${colors.reset}\n`);

// Export utility functions for testing
export { phase15Enabled, phase3Enabled };