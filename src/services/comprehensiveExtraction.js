/**
 * Comprehensive Clinical Extraction
 *
 * Extracts ALL aspects of hospital course for complete discharge summaries:
 * - Physical exam findings
 * - Neurological exams (serial)
 * - Hospital course chronology
 * - Significant events (seizures, hemorrhages, infections, etc.)
 * - ICU stay details
 * - Pre-op and post-op deficits
 * - Consultant plans
 * - Labs and vitals
 */

import { CONFIDENCE } from '../config/constants.js';
import { cleanText } from '../utils/textUtils.js';

/**
 * Extract physical exam findings
 */
export const extractPhysicalExam = (text) => {
  const data = {
    general: null,
    heent: null,
    cardiovascular: null,
    pulmonary: null,
    abdomen: null,
    extremities: null,
    skin: null
  };

  let confidence = CONFIDENCE.LOW;

  // Physical exam section patterns
  const examSectionPattern = /(?:PHYSICAL\s+EXAM(?:INATION)?|PE)\s*:?\s*\n([\s\S]{100,1000}?)(?:\n\n|\n[A-Z]{2,})/i;
  const examMatch = text.match(examSectionPattern);

  if (examMatch) {
    const examText = examMatch[1];
    confidence = CONFIDENCE.MEDIUM;

    // General appearance
    const generalPatterns = [
      /(?:general|gen)\s*:?\s*([^\n]+)/i,
      /(?:appears?|alert|oriented|distress)/i
    ];

    for (const pattern of generalPatterns) {
      const match = examText.match(pattern);
      if (match) {
        data.general = cleanText(match[1] || match[0]);
        break;
      }
    }

    // HEENT
    const heentPattern = /(?:HEENT|head)\s*:?\s*([^\n]+)/i;
    const heentMatch = examText.match(heentPattern);
    if (heentMatch) {
      data.heent = cleanText(heentMatch[1]);
    }

    // Cardiovascular
    const cvPatterns = [/(?:cardiovascular|CV|heart)\s*:?\s*([^\n]+)/i, /(?:RRR|S1|S2)/i];
    for (const pattern of cvPatterns) {
      const match = examText.match(pattern);
      if (match) {
        data.cardiovascular = cleanText(match[1] || match[0]);
        break;
      }
    }

    // Pulmonary
    const pulmonaryPattern = /(?:pulmonary|lungs?|respiratory|chest)\s*:?\s*([^\n]+)/i;
    const pulmonaryMatch = examText.match(pulmonaryPattern);
    if (pulmonaryMatch) {
      data.pulmonary = cleanText(pulmonaryMatch[1]);
    }

    // Abdomen
    const abdomenPattern = /(?:abdomen|abd)\s*:?\s*([^\n]+)/i;
    const abdomenMatch = examText.match(abdomenPattern);
    if (abdomenMatch) {
      data.abdomen = cleanText(abdomenMatch[1]);
    }

    // Extremities
    const extremitiesPattern = /(?:extremities|ext)\s*:?\s*([^\n]+)/i;
    const extremitiesMatch = examText.match(extremitiesPattern);
    if (extremitiesMatch) {
      data.extremities = cleanText(extremitiesMatch[1]);
    }
  }

  return { data, confidence };
};

/**
 * Extract neurological exam findings (can be serial)
 */
export const extractNeurologicalExam = (text) => {
  const data = {
    mentalStatus: null,
    cranialNerves: null,
    motor: null,
    sensory: null,
    reflexes: null,
    coordination: null,
    gait: null,
    gcs: null,
    pupils: null
  };

  let confidence = CONFIDENCE.LOW;

  // Neurological exam section
  const neuroSectionPattern = /(?:NEUROLOGICAL\s+EXAM(?:INATION)?|NEURO\s+EXAM|NEUROLOGIC\s+EXAM)\s*:?\s*\n?([\s\S]{50,800}?)(?:\n\n|\n[A-Z]{2,})/i;
  const neuroMatch = text.match(neuroSectionPattern);

  if (neuroMatch) {
    const neuroText = neuroMatch[1];
    confidence = CONFIDENCE.HIGH;

    // Mental status
    const mentalPatterns = [
      /(?:mental\s+status|MS)\s*:?\s*([^\n]+)/i,
      /(?:alert|oriented|A&O|AAO|confused|lethargic)/i
    ];

    for (const pattern of mentalPatterns) {
      const match = neuroText.match(pattern);
      if (match) {
        data.mentalStatus = cleanText(match[1] || match[0]);
        break;
      }
    }

    // GCS
    const gcsPattern = /GCS\s*(?:of\s+)?(\d{1,2}|\d{1,2}[ETM])/i;
    const gcsMatch = text.match(gcsPattern);
    if (gcsMatch) {
      data.gcs = gcsMatch[1];
      confidence = CONFIDENCE.CRITICAL;
    }

    // Pupils
    const pupilPatterns = [
      /pupils?\s*:?\s*([^\n]+)/i,
      /(\d+\.?\d*\s*mm\s+(?:and\s+)?(?:bilateral|bilaterally|reactive))/i,
      /(PERRL|PERRLA)/i
    ];

    for (const pattern of pupilPatterns) {
      const match = neuroText.match(pattern);
      if (match) {
        data.pupils = cleanText(match[1] || match[0]);
        break;
      }
    }

    // Cranial nerves
    const cnPattern = /(?:cranial\s+nerves?|CN|CNs)\s*:?\s*([^\n]+)/i;
    const cnMatch = neuroText.match(cnPattern);
    if (cnMatch) {
      data.cranialNerves = cleanText(cnMatch[1]);
    }

    // Motor exam
    const motorPattern = /(?:motor|strength)\s*:?\s*([^\n]+)/i;
    const motorMatch = neuroText.match(motorPattern);
    if (motorMatch) {
      data.motor = cleanText(motorMatch[1]);
    }

    // Sensory
    const sensoryPattern = /(?:sensory|sensation)\s*:?\s*([^\n]+)/i;
    const sensoryMatch = neuroText.match(sensoryPattern);
    if (sensoryMatch) {
      data.sensory = cleanText(sensoryMatch[1]);
    }

    // Reflexes
    const reflexPattern = /(?:reflexes?|DTR|DTRs)\s*:?\s*([^\n]+)/i;
    const reflexMatch = neuroText.match(reflexPattern);
    if (reflexMatch) {
      data.reflexes = cleanText(reflexMatch[1]);
    }

    // Coordination
    const coordPattern = /(?:coordination|cerebellar)\s*:?\s*([^\n]+)/i;
    const coordMatch = neuroText.match(coordPattern);
    if (coordMatch) {
      data.coordination = cleanText(coordMatch[1]);
    }

    // Gait
    const gaitPattern = /(?:gait|ambulation)\s*:?\s*([^\n]+)/i;
    const gaitMatch = neuroText.match(gaitPattern);
    if (gaitMatch) {
      data.gait = cleanText(gaitMatch[1]);
    }
  }

  return { data, confidence };
};

/**
 * Extract significant clinical events (seizures, hemorrhages, strokes, infections, etc.)
 */
export const extractSignificantEvents = (text) => {
  const data = {
    events: []
  };

  let confidence = CONFIDENCE.MEDIUM;

  const eventPatterns = {
    seizure: [
      /seizure/gi,
      /convulsion/gi,
      /status\s+epilepticus/gi
    ],
    hemorrhage: [
      /hemorrhage/gi,
      /bleed/gi,
      /rebleed/gi,
      /hematoma\s+expansion/gi
    ],
    stroke: [
      /stroke/gi,
      /infarct/gi,
      /isch[ae]mi[ac]/gi,
      /DWI\s+restriction/gi
    ],
    infection: [
      /infection/gi,
      /sepsis/gi,
      /meningitis/gi,
      /ventriculitis/gi,
      /pneumonia/gi,
      /UTI/gi,
      /fever/gi
    ],
    vasospasm: [
      /vasospasm/gi,
      /DCI/gi,
      /delayed\s+cerebral\s+ischemia/gi
    ],
    hydrocephalus: [
      /hydrocephalus/gi,
      /ventriculomegaly/gi,
      /increased\s+ICP/gi
    ],
    deterioration: [
      /deteriorat/gi,
      /decompensation/gi,
      /clinical\s+decline/gi,
      /worsening/gi
    ]
  };

  for (const [eventType, patterns] of Object.entries(eventPatterns)) {
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        // Try to extract date/context
        const lines = text.split('\n');
        for (const line of lines) {
          if (pattern.test(line)) {
            // Extract date if present in same line or nearby
            const datePattern = /(?:POD|HD)\s*#?\s*(\d+)|(\d{1,2}\/\d{1,2}\/\d{2,4})|([A-Z][a-z]+\s+\d{1,2})/i;
            const dateMatch = line.match(datePattern);

            data.events.push({
              type: eventType,
              description: cleanText(line),
              date: dateMatch ? (dateMatch[1] || dateMatch[2] || dateMatch[3]) : null
            });

            confidence = CONFIDENCE.HIGH;
            break; // One per event type
          }
        }
      }
    }
  }

  return { data, confidence };
};

/**
 * Extract ICU stay details
 */
export const extractICUStay = (text) => {
  const data = {
    admitted: false,
    duration: null,
    unit: null,
    ventilator: false,
    ventilatorDays: null,
    pressors: false,
    sedation: false,
    complications: []
  };

  let confidence = CONFIDENCE.LOW;

  // ICU admission patterns
  const icuPatterns = [
    /admitted\s+to\s+(?:the\s+)?(?:neuro\s+)?(?:ICU|intensive\s+care)/i,
    /(?:neuro\s+)?ICU\s+(?:admission|stay)/i,
    /transferred\s+to\s+ICU/i
  ];

  for (const pattern of icuPatterns) {
    if (pattern.test(text)) {
      data.admitted = true;
      confidence = CONFIDENCE.HIGH;

      // Try to extract unit type
      const unitMatch = text.match(/(?:neuro|surgical|medical|cardiac)\s+ICU/i);
      if (unitMatch) {
        data.unit = unitMatch[0];
      }

      break;
    }
  }

  if (data.admitted) {
    // Check for mechanical ventilation
    const ventPatterns = [
      /intubated/i,
      /mechanical\s+ventilation/i,
      /ventilator/i,
      /extubated/i
    ];

    for (const pattern of ventPatterns) {
      if (pattern.test(text)) {
        data.ventilator = true;

        // Try to extract duration
        const durationMatch = text.match(/(?:ventilated|intubated)\s+(?:for\s+)?(\d+)\s+(?:days?|hours?)/i);
        if (durationMatch) {
          data.ventilatorDays = durationMatch[1];
        }

        break;
      }
    }

    // Check for pressors
    if (/(?:pressors?|vasopressors?|levophed|norepinephrine|vasopressin|phenylephrine)/i.test(text)) {
      data.pressors = true;
    }

    // Check for sedation
    if (/(?:sedation|sedated|propofol|precedex|dexmedetomidine)/i.test(text)) {
      data.sedation = true;
    }

    // Extract ICU complications
    const icuComplicationPatterns = [
      /VAP/i,
      /ventilator-associated\s+pneumonia/i,
      /CLABSI/i,
      /line\s+infection/i,
      /delirium/i,
      /ICU\s+psychosis/i
    ];

    for (const pattern of icuComplicationPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.complications.push(match[0]);
      }
    }
  }

  return { data, confidence };
};

/**
 * Extract pre-operative deficits/neurological status
 */
export const extractPreOpDeficits = (text) => {
  const data = {
    motor: [],
    sensory: [],
    cranialNerves: [],
    cognitive: [],
    speech: []
  };

  let confidence = CONFIDENCE.LOW;

  // Look for pre-operative exam or admission exam
  const preOpSectionPattern = /(?:PRE-?OP(?:ERATIVE)?|ADMISSION|INITIAL|BASELINE)\s+(?:EXAM|NEURO|NEUROLOGIC|STATUS)\s*:?\s*([\s\S]{50,500}?)(?:\n\n|\nPOST|PROCEDURE)/i;
  const preOpMatch = text.match(preOpSectionPattern);

  if (preOpMatch) {
    const preOpText = preOpMatch[1];
    confidence = CONFIDENCE.HIGH;

    // Motor deficits
    const motorPatterns = [
      /(?:weakness|paresis|plegia)/gi,
      /\d\/5\s+(?:strength|motor)/gi,
      /hemiparesis/gi,
      /quadriparesis/gi
    ];

    for (const pattern of motorPatterns) {
      const matches = preOpText.match(pattern);
      if (matches) {
        data.motor.push(...matches.map(m => cleanText(m)));
      }
    }

    // Sensory deficits
    const sensoryPatterns = [
      /(?:numbness|hypoesthesia|anesthesia)/gi,
      /sensory\s+loss/gi
    ];

    for (const pattern of sensoryPatterns) {
      const matches = preOpText.match(pattern);
      if (matches) {
        data.sensory.push(...matches.map(m => cleanText(m)));
      }
    }

    // Cranial nerve deficits
    const cnPatterns = [
      /CN\s+[IVX]+\s+(?:palsy|deficit)/gi,
      /(?:diplopia|ptosis|facial\s+weakness)/gi
    ];

    for (const pattern of cnPatterns) {
      const matches = preOpText.match(pattern);
      if (matches) {
        data.cranialNerves.push(...matches.map(m => cleanText(m)));
      }
    }

    // Speech/cognitive
    const speechPatterns = [
      /aphasia/gi,
      /dysarthria/gi,
      /dysphagia/gi,
      /confusion/gi,
      /disoriented/gi
    ];

    for (const pattern of speechPatterns) {
      const matches = preOpText.match(pattern);
      if (matches) {
        data.speech.push(...matches.map(m => cleanText(m)));
      }
    }
  }

  return { data, confidence };
};

/**
 * Extract post-operative deficits/complications
 */
export const extractPostOpDeficits = (text) => {
  const data = {
    immediate: {
      motor: [],
      sensory: [],
      cranialNerves: [],
      cognitive: [],
      speech: []
    },
    discharge: {
      motor: [],
      sensory: [],
      cranialNerves: [],
      cognitive: [],
      speech: []
    },
    new: [], // New deficits not present pre-op
    resolved: [], // Deficits that resolved
    persistent: [] // Deficits that persisted
  };

  let confidence = CONFIDENCE.LOW;

  // Look for post-operative exam
  const postOpSectionPattern = /(?:POST-?OP(?:ERATIVE)?|DISCHARGE)\s+(?:EXAM|NEURO|NEUROLOGIC|STATUS)\s*:?\s*([\s\S]{50,500}?)(?:\n\n|\n[A-Z]{2,})/i;
  const postOpMatch = text.match(postOpSectionPattern);

  if (postOpMatch) {
    const postOpText = postOpMatch[1];
    confidence = CONFIDENCE.HIGH;

    // Extract deficits similar to pre-op
    const motorPatterns = [/(?:weakness|paresis)/gi, /\d\/5\s+strength/gi];
    const sensoryPatterns = [/(?:numbness|sensory\s+loss)/gi];
    const cnPatterns = [/CN\s+[IVX]+\s+deficit/gi, /diplopia/gi];
    const speechPatterns = [/(?:aphasia|dysarthria)/gi];

    for (const pattern of motorPatterns) {
      const matches = postOpText.match(pattern);
      if (matches) {
        data.discharge.motor.push(...matches.map(m => cleanText(m)));
      }
    }

    for (const pattern of sensoryPatterns) {
      const matches = postOpText.match(pattern);
      if (matches) {
        data.discharge.sensory.push(...matches.map(m => cleanText(m)));
      }
    }

    for (const pattern of cnPatterns) {
      const matches = postOpText.match(pattern);
      if (matches) {
        data.discharge.cranialNerves.push(...matches.map(m => cleanText(m)));
      }
    }

    for (const pattern of speechPatterns) {
      const matches = postOpText.match(pattern);
      if (matches) {
        data.discharge.speech.push(...matches.map(m => cleanText(m)));
      }
    }

    // Look for "new" deficit mentions
    const newDeficitPattern = /new\s+([\w\s]+(?:weakness|deficit|palsy|paresis))/gi;
    const newMatches = text.match(newDeficitPattern);
    if (newMatches) {
      data.new.push(...newMatches.map(m => cleanText(m)));
    }

    // Look for "resolved" mentions
    const resolvedPattern = /(?:resolved|improved)\s+([\w\s]+(?:weakness|deficit))/gi;
    const resolvedMatches = text.match(resolvedPattern);
    if (resolvedMatches) {
      data.resolved.push(...resolvedMatches.map(m => cleanText(m)));
    }
  }

  return { data, confidence };
};

/**
 * Extract consultant recommendations and plans
 */
export const extractConsultations = (text) => {
  const data = {
    consultants: []
  };

  let confidence = CONFIDENCE.MEDIUM;

  const consultantServices = [
    'infectious disease',
    'thrombosis',
    'endocrinology',
    'neurology',
    'palliative care',
    'cardiology',
    'nephrology',
    'pulmonology',
    'hematology',
    'oncology',
    'radiation oncology',
    'physical therapy',
    'occupational therapy',
    'speech therapy',
    'social work',
    'case management'
  ];

  for (const service of consultantServices) {
    const consultPattern = new RegExp(`${service}[\\s\\S]{0,300}?(?:recommend|plan|suggest|advised)([^\\n\\.]{10,200})`, 'gi');
    const matches = text.matchAll(consultPattern);

    for (const match of matches) {
      data.consultants.push({
        service,
        recommendation: cleanText(match[1])
      });
      confidence = CONFIDENCE.HIGH;
    }
  }

  return { data, confidence };
};

/**
 * Extract labs (relevant values)
 */
export const extractLabs = (text) => {
  const data = {
    sodium: null,
    potassium: null,
    hemoglobin: null,
    hematocrit: null,
    platelets: null,
    wbc: null,
    inr: null,
    creatinine: null
  };

  let confidence = CONFIDENCE.MEDIUM;

  // Sodium
  const naPattern = /(?:Na|sodium)\s*:?\s*(\d{2,3})/i;
  const naMatch = text.match(naPattern);
  if (naMatch) {
    data.sodium = parseInt(naMatch[1]);
    confidence = CONFIDENCE.HIGH;
  }

  // Potassium
  const kPattern = /(?:K|potassium)\s*:?\s*(\d\.\d{1,2})/i;
  const kMatch = text.match(kPattern);
  if (kMatch) {
    data.potassium = parseFloat(kMatch[1]);
  }

  // Hemoglobin
  const hgbPattern = /(?:Hgb|hemoglobin|Hb)\s*:?\s*(\d{1,2}\.\d{1,2})/i;
  const hgbMatch = text.match(hgbPattern);
  if (hgbMatch) {
    data.hemoglobin = parseFloat(hgbMatch[1]);
  }

  // Hematocrit
  const hctPattern = /(?:Hct|hematocrit)\s*:?\s*(\d{1,2}\.\d{1,2})/i;
  const hctMatch = text.match(hctPattern);
  if (hctMatch) {
    data.hematocrit = parseFloat(hctMatch[1]);
  }

  // Platelets
  const pltPattern = /(?:plt|platelets?)\s*:?\s*(\d{2,3})/i;
  const pltMatch = text.match(pltPattern);
  if (pltMatch) {
    data.platelets = parseInt(pltMatch[1]);
  }

  // WBC
  const wbcPattern = /(?:WBC|white\s+blood\s+cell)\s*:?\s*(\d{1,2}\.\d{1,2})/i;
  const wbcMatch = text.match(wbcPattern);
  if (wbcMatch) {
    data.wbc = parseFloat(wbcMatch[1]);
  }

  // INR
  const inrPattern = /INR\s*:?\s*(\d\.\d{1,2})/i;
  const inrMatch = text.match(inrPattern);
  if (inrMatch) {
    data.inr = parseFloat(inrMatch[1]);
  }

  // Creatinine
  const crPattern = /(?:Cr|creatinine)\s*:?\s*(\d\.\d{1,2})/i;
  const crMatch = text.match(crPattern);
  if (crMatch) {
    data.creatinine = parseFloat(crMatch[1]);
  }

  return { data, confidence };
};

/**
 * Extract vital signs
 */
export const extractVitals = (text) => {
  const data = {
    bloodPressure: null,
    heartRate: null,
    respiratoryRate: null,
    temperature: null,
    oxygenSaturation: null
  };

  let confidence = CONFIDENCE.MEDIUM;

  // Blood pressure
  const bpPattern = /(?:BP|blood\s+pressure)\s*:?\s*(\d{2,3}\/\d{2,3})/i;
  const bpMatch = text.match(bpPattern);
  if (bpMatch) {
    data.bloodPressure = bpMatch[1];
    confidence = CONFIDENCE.HIGH;
  }

  // Heart rate
  const hrPattern = /(?:HR|heart\s+rate|pulse)\s*:?\s*(\d{2,3})/i;
  const hrMatch = text.match(hrPattern);
  if (hrMatch) {
    data.heartRate = parseInt(hrMatch[1]);
  }

  // Respiratory rate
  const rrPattern = /(?:RR|respiratory\s+rate)\s*:?\s*(\d{1,2})/i;
  const rrMatch = text.match(rrPattern);
  if (rrMatch) {
    data.respiratoryRate = parseInt(rrMatch[1]);
  }

  // Temperature
  const tempPattern = /(?:temp|temperature)\s*:?\s*(\d{2,3}\.\d{1,2})/i;
  const tempMatch = text.match(tempPattern);
  if (tempMatch) {
    data.temperature = parseFloat(tempMatch[1]);
  }

  // Oxygen saturation
  const o2Pattern = /(?:O2\s+sat|oxygen\s+saturation|SpO2)\s*:?\s*(\d{2,3})%?/i;
  const o2Match = text.match(o2Pattern);
  if (o2Match) {
    data.oxygenSaturation = parseInt(o2Match[1]);
  }

  return { data, confidence };
};

export default {
  extractPhysicalExam,
  extractNeurologicalExam,
  extractSignificantEvents,
  extractICUStay,
  extractPreOpDeficits,
  extractPostOpDeficits,
  extractConsultations,
  extractLabs,
  extractVitals
};
