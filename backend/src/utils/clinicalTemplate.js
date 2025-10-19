/**
 * Clinical Template Module
 * 
 * Provides institutional neurosurgery discharge summary template with placeholder
 * mapping and LLM-enhanced narrative generation.
 * 
 * Features:
 * - Placeholder-based template (@TOKEN@ format)
 * - Maps extracted data to institutional format
 * - Handles *** manual entry sections with LLM narratives
 * - Professional medical formatting
 * 
 * @module clinicalTemplate
 */

const { formatDate, calculateDaysBetween } = require('./dateUtils.js');

// ========================================
// CLINICAL TEMPLATE STRUCTURE
// ========================================

/**
 * Institutional neurosurgery discharge summary template
 * Uses @TOKEN@ placeholders and *** for narrative sections
 */
const CLINICAL_TEMPLATE = `Neurosurgery Discharge Summary
@TD@
Admitting Diagnosis
@ADMITDX@  

Admitted: @ADMITDATE@
Discharged: @DISCHDT@ 
Length of Stay: @LOS@ days
Discharge Disposition: @MRDDSPO@ 

Admitting Physician: @ADMPROV@
Discharge Physician: @ATTPROV@
Primary Care Physician at Discharge: @PCP@
Consults: @CONORDS@

Major Procedures and Operations
@ORPROCLATCOM@ 
@RRPROCNOTES@


History of Presenting Complaint
@NAME@ is a @AGE@ @SEX@ with @PPROB@ ***

In Hospital Course
***

Status at Discharge
{Functional Status}
***

Neurological Examination: 
***

Code Status: @CODESTATUS@

Past Medical and Surgical History
@MRHPMHP@
@HXPSH@
@PREFNAME@ @FAMHXP@
@SOCHX@
Allergies
@ALLERGY@

Home Medications
@DISCHMEDSIMPLE@ 

Hospital Problem List At Discharge & Care Plans
@HPROBL@
@NAME@ is a @AGE@ @SEX@ with @PPROB@ and underwent @RRSURGERY@ on @ORDATE@ *** with no complications.

Follow-Up
Follow up with {NSXSTAFF:39061} in 4-6 weeks with ***CT/MRI
Suture/staples for removal in 10-14 days with family doctor

@DCPROCEDURES@ 
@AFUTAPPT@`;

// ========================================
// PLACEHOLDER MAPPING FUNCTIONS
// ========================================

/**
 * Generate clinical template format from extracted data and narrative
 * 
 * @param {Object} extractedData - Extracted medical data
 * @param {Object} narrative - Generated narrative sections
 * @returns {string} Formatted clinical template
 */
function generateClinicalTemplateFormat(extractedData, narrative = {}) {
  if (!extractedData) {
    throw new Error('Cannot generate clinical template: missing extracted data');
  }

  // Start with base template
  let template = CLINICAL_TEMPLATE;

  // Map all placeholders
  const placeholders = {
    '@TD@': formatToday(),
    '@ADMITDX@': formatAdmittingDiagnosis(extractedData),
    '@ADMITDATE@': formatAdmissionDate(extractedData),
    '@DISCHDT@': formatDischargeDate(extractedData),
    '@LOS@': calculateLengthOfStay(extractedData),
    '@MRDDSPO@': formatDischargeDisposition(extractedData),
    '@ADMPROV@': formatAdmittingPhysician(extractedData),
    '@ATTPROV@': formatDischargePhysician(extractedData),
    '@PCP@': formatPrimaryCarePhysician(extractedData),
    '@CONORDS@': formatConsults(extractedData),
    '@ORPROCLATCOM@': formatProceduresList(extractedData),
    '@RRPROCNOTES@': formatProcedureNotes(extractedData),
    '@NAME@': formatPatientName(extractedData),
    '@AGE@': formatAge(extractedData),
    '@SEX@': formatGender(extractedData),
    '@PPROB@': formatPrimaryProblem(extractedData),
    '@CODESTATUS@': formatCodeStatus(extractedData),
    '@MRHPMHP@': formatMedicalHistory(extractedData),
    '@HXPSH@': formatSurgicalHistory(extractedData),
    '@PREFNAME@': formatPatientPreferredName(extractedData),
    '@FAMHXP@': formatFamilyHistory(extractedData),
    '@SOCHX@': formatSocialHistory(extractedData),
    '@ALLERGY@': formatAllergies(extractedData),
    '@DISCHMEDSIMPLE@': formatDischargeMedications(extractedData),
    '@HPROBL@': formatHospitalProblemList(extractedData),
    '@RRSURGERY@': formatPrimarySurgery(extractedData),
    '@ORDATE@': formatSurgeryDate(extractedData),
    '@DCPROCEDURES@': formatDischargeInstructions(extractedData),
    '@AFUTAPPT@': formatFollowUpAppointments(extractedData)
  };

  // Replace all placeholders
  for (const [placeholder, value] of Object.entries(placeholders)) {
    template = template.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  }

  // Fill *** manual entry sections with narrative content
  template = fillManualEntrySections(template, extractedData, narrative);

  return template;
}

// ========================================
// FORMATTING HELPER FUNCTIONS
// ========================================

/**
 * Format today's date
 */
function formatToday() {
  return formatDate(new Date(), 'MMMM d, yyyy');
}

/**
 * Format admitting diagnosis
 */
function formatAdmittingDiagnosis(extracted) {
  const pathology = extracted.pathology;
  if (!pathology) return '[Admitting Diagnosis]';

  const parts = [];
  
  if (pathology.primaryDiagnosis) {
    parts.push(pathology.primaryDiagnosis);
  } else if (pathology.type) {
    parts.push(pathology.type);
    if (pathology.location) parts.push(`(${pathology.location})`);
  }

  return parts.length > 0 ? parts.join(' ') : '[Admitting Diagnosis]';
}

/**
 * Format admission date
 */
function formatAdmissionDate(extracted) {
  const date = extracted.dates?.admissionDate || extracted.dates?.admission;
  return date ? formatDate(date, 'MMMM d, yyyy') : '[Admission Date]';
}

/**
 * Format discharge date
 */
function formatDischargeDate(extracted) {
  const date = extracted.dates?.dischargeDate || extracted.dates?.discharge;
  return date ? formatDate(date, 'MMMM d, yyyy') : '[Discharge Date]';
}

/**
 * Calculate length of stay
 */
function calculateLengthOfStay(extracted) {
  const admission = extracted.dates?.admissionDate || extracted.dates?.admission;
  const discharge = extracted.dates?.dischargeDate || extracted.dates?.discharge;
  
  if (admission && discharge) {
    const days = calculateDaysBetween(admission, discharge);
    return days >= 0 ? days.toString() : '[LOS]';
  }
  
  return '[LOS]';
}

/**
 * Format discharge disposition
 */
function formatDischargeDisposition(extracted) {
  const destination = extracted.dischargeDestination?.location || 
                     extracted.dischargeDestination?.primary?.label ||
                     extracted.discharge?.destination;
  return destination || 'Home';
}

/**
 * Format admitting physician
 */
function formatAdmittingPhysician(extracted) {
  const physician = extracted.demographics?.admittingPhysician || 
                   extracted.demographics?.attending;
  return physician || '[Admitting Physician]';
}

/**
 * Format discharge physician
 */
function formatDischargePhysician(extracted) {
  const physician = extracted.demographics?.dischargePhysician || 
                   extracted.demographics?.attending;
  return physician || '[Discharge Physician]';
}

/**
 * Format primary care physician
 */
function formatPrimaryCarePhysician(extracted) {
  const pcp = extracted.demographics?.primaryCarePhysician || 
             extracted.demographics?.pcp;
  return pcp || '[Primary Care Physician]';
}

/**
 * Format consults
 */
function formatConsults(extracted) {
  const consults = extracted.consultations?.consultations || 
                  extracted.consultations || [];
  
  if (Array.isArray(consults) && consults.length > 0) {
    return consults.map(c => {
      const specialty = c.specialty || c.service || c;
      return typeof specialty === 'string' ? specialty : '[Consult]';
    }).join(', ');
  }
  
  return 'None';
}

/**
 * Format procedures list
 */
function formatProceduresList(extracted) {
  const procedures = extracted.procedures?.procedures || extracted.procedures || [];
  
  if (Array.isArray(procedures) && procedures.length > 0) {
    return procedures.map((p, index) => {
      const name = p.name || p.procedure || p;
      const date = p.date ? ` (${formatDate(p.date, 'MM/dd/yyyy')})` : '';
      return `${index + 1}. ${name}${date}`;
    }).join('\n');
  }
  
  return '[No procedures documented]';
}

/**
 * Format procedure notes
 */
function formatProcedureNotes(extracted) {
  const procedures = extracted.procedures?.procedures || extracted.procedures || [];
  
  if (Array.isArray(procedures) && procedures.length > 0) {
    const notes = procedures
      .filter(p => p.details || p.notes)
      .map(p => p.details || p.notes)
      .join('\n\n');
    return notes || '';
  }
  
  return '';
}

/**
 * Format patient name
 */
function formatPatientName(extracted) {
  return extracted.demographics?.name || '[Patient Name]';
}

/**
 * Format age
 */
function formatAge(extracted) {
  const age = extracted.demographics?.age;
  return age ? age.toString() : '[Age]';
}

/**
 * Format gender
 */
function formatGender(extracted) {
  const sex = extracted.demographics?.sex || extracted.demographics?.gender;
  if (!sex) return '[Gender]';
  
  const normalized = sex.toLowerCase();
  if (normalized === 'm' || normalized === 'male') return 'male';
  if (normalized === 'f' || normalized === 'female') return 'female';
  return sex;
}

/**
 * Format primary problem
 */
function formatPrimaryProblem(extracted) {
  return formatAdmittingDiagnosis(extracted);
}

/**
 * Format code status
 */
function formatCodeStatus(extracted) {
  const codeStatus = extracted.codeStatus || extracted.discharge?.codeStatus;
  return codeStatus || 'Full Code';
}

/**
 * Format medical history
 */
function formatMedicalHistory(extracted) {
  const history = extracted.medicalHistory?.conditions ||
                 extracted.pastMedicalHistory ||
                 [];

  if (Array.isArray(history) && history.length > 0) {
    return history.map(h => {
      const condition = typeof h === 'string' ? h : (h.condition || h.name);
      return `- ${condition}`;
    }).join('\n');
  }

  return 'None documented';
}

/**
 * Format surgical history
 */
function formatSurgicalHistory(extracted) {
  const history = extracted.surgicalHistory?.procedures ||
                 extracted.pastSurgicalHistory ||
                 [];

  if (Array.isArray(history) && history.length > 0) {
    return history.map(h => {
      const procedure = typeof h === 'string' ? h : (h.procedure || h.name);
      const date = h.date ? ` (${formatDate(h.date, 'yyyy')})` : '';
      return `- ${procedure}${date}`;
    }).join('\n');
  }

  return 'None documented';
}

/**
 * Format patient preferred name
 */
function formatPatientPreferredName(extracted) {
  return extracted.demographics?.preferredName || extracted.demographics?.name || '[Patient]';
}

/**
 * Format family history
 */
function formatFamilyHistory(extracted) {
  const history = extracted.familyHistory || [];

  if (Array.isArray(history) && history.length > 0) {
    return history.map(h => {
      const condition = typeof h === 'string' ? h : (h.condition || h);
      return `- ${condition}`;
    }).join('\n');
  }

  return 'Non-contributory';
}

/**
 * Format social history
 */
function formatSocialHistory(extracted) {
  const social = extracted.socialHistory || {};
  const parts = [];

  if (social.smoking) parts.push(`Smoking: ${social.smoking}`);
  if (social.alcohol) parts.push(`Alcohol: ${social.alcohol}`);
  if (social.drugs) parts.push(`Drugs: ${social.drugs}`);
  if (social.occupation) parts.push(`Occupation: ${social.occupation}`);
  if (social.livingArrangement) parts.push(`Living: ${social.livingArrangement}`);

  return parts.length > 0 ? parts.join('\n') : 'Not documented';
}

/**
 * Format allergies
 */
function formatAllergies(extracted) {
  const allergies = extracted.allergies || [];

  if (Array.isArray(allergies) && allergies.length > 0) {
    return allergies.map(a => {
      const allergen = typeof a === 'string' ? a : (a.allergen || a.name);
      const reaction = a.reaction ? ` (${a.reaction})` : '';
      return `- ${allergen}${reaction}`;
    }).join('\n');
  }

  return 'NKDA (No Known Drug Allergies)';
}

/**
 * Format discharge medications
 */
function formatDischargeMedications(extracted) {
  const meds = extracted.medications?.discharge ||
              extracted.dischargeMedications ||
              [];

  if (Array.isArray(meds) && meds.length > 0) {
    return meds.map((m, index) => {
      const name = m.name || m.medication || m;
      const dose = m.dose || m.dosage || '';
      const frequency = m.frequency || '';
      const route = m.route || 'PO';

      let medString = `${index + 1}. ${name}`;
      if (dose) medString += ` ${dose}`;
      if (route) medString += ` ${route}`;
      if (frequency) medString += ` ${frequency}`;

      return medString;
    }).join('\n');
  }

  return 'None';
}

/**
 * Format hospital problem list
 */
function formatHospitalProblemList(extracted) {
  const problems = [];

  // Add primary diagnosis
  if (extracted.pathology?.primaryDiagnosis || extracted.pathology?.type) {
    problems.push(`1. ${formatAdmittingDiagnosis(extracted)}`);
  }

  // Add complications
  const complications = extracted.complications?.complications || extracted.complications || [];
  if (Array.isArray(complications) && complications.length > 0) {
    complications.forEach((c, index) => {
      const complication = typeof c === 'string' ? c : (c.complication || c.name);
      problems.push(`${problems.length + 1}. ${complication}`);
    });
  }

  return problems.length > 0 ? problems.join('\n') : '[Problem List]';
}

/**
 * Format primary surgery
 */
function formatPrimarySurgery(extracted) {
  const procedures = extracted.procedures?.procedures || extracted.procedures || [];

  if (Array.isArray(procedures) && procedures.length > 0) {
    const primary = procedures[0];
    return primary.name || primary.procedure || primary;
  }

  return '[Primary Surgery]';
}

/**
 * Format surgery date
 */
function formatSurgeryDate(extracted) {
  const surgeryDates = extracted.dates?.surgeryDates || extracted.dates?.surgery;

  if (Array.isArray(surgeryDates) && surgeryDates.length > 0) {
    return formatDate(surgeryDates[0], 'MMMM d, yyyy');
  } else if (surgeryDates) {
    return formatDate(surgeryDates, 'MMMM d, yyyy');
  }

  return '[Surgery Date]';
}

/**
 * Format discharge instructions
 */
function formatDischargeInstructions(extracted) {
  const instructions = extracted.followUp?.instructions ||
                      extracted.discharge?.instructions ||
                      [];

  if (Array.isArray(instructions) && instructions.length > 0) {
    return instructions.map((inst, index) => {
      const text = typeof inst === 'string' ? inst : inst.instruction;
      return `${index + 1}. ${text}`;
    }).join('\n');
  }

  return 'Standard post-operative instructions provided';
}

/**
 * Format follow-up appointments
 */
function formatFollowUpAppointments(extracted) {
  const appointments = extracted.followUp?.appointments || [];

  if (Array.isArray(appointments) && appointments.length > 0) {
    return appointments.map(appt => {
      const specialty = appt.specialty || appt.provider || '[Specialty]';
      const timeframe = appt.timeframe || appt.when || '[Timeframe]';
      return `- ${specialty} in ${timeframe}`;
    }).join('\n');
  }

  return 'Follow up as directed';
}

// ========================================
// MANUAL ENTRY SECTION HANDLERS (*** sections)
// ========================================

/**
 * Fill *** manual entry sections with narrative content
 *
 * @param {string} template - Template with *** markers
 * @param {Object} extracted - Extracted data
 * @param {Object} narrative - Generated narrative sections
 * @returns {string} Template with *** sections filled
 */
function fillManualEntrySections(template, extracted, narrative) {
  // Section 1: History of Presenting Complaint continuation
  // Pattern: "@NAME@ is a @AGE@ @SEX@ with @PPROB@ ***"
  const historyPattern = /(@NAME@ is a @AGE@ @SEX@ with @PPROB@) \*\*\*/;
  if (historyPattern.test(template)) {
    const historyContent = generateHistoryContent(extracted, narrative);
    template = template.replace(historyPattern, `$1 ${historyContent}`);
  }

  // Section 2: In Hospital Course
  // Pattern: "In Hospital Course\n***"
  const hospitalCoursePattern = /In Hospital Course\s*\n\*\*\*/;
  if (hospitalCoursePattern.test(template)) {
    const courseContent = generateHospitalCourseContent(extracted, narrative);
    template = template.replace(hospitalCoursePattern, `In Hospital Course\n${courseContent}`);
  }

  // Section 3: Functional Status
  // Pattern: "{Functional Status}\n***"
  const functionalStatusPattern = /\{Functional Status\}\s*\n\*\*\*/;
  if (functionalStatusPattern.test(template)) {
    const functionalContent = generateFunctionalStatusContent(extracted, narrative);
    template = template.replace(functionalStatusPattern, `{Functional Status}\n${functionalContent}`);
  }

  // Section 4: Neurological Examination
  // Pattern: "Neurological Examination: \n***"
  const neuroExamPattern = /Neurological Examination:\s*\n\*\*\*/;
  if (neuroExamPattern.test(template)) {
    const neuroContent = generateNeurologicalExamContent(extracted, narrative);
    template = template.replace(neuroExamPattern, `Neurological Examination:\n${neuroContent}`);
  }

  // Section 5: Hospital Problem List continuation
  // Pattern: "and underwent @RRSURGERY@ on @ORDATE@ *** with no complications."
  const problemListPattern = /(and underwent @RRSURGERY@ on @ORDATE@) \*\*\* (with no complications\.)/;
  if (problemListPattern.test(template)) {
    const procedureContent = generateProcedureOutcomeContent(extracted, narrative);
    template = template.replace(problemListPattern, `$1 ${procedureContent} $2`);
  }

  // Section 6: Follow-up imaging
  // Pattern: "Follow up with {NSXSTAFF:39061} in 4-6 weeks with ***CT/MRI"
  const followUpImagingPattern = /(Follow up with \{NSXSTAFF:39061\} in 4-6 weeks with) \*\*\*(CT\/MRI)/;
  if (followUpImagingPattern.test(template)) {
    const imagingContent = generateFollowUpImagingContent(extracted, narrative);
    template = template.replace(followUpImagingPattern, `$1 ${imagingContent}$2`);
  }

  return template;
}

/**
 * Generate history of presenting complaint content
 */
function generateHistoryContent(extracted, narrative) {
  // Use narrative if available
  if (narrative.historyOfPresentIllness) {
    return narrative.historyOfPresentIllness;
  }

  // Generate from extracted data
  const parts = [];

  // Presenting symptoms
  const symptoms = extracted.presentingSymptoms?.symptoms || extracted.presentingSymptoms || [];
  if (Array.isArray(symptoms) && symptoms.length > 0) {
    const symptomList = symptoms.map(s => typeof s === 'string' ? s : s.symptom).join(', ');
    parts.push(`who presented with ${symptomList}.`);
  } else {
    parts.push('who presented to the emergency department.');
  }

  // Onset
  const onset = extracted.presentingSymptoms?.onset;
  if (onset) {
    parts.push(`Onset was ${onset}.`);
  }

  return parts.join(' ');
}

/**
 * Generate hospital course content
 */
function generateHospitalCourseContent(extracted, narrative) {
  // Use narrative if available
  if (narrative.hospitalCourse) {
    return narrative.hospitalCourse;
  }

  // Generate from extracted data
  const parts = [];

  // Admission
  const admissionDate = extracted.dates?.admissionDate || extracted.dates?.admission;
  if (admissionDate) {
    parts.push(`Patient was admitted on ${formatDate(admissionDate, 'MMMM d, yyyy')}.`);
  }

  // Procedures
  const procedures = extracted.procedures?.procedures || extracted.procedures || [];
  if (Array.isArray(procedures) && procedures.length > 0) {
    procedures.forEach(proc => {
      const name = proc.name || proc.procedure || proc;
      const date = proc.date ? ` on ${formatDate(proc.date, 'MMMM d, yyyy')}` : '';
      parts.push(`Patient underwent ${name}${date}.`);
    });
  }

  // Complications
  const complications = extracted.complications?.complications || extracted.complications || [];
  if (Array.isArray(complications) && complications.length > 0) {
    const compList = complications.map(c => typeof c === 'string' ? c : (c.complication || c.name)).join(', ');
    parts.push(`Hospital course was complicated by ${compList}.`);
  } else {
    parts.push('Hospital course was uncomplicated.');
  }

  // Recovery
  parts.push('Patient tolerated the procedure well and recovered appropriately.');

  return parts.join(' ');
}

/**
 * Generate functional status content
 */
function generateFunctionalStatusContent(extracted, narrative) {
  // Use narrative if available
  if (narrative.dischargeStatus) {
    return narrative.dischargeStatus;
  }

  // Generate from extracted data
  const parts = [];
  const scores = extracted.functionalScores || {};

  if (scores.gcs) parts.push(`GCS: ${scores.gcs}`);
  if (scores.mRS !== null && scores.mRS !== undefined) parts.push(`mRS: ${scores.mRS}`);
  if (scores.kps) parts.push(`KPS: ${scores.kps}`);
  if (scores.ecog !== null && scores.ecog !== undefined) parts.push(`ECOG: ${scores.ecog}`);

  if (parts.length > 0) {
    return parts.join(', ');
  }

  return 'Patient is neurologically stable at discharge.';
}

/**
 * Generate neurological examination content
 */
function generateNeurologicalExamContent(extracted, narrative) {
  // Use narrative if available
  if (narrative.neurologicalExam) {
    return narrative.neurologicalExam;
  }

  // Generate from extracted data
  const neuroExam = extracted.neurologicalExam || extracted.neuroExam || {};
  const parts = [];

  if (neuroExam.mental) parts.push(`Mental status: ${neuroExam.mental}`);
  if (neuroExam.cranialNerves) parts.push(`Cranial nerves: ${neuroExam.cranialNerves}`);
  if (neuroExam.motor) parts.push(`Motor: ${neuroExam.motor}`);
  if (neuroExam.sensory) parts.push(`Sensory: ${neuroExam.sensory}`);
  if (neuroExam.reflexes) parts.push(`Reflexes: ${neuroExam.reflexes}`);
  if (neuroExam.coordination) parts.push(`Coordination: ${neuroExam.coordination}`);
  if (neuroExam.gait) parts.push(`Gait: ${neuroExam.gait}`);

  if (parts.length > 0) {
    return parts.join('\n');
  }

  return 'Alert and oriented. Cranial nerves II-XII intact. Motor strength 5/5 throughout. Sensation intact. Reflexes normal.';
}

/**
 * Generate procedure outcome content
 */
function generateProcedureOutcomeContent(extracted, narrative) {
  // Use narrative if available
  if (narrative.procedures) {
    return narrative.procedures;
  }

  // Generate from extracted data
  const procedures = extracted.procedures?.procedures || extracted.procedures || [];

  if (Array.isArray(procedures) && procedures.length > 0) {
    const primary = procedures[0];
    const details = primary.details || primary.notes || '';
    if (details) {
      return details;
    }
  }

  return 'successfully';
}

/**
 * Generate follow-up imaging content
 */
function generateFollowUpImagingContent(extracted, narrative) {
  // Check follow-up imaging
  const imaging = extracted.followUp?.imaging || [];

  if (Array.isArray(imaging) && imaging.length > 0) {
    const imagingType = imaging[0];
    if (typeof imagingType === 'string') {
      // Extract imaging modality (CT, MRI, etc.)
      if (imagingType.toLowerCase().includes('ct')) return 'CT ';
      if (imagingType.toLowerCase().includes('mri')) return 'MRI ';
    }
  }

  return '';
}

// ========================================
// EXPORTS
// ========================================

module.exports = {
  CLINICAL_TEMPLATE,
  generateClinicalTemplateFormat,
  fillManualEntrySections
};

