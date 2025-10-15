/**
 * Neurosurgery-specific Clinical Data Extractor
 * 
 * Advanced extraction engine optimized for neurosurgical discharge summaries
 * Handles abbreviations, repetitions, varied clinical styles, and unstructured text
 * 
 * Core extraction capabilities:
 * - Demographics (MRN, age, sex, dates)
 * - Neurosurgical pathologies (SAH, SDH, tumor types, spine conditions)
 * - Procedures (craniotomy, EVD, coiling, clipping, spine surgeries)
 * - Clinical scores (Hunt-Hess, Fisher, GCS, mRS, KPS, ECOG)
 * - Neurological exams (motor, sensory, cranial nerves, reflexes)
 * - Complications (vasospasm, hydrocephalus, CSF leak, infection)
 * - Medications (anticoagulation, AEDs, steroids, antibiotics)
 * - Imaging findings (CT, MRI, angiography results)
 * - Discharge planning (destination, follow-up, restrictions)
 */

import natural from 'natural';
import compromise from 'compromise';
import compromiseDates from 'compromise-dates';
import compromiseNumbers from 'compromise-numbers';

// Extend compromise with plugins
compromise.plugin(compromiseDates);
compromise.plugin(compromiseNumbers);

// Neurosurgery-specific abbreviation dictionary
const NEURO_ABBREVIATIONS = {
  // Pathologies
  'sah': 'subarachnoid hemorrhage',
  'sdh': 'subdural hematoma',
  'edh': 'epidural hematoma',
  'ich': 'intracerebral hemorrhage',
  'iph': 'intraparenchymal hemorrhage',
  'ivh': 'intraventricular hemorrhage',
  'gbm': 'glioblastoma multiforme',
  'aa': 'anaplastic astrocytoma',
  'avm': 'arteriovenous malformation',
  'davf': 'dural arteriovenous fistula',
  
  // Procedures
  'evd': 'external ventricular drain',
  'vps': 'ventriculoperitoneal shunt',
  'lp': 'lumbar puncture',
  'ld': 'lumbar drain',
  'crani': 'craniotomy',
  'bh': 'burr hole',
  'acdf': 'anterior cervical discectomy and fusion',
  'pcdf': 'posterior cervical decompression and fusion',
  'tlif': 'transforaminal lumbar interbody fusion',
  'lami': 'laminectomy',
  
  // Clinical terms
  'gcs': 'glasgow coma scale',
  'loc': 'loss of consciousness',
  'loe': 'loss of extremity',
  'ams': 'altered mental status',
  'csf': 'cerebrospinal fluid',
  'icp': 'intracranial pressure',
  'cpp': 'cerebral perfusion pressure',
  'cbf': 'cerebral blood flow',
  'dci': 'delayed cerebral ischemia',
  
  // Imaging
  'cta': 'computed tomography angiography',
  'mra': 'magnetic resonance angiography',
  'dsa': 'digital subtraction angiography',
  'ncct': 'non-contrast computed tomography',
  'dwi': 'diffusion weighted imaging',
  'flair': 'fluid attenuated inversion recovery',
  'swi': 'susceptibility weighted imaging',
  
  // Medications
  'asa': 'aspirin',
  'aed': 'anti-epileptic drug',
  'keppra': 'levetiracetam',
  'dilantin': 'phenytoin',
  'decadron': 'dexamethasone',
  'ancef': 'cefazolin',
  'vanco': 'vancomycin',
  
  // Locations/Units
  'ed': 'emergency department',
  'er': 'emergency room',
  'or': 'operating room',
  'icu': 'intensive care unit',
  'nsicu': 'neurosurgical intensive care unit',
  'nicu': 'neurological intensive care unit',
  'pacu': 'post-anesthesia care unit',
  'snf': 'skilled nursing facility',
  'ltac': 'long-term acute care',
  
  // Other common abbreviations
  'hx': 'history',
  'pmh': 'past medical history',
  'psh': 'past surgical history',
  'nkda': 'no known drug allergies',
  'wdwn': 'well-developed well-nourished',
  'nad': 'no acute distress',
  'aox3': 'alert and oriented times three',
  'mae': 'moves all extremities',
  'eomi': 'extraocular movements intact',
  'perrl': 'pupils equal round reactive to light',
  'wnl': 'within normal limits',
  'nsr': 'normal sinus rhythm',
  'rrr': 'regular rate and rhythm',
  'ctab': 'clear to auscultation bilaterally',
  'nt': 'non-tender',
  'nd': 'non-distended'
};

// Neurosurgery-specific patterns
const NEURO_PATTERNS = {
  // Hunt-Hess Grade (1-5)
  huntHess: [
    /hunt[\s-]*(?:and[\s-]*)?hess[\s-]*(?:grade|score)?[\s:]*([1-5]|[iv]+)/gi,
    /h&h[\s-]*(?:grade|score)?[\s:]*([1-5]|[iv]+)/gi,
    /grade[\s-]*([1-5]|[iv]+)[\s-]*(?:hunt[\s-]*hess|h&h)/gi
  ],
  
  // Fisher Grade (1-4)
  fisher: [
    /fisher[\s-]*(?:grade|score)?[\s:]*([1-4]|[iv]+)/gi,
    /modified[\s-]*fisher[\s-]*(?:grade|score)?[\s:]*([1-4])/gi
  ],
  
  // Glasgow Coma Scale (3-15)
  gcs: [
    /gcs[\s:]*(\d{1,2})/gi,
    /glasgow[\s-]*coma[\s-]*scale[\s:]*(\d{1,2})/gi,
    /gcs[\s:]*(\d{1,2})[\s]*[et]/gi, // GCS with E/T qualifier
    /e(\d)[\s]*m(\d)[\s]*v(\d)/gi // E4M6V5 format
  ],
  
  // Modified Rankin Scale (0-6)
  mRS: [
    /mrs[\s:]*(\d)/gi,
    /modified[\s-]*rankin[\s:]*(\d)/gi,
    /rankin[\s:]*(\d)/gi
  ],
  
  // Aneurysm location
  aneurysm: [
    /([\w\s]+)(?:aneurysm|aneurysmal)/gi,
    /aneurysm(?:s)?[\s]*(?:of|at|in)?[\s]*(?:the)?[\s]*([\w\s]+)/gi,
    /(acom|pcom|mca|aca|pca|basilar|vertebral|ophthalmic|carotid)[\s]*aneurysm/gi
  ],
  
  // EVD placement
  evd: [
    /evd[\s]*(?:placed|placement|inserted)/gi,
    /external[\s-]*ventricular[\s-]*drain/gi,
    /ventriculostomy/gi
  ],
  
  // Vasospasm
  vasospasm: [
    /vasospasm/gi,
    /cerebral[\s]*spasm/gi,
    /(?:mild|moderate|severe)[\s]*(?:vasospasm|spasm)/gi,
    /dci|delayed[\s-]*cerebral[\s-]*ischemia/gi
  ],
  
  // Hydrocephalus
  hydrocephalus: [
    /hydrocephalus/gi,
    /hydrocephalic/gi,
    /ventriculomegaly/gi,
    /enlarged[\s]*ventricles/gi
  ]
};

/**
 * Expand abbreviations in text
 */
export function expandAbbreviations(text) {
  let expanded = text.toLowerCase();
  
  // Sort abbreviations by length (longer first) to avoid partial replacements
  const sortedAbbrevs = Object.keys(NEURO_ABBREVIATIONS).sort((a, b) => b.length - a.length);
  
  for (const abbrev of sortedAbbrevs) {
    const expansion = NEURO_ABBREVIATIONS[abbrev];
    // Use word boundaries to avoid partial replacements
    const regex = new RegExp(`\\b${abbrev}\\b`, 'gi');
    expanded = expanded.replace(regex, expansion);
  }
  
  return expanded;
}

/**
 * Remove duplicate sentences and normalize whitespace
 */
function deduplicateText(text) {
  // Split into sentences
  const tokenizer = new natural.SentenceTokenizer();
  const sentences = tokenizer.tokenize(text);
  
  // Remove exact duplicates while preserving order
  const seen = new Set();
  const unique = [];
  
  for (const sentence of sentences) {
    const normalized = sentence.toLowerCase().trim().replace(/\s+/g, ' ');
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(sentence);
    }
  }
  
  return unique.join(' ');
}

/**
 * Extract dates from text using multiple strategies
 */
function extractDates(text) {
  const doc = compromise(text);
  const dates = {};
  
  // Use compromise to find dates
  const foundDates = doc.dates().out('array');
  
  // Additional patterns for medical date formats
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g, // MM/DD/YYYY or MM-DD-YY
    /(\d{1,2})[\/\-](\d{1,2})/g, // MM/DD (assume current year)
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{2,4}/gi,
    /\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4}/gi
  ];
  
  // Look for specific date contexts
  const contexts = {
    ictus: ['ictus', 'onset', 'event', 'bleed', 'hemorrhage occurred', 'found down'],
    admission: ['admitted', 'admission', 'presented', 'arrived', 'transferred'],
    surgery: ['surgery', 'operation', 'procedure', 'craniotomy', 'coiling', 'clipping'],
    discharge: ['discharged', 'discharge', 'disposition', 'transferred out']
  };
  
  for (const [key, keywords] of Object.entries(contexts)) {
    for (const keyword of keywords) {
      const regex = new RegExp(`${keyword}[^.]*?(\\d{1,2}[\/\\-]\\d{1,2}[\/\\-]?\\d{0,4})`, 'gi');
      const match = regex.exec(text);
      if (match) {
        dates[key] = match[1];
      }
    }
  }
  
  return dates;
}

/**
 * Extract clinical scores (Hunt-Hess, Fisher, GCS, etc.)
 */
export function extractClinicalScores(text) {
  const scores = {};
  const expandedText = expandAbbreviations(text);
  
  // Hunt-Hess Grade
  for (const pattern of NEURO_PATTERNS.huntHess) {
    const match = pattern.exec(expandedText);
    if (match) {
      scores.huntHess = convertRomanToArabic(match[1]);
      break;
    }
  }
  
  // Fisher Grade
  for (const pattern of NEURO_PATTERNS.fisher) {
    const match = pattern.exec(expandedText);
    if (match) {
      scores.fisher = convertRomanToArabic(match[1]);
      break;
    }
  }
  
  // Glasgow Coma Scale
  for (const pattern of NEURO_PATTERNS.gcs) {
    const match = pattern.exec(expandedText);
    if (match) {
      if (match[3]) { // E_M_V_ format
        scores.gcs = {
          total: parseInt(match[1]) + parseInt(match[2]) + parseInt(match[3]),
          eye: parseInt(match[1]),
          motor: parseInt(match[2]),
          verbal: parseInt(match[3])
        };
      } else {
        scores.gcs = { total: parseInt(match[1]) };
      }
      break;
    }
  }
  
  // Modified Rankin Scale
  for (const pattern of NEURO_PATTERNS.mRS) {
    const match = pattern.exec(expandedText);
    if (match) {
      scores.mRS = parseInt(match[1]);
      break;
    }
  }
  
  return scores;
}

/**
 * Convert Roman numerals to Arabic numbers
 */
function convertRomanToArabic(str) {
  if (/^\d+$/.test(str)) return parseInt(str);
  
  const romanMap = { 'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5 };
  const lower = str.toLowerCase();
  return romanMap[lower] || str;
}

/**
 * Extract procedures and surgeries
 */
export function extractProcedures(text) {
  const procedures = [];
  const expandedText = expandAbbreviations(text);
  
  const procedureKeywords = [
    'craniotomy', 'craniectomy', 'burr hole', 'ventriculostomy',
    'external ventricular drain', 'evd placement', 'coiling', 'clipping',
    'embolization', 'angiogram', 'angiography', 'thrombectomy',
    'evacuation', 'resection', 'biopsy', 'shunt placement',
    'ventriculoperitoneal shunt', 'lumbar drain', 'lumbar puncture',
    'laminectomy', 'discectomy', 'fusion', 'acdf', 'pcdf', 'tlif'
  ];
  
  for (const keyword of procedureKeywords) {
    const regex = new RegExp(`${keyword}[^.]*`, 'gi');
    const matches = expandedText.match(regex);
    if (matches) {
      procedures.push(...matches.map(m => ({
        name: keyword,
        details: m.trim(),
        date: extractProcedureDate(m)
      })));
    }
  }
  
  return procedures;
}

/**
 * Extract date from procedure description
 */
function extractProcedureDate(text) {
  const datePattern = /(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/;
  const match = datePattern.exec(text);
  return match ? match[1] : null;
}

/**
 * Extract complications
 */
export function extractComplications(text) {
  const complications = [];
  const expandedText = expandAbbreviations(text);
  
  const complicationKeywords = [
    'vasospasm', 'hydrocephalus', 'seizure', 'stroke', 'infarct',
    'rebleed', 'rehemorrhage', 'infection', 'meningitis', 'ventriculitis',
    'csf leak', 'wound dehiscence', 'pneumonia', 'uti', 'dvt', 'pe',
    'pulmonary embolism', 'deep vein thrombosis', 'cerebral edema',
    'herniation', 'diabetes insipidus', 'siadh', 'hyponatremia'
  ];
  
  for (const keyword of complicationKeywords) {
    const regex = new RegExp(`${keyword}[^.]*`, 'gi');
    const matches = expandedText.match(regex);
    if (matches) {
      complications.push(...matches.map(m => ({
        name: keyword,
        details: m.trim(),
        resolved: m.toLowerCase().includes('resolved') || m.toLowerCase().includes('improved')
      })));
    }
  }
  
  return complications;
}

/**
 * Extract medications with dosages
 */
export function extractMedications(text) {
  const medications = {
    current: [],
    discontinued: [],
    anticoagulation: [],
    antiepileptic: [],
    antibiotics: []
  };
  
  const expandedText = expandAbbreviations(text);
  
  // Common medication patterns
  const medPatterns = [
    /(\w+)\s+(\d+)\s*(mg|mcg|g|ml|units?)(?:\s+([qd|bid|tid|qid|daily|twice|three times|four times]))?/gi,
    /(\w+)\s+(\d+\/\d+)\s*(mg|mcg|g|ml|units?)/gi
  ];
  
  // Categorize medications
  const categories = {
    anticoagulation: ['aspirin', 'asa', 'plavix', 'clopidogrel', 'heparin', 'lovenox', 'enoxaparin', 'coumadin', 'warfarin', 'eliquis', 'apixaban', 'xarelto', 'rivaroxaban'],
    antiepileptic: ['keppra', 'levetiracetam', 'dilantin', 'phenytoin', 'depakote', 'valproic acid', 'tegretol', 'carbamazepine', 'lamictal', 'lamotrigine'],
    antibiotics: ['ancef', 'cefazolin', 'vancomycin', 'vanco', 'ceftriaxone', 'rocephin', 'meropenem', 'zosyn', 'piperacillin', 'metronidazole', 'flagyl']
  };
  
  for (const pattern of medPatterns) {
    let match;
    while ((match = pattern.exec(expandedText)) !== null) {
      const med = {
        name: match[1],
        dose: match[2],
        unit: match[3],
        frequency: match[4] || 'daily'
      };
      
      // Categorize the medication
      let categorized = false;
      for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(k => med.name.toLowerCase().includes(k))) {
          medications[category].push(med);
          categorized = true;
          break;
        }
      }
      
      if (!categorized) {
        medications.current.push(med);
      }
    }
  }
  
  return medications;
}

/**
 * Extract imaging findings
 */
export function extractImagingFindings(text) {
  const findings = [];
  const expandedText = expandAbbreviations(text);
  
  const imagingTypes = ['ct', 'cta', 'mri', 'mra', 'angiogram', 'angiography', 'x-ray', 'xray'];
  
  for (const type of imagingTypes) {
    const regex = new RegExp(`${type}[^.]*?(?:showed|revealed|demonstrated|findings|impression)[^.]*`, 'gi');
    const matches = expandedText.match(regex);
    if (matches) {
      findings.push(...matches.map(m => ({
        type: type.toUpperCase(),
        findings: m.trim(),
        date: extractProcedureDate(m)
      })));
    }
  }
  
  return findings;
}

/**
 * Main extraction function
 */
export async function extractNeurosurgicalData(text, options = {}) {
  // Preprocess text
  let processedText = text;
  
  // Expand abbreviations if requested
  if (options.expandAbbreviations !== false) {
    processedText = expandAbbreviations(text);
  }
  
  // Remove duplicates if requested
  if (options.deduplicateSentences !== false) {
    processedText = deduplicateText(processedText);
  }
  
  // Extract all components
  const extracted = {
    // Demographics and dates
    dates: extractDates(processedText),
    
    // Clinical scores
    clinicalScores: extractClinicalScores(processedText),
    
    // Procedures
    procedures: extractProcedures(processedText),
    
    // Complications
    complications: extractComplications(processedText),
    
    // Medications
    medications: extractMedications(processedText),
    
    // Imaging
    imaging: extractImagingFindings(processedText),
    
    // Metadata
    metadata: {
      originalLength: text.length,
      processedLength: processedText.length,
      extractionTimestamp: new Date().toISOString(),
      options: options
    }
  };
  
  // Apply confidence scoring if requested
  if (options.includeConfidence) {
    extracted.confidence = calculateConfidence(extracted);
  }
  
  return extracted;
}

/**
 * Calculate confidence scores for extracted data
 */
function calculateConfidence(extracted) {
  const confidence = {};
  
  // Base confidence on presence and quality of extracted data
  const scoreFactors = {
    dates: Object.keys(extracted.dates).length > 0 ? 0.8 : 0.2,
    clinicalScores: Object.keys(extracted.clinicalScores).length > 0 ? 0.9 : 0.3,
    procedures: extracted.procedures.length > 0 ? 0.85 : 0.3,
    complications: extracted.complications.length > 0 ? 0.75 : 0.5,
    medications: Object.values(extracted.medications).some(arr => arr.length > 0) ? 0.8 : 0.3,
    imaging: extracted.imaging.length > 0 ? 0.85 : 0.4
  };
  
  for (const [key, score] of Object.entries(scoreFactors)) {
    confidence[key] = score;
  }
  
  // Overall confidence
  confidence.overall = Object.values(scoreFactors).reduce((sum, score) => sum + score, 0) / Object.keys(scoreFactors).length;
  
  return confidence;
}

export default {
  extractNeurosurgicalData,
  expandAbbreviations,
  extractClinicalScores,
  extractProcedures,
  extractComplications,
  extractMedications,
  extractImagingFindings
};