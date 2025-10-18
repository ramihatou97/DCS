/**
 * Accuracy Scorer - 6-Dimension Quality Metrics
 *
 * Evaluates the accuracy of extracted and generated content by:
 * - Validating extracted data against source notes
 * - Checking for hallucinations
 * - Verifying medication dosages
 * - Confirming date accuracy
 * - Cross-referencing procedures
 *
 * Weight: 25% of overall quality score
 *
 * @module accuracyScorer
 */

/**
 * Calculate accuracy score for discharge summary
 *
 * @param {Object} extractedData - Extracted medical data
 * @param {string} sourceNotes - Original clinical notes
 * @param {Object} narrative - Generated narrative
 * @param {Object} options - Scoring options
 * @returns {Object} Accuracy score with details
 */
export function calculateAccuracyScore(extractedData, sourceNotes, narrative, options = {}) {
  const {
    strictValidation = true,
    checkHallucinations = true
  } = options;

  const issues = [];
  let totalChecks = 0;
  let accurateChecks = 0;

  // 1. Demographics accuracy (15% of accuracy)
  const demoAccuracy = checkDemographicsAccuracy(extractedData, sourceNotes);
  totalChecks += demoAccuracy.totalChecks * 0.15;
  accurateChecks += demoAccuracy.accurateChecks * 0.15;
  issues.push(...demoAccuracy.issues);

  // 2. Date accuracy (20% of accuracy)
  const dateAccuracy = checkDateAccuracy(extractedData, sourceNotes);
  totalChecks += dateAccuracy.totalChecks * 0.20;
  accurateChecks += dateAccuracy.accurateChecks * 0.20;
  issues.push(...dateAccuracy.issues);

  // 3. Medication accuracy (25% of accuracy) - Critical for safety
  const medAccuracy = checkMedicationAccuracy(extractedData, sourceNotes);
  totalChecks += medAccuracy.totalChecks * 0.25;
  accurateChecks += medAccuracy.accurateChecks * 0.25;
  issues.push(...medAccuracy.issues);

  // 4. Procedure accuracy (20% of accuracy)
  const procAccuracy = checkProcedureAccuracy(extractedData, sourceNotes);
  totalChecks += procAccuracy.totalChecks * 0.20;
  accurateChecks += procAccuracy.accurateChecks * 0.20;
  issues.push(...procAccuracy.issues);

  // 5. Hallucination detection (10% of accuracy)
  if (checkHallucinations) {
    const hallucinationCheck = detectHallucinations(narrative, sourceNotes);
    totalChecks += hallucinationCheck.totalChecks * 0.10;
    accurateChecks += hallucinationCheck.accurateChecks * 0.10;
    issues.push(...hallucinationCheck.issues);
  }

  // 6. Clinical value accuracy (10% of accuracy)
  const clinicalAccuracy = checkClinicalValueAccuracy(extractedData, sourceNotes);
  totalChecks += clinicalAccuracy.totalChecks * 0.10;
  accurateChecks += clinicalAccuracy.accurateChecks * 0.10;
  issues.push(...clinicalAccuracy.issues);

  const score = totalChecks > 0 ? accurateChecks / totalChecks : 0;

  // Apply strict validation penalty for critical errors
  let finalScore = score;
  if (strictValidation && issues.some(i => i.severity === 'critical')) {
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const penalty = Math.min(0.2, criticalCount * 0.05); // 5% per critical error, max 20%
    finalScore = Math.max(0, score - penalty);
  }

  return {
    score: finalScore,
    rawScore: score,
    weight: 0.25,
    weighted: finalScore * 0.25,
    issues,
    details: {
      demographics: demoAccuracy,
      dates: dateAccuracy,
      medications: medAccuracy,
      procedures: procAccuracy,
      hallucinations: checkHallucinations ? detectHallucinations(narrative, sourceNotes) : null,
      clinicalValues: clinicalAccuracy,
      penaltyApplied: finalScore < score
    }
  };
}

/**
 * Check demographics accuracy
 */
function checkDemographicsAccuracy(extractedData, sourceNotes) {
  const issues = [];
  let totalChecks = 0;
  let accurateChecks = 0;

  const demographics = extractedData.demographics || {};
  const sourceLower = sourceNotes.toLowerCase();

  // Check name
  if (demographics.name) {
    totalChecks++;
    if (sourceLower.includes(demographics.name.toLowerCase())) {
      accurateChecks++;
    } else {
      issues.push({
        type: 'DEMOGRAPHICS_MISMATCH',
        field: 'name',
        extracted: demographics.name,
        severity: 'major',
        impact: -0.02
      });
    }
  }

  // Check MRN (critical for patient safety)
  if (demographics.mrn) {
    totalChecks++;
    if (sourceNotes.includes(demographics.mrn)) {
      accurateChecks++;
    } else {
      issues.push({
        type: 'MRN_MISMATCH',
        field: 'mrn',
        extracted: demographics.mrn,
        severity: 'critical',
        impact: -0.05,
        suggestion: 'Verify MRN against source documentation'
      });
    }
  }

  // Check age
  if (demographics.age) {
    totalChecks++;
    const agePattern = new RegExp(`\\b${demographics.age}\\s*(?:year|yo|y\\.o\\.)`);
    if (agePattern.test(sourceNotes)) {
      accurateChecks++;
    } else {
      issues.push({
        type: 'AGE_MISMATCH',
        field: 'age',
        extracted: demographics.age,
        severity: 'minor',
        impact: -0.01
      });
    }
  }

  return { totalChecks, accurateChecks, issues };
}

/**
 * Check date accuracy
 */
function checkDateAccuracy(extractedData, sourceNotes) {
  const issues = [];
  let totalChecks = 0;
  let accurateChecks = 0;

  const dates = extractedData.dates || {};

  // Critical dates to check
  const datesToCheck = [
    { field: 'admissionDate', severity: 'major' },
    { field: 'dischargeDate', severity: 'critical' },
    { field: 'surgeryDate', severity: 'major' }
  ];

  for (const { field, severity } of datesToCheck) {
    if (dates[field]) {
      totalChecks++;

      // Convert date to multiple formats for checking
      const dateFormats = getDateFormats(dates[field]);
      const dateFound = dateFormats.some(format => sourceNotes.includes(format));

      if (dateFound) {
        accurateChecks++;
      } else {
        issues.push({
          type: 'DATE_NOT_FOUND',
          field,
          extracted: dates[field],
          severity,
          impact: severity === 'critical' ? -0.05 : -0.03,
          suggestion: `Verify ${field} in source notes`
        });
      }
    }
  }

  // Check date consistency
  if (dates.admissionDate && dates.dischargeDate) {
    const admission = new Date(dates.admissionDate);
    const discharge = new Date(dates.dischargeDate);

    if (discharge < admission) {
      totalChecks++;
      issues.push({
        type: 'DATE_INCONSISTENCY',
        field: 'discharge before admission',
        severity: 'critical',
        impact: -0.10,
        suggestion: 'Discharge date cannot be before admission date'
      });
    } else {
      totalChecks++;
      accurateChecks++;
    }
  }

  return { totalChecks, accurateChecks, issues };
}

/**
 * Check medication accuracy (critical for patient safety)
 */
function checkMedicationAccuracy(extractedData, sourceNotes) {
  const issues = [];
  let totalChecks = 0;
  let accurateChecks = 0;

  const medications = extractedData.medications?.medications || [];
  const sourceLower = sourceNotes.toLowerCase();

  for (const med of medications) {
    const medName = (med.name || med).toString().toLowerCase();

    // Check medication name
    totalChecks++;
    if (sourceLower.includes(medName)) {
      accurateChecks++;
    } else {
      // Check for common abbreviations
      const abbreviations = getMedicationAbbreviations(medName);
      if (abbreviations.some(abbr => sourceLower.includes(abbr))) {
        accurateChecks++;
      } else {
        issues.push({
          type: 'MEDICATION_NOT_FOUND',
          medication: medName,
          severity: 'critical',
          impact: -0.05,
          suggestion: `Verify medication "${medName}" in source notes`
        });
      }
    }

    // Check dose if available
    if (med.dose || med.doseWithUnit) {
      totalChecks++;
      const dose = (med.dose || med.doseWithUnit).toString();

      if (sourceNotes.includes(dose)) {
        accurateChecks++;
      } else {
        issues.push({
          type: 'DOSE_MISMATCH',
          medication: medName,
          dose: dose,
          severity: 'critical',
          impact: -0.05,
          suggestion: `Verify dose for ${medName}`
        });
      }
    }

    // Check frequency if available
    if (med.frequency) {
      totalChecks++;
      const freq = med.frequency.toLowerCase();

      if (sourceLower.includes(freq)) {
        accurateChecks++;
      } else {
        // Check common frequency variations
        const freqVariations = getFrequencyVariations(freq);
        if (freqVariations.some(v => sourceLower.includes(v))) {
          accurateChecks++;
        } else {
          issues.push({
            type: 'FREQUENCY_MISMATCH',
            medication: medName,
            frequency: freq,
            severity: 'major',
            impact: -0.02
          });
        }
      }
    }
  }

  return { totalChecks, accurateChecks, issues };
}

/**
 * Check procedure accuracy
 */
function checkProcedureAccuracy(extractedData, sourceNotes) {
  const issues = [];
  let totalChecks = 0;
  let accurateChecks = 0;

  const procedures = extractedData.procedures?.procedures || [];
  const sourceLower = sourceNotes.toLowerCase();

  for (const proc of procedures) {
    const procName = (proc.procedure || proc.name || proc).toString().toLowerCase();

    totalChecks++;
    if (sourceLower.includes(procName)) {
      accurateChecks++;
    } else {
      // Check for procedure abbreviations
      const abbreviations = getProcedureAbbreviations(procName);
      if (abbreviations.some(abbr => sourceLower.includes(abbr))) {
        accurateChecks++;
      } else {
        issues.push({
          type: 'PROCEDURE_NOT_FOUND',
          procedure: procName,
          severity: 'major',
          impact: -0.03,
          suggestion: `Verify procedure "${procName}" in source notes`
        });
      }
    }

    // Check procedure date if available
    if (proc.date) {
      totalChecks++;
      const dateFormats = getDateFormats(proc.date);
      if (dateFormats.some(format => sourceNotes.includes(format))) {
        accurateChecks++;
      } else {
        issues.push({
          type: 'PROCEDURE_DATE_MISMATCH',
          procedure: procName,
          date: proc.date,
          severity: 'major',
          impact: -0.02
        });
      }
    }
  }

  return { totalChecks, accurateChecks, issues };
}

/**
 * Detect potential hallucinations in narrative
 */
function detectHallucinations(narrative, sourceNotes) {
  const issues = [];
  let totalChecks = 0;
  let accurateChecks = 0;

  if (!narrative || typeof narrative !== 'object') {
    return { totalChecks: 1, accurateChecks: 1, issues: [] };
  }

  const sourceLower = sourceNotes.toLowerCase();
  const narrativeText = JSON.stringify(narrative).toLowerCase();

  // Check for names not in source
  const namePattern = /dr\.\s+([a-z]+)/gi;
  const narrativeNames = [...narrativeText.matchAll(namePattern)].map(m => m[1]);

  for (const name of narrativeNames) {
    totalChecks++;
    if (sourceLower.includes(name)) {
      accurateChecks++;
    } else {
      issues.push({
        type: 'POSSIBLE_HALLUCINATION',
        content: `Dr. ${name}`,
        severity: 'warning',
        impact: -0.02,
        suggestion: 'Verify this physician name in source notes'
      });
    }
  }

  // Check for medications in narrative not in source
  const commonMeds = ['aspirin', 'tylenol', 'ibuprofen', 'morphine', 'fentanyl'];
  for (const med of commonMeds) {
    if (narrativeText.includes(med) && !sourceLower.includes(med)) {
      totalChecks++;
      issues.push({
        type: 'POSSIBLE_HALLUCINATION',
        content: med,
        severity: 'critical',
        impact: -0.05,
        suggestion: `Medication "${med}" in narrative but not in source`
      });
    }
  }

  // If no hallucinations found, give full credit
  if (totalChecks === 0) {
    totalChecks = 1;
    accurateChecks = 1;
  }

  return { totalChecks, accurateChecks, issues };
}

/**
 * Check clinical value accuracy (labs, vitals, scores)
 */
function checkClinicalValueAccuracy(extractedData, sourceNotes) {
  const issues = [];
  let totalChecks = 0;
  let accurateChecks = 0;

  // Check functional scores
  const scores = extractedData.functionalScores || {};

  if (scores.kps !== null && scores.kps !== undefined) {
    totalChecks++;
    if (sourceNotes.includes(scores.kps.toString())) {
      accurateChecks++;
    } else {
      issues.push({
        type: 'SCORE_MISMATCH',
        field: 'KPS',
        value: scores.kps,
        severity: 'minor',
        impact: -0.01
      });
    }
  }

  if (scores.gcs !== null && scores.gcs !== undefined) {
    totalChecks++;
    if (sourceNotes.includes(`GCS ${scores.gcs}`) || sourceNotes.includes(`GCS: ${scores.gcs}`)) {
      accurateChecks++;
    } else {
      issues.push({
        type: 'SCORE_MISMATCH',
        field: 'GCS',
        value: scores.gcs,
        severity: 'major',
        impact: -0.02
      });
    }
  }

  // If no clinical values to check, give full credit
  if (totalChecks === 0) {
    totalChecks = 1;
    accurateChecks = 1;
  }

  return { totalChecks, accurateChecks, issues };
}

// Helper functions

function getDateFormats(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date)) return [dateStr];

  const formats = [];

  // MM/DD/YYYY
  formats.push(`${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`);

  // M/D/YYYY
  formats.push(`${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`);

  // YYYY-MM-DD
  formats.push(`${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`);

  // Month DD, YYYY
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  formats.push(`${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`);

  return formats;
}

function getMedicationAbbreviations(medName) {
  const abbreviations = {
    'acetaminophen': ['tylenol', 'apap'],
    'aspirin': ['asa'],
    'levetiracetam': ['keppra'],
    'phenytoin': ['dilantin'],
    'dexamethasone': ['decadron', 'dex'],
    'hydrocodone': ['norco', 'vicodin'],
    'oxycodone': ['percocet', 'roxicodone'],
    'metoprolol': ['lopressor'],
    'lisinopril': ['prinivil', 'zestril']
  };

  return abbreviations[medName] || [];
}

function getFrequencyVariations(frequency) {
  const variations = {
    'daily': ['once daily', 'qd', 'q24h', 'every day'],
    'bid': ['twice daily', 'b.i.d.', '2x/day', 'q12h'],
    'tid': ['three times daily', 't.i.d.', '3x/day', 'q8h'],
    'qid': ['four times daily', 'q.i.d.', '4x/day', 'q6h'],
    'prn': ['as needed', 'p.r.n.', 'when needed']
  };

  for (const [key, vals] of Object.entries(variations)) {
    if (key === frequency || vals.includes(frequency)) {
      return [key, ...vals];
    }
  }

  return [];
}

function getProcedureAbbreviations(procedure) {
  const abbreviations = {
    'craniotomy': ['crani'],
    'external ventricular drain': ['evd', 'ventriculostomy'],
    'ventriculoperitoneal shunt': ['vp shunt', 'vps'],
    'anterior cervical discectomy and fusion': ['acdf'],
    'posterior lumbar interbody fusion': ['plif'],
    'transforaminal lumbar interbody fusion': ['tlif']
  };

  return abbreviations[procedure] || [];
}

export default {
  calculateAccuracyScore
};