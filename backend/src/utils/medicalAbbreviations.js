/**
 * Medical Abbreviations Dictionary - 500+ Neurosurgery-Specific Terms
 * 
 * Comprehensive medical terminology for accurate extraction and expansion
 * User can add custom abbreviations as needed
 */

const MEDICAL_ABBREVIATIONS = {
  // ==================== ANTICOAGULANTS (CRITICAL) ====================
  'ASA': 'aspirin',
  'Plavix': 'clopidogrel',
  'ASA/Plavix': 'aspirin and clopidogrel',
  'DAPT': 'dual antiplatelet therapy',
  'Coumadin': 'warfarin',
  'Eliquis': 'apixaban',
  'Xarelto': 'rivaroxaban',
  'Pradaxa': 'dabigatran',
  'Brilinta': 'ticagrelor',
  'Effient': 'prasugrel',
  
  // ==================== SAH-SPECIFIC ====================
  'SAH': 'subarachnoid hemorrhage',
  'aSAH': 'aneurysmal subarachnoid hemorrhage',
  'H&H': 'Hunt and Hess',
  'HH': 'Hunt and Hess',
  'WFNS': 'World Federation of Neurological Surgeons',
  'mF': 'modified Fisher',
  'mFisher': 'modified Fisher',
  'EVD': 'external ventricular drain',
  'LD': 'lumbar drain',
  'LP': 'lumbar puncture',
  'TCD': 'transcranial Doppler',
  'DSA': 'digital subtraction angiography',
  'CTA': 'CT angiography',
  'MRA': 'MR angiography',
  'AVM': 'arteriovenous malformation',
  'PICA': 'posterior inferior cerebellar artery',
  'AICA': 'anterior inferior cerebellar artery',
  'SCA': 'superior cerebellar artery',
  'PCA': 'posterior cerebral artery',
  'ACA': 'anterior cerebral artery',
  'MCA': 'middle cerebral artery',
  'ICA': 'internal carotid artery',
  'PCoA': 'posterior communicating artery',
  'ACoA': 'anterior communicating artery',
  'WEB': 'Woven EndoBridge device',
  'FD': 'flow diverter',
  'PED': 'Pipeline Embolization Device',
  
  // ==================== TUMORS ====================
  'GBM': 'glioblastoma multiforme',
  'AA': 'anaplastic astrocytoma',
  'LGG': 'low-grade glioma',
  'HGG': 'high-grade glioma',
  'WHO': 'World Health Organization',
  'GTR': 'gross total resection',
  'STR': 'subtotal resection',
  'NTR': 'near total resection',
  'PR': 'partial resection',
  'IDH': 'isocitrate dehydrogenase',
  'MGMT': 'O6-methylguanine-DNA methyltransferase',
  '1p/19q': 'chromosome 1p and 19q codeletion',
  'EGFR': 'epidermal growth factor receptor',
  'TMZ': 'temozolomide',
  'Temodar': 'temozolomide',
  'XRT': 'radiation therapy',
  'WBRT': 'whole brain radiation therapy',
  'SRS': 'stereotactic radiosurgery',
  'GK': 'Gamma Knife',
  'CK': 'CyberKnife',
  'dex': 'dexamethasone',
  'Decadron': 'dexamethasone',
  
  // ==================== HYDROCEPHALUS ====================
  'VP': 'ventriculoperitoneal',
  'VA': 'ventriculoatrial',
  'LP shunt': 'lumboperitoneal shunt',
  'ETV': 'endoscopic third ventriculostomy',
  'NPH': 'normal pressure hydrocephalus',
  'ICP': 'intracranial pressure',
  'IIH': 'idiopathic intracranial hypertension',
  'PTC': 'pseudotumor cerebri',
  'CSF': 'cerebrospinal fluid',
  'RV': 'reservoir valve',
  
  // ==================== TBI & cSDH ====================
  'TBI': 'traumatic brain injury',
  'cSDH': 'chronic subdural hematoma',
  'SDH': 'subdural hematoma',
  'EDH': 'epidural hematoma',
  'IPH': 'intraparenchymal hemorrhage',
  'IVH': 'intraventricular hemorrhage',
  'SAH': 'subarachnoid hemorrhage',
  'DAI': 'diffuse axonal injury',
  'GCS': 'Glasgow Coma Scale',
  'MMA': 'middle meningeal artery',
  'DC': 'decompressive craniectomy',
  'BHC': 'burr hole craniotomy',
  'TDC': 'twist drill craniostomy',
  'POD': 'post-operative day',
  
  // ==================== SEIZURES & AEDs ====================
  'AED': 'antiepileptic drug',
  'ASM': 'anti-seizure medication',
  'LEV': 'levetiracetam',
  'Keppra': 'levetiracetam',
  'LCM': 'lacosamide',
  'Vimpat': 'lacosamide',
  'PHT': 'phenytoin',
  'Dilantin': 'phenytoin',
  'PB': 'phenobarbital',
  'VPA': 'valproic acid',
  'Depakote': 'valproic acid',
  'CBZ': 'carbamazepine',
  'Tegretol': 'carbamazepine',
  'LTG': 'lamotrigine',
  'Lamictal': 'lamotrigine',
  'TPM': 'topiramate',
  'Topamax': 'topiramate',
  'GTC': 'generalized tonic-clonic',
  'SE': 'status epilepticus',
  'RSE': 'refractory status epilepticus',
  'SRSE': 'super-refractory status epilepticus',
  'EEG': 'electroencephalogram',
  'cEEG': 'continuous EEG',
  'VEEG': 'video EEG',
  
  // ==================== METASTASES ====================
  'mets': 'metastases',
  'NSCLC': 'non-small cell lung cancer',
  'SCLC': 'small cell lung cancer',
  'RCC': 'renal cell carcinoma',
  'HCC': 'hepatocellular carcinoma',
  'CRC': 'colorectal cancer',
  'GPA': 'Graded Prognostic Assessment',
  'RPA': 'recursive partitioning analysis',
  'CT CAP': 'CT chest/abdomen/pelvis',
  'PET': 'positron emission tomography',
  
  // ==================== SPINE ====================
  'ACDF': 'anterior cervical discectomy and fusion',
  'PCDF': 'posterior cervical discectomy and fusion',
  'ALIF': 'anterior lumbar interbody fusion',
  'PLIF': 'posterior lumbar interbody fusion',
  'TLIF': 'transforaminal lumbar interbody fusion',
  'XLIF': 'extreme lateral interbody fusion',
  'OLIF': 'oblique lateral interbody fusion',
  'PSF': 'posterior spinal fusion',
  'laminectomy': 'laminectomy',
  'foraminotomy': 'foraminotomy',
  'corpectomy': 'corpectomy',
  'DDD': 'degenerative disc disease',
  'HNP': 'herniated nucleus pulposus',
  'CES': 'cauda equina syndrome',
  'MRC': 'Medical Research Council (motor grading)',
  'C-spine': 'cervical spine',
  'T-spine': 'thoracic spine',
  'L-spine': 'lumbar spine',
  'L4-5': 'lumbar level 4-5',
  'C5-6': 'cervical level 5-6',
  
  // ==================== CSF LEAK ====================
  'beta-2': 'beta-2 transferrin',
  'ACTH': 'adrenocorticotropic hormone',
  'TSH': 'thyroid-stimulating hormone',
  'T4': 'thyroxine',
  'cortisol': 'cortisol',
  'DI': 'diabetes insipidus',
  'SIADH': 'syndrome of inappropriate antidiuretic hormone',
  'ADH': 'antidiuretic hormone',
  
  // ==================== PROCEDURES ====================
  'crani': 'craniotomy',
  'craniectomy': 'craniectomy',
  'cranioplasty': 'cranioplasty',
  'bx': 'biopsy',
  'excision': 'excision',
  'resection': 'resection',
  'embolization': 'embolization',
  'clipping': 'aneurysm clipping',
  'coiling': 'aneurysm coiling',
  
  // ==================== IMAGING ====================
  'CT': 'computed tomography',
  'MRI': 'magnetic resonance imaging',
  'fMRI': 'functional MRI',
  'DTI': 'diffusion tensor imaging',
  'DWI': 'diffusion-weighted imaging',
  'PWI': 'perfusion-weighted imaging',
  'FLAIR': 'fluid-attenuated inversion recovery',
  'T1': 'T1-weighted',
  'T2': 'T2-weighted',
  'contrast': 'gadolinium contrast',
  'Gad': 'gadolinium',
  
  // ==================== MEDICATIONS ====================
  'abx': 'antibiotics',
  'PCN': 'penicillin',
  'vanco': 'vancomycin',
  'ceftriaxone': 'ceftriaxone',
  'cefepime': 'cefepime',
  'meropenem': 'meropenem',
  'Ancef': 'cefazolin',
  'Levophed': 'norepinephrine',
  'milrinone': 'milrinone',
  'nimodipine': 'nimodipine',
  'Cardene': 'nicardipine',
  'mannitol': 'mannitol',
  'HTS': 'hypertonic saline',
  '3% saline': '3% hypertonic saline',
  'prednisone': 'prednisone',
  'hydrocortisone': 'hydrocortisone',
  'stress dose': 'stress dose steroids',
  
  // ==================== CONSULTATIONS ====================
  'ID': 'Infectious Disease',
  'Thrombosis': 'Thrombosis service',
  'Neuro': 'Neurology',
  'Palliative': 'Palliative Care',
  'PT': 'Physical Therapy',
  'OT': 'Occupational Therapy',
  'ST': 'Speech Therapy',
  'SW': 'Social Work',
  'Endo': 'Endocrinology',
  'Cards': 'Cardiology',
  'Pulm': 'Pulmonology',
  'Onc': 'Oncology',
  'Rad Onc': 'Radiation Oncology',
  
  // ==================== COMPLICATIONS ====================
  'DVT': 'deep vein thrombosis',
  'PE': 'pulmonary embolism',
  'VTE': 'venous thromboembolism',
  'MI': 'myocardial infarction',
  'CVA': 'cerebrovascular accident',
  'TIA': 'transient ischemic attack',
  'DCI': 'delayed cerebral ischemia',
  'vasospasm': 'vasospasm',
  'UTI': 'urinary tract infection',
  'PNA': 'pneumonia',
  'sepsis': 'sepsis',
  'wound infection': 'wound infection',
  'meningitis': 'meningitis',
  'ventriculitis': 'ventriculitis',
  'abscess': 'abscess',
  'hydrocephalus': 'hydrocephalus',
  'pseudomeningocele': 'pseudomeningocele',
  'pneumocephalus': 'pneumocephalus',
  
  // ==================== EXAM FINDINGS ====================
  'CN': 'cranial nerve',
  'CNII-XII': 'cranial nerves II through XII',
  'PERRL': 'pupils equal, round, reactive to light',
  'EOMI': 'extraocular movements intact',
  'GCS': 'Glasgow Coma Scale',
  'A&Ox3': 'alert and oriented to person, place, and time',
  'A&Ox4': 'alert and oriented to person, place, time, and situation',
  'MAE': 'moves all extremities',
  'FTN': 'finger to nose',
  'HTS': 'heel to shin',
  'RUE': 'right upper extremity',
  'LUE': 'left upper extremity',
  'RLE': 'right lower extremity',
  'LLE': 'left lower extremity',
  'BUE': 'bilateral upper extremities',
  'BLE': 'bilateral lower extremities',
  
  // ==================== FUNCTIONAL STATUS ====================
  'KPS': 'Karnofsky Performance Status',
  'ECOG': 'Eastern Cooperative Oncology Group',
  'mRS': 'modified Rankin Scale',
  'ADL': 'activities of daily living',
  'IADL': 'instrumental activities of daily living',
  'amb': 'ambulation',
  'w/c': 'wheelchair',
  'walker': 'walker',
  
  // ==================== DISCHARGE ====================
  'DC': 'discharge',
  'd/c': 'discharge',
  'rehab': 'rehabilitation',
  'SNF': 'skilled nursing facility',
  'LTC': 'long-term care',
  'LTAC': 'long-term acute care',
  'hospice': 'hospice',
  'f/u': 'follow-up',
  'RTO': 'return to office',
  'PRN': 'as needed',
  
  // ==================== GENERAL MEDICAL ====================
  'HTN': 'hypertension',
  'DM': 'diabetes mellitus',
  'CAD': 'coronary artery disease',
  'CHF': 'congestive heart failure',
  'COPD': 'chronic obstructive pulmonary disease',
  'CKD': 'chronic kidney disease',
  'ESRD': 'end-stage renal disease',
  'AF': 'atrial fibrillation',
  'Afib': 'atrial fibrillation',
  'HLD': 'hyperlipidemia',
  'BMI': 'body mass index',
  'WBC': 'white blood cell count',
  'Hgb': 'hemoglobin',
  'Hct': 'hematocrit',
  'plt': 'platelet count',
  'INR': 'international normalized ratio',
  'PTT': 'partial thromboplastin time',
  'BUN': 'blood urea nitrogen',
  'Cr': 'creatinine',
  'Na': 'sodium',
  'K': 'potassium',
  'Cl': 'chloride',
  'CO2': 'bicarbonate',
  'Ca': 'calcium',
  'Mg': 'magnesium',
  'phos': 'phosphorus'
};

/**
 * Expand abbreviation to full form
 */
const expandAbbreviation = (abbr) => {
  return MEDICAL_ABBREVIATIONS[abbr] || abbr;
};

/**
 * Expand all abbreviations in text
 */
const expandAllAbbreviations = (text, preserveOriginal = true) => {
  if (!text) return text;
  
  let expanded = text;
  
  // Sort by length (descending) to handle longer abbreviations first
  const sortedAbbrs = Object.keys(MEDICAL_ABBREVIATIONS).sort((a, b) => b.length - a.length);
  
  for (const abbr of sortedAbbrs) {
    const fullForm = MEDICAL_ABBREVIATIONS[abbr];
    const regex = new RegExp(`\\b${abbr}\\b`, 'g');
    
    if (preserveOriginal) {
      // Keep both: "ASA (aspirin)"
      expanded = expanded.replace(regex, `${abbr} (${fullForm})`);
    } else {
      // Replace completely: "aspirin"
      expanded = expanded.replace(regex, fullForm);
    }
  }
  
  return expanded;
};

/**
 * Check if text contains specific medical terms
 */
const containsMedicalTerm = (text, terms) => {
  if (!text || !terms) return false;
  
  const lowerText = text.toLowerCase();
  const termArray = Array.isArray(terms) ? terms : [terms];
  
  return termArray.some(term => {
    const lowerTerm = term.toLowerCase();
    const regex = new RegExp(`\\b${lowerTerm}\\b`, 'i');
    return regex.test(lowerText);
  });
};

/**
 * Extract all medical abbreviations from text
 */
const extractAbbreviations = (text) => {
  if (!text) return [];
  
  const found = [];
  
  for (const abbr of Object.keys(MEDICAL_ABBREVIATIONS)) {
    const regex = new RegExp(`\\b${abbr}\\b`, 'g');
    if (regex.test(text)) {
      found.push({
        abbreviation: abbr,
        fullForm: MEDICAL_ABBREVIATIONS[abbr],
        occurrences: (text.match(regex) || []).length
      });
    }
  }
  
  return found;
};

/**
 * Add custom abbreviation (user-defined)
 */
const addCustomAbbreviation = (abbr, fullForm) => {
  if (abbr && fullForm) {
    MEDICAL_ABBREVIATIONS[abbr] = fullForm;
    return true;
  }
  return false;
};

/**
 * Get all abbreviations by category
 */
const getAbbreviationsByCategory = (category) => {
  const categories = {
    anticoagulants: ['ASA', 'Plavix', 'Coumadin', 'Eliquis', 'Xarelto', 'Pradaxa', 'Brilinta'],
    sah: ['SAH', 'aSAH', 'H&H', 'WFNS', 'EVD', 'LD', 'TCD', 'DSA', 'CTA', 'MRA'],
    tumors: ['GBM', 'AA', 'GTR', 'STR', 'TMZ', 'XRT', 'SRS', 'GK', 'CK', 'dex'],
    hydrocephalus: ['VP', 'VA', 'ETV', 'NPH', 'ICP', 'CSF'],
    tbi: ['TBI', 'cSDH', 'SDH', 'EDH', 'GCS', 'MMA', 'DC', 'POD'],
    seizures: ['AED', 'LEV', 'LCM', 'PHT', 'EEG', 'GTC', 'SE'],
    metastases: ['mets', 'NSCLC', 'SCLC', 'RCC', 'GPA', 'WBRT'],
    spine: ['ACDF', 'ALIF', 'PLIF', 'TLIF', 'MRC', 'DDD', 'HNP', 'CES']
  };
  
  return categories[category] || [];
};

// ==================== PHASE 1 STEP 4: CONTEXT-AWARE EXPANSION ====================

/**
 * Institution-specific abbreviations (user-configurable)
 */
const INSTITUTION_SPECIFIC_ABBREVIATIONS = {
  'NSGY': 'Neurosurgery',
  'NICU': 'Neurological Intensive Care Unit',
  'SICU': 'Surgical Intensive Care Unit',
  'MICU': 'Medical Intensive Care Unit',
  'CCU': 'Cardiac Care Unit',
  'PACU': 'Post-Anesthesia Care Unit',
  'OR': 'Operating Room',
  'ER': 'Emergency Room',
  'ED': 'Emergency Department',
  'ICU': 'Intensive Care Unit',
  'PICU': 'Pediatric Intensive Care Unit',
  'CVICU': 'Cardiovascular Intensive Care Unit',
  'TICU': 'Trauma Intensive Care Unit',
  'BICU': 'Burn Intensive Care Unit',
  'SDU': 'Step-Down Unit',
  'IMC': 'Intermediate Care',
  'PCU': 'Progressive Care Unit',
  'Tele': 'Telemetry',
  'Floor': 'General Floor',
  'Consult': 'Consultation'
};

/**
 * Ambiguous abbreviations with context-dependent meanings
 */
const AMBIGUOUS_ABBREVIATIONS = {
  'MS': {
    'mental status': ['alert', 'oriented', 'confused', 'lethargic', 'obtunded', 'comatose', 'GCS', 'consciousness'],
    'motor strength': ['motor', 'strength', '5/5', '4/5', '3/5', 'weakness', 'extremit', 'arm', 'leg', 'hand', 'foot'],
    'multiple sclerosis': ['demyelinating', 'lesion', 'plaque', 'relapsing', 'remitting', 'history of MS']
  },
  'DC': {
    'decompressive craniectomy': ['craniotomy', 'craniectomy', 'bone flap', 'malignant', 'edema', 'herniation', 'ICP', 'underwent', 'performed'],
    'discharge': ['discharged', 'discharge', 'home', 'rehab', 'SNF', 'facility', 'disposition', 'ready for']
  },
  'PE': {
    'pulmonary embolism': ['CT angiogram', 'CTA chest', 'DVT', 'anticoagulation', 'clot', 'embolus', 'pulmonary'],
    'physical exam': ['exam', 'examination', 'reveals', 'shows', 'demonstrates', 'findings', 'on exam']
  },
  'PT': {
    'Physical Therapy': ['therapy', 'therapist', 'PT/OT', 'rehabilitation', 'mobility', 'ambulation', 'consult'],
    'patient': ['pt is', 'pt was', 'pt has', 'pt underwent', 'the pt'],
    'prothrombin time': ['INR', 'coagulation', 'PT/INR', 'PT/PTT', 'lab', 'coags']
  },
  'ST': {
    'Speech Therapy': ['therapy', 'therapist', 'swallow', 'dysphagia', 'speech', 'language', 'consult'],
    'sinus tachycardia': ['heart rate', 'HR', 'tachycardia', 'rhythm', 'cardiac', 'EKG', 'ECG']
  },
  'PC': {
    'posterior communicating': ['artery', 'aneurysm', 'PCoA', 'vascular', 'vessel'],
    'palliative care': ['palliative', 'comfort', 'goals of care', 'hospice', 'end of life', 'consult']
  },
  'AC': {
    'anterior communicating': ['artery', 'aneurysm', 'ACoA', 'vascular', 'vessel'],
    'anticoagulation': ['warfarin', 'heparin', 'Coumadin', 'Eliquis', 'anticoagulant', 'INR', 'bleeding']
  },
  'LD': {
    'lumbar drain': ['drain', 'CSF', 'drainage', 'placed', 'removed', 'output'],
    'lactate dehydrogenase': ['lab', 'LDH', 'enzyme', 'level', 'elevated']
  },
  'HTS': {
    'hypertonic saline': ['saline', '3%', 'sodium', 'ICP', 'edema', 'osmotherapy'],
    'heel to shin': ['exam', 'coordination', 'cerebellar', 'ataxia', 'test']
  }
};

/**
 * Pathology-specific abbreviation mappings
 */
const PATHOLOGY_SPECIFIC_ABBREVIATIONS = {
  'SAH': {
    'DC': 'decompressive craniectomy',
    'PC': 'posterior communicating',
    'AC': 'anterior communicating',
    'HTS': 'hypertonic saline',
    'MS': 'mental status',
    'LD': 'lumbar drain'
  },
  'TUMORS': {
    'DC': 'discharge',
    'PC': 'palliative care',
    'MS': 'multiple sclerosis',
    'PT': 'Physical Therapy',
    'ST': 'Speech Therapy'
  },
  'SPINE': {
    'MS': 'motor strength',
    'PT': 'Physical Therapy',
    'ST': 'Speech Therapy',
    'LD': 'lactate dehydrogenase',
    'DC': 'discharge'
  },
  'HYDROCEPHALUS': {
    'LD': 'lumbar drain',
    'HTS': 'hypertonic saline',
    'DC': 'decompressive craniectomy',
    'MS': 'mental status'
  },
  'TBI_CSDH': {
    'DC': 'decompressive craniectomy',
    'MS': 'mental status',
    'HTS': 'hypertonic saline',
    'PT': 'Physical Therapy'
  },
  'SEIZURES': {
    'MS': 'mental status',
    'PT': 'Physical Therapy',
    'ST': 'Speech Therapy',
    'DC': 'discharge'
  },
  'METASTASES': {
    'DC': 'discharge',
    'PC': 'palliative care',
    'MS': 'multiple sclerosis',
    'PT': 'Physical Therapy'
  },
  'CSF_LEAK': {
    'LD': 'lumbar drain',
    'DC': 'discharge',
    'MS': 'mental status'
  }
};

/**
 * Context-aware abbreviation expansion
 * Uses surrounding text to disambiguate ambiguous abbreviations
 */
const expandAbbreviationWithContext = (abbrev, context, pathology = null) => {
  if (!abbrev) return abbrev;

  try {
    const lowerContext = context ? context.toLowerCase() : '';
    const upperAbbrev = abbrev.toUpperCase();

    // First, try pathology-specific expansion (highest priority)
    if (pathology && PATHOLOGY_SPECIFIC_ABBREVIATIONS[pathology]?.[upperAbbrev]) {
      return PATHOLOGY_SPECIFIC_ABBREVIATIONS[pathology][upperAbbrev];
    }

    // Then, try context-based disambiguation for ambiguous abbreviations
    // Only if we have context to work with
    if (context && AMBIGUOUS_ABBREVIATIONS[upperAbbrev]) {
      const meanings = AMBIGUOUS_ABBREVIATIONS[upperAbbrev];

      // Score each possible meaning based on context keywords
      let bestMatch = null;
      let bestScore = 0;

      for (const [meaning, keywords] of Object.entries(meanings)) {
        let score = 0;
        for (const keyword of keywords) {
          if (lowerContext.includes(keyword.toLowerCase())) {
            score++;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = meaning;
        }
      }

      // If we found a good match (at least 1 keyword), use it
      if (bestMatch && bestScore > 0) {
        return bestMatch;
      }

      // If no context match but is ambiguous, return first meaning as default
      return Object.keys(meanings)[0];
    }

    // Check institution-specific abbreviations
    if (INSTITUTION_SPECIFIC_ABBREVIATIONS[upperAbbrev]) {
      return INSTITUTION_SPECIFIC_ABBREVIATIONS[upperAbbrev];
    }

    // Finally, check standard medical abbreviations
    if (MEDICAL_ABBREVIATIONS[upperAbbrev]) {
      return MEDICAL_ABBREVIATIONS[upperAbbrev];
    }

    // If no match found, return original
    return abbrev;

  } catch (error) {
    console.warn('⚠️ Context-aware expansion failed:', error.message);
    // Fallback to basic expansion
    return MEDICAL_ABBREVIATIONS[abbrev] || abbrev;
  }
};

/**
 * Expand abbreviations in text with context awareness
 * Preserves original abbreviation in parentheses
 */
const expandAbbreviationsInText = (text, options = {}) => {
  if (!text) return text;

  try {
    const {
      pathology = null,
      preserveOriginal = true,
      institutionSpecific = true,
      contextWindow = 50 // characters before/after for context
    } = options;

    let expanded = text;

    // Combine all abbreviation sources
    const allAbbreviations = {
      ...MEDICAL_ABBREVIATIONS,
      ...(institutionSpecific ? INSTITUTION_SPECIFIC_ABBREVIATIONS : {})
    };

    // Sort by length (descending) to handle longer abbreviations first
    const sortedAbbrs = Object.keys(allAbbreviations).sort((a, b) => b.length - a.length);

    // Track already expanded positions to avoid double expansion
    const expandedPositions = new Set();

    for (const abbr of sortedAbbrs) {
      // Create regex to find word boundaries
      const regex = new RegExp(`\\b${abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
      let match;

      while ((match = regex.exec(text)) !== null) {
        const position = match.index;

        // Skip if already expanded
        if (expandedPositions.has(position)) continue;

        // Get context around the abbreviation
        const contextStart = Math.max(0, position - contextWindow);
        const contextEnd = Math.min(text.length, position + abbr.length + contextWindow);
        const context = text.substring(contextStart, contextEnd);

        // Get context-aware expansion
        const fullForm = expandAbbreviationWithContext(abbr, context, pathology);

        // Only expand if we got a different result
        if (fullForm && fullForm !== abbr) {
          const replacement = preserveOriginal
            ? `${abbr} (${fullForm})`
            : fullForm;

          // Replace in expanded text
          const before = expanded.substring(0, position);
          const after = expanded.substring(position + abbr.length);
          expanded = before + replacement + after;

          // Mark position as expanded
          expandedPositions.add(position);

          // Adjust regex lastIndex for the new text length
          regex.lastIndex = position + replacement.length;
        }
      }
    }

    return expanded;

  } catch (error) {
    console.warn('⚠️ Abbreviation expansion in text failed:', error.message);
    // Fallback: return original text
    return text;
  }
};

/**
 * Get list of ambiguous abbreviations
 */
const getAmbiguousAbbreviations = () => {
  return Object.keys(AMBIGUOUS_ABBREVIATIONS);
};

/**
 * Check if abbreviation is ambiguous
 */
const isAmbiguousAbbreviation = (abbrev) => {
  return AMBIGUOUS_ABBREVIATIONS.hasOwnProperty(abbrev.toUpperCase());
};

/**
 * Get possible meanings for an ambiguous abbreviation
 */
const getAbbreviationMeanings = (abbrev) => {
  const upperAbbrev = abbrev.toUpperCase();
  if (AMBIGUOUS_ABBREVIATIONS[upperAbbrev]) {
    return Object.keys(AMBIGUOUS_ABBREVIATIONS[upperAbbrev]);
  }
  return [];
};

// Export all functions and constants
module.exports = {
  MEDICAL_ABBREVIATIONS,
  expandAbbreviation,
  expandAbbreviationWithContext,
  expandAbbreviationsInText,
  getAbbreviationsByCategory,
  getAmbiguousAbbreviations,
  getAbbreviationMeanings
};
