/**
 * Consistency Scorer - 6-Dimension Quality Metrics
 *
 * Evaluates internal consistency of the discharge summary by checking:
 * - Date alignment (admission < procedures < discharge)
 * - Medication cross-references (hospital course vs discharge meds)
 * - Diagnosis consistency across sections
 * - Treatment-outcome alignment
 * - No contradictions in clinical narrative
 *
 * Weight: 20% of overall quality score
 *
 * @module consistencyScorer
 */

/**
 * Calculate consistency score for discharge summary
 *
 * @param {Object} extractedData - Extracted medical data
 * @param {Object} narrative - Generated narrative
 * @param {Object} options - Scoring options
 * @returns {Object} Consistency score with details
 */
export function calculateConsistencyScore(extractedData, narrative, options = {}) {
  const {
    strictDateValidation = true,
    checkCrossReferences = true
  } = options;

  const issues = [];
  let totalChecks = 0;
  let consistentChecks = 0;

  // 1. Date consistency (30% of consistency)
  const dateConsistency = checkDateConsistency(extractedData);
  totalChecks += dateConsistency.totalChecks * 0.30;
  consistentChecks += dateConsistency.consistentChecks * 0.30;
  issues.push(...dateConsistency.issues);

  // 2. Medication consistency (25% of consistency)
  const medConsistency = checkMedicationConsistency(extractedData, narrative);
  totalChecks += medConsistency.totalChecks * 0.25;
  consistentChecks += medConsistency.consistentChecks * 0.25;
  issues.push(...medConsistency.issues);

  // 3. Diagnosis consistency (20% of consistency)
  const diagConsistency = checkDiagnosisConsistency(extractedData, narrative);
  totalChecks += diagConsistency.totalChecks * 0.20;
  consistentChecks += diagConsistency.consistentChecks * 0.20;
  issues.push(...diagConsistency.issues);

  // 4. Treatment-outcome alignment (15% of consistency)
  const treatmentAlignment = checkTreatmentOutcomeAlignment(extractedData);
  totalChecks += treatmentAlignment.totalChecks * 0.15;
  consistentChecks += treatmentAlignment.consistentChecks * 0.15;
  issues.push(...treatmentAlignment.issues);

  // 5. Narrative contradictions (10% of consistency)
  const contradictions = checkForContradictions(narrative, extractedData);
  totalChecks += contradictions.totalChecks * 0.10;
  consistentChecks += contradictions.consistentChecks * 0.10;
  issues.push(...contradictions.issues);

  const score = totalChecks > 0 ? consistentChecks / totalChecks : 0;

  // Apply strict validation penalty
  let finalScore = score;
  if (strictDateValidation && issues.some(i => i.type === 'DATE_INCONSISTENCY')) {
    finalScore = Math.max(0, score - 0.1); // 10% penalty for date inconsistencies
  }

  return {
    score: finalScore,
    rawScore: score,
    weight: 0.20,
    weighted: finalScore * 0.20,
    issues,
    details: {
      dateConsistency,
      medicationConsistency: medConsistency,
      diagnosisConsistency: diagConsistency,
      treatmentAlignment,
      contradictions,
      penaltyApplied: finalScore < score
    }
  };
}

/**
 * Check date consistency across the summary
 */
function checkDateConsistency(extractedData) {
  const issues = [];
  let totalChecks = 0;
  let consistentChecks = 0;

  const dates = extractedData.dates || {};

  // Parse dates for comparison
  const admission = dates.admissionDate ? new Date(dates.admissionDate) : null;
  const discharge = dates.dischargeDate ? new Date(dates.dischargeDate) : null;
  const surgery = dates.surgeryDate ? new Date(dates.surgeryDate) : null;

  // Check admission < discharge
  if (admission && discharge) {
    totalChecks++;
    if (admission <= discharge) {
      consistentChecks++;
    } else {
      issues.push({
        type: 'DATE_INCONSISTENCY',
        field: 'admission_discharge',
        message: 'Discharge date before admission date',
        severity: 'critical',
        impact: -0.05
      });
    }

    // Check reasonable length of stay (< 365 days)
    const stayDays = (discharge - admission) / (1000 * 60 * 60 * 24);
    totalChecks++;
    if (stayDays <= 365) {
      consistentChecks++;
    } else {
      issues.push({
        type: 'EXCESSIVE_LOS',
        field: 'length_of_stay',
        value: Math.round(stayDays),
        severity: 'major',
        impact: -0.03,
        suggestion: 'Verify dates - length of stay exceeds 1 year'
      });
    }
  }

  // Check surgery date within admission period
  if (surgery && admission && discharge) {
    totalChecks++;
    if (surgery >= admission && surgery <= discharge) {
      consistentChecks++;
    } else {
      issues.push({
        type: 'DATE_INCONSISTENCY',
        field: 'surgery_date',
        message: 'Surgery date outside admission period',
        severity: 'critical',
        impact: -0.05
      });
    }
  }

  // Check procedure dates consistency
  const procedures = extractedData.procedures?.procedures || [];
  for (const proc of procedures) {
    if (proc.date) {
      totalChecks++;
      const procDate = new Date(proc.date);

      if (admission && discharge && procDate >= admission && procDate <= discharge) {
        consistentChecks++;
      } else {
        issues.push({
          type: 'PROCEDURE_DATE_INCONSISTENCY',
          procedure: proc.name || proc.procedure,
          date: proc.date,
          severity: 'major',
          impact: -0.02
        });
      }
    }
  }

  // Check imaging dates consistency
  const imaging = extractedData.imaging?.findings || [];
  for (const img of imaging) {
    if (img.date) {
      totalChecks++;
      const imgDate = new Date(img.date);

      // Imaging can be before admission (pre-op) or during stay
      if (discharge && imgDate <= discharge) {
        consistentChecks++;
      } else {
        issues.push({
          type: 'IMAGING_DATE_INCONSISTENCY',
          imaging: img.type,
          date: img.date,
          severity: 'minor',
          impact: -0.01
        });
      }
    }
  }

  return { totalChecks, consistentChecks, issues };
}

/**
 * Check medication consistency between sections
 */
function checkMedicationConsistency(extractedData, narrative) {
  const issues = [];
  let totalChecks = 0;
  let consistentChecks = 0;

  const dischargeMeds = extractedData.medications?.discharge || [];
  const allMeds = extractedData.medications?.medications || [];

  // Check if discharge meds are subset of all meds
  for (const disMed of dischargeMeds) {
    totalChecks++;
    const medName = (disMed.name || disMed).toString().toLowerCase();

    const foundInAll = allMeds.some(med =>
      (med.name || med).toString().toLowerCase().includes(medName) ||
      medName.includes((med.name || med).toString().toLowerCase())
    );

    if (foundInAll) {
      consistentChecks++;
    } else {
      issues.push({
        type: 'MEDICATION_INCONSISTENCY',
        medication: medName,
        message: 'Discharge medication not mentioned in hospital course',
        severity: 'minor',
        impact: -0.01
      });
    }
  }

  // Check for discontinued medications not in discharge list
  if (narrative?.hospitalCourse) {
    const courseText = narrative.hospitalCourse.toLowerCase();
    const discontinuedPattern = /discontinued?\s+(\w+)/gi;
    const matches = [...courseText.matchAll(discontinuedPattern)];

    for (const match of matches) {
      totalChecks++;
      const discontinuedMed = match[1];

      const notInDischarge = !dischargeMeds.some(med =>
        (med.name || med).toString().toLowerCase().includes(discontinuedMed)
      );

      if (notInDischarge) {
        consistentChecks++;
      } else {
        issues.push({
          type: 'DISCONTINUED_MED_IN_DISCHARGE',
          medication: discontinuedMed,
          severity: 'major',
          impact: -0.03,
          suggestion: 'Discontinued medication should not be in discharge list'
        });
      }
    }
  }

  // Check dose consistency for same medications
  const medDoses = {};
  for (const med of allMeds) {
    const name = (med.name || med).toString().toLowerCase();
    const dose = med.dose || med.doseWithUnit;

    if (dose) {
      if (!medDoses[name]) {
        medDoses[name] = [];
      }
      medDoses[name].push(dose.toString());
    }
  }

  for (const [name, doses] of Object.entries(medDoses)) {
    if (doses.length > 1) {
      totalChecks++;
      const uniqueDoses = [...new Set(doses)];

      if (uniqueDoses.length === 1) {
        consistentChecks++;
      } else {
        // Check if dose change is documented
        const doseChangeDocumented = narrative?.hospitalCourse?.toLowerCase().includes('dose') &&
                                    narrative?.hospitalCourse?.toLowerCase().includes(name);

        if (doseChangeDocumented) {
          consistentChecks++;
        } else {
          issues.push({
            type: 'DOSE_INCONSISTENCY',
            medication: name,
            doses: uniqueDoses,
            severity: 'major',
            impact: -0.02,
            suggestion: 'Multiple doses found without documented change'
          });
        }
      }
    }
  }

  return { totalChecks, consistentChecks, issues };
}

/**
 * Check diagnosis consistency across sections
 */
function checkDiagnosisConsistency(extractedData, narrative) {
  const issues = [];
  let totalChecks = 0;
  let consistentChecks = 0;

  const primaryDiagnosis = extractedData.pathology?.primaryDiagnosis ||
                          extractedData.pathology?.primary;
  const admissionDiagnosis = extractedData.pathology?.admissionDiagnosis;
  const dischargeDiagnosis = extractedData.pathology?.dischargeDiagnosis;

  // Check if primary diagnosis is consistent
  if (primaryDiagnosis) {
    const primaryLower = primaryDiagnosis.toLowerCase();

    // Check in narrative sections
    const narrativeSections = [
      narrative?.clinicalPresentation,
      narrative?.hospitalCourse,
      narrative?.discharge
    ].filter(Boolean);

    for (const section of narrativeSections) {
      totalChecks++;
      const sectionText = typeof section === 'string' ? section : JSON.stringify(section);

      if (sectionText.toLowerCase().includes(primaryLower) ||
          diagnosisMatch(primaryLower, sectionText.toLowerCase())) {
        consistentChecks++;
      } else {
        issues.push({
          type: 'DIAGNOSIS_NOT_MENTIONED',
          diagnosis: primaryDiagnosis,
          section: 'narrative',
          severity: 'minor',
          impact: -0.01
        });
      }
    }
  }

  // Check admission vs discharge diagnosis evolution
  if (admissionDiagnosis && dischargeDiagnosis) {
    totalChecks++;

    // They should be related but may evolve (e.g., "brain mass" -> "glioblastoma")
    if (diagnosisEvolutionValid(admissionDiagnosis, dischargeDiagnosis)) {
      consistentChecks++;
    } else {
      issues.push({
        type: 'DIAGNOSIS_EVOLUTION_INCONSISTENT',
        admission: admissionDiagnosis,
        discharge: dischargeDiagnosis,
        severity: 'major',
        impact: -0.03,
        suggestion: 'Document diagnosis evolution in hospital course'
      });
    }
  }

  // Check pathology consistency with procedures
  const procedures = extractedData.procedures?.procedures || [];
  if (primaryDiagnosis && procedures.length > 0) {
    totalChecks++;

    const appropriateProcedure = checkProcedureDiagnosisAlignment(
      primaryDiagnosis,
      procedures
    );

    if (appropriateProcedure) {
      consistentChecks++;
    } else {
      issues.push({
        type: 'PROCEDURE_DIAGNOSIS_MISMATCH',
        diagnosis: primaryDiagnosis,
        severity: 'minor',
        impact: -0.02,
        suggestion: 'Verify procedures align with diagnosis'
      });
    }
  }

  return { totalChecks, consistentChecks, issues };
}

/**
 * Check treatment-outcome alignment
 */
function checkTreatmentOutcomeAlignment(extractedData) {
  const issues = [];
  let totalChecks = 0;
  let consistentChecks = 0;

  const functionalScores = extractedData.functionalScores || {};
  const complications = extractedData.complications?.complications || [];
  const disposition = extractedData.disposition;

  // Check if functional improvement aligns with disposition
  if (functionalScores.admissionGCS && functionalScores.dischargeGCS) {
    totalChecks++;
    const gcsImproved = functionalScores.dischargeGCS > functionalScores.admissionGCS;
    const gcsStable = functionalScores.dischargeGCS === functionalScores.admissionGCS;

    if (disposition?.toLowerCase().includes('home')) {
      // Discharge home should have stable or improved GCS
      if (gcsImproved || gcsStable) {
        consistentChecks++;
      } else {
        issues.push({
          type: 'DISPOSITION_FUNCTION_MISMATCH',
          message: 'GCS worsened but discharged home',
          severity: 'major',
          impact: -0.03
        });
      }
    } else {
      consistentChecks++;
    }
  }

  // Check complications vs outcome
  if (complications.length > 0) {
    totalChecks++;
    const severeCombications = complications.filter(c =>
      c.severity === 'high' || c.severity === 'critical'
    );

    if (severeCombications.length > 0) {
      // Severe complications should affect disposition/LOS
      const extendedLOS = extractedData.dates?.lengthOfStay > 14;
      const institutionalDischarge = disposition &&
        (disposition.toLowerCase().includes('facility') ||
         disposition.toLowerCase().includes('rehab') ||
         disposition.toLowerCase().includes('snf'));

      if (extendedLOS || institutionalDischarge) {
        consistentChecks++;
      } else {
        issues.push({
          type: 'COMPLICATION_OUTCOME_MISMATCH',
          message: 'Severe complications without extended stay or facility discharge',
          severity: 'minor',
          impact: -0.02
        });
      }
    } else {
      consistentChecks++;
    }
  }

  // Check surgical success vs complications
  const procedures = extractedData.procedures?.procedures || [];
  const surgicalProcedures = procedures.filter(p =>
    p.type === 'surgical' ||
    (p.name || p.procedure || '').toLowerCase().includes('surgery') ||
    (p.name || p.procedure || '').toLowerCase().includes('craniotomy')
  );

  if (surgicalProcedures.length > 0) {
    totalChecks++;
    const resectionExtent = extractedData.pathology?.resectionExtent;

    if (resectionExtent) {
      const successfulResection = resectionExtent.toLowerCase().includes('gross total') ||
                                 resectionExtent.toLowerCase().includes('complete');

      const hasPostOpComplications = complications.some(c =>
        c.name?.toLowerCase().includes('post') ||
        c.name?.toLowerCase().includes('hemorrhage') ||
        c.name?.toLowerCase().includes('infection')
      );

      if (successfulResection && !hasPostOpComplications) {
        consistentChecks++;
      } else if (!successfulResection && hasPostOpComplications) {
        consistentChecks++;
      } else {
        issues.push({
          type: 'SURGICAL_OUTCOME_INCONSISTENCY',
          resection: resectionExtent,
          complications: hasPostOpComplications,
          severity: 'minor',
          impact: -0.01
        });
      }
    } else {
      consistentChecks++;
    }
  }

  return { totalChecks, consistentChecks, issues };
}

/**
 * Check for contradictions in narrative
 */
function checkForContradictions(narrative, extractedData) {
  const issues = [];
  let totalChecks = 0;
  let consistentChecks = 0;

  if (!narrative || typeof narrative !== 'object') {
    return { totalChecks: 1, consistentChecks: 1, issues: [] };
  }

  const narrativeText = JSON.stringify(narrative).toLowerCase();

  // Check for contradictory terms
  const contradictionPatterns = [
    {
      pattern: /improved.*worsened|worsened.*improved/gi,
      type: 'CONTRADICTORY_IMPROVEMENT'
    },
    {
      pattern: /stable.*deteriorated|deteriorated.*stable/gi,
      type: 'CONTRADICTORY_STABILITY'
    },
    {
      pattern: /no complications.*complications? (noted|occurred)/gi,
      type: 'CONTRADICTORY_COMPLICATIONS'
    },
    {
      pattern: /uneventful.*complicated|complicated.*uneventful/gi,
      type: 'CONTRADICTORY_COURSE'
    }
  ];

  for (const { pattern, type } of contradictionPatterns) {
    totalChecks++;
    const matches = narrativeText.match(pattern);

    if (!matches) {
      consistentChecks++;
    } else {
      issues.push({
        type,
        text: matches[0],
        severity: 'major',
        impact: -0.03,
        suggestion: 'Remove contradictory statements'
      });
    }
  }

  // Check specific value contradictions
  if (extractedData.functionalScores?.kps !== null &&
      extractedData.functionalScores?.kps !== undefined) {
    totalChecks++;
    const kps = extractedData.functionalScores.kps;

    // KPS ≥ 70 is independent, < 70 needs assistance
    const independent = kps >= 70;
    const mentionsIndependent = narrativeText.includes('independent');
    const mentionsAssistance = narrativeText.includes('assistance') ||
                              narrativeText.includes('dependent');

    if ((independent && mentionsIndependent && !mentionsAssistance) ||
        (!independent && mentionsAssistance && !mentionsIndependent)) {
      consistentChecks++;
    } else if ((independent && mentionsAssistance) ||
               (!independent && mentionsIndependent)) {
      issues.push({
        type: 'FUNCTIONAL_STATUS_CONTRADICTION',
        kps,
        narrative: independent ? 'mentions assistance' : 'mentions independent',
        severity: 'major',
        impact: -0.02
      });
    } else {
      consistentChecks++;
    }
  }

  // If no checks performed, give full credit
  if (totalChecks === 0) {
    totalChecks = 1;
    consistentChecks = 1;
  }

  return { totalChecks, consistentChecks, issues };
}

// Helper functions

function diagnosisMatch(diag1, diag2) {
  // Common diagnosis variations
  const synonyms = {
    'glioblastoma': ['gbm', 'glioblastoma multiforme', 'grade iv glioma'],
    'meningioma': ['meningeal tumor', 'dural tumor'],
    'sah': ['subarachnoid hemorrhage', 'aneurysmal bleed'],
    'sdh': ['subdural hematoma', 'subdural hemorrhage'],
    'hydrocephalus': ['ventriculomegaly', 'enlarged ventricles']
  };

  for (const [key, values] of Object.entries(synonyms)) {
    const allTerms = [key, ...values];
    if (allTerms.some(term => diag1.includes(term)) &&
        allTerms.some(term => diag2.includes(term))) {
      return true;
    }
  }

  return false;
}

function diagnosisEvolutionValid(admission, discharge) {
  const validEvolutions = {
    'brain mass': ['glioblastoma', 'meningioma', 'metastasis', 'abscess'],
    'brain tumor': ['glioblastoma', 'meningioma', 'astrocytoma', 'oligodendroglioma'],
    'hemorrhage': ['sah', 'ich', 'sdh', 'edh'],
    'stroke': ['ischemic stroke', 'hemorrhagic stroke', 'mca infarct'],
    'mass effect': ['brain tumor', 'hemorrhage', 'abscess']
  };

  const admissionLower = admission.toLowerCase();
  const dischargeLower = discharge.toLowerCase();

  // Same diagnosis is always valid
  if (admissionLower === dischargeLower) return true;

  // Check valid evolutions
  for (const [initial, finals] of Object.entries(validEvolutions)) {
    if (admissionLower.includes(initial)) {
      return finals.some(final => dischargeLower.includes(final));
    }
  }

  // Check if discharge is more specific version of admission
  return dischargeLower.includes(admissionLower);
}

function checkProcedureDiagnosisAlignment(diagnosis, procedures) {
  const alignments = {
    'tumor': ['craniotomy', 'resection', 'biopsy', 'debulking'],
    'aneurysm': ['clipping', 'coiling', 'embolization', 'flow diversion'],
    'hydrocephalus': ['shunt', 'evd', 'ventriculostomy', 'etv'],
    'spine': ['fusion', 'laminectomy', 'discectomy', 'decompression'],
    'hemorrhage': ['craniotomy', 'evacuation', 'evd', 'decompression']
  };

  const diagLower = diagnosis.toLowerCase();
  const procNames = procedures.map(p =>
    (p.name || p.procedure || '').toLowerCase()
  );

  for (const [diag, validProcs] of Object.entries(alignments)) {
    if (diagLower.includes(diag)) {
      return validProcs.some(validProc =>
        procNames.some(procName => procName.includes(validProc))
      );
    }
  }

  return true; // Default to true if no specific alignment expected
}

export default {
  calculateConsistencyScore
};