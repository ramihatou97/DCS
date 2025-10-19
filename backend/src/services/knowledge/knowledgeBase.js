/**
 * Knowledge Base Service
 * 
 * Provides structured access to neurosurgical clinical knowledge.
 * Integrates comprehensive neurosurgical protocols, examination frameworks,
 * complication management, and follow-up guidelines into the extraction
 * and summary generation pipeline.
 * 
 * Features:
 * - Examination protocols (neurological, spine-specific)
 * - Complication management (infections, seizures, endocrine, etc.)
 * - Red flags for urgent evaluation
 * - Follow-up protocols by pathology
 * - Surveillance schedules
 * - Validation rules
 * - Context-aware knowledge retrieval
 */

/**
 * Neurological Examination Framework
 */
const NEURO_EXAM_PROTOCOLS = {
  gcs: {
    name: 'Glasgow Coma Scale',
    components: {
      eye: { min: 1, max: 4, description: 'Eye opening response' },
      verbal: { min: 1, max: 5, description: 'Verbal response' },
      motor: { min: 1, max: 6, description: 'Motor response' }
    },
    totalRange: { min: 3, max: 15 },
    interpretation: {
      severe: { range: [3, 8], description: 'Severe brain injury' },
      moderate: { range: [9, 12], description: 'Moderate brain injury' },
      mild: { range: [13, 15], description: 'Mild brain injury' }
    },
    clinicalSignificance: 'Any decline ≥2 points warrants immediate imaging'
  },
  
  pupils: {
    name: 'Pupillary Examination',
    parameters: ['size (mm)', 'reactivity (brisk/sluggish/fixed)', 'symmetry'],
    normalRange: { size: [2, 5], anisocoria: '<1mm' },
    criticalFindings: {
      fixedDilated: 'Uncal herniation until proven otherwise',
      bilateral: 'Severe brainstem injury or medication effect',
      anisocoria: 'Significant if >1mm'
    }
  },
  
  motor: {
    name: 'Motor Examination',
    scale: {
      0: 'No movement',
      1: 'Flicker of movement',
      2: 'Movement with gravity eliminated',
      3: 'Movement against gravity',
      4: 'Movement against resistance',
      5: 'Normal power'
    },
    testAreas: [
      'deltoid', 'biceps', 'triceps', 'wrist extension', 'grip',
      'hip flexion', 'knee extension', 'knee flexion', 'dorsiflexion', 'plantarflexion'
    ],
    drift: 'Pronator drift with arms extended, palms up, eyes closed for 10 seconds'
  }
};

/**
 * Spine-Specific Examination
 */
const SPINE_EXAM_PROTOCOLS = {
  caudaEquina: {
    name: 'Cauda Equina Syndrome Assessment',
    criticalFindings: [
      'Saddle anesthesia (perianal sensation)',
      'Urinary retention (PVR >100-200cc)',
      'Rectal tone (diminished/absent)',
      'Bowel/bladder dysfunction',
      'Bilateral lower extremity weakness'
    ],
    urgency: 'Emergent decompression if acute with findings'
  },
  
  myelopathy: {
    name: 'Myelopathy Signs',
    signs: [
      "Hoffmann's sign",
      'Babinski sign',
      'Clonus',
      'Hyperreflexia',
      'Inverted radial reflex',
      'Broad-based gait'
    ]
  }
};

/**
 * Grading Scales by Pathology
 */
const GRADING_SCALES = {
  SAH: {
    huntHess: {
      name: 'Hunt and Hess Grade',
      range: [1, 5],
      grades: {
        1: 'Asymptomatic or mild headache',
        2: 'Moderate to severe headache, nuchal rigidity, no deficit except CN palsy',
        3: 'Drowsiness, confusion, mild focal deficit',
        4: 'Stupor, moderate to severe hemiparesis',
        5: 'Deep coma, decerebrate posturing'
      },
      prognosticSignificance: 'Higher grade = worse outcome. Grade 4-5 have 50-70% mortality.'
    },
    fisher: {
      name: 'Fisher Grade',
      range: [1, 4],
      grades: {
        1: 'No blood detected',
        2: 'Diffuse thin SAH (<1mm)',
        3: 'Localized clot or thick SAH (>1mm)',
        4: 'Diffuse or no SAH with IVH or parenchymal extension'
      },
      vasospasmRisk: {
        1: 'Low (5-10%)',
        2: 'Low (15-20%)',
        3: 'High (60-70%)',
        4: 'Moderate (30-40%)'
      },
      clinicalSignificance: 'Grade 3 has highest vasospasm risk - requires intensive monitoring'
    },
    modifiedFisher: {
      name: 'Modified Fisher Grade',
      range: [0, 4],
      grades: {
        0: 'No SAH or IVH',
        1: 'Thin SAH, no IVH',
        2: 'Thin SAH with IVH',
        3: 'Thick SAH, no IVH',
        4: 'Thick SAH with IVH'
      },
      vasospasmRisk: 'Grade 3-4 highest risk (IVH presence increases risk)',
      preferredOver: 'Original Fisher - better predictor of vasospasm'
    },
    wfns: {
      name: 'World Federation of Neurosurgical Societies',
      range: [1, 5],
      grades: {
        1: 'GCS 15, no motor deficit',
        2: 'GCS 13-14, no motor deficit',
        3: 'GCS 13-14, with motor deficit',
        4: 'GCS 7-12, with or without motor deficit',
        5: 'GCS 3-6, with or without motor deficit'
      }
    }
  },

  TUMORS: {
    whoGrade: {
      name: 'WHO Grade',
      range: [1, 4],
      grades: {
        1: 'Benign, slow-growing, excellent prognosis',
        2: 'Low-grade malignant, may recur',
        3: 'Malignant, anaplastic features',
        4: 'Highly malignant, aggressive, poor prognosis'
      },
      commonTumors: {
        glioblastoma: 'Grade 4 - median survival 15-18 months',
        anaplasticAstrocytoma: 'Grade 3 - median survival 2-3 years',
        diffuseAstrocytoma: 'Grade 2 - median survival 5-8 years',
        pilocyticAstrocytoma: 'Grade 1 - often curable with resection',
        meningioma: 'Grade 1 (80%), Grade 2 (15%), Grade 3 (5%)'
      }
    },
    molecularMarkers: {
      idh: {
        name: 'IDH Mutation',
        significance: 'IDH-mutant gliomas have better prognosis than IDH-wildtype',
        impact: '2-3x longer survival in IDH-mutant'
      },
      mgmt: {
        name: 'MGMT Promoter Methylation',
        significance: 'Predicts response to temozolomide chemotherapy',
        impact: 'Methylated = better response to TMZ, improved survival'
      },
      '1p19q': {
        name: '1p/19q Codeletion',
        significance: 'Defines oligodendroglioma, predicts chemo/radiation sensitivity',
        impact: 'Codeleted tumors have excellent response to treatment'
      }
    },
    resectionExtent: {
      gtr: 'Gross Total Resection - no residual on MRI',
      str: 'Subtotal Resection - <90% resection',
      biopsy: 'Biopsy only - diagnostic tissue obtained',
      significance: 'GTR associated with longer survival in most tumor types'
    }
  },

  SPINE: {
    asia: {
      name: 'ASIA Impairment Scale',
      range: ['A', 'B', 'C', 'D', 'E'],
      grades: {
        A: 'Complete - No motor or sensory function in S4-S5',
        B: 'Sensory Incomplete - Sensory but no motor function below level, including S4-S5',
        C: 'Motor Incomplete - Motor function preserved below level, >50% key muscles <3/5',
        D: 'Motor Incomplete - Motor function preserved below level, ≥50% key muscles ≥3/5',
        E: 'Normal - Motor and sensory function normal'
      },
      prognosticSignificance: 'ASIA A has <5% chance of meaningful recovery. ASIA D has >80% chance of ambulation.'
    },
    frankelGrade: {
      name: 'Frankel Grade',
      range: ['A', 'B', 'C', 'D', 'E'],
      grades: {
        A: 'Complete motor and sensory loss',
        B: 'Sensory only, no motor',
        C: 'Motor useless (non-functional)',
        D: 'Motor useful (functional)',
        E: 'Normal'
      }
    }
  },

  TBI: {
    marshall: {
      name: 'Marshall CT Classification',
      range: [1, 6],
      grades: {
        1: 'Diffuse Injury I - No visible pathology',
        2: 'Diffuse Injury II - Cisterns present, shift 0-5mm, lesion <25cc',
        3: 'Diffuse Injury III (Swelling) - Cisterns compressed/absent, shift 0-5mm',
        4: 'Diffuse Injury IV (Shift) - Midline shift >5mm',
        5: 'Evacuated Mass Lesion',
        6: 'Non-evacuated Mass Lesion >25cc'
      },
      mortality: {
        1: '10%',
        2: '15%',
        3: '35%',
        4: '55%',
        5: '30%',
        6: '55%'
      }
    },
    rotterdam: {
      name: 'Rotterdam Score',
      range: [1, 6],
      components: ['Basal cisterns', 'Midline shift', 'Epidural mass', 'IVH/tSAH'],
      mortality: 'Score 1 = 0% mortality, Score 6 = 60% mortality'
    }
  },

  functionalScores: {
    mrs: {
      name: 'Modified Rankin Scale',
      range: [0, 6],
      grades: {
        0: 'No symptoms',
        1: 'No significant disability - able to carry out all usual activities',
        2: 'Slight disability - unable to carry out all previous activities but able to look after own affairs',
        3: 'Moderate disability - requires some help but able to walk unassisted',
        4: 'Moderately severe disability - unable to walk or attend to bodily needs without assistance',
        5: 'Severe disability - bedridden, incontinent, requires constant care',
        6: 'Dead'
      },
      clinicalSignificance: 'mRS 0-2 = good outcome, mRS 3-5 = poor outcome'
    },
    kps: {
      name: 'Karnofsky Performance Status',
      range: [0, 100],
      interpretation: {
        100: 'Normal, no complaints',
        90: 'Minor signs/symptoms',
        80: 'Normal activity with effort',
        70: 'Cares for self, unable to work',
        60: 'Requires occasional assistance',
        50: 'Requires considerable assistance',
        40: 'Disabled, requires special care',
        30: 'Severely disabled',
        20: 'Very sick',
        10: 'Moribund',
        0: 'Dead'
      },
      clinicalSignificance: 'KPS ≥70 = independent, KPS <70 = dependent'
    },
    gos: {
      name: 'Glasgow Outcome Scale',
      range: [1, 5],
      grades: {
        1: 'Dead',
        2: 'Vegetative State',
        3: 'Severe Disability - conscious but dependent',
        4: 'Moderate Disability - independent but disabled',
        5: 'Good Recovery - resumption of normal life'
      }
    }
  }
};

/**
 * Complication Management Protocols
 */
const COMPLICATION_PROTOCOLS = {
  meningitis: {
    name: 'Postoperative Meningitis',
    diagnosis: {
      clinical: ['Fever', 'Headache', 'Neck stiffness', 'Altered mental status', 'Photophobia'],
      labs: {
        bloodCultures: '2 sets before antibiotics',
        cbc: 'Leukocytosis, left shift, bandemia',
        crp_esr: 'Trend serially (CRP peaks 48hrs)',
        procalcitonin: 'Bacterial infection marker'
      },
      csf: {
        wbc: '>1000 cells/μL (PMN >80%)',
        protein: '>200 mg/dL (often >500)',
        glucose: '<40 mg/dL or CSF:serum ratio <0.4',
        gramStain: 'Positive in 60-90%'
      }
    },
    treatment: {
      empiric: ['Vancomycin 15-20 mg/kg IV q8-12h', 'Cefepime 2g IV q8h or Meropenem 2g IV q8h'],
      duration: {
        uncomplicated: '10-14 days IV',
        hardwareAssociated: '4-6 weeks minimum',
        pseudomonas: '3 weeks minimum'
      },
      monitoring: ['Daily clinical assessment', 'CBC, CRP/ESR every 2-3 days', 'Repeat LP in 48-72hrs if not improving']
    },
    consultants: ['Infectious Disease within 24hrs']
  },
  
  seizures: {
    name: 'Postoperative Seizures',
    incidence: '15-30% supratentorial craniotomy',
    timing: ['Immediate (<24hrs)', 'Early (<1 week)', 'Late (>1 week)'],
    workup: {
      labs: ['Glucose', 'Electrolytes', 'Ca', 'Mg', 'AED levels if on medication'],
      imaging: 'Stat CT head (rule out hemorrhage, stroke, increased ICP)',
      eeg: 'If concern for subclinical seizures or status epilepticus'
    },
    treatment: {
      acute: ['Lorazepam 2-4mg IV', 'Levetiracetam 1000-1500mg IV loading'],
      maintenance: {
        levetiracetam: '500-1000mg BID (preferred, no drug interactions)',
        phenytoin: 'Monitor levels',
        lacosamide: '100-200mg BID (alternative)'
      },
      duration: '3-12 months postop, longer if tumor/structural lesion'
    },
    consultants: ['Neurology for AED selection and duration']
  },
  
  diabetesInsipidus: {
    name: 'Diabetes Insipidus',
    pathophysiology: 'ADH deficiency (posterior pituitary/stalk injury)',
    timing: 'Transsphenoidal surgery (triphasic response common)',
    diagnosis: {
      polyuria: '>3 L/day or >200-300 cc/hr for 2+ consecutive hours',
      hypernatremia: 'Na >145 (often >150)',
      urineOsmolality: '<300 mOsm/kg with high serum osmolality'
    },
    treatment: {
      acute: 'DDAVP 1-2 mcg IV/SQ or 0.1-0.2 mg PO',
      monitoring: ['Strict I/Os', 'Serum Na q4-6h', 'Urine specific gravity/osmolality']
    },
    triphasicResponse: {
      phase1: 'Days 1-5: DI from neuronal shock',
      phase2: 'Days 5-7: SIADH from dying neuron ADH release',
      phase3: 'Day 7+: Permanent DI if sufficient damage'
    },
    consultants: ['Endocrinology within 24hrs']
  },
  
  vasospasm: {
    name: 'Cerebral Vasospasm (SAH)',
    timing: 'Days 3-14 post-SAH (peak 7-10 days)',
    incidence: '30-70% radiographic, 20-30% symptomatic',
    monitoring: {
      clinical: {
        frequency: 'Hourly neuro checks days 3-14',
        signs: ['New focal deficit', 'Decreased level of consciousness', 'Aphasia', 'Neglect']
      },
      tcd: {
        frequency: 'Daily or every other day',
        thresholds: {
          mca: '>120 cm/s concerning, >200 cm/s severe',
          aca: '>90 cm/s concerning',
          lindegaardRatio: '>3 suggests vasospasm (MCA/ICA ratio)'
        }
      },
      cta: 'If clinical deterioration or TCD concerning',
      perfusionCT: 'If diagnosis uncertain'
    },
    prevention: {
      nimodipine: {
        dose: '60mg PO/NG q4h for 21 days',
        mechanism: 'Calcium channel blocker - improves outcomes',
        sideEffects: 'Hypotension (hold if SBP <100)',
        critical: 'DO NOT MISS DOSES - set alarms'
      },
      euvolemia: 'Maintain adequate volume status (avoid hypovolemia)',
      avoidHypotension: 'Maintain CPP >60-70 mmHg'
    },
    treatment: {
      medical: {
        hypertension: 'Induced HTN - SBP 160-200 (if aneurysm secured)',
        fluids: 'Crystalloid boluses to maintain euvolemia',
        nimodipine: 'Continue throughout vasospasm period'
      },
      interventional: {
        indications: 'Refractory to medical management',
        options: ['Intra-arterial verapamil', 'Intra-arterial nicardipine', 'Angioplasty'],
        timing: 'Within 2 hours of clinical decline if possible'
      }
    },
    dci: {
      name: 'Delayed Cerebral Ischemia',
      definition: 'New focal deficit or ≥2 point GCS decline lasting >1 hour',
      workup: ['Stat CT head', 'CTA head/neck', 'Consider perfusion CT'],
      treatment: 'Aggressive medical management + consider intervention'
    }
  },

  rebleeding: {
    name: 'Aneurysm Rebleeding',
    timing: 'Highest risk first 24 hours (4%), then 1-2% per day until secured',
    mortality: '70-80% mortality if rebleeds',
    prevention: {
      earlySecuring: 'Coiling or clipping within 24-72 hours',
      bpControl: 'SBP <140-160 until secured',
      avoidStraining: 'Stool softeners, antiemetics, pain control',
      bedRest: 'Strict bed rest until secured'
    },
    signs: ['Sudden severe headache', 'Acute neurological decline', 'Loss of consciousness'],
    management: 'Emergent CT, emergent aneurysm securing'
  },

  hydrocephalus: {
    name: 'Hydrocephalus',
    types: {
      acute: 'Within hours-days, obstructive (blood in ventricles)',
      chronic: 'Weeks-months, communicating (impaired CSF absorption)'
    },
    diagnosis: {
      clinical: ['Decreased LOC', 'Headache', 'Nausea/vomiting', 'Gait instability'],
      imaging: 'Enlarged ventricles on CT (compare to prior if available)'
    },
    treatment: {
      acute: {
        evd: 'External ventricular drain - emergent if symptomatic',
        target: 'ICP <20 mmHg, drain 10-20 cc/hr',
        weaning: 'Raise EVD 5cm q24h, clamp trial before removal'
      },
      chronic: {
        vps: 'Ventriculoperitoneal shunt',
        settings: 'Programmable valve (typical 10-15 cmH2O)',
        alternatives: 'Lumboperitoneal shunt, ETV (endoscopic third ventriculostomy)'
      }
    }
  },

  shuntMalfunction: {
    name: 'Shunt Malfunction',
    incidence: '40% at 1 year, 50% at 2 years',
    types: {
      obstruction: 'Most common - proximal (ventricular) > distal (peritoneal)',
      infection: '5-15% - usually within 6 months of placement',
      overdrainage: 'Slit ventricle syndrome, subdural hematomas',
      underdrainage: 'Persistent hydrocephalus symptoms'
    },
    diagnosis: {
      clinical: ['Headache', 'Nausea/vomiting', 'Lethargy', 'Gait instability'],
      imaging: 'CT head - compare to baseline (ventricular size)',
      shuntSeries: 'X-rays to assess hardware integrity',
      tapTest: 'Reservoir tap - assess flow, send CSF if infection concern'
    },
    treatment: {
      obstruction: 'Shunt revision (replace obstructed component)',
      infection: 'Externalize shunt, IV antibiotics, replace after CSF sterile',
      overdrainage: 'Increase valve setting or add antisiphon device',
      underdrainage: 'Decrease valve setting or revise shunt'
    }
  },

  csfLeak: {
    name: 'CSF Leak',
    types: {
      rhinorrhea: 'Nasal CSF leak',
      otorrhea: 'Ear CSF leak',
      incisional: 'Wound CSF leak'
    },
    diagnosis: {
      clinical: ['Clear fluid from nose/ear/wound', 'Positional headache', 'Salty taste'],
      betaTrace: 'Beta-2 transferrin (gold standard)',
      beta2Transferrin: 'Highly specific for CSF',
      glucoseTest: 'CSF glucose >30 mg/dL (not reliable)',
      haloSign: 'Ring of blood with clear center on gauze'
    },
    complications: {
      meningitis: '10-25% risk if untreated',
      pneumocephalus: 'Air in cranial cavity'
    },
    treatment: {
      conservative: {
        duration: '5-7 days',
        measures: ['Bed rest', 'Head of bed elevation 30°', 'Stool softeners', 'Avoid straining/Valsalva'],
        lumbarDrain: 'Drain 10 cc/hr for 5-7 days (if conservative fails)'
      },
      surgical: {
        indications: 'Failed conservative management, high-flow leak',
        options: ['Surgical repair', 'Fat graft', 'Dural sealant']
      }
    }
  },

  seizures: {
    name: 'Postoperative Seizures',
    incidence: '15-30% supratentorial craniotomy',
    timing: {
      immediate: '<24 hours - often related to surgery',
      early: '<1 week - related to acute injury',
      late: '>1 week - epileptogenic focus'
    },
    riskFactors: ['Cortical involvement', 'Hemorrhage', 'Tumor', 'Prior seizures', 'Frontal/temporal location'],
    classification: {
      focal: {
        aware: 'Focal aware (simple partial) - no LOC',
        impaired: 'Focal impaired awareness (complex partial) - altered consciousness',
        toGeneralized: 'Focal to bilateral tonic-clonic'
      },
      generalized: {
        tonicClonic: 'Generalized tonic-clonic (grand mal)',
        absence: 'Absence (petit mal)',
        myoclonic: 'Myoclonic jerks'
      }
    },
    workup: {
      labs: ['Glucose', 'Electrolytes (Na, Ca, Mg)', 'AED levels if on medication'],
      imaging: 'Stat CT head (rule out hemorrhage, stroke, increased ICP)',
      eeg: {
        indications: ['Concern for subclinical seizures', 'Status epilepticus', 'Unexplained altered mental status'],
        timing: 'Within 24 hours if possible'
      }
    },
    treatment: {
      acute: {
        firstLine: 'Lorazepam 2-4mg IV or Midazolam 10mg IM',
        secondLine: 'Levetiracetam 1000-1500mg IV loading or Fosphenytoin 20mg PE/kg IV',
        statusEpilepticus: 'If seizure >5 minutes or recurrent without recovery'
      },
      maintenance: {
        levetiracetam: {
          dose: '500-1000mg BID',
          pros: 'No drug interactions, no level monitoring, well-tolerated',
          cons: 'Behavioral side effects (irritability, depression)'
        },
        phenytoin: {
          dose: '300-400mg daily (divided or QHS)',
          pros: 'Long track record, effective',
          cons: 'Drug interactions, level monitoring, side effects (gingival hyperplasia, hirsutism)'
        },
        lacosamide: {
          dose: '100-200mg BID',
          pros: 'Well-tolerated, no drug interactions',
          cons: 'Cardiac conduction effects (check EKG)'
        }
      },
      prophylaxis: {
        indications: ['High-risk surgery (tumor, hemorrhage)', 'Prior seizures'],
        duration: '7 days postop (no benefit beyond 7 days for prophylaxis)',
        notRecommended: 'Routine prophylaxis for all craniotomies'
      }
    }
  }
};

/**
 * Red Flags for Urgent Evaluation
 */
const RED_FLAGS = {
  general: [
    'New or worsening headache uncontrolled by medications',
    'Seizure (new or recurrent)',
    'Neurological change (new weakness, numbness, vision change, speech difficulty)',
    'Wound issues (redness, drainage, separation, clear fluid/CSF)',
    'Fever >38.3°C',
    'Mental status change (confusion, lethargy)'
  ],
  
  byPathology: {
    SAH: [
      'Sudden severe headache',
      'New focal deficit (vasospasm)',
      'Decreased level of consciousness',
      'Seizure'
    ],
    spine: [
      'New or progressive weakness',
      'Bowel/bladder dysfunction',
      'Saddle anesthesia',
      'Severe radicular pain'
    ],
    tumor: [
      'Rapid neurological decline',
      'Uncontrolled seizures',
      'Signs of increased ICP'
    ]
  }
};

/**
 * Anticoagulation Management
 */
const ANTICOAGULATION_MANAGEMENT = {
  warfarin: {
    name: 'Warfarin (Coumadin)',
    mechanism: 'Vitamin K antagonist',
    halfLife: '36-42 hours',
    preoperative: {
      hold: '5 days before surgery',
      bridge: 'Consider heparin bridge if high thrombotic risk',
      targetINR: '<1.5 for surgery'
    },
    reversal: {
      emergent: {
        agent: 'Vitamin K 10mg IV + 4-factor PCC (Kcentra) 25-50 units/kg',
        onset: 'PCC: 10-30 minutes, Vitamin K: 12-24 hours',
        checkINR: 'Recheck INR 30 minutes after PCC'
      },
      nonEmergent: {
        agent: 'Vitamin K 2.5-5mg PO',
        onset: '24-48 hours'
      }
    },
    resumption: {
      timing: 'POD 3-7 (neurosurgery), POD 1-3 (other surgery)',
      considerations: 'Balance bleeding vs thrombotic risk',
      bridging: 'Heparin bridge until INR therapeutic (2-3)'
    }
  },

  doacs: {
    name: 'Direct Oral Anticoagulants',
    agents: {
      apixaban: {
        name: 'Apixaban (Eliquis)',
        halfLife: '12 hours',
        hold: '48 hours (2-3 days if CrCl <50)',
        reversal: 'Andexanet alfa (Andexxa) 400-800mg IV'
      },
      rivaroxaban: {
        name: 'Rivaroxaban (Xarelto)',
        halfLife: '5-9 hours',
        hold: '24 hours (48 hours if CrCl <50)',
        reversal: 'Andexanet alfa (Andexxa) 400-800mg IV'
      },
      dabigatran: {
        name: 'Dabigatran (Pradaxa)',
        halfLife: '12-17 hours',
        hold: '48-96 hours (depends on CrCl)',
        reversal: 'Idarucizumab (Praxbind) 5g IV'
      }
    },
    emergentReversal: {
      specific: 'Andexanet (Xa inhibitors) or Idarucizumab (dabigatran)',
      nonSpecific: '4-factor PCC 50 units/kg if specific agent unavailable',
      dialysis: 'Dabigatran is dialyzable (not Xa inhibitors)'
    },
    resumption: {
      timing: 'POD 3-7 (neurosurgery)',
      noLoading: 'Resume at regular dose (no loading needed)'
    }
  },

  antiplatelet: {
    aspirin: {
      name: 'Aspirin (ASA)',
      mechanism: 'Irreversible COX-1 inhibition',
      duration: '7-10 days (platelet lifespan)',
      hold: '7 days before elective surgery',
      reversal: 'Platelet transfusion (1 unit raises count ~30K)',
      resumption: 'POD 1-3 (cardiac stents), POD 3-7 (neurosurgery)'
    },
    clopidogrel: {
      name: 'Clopidogrel (Plavix)',
      mechanism: 'Irreversible P2Y12 inhibition',
      duration: '5-7 days',
      hold: '5-7 days before elective surgery',
      reversal: 'Platelet transfusion',
      resumption: 'POD 1-3 (cardiac stents - DO NOT DELAY), POD 3-7 (neurosurgery)'
    },
    dualAntiplatelet: {
      name: 'DAPT (ASA + Clopidogrel)',
      indication: 'Recent cardiac stent (<1 year)',
      perioperative: 'CONSULT CARDIOLOGY - high risk of stent thrombosis if held',
      management: 'Continue ASA, hold clopidogrel if possible'
    }
  },

  heparin: {
    unfractionated: {
      name: 'Unfractionated Heparin (UFH)',
      halfLife: '1-2 hours',
      hold: '4-6 hours before surgery',
      reversal: 'Protamine 1mg per 100 units heparin (max 50mg)',
      resumption: 'POD 1-3 (prophylactic), POD 3-7 (therapeutic)'
    },
    lmwh: {
      name: 'Low Molecular Weight Heparin (Enoxaparin/Lovenox)',
      halfLife: '4-6 hours',
      hold: '24 hours (prophylactic), 48 hours (therapeutic)',
      reversal: 'Protamine 1mg per 1mg enoxaparin (50% effective)',
      resumption: 'POD 1-3 (prophylactic), POD 3-7 (therapeutic)'
    }
  }
};

/**
 * Follow-up Protocols by Pathology
 */
const FOLLOWUP_PROTOCOLS = {
  SAH: {
    clinic: {
      schedule: ['2 weeks (wound check)', '6 weeks', '3 months', '6 months', '1 year', 'then annually'],
      provider: 'Neurosurgery'
    },
    imaging: {
      cta_mra: {
        schedule: ['6 months', '1 year', '3 years', '5 years', 'then Q5 years lifelong'],
        purpose: 'Monitor for aneurysm recurrence, residual neck, de novo aneurysms',
        modality: 'CTA or MRA (MRA preferred to avoid radiation)'
      },
      coiledAneurysms: {
        schedule: ['6 months', '1 year', '3 years', '5 years'],
        purpose: 'Coil compaction occurs in 20-30% - may need retreatment',
        modality: 'MRA preferred (less artifact than CTA)'
      },
      clippedAneurysms: {
        schedule: ['1 year', '5 years', 'then Q5 years'],
        purpose: 'Clip migration rare, but monitor for de novo aneurysms'
      }
    },
    additionalConsults: {
      neurology: 'If persistent deficits or seizures',
      neuropsych: 'If cognitive deficits',
      physiatry: 'If functional deficits requiring rehab'
    },
    redFlags: ['Sudden severe headache', 'New focal deficit', 'Seizure', 'Vision changes']
  },

  TUMORS: {
    glioblastoma: {
      clinic: {
        schedule: 'Q8-12 weeks × 2 years, then Q3-6 months',
        provider: 'Neurosurgery + Neuro-oncology'
      },
      mri: {
        schedule: 'Q8-12 weeks × 2 years, then Q3-6 months',
        protocol: 'Brain MRI with and without contrast',
        watch: 'Recurrence (90% recur), pseudoprogression, radiation necrosis'
      },
      adjuvantTherapy: {
        radiation: 'Start within 4-6 weeks of surgery (60 Gy in 30 fractions)',
        chemotherapy: 'Temozolomide concurrent with radiation, then 6-12 cycles adjuvant',
        tumorTreatingFields: 'Optune device - improves survival'
      },
      prognosis: 'Median survival 15-18 months with treatment'
    },

    anaplasticGlioma: {
      clinic: 'Q3-4 months × 2 years, then Q6 months',
      mri: 'Q3-4 months × 2 years, then Q6 months',
      adjuvantTherapy: 'Radiation + chemotherapy (PCV or TMZ)',
      prognosis: 'Median survival 2-3 years'
    },

    lowGradeGlioma: {
      clinic: {
        schedule: 'Q3-4 months × 2 years, then Q6-12 months lifelong',
        provider: 'Neurosurgery ± Neuro-oncology'
      },
      mri: {
        schedule: 'Q3-4 months × 2 years, then Q6-12 months lifelong',
        watch: 'Progression, malignant transformation (50% transform to high-grade)'
      },
      adjuvantTherapy: {
        observation: 'If GTR and low-risk features',
        radiation: 'If STR or high-risk features',
        chemotherapy: 'PCV or TMZ for 1p/19q codeleted tumors'
      },
      prognosis: 'Median survival 5-10 years'
    },

    meningioma: {
      grade1: {
        gtr: {
          mri: '1 year, then Q2-3 years × 10 years',
          recurrence: '5-10% at 10 years'
        },
        str: {
          mri: 'Q6-12 months',
          recurrence: '30-40% at 10 years',
          consider: 'Radiation therapy for residual'
        }
      },
      grade2: {
        mri: 'Q6 months × 5 years, then annually',
        adjuvant: 'Radiation therapy recommended',
        recurrence: '30-40% at 5 years'
      },
      grade3: {
        mri: 'Q3-6 months',
        adjuvant: 'Radiation therapy strongly recommended',
        recurrence: '50-80% at 5 years',
        prognosis: 'Median survival 2-3 years'
      }
    },

    metastases: {
      clinic: 'Q3 months',
      mri: {
        brain: 'Q3 months',
        spine: 'Q3-6 months if spine mets'
      },
      systemic: {
        ctChestAbdPelvis: 'Q3 months',
        petScan: 'As indicated'
      },
      treatment: {
        srs: 'Stereotactic radiosurgery for 1-4 lesions',
        wbrt: 'Whole brain radiation for multiple lesions',
        chemotherapy: 'Systemic therapy per primary oncologist'
      }
    }
  },

  SPINE: {
    fusion: {
      clinic: {
        schedule: ['2 weeks (wound check)', '6 weeks', '3 months', '6 months', '1 year'],
        provider: 'Spine surgery'
      },
      xrays: {
        schedule: ['6 weeks (AP/Lat)', '3 months (AP/Lat)', '6 months (AP/Lat + Flex/Ext)', '1 year (AP/Lat + Flex/Ext)'],
        purpose: 'Assess alignment, hardware position, fusion progress'
      },
      ct: {
        timing: '6-12 months if fusion uncertain on X-rays',
        purpose: 'Definitive assessment of bony fusion'
      },
      fusionCriteria: {
        bridgingBone: 'Continuous bone across fusion levels',
        noLucency: 'No lucency around hardware',
        noMotion: '<3° motion on flexion/extension X-rays'
      },
      complications: {
        pseudoarthrosis: '5-10% incidence, higher in smokers',
        adjacentSegment: 'Degeneration of adjacent levels over time',
        hardwareFailure: 'Screw loosening, rod fracture'
      }
    },

    decompressionOnly: {
      clinic: ['2 weeks', '6 weeks', '3 months', '6 months'],
      imaging: 'As needed for new symptoms',
      recurrence: '5-15% recurrent stenosis/disc herniation'
    }
  },

  HYDROCEPHALUS: {
    shunt: {
      clinic: {
        schedule: ['2 weeks', '6 weeks', '3 months', '6 months', 'then annually'],
        provider: 'Neurosurgery'
      },
      imaging: {
        baseline: 'CT head 1-2 days post-shunt (establish baseline ventricular size)',
        routine: 'Not needed unless symptomatic',
        symptomatic: 'CT head if headache, nausea, lethargy, gait changes'
      },
      shuntSeries: {
        timing: 'If malfunction suspected',
        views: 'Skull, neck, chest, abdomen - assess hardware integrity'
      },
      complications: {
        malfunction: '40% at 1 year, 50% at 2 years',
        infection: '5-15% (highest risk first 6 months)',
        overdrainage: 'Slit ventricle syndrome, subdural hematomas'
      }
    }
  }
};

/**
 * Knowledge Base Service Class
 */
class KnowledgeBaseService {
  constructor() {
    this.initialized = false;
  }
  
  /**
   * Get examination protocol for pathology
   * @param {string|object} pathology - Pathology type (string) or pathology object with 'type' property
   * @returns {object} Examination protocol
   */
  getExamProtocol(pathology = 'general') {
    // Defensive programming: Handle different input types
    let pathologyString = pathology;

    // If pathology is an object, extract the type
    if (typeof pathology === 'object' && pathology !== null) {
      pathologyString = pathology.type || 'general';
    }

    // Ensure we have a string
    if (typeof pathologyString !== 'string') {
      pathologyString = 'general';
    }

    if (pathologyString === 'spine' || pathologyString === 'SPINE') {
      return { ...NEURO_EXAM_PROTOCOLS, ...SPINE_EXAM_PROTOCOLS };
    }
    return NEURO_EXAM_PROTOCOLS;
  }
  
  /**
   * Get grading scales for pathology
   * @param {string|object} pathology - Pathology type (string) or pathology object with 'type' property
   * @returns {object} Grading scales for the pathology
   */
  getGradingScales(pathology) {
    // Defensive programming: Handle different input types
    let pathologyString = pathology;

    // If pathology is an object (e.g., { type: 'SAH', ... }), extract the type
    if (typeof pathology === 'object' && pathology !== null) {
      pathologyString = pathology.type || 'general';
      console.warn('⚠️ getGradingScales received object instead of string:', pathology);
    }

    // If pathology is not a string at this point, use default
    if (typeof pathologyString !== 'string') {
      console.error('❌ getGradingScales received invalid type:', typeof pathology, pathology);
      return GRADING_SCALES.functionalScores;
    }

    const pathologyUpper = pathologyString.toUpperCase();
    if (GRADING_SCALES[pathologyUpper]) {
      return GRADING_SCALES[pathologyUpper];
    }
    return GRADING_SCALES.functionalScores;
  }
  
  /**
   * Get complication management protocol
   * @param {string} complication - Complication name
   * @returns {object|null} Complication protocol
   */
  getComplicationProtocol(complication) {
    // Defensive programming: Ensure complication is a string
    if (typeof complication !== 'string') {
      console.warn('⚠️ getComplicationProtocol received non-string:', typeof complication, complication);
      return null;
    }

    const compLower = complication.toLowerCase();
    return COMPLICATION_PROTOCOLS[compLower] || null;
  }
  
  /**
   * Get red flags for pathology
   * @param {string|object} pathology - Pathology type (string) or pathology object with 'type' property
   * @returns {array} Red flags for the pathology
   */
  getRedFlags(pathology = 'general') {
    // Defensive programming: Handle different input types
    let pathologyString = pathology;

    // If pathology is an object, extract the type
    if (typeof pathology === 'object' && pathology !== null) {
      pathologyString = pathology.type || 'general';
    }

    // Ensure we have a string
    if (typeof pathologyString !== 'string') {
      pathologyString = 'general';
    }

    const pathologyLower = pathologyString.toLowerCase();
    const specific = RED_FLAGS.byPathology[pathologyLower] || [];
    return [...RED_FLAGS.general, ...specific];
  }

  /**
   * Get follow-up protocol for pathology
   * @param {string|object} pathology - Pathology type (string) or pathology object with 'type' property
   * @returns {object|null} Follow-up protocol
   */
  getFollowUpProtocol(pathology) {
    // Defensive programming: Handle different input types
    let pathologyString = pathology;

    // If pathology is an object, extract the type
    if (typeof pathology === 'object' && pathology !== null) {
      pathologyString = pathology.type || 'general';
    }

    // Ensure we have a string
    if (typeof pathologyString !== 'string') {
      return null;
    }

    const pathologyLower = pathologyString.toLowerCase();
    return FOLLOWUP_PROTOCOLS[pathologyLower] || null;
  }
  
  /**
   * Validate extracted data against knowledge base
   */
  validateExtractedData(data, pathology) {
    const errors = [];
    const warnings = [];
    
    // Validate GCS
    if (data.examination?.gcs?.total) {
      const gcs = data.examination.gcs.total;
      if (gcs < 3 || gcs > 15) {
        errors.push({
          field: 'examination.gcs.total',
          value: gcs,
          message: `GCS must be between 3 and 15 (got ${gcs})`,
          severity: 'error'
        });
      }
    }
    
    // Validate Hunt-Hess grade for SAH
    if (pathology === 'SAH' && data.gradingScales?.huntHess) {
      const hh = data.gradingScales.huntHess;
      if (hh < 1 || hh > 5) {
        errors.push({
          field: 'gradingScales.huntHess',
          value: hh,
          message: `Hunt-Hess grade must be between 1 and 5 (got ${hh})`,
          severity: 'error'
        });
      }
    }
    
    // Validate Fisher grade for SAH
    if (pathology === 'SAH' && data.gradingScales?.fisher) {
      const fisher = data.gradingScales.fisher;
      if (fisher < 1 || fisher > 4) {
        errors.push({
          field: 'gradingScales.fisher',
          value: fisher,
          message: `Fisher grade must be between 1 and 4 (got ${fisher})`,
          severity: 'error'
        });
      }
    }
    
    // Validate mRS
    if (data.functionalStatus?.mrs) {
      const mrs = data.functionalStatus.mrs;
      if (mrs < 0 || mrs > 6) {
        errors.push({
          field: 'functionalStatus.mrs',
          value: mrs,
          message: `mRS must be between 0 and 6 (got ${mrs})`,
          severity: 'error'
        });
      }
    }
    
    // Validate KPS
    if (data.functionalStatus?.kps) {
      const kps = data.functionalStatus.kps;
      if (kps < 0 || kps > 100 || kps % 10 !== 0) {
        errors.push({
          field: 'functionalStatus.kps',
          value: kps,
          message: `KPS must be between 0 and 100 in increments of 10 (got ${kps})`,
          severity: 'error'
        });
      }
    }
    
    return { valid: errors.length === 0, errors, warnings };
  }
  
  /**
   * Suggest missing critical fields based on pathology with enhanced prioritization
   */
  suggestMissingFields(data, pathology) {
    const suggestions = [];

    // Helper to add suggestion with full context
    const addSuggestion = (field, reason, priority, whereToFind, clinicalSignificance, relatedFields = []) => {
      suggestions.push({
        field,
        reason,
        priority, // 'critical', 'high', 'medium', 'low'
        whereToFind,
        clinicalSignificance,
        relatedFields,
        timestamp: new Date().toISOString()
      });
    };

    // SAH-specific suggestions
    if (pathology === 'SAH' || pathology === 'aSAH') {
      // Critical fields
      if (!data.gradingScales?.huntHess) {
        addSuggestion(
          'gradingScales.huntHess',
          'Hunt-Hess grade is critical for SAH prognosis and treatment planning',
          'critical',
          'Look for: "Hunt-Hess", "H&H", "HH grade" in admission notes, neurosurgery consult, or imaging reports',
          'Predicts mortality: Grade 1-2 (10-20%), Grade 3 (30-40%), Grade 4-5 (60-80%). Guides ICU level of care.',
          ['gcs', 'neurologicalExam', 'admissionStatus']
        );
      }

      if (!data.gradingScales?.fisher && !data.gradingScales?.modifiedFisher) {
        addSuggestion(
          'gradingScales.fisher',
          'Fisher grade predicts vasospasm risk - essential for monitoring plan',
          'critical',
          'Look for: "Fisher", "Modified Fisher", "mFisher" in CT head reports or neurosurgery notes',
          'Grade 3 has 60-70% vasospasm risk. Determines TCD monitoring frequency and nimodipine duration.',
          ['imaging', 'vasospasmRisk', 'tcdMonitoring']
        );
      }

      if (!data.aneurysm?.location) {
        addSuggestion(
          'aneurysm.location',
          'Aneurysm location affects treatment approach and follow-up',
          'high',
          'Look for: "PCOM", "ACOM", "MCA", "basilar" in CTA/angiogram reports or operative notes',
          'Location determines surgical vs endovascular approach and recurrence risk.',
          ['procedure', 'imaging']
        );
      }

      if (!data.aneurysm?.size) {
        addSuggestion(
          'aneurysm.size',
          'Aneurysm size affects rupture risk and treatment complexity',
          'high',
          'Look for: size in mm in CTA/angiogram reports (e.g., "5mm aneurysm")',
          'Size >7mm = higher rupture risk. Larger aneurysms may require complex treatment.',
          ['aneurysm.location', 'procedure']
        );
      }

      if (!data.complications?.vasospasm && data.gradingScales?.fisher >= 3) {
        addSuggestion(
          'complications.vasospasm',
          'Fisher grade 3+ requires vasospasm monitoring - document presence/absence',
          'high',
          'Look for: "vasospasm", "DCI", "TCD velocities", "new deficits" in daily progress notes',
          'Vasospasm occurs in 30-70% of SAH patients, peaks days 7-10. Requires aggressive treatment.',
          ['tcdFindings', 'neurologicalExam', 'medications.nimodipine']
        );
      }

      if (!data.medications?.nimodipine) {
        addSuggestion(
          'medications.nimodipine',
          'Nimodipine is standard of care for SAH - should be documented',
          'high',
          'Look for: "nimodipine", "Nimotop", "60mg q4h" in medication list',
          'Nimodipine reduces poor outcomes by 40%. Given for 21 days post-SAH.',
          ['medications', 'vasospasmPrevention']
        );
      }
    }

    // Brain tumor suggestions
    if (pathology === 'TUMORS' || pathology === 'glioma' || pathology === 'meningioma') {
      if (!data.tumor?.histology) {
        addSuggestion(
          'tumor.histology',
          'Histology determines prognosis and treatment plan',
          'critical',
          'Look for: pathology report, "glioblastoma", "meningioma", "astrocytoma", "oligodendroglioma"',
          'Histology is THE most important prognostic factor. Guides all treatment decisions.',
          ['tumor.whoGrade', 'molecularMarkers', 'adjuvantTherapy']
        );
      }

      if (!data.tumor?.whoGrade) {
        addSuggestion(
          'tumor.whoGrade',
          'WHO grade is essential for prognosis and treatment planning',
          'critical',
          'Look for: "WHO grade", "Grade I/II/III/IV" in pathology report',
          'Grade 1 = benign, Grade 4 = aggressive. Determines need for radiation/chemotherapy.',
          ['tumor.histology', 'adjuvantTherapy', 'followUpSchedule']
        );
      }

      if (!data.resectionExtent) {
        addSuggestion(
          'resectionExtent',
          'Extent of resection affects survival and recurrence risk',
          'high',
          'Look for: "GTR", "STR", "gross total", "subtotal", "biopsy only" in operative note',
          'GTR associated with longer survival. STR may require adjuvant radiation.',
          ['postopMRI', 'adjuvantTherapy']
        );
      }

      if (data.tumor?.histology?.toLowerCase().includes('glioblastoma') && !data.molecularMarkers?.mgmt) {
        addSuggestion(
          'molecularMarkers.mgmt',
          'MGMT status predicts response to temozolomide chemotherapy',
          'high',
          'Look for: "MGMT methylation", "MGMT promoter" in pathology report',
          'MGMT methylated tumors have 2x better response to TMZ. Guides chemotherapy decision.',
          ['adjuvantTherapy.chemotherapy']
        );
      }

      if (data.tumor?.histology?.toLowerCase().includes('glioma') && !data.molecularMarkers?.idh) {
        addSuggestion(
          'molecularMarkers.idh',
          'IDH mutation status is a major prognostic factor',
          'high',
          'Look for: "IDH mutation", "IDH1", "IDH2" in pathology report',
          'IDH-mutant gliomas have 2-3x longer survival than IDH-wildtype.',
          ['prognosis', 'followUpSchedule']
        );
      }
    }

    // Spine surgery suggestions
    if (pathology === 'SPINE') {
      if (!data.spineLevel) {
        addSuggestion(
          'spineLevel',
          'Spinal level is essential for documentation and follow-up',
          'critical',
          'Look for: "C5-6", "L4-5", cervical/thoracic/lumbar levels in operative note',
          'Level determines expected deficits, recovery, and hardware requirements.',
          ['neurologicalExam', 'procedure', 'hardware']
        );
      }

      if (!data.neurologicalExam?.asiaGrade && data.complications?.spinalCordInjury) {
        addSuggestion(
          'neurologicalExam.asiaGrade',
          'ASIA grade is standard for spinal cord injury assessment',
          'critical',
          'Look for: "ASIA A/B/C/D/E", "Frankel grade" in neurosurgery notes or PT/OT notes',
          'ASIA A = complete injury (<5% recovery). ASIA D = incomplete (>80% ambulation).',
          ['motorExam', 'sensoryExam', 'rectalTone', 'prognosis']
        );
      }

      if (data.procedure?.includes('fusion') && !data.hardware) {
        addSuggestion(
          'hardware',
          'Hardware details important for follow-up and complication assessment',
          'high',
          'Look for: "screws", "rods", "cage", "plate" in operative note',
          'Hardware type affects fusion rate and complication risk.',
          ['procedure', 'fusionStatus', 'followUpImaging']
        );
      }

      if (!data.neurologicalExam?.motorExam) {
        addSuggestion(
          'neurologicalExam.motorExam',
          'Motor exam is critical for spine surgery patients',
          'high',
          'Look for: motor strength (0-5/5) by muscle group in daily notes or PT notes',
          'Documents baseline and tracks recovery. Essential for detecting postop deficits.',
          ['neurologicalExam', 'functionalStatus']
        );
      }
    }

    // TBI suggestions
    if (pathology === 'TBI' || pathology === 'TBI_CSDH') {
      if (!data.gcs?.admission) {
        addSuggestion(
          'gcs.admission',
          'Admission GCS is fundamental for TBI severity classification',
          'critical',
          'Look for: "GCS", "Glasgow Coma Scale" in ED notes or admission notes',
          'GCS 13-15 = mild, 9-12 = moderate, 3-8 = severe. Determines treatment intensity.',
          ['neurologicalExam', 'prognosis']
        );
      }

      if (!data.imaging?.marshallGrade) {
        addSuggestion(
          'imaging.marshallGrade',
          'Marshall CT classification predicts outcome in TBI',
          'high',
          'Look for: "Marshall", "diffuse injury" in CT head reports',
          'Marshall grade correlates with mortality (Grade 1 = 10%, Grade 4 = 55%).',
          ['imaging', 'prognosis', 'icpManagement']
        );
      }

      if (data.gcs?.admission <= 8 && !data.icpMonitoring) {
        addSuggestion(
          'icpMonitoring',
          'ICP monitoring indicated for severe TBI (GCS ≤8)',
          'high',
          'Look for: "ICP monitor", "bolt", "EVD", "ventriculostomy" in procedure notes',
          'ICP monitoring guides treatment in severe TBI. Target ICP <20-22 mmHg.',
          ['procedures', 'icuCourse', 'icpValues']
        );
      }
    }

    // General critical fields (all pathologies)
    if (!data.examination?.gcs?.total && !data.examination?.gcs?.admission) {
      addSuggestion(
        'examination.gcs',
        'GCS is fundamental for neurological assessment',
        'critical',
        'Look for: "GCS", "Glasgow Coma Scale", "E_V_M_" in any clinical note',
        'GCS tracks neurological status. Decline ≥2 points requires immediate imaging.',
        ['neurologicalExam', 'mentalStatus']
      );
    }

    if (!data.functionalStatus?.mrs && !data.functionalStatus?.kps) {
      addSuggestion(
        'functionalStatus',
        'Functional status (mRS or KPS) documents baseline and outcome',
        'medium',
        'Look for: "mRS", "Rankin", "KPS", "Karnofsky" or infer from discharge destination and support level',
        'mRS 0-2 = good outcome, 3-5 = poor outcome. Guides discharge planning.',
        ['dischargeDestination', 'supportLevel', 'ptotAssessment']
      );
    }

    if (!data.dischargeDestination) {
      addSuggestion(
        'dischargeDestination',
        'Discharge destination reflects functional outcome',
        'medium',
        'Look for: "discharged to home/rehab/SNF/LTAC" in discharge summary',
        'Home = good outcome, Rehab = moderate disability, SNF = severe disability.',
        ['functionalStatus', 'supportNeeds']
      );
    }

    // Sort suggestions by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return suggestions;
  }

  /**
   * Get actionable suggestions based on what data is already present
   */
  getContextualSuggestions(data, pathology) {
    const suggestions = this.suggestMissingFields(data, pathology);

    // Filter suggestions based on what's already present
    // If related fields are present, increase priority
    const contextualSuggestions = suggestions.map(suggestion => {
      let adjustedPriority = suggestion.priority;
      let contextNote = '';

      // Check if related fields are present
      const relatedPresent = suggestion.relatedFields?.filter(field => {
        const value = this._getNestedValue(data, field);
        return value !== null && value !== undefined;
      });

      if (relatedPresent && relatedPresent.length > 0) {
        // Increase priority if related fields are present
        if (adjustedPriority === 'medium') adjustedPriority = 'high';
        if (adjustedPriority === 'low') adjustedPriority = 'medium';
        contextNote = `Related data present (${relatedPresent.join(', ')}) - this field would complete the picture`;
      }

      return {
        ...suggestion,
        adjustedPriority,
        contextNote
      };
    });

    return contextualSuggestions;
  }

  /**
   * Helper to get nested value from object
   */
  _getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

// Export singleton instance
const knowledgeBase = new KnowledgeBaseService();
module.exports = knowledgeBase;

