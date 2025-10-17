/**
 * Treatment Response Tracker
 *
 * Phase 2 Component 2: Tracks treatment efficacy and patient responses
 *
 * Purpose:
 * - Pairs treatments/interventions with subsequent outcomes
 * - Classifies response types (improved, stable, worsened, etc.)
 * - Calculates time-to-response
 * - Scores treatment effectiveness
 * - Tracks protocol compliance
 *
 * @module treatmentResponse
 */

/**
 * Response classification types
 */
export const RESPONSE_TYPES = {
  IMPROVED: 'IMPROVED',        // Patient condition better after intervention
  STABLE: 'STABLE',            // Condition maintained, no deterioration
  WORSENED: 'WORSENED',        // Condition declined despite intervention
  NO_CHANGE: 'NO_CHANGE',      // No measurable effect
  PARTIAL: 'PARTIAL'           // Some improvement but not complete resolution
};

/**
 * Track treatment responses from extracted data and timeline
 *
 * @param {Object} extractedData - Complete extracted medical data
 * @param {Object} timeline - Causal timeline (optional, from Component 1)
 * @returns {Array} Treatment-outcome pairs with response analysis
 */
export function trackTreatmentResponses(extractedData, timeline = null) {
  try {
    console.log('[Phase 2] Tracking treatment responses...');

    const responses = [];

    // Use timeline events if available, otherwise build from extracted data
    const events = timeline?.events || [];

    // Track medication responses
    responses.push(...trackMedicationResponses(extractedData, events));

    // Track procedure outcomes
    responses.push(...trackProcedureOutcomes(extractedData, events));

    // Track intervention responses
    responses.push(...trackInterventionResponses(extractedData, events));

    // Calculate effectiveness scores for each response
    responses.forEach(response => {
      response.effectiveness = calculateEffectiveness(response);
    });

    // Check protocol compliance
    const protocolCompliance = checkProtocolCompliance(extractedData, responses);

    console.log(`[Phase 2] Found ${responses.length} treatment-outcome pairs`);

    return {
      responses,
      protocolCompliance,
      summary: generateResponseSummary(responses)
    };

  } catch (error) {
    console.error('[Phase 2] Error tracking treatment responses:', error);
    return {
      responses: [],
      protocolCompliance: null,
      summary: { error: error.message }
    };
  }
}

/**
 * Track medication responses
 *
 * @param {Object} extractedData - Extracted data
 * @param {Array} events - Timeline events
 * @returns {Array} Medication-outcome pairs
 */
function trackMedicationResponses(extractedData, events) {
  const responses = [];

  // Get medications from either structure: medications.current OR medications.medications
  const medicationsList = extractedData.medications?.current ||
                         extractedData.medications?.medications ||
                         [];

  if (!medicationsList || medicationsList.length === 0) return responses;

  medicationsList.forEach(medication => {
    const medName = medication.name || medication;

    // Special case: Nimodipine for SAH vasospasm prophylaxis
    if (medName.toLowerCase().includes('nimodipine')) {
      const vasospasmDetected = checkForComplication(extractedData, 'vasospasm');

      responses.push({
        intervention: {
          type: 'medication',
          name: medName,
          dose: medication.dose,
          frequency: medication.frequency,
          startDate: medication.startDate
        },
        outcome: {
          type: vasospasmDetected ? 'complication_occurred' : 'complication_prevented',
          description: vasospasmDetected ? 'Vasospasm occurred' : 'No vasospasm detected',
          complication: 'vasospasm'
        },
        response: vasospasmDetected ? RESPONSE_TYPES.WORSENED : RESPONSE_TYPES.IMPROVED,
        timeToResponse: '14-21 days (prophylaxis window)',
        confidence: 0.85,
        notes: vasospasmDetected ?
          'Vasospasm occurred despite nimodipine prophylaxis' :
          'Nimodipine prophylaxis effective - no vasospasm'
      });
    }

    // Check for seizure prophylaxis (levetiracetam, phenytoin)
    if (medName.toLowerCase().includes('levetiracetam') ||
        medName.toLowerCase().includes('keppra') ||
        medName.toLowerCase().includes('phenytoin')) {

      const seizureDetected = checkForComplication(extractedData, 'seizure');

      responses.push({
        intervention: {
          type: 'medication',
          name: medName,
          purpose: 'seizure prophylaxis',
          startDate: medication.startDate
        },
        outcome: {
          type: seizureDetected ? 'complication_occurred' : 'complication_prevented',
          description: seizureDetected ? 'Seizure occurred' : 'No seizures during admission',
          complication: 'seizure'
        },
        response: seizureDetected ? RESPONSE_TYPES.PARTIAL : RESPONSE_TYPES.IMPROVED,
        timeToResponse: 'Throughout admission',
        confidence: 0.8
      });
    }

    // Check for anticoagulation management
    if (medName.toLowerCase().includes('aspirin') ||
        medName.toLowerCase().includes('asa') ||
        medName.toLowerCase().includes('warfarin') ||
        medName.toLowerCase().includes('heparin')) {

      const hemorrhageDetected = checkForComplication(extractedData, 'hemorrhage') ||
                                  checkForComplication(extractedData, 'bleed');

      responses.push({
        intervention: {
          type: 'medication',
          name: medName,
          purpose: 'anticoagulation',
          startDate: medication.startDate
        },
        outcome: {
          type: hemorrhageDetected ? 'complication_occurred' : 'no_complication',
          description: hemorrhageDetected ? 'Hemorrhage occurred' : 'No hemorrhagic complications',
          complication: 'hemorrhage'
        },
        response: hemorrhageDetected ? RESPONSE_TYPES.WORSENED : RESPONSE_TYPES.STABLE,
        timeToResponse: 'Ongoing monitoring',
        confidence: 0.7
      });
    }
  });

  return responses;
}

/**
 * Track procedure outcomes
 *
 * @param {Object} extractedData - Extracted data
 * @param {Array} events - Timeline events
 * @returns {Array} Procedure-outcome pairs
 */
function trackProcedureOutcomes(extractedData, events) {
  const responses = [];

  if (!extractedData.procedures?.procedures) return responses;

  extractedData.procedures.procedures.forEach(procedure => {
    const procName = procedure.name || procedure;

    // Check for post-operative complications
    const postOpComplications = extractedData.complications?.complications?.filter(comp => {
      // Check if complication occurred after procedure
      if (!procedure.date || !comp.date) return false;
      return new Date(comp.date) >= new Date(procedure.date);
    }) || [];

    // Check functional outcome
    const functionalOutcome = extractedData.functionalScores;

    responses.push({
      intervention: {
        type: 'procedure',
        name: procName,
        date: procedure.date,
        operator: procedure.operator,
        details: procedure.details
      },
      outcome: {
        type: 'surgical_outcome',
        complications: postOpComplications.map(c => c.name || c),
        complicationCount: postOpComplications.length,
        functionalStatus: functionalOutcome ? {
          kps: functionalOutcome.kps,
          ecog: functionalOutcome.ecog,
          mRS: functionalOutcome.mRS
        } : null
      },
      response: classifyProcedureResponse(postOpComplications, functionalOutcome),
      timeToResponse: 'Post-operative course',
      confidence: 0.75,
      notes: postOpComplications.length === 0 ?
        'Uncomplicated post-operative course' :
        `${postOpComplications.length} post-operative complication(s)`
    });
  });

  return responses;
}

/**
 * Track intervention responses (for specific complications)
 *
 * @param {Object} extractedData - Extracted data
 * @param {Array} events - Timeline events
 * @returns {Array} Intervention-outcome pairs
 */
function trackInterventionResponses(extractedData, events) {
  const responses = [];

  // Track hydrocephalus → EVD/shunt
  if (checkForComplication(extractedData, 'hydrocephalus')) {
    const evdPlaced = extractedData.procedures?.procedures?.some(proc => {
      const name = (proc.name || proc).toLowerCase();
      return name.includes('evd') ||
             name.includes('ventriculostomy') ||
             name.includes('shunt');
    });

    if (evdPlaced) {
      // Check if hydrocephalus resolved
      const resolved = checkForResolution(extractedData, 'hydrocephalus');

      responses.push({
        intervention: {
          type: 'procedure',
          name: 'EVD/Shunt placement',
          purpose: 'Hydrocephalus treatment'
        },
        outcome: {
          type: 'complication_treated',
          description: resolved ? 'Hydrocephalus resolved' : 'Hydrocephalus managed',
          resolution: resolved
        },
        response: resolved ? RESPONSE_TYPES.IMPROVED : RESPONSE_TYPES.STABLE,
        timeToResponse: 'Post-EVD placement',
        confidence: 0.8
      });
    }
  }

  // Track vasospasm → induced hypertension
  if (checkForComplication(extractedData, 'vasospasm')) {
    // Check for induced hypertension in medications or hospital course
    const hypertensionTreatment = checkForHypertensionTreatment(extractedData);

    if (hypertensionTreatment) {
      const improved = checkForImprovement(extractedData, 'vasospasm');

      responses.push({
        intervention: {
          type: 'therapy',
          name: 'Induced hypertension',
          purpose: 'Vasospasm treatment'
        },
        outcome: {
          type: 'complication_treated',
          description: improved ? 'Vasospasm improved' : 'Vasospasm persistent',
          improvement: improved
        },
        response: improved ? RESPONSE_TYPES.IMPROVED : RESPONSE_TYPES.PARTIAL,
        timeToResponse: '24-72 hours',
        confidence: 0.75
      });
    }
  }

  return responses;
}

/**
 * Classify procedure response based on complications and functional outcome
 *
 * @param {Array} complications - Post-operative complications
 * @param {Object} functionalScores - Functional outcome scores
 * @returns {string} Response classification
 */
function classifyProcedureResponse(complications, functionalScores) {
  // No complications = good outcome
  if (complications.length === 0) {
    if (functionalScores?.mRS !== null && functionalScores?.mRS !== undefined) {
      // mRS 0-2 = good outcome
      if (functionalScores.mRS <= 2) return RESPONSE_TYPES.IMPROVED;
      // mRS 3-4 = moderate outcome
      if (functionalScores.mRS <= 4) return RESPONSE_TYPES.PARTIAL;
      // mRS 5-6 = poor outcome
      return RESPONSE_TYPES.STABLE;
    }

    if (functionalScores?.kps >= 70) return RESPONSE_TYPES.IMPROVED;
    if (functionalScores?.kps >= 50) return RESPONSE_TYPES.PARTIAL;

    return RESPONSE_TYPES.IMPROVED; // Default to improved if no complications
  }

  // Severe complications = worse outcome
  const severeComplications = complications.filter(c =>
    c.severity === 'severe' || c.severity === 'critical'
  );

  if (severeComplications.length > 0) return RESPONSE_TYPES.WORSENED;

  // Moderate complications = partial response
  return RESPONSE_TYPES.PARTIAL;
}

/**
 * Calculate treatment effectiveness score (0-100)
 *
 * @param {Object} response - Treatment-outcome pair
 * @returns {Object} Effectiveness breakdown
 */
function calculateEffectiveness(response) {
  let speedScore = 0;
  let completenessScore = 0;
  let durabilityScore = 0;
  let sideEffectsScore = 25; // Default: no known side effects

  // Speed of response (0-25)
  if (response.timeToResponse) {
    const timeStr = response.timeToResponse.toLowerCase();

    if (timeStr.includes('immediate') || timeStr.includes('24')) {
      speedScore = 25;
    } else if (timeStr.includes('48') || timeStr.includes('72')) {
      speedScore = 20;
    } else if (timeStr.includes('days') || timeStr.includes('week')) {
      speedScore = 15;
    } else {
      speedScore = 10;
    }
  }

  // Completeness (0-25)
  switch (response.response) {
    case RESPONSE_TYPES.IMPROVED:
      completenessScore = 25;
      break;
    case RESPONSE_TYPES.PARTIAL:
      completenessScore = 15;
      break;
    case RESPONSE_TYPES.STABLE:
      completenessScore = 12;
      break;
    case RESPONSE_TYPES.NO_CHANGE:
      completenessScore = 5;
      break;
    case RESPONSE_TYPES.WORSENED:
      completenessScore = 0;
      break;
  }

  // Durability (0-25) - assume durable unless evidence of recurrence
  durabilityScore = response.outcome?.resolution === false ? 10 : 20;

  // Side effects (0-25) - deduct for complications
  if (response.outcome?.complicationCount > 0) {
    sideEffectsScore = Math.max(0, 25 - (response.outcome.complicationCount * 5));
  }

  const totalScore = speedScore + completenessScore + durabilityScore + sideEffectsScore;

  return {
    score: totalScore,
    breakdown: {
      speedOfResponse: speedScore,
      completeness: completenessScore,
      durability: durabilityScore,
      sideEffects: sideEffectsScore
    },
    rating: totalScore >= 80 ? 'excellent' :
            totalScore >= 60 ? 'good' :
            totalScore >= 40 ? 'fair' :
            'poor'
  };
}

/**
 * Check protocol compliance based on pathology subtype recommendations
 *
 * @param {Object} extractedData - Extracted data
 * @param {Array} responses - Treatment responses
 * @returns {Object} Compliance assessment
 */
function checkProtocolCompliance(extractedData, responses) {
  const compliance = {
    overall: 'not_assessed',
    items: []
  };

  // Check SAH-specific protocols
  if (extractedData.pathology?.type?.includes('SAH') ||
      extractedData.pathology?.primary?.toLowerCase().includes('subarachnoid')) {

    // Required: Nimodipine for 21 days
    const nimodipineGiven = responses.some(r =>
      r.intervention.name?.toLowerCase().includes('nimodipine')
    );

    compliance.items.push({
      protocol: 'Nimodipine for SAH',
      expected: 'Nimodipine 60mg q4h x 21 days',
      actual: nimodipineGiven ? 'Given' : 'Not documented',
      compliant: nimodipineGiven,
      importance: 'MANDATORY'
    });

    // Recommended: Daily TCD monitoring
    // (Cannot fully assess without detailed notes, mark as unknown)
    compliance.items.push({
      protocol: 'TCD monitoring',
      expected: 'Daily TCD for 14 days',
      actual: 'Not documented in extracted data',
      compliant: null,
      importance: 'RECOMMENDED'
    });
  }

  // Calculate overall compliance
  const assessedItems = compliance.items.filter(i => i.compliant !== null);
  if (assessedItems.length > 0) {
    const compliantCount = assessedItems.filter(i => i.compliant).length;
    const compliancePercent = (compliantCount / assessedItems.length) * 100;

    compliance.overall = compliancePercent >= 80 ? 'excellent' :
                        compliancePercent >= 60 ? 'good' :
                        compliancePercent >= 40 ? 'fair' :
                        'poor';
    compliance.percentage = Math.round(compliancePercent);
  }

  return compliance;
}

/**
 * Generate response summary statistics
 *
 * @param {Array} responses - Treatment responses
 * @returns {Object} Summary statistics
 */
function generateResponseSummary(responses) {
  const summary = {
    totalResponses: responses.length,
    byType: {
      improved: responses.filter(r => r.response === RESPONSE_TYPES.IMPROVED).length,
      stable: responses.filter(r => r.response === RESPONSE_TYPES.STABLE).length,
      worsened: responses.filter(r => r.response === RESPONSE_TYPES.WORSENED).length,
      partial: responses.filter(r => r.response === RESPONSE_TYPES.PARTIAL).length,
      noChange: responses.filter(r => r.response === RESPONSE_TYPES.NO_CHANGE).length
    },
    averageEffectiveness: 0,
    highPerformingTreatments: [],
    lowPerformingTreatments: []
  };

  // Calculate average effectiveness
  if (responses.length > 0) {
    const totalEffectiveness = responses.reduce((sum, r) => sum + (r.effectiveness?.score || 0), 0);
    summary.averageEffectiveness = Math.round(totalEffectiveness / responses.length);
  }

  // Identify high/low performing treatments
  responses.forEach(r => {
    if (r.effectiveness?.score >= 80) {
      summary.highPerformingTreatments.push(r.intervention.name);
    } else if (r.effectiveness?.score < 40) {
      summary.lowPerformingTreatments.push(r.intervention.name);
    }
  });

  return summary;
}

// Helper functions

function checkForComplication(extractedData, complicationKeyword) {
  if (!extractedData.complications?.complications) return false;

  return extractedData.complications.complications.some(comp => {
    const name = (comp.name || comp).toLowerCase();
    return name.includes(complicationKeyword.toLowerCase());
  });
}

function checkForResolution(extractedData, complicationKeyword) {
  // Check in hospital course or complications for resolution language
  if (extractedData.hospitalCourse?.summary) {
    const summary = extractedData.hospitalCourse.summary.toLowerCase();
    return summary.includes('resolved') || summary.includes('resolution');
  }
  return false;
}

function checkForImprovement(extractedData, complicationKeyword) {
  if (extractedData.hospitalCourse?.summary) {
    const summary = extractedData.hospitalCourse.summary.toLowerCase();
    return summary.includes('improved') || summary.includes('improving');
  }
  return false;
}

function checkForHypertensionTreatment(extractedData) {
  // Check medications or hospital course for hypertension treatment
  if (extractedData.hospitalCourse?.summary) {
    const summary = extractedData.hospitalCourse.summary.toLowerCase();
    if (summary.includes('induced hypertension') ||
        summary.includes('hypertensive therapy') ||
        summary.includes('triple h')) {
      return true;
    }
  }

  // Check medications for pressors
  const medicationsList = extractedData.medications?.current ||
                         extractedData.medications?.medications ||
                         [];
  if (medicationsList.length > 0) {
    return medicationsList.some(med => {
      const name = (med.name || med).toLowerCase();
      return name.includes('phenylephrine') ||
             name.includes('norepinephrine') ||
             name.includes('vasopressor');
    });
  }

  return false;
}

export default {
  trackTreatmentResponses,
  RESPONSE_TYPES
};
