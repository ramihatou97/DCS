/**
 * Pathology Subtypes Detection & Clinical Intelligence
 *
 * Phase 1 Step 6: Pathology Subtypes Detection
 *
 * Provides:
 * - Detailed subtype detection for each pathology
 * - Clinical prognostic indicators
 * - Treatment recommendations
 * - Risk stratification
 * - Follow-up protocols
 *
 * Critical for actionable clinical insights in discharge summaries
 */

import { GRADING_SCALES, COMPLICATION_PROTOCOLS } from '../services/knowledge/knowledgeBase.js';
import { PATHOLOGY_TYPES } from '../config/pathologyPatterns.js';

/**
 * Aneurysm location patterns and classifications
 */
export const ANEURYSM_LOCATIONS = {
  // Anterior Circulation
  ACA: {
    name: 'Anterior Communicating Artery',
    patterns: [
      /\b(?:anterior\s+communicating|AComm?|A-?Comm?|ACA)\s+(?:artery\s+)?aneurysm/i,
      /aneurysm\s+(?:of|at|in)\s+(?:the\s+)?(?:anterior\s+communicating|AComm?)/i
    ],
    riskFactors: ['Cognitive deficits', 'Hydrocephalus'],
    surgicalDifficulty: 'MODERATE'
  },
  PCOMM: {
    name: 'Posterior Communicating Artery',
    patterns: [
      /\b(?:posterior\s+communicating|PComm?|P-?Comm?)\s+(?:artery\s+)?aneurysm/i,
      /aneurysm\s+(?:of|at|in)\s+(?:the\s+)?(?:posterior\s+communicating|PComm?)/i
    ],
    riskFactors: ['CN III palsy', 'Carotid cave location'],
    surgicalDifficulty: 'MODERATE'
  },
  MCA: {
    name: 'Middle Cerebral Artery',
    patterns: [
      /\b(?:MCA|middle\s+cerebral\s+artery)\s+(?:bifurcation\s+)?aneurysm/i,
      /aneurysm\s+(?:of|at|in)\s+(?:the\s+)?(?:MCA|middle\s+cerebral)/i
    ],
    riskFactors: ['Aphasia (dominant hemisphere)', 'Hemiparesis'],
    surgicalDifficulty: 'LOW'
  },
  ICA: {
    name: 'Internal Carotid Artery',
    patterns: [
      /\b(?:ICA|internal\s+carotid\s+artery)\s+aneurysm/i,
      /(?:carotid\s+terminus|ICA\s+terminus)\s+aneurysm/i,
      /ophthalmic\s+(?:artery\s+)?aneurysm/i
    ],
    riskFactors: ['Visual deficits', 'Complex anatomy'],
    surgicalDifficulty: 'HIGH'
  },
  // Posterior Circulation
  BASILAR: {
    name: 'Basilar Artery',
    patterns: [
      /\bbasilar\s+(?:artery\s+|tip\s+)?aneurysm/i,
      /aneurysm\s+(?:of|at|in)\s+(?:the\s+)?basilar/i
    ],
    riskFactors: ['Brainstem compression', 'Hydrocephalus', 'High mortality'],
    surgicalDifficulty: 'VERY HIGH'
  },
  PICA: {
    name: 'Posterior Inferior Cerebellar Artery',
    patterns: [
      /\bPICA\s+aneurysm/i,
      /posterior\s+inferior\s+cerebellar\s+artery\s+aneurysm/i
    ],
    riskFactors: ['Lower cranial nerve deficits', 'Lateral medullary syndrome'],
    surgicalDifficulty: 'HIGH'
  }
};

/**
 * Aneurysm size classification
 */
export const ANEURYSM_SIZES = {
  SMALL: { range: [0, 7], name: 'Small', riskLevel: 'LOW', ruptureRisk: '<1% per year' },
  LARGE: { range: [7, 25], name: 'Large', riskLevel: 'MODERATE', ruptureRisk: '2-5% per year' },
  GIANT: { range: [25, Infinity], name: 'Giant', riskLevel: 'HIGH', ruptureRisk: '>5% per year' }
};

/**
 * Brain tumor WHO grades and prognosis
 */
export const TUMOR_GRADES = {
  WHO_I: {
    name: 'WHO Grade I',
    patterns: [
      /\bWHO\s+(?:grade\s+)?(?:I|1)\b/i,
      /\b(?:grade\s+)?(?:I|1)\s+(?:tumor|glioma|astrocytoma)/i,
      /pilocytic\s+astrocytoma/i
    ],
    prognosis: {
      survival: '90-95% 5-year survival',
      malignancy: 'Benign',
      growth: 'Slow-growing'
    },
    treatment: ['Gross total resection curative', 'No adjuvant therapy typically needed'],
    riskLevel: 'LOW'
  },
  WHO_II: {
    name: 'WHO Grade II',
    patterns: [
      /\bWHO\s+(?:grade\s+)?(?:II|2)\b/i,
      /\b(?:grade\s+)?(?:II|2)\s+(?:tumor|glioma|astrocytoma)/i,
      /diffuse\s+astrocytoma/i,
      /oligodendroglioma/i
    ],
    prognosis: {
      survival: '5-8 years median survival',
      malignancy: 'Low-grade malignant',
      growth: 'Slow but infiltrative'
    },
    treatment: ['Maximal safe resection', 'Consider RT if <40yo, STR, or poor molecular markers'],
    riskLevel: 'MODERATE'
  },
  WHO_III: {
    name: 'WHO Grade III',
    patterns: [
      /\bWHO\s+(?:grade\s+)?(?:III|3)\b/i,
      /\b(?:grade\s+)?(?:III|3)\s+(?:tumor|glioma|astrocytoma)/i,
      /anaplastic\s+(?:astrocytoma|oligodendroglioma)/i
    ],
    prognosis: {
      survival: '2-3 years median survival',
      malignancy: 'Malignant',
      growth: 'Rapid, anaplastic features'
    },
    treatment: ['Maximal safe resection', 'RT + Temozolomide', 'PCV for oligodendroglioma'],
    riskLevel: 'HIGH'
  },
  WHO_IV: {
    name: 'WHO Grade IV',
    patterns: [
      /\bWHO\s+(?:grade\s+)?(?:IV|4)\b/i,
      /\b(?:grade\s+)?(?:IV|4)\s+(?:tumor|glioma)/i,
      /glioblastoma/i,
      /\bGBM\b/i
    ],
    prognosis: {
      survival: '15-18 months median survival',
      malignancy: 'Highly malignant',
      growth: 'Aggressive, necrosis, vascular proliferation'
    },
    treatment: ['Maximal safe resection', 'Stupp protocol: RT + concurrent/adjuvant TMZ', 'TTFields if eligible'],
    riskLevel: 'VERY HIGH'
  }
};

/**
 * Molecular markers and their prognostic significance
 */
export const MOLECULAR_MARKERS = {
  IDH_MUTANT: {
    name: 'IDH Mutation',
    patterns: [
      /\bIDH\s+mutant/i,
      /\bIDH[12]\s+mutation/i,
      /\bIDH\s+positive/i
    ],
    significance: 'IDH-mutant gliomas have 2-3x longer survival',
    prognosis: 'FAVORABLE',
    impact: '+50-100% survival improvement'
  },
  IDH_WILDTYPE: {
    name: 'IDH Wildtype',
    patterns: [
      /\bIDH\s+wild-?type/i,
      /\bIDH\s+negative/i
    ],
    significance: 'IDH-wildtype associated with worse prognosis',
    prognosis: 'UNFAVORABLE',
    impact: 'Standard prognosis for grade'
  },
  MGMT_METHYLATED: {
    name: 'MGMT Promoter Methylation',
    patterns: [
      /\bMGMT\s+methylated/i,
      /\bMGMT\s+promoter\s+methylation/i,
      /\bMGMT\s+positive/i
    ],
    significance: 'Predicts response to temozolomide chemotherapy',
    prognosis: 'FAVORABLE',
    impact: '+30-40% improvement in response to TMZ'
  },
  CODELETION_1P19Q: {
    name: '1p/19q Codeletion',
    patterns: [
      /\b1p[\/\\]19q\s+co-?deletion/i,
      /\b1p[\/\\]19q\s+co-?deleted/i
    ],
    significance: 'Defines oligodendroglioma, excellent chemo/RT sensitivity',
    prognosis: 'FAVORABLE',
    impact: 'Significantly improved survival with treatment'
  }
};

/**
 * Resection extent and impact on survival
 */
export const RESECTION_EXTENT = {
  GTR: {
    name: 'Gross Total Resection',
    patterns: [/\bGTR\b/i, /gross\s+total\s+resection/i],
    survival: '+20-30% improvement',
    riskLevel: 'OPTIMAL'
  },
  NTR: {
    name: 'Near Total Resection',
    patterns: [/\bNTR\b/i, /near\s+total\s+resection/i, />95%\s+resection/i],
    survival: '+15-20% improvement',
    riskLevel: 'GOOD'
  },
  STR: {
    name: 'Subtotal Resection',
    patterns: [/\bSTR\b/i, /subtotal\s+resection/i, /partial\s+resection/i],
    survival: '+10-15% improvement',
    riskLevel: 'MODERATE'
  },
  BIOPSY: {
    name: 'Biopsy Only',
    patterns: [/biopsy\s+only/i, /stereotactic\s+biopsy/i],
    survival: 'No survival benefit',
    riskLevel: 'POOR'
  }
};

/**
 * ASIA Impairment Scale for spine injuries
 */
export const ASIA_GRADES = {
  A: {
    name: 'ASIA A - Complete',
    patterns: [/\bASIA\s+A\b/i, /complete\s+spinal\s+cord\s+injury/i],
    prognosis: {
      recovery: '<5% chance of meaningful recovery',
      ambulation: 'Non-ambulatory',
      independence: 'Requires significant assistance'
    },
    riskLevel: 'VERY HIGH'
  },
  B: {
    name: 'ASIA B - Sensory Incomplete',
    patterns: [/\bASIA\s+B\b/i],
    prognosis: {
      recovery: '10-20% chance of motor recovery',
      ambulation: 'Likely non-ambulatory',
      independence: 'Requires moderate assistance'
    },
    riskLevel: 'HIGH'
  },
  C: {
    name: 'ASIA C - Motor Incomplete',
    patterns: [/\bASIA\s+C\b/i],
    prognosis: {
      recovery: '50-60% chance of significant motor recovery',
      ambulation: '30-50% achieve ambulation',
      independence: 'Variable, often requires assistive devices'
    },
    riskLevel: 'MODERATE'
  },
  D: {
    name: 'ASIA D - Motor Incomplete',
    patterns: [/\bASIA\s+D\b/i],
    prognosis: {
      recovery: '>80% achieve significant motor recovery',
      ambulation: '>80% achieve functional ambulation',
      independence: 'Often achieves independence'
    },
    riskLevel: 'LOW'
  },
  E: {
    name: 'ASIA E - Normal',
    patterns: [/\bASIA\s+E\b/i],
    prognosis: {
      recovery: 'Normal function',
      ambulation: 'Normal',
      independence: 'Independent'
    },
    riskLevel: 'MINIMAL'
  }
};

/**
 * Calculate vasospasm risk based on Fisher grade
 */
export function calculateVasospasmRisk(fisherGrade) {
  const risks = {
    '1': { percentage: '5-10%', level: 'LOW' },
    '2': { percentage: '15-20%', level: 'LOW' },
    '3': { percentage: '60-70%', level: 'HIGH' },
    '4': { percentage: '30-40%', level: 'MODERATE' }
  };

  return risks[String(fisherGrade)] || { percentage: 'Unknown', level: 'MODERATE' };
}

/**
 * Calculate prognosis based on Hunt & Hess grade
 */
export function calculateHuntHessPrognosis(huntHessGrade) {
  const prognosis = {
    '1': { mortality: '5-10%', goodOutcome: '85-90%', riskLevel: 'LOW' },
    '2': { mortality: '10-15%', goodOutcome: '75-80%', riskLevel: 'LOW' },
    '3': { mortality: '15-20%', goodOutcome: '60-70%', riskLevel: 'MODERATE' },
    '4': { mortality: '40-50%', goodOutcome: '30-40%', riskLevel: 'HIGH' },
    '5': { mortality: '60-70%', goodOutcome: '10-20%', riskLevel: 'VERY HIGH' }
  };

  return prognosis[String(huntHessGrade)] || { mortality: 'Unknown', goodOutcome: 'Unknown', riskLevel: 'MODERATE' };
}

/**
 * Calculate glioblastoma prognosis based on factors
 */
export function calculateGBMPrognosis(factors = {}) {
  const { idh, mgmt, extent, age } = factors;

  let baselineSurvival = 15; // months
  let modifications = [];

  // IDH mutation adds 50-100% survival
  if (idh === 'mutant') {
    baselineSurvival *= 1.75;
    modifications.push('IDH-mutant: +75% survival');
  }

  // MGMT methylation adds 30-40%
  if (mgmt === 'methylated') {
    baselineSurvival *= 1.35;
    modifications.push('MGMT-methylated: +35% survival');
  }

  // GTR adds 20-30%
  if (extent === 'GTR') {
    baselineSurvival *= 1.25;
    modifications.push('GTR: +25% survival');
  } else if (extent === 'STR') {
    baselineSurvival *= 1.10;
    modifications.push('STR: +10% survival');
  }

  // Age adjustment
  if (age && age < 50) {
    baselineSurvival *= 1.15;
    modifications.push('Age <50: +15% survival');
  } else if (age && age > 70) {
    baselineSurvival *= 0.75;
    modifications.push('Age >70: -25% survival');
  }

  return {
    medianSurvival: Math.round(baselineSurvival),
    modifications,
    interpretation: baselineSurvival > 20 ? 'Better than average prognosis' : baselineSurvival < 12 ? 'Worse than average prognosis' : 'Standard prognosis'
  };
}

/**
 * Get treatment recommendations for pathology subtype
 */
export function getTreatmentRecommendations(pathologyType, subtype) {
  const recommendations = {
    SAH: {
      imaging: [
        'Daily TCD for 14 days (vasospasm surveillance)',
        'CTA if elevated TCD velocities (>120 cm/s MCA)',
        'Repeat imaging at 6-12 months',
        'DSA at 6 months if incompletely treated'
      ],
      medications: [
        'Nimodipine 60mg PO/NG q4h x 21 days (MANDATORY)',
        'Maintain euvolemia (goal CVP 5-8 mmHg)',
        'Stool softeners to prevent straining',
        'DVT prophylaxis (SCDs, consider heparin after securing aneurysm)'
      ],
      monitoring: [
        'Neuro checks q1h x 48h, then q2h',
        'Watch for delayed cerebral ischemia (DCI) POD 4-14',
        'Monitor for hydrocephalus',
        'Seizure prophylaxis if parenchymal extension'
      ]
    },
    TUMORS: {
      imaging: [
        'MRI brain with contrast 24-48h postop (baseline)',
        'MRI at 3 months post-RT/chemo',
        'MRI every 2-3 months during treatment',
        'MRI every 3-6 months after treatment completion'
      ],
      medications: [
        'Dexamethasone taper over 2-4 weeks',
        'Levetiracetam 500-1000mg BID (seizure prophylaxis)',
        'Temozolomide per Stupp protocol (high-grade)',
        'PPI while on dexamethasone'
      ],
      monitoring: [
        'Wound check at 10-14 days',
        'Radiation oncology consultation',
        'Medical oncology consultation',
        'Neurocognitive assessment'
      ]
    },
    SPINE: {
      imaging: [
        'Plain films or CT at 6 weeks, 3 months, 6 months, 1 year',
        'MRI if new neurological symptoms',
        'Dynamic films to assess fusion (if arthrodesis performed)'
      ],
      medications: [
        'Pain management (multimodal approach)',
        'Consider steroid taper if preop compression',
        'DVT prophylaxis',
        'Bone health optimization (vitamin D, calcium)'
      ],
      monitoring: [
        'Physical therapy starting POD 1-2',
        'Brace compliance if prescribed',
        'Smoking cessation critical for fusion',
        'Monitor for surgical site infection'
      ]
    }
  };

  return recommendations[pathologyType] || {
    imaging: ['Follow up imaging per neurosurgery'],
    medications: ['Continue medications as prescribed'],
    monitoring: ['Regular follow-up with neurosurgeon']
  };
}

/**
 * Get complication risks for pathology subtype
 */
export function getComplicationRisks(pathologyType, subtype) {
  const risks = {
    SAH: [
      { name: 'Vasospasm/DCI', risk: subtype.vasospasmRisk || 'Moderate', timing: 'POD 4-14', management: 'Induced hypertension, angioplasty if severe' },
      { name: 'Hydrocephalus', risk: 'Moderate', timing: 'Acute or delayed', management: 'EVD or VP shunt' },
      { name: 'Rebleed', risk: subtype.treated ? 'Low' : 'High', timing: 'First 24-48h', management: 'Secure aneurysm emergently' },
      { name: 'Seizures', risk: 'Low-Moderate', timing: 'Acute', management: 'Levetiracetam prophylaxis' }
    ],
    TUMORS: [
      { name: 'Seizures', risk: 'Moderate-High', timing: 'Throughout course', management: 'AED prophylaxis 3-12 months' },
      { name: 'Edema', risk: 'High', timing: 'Perioperative', management: 'Dexamethasone taper' },
      { name: 'Recurrence', risk: subtype.grade === 'WHO IV' ? 'Very High' : 'Moderate', timing: 'Months to years', management: 'Re-resection, RT, chemo' },
      { name: 'Radiation necrosis', risk: 'Low', timing: '6-24 months post-RT', management: 'Steroids, bevacizumab, surgery' }
    ],
    SPINE: [
      { name: 'Hardware failure', risk: 'Low', timing: 'Months', management: 'Revision surgery' },
      { name: 'Pseudarthrosis', risk: 'Moderate', timing: '6-12 months', management: 'Revision fusion' },
      { name: 'Adjacent segment disease', risk: 'Moderate', timing: 'Years', management: 'Extension of fusion' },
      { name: 'Infection', risk: 'Low', timing: 'Days to weeks', management: 'I&D, antibiotics' }
    ]
  };

  return risks[pathologyType] || [];
}

/**
 * Main function to detect pathology subtype and generate clinical intelligence
 */
export function detectPathologySubtype(text, pathologyType, extractedData = {}) {
  console.log(`[Phase 1 Step 6] Detecting subtype for: ${pathologyType}`);

  const subtype = {
    type: pathologyType,
    details: {},
    riskLevel: 'MODERATE',
    prognosis: {},
    recommendations: {},
    complications: []
  };

  try {
    switch (pathologyType) {
      case PATHOLOGY_TYPES.SAH:
        return detectSAHSubtype(text, extractedData);
      case PATHOLOGY_TYPES.TUMORS:
        return detectTumorSubtype(text, extractedData);
      case PATHOLOGY_TYPES.SPINE:
        return detectSpineSubtype(text, extractedData);
      case PATHOLOGY_TYPES.HYDROCEPHALUS:
        return detectHydrocephalusSubtype(text, extractedData);
      case PATHOLOGY_TYPES.TBI_CSDH:
        return detectTBISubtype(text, extractedData);
      default:
        return subtype;
    }
  } catch (error) {
    console.error(`[Phase 1 Step 6] Error detecting subtype for ${pathologyType}:`, error);
    return subtype;
  }
}

/**
 * Detect SAH-specific subtype information
 */
function detectSAHSubtype(text, extractedData) {
  const subtype = {
    type: PATHOLOGY_TYPES.SAH,
    details: {},
    riskLevel: 'MODERATE',
    prognosis: {},
    recommendations: {},
    complications: []
  };

  // Detect aneurysm location
  for (const [key, location] of Object.entries(ANEURYSM_LOCATIONS)) {
    for (const pattern of location.patterns) {
      if (pattern.test(text)) {
        subtype.details.aneurysmLocation = location.name;
        subtype.details.locationRisks = location.riskFactors;
        subtype.details.surgicalDifficulty = location.surgicalDifficulty;
        break;
      }
    }
    if (subtype.details.aneurysmLocation) break;
  }

  // Detect aneurysm size
  const sizePattern = /aneurysm.*?(\d+(?:\.\d+)?)\s*mm/i;
  const sizeMatch = text.match(sizePattern);
  if (sizeMatch) {
    const size = parseFloat(sizeMatch[1]);
    for (const [key, category] of Object.entries(ANEURYSM_SIZES)) {
      if (size >= category.range[0] && size < category.range[1]) {
        subtype.details.aneurysmSize = `${size}mm (${category.name})`;
        subtype.details.ruptureRisk = category.ruptureRisk;
        subtype.riskLevel = category.riskLevel;
        break;
      }
    }
  }

  // Get Hunt & Hess prognosis
  if (extractedData.grades?.huntHess) {
    const hhGrade = extractedData.grades.huntHess.replace(/[^0-9IViv]/g, '');
    const prognosis = calculateHuntHessPrognosis(hhGrade);
    subtype.prognosis.mortality = prognosis.mortality;
    subtype.prognosis.goodOutcome = `${prognosis.goodOutcome} (mRS 0-2)`;
    subtype.riskLevel = prognosis.riskLevel;
  }

  // Get vasospasm risk (check both fisher and modifiedFisher)
  const fisherGradeValue = extractedData.grades?.fisher || extractedData.grades?.modifiedFisher;
  if (fisherGradeValue) {
    const fisherGrade = String(fisherGradeValue).replace(/[^0-9]/g, '');
    const vasospasmRisk = calculateVasospasmRisk(fisherGrade);
    subtype.details.vasospasmRisk = vasospasmRisk.percentage;
    subtype.prognosis.vasospasmRisk = vasospasmRisk.percentage;
  }

  // Treatment recommendations
  subtype.recommendations = getTreatmentRecommendations(PATHOLOGY_TYPES.SAH, subtype.details);
  subtype.complications = getComplicationRisks(PATHOLOGY_TYPES.SAH, subtype.details);

  return subtype;
}

/**
 * Detect Tumor-specific subtype information
 */
function detectTumorSubtype(text, extractedData) {
  const subtype = {
    type: PATHOLOGY_TYPES.TUMORS,
    details: {},
    riskLevel: 'MODERATE',
    prognosis: {},
    recommendations: {},
    complications: []
  };

  // Detect WHO grade
  for (const [key, grade] of Object.entries(TUMOR_GRADES)) {
    for (const pattern of grade.patterns) {
      if (pattern.test(text)) {
        subtype.details.whoGrade = grade.name;
        subtype.prognosis = { ...grade.prognosis };
        subtype.details.treatment = grade.treatment;
        subtype.riskLevel = grade.riskLevel;
        break;
      }
    }
    if (subtype.details.whoGrade) break;
  }

  // Detect molecular markers
  const markers = [];
  for (const [key, marker] of Object.entries(MOLECULAR_MARKERS)) {
    for (const pattern of marker.patterns) {
      if (pattern.test(text)) {
        markers.push({
          name: marker.name,
          significance: marker.significance,
          impact: marker.impact,
          prognosis: marker.prognosis
        });
        break;
      }
    }
  }
  subtype.details.molecularMarkers = markers;

  // Detect resection extent
  for (const [key, resection] of Object.entries(RESECTION_EXTENT)) {
    for (const pattern of resection.patterns) {
      if (pattern.test(text)) {
        subtype.details.resectionExtent = resection.name;
        subtype.details.survivalImpact = resection.survival;
        break;
      }
    }
    if (subtype.details.resectionExtent) break;
  }

  // Calculate GBM prognosis if applicable
  if (/glioblastoma|GBM/i.test(text)) {
    // Extract age from text
    const ageMatch = text.match(/\b(?:age|Age)\s+(\d+)/i);
    const age = ageMatch ? parseInt(ageMatch[1]) : null;

    const factors = {
      idh: markers.find(m => m.name.includes('IDH')) ? 'mutant' : 'wildtype',
      mgmt: markers.find(m => m.name.includes('MGMT')) ? 'methylated' : 'unmethylated',
      extent: subtype.details.resectionExtent?.includes('Gross Total') ? 'GTR' : 'STR',
      age: age
    };
    const gbmPrognosis = calculateGBMPrognosis(factors);

    // Update survival field (not create new medianSurvival field)
    subtype.prognosis.survival = `${gbmPrognosis.medianSurvival} months median survival`;
    subtype.prognosis.factors = gbmPrognosis.modifications;
  }

  // Treatment recommendations
  subtype.recommendations = getTreatmentRecommendations(PATHOLOGY_TYPES.TUMORS, subtype.details);
  subtype.complications = getComplicationRisks(PATHOLOGY_TYPES.TUMORS, subtype.details);

  return subtype;
}

/**
 * Detect Spine-specific subtype information
 */
function detectSpineSubtype(text, extractedData) {
  const subtype = {
    type: PATHOLOGY_TYPES.SPINE,
    details: {},
    riskLevel: 'MODERATE',
    prognosis: {},
    recommendations: {},
    complications: []
  };

  // Detect ASIA grade
  for (const [key, grade] of Object.entries(ASIA_GRADES)) {
    for (const pattern of grade.patterns) {
      if (pattern.test(text)) {
        subtype.details.asiaGrade = grade.name;
        subtype.prognosis = { ...grade.prognosis };
        subtype.riskLevel = grade.riskLevel;
        break;
      }
    }
    if (subtype.details.asiaGrade) break;
  }

  // Detect injury level
  if (/cervical/i.test(text)) {
    subtype.details.level = 'Cervical';
    subtype.details.impact = 'Potential quadriplegia, respiratory compromise';
  } else if (/thoracic/i.test(text)) {
    subtype.details.level = 'Thoracic';
    subtype.details.impact = 'Potential paraplegia, preserved upper extremity function';
  } else if (/lumbar/i.test(text)) {
    subtype.details.level = 'Lumbar';
    subtype.details.impact = 'Lower extremity/bowel/bladder dysfunction';
  }

  // Treatment recommendations
  subtype.recommendations = getTreatmentRecommendations(PATHOLOGY_TYPES.SPINE, subtype.details);
  subtype.complications = getComplicationRisks(PATHOLOGY_TYPES.SPINE, subtype.details);

  return subtype;
}

/**
 * Detect Hydrocephalus subtype
 */
function detectHydrocephalusSubtype(text, extractedData) {
  const subtype = {
    type: PATHOLOGY_TYPES.HYDROCEPHALUS,
    details: {},
    riskLevel: 'MODERATE',
    prognosis: { recovery: 'Variable depending on etiology' },
    recommendations: {
      imaging: ['Head CT to assess shunt function if symptoms', 'Shunt series if mechanical failure suspected'],
      medications: ['Acetazolamide for ICP management (temporary)'],
      monitoring: ['Watch for signs of shunt malfunction', 'Monitor fontanelles in infants']
    },
    complications: []
  };

  if (/communicating/i.test(text)) {
    subtype.details.type = 'Communicating Hydrocephalus';
  } else if (/non-?communicating|obstructive/i.test(text)) {
    subtype.details.type = 'Obstructive Hydrocephalus';
    subtype.riskLevel = 'HIGH';
  }

  return subtype;
}

/**
 * Detect TBI/Subdural Hematoma subtype
 */
function detectTBISubtype(text, extractedData) {
  const subtype = {
    type: PATHOLOGY_TYPES.TBI_CSDH,
    details: {},
    riskLevel: 'MODERATE',
    prognosis: {},
    recommendations: {
      imaging: ['Head CT if neuro changes', 'Repeat CT in 6-24h if acute SDH'],
      medications: ['Seizure prophylaxis for 7 days', 'DVT prophylaxis when safe'],
      monitoring: ['Neuro checks per protocol', 'ICP monitoring if severe TBI']
    },
    complications: []
  };

  if (/chronic\s+subdural/i.test(text)) {
    subtype.details.type = 'Chronic Subdural Hematoma';
    subtype.prognosis.recurrence = '10-30% recurrence rate';
    subtype.riskLevel = 'MODERATE';
  } else if (/acute\s+subdural/i.test(text)) {
    subtype.details.type = 'Acute Subdural Hematoma';
    subtype.prognosis.mortality = 'High (30-60% if requiring surgery)';
    subtype.riskLevel = 'VERY HIGH';
  }

  return subtype;
}
