/**
 * Feature Flags Panel Component
 * 
 * Task 4: Visual UI for managing feature flags
 * Displays all features with toggle switches and phase indicators
 * 
 * @module FeatureFlagsPanel
 */

import React, { useState, useEffect } from 'react';
import {
  FEATURE_FLAGS,
  getFeatureFlags,
  setFeatureFlag,
  enablePhase,
  disablePhase,
  resetFeatureFlags,
  getFeatureFlagStats
} from '../utils/featureFlags.js';

/**
 * Feature metadata for display
 */
const FEATURE_METADATA = {
  // Phase 0
  [FEATURE_FLAGS.ENHANCED_DEMOGRAPHICS]: {
    name: 'Enhanced Demographics',
    description: 'Improved extraction of MRN, patient name, and date of birth',
    phase: 'Phase 0',
    phaseColor: '#10b981', // green
    critical: true
  },
  [FEATURE_FLAGS.ENHANCED_SURGERY_DATES]: {
    name: 'Enhanced Surgery Dates',
    description: 'Better detection of surgery dates with neurosurgery-specific patterns',
    phase: 'Phase 0',
    phaseColor: '#10b981',
    critical: true
  },
  [FEATURE_FLAGS.ATTENDING_PHYSICIAN]: {
    name: 'Attending Physician',
    description: 'Extraction of attending physician information',
    phase: 'Phase 0',
    phaseColor: '#10b981',
    critical: true
  },
  [FEATURE_FLAGS.DISCHARGE_MEDICATIONS]: {
    name: 'Discharge Medications',
    description: 'Dedicated parser for discharge medication sections',
    phase: 'Phase 0',
    phaseColor: '#10b981',
    critical: true
  },
  [FEATURE_FLAGS.LATE_RECOVERY_DETECTION]: {
    name: 'Late Recovery Detection',
    description: 'Detection of recovery events after POD 15+',
    phase: 'Phase 0',
    phaseColor: '#10b981',
    critical: true
  },
  
  // Phase 1.5
  [FEATURE_FLAGS.ENHANCED_LLM_PROMPTS]: {
    name: 'Enhanced LLM Prompts',
    description: 'Improved prompts for better LLM-based extraction accuracy',
    phase: 'Phase 1.5',
    phaseColor: '#3b82f6', // blue
    critical: false
  },
  [FEATURE_FLAGS.EXTRACTION_VALIDATOR]: {
    name: 'Extraction Validator',
    description: 'Post-extraction validation to ensure data quality',
    phase: 'Phase 1.5',
    phaseColor: '#3b82f6',
    critical: false
  },
  [FEATURE_FLAGS.NARRATIVE_VALIDATOR]: {
    name: 'Narrative Validator',
    description: 'Post-generation validation for narrative quality',
    phase: 'Phase 1.5',
    phaseColor: '#3b82f6',
    critical: false
  },
  
  // Phase 3
  [FEATURE_FLAGS.SIX_DIMENSION_METRICS]: {
    name: 'Six-Dimension Quality Metrics',
    description: 'Comprehensive quality scoring across 6 dimensions',
    phase: 'Phase 3',
    phaseColor: '#8b5cf6', // purple
    critical: false
  },
  [FEATURE_FLAGS.POST_GENERATION_VALIDATOR]: {
    name: 'Post-Generation Validator',
    description: 'Advanced validation framework for generated content',
    phase: 'Phase 3',
    phaseColor: '#8b5cf6',
    critical: false
  },
  [FEATURE_FLAGS.CLINICAL_REASONING_VALIDATOR]: {
    name: 'Clinical Reasoning Validator',
    description: 'Validates clinical logic and reasoning in narratives',
    phase: 'Phase 3',
    phaseColor: '#8b5cf6',
    critical: false
  },
  [FEATURE_FLAGS.SECTION_COMPLETER]: {
    name: 'Section Completer',
    description: 'Automatically completes missing narrative sections',
    phase: 'Phase 3',
    phaseColor: '#8b5cf6',
    critical: false
  },
  [FEATURE_FLAGS.NARRATIVE_ENHANCER]: {
    name: 'Narrative Enhancer',
    description: 'Improves narrative flow and readability',
    phase: 'Phase 3',
    phaseColor: '#8b5cf6',
    critical: false
  },
  [FEATURE_FLAGS.EDGE_CASE_HANDLER]: {
    name: 'Edge Case Handler',
    description: 'Detects and handles edge cases in clinical data',
    phase: 'Phase 3',
    phaseColor: '#8b5cf6',
    critical: false
  }
};

const FeatureFlagsPanel = () => {
  const [flags, setFlags] = useState(getFeatureFlags());
  const [stats, setStats] = useState(getFeatureFlagStats());
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Listen for feature flag changes
  useEffect(() => {
    const handleFlagChange = () => {
      setFlags(getFeatureFlags());
      setStats(getFeatureFlagStats());
    };

    window.addEventListener('featureFlagChanged', handleFlagChange);
    window.addEventListener('featureFlagsReset', handleFlagChange);

    return () => {
      window.removeEventListener('featureFlagChanged', handleFlagChange);
      window.removeEventListener('featureFlagsReset', handleFlagChange);
    };
  }, []);

  const handleToggle = (flag) => {
    const metadata = FEATURE_METADATA[flag];
    const currentValue = flags[flag];

    // Show confirmation for critical features
    if (metadata.critical && currentValue) {
      setConfirmDialog({
        flag,
        message: `Are you sure you want to disable "${metadata.name}"? This is a critical feature and disabling it may affect core functionality.`
      });
      return;
    }

    // Toggle the flag
    setFeatureFlag(flag, !currentValue);
  };

  const handleConfirmToggle = () => {
    if (confirmDialog) {
      setFeatureFlag(confirmDialog.flag, false);
      setConfirmDialog(null);
    }
  };

  const handleCancelToggle = () => {
    setConfirmDialog(null);
  };

  const handleEnablePhase = (phase) => {
    enablePhase(phase);
  };

  const handleDisablePhase = (phase) => {
    disablePhase(phase);
  };

  const handleReset = () => {
    if (window.confirm('Reset all feature flags to default values?')) {
      resetFeatureFlags();
    }
  };

  // Group flags by phase
  const phase0Flags = Object.keys(FEATURE_FLAGS).filter(
    key => FEATURE_METADATA[FEATURE_FLAGS[key]]?.phase === 'Phase 0'
  );
  const phase15Flags = Object.keys(FEATURE_FLAGS).filter(
    key => FEATURE_METADATA[FEATURE_FLAGS[key]]?.phase === 'Phase 1.5'
  );
  const phase3Flags = Object.keys(FEATURE_FLAGS).filter(
    key => FEATURE_METADATA[FEATURE_FLAGS[key]]?.phase === 'Phase 3'
  );

  const renderFeatureRow = (flagKey) => {
    const flag = FEATURE_FLAGS[flagKey];
    const metadata = FEATURE_METADATA[flag];
    const enabled = flags[flag];

    return (
      <div key={flag} style={styles.featureRow}>
        <div style={styles.featureInfo}>
          <div style={styles.featureHeader}>
            <span style={enabled ? styles.statusEnabled : styles.statusDisabled}>
              {enabled ? '✅' : '❌'}
            </span>
            <span style={styles.featureName}>{metadata.name}</span>
            {metadata.critical && (
              <span style={styles.criticalBadge}>CRITICAL</span>
            )}
          </div>
          <div style={styles.featureDescription}>{metadata.description}</div>
        </div>
        <label style={styles.switch}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={() => handleToggle(flag)}
            style={styles.checkbox}
          />
          <span style={enabled ? styles.sliderEnabled : styles.sliderDisabled}></span>
        </label>
      </div>
    );
  };

  const renderPhaseSection = (title, flagKeys, phase, color) => {
    const phaseStats = phase === 'phase0' ? stats.phase0 : 
                       phase === 'phase1.5' ? stats.phase1_5 : stats.phase3;
    
    return (
      <div style={styles.phaseSection}>
        <div style={{ ...styles.phaseHeader, borderLeftColor: color }}>
          <div style={styles.phaseTitle}>
            <h3 style={styles.phaseName}>{title}</h3>
            <span style={styles.phaseStats}>
              {phaseStats.enabled}/{phaseStats.total} enabled
            </span>
          </div>
          <div style={styles.phaseActions}>
            <button
              onClick={() => handleEnablePhase(phase)}
              style={{ ...styles.phaseButton, ...styles.enableButton }}
            >
              Enable All
            </button>
            <button
              onClick={() => handleDisablePhase(phase)}
              style={{ ...styles.phaseButton, ...styles.disableButton }}
            >
              Disable All
            </button>
          </div>
        </div>
        <div style={styles.featureList}>
          {flagKeys.map(renderFeatureRow)}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Feature Flags</h2>
          <p style={styles.subtitle}>
            Manage feature rollout and experimental functionality
          </p>
        </div>
        <div style={styles.headerStats}>
          <div style={styles.statBox}>
            <div style={styles.statValue}>{stats.enabled}</div>
            <div style={styles.statLabel}>Enabled</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statValue}>{stats.disabled}</div>
            <div style={styles.statLabel}>Disabled</div>
          </div>
        </div>
      </div>

      {renderPhaseSection('Phase 0: Critical Fixes', phase0Flags, 'phase0', '#10b981')}
      {renderPhaseSection('Phase 1.5: Enhancements', phase15Flags, 'phase1.5', '#3b82f6')}
      {renderPhaseSection('Phase 3: Quality Improvements', phase3Flags, 'phase3', '#8b5cf6')}

      <div style={styles.footer}>
        <button onClick={handleReset} style={styles.resetButton}>
          Reset to Defaults
        </button>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div style={styles.overlay}>
          <div style={styles.dialog}>
            <h3 style={styles.dialogTitle}>Confirm Action</h3>
            <p style={styles.dialogMessage}>{confirmDialog.message}</p>
            <div style={styles.dialogActions}>
              <button onClick={handleCancelToggle} style={styles.cancelButton}>
                Cancel
              </button>
              <button onClick={handleConfirmToggle} style={styles.confirmButton}>
                Disable Feature
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '2px solid #e5e7eb'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
    color: '#1f2937'
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0
  },
  headerStats: {
    display: 'flex',
    gap: '20px'
  },
  statBox: {
    textAlign: 'center',
    padding: '10px 20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    minWidth: '80px'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937'
  },
  statLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px'
  },
  phaseSection: {
    marginBottom: '30px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  phaseHeader: {
    padding: '16px 20px',
    backgroundColor: '#f9fafb',
    borderLeft: '4px solid',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  phaseTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  phaseName: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
    color: '#1f2937'
  },
  phaseStats: {
    fontSize: '14px',
    color: '#6b7280',
    backgroundColor: '#fff',
    padding: '4px 12px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb'
  },
  phaseActions: {
    display: 'flex',
    gap: '8px'
  },
  phaseButton: {
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  enableButton: {
    backgroundColor: '#10b981',
    color: 'white'
  },
  disableButton: {
    backgroundColor: '#ef4444',
    color: 'white'
  },
  featureList: {
    padding: '0'
  },
  featureRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #f3f4f6',
    transition: 'background-color 0.2s'
  },
  featureInfo: {
    flex: 1
  },
  featureHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px'
  },
  statusEnabled: {
    fontSize: '16px'
  },
  statusDisabled: {
    fontSize: '16px',
    opacity: 0.5
  },
  featureName: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#1f2937'
  },
  criticalBadge: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    padding: '2px 6px',
    borderRadius: '4px',
    marginLeft: '8px'
  },
  featureDescription: {
    fontSize: '13px',
    color: '#6b7280',
    marginLeft: '24px'
  },
  switch: {
    position: 'relative',
    display: 'inline-block',
    width: '48px',
    height: '24px',
    marginLeft: '16px'
  },
  checkbox: {
    opacity: 0,
    width: 0,
    height: 0
  },
  sliderEnabled: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#10b981',
    transition: '0.3s',
    borderRadius: '24px',
    '::before': {
      position: 'absolute',
      content: '""',
      height: '18px',
      width: '18px',
      left: '26px',
      bottom: '3px',
      backgroundColor: 'white',
      transition: '0.3s',
      borderRadius: '50%'
    }
  },
  sliderDisabled: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#d1d5db',
    transition: '0.3s',
    borderRadius: '24px',
    '::before': {
      position: 'absolute',
      content: '""',
      height: '18px',
      width: '18px',
      left: '3px',
      bottom: '3px',
      backgroundColor: 'white',
      transition: '0.3s',
      borderRadius: '50%'
    }
  },
  footer: {
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '2px solid #e5e7eb',
    textAlign: 'center'
  },
  resetButton: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  dialog: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
  },
  dialogTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 12px 0',
    color: '#1f2937'
  },
  dialogMessage: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 20px 0',
    lineHeight: '1.5'
  },
  dialogActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  },
  cancelButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#f3f4f6',
    color: '#1f2937',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  confirmButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  }
};

export default FeatureFlagsPanel;

