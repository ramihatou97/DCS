/**
 * Completeness Scorer - 6-Dimension Quality Metrics
 *
 * Evaluates how complete the discharge summary is by checking:
 * - Presence of all critical sections
 * - Field completeness within each section
 * - Pathology-specific requirements
 *
 * Weight: 30% of overall quality score
 *
 * @module completenessScorer
 */

// Critical sections that must be present
const CRITICAL_SECTIONS = [
  'demographics',
  'admissionDate',
  'dischargeDate',
  'primaryDiagnosis',
  'hospitalCourse',
  'procedures',
  'medications',
  'dischargeDisposition',
  'followUp'
];

// Important sections (should be present)
const IMPORTANT_SECTIONS = [
  'presentingSymptoms',
  'complications',
  'physicalExam',
  'consultations',
  'imaging',
  'labs'
];

// Optional sections (nice to have)
const OPTIONAL_SECTIONS = [
  'socialHistory',
  'familyHistory',
  'allergies',
  'codeStatus'
];

// Pathology-specific required fields
const PATHOLOGY_REQUIREMENTS = {
  'SAH': {
    required: ['aneurysmLocation', 'huntHessGrade', 'fisherGrade', 'vasospasm'],
    important: ['EVD', 'angioResults', 'treatmentModality']
  },
  'TUMORS': {
    required: ['tumorType', 'whoGrade', 'resectionExtent', 'pathology'],
    important: ['molecularMarkers', 'adjuvantTherapy', 'KPS']
  },
  'SPINE': {
    required: ['levelOfInjury', 'asiaScore', 'motorExam', 'sensoryExam'],
    important: ['bladderFunction', 'bowelFunction', 'autonomicDysreflexia']
  },
  'TBI': {
    required: ['gcsInitial', 'gcsDischarge', 'pupilExam', 'CTFindings'],
    important: ['ICP', 'craniectomy', 'cognitiveStatus']
  },
  'HYDROCEPHALUS': {
    required: ['etiology', 'ventricularSize', 'shuntType', 'shuntSettings'],
    important: ['NPH_triad', 'gaitAssessment', 'cognitiveAssessment']
  }
};

/**
 * Calculate completeness score for a discharge summary
 *
 * @param {Object} narrative - Generated narrative sections
 * @param {Object} extractedData - Extracted medical data
 * @param {Object} options - Scoring options
 * @returns {Object} Completeness score with details
 */
export function calculateCompletenessScore(narrative, extractedData, options = {}) {
  const {
    pathologyType = null,
    strictMode = false
  } = options;

  const issues = [];
  let totalPoints = 0;
  let maxPoints = 0;

  // 1. Check critical sections (50% of completeness)
  const criticalScore = checkCriticalSections(narrative, extractedData);
  totalPoints += criticalScore.points * 0.5;
  maxPoints += criticalScore.maxPoints * 0.5;
  issues.push(...criticalScore.issues);

  // 2. Check important sections (30% of completeness)
  const importantScore = checkImportantSections(narrative, extractedData);
  totalPoints += importantScore.points * 0.3;
  maxPoints += importantScore.maxPoints * 0.3;
  issues.push(...importantScore.issues);

  // 3. Check field completeness within sections (15% of completeness)
  const fieldScore = checkFieldCompleteness(extractedData);
  totalPoints += fieldScore.points * 0.15;
  maxPoints += fieldScore.maxPoints * 0.15;
  issues.push(...fieldScore.issues);

  // 4. Check pathology-specific requirements (5% of completeness)
  if (pathologyType) {
    const pathologyScore = checkPathologyRequirements(extractedData, pathologyType);
    totalPoints += pathologyScore.points * 0.05;
    maxPoints += pathologyScore.maxPoints * 0.05;
    issues.push(...pathologyScore.issues);
  } else {
    // If no pathology type, give full points for this category
    totalPoints += 0.05;
    maxPoints += 0.05;
  }

  const score = maxPoints > 0 ? totalPoints / maxPoints : 0;

  // Apply strict mode penalty
  if (strictMode && issues.some(i => i.severity === 'critical')) {
    const penalty = 0.1; // 10% penalty for any critical issues
    const adjustedScore = Math.max(0, score - penalty);

    return {
      score: adjustedScore,
      rawScore: score,
      weight: 0.30,
      weighted: adjustedScore * 0.30,
      issues,
      details: {
        criticalSections: criticalScore,
        importantSections: importantScore,
        fieldCompleteness: fieldScore,
        pathologySpecific: pathologyType ? checkPathologyRequirements(extractedData, pathologyType) : null,
        penaltyApplied: true
      }
    };
  }

  return {
    score,
    weight: 0.30,
    weighted: score * 0.30,
    issues,
    details: {
      criticalSections: criticalScore,
      importantSections: importantScore,
      fieldCompleteness: fieldScore,
      pathologySpecific: pathologyType ? checkPathologyRequirements(extractedData, pathologyType) : null
    }
  };
}

/**
 * Check presence and completeness of critical sections
 */
function checkCriticalSections(narrative, extractedData) {
  const issues = [];
  let points = 0;
  const maxPoints = CRITICAL_SECTIONS.length;

  for (const section of CRITICAL_SECTIONS) {
    if (isSectionPresent(section, narrative, extractedData)) {
      points++;
    } else {
      issues.push({
        type: 'MISSING_CRITICAL_SECTION',
        section,
        severity: 'critical',
        impact: -0.05, // 5% impact per missing critical section
        suggestion: `Add ${formatSectionName(section)} to the discharge summary`
      });
    }
  }

  return { points, maxPoints, issues };
}

/**
 * Check presence of important sections
 */
function checkImportantSections(narrative, extractedData) {
  const issues = [];
  let points = 0;
  const maxPoints = IMPORTANT_SECTIONS.length;

  for (const section of IMPORTANT_SECTIONS) {
    if (isSectionPresent(section, narrative, extractedData)) {
      points++;
    } else {
      issues.push({
        type: 'MISSING_IMPORTANT_SECTION',
        section,
        severity: 'major',
        impact: -0.02, // 2% impact per missing important section
        suggestion: `Consider adding ${formatSectionName(section)}`
      });
    }
  }

  return { points, maxPoints, issues };
}

/**
 * Check completeness of fields within sections
 */
function checkFieldCompleteness(extractedData) {
  const issues = [];
  let totalFields = 0;
  let completedFields = 0;

  // Check demographics completeness
  if (extractedData.demographics) {
    const demoFields = ['name', 'mrn', 'age', 'gender', 'attendingPhysician'];
    for (const field of demoFields) {
      totalFields++;
      if (extractedData.demographics[field]) {
        completedFields++;
      } else {
        issues.push({
          type: 'INCOMPLETE_FIELD',
          section: 'demographics',
          field,
          severity: 'minor',
          impact: -0.01
        });
      }
    }
  }

  // Check dates completeness
  if (extractedData.dates) {
    const dateFields = ['admissionDate', 'dischargeDate'];
    for (const field of dateFields) {
      totalFields++;
      if (extractedData.dates[field]) {
        completedFields++;
      } else {
        issues.push({
          type: 'INCOMPLETE_FIELD',
          section: 'dates',
          field,
          severity: field === 'dischargeDate' ? 'critical' : 'major',
          impact: -0.02
        });
      }
    }
  }

  // Check medications completeness
  if (extractedData.medications?.medications) {
    const meds = extractedData.medications.medications;
    totalFields += meds.length * 3; // name, dose, frequency

    for (const med of meds) {
      if (med.name || med) completedFields++;
      else issues.push({
        type: 'INCOMPLETE_MEDICATION',
        field: 'name',
        severity: 'critical',
        impact: -0.02
      });

      if (med.dose || med.doseWithUnit) completedFields++;
      else issues.push({
        type: 'INCOMPLETE_MEDICATION',
        field: 'dose',
        severity: 'major',
        impact: -0.01
      });

      if (med.frequency) completedFields++;
      else issues.push({
        type: 'INCOMPLETE_MEDICATION',
        field: 'frequency',
        severity: 'minor',
        impact: -0.005
      });
    }
  }

  const points = totalFields > 0 ? completedFields : 1;
  const maxPoints = totalFields > 0 ? totalFields : 1;

  return { points, maxPoints, issues };
}

/**
 * Check pathology-specific requirements
 */
function checkPathologyRequirements(extractedData, pathologyType) {
  const requirements = PATHOLOGY_REQUIREMENTS[pathologyType];
  if (!requirements) {
    return { points: 1, maxPoints: 1, issues: [] };
  }

  const issues = [];
  let points = 0;
  let maxPoints = 0;

  // Check required fields
  if (requirements.required) {
    maxPoints += requirements.required.length * 2; // Required fields worth double

    for (const field of requirements.required) {
      if (hasPathologyField(extractedData, field)) {
        points += 2;
      } else {
        issues.push({
          type: 'MISSING_PATHOLOGY_FIELD',
          pathology: pathologyType,
          field,
          severity: 'major',
          impact: -0.03,
          suggestion: `Add ${field} for ${pathologyType} case`
        });
      }
    }
  }

  // Check important fields
  if (requirements.important) {
    maxPoints += requirements.important.length;

    for (const field of requirements.important) {
      if (hasPathologyField(extractedData, field)) {
        points++;
      } else {
        issues.push({
          type: 'MISSING_PATHOLOGY_FIELD',
          pathology: pathologyType,
          field,
          severity: 'minor',
          impact: -0.01,
          suggestion: `Consider adding ${field}`
        });
      }
    }
  }

  return { points, maxPoints, issues };
}

/**
 * Helper: Check if a section is present in narrative or extracted data
 */
function isSectionPresent(section, narrative, extractedData) {
  // Check narrative first
  // IMPORTANT: Accept empty string as "present" to recognize sections that exist but have no data
  if (narrative && narrative.hasOwnProperty(section)) {
    // Section exists in narrative (even if empty string)
    // This allows us to detect that the section was intentionally included
    return true;
  }

  // Check extracted data
  if (extractedData && extractedData[section]) {
    // Check if the section has content
    const value = extractedData[section];

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === 'object' && value !== null) {
      return Object.keys(value).length > 0;
    }

    return Boolean(value);
  }

  // Special cases
  if (section === 'primaryDiagnosis') {
    return extractedData?.pathology?.primaryDiagnosis ||
           extractedData?.pathology?.primary;
  }

  if (section === 'hospitalCourse') {
    return narrative?.hospitalCourse ||
           extractedData?.hospitalCourse ||
           extractedData?.clinicalCourse;
  }

  return false;
}

/**
 * Helper: Check if a pathology-specific field exists
 */
function hasPathologyField(extractedData, field) {
  // Search in various locations where pathology fields might be
  const locations = [
    extractedData.pathology,
    extractedData.grades,
    extractedData.scores,
    extractedData.imaging,
    extractedData.procedures,
    extractedData.functionalScores
  ];

  for (const location of locations) {
    if (location && location[field]) {
      return true;
    }
  }

  // Check in narrative for specific mentions
  if (extractedData.narrative) {
    const narrative = JSON.stringify(extractedData.narrative).toLowerCase();
    return narrative.includes(field.toLowerCase());
  }

  return false;
}

/**
 * Helper: Format section name for display
 */
function formatSectionName(section) {
  const formatted = section.replace(/([A-Z])/g, ' $1').toLowerCase();
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export default {
  calculateCompletenessScore,
  CRITICAL_SECTIONS,
  IMPORTANT_SECTIONS,
  PATHOLOGY_REQUIREMENTS
};