/**
 * Specificity Scorer - 6-Dimension Quality Metrics
 *
 * Evaluates how specific vs generic the discharge summary is by checking:
 * - Use of specific values vs vague descriptions
 * - Quantified measurements vs qualitative assessments
 * - Precise timing vs approximate timing
 * - Named procedures/medications vs generic terms
 *
 * Weight: 5% of overall quality score
 *
 * @module specificityScorer
 */

/**
 * Calculate specificity score for discharge summary
 *
 * @param {Object} narrative - Generated narrative
 * @param {Object} extractedData - Extracted medical data
 * @param {Object} options - Scoring options
 * @returns {Object} Specificity score with details
 */
export function calculateSpecificityScore(narrative, extractedData, options = {}) {
  const {
    requirePreciseValues = true
  } = options;

  const issues = [];
  let totalChecks = 0;
  let specificChecks = 0;

  // 1. Value specificity (35% of specificity)
  const valueSpecificity = checkValueSpecificity(extractedData, narrative);
  totalChecks += valueSpecificity.totalChecks * 0.35;
  specificChecks += valueSpecificity.specificChecks * 0.35;
  issues.push(...valueSpecificity.issues);

  // 2. Temporal specificity (25% of specificity)
  const temporalSpecificity = checkTemporalSpecificity(narrative);
  totalChecks += temporalSpecificity.totalChecks * 0.25;
  specificChecks += temporalSpecificity.specificChecks * 0.25;
  issues.push(...temporalSpecificity.issues);

  // 3. Clinical detail specificity (20% of specificity)
  const clinicalSpecificity = checkClinicalDetailSpecificity(extractedData, narrative);
  totalChecks += clinicalSpecificity.totalChecks * 0.20;
  specificChecks += clinicalSpecificity.specificChecks * 0.20;
  issues.push(...clinicalSpecificity.issues);

  // 4. Medication specificity (10% of specificity)
  const medSpecificity = checkMedicationSpecificity(extractedData);
  totalChecks += medSpecificity.totalChecks * 0.10;
  specificChecks += medSpecificity.specificChecks * 0.10;
  issues.push(...medSpecificity.issues);

  // 5. Procedure specificity (10% of specificity)
  const procSpecificity = checkProcedureSpecificity(extractedData);
  totalChecks += procSpecificity.totalChecks * 0.10;
  specificChecks += procSpecificity.specificChecks * 0.10;
  issues.push(...procSpecificity.issues);

  const score = totalChecks > 0 ? specificChecks / totalChecks : 0;

  // Apply penalty for too many generic terms
  let finalScore = score;
  if (requirePreciseValues && issues.filter(i => i.type === 'GENERIC_VALUE').length > 5) {
    finalScore = Math.max(0, score - 0.05);
  }

  return {
    score: finalScore,
    rawScore: score,
    weight: 0.05,
    weighted: finalScore * 0.05,
    issues,
    details: {
      valueSpecificity,
      temporalSpecificity,
      clinicalSpecificity,
      medicationSpecificity: medSpecificity,
      procedureSpecificity: procSpecificity,
      penaltyApplied: finalScore < score
    }
  };
}

/**
 * Check specificity of values (numbers, measurements, scores)
 */
function checkValueSpecificity(extractedData, narrative) {
  const issues = [];
  let totalChecks = 0;
  let specificChecks = 0;

  const narrativeText = narrative ? JSON.stringify(narrative).toLowerCase() : '';

  // Check for vague quantifiers
  const vagueQuantifiers = [
    'several', 'multiple', 'numerous', 'many', 'few',
    'some', 'various', 'moderate', 'mild', 'severe'
  ];

  for (const vague of vagueQuantifiers) {
    if (narrativeText.includes(vague)) {
      totalChecks++;
      issues.push({
        type: 'VAGUE_QUANTIFIER',
        term: vague,
        severity: 'minor',
        impact: -0.01,
        suggestion: `Replace "${vague}" with specific number or range`
      });
    }
  }

  // Check functional scores specificity
  const scores = extractedData.functionalScores || {};

  // KPS should be specific number
  if (scores.kps !== null && scores.kps !== undefined) {
    totalChecks++;
    if (typeof scores.kps === 'number') {
      specificChecks++;
    } else {
      issues.push({
        type: 'GENERIC_VALUE',
        field: 'KPS',
        value: scores.kps,
        severity: 'minor',
        impact: -0.01,
        suggestion: 'Use specific KPS score (0-100)'
      });
    }
  }

  // GCS should be specific number
  if (scores.gcs !== null && scores.gcs !== undefined) {
    totalChecks++;
    if (typeof scores.gcs === 'number' && scores.gcs >= 3 && scores.gcs <= 15) {
      specificChecks++;
    } else {
      issues.push({
        type: 'GENERIC_VALUE',
        field: 'GCS',
        value: scores.gcs,
        severity: 'major',
        impact: -0.02,
        suggestion: 'Use specific GCS score (3-15)'
      });
    }
  }

  // Check lab values specificity
  const labs = Array.isArray(extractedData.labs) ? extractedData.labs : [];
  for (const lab of labs) {
    if (lab.value) {
      totalChecks++;
      // Check if value is specific number with units
      if (/\d+\.?\d*\s*\w+/.test(lab.value)) {
        specificChecks++;
      } else if (['normal', 'abnormal', 'elevated', 'low'].includes(lab.value.toLowerCase())) {
        issues.push({
          type: 'GENERIC_LAB_VALUE',
          lab: lab.name,
          value: lab.value,
          severity: 'minor',
          impact: -0.01,
          suggestion: 'Provide specific lab value with units'
        });
      } else {
        specificChecks++; // Other descriptive values may be acceptable
      }
    }
  }

  // Check for specific measurements in narrative
  const measurementPatterns = [
    /\d+\.?\d*\s*(cm|mm|ml|mg|mcg|units?|%)/gi,
    /\d+\.?\d*\s*x\s*\d+\.?\d*\s*x?\s*\d*\.?\d*/gi // dimensions
  ];

  for (const pattern of measurementPatterns) {
    const matches = narrativeText.match(pattern) || [];
    specificChecks += matches.length * 0.1; // Reward specific measurements
    totalChecks += matches.length * 0.1;
  }

  // Ensure we have at least one check
  if (totalChecks === 0) {
    totalChecks = 1;
    specificChecks = 1;
  }

  return { totalChecks, specificChecks, issues };
}

/**
 * Check temporal specificity (dates, times, durations)
 */
function checkTemporalSpecificity(narrative) {
  const issues = [];
  let totalChecks = 0;
  let specificChecks = 0;

  if (!narrative) {
    return { totalChecks: 1, specificChecks: 1, issues: [] };
  }

  const narrativeText = JSON.stringify(narrative).toLowerCase();

  // Check for vague temporal terms
  const vagueTemporalTerms = [
    'recently', 'lately', 'a while ago', 'some time',
    'earlier', 'later', 'soon', 'eventually'
  ];

  for (const vague of vagueTemporalTerms) {
    if (narrativeText.includes(vague)) {
      totalChecks++;
      issues.push({
        type: 'VAGUE_TEMPORAL',
        term: vague,
        severity: 'minor',
        impact: -0.01,
        suggestion: `Replace "${vague}" with specific date or timeframe`
      });
    }
  }

  // Check for specific dates (reward specific dates)
  const datePatterns = [
    /\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/g,  // MM/DD/YYYY or MM-DD-YYYY
    /(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/gi,
    /\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)/gi
  ];

  let dateCount = 0;
  for (const pattern of datePatterns) {
    const matches = narrativeText.match(pattern) || [];
    dateCount += matches.length;
  }

  if (dateCount > 0) {
    totalChecks += dateCount;
    specificChecks += dateCount; // Specific dates are good
  }

  // Check for specific time references
  const timePatterns = [
    /\d{1,2}:\d{2}\s*(?:am|pm)?/gi,  // Clock times
    /(?:post-?operative|pod|hospital)\s+day\s+\d+/gi,  // POD 3, hospital day 5
    /\d+\s+(?:hours?|days?|weeks?|months?)\s+(?:after|before|post|prior)/gi
  ];

  for (const pattern of timePatterns) {
    const matches = narrativeText.match(pattern) || [];
    if (matches.length > 0) {
      totalChecks += matches.length;
      specificChecks += matches.length;
    }
  }

  // Check for duration specificity
  const durationPattern = /(?:for|lasted?|duration)\s+(?:of\s+)?(\d+)\s+(?:hours?|days?|weeks?|months?)/gi;
  const durationMatches = narrativeText.match(durationPattern) || [];

  if (durationMatches.length > 0) {
    totalChecks += durationMatches.length;
    specificChecks += durationMatches.length;
  }

  // Check for vague duration terms
  const vagueDurations = ['brief', 'prolonged', 'extended', 'short', 'long'];
  for (const vague of vagueDurations) {
    if (narrativeText.includes(vague)) {
      totalChecks++;
      issues.push({
        type: 'VAGUE_DURATION',
        term: vague,
        severity: 'minor',
        impact: -0.005,
        suggestion: `Specify duration instead of "${vague}"`
      });
    }
  }

  // Ensure we have at least one check
  if (totalChecks === 0) {
    totalChecks = 1;
    specificChecks = 1;
  }

  return { totalChecks, specificChecks, issues };
}

/**
 * Check specificity of clinical details
 */
function checkClinicalDetailSpecificity(extractedData, narrative) {
  const issues = [];
  let totalChecks = 0;
  let specificChecks = 0;

  // Check tumor specificity
  if (extractedData.pathology?.tumorDetails) {
    totalChecks++;
    const tumor = extractedData.pathology.tumorDetails;

    if (tumor.size && /\d+\.?\d*\s*x\s*\d+/.test(tumor.size)) {
      specificChecks++;
    } else if (tumor.size) {
      issues.push({
        type: 'VAGUE_TUMOR_SIZE',
        value: tumor.size,
        severity: 'minor',
        impact: -0.01,
        suggestion: 'Provide specific tumor dimensions (e.g., 3.2 x 2.8 cm)'
      });
    }

    if (tumor.location) {
      totalChecks++;
      const anatomicalTerms = ['frontal', 'parietal', 'temporal', 'occipital',
                              'left', 'right', 'bilateral', 'midline'];
      const hasSpecificLocation = anatomicalTerms.some(term =>
        tumor.location.toLowerCase().includes(term)
      );

      if (hasSpecificLocation) {
        specificChecks++;
      } else {
        issues.push({
          type: 'VAGUE_LOCATION',
          location: tumor.location,
          severity: 'minor',
          impact: -0.01,
          suggestion: 'Specify anatomical location precisely'
        });
      }
    }
  }

  // Check imaging specificity
  const imaging = extractedData.imaging?.findings || [];
  for (const img of imaging) {
    if (img.findings) {
      totalChecks++;
      const findings = img.findings.toLowerCase();

      // Check for specific measurements
      if (/\d+\.?\d*\s*(cm|mm)/.test(findings)) {
        specificChecks++;
      } else if (['normal', 'abnormal', 'unchanged'].includes(findings)) {
        issues.push({
          type: 'GENERIC_IMAGING',
          modality: img.type,
          severity: 'minor',
          impact: -0.01,
          suggestion: 'Provide specific imaging findings'
        });
      } else {
        specificChecks += 0.5; // Partial credit for descriptive findings
      }
    }
  }

  // Check complication specificity
  const complications = extractedData.complications?.complications || [];
  for (const comp of complications) {
    if (comp.name || comp) {
      totalChecks++;
      const compName = (comp.name || comp).toString().toLowerCase();

      // Generic complication terms
      const genericTerms = ['infection', 'bleeding', 'swelling', 'pain'];
      const isGeneric = genericTerms.some(term => compName === term);

      if (!isGeneric) {
        specificChecks++;
      } else {
        issues.push({
          type: 'GENERIC_COMPLICATION',
          complication: compName,
          severity: 'minor',
          impact: -0.01,
          suggestion: `Specify type/location of ${compName}`
        });
      }
    }
  }

  // Ensure we have at least one check
  if (totalChecks === 0) {
    totalChecks = 1;
    specificChecks = 1;
  }

  return { totalChecks, specificChecks, issues };
}

/**
 * Check medication specificity
 */
function checkMedicationSpecificity(extractedData) {
  const issues = [];
  let totalChecks = 0;
  let specificChecks = 0;

  const medications = extractedData.medications?.medications || [];

  for (const med of medications) {
    // Check medication name specificity
    totalChecks++;
    const medName = (med.name || med).toString();

    // Generic drug classes vs specific drugs
    const genericClasses = ['antibiotic', 'painkiller', 'steroid',
                           'antiepileptic', 'blood thinner'];
    const isGenericClass = genericClasses.some(cls =>
      medName.toLowerCase() === cls
    );

    if (!isGenericClass) {
      specificChecks++;
    } else {
      issues.push({
        type: 'GENERIC_MEDICATION',
        medication: medName,
        severity: 'major',
        impact: -0.02,
        suggestion: `Specify exact medication instead of "${medName}"`
      });
    }

    // Check dose specificity
    if (med.dose || med.doseWithUnit) {
      totalChecks++;
      const dose = (med.dose || med.doseWithUnit).toString();

      if (/\d+\.?\d*\s*(mg|mcg|g|ml|units?)/i.test(dose)) {
        specificChecks++;
      } else if (['low dose', 'high dose', 'standard dose'].includes(dose.toLowerCase())) {
        issues.push({
          type: 'VAGUE_DOSE',
          medication: medName,
          dose: dose,
          severity: 'major',
          impact: -0.02,
          suggestion: 'Specify exact dose with units'
        });
      } else {
        specificChecks += 0.5;
      }
    }

    // Check route specificity
    if (med.route) {
      totalChecks++;
      const validRoutes = ['PO', 'IV', 'IM', 'SC', 'SQ', 'PR', 'SL', 'TD',
                          'oral', 'intravenous', 'intramuscular', 'subcutaneous',
                          'rectal', 'sublingual', 'transdermal'];

      if (validRoutes.some(route => med.route.toLowerCase().includes(route.toLowerCase()))) {
        specificChecks++;
      } else {
        issues.push({
          type: 'VAGUE_ROUTE',
          medication: medName,
          route: med.route,
          severity: 'minor',
          impact: -0.01
        });
      }
    }

    // Check frequency specificity
    if (med.frequency) {
      totalChecks++;
      const freq = med.frequency.toLowerCase();

      const specificFrequencies = ['daily', 'bid', 'tid', 'qid', 'q4h', 'q6h', 'q8h', 'q12h',
                                   'once daily', 'twice daily', 'three times daily',
                                   'every 4 hours', 'every 6 hours'];

      if (specificFrequencies.some(f => freq.includes(f))) {
        specificChecks++;
      } else if (freq === 'as needed' || freq === 'prn') {
        specificChecks += 0.5; // PRN is acceptable but less specific
      } else {
        issues.push({
          type: 'VAGUE_FREQUENCY',
          medication: medName,
          frequency: freq,
          severity: 'minor',
          impact: -0.01,
          suggestion: 'Specify exact frequency'
        });
      }
    }
  }

  // Ensure we have at least one check
  if (totalChecks === 0) {
    totalChecks = 1;
    specificChecks = 1;
  }

  return { totalChecks, specificChecks, issues };
}

/**
 * Check procedure specificity
 */
function checkProcedureSpecificity(extractedData) {
  const issues = [];
  let totalChecks = 0;
  let specificChecks = 0;

  const procedures = extractedData.procedures?.procedures || [];

  for (const proc of procedures) {
    const procName = (proc.procedure || proc.name || proc).toString();

    // Check procedure name specificity
    totalChecks++;
    const genericProcedures = ['surgery', 'operation', 'procedure', 'intervention'];
    const isGeneric = genericProcedures.some(g =>
      procName.toLowerCase() === g
    );

    if (!isGeneric) {
      // Check for anatomical specificity
      const hasAnatomical = ['frontal', 'parietal', 'temporal', 'occipital',
                            'cervical', 'thoracic', 'lumbar', 'left', 'right']
        .some(term => procName.toLowerCase().includes(term));

      if (hasAnatomical) {
        specificChecks++;
      } else {
        specificChecks += 0.7; // Partial credit for named procedure
        issues.push({
          type: 'PROCEDURE_LACKS_ANATOMY',
          procedure: procName,
          severity: 'minor',
          impact: -0.005,
          suggestion: 'Include anatomical location in procedure name'
        });
      }
    } else {
      issues.push({
        type: 'GENERIC_PROCEDURE',
        procedure: procName,
        severity: 'major',
        impact: -0.02,
        suggestion: 'Specify exact procedure performed'
      });
    }

    // Check for approach specificity if applicable
    if (procName.toLowerCase().includes('craniotomy') ||
        procName.toLowerCase().includes('approach')) {
      totalChecks++;
      const approaches = ['pterional', 'bifrontal', 'retrosigmoid', 'suboccipital',
                         'transcallosal', 'transsphenoidal', 'orbitozygomatic'];

      if (approaches.some(app => procName.toLowerCase().includes(app))) {
        specificChecks++;
      } else {
        issues.push({
          type: 'MISSING_APPROACH',
          procedure: procName,
          severity: 'minor',
          impact: -0.01,
          suggestion: 'Specify surgical approach used'
        });
      }
    }
  }

  // Ensure we have at least one check
  if (totalChecks === 0) {
    totalChecks = 1;
    specificChecks = 1;
  }

  return { totalChecks, specificChecks, issues };
}

export default {
  calculateSpecificityScore
};