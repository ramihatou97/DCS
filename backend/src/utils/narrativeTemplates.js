/**
 * Narrative Templates Module
 *
 * Provides high-quality fallback templates for discharge summary sections.
 * These templates ensure 100% section coverage and professional formatting
 * even when LLM generation is slow or incomplete.
 *
 * Features:
 * - Instant generation (<1ms per section)
 * - Medical professional formatting
 * - Data-driven content
 * - Pathology-specific customization
 *
 * @module narrativeTemplates
 */

const { formatDate } = require('./dateUtils.js');

// ========================================
// DISCHARGE INSTRUCTIONS TEMPLATES
// ========================================

/**
 * Generate discharge instructions section
 * This is often missing from LLM output but critical for patient safety
 *
 * @param {Object} extracted - Extracted data
 * @returns {string} Formatted discharge instructions
 */
function generateDischargeInstructionsTemplate(extracted) {
  const {discharge, medications, pathology, procedures} = extracted;

  const sections = [];

  // Header
  sections.push('DISCHARGE INSTRUCTIONS:');
  sections.push('');

  // Medications
  if (medications && medications.length > 0) {
    sections.push('Medications:');
    medications.forEach(med => {
      const dose = med.dosage || med.dose || '';
      const freq = med.frequency || '';
      const duration = med.duration ? ` for ${med.duration}` : '';
      sections.push(`- ${med.name || med.medication} ${dose} ${freq}${duration}`.trim());
    });
    sections.push('');
  }

  // Activity restrictions
  sections.push('Activity Restrictions:');
  if (discharge?.restrictions) {
    if (Array.isArray(discharge.restrictions)) {
      discharge.restrictions.forEach(r => sections.push(`- ${r}`));
    } else {
      sections.push(`- ${discharge.restrictions}`);
    }
  } else {
    // Default based on pathology
    if (pathology?.primaryDiagnosis?.toLowerCase().includes('surgery') ||
        procedures?.procedures?.length > 0) {
      sections.push('- No heavy lifting > 10 lbs for 6 weeks');
      sections.push('- No strenuous activity for 4-6 weeks');
      sections.push('- Resume normal activities as tolerated');
    } else {
      sections.push('- Resume normal activities as tolerated');
      sections.push('- Avoid strenuous activity until follow-up');
    }
  }
  sections.push('');

  // Follow-up
  sections.push('Follow-up Care:');
  if (discharge?.followUp) {
    if (Array.isArray(discharge.followUp)) {
      discharge.followUp.forEach(f => sections.push(`- ${f}`));
    } else {
      sections.push(`- ${discharge.followUp}`);
    }
  } else {
    sections.push('- Follow up with your physician as directed');
    sections.push('- Call to schedule appointment within 1-2 weeks');
  }
  sections.push('');

  // Warning signs
  sections.push('Seek Immediate Medical Attention If You Experience:');
  const warnings = getWarningSignsByPathology(pathology);
  warnings.forEach(w => sections.push(`- ${w}`));
  sections.push('');

  // Contact information
  sections.push('Contact Information:');
  sections.push('- Emergency: Call 911');
  sections.push('- Hospital: Contact your care team if you have questions');
  if (discharge?.clinicPhone) {
    sections.push(`- Clinic: ${discharge.clinicPhone}`);
  }

  return sections.join('\n');
}

/**
 * Get warning signs based on pathology
 */
function getWarningSignsByPathology(pathology) {
  const pathType = pathology?.primaryDiagnosis?.toLowerCase() || '';

  const warnings = [
    'Severe headache that won\'t go away',
    'New confusion or difficulty waking up',
    'New weakness, numbness, or vision changes',
    'Difficulty breathing or chest pain',
    'Fever >101°F (38.3°C)',
    'Severe nausea/vomiting',
    'Signs of infection at surgical site (if applicable)'
  ];

  // Add pathology-specific warnings
  if (pathType.includes('sah') || pathType.includes('aneurysm') || pathType.includes('hemorrhage')) {
    warnings.unshift('Sudden severe headache ("thunderclap")');
    warnings.push('Neck stiffness');
  }

  if (pathType.includes('stroke') || pathType.includes('ischemic')) {
    warnings.push('Sudden weakness on one side');
    warnings.push('Sudden difficulty speaking or understanding');
  }

  if (pathType.includes('spine') || pathType.includes('spinal')) {
    warnings.push('Loss of bladder or bowel control');
    warnings.push('Numbness in groin/saddle area');
  }

  if (pathType.includes('tumor') || pathType.includes('glioma') || pathType.includes('gbm')) {
    warnings.push('New or worsening seizures');
  }

  return warnings;
}

// ========================================
// PROGNOSIS TEMPLATES
// ========================================

/**
 * Generate prognosis section
 * Often missing from LLM output, but important for patient understanding
 *
 * @param {Object} extracted - Extracted data
 * @param {Object} intelligence - Clinical intelligence data
 * @returns {string} Formatted prognosis
 */
function generatePrognosisTemplate(extracted, intelligence = null) {
  const {pathology, functionalStatus, discharge, complications} = extracted;

  const sections = [];

  sections.push('PROGNOSIS:');
  sections.push('');

  // Overall prognosis
  const prognosisLevel = determinePrognosisLevel(extracted, intelligence);
  sections.push(prognosisLevel.statement);
  sections.push('');

  // Functional recovery
  if (functionalStatus?.discharge || discharge?.mrs !== undefined || discharge?.kps !== undefined) {
    sections.push('Functional Recovery:');

    if (discharge?.mrs !== undefined) {
      const mrsPrognosis = getMRSPrognosis(discharge.mrs);
      sections.push(`- Modified Rankin Scale (mRS) ${discharge.mrs}: ${mrsPrognosis}`);
    }

    if (discharge?.kps !== undefined) {
      const kpsPrognosis = getKPSPrognosis(discharge.kps);
      sections.push(`- Karnofsky Performance Status (KPS) ${discharge.kps}: ${kpsPrognosis}`);
    }

    sections.push('- Continued improvement expected with rehabilitation');
    sections.push('- Maximum recovery typically within 6-12 months');
    sections.push('');
  }

  // Complications impact
  if (complications && complications.length > 0) {
    const majorComplications = complications.filter(c =>
      c.severity === 'major' || c.severity === 'severe' || c.severity === 'critical'
    );

    if (majorComplications.length > 0) {
      sections.push(`Complications (${majorComplications.length} major) may impact recovery timeline.`);
      sections.push('');
    }
  }

  // Follow-up importance
  sections.push('Follow-up Care:');
  sections.push('- Regular follow-up appointments are essential for optimal recovery');
  sections.push('- Adherence to medication regimen is critical');
  if (pathology?.primaryDiagnosis?.toLowerCase().includes('tumor') ||
      pathology?.primaryDiagnosis?.toLowerCase().includes('cancer')) {
    sections.push('- Ongoing surveillance imaging will be necessary');
  }
  sections.push('');

  // Positive reinforcement
  sections.push('With appropriate follow-up care and rehabilitation, continued improvement is expected.');

  return sections.join('\n');
}

/**
 * Determine overall prognosis level
 */
function determinePrognosisLevel(extracted, intelligence) {
  const {pathology, functionalStatus, discharge, complications} = extracted;

  // Check functional status
  let functionalScore = 0.5; // Default neutral

  if (discharge?.mrs !== undefined) {
    functionalScore = discharge.mrs <= 2 ? 0.8 : discharge.mrs <= 4 ? 0.5 : 0.3;
  } else if (discharge?.kps !== undefined) {
    functionalScore = discharge.kps >= 70 ? 0.8 : discharge.kps >= 50 ? 0.5 : 0.3;
  }

  // Check complications
  const complicationScore = complications && complications.length > 0 ? 0.7 : 1.0;

  // Combined score
  const overallScore = (functionalScore + complicationScore) / 2;

  if (overallScore >= 0.75) {
    return {
      level: 'good',
      statement: 'Good functional recovery expected with appropriate rehabilitation and follow-up care.'
    };
  } else if (overallScore >= 0.5) {
    return {
      level: 'fair',
      statement: 'Fair to good prognosis with continued medical management and rehabilitation.'
    };
  } else {
    return {
      level: 'guarded',
      statement: 'Prognosis is guarded. Close follow-up and intensive rehabilitation recommended.'
    };
  }
}

/**
 * Get mRS-based prognosis
 */
function getMRSPrognosis(mrs) {
  const descriptions = {
    0: 'No symptoms, fully independent',
    1: 'No significant disability despite symptoms',
    2: 'Slight disability, independent in daily activities',
    3: 'Moderate disability, requires some assistance',
    4: 'Moderately severe disability, unable to walk unassisted',
    5: 'Severe disability, bedridden',
    6: 'Death'
  };

  return descriptions[mrs] || 'Variable functional status';
}

/**
 * Get KPS-based prognosis
 */
function getKPSPrognosis(kps) {
  if (kps >= 80) {
    return 'Normal activity with minor symptoms';
  } else if (kps >= 60) {
    return 'Requires occasional assistance';
  } else if (kps >= 40) {
    return 'Requires considerable assistance';
  } else if (kps >= 20) {
    return 'Very sick, requires hospitalization';
  } else {
    return 'Severely debilitated';
  }
}

// ========================================
// PROCEDURES SUMMARY TEMPLATE
// ========================================

/**
 * Generate procedures summary when LLM output is inadequate
 *
 * @param {Object} extracted - Extracted data
 * @returns {string} Formatted procedures summary
 */
function generateProceduresTemplate(extracted) {
  const {procedures} = extracted;

  if (!procedures || !procedures.procedures || procedures.procedures.length === 0) {
    return 'No procedures performed during this admission.';
  }

  const sections = [];

  sections.push('PROCEDURES:');
  sections.push('');

  procedures.procedures.forEach((proc, idx) => {
    sections.push(`${idx + 1}. ${proc.name || proc.procedure}`);

    if (proc.date) {
      sections.push(`   Date: ${formatDate(proc.date)}`);
    }

    if (proc.indication) {
      sections.push(`   Indication: ${proc.indication}`);
    }

    if (proc.approach || proc.details) {
      sections.push(`   Details: ${proc.approach || proc.details}`);
    }

    if (proc.outcome) {
      sections.push(`   Outcome: ${proc.outcome}`);
    }

    if (proc.complications) {
      sections.push(`   Complications: ${proc.complications}`);
    } else {
      sections.push(`   Complications: None`);
    }

    sections.push('');
  });

  return sections.join('\n');
}

// ========================================
// CHIEF COMPLAINT TEMPLATE
// ========================================

/**
 * Generate chief complaint when LLM output is missing
 *
 * @param {Object} extracted - Extracted data
 * @returns {string} Chief complaint
 */
function generateChiefComplaintTemplate(extracted) {
  const {demographics, presentingSymptoms, pathology} = extracted;

  let text = '';

  // Age and gender
  if (demographics?.age && demographics?.sex) {
    const sex = demographics.sex?.toLowerCase();
    const gender = sex === 'm' || sex === 'male' ? 'male' :
                   sex === 'f' || sex === 'female' ? 'female' : 'patient';
    text += `${demographics.age}-year-old ${gender}`;
  } else {
    text += 'Patient';
  }

  // Presenting symptom
  if (presentingSymptoms?.chief || presentingSymptoms?.symptoms?.[0]) {
    const chief = presentingSymptoms.chief || presentingSymptoms.symptoms[0];
    text += ` presenting with ${chief.toLowerCase()}`;
  }

  // Diagnosis
  if (pathology?.primaryDiagnosis) {
    text += ` found to have ${pathology.primaryDiagnosis.toLowerCase()}`;
  }

  text += '.';

  return text || 'Chief complaint not documented.';
}

// ========================================
// HOSPITAL COURSE TEMPLATE
// ========================================

/**
 * Generate hospital course summary when LLM output is inadequate
 *
 * @param {Object} extracted - Extracted data
 * @returns {string} Hospital course narrative
 */
function generateHospitalCourseTemplate(extracted) {
  const {dates, procedures, complications, functionalStatus, medications} = extracted;

  const paragraphs = [];

  // Admission
  if (dates?.admission || dates?.admissionDate) {
    const admDate = formatDate(dates.admission || dates.admissionDate);
    paragraphs.push(`Patient was admitted on ${admDate}.`);
  }

  // Procedures
  if (procedures && procedures.procedures && procedures.procedures.length > 0) {
    const procList = procedures.procedures
      .map(p => p.name || p.procedure)
      .join(', ');
    paragraphs.push(`During hospitalization, patient underwent: ${procList}.`);
  }

  // Complications
  if (complications && complications.length > 0) {
    const compCount = complications.length;
    const compList = complications
      .slice(0, 3)
      .map(c => c.complication || c.name)
      .join(', ');

    paragraphs.push(`Hospital course was complicated by ${compCount} event(s): ${compList}.`);

    if (complications.length > 3) {
      paragraphs[paragraphs.length - 1] += ` And ${complications.length - 3} additional complication(s).`;
    }
  } else {
    paragraphs.push('Hospital course was uncomplicated.');
  }

  // Functional status progression
  if (functionalStatus?.admission && functionalStatus?.discharge) {
    paragraphs.push(`Functional status improved from admission to discharge.`);
  }

  // Medications
  if (medications && medications.length > 0) {
    paragraphs.push(`Patient was managed with appropriate medications throughout admission.`);
  }

  // Discharge
  if (dates?.discharge || dates?.dischargeDate) {
    const dcDate = formatDate(dates.discharge || dates.dischargeDate);
    const disposition = extracted.discharge?.destination || 'home';
    paragraphs.push(`Patient was discharged on ${dcDate} to ${disposition}.`);
  }

  return paragraphs.join(' ');
}

// ========================================
// SECTION VALIDATION
// ========================================

/**
 * QUALITY IMPROVEMENT: Check if section is truly missing (not length-based)
 *
 * PROBLEM: Previous version used length-based validation that replaced good
 * LLM-generated content with basic templates if content was "too short".
 * This resulted in loss of clinical detail and richness.
 *
 * SOLUTION: Only check if section is truly missing (null, undefined, empty, or "Not available"),
 * regardless of length. Trust LLM to generate appropriate content length.
 *
 * @param {string} section - Section content
 * @returns {boolean} True if section has valid content (even if brief), false if truly missing
 */
function isSectionAdequate(section) {
  // Check for truly missing content only:
  // - null or undefined
  // - Not a string
  // - Empty string (after trimming)
  // - Generic "Not available" placeholder
  if (!section || typeof section !== 'string') {
    return false;
  }

  const trimmed = section.trim();

  if (trimmed.length === 0) {
    return false;
  }

  if (trimmed === 'Not available.' || trimmed === 'Not available') {
    return false;
  }

  // If we got here, section has actual content - trust the LLM!
  return true;
}

/**
 * Get template function for a given section
 *
 * @param {string} sectionName - Name of the section
 * @returns {Function|null} Template function or null
 */
function getTemplateFunction(sectionName) {
  const templates = {
    chiefComplaint: generateChiefComplaintTemplate,
    dischargeInstructions: generateDischargeInstructionsTemplate,
    prognosis: generatePrognosisTemplate,
    procedures: generateProceduresTemplate,
    hospitalCourse: generateHospitalCourseTemplate,
    followUpPlan: generateDischargeInstructionsTemplate, // Reuse discharge instructions
  };

  return templates[sectionName] || null;
}

// ========================================
// EXPORTS
// ========================================

module.exports = {
  generateDischargeInstructionsTemplate,
  generatePrognosisTemplate,
  generateProceduresTemplate,
  generateChiefComplaintTemplate,
  generateHospitalCourseTemplate,
  isSectionAdequate,
  getTemplateFunction
};
