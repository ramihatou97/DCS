/**
 * Narrative Quality Scorer - 6-Dimension Quality Metrics
 *
 * Evaluates the linguistic and structural quality of the narrative by checking:
 * - Flow and transitions between sections
 * - Medical terminology usage
 * - Clarity and conciseness
 * - Professional tone
 * - Logical organization
 *
 * Weight: 15% of overall quality score
 *
 * @module narrativeQualityScorer
 */

/**
 * Calculate narrative quality score for discharge summary
 *
 * @param {Object} narrative - Generated narrative
 * @param {Object} extractedData - Extracted medical data
 * @param {Object} options - Scoring options
 * @returns {Object} Narrative quality score with details
 */
export function calculateNarrativeQualityScore(narrative, extractedData, options = {}) {
  const {
    checkReadability = true,
    checkProfessionalism = true
  } = options;

  const issues = [];
  let totalPoints = 0;
  let maxPoints = 0;

  // 1. Flow and transitions (25% of narrative quality)
  const flowScore = evaluateFlowAndTransitions(narrative);
  totalPoints += flowScore.points * 0.25;
  maxPoints += flowScore.maxPoints * 0.25;
  issues.push(...flowScore.issues);

  // 2. Medical terminology (20% of narrative quality)
  const terminologyScore = evaluateMedicalTerminology(narrative);
  totalPoints += terminologyScore.points * 0.20;
  maxPoints += terminologyScore.maxPoints * 0.20;
  issues.push(...terminologyScore.issues);

  // 3. Clarity and conciseness (20% of narrative quality)
  const clarityScore = evaluateClarityAndConciseness(narrative);
  totalPoints += clarityScore.points * 0.20;
  maxPoints += clarityScore.maxPoints * 0.20;
  issues.push(...clarityScore.issues);

  // 4. Professional tone (15% of narrative quality)
  if (checkProfessionalism) {
    const toneScore = evaluateProfessionalTone(narrative);
    totalPoints += toneScore.points * 0.15;
    maxPoints += toneScore.maxPoints * 0.15;
    issues.push(...toneScore.issues);
  } else {
    totalPoints += 0.15;
    maxPoints += 0.15;
  }

  // 5. Organization and structure (10% of narrative quality)
  const structureScore = evaluateOrganization(narrative);
  totalPoints += structureScore.points * 0.10;
  maxPoints += structureScore.maxPoints * 0.10;
  issues.push(...structureScore.issues);

  // 6. Readability (10% of narrative quality)
  if (checkReadability) {
    const readabilityScore = evaluateReadability(narrative);
    totalPoints += readabilityScore.points * 0.10;
    maxPoints += readabilityScore.maxPoints * 0.10;
    issues.push(...readabilityScore.issues);
  } else {
    totalPoints += 0.10;
    maxPoints += 0.10;
  }

  const score = maxPoints > 0 ? totalPoints / maxPoints : 0;

  return {
    score,
    weight: 0.15,
    weighted: score * 0.15,
    issues,
    details: {
      flowAndTransitions: flowScore,
      medicalTerminology: terminologyScore,
      clarityAndConciseness: clarityScore,
      professionalTone: checkProfessionalism ? evaluateProfessionalTone(narrative) : null,
      organization: structureScore,
      readability: checkReadability ? evaluateReadability(narrative) : null
    }
  };
}

/**
 * Evaluate flow and transitions between sections
 */
function evaluateFlowAndTransitions(narrative) {
  const issues = [];
  let points = 0;
  let maxPoints = 0;

  if (!narrative || typeof narrative !== 'object') {
    return { points: 1, maxPoints: 1, issues: [] };
  }

  // Check for transition phrases
  const transitionPhrases = [
    'subsequently',
    'following',
    'thereafter',
    'as a result',
    'consequently',
    'furthermore',
    'additionally',
    'however',
    'despite',
    'although'
  ];

  const sections = [
    narrative.clinicalPresentation,
    narrative.hospitalCourse,
    narrative.procedures,
    narrative.complications,
    narrative.discharge
  ].filter(Boolean);

  // Check each section for transitions
  for (const section of sections) {
    maxPoints++;
    const sectionText = typeof section === 'string' ? section : JSON.stringify(section);
    const sectionLower = sectionText.toLowerCase();

    const hasTransitions = transitionPhrases.some(phrase => sectionLower.includes(phrase));

    if (hasTransitions) {
      points++;
    } else if (sectionText.length > 200) { // Only flag if section is substantial
      issues.push({
        type: 'LACKS_TRANSITIONS',
        severity: 'minor',
        impact: -0.01,
        suggestion: 'Add transitional phrases to improve flow'
      });
    } else {
      points++; // Short sections don't need many transitions
    }
  }

  // Check chronological flow
  maxPoints++;
  const chronologicalMarkers = ['initially', 'on admission', 'post-operatively',
                                'on day', 'by discharge', 'at follow-up'];

  const narrativeText = JSON.stringify(narrative).toLowerCase();
  const hasChronology = chronologicalMarkers.filter(marker =>
    narrativeText.includes(marker)
  ).length >= 2;

  if (hasChronology) {
    points++;
  } else {
    issues.push({
      type: 'WEAK_CHRONOLOGY',
      severity: 'minor',
      impact: -0.01,
      suggestion: 'Add temporal markers to establish chronology'
    });
  }

  // Check section connectivity
  maxPoints++;
  if (narrative.hospitalCourse && narrative.clinicalPresentation) {
    const presentationText = typeof narrative.clinicalPresentation === 'string' ?
                           narrative.clinicalPresentation : JSON.stringify(narrative.clinicalPresentation);
    const courseText = typeof narrative.hospitalCourse === 'string' ?
                      narrative.hospitalCourse : JSON.stringify(narrative.hospitalCourse);

    // Hospital course should reference presenting symptoms
    const connectedSections = presentationText.length > 0 && courseText.length > 0 &&
      (courseText.toLowerCase().includes('present') ||
       courseText.toLowerCase().includes('admission') ||
       courseText.toLowerCase().includes('initial'));

    if (connectedSections) {
      points++;
    } else {
      issues.push({
        type: 'DISCONNECTED_SECTIONS',
        severity: 'minor',
        impact: -0.01,
        suggestion: 'Connect hospital course to presenting symptoms'
      });
    }
  } else {
    points++; // No penalty if sections missing
  }

  return { points, maxPoints, issues };
}

/**
 * Evaluate medical terminology usage
 */
function evaluateMedicalTerminology(narrative) {
  const issues = [];
  let points = 0;
  let maxPoints = 0;

  if (!narrative || typeof narrative !== 'object') {
    return { points: 1, maxPoints: 1, issues: [] };
  }

  const narrativeText = JSON.stringify(narrative).toLowerCase();

  // Check for appropriate medical terms
  const medicalTerms = [
    // Anatomical
    'anterior', 'posterior', 'lateral', 'medial', 'superior', 'inferior',
    'proximal', 'distal', 'ipsilateral', 'contralateral', 'bilateral',
    // Clinical
    'acute', 'chronic', 'stable', 'progressive', 'refractory', 'benign', 'malignant',
    // Procedural
    'resection', 'excision', 'decompression', 'reconstruction', 'anastomosis',
    // Diagnostic
    'differential', 'etiology', 'pathophysiology', 'prognosis', 'sequelae'
  ];

  // Count medical terms usage
  const termsUsed = medicalTerms.filter(term => narrativeText.includes(term));
  const termDensity = termsUsed.length / medicalTerms.length;

  maxPoints++;
  if (termDensity >= 0.3) { // At least 30% of terms used
    points++;
  } else if (termDensity >= 0.15) {
    points += 0.5;
    issues.push({
      type: 'LIMITED_MEDICAL_TERMINOLOGY',
      density: termDensity,
      severity: 'minor',
      impact: -0.01,
      suggestion: 'Use more precise medical terminology'
    });
  } else {
    issues.push({
      type: 'INSUFFICIENT_MEDICAL_TERMINOLOGY',
      density: termDensity,
      severity: 'major',
      impact: -0.02,
      suggestion: 'Increase use of medical terminology for professional documentation'
    });
  }

  // Check for colloquialisms (should not be present)
  maxPoints++;
  const colloquialisms = [
    'got better', 'got worse', 'pretty good', 'really bad',
    'a lot of', 'tons of', 'huge', 'tiny', 'okay', 'fine'
  ];

  const hasColloquialisms = colloquialisms.some(term => narrativeText.includes(term));

  if (!hasColloquialisms) {
    points++;
  } else {
    issues.push({
      type: 'COLLOQUIAL_LANGUAGE',
      severity: 'major',
      impact: -0.02,
      suggestion: 'Replace colloquial terms with medical terminology'
    });
  }

  // Check abbreviation usage
  maxPoints++;
  const commonAbbreviations = [
    'ct', 'mri', 'eeg', 'ecg', 'cbc', 'bmp', 'lfts',
    'icu', 'or', 'ed', 'snf', 'ot', 'pt', 'prn', 'bid', 'tid'
  ];

  const abbreviationsUsed = commonAbbreviations.filter(abbr =>
    narrativeText.includes(` ${abbr} `) || narrativeText.includes(` ${abbr}.`)
  );

  if (abbreviationsUsed.length > 0) {
    points++;
  } else {
    points += 0.5; // Not critical if no abbreviations
  }

  return { points, maxPoints, issues };
}

/**
 * Evaluate clarity and conciseness
 */
function evaluateClarityAndConciseness(narrative) {
  const issues = [];
  let points = 0;
  let maxPoints = 0;

  if (!narrative || typeof narrative !== 'object') {
    return { points: 1, maxPoints: 1, issues: [] };
  }

  const sections = Object.values(narrative).filter(v =>
    typeof v === 'string' && v.length > 0
  );

  for (const section of sections) {
    // Check sentence length
    maxPoints++;
    const sentences = section.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;

    if (avgSentenceLength <= 25) { // Medical writing should be concise
      points++;
    } else if (avgSentenceLength <= 35) {
      points += 0.5;
      issues.push({
        type: 'LONG_SENTENCES',
        avgLength: Math.round(avgSentenceLength),
        severity: 'minor',
        impact: -0.01,
        suggestion: 'Break up long sentences for clarity'
      });
    } else {
      issues.push({
        type: 'EXCESSIVE_SENTENCE_LENGTH',
        avgLength: Math.round(avgSentenceLength),
        severity: 'major',
        impact: -0.02,
        suggestion: 'Significantly shorten sentences for better readability'
      });
    }

    // Check for redundancy
    maxPoints++;
    const redundantPhrases = [
      'in order to',
      'at this point in time',
      'due to the fact that',
      'in the event that',
      'for the purpose of',
      'with regard to'
    ];

    const hasRedundancy = redundantPhrases.some(phrase => section.toLowerCase().includes(phrase));

    if (!hasRedundancy) {
      points++;
    } else {
      issues.push({
        type: 'REDUNDANT_PHRASES',
        severity: 'minor',
        impact: -0.01,
        suggestion: 'Remove redundant phrases for conciseness'
      });
    }

    // Check for passive voice overuse
    maxPoints++;
    const passiveIndicators = ['was given', 'was performed', 'was noted',
                              'was found', 'were obtained', 'was administered'];
    const passiveCount = passiveIndicators.filter(phrase =>
      section.toLowerCase().includes(phrase)
    ).length;

    const sentenceCount = sentences.length;
    const passiveRatio = sentenceCount > 0 ? passiveCount / sentenceCount : 0;

    if (passiveRatio <= 0.3) { // Less than 30% passive
      points++;
    } else if (passiveRatio <= 0.5) {
      points += 0.5;
      issues.push({
        type: 'EXCESSIVE_PASSIVE_VOICE',
        ratio: passiveRatio,
        severity: 'minor',
        impact: -0.01,
        suggestion: 'Use more active voice for clarity'
      });
    } else {
      issues.push({
        type: 'OVERUSE_PASSIVE_VOICE',
        ratio: passiveRatio,
        severity: 'major',
        impact: -0.02,
        suggestion: 'Rewrite using active voice'
      });
    }
  }

  return { points, maxPoints, issues };
}

/**
 * Evaluate professional tone
 */
function evaluateProfessionalTone(narrative) {
  const issues = [];
  let points = 0;
  let maxPoints = 0;

  if (!narrative || typeof narrative !== 'object') {
    return { points: 1, maxPoints: 1, issues: [] };
  }

  const narrativeText = JSON.stringify(narrative).toLowerCase();

  // Check for unprofessional language
  maxPoints++;
  const unprofessionalTerms = [
    'unfortunately', 'sadly', 'hopefully', 'luckily',
    'amazing', 'terrible', 'horrible', 'fantastic',
    'obviously', 'clearly', 'of course'
  ];

  const hasUnprofessional = unprofessionalTerms.some(term => narrativeText.includes(term));

  if (!hasUnprofessional) {
    points++;
  } else {
    issues.push({
      type: 'UNPROFESSIONAL_LANGUAGE',
      severity: 'major',
      impact: -0.02,
      suggestion: 'Remove emotional or subjective language'
    });
  }

  // Check for first person usage (should not be present)
  maxPoints++;
  const firstPerson = ['i ', 'we ', 'our ', 'my ', 'me '];
  const hasFirstPerson = firstPerson.some(pronoun => narrativeText.includes(pronoun));

  if (!hasFirstPerson) {
    points++;
  } else {
    issues.push({
      type: 'FIRST_PERSON_USAGE',
      severity: 'major',
      impact: -0.02,
      suggestion: 'Remove first person pronouns'
    });
  }

  // Check for appropriate formality
  maxPoints++;
  const informalContractions = ["don't", "won't", "can't", "couldn't", "shouldn't",
                                "wouldn't", "isn't", "aren't", "wasn't", "weren't"];
  const hasContractions = informalContractions.some(contraction =>
    narrativeText.includes(contraction)
  );

  if (!hasContractions) {
    points++;
  } else {
    issues.push({
      type: 'INFORMAL_CONTRACTIONS',
      severity: 'minor',
      impact: -0.01,
      suggestion: 'Expand contractions for formal documentation'
    });
  }

  return { points, maxPoints, issues };
}

/**
 * Evaluate organization and structure
 */
function evaluateOrganization(narrative) {
  const issues = [];
  let points = 0;
  let maxPoints = 0;

  if (!narrative || typeof narrative !== 'object') {
    return { points: 1, maxPoints: 1, issues: [] };
  }

  // Check logical section order
  const expectedOrder = [
    'clinicalPresentation',
    'hospitalCourse',
    'procedures',
    'complications',
    'consultations',
    'discharge'
  ];

  const presentSections = expectedOrder.filter(section => narrative[section]);

  maxPoints++;
  if (presentSections.length >= 4) { // At least 4 major sections
    points++;
  } else if (presentSections.length >= 3) {
    points += 0.5;
    issues.push({
      type: 'LIMITED_SECTIONS',
      count: presentSections.length,
      severity: 'minor',
      impact: -0.01,
      suggestion: 'Add more sections for comprehensive documentation'
    });
  } else {
    issues.push({
      type: 'INSUFFICIENT_SECTIONS',
      count: presentSections.length,
      severity: 'major',
      impact: -0.02,
      suggestion: 'Include standard discharge summary sections'
    });
  }

  // Check section balance (no section too dominant)
  if (presentSections.length >= 2) {
    maxPoints++;
    const sectionLengths = presentSections.map(section => {
      const content = narrative[section];
      return typeof content === 'string' ? content.length : JSON.stringify(content).length;
    });

    const totalLength = sectionLengths.reduce((a, b) => a + b, 0);
    const maxSectionLength = Math.max(...sectionLengths);
    const dominance = maxSectionLength / totalLength;

    if (dominance <= 0.5) { // No section more than 50% of total
      points++;
    } else if (dominance <= 0.7) {
      points += 0.5;
      issues.push({
        type: 'UNBALANCED_SECTIONS',
        dominance: dominance,
        severity: 'minor',
        impact: -0.01,
        suggestion: 'Balance content across sections'
      });
    } else {
      issues.push({
        type: 'SECTION_DOMINANCE',
        dominance: dominance,
        severity: 'major',
        impact: -0.02,
        suggestion: 'Redistribute content for better organization'
      });
    }
  }

  return { points, maxPoints, issues };
}

/**
 * Evaluate readability using simple metrics
 */
function evaluateReadability(narrative) {
  const issues = [];
  let points = 0;
  let maxPoints = 0;

  if (!narrative || typeof narrative !== 'object') {
    return { points: 1, maxPoints: 1, issues: [] };
  }

  const fullText = Object.values(narrative)
    .filter(v => typeof v === 'string')
    .join(' ');

  if (fullText.length < 100) {
    return { points: 1, maxPoints: 1, issues: [] };
  }

  // Simple readability checks
  const words = fullText.split(/\s+/).filter(w => w.length > 0);
  const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 0);

  // Average words per sentence
  maxPoints++;
  const avgWordsPerSentence = words.length / sentences.length;

  if (avgWordsPerSentence <= 20) {
    points++;
  } else if (avgWordsPerSentence <= 30) {
    points += 0.5;
    issues.push({
      type: 'MODERATE_COMPLEXITY',
      avgWords: Math.round(avgWordsPerSentence),
      severity: 'minor',
      impact: -0.01
    });
  } else {
    issues.push({
      type: 'HIGH_COMPLEXITY',
      avgWords: Math.round(avgWordsPerSentence),
      severity: 'major',
      impact: -0.02,
      suggestion: 'Simplify sentence structure'
    });
  }

  // Check for very long words (medical terms excluded)
  maxPoints++;
  const nonMedicalLongWords = words.filter(word =>
    word.length > 15 &&
    !word.includes('ectomy') &&
    !word.includes('ography') &&
    !word.includes('oscopy')
  );

  if (nonMedicalLongWords.length === 0) {
    points++;
  } else if (nonMedicalLongWords.length <= 3) {
    points += 0.5;
  } else {
    issues.push({
      type: 'EXCESSIVE_LONG_WORDS',
      count: nonMedicalLongWords.length,
      severity: 'minor',
      impact: -0.01
    });
  }

  return { points, maxPoints, issues };
}

export default {
  calculateNarrativeQualityScore
};