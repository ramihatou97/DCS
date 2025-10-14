# Neurosurgical Pathology Patterns & Extraction Targets

## 📚 Comprehensive Pathology Database

This document defines pathology-specific patterns, terminology, and extraction targets for the Discharge Summary Generator. These patterns are continuously expanded through ML learning and manual updates.

**Current Categories:** 8 major pathologies with 200+ extraction patterns
**Last Updated:** October 2025
**Status:** Living document - continuously expanding

---

## 1. 🩸 Subarachnoid Hemorrhage (SAH)

### Core Terms & Abbreviations
- **SAH**: Subarachnoid hemorrhage
- **aSAH**: Aneurysmal SAH
- **Ictus**: Onset/rupture event (critical date to extract)
- **Hunt and Hess (H&H)**: Grading scale (I-V)
- **WFNS**: World Federation of Neurosurgical Societies scale (I-V)
- **Fisher Scale**: Original grading (1-4)
- **Modified Fisher (mFisher/mF)**: Modified scale (0-4)

### Clinical Presentation
```javascript
extractionPatterns: {
  ictusDate: [
    /ictus\s+(?:on|date)?\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    /(?:ruptured|rupture)\s+(?:on|date)?\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    /presented\s+with\s+SAH\s+on\s+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i
  ],
  
  gradingScales: {
    huntHess: /(?:Hunt\s*and\s*Hess|H&H|HH)\s*:?\s*(?:grade)?\s*([I1V2-5])/i,
    wfns: /WFNS\s*:?\s*(?:grade)?\s*([I1V2-5])/i,
    fisher: /Fisher\s*:?\s*(?:grade)?\s*([1-4])/i,
    modifiedFisher: /(?:modified\s*Fisher|mFisher|mF)\s*:?\s*(?:grade)?\s*([0-4])/i
  },
  
  hydrocephalus: /hydrocephal(?:us|y)/i
}
```

### Interventions & Devices
- **EVD**: External Ventricular Drain
- **LD**: Lumbar Drain
- **Endovascular Treatment**: Coiling, flow diverter, WEB device
- **TCD**: Transcranial Doppler
- **Vasospasm**: Delayed cerebral ischemia/vasospasm

```javascript
interventions: {
  drains: {
    evd: ['EVD', 'external ventricular drain', 'ventriculostomy'],
    lumbarDrain: ['LD', 'lumbar drain', 'LP drain']
  },
  
  endovascular: {
    coiling: ['coiling', 'endovascular coiling', 'coil embolization'],
    flowDiverter: ['flow diverter', 'flow diverting stent', 'pipeline'],
    webDevice: ['WEB device', 'Woven EndoBridge', 'intrasaccular device']
  },
  
  imaging: {
    tcd: ['TCD', 'transcranial Doppler'],
    cta: ['CTA', 'CT angiography', 'CT angiogram'],
    dsa: ['DSA', 'digital subtraction angiography', 'cerebral angiogram'],
    mra: ['MRA', 'MR angiography', 'magnetic resonance angiography']
  }
}
```

### Complications
- **Vasospasm**: Cerebral vasospasm/delayed cerebral ischemia (DCI)
- **Stroke**: Ischemic complications
- **Rebleed/Hemorrhage**: Aneurysm rerupture

```javascript
complications: {
  vasospasm: {
    detection: ['vasospasm', 'DCI', 'delayed cerebral ischemia', 'elevated velocities'],
    management: ['levophed', 'norepinephrine', 'milrinone', 'triple H therapy', 'induced hypertension']
  },
  
  stroke: ['stroke', 'infarct', 'ischemia', 'territorial infarct'],
  hemorrhage: ['rebleed', 'rerupture', 'hemorrhage', 'hematoma expansion']
}
```

---

## 2. 🧠 Brain Tumors (Neuro-Oncology)

### Procedures
- **Resection**: Total/gross total/subtotal
- **Biopsy**: Stereotactic/open
- **Surgery**: Craniotomy for tumor

```javascript
procedures: {
  resection: {
    patterns: [
      /(?:gross\s+total|total|subtotal|partial)\s+resection/i,
      /resection\s+of\s+(?:left|right)?\s*(?:frontal|temporal|parietal|occipital)?\s*(?:tumor|mass|lesion)/i
    ],
    extent: ['gross total', 'total', 'subtotal', 'partial', 'incomplete']
  },
  
  biopsy: {
    patterns: [/stereotactic\s+biopsy/i, /open\s+biopsy/i, /brain\s+biopsy/i],
    types: ['stereotactic', 'open', 'frameless']
  }
}
```

### Post-Operative Management
- **Deficits**: New neurological deficits
- **Swelling**: Cerebral edema
- **Dexamethasone (Dex)**: Steroid management
- **Recurrence/Progression**: Tumor behavior

```javascript
postOpManagement: {
  medications: {
    steroids: ['dex', 'dexamethasone', 'decadron'],
    patterns: [
      /dexamethasone\s+(\d+)\s*mg/i,
      /dex\s+(\d+)(?:\s*mg)?/i,
      /steroid\s+(?:taper|dose|management)/i
    ]
  },
  
  complications: {
    deficit: ['deficit', 'weakness', 'hemiparesis', 'aphasia', 'visual field cut'],
    swelling: ['edema', 'swelling', 'mass effect', 'herniation'],
    seizure: ['seizure', 'seizure activity', 'status epilepticus']
  },
  
  tumorBehavior: {
    recurrence: ['recurrence', 'recurrent tumor', 'tumor recurrence'],
    progression: ['progression', 'tumor progression', 'disease progression'],
    stable: ['stable disease', 'no progression', 'no recurrence']
  }
}
```

### Infections (Post-Operative)
- **Abscess**: Brain abscess
- **Ventriculitis**: Ventricular infection
- **Meningitis**: Meningeal infection
- **CSF Analysis**: Protein, culture, cell count

```javascript
infections: {
  types: {
    abscess: ['abscess', 'brain abscess', 'surgical site infection'],
    ventriculitis: ['ventriculitis', 'ventricular infection'],
    meningitis: ['meningitis', 'meningeal enhancement']
  },
  
  workup: {
    csfAnalysis: [
      /CSF\s+protein\s*:?\s*(\d+)/i,
      /CSF\s+culture\s*:?\s*([^\.]+)/i,
      /CSF\s+(?:WBC|white\s+blood\s+cell)\s*:?\s*(\d+)/i
    ],
    imaging: ['enhancement', 'rim enhancement', 'fluid collection']
  },
  
  management: {
    antibiotics: ['antibiotics', 'abx', 'vancomycin', 'ceftriaxone', 'meropenem'],
    drainage: ['drainage', 'aspiration', 'washout'],
    redo: ['redo surgery', 'reoperation', 'return to OR']
  }
}
```

---

## 3. 💧 Hydrocephalus

### Types & Etiology
- **Obstructive**: Non-communicating
- **Communicating**: Impaired CSF absorption
- **Normal Pressure Hydrocephalus (NPH)**

### Shunt Components & Terminology
- **Proximal Catheter**: Ventricular catheter
- **Distal Catheter**: Peritoneal/atrial catheter
- **Valve**: Programmable/fixed pressure
- **Setting**: Pressure setting (programmable valves)

```javascript
hydrocephalus: {
  shuntTypes: [
    'VP shunt',
    'ventriculoperitoneal shunt',
    'VA shunt',
    'ventriculoatrial shunt',
    'LP shunt',
    'lumboperitoneal shunt'
  ],
  
  components: {
    proximalCatheter: ['proximal catheter', 'ventricular catheter', 'frontal catheter'],
    distalCatheter: ['distal catheter', 'peritoneal catheter', 'abdominal catheter'],
    valve: {
      types: ['programmable valve', 'fixed pressure valve', 'Codman', 'Medtronic', 'Strata'],
      settings: /valve\s+setting\s*:?\s*(\d+)\s*(?:cm\s*H2O)?/i
    }
  },
  
  dysfunction: {
    patterns: [
      /shunt\s+(?:mal)?function/i,
      /shunt\s+(?:obstruction|occlusion)/i,
      /shunt\s+failure/i,
      /proximal\s+catheter\s+(?:obstruction|occlusion)/i,
      /distal\s+catheter\s+(?:obstruction|migration)/i
    ],
    
    presentation: ['headache', 'nausea', 'vomiting', 'altered level of consciousness', 'AMS'],
    
    management: [
      'shunt tap',
      'shunt series',
      'shunt revision',
      'proximal revision',
      'distal revision',
      'valve replacement',
      'complete shunt replacement'
    ]
  },
  
  settingChanges: {
    pattern: /setting\s+(?:changed|adjusted)\s+from\s+(\d+)\s+to\s+(\d+)/i,
    documentation: 'Track all valve setting changes with dates'
  }
}
```

---

## 4. 🚑 Traumatic Brain Injury (TBI) & Subdural Hematomas

### 4.1 Acute TBI - Hemorrhage Types
- **SDH**: Subdural hematoma (acute/subacute/chronic)
- **EDH**: Epidural hematoma
- **SAH**: Traumatic subarachnoid hemorrhage
- **IVH**: Intraventricular hemorrhage
- **Contusion**: Brain contusion
- **DAI**: Diffuse axonal injury

### 4.2 🆕 Chronic Subdural Hematoma (cSDH)

**Critical pathology requiring specific extraction patterns**

#### Core Terms
- **cSDH**: Chronic subdural hematoma
- **Twist drill craniostomy**: Minimally invasive drainage
- **Burr hole craniotomy**: Standard drainage procedure
- **Craniotomy**: Open surgical evacuation (for organized/septated cSDH)
- **Subdural drain**: Post-evacuation drainage catheter
- **MMA embolization**: Middle meningeal artery embolization (preventive/adjunct)

#### Extraction Patterns
```javascript
cSDH: {
  diagnosis: {
    terms: [
      'chronic subdural hematoma',
      'chronic subdural',
      'cSDH',
      'chronic SDH',
      'subacute subdural',
      'organized subdural'
    ],
    
    patterns: [
      /chronic\s+subdural\s+(?:hematoma|hemorrhage)/i,
      /cSDH\s+(?:left|right|bilateral)/i,
      /(?:left|right|bilateral)\s+chronic\s+subdural/i,
      /subacute\s+(?:on\s+)?chronic\s+SDH/i,
      /organized\s+subdural/i
    ],
    
    laterality: /(?:left|right|bilateral)\s+(?:chronic\s+)?(?:subdural|cSDH)/i,
    
    thickness: /(?:SDH|subdural)\s+(?:thickness|measuring)\s*:?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)/i,
    
    midlineShift: /midline\s+shift\s*:?\s*(\d+(?:\.\d+)?)\s*mm/i
  },
  
  procedures: {
    twistDrill: {
      terms: ['twist drill', 'twist-drill', 'twist drill craniostomy'],
      patterns: [
        /twist[\s-]drill\s+craniostomy/i,
        /twist[\s-]drill\s+evacuation/i,
        /twist[\s-]drill\s+drainage/i
      ]
    },
    
    burrHole: {
      terms: ['burr hole', 'burr-hole', 'burr hole craniotomy', 'burr hole drainage'],
      patterns: [
        /burr\s+hole\s+craniotomy/i,
        /burr[\s-]hole\s+evacuation/i,
        /burr[\s-]hole\s+drainage/i,
        /craniotomy\s+for\s+(?:chronic\s+)?subdural/i
      ]
    },
    
    craniotomy: {
      terms: ['craniotomy', 'open evacuation', 'membranectomy'],
      patterns: [
        /craniotomy\s+(?:for|with)\s+(?:evacuation|drainage)\s+of\s+(?:chronic\s+)?subdural/i,
        /open\s+evacuation\s+of\s+(?:chronic\s+)?SDH/i,
        /membranectomy/i,
        /craniotomy\s+and\s+evacuation\s+of\s+organized\s+subdural/i
      ],
      indications: [
        'organized/septated hematoma',
        'failed burr hole drainage',
        'thick membranes',
        'recurrent cSDH'
      ]
    },
    
    drain: {
      terms: ['subdural drain', 'Jackson-Pratt drain', 'JP drain', 'subperiosteal drain'],
      patterns: [
        /subdural\s+drain/i,
        /(?:JP|Jackson[\s-]Pratt)\s+drain/i,
        /drain\s+(?:placed|inserted)\s+in\s+subdural\s+space/i
      ],
      
      removal: /drain\s+(?:removed|discontinued)\s+on\s+POD\s+(\d+)/i
    },
    
    mmaEmbolization: {
      terms: [
        'MMA embolization',
        'MMA embo',
        'middle meningeal artery embolization',
        'preoperative embolization',
        'adjunct embolization'
      ],
      
      patterns: [
        /MMA\s+embo(?:lization)?/i,
        /middle\s+meningeal\s+artery\s+embo(?:lization)?/i,
        /embolization\s+of\s+(?:the\s+)?MMA/i,
        /preoperative\s+MMA\s+embo/i
      ],
      
      timing: [
        'preoperative (before drainage)',
        'adjunct (same admission)',
        'standalone (no surgery)',
        'postoperative (recurrence prevention)'
      ],
      
      technique: [
        'liquid embolic (Onyx, NBCA)',
        'particles (PVA, Embospheres)',
        'coils'
      ]
    }
  },
  
  imagingFollowUp: {
    repeatCT: {
      terms: ['repeat CT', 'repeat head CT', 'CT head', 'follow-up CT', 'postoperative CT'],
      
      patterns: [
        /repeat\s+(?:CT|head\s+CT)\s+(?:on\s+)?POD\s+(\d+)/i,
        /postoperative\s+CT\s+(?:on\s+)?POD\s+(\d+)/i,
        /CT\s+head\s+(?:showed|demonstrated|revealed)/i,
        /follow[\s-]up\s+CT/i
      ],
      
      findings: [
        'interval decrease in SDH thickness',
        'residual subdural collection',
        'improved midline shift',
        'reaccumulation',
        'pneumocephalus',
        'tension pneumocephalus'
      ],
      
      timingProtocol: 'Typical: POD 1 (immediate), POD 3-5 (early), 4-6 weeks (outpatient)'
    }
  },
  
  complications: {
    recurrence: {
      terms: ['recurrence', 'reaccumulation', 'failed drainage', 'persistent collection'],
      patterns: [
        /recurrent\s+(?:chronic\s+)?subdural/i,
        /reaccumulation\s+of\s+subdural/i,
        /failed\s+(?:drainage|evacuation)/i,
        /persistent\s+subdural\s+collection/i
      ],
      management: [
        'repeat burr hole drainage',
        'craniotomy with membranectomy',
        'MMA embolization',
        'consider anticoagulation reversal'
      ]
    },
    
    pneumocephalus: {
      terms: ['pneumocephalus', 'tension pneumocephalus', 'air collection'],
      patterns: [
        /(?:tension\s+)?pneumocephalus/i,
        /subdural\s+air/i,
        /Mount\s+Fuji\s+sign/i
      ]
    },
    
    seizure: ['postoperative seizure', 'new-onset seizure'],
    
    infection: ['subdural empyema', 'wound infection', 'meningitis'],
    
    neurologicalDeficit: [
      'new hemiparesis',
      'stroke',
      'hemorrhagic conversion',
      'contralateral hematoma (rare)'
    ]
  },
  
  riskFactors: {
    anticoagulation: [
      'warfarin (Coumadin)',
      'apixaban (Eliquis)',
      'rivaroxaban (Xarelto)',
      'dabigatran (Pradaxa)',
      'aspirin',
      'clopidogrel (Plavix)',
      'dual antiplatelet therapy'
    ],
    
    extractionNote: 'CRITICAL: Always document anticoagulation status and reversal strategy'
  },
  
  outcomePredictors: [
    'thickness >15mm',
    'midline shift >10mm',
    'septations/organization',
    'bilateral SDH',
    'mixed density (acute-on-chronic)',
    'anticoagulation',
    'age >65',
    'recurrence rate: 10-30%'
  ]
}
```

### 4.3 Acute TBI Patterns

```javascript
acuteTBI: {
  hemorrhageTypes: {
    subdural: {
      terms: ['SDH', 'subdural', 'subdural hematoma', 'subdural hemorrhage'],
      acuity: ['acute', 'subacute', 'chronic'],
      patterns: [
        /(?:acute|chronic)\s+subdural\s+(?:hematoma|hemorrhage)/i,
        /SDH\s+(?:left|right|bilateral)/i
      ]
    },
    
    epidural: ['EDH', 'epidural hematoma', 'epidural hemorrhage'],
    
    sah: ['traumatic SAH', 'tSAH', 'traumatic subarachnoid hemorrhage'],
    
    ivh: ['IVH', 'intraventricular hemorrhage', 'intraventricular blood'],
    
    contusion: {
      terms: ['contusion', 'hemorrhagic contusion', 'brain contusion'],
      evolution: ['blooming', 'expansion', 'evolving contusion']
    },
    
    dai: ['DAI', 'diffuse axonal injury', 'shear injury']
  },
  
  imaging: {
    evolution: [
      'blooming',
      'expansion',
      'hematoma expansion',
      'interval increase',
      'worsening hemorrhage'
    ],
    
    massEffect: [
      'mass effect',
      'midline shift',
      'herniation',
      'subfalcine herniation',
      'uncal herniation',
      'tonsillar herniation'
    ]
  },
  
  procedures: {
    decompression: [
      'decompressive craniectomy',
      'decompressive craniotomy',
      'hemicraniectomy',
      'bifrontal craniectomy'
    ],
    
    evacuation: [
      'hematoma evacuation',
      'SDH evacuation',
      'EDH evacuation',
      'burr holes',
      'craniotomy for evacuation'
    ]
  },
  
  complications: {
    sinusThrombosis: [
      'sinus thrombosis',
      'venous sinus thrombosis',
      'sagittal sinus thrombosis',
      'transverse sinus thrombosis'
    ]
  },
  
  disposition: {
    rehab: ['rehabilitation', 'acute rehab', 'inpatient rehab', 'brain injury rehab']
  }
}
```

---

## 5. 💉 CSF Leak

### Presentations & Workup
- **Rhinorrhea**: Nasal CSF leak
- **Otorrhea**: Ear CSF leak
- **Endocrine Testing**: Pituitary function

```javascript
csfLeak: {
  presentation: {
    types: ['rhinorrhea', 'CSF rhinorrhea', 'otorrhea', 'CSF otorrhea'],
    symptoms: ['clear nasal drainage', 'positional headache', 'salty taste']
  },
  
  workup: {
    imaging: [
      'CT cisternogram',
      'MRI brain',
      'high-resolution CT',
      'intrathecal contrast study'
    ],
    
    labs: {
      beta2Transferrin: ['beta-2 transferrin', 'β2-transferrin', 'CSF marker'],
      glucose: /fluid\s+glucose\s*:?\s*(\d+)/i
    }
  },
  
  management: {
    lumbarDrain: {
      terms: ['LD', 'lumbar drain', 'CSF diversion'],
      duration: /LD\s+for\s+(\d+)\s+days/i,
      output: /drain\s+output\s*:?\s*(\d+)\s*(?:ml|cc)/i
    },
    
    repair: [
      'CSF leak repair',
      'skull base repair',
      'endoscopic repair',
      'transcranial repair',
      'fat graft',
      'fascial graft'
    ]
  },
  
  endocrine: {
    pituitary: {
      hormones: ['ACTH', 'cortisol', 'TSH', 'free T4', 'FSH', 'LH', 'prolactin', 'GH'],
      
      patterns: {
        acth: /ACTH\s*:?\s*(\d+\.?\d*)/i,
        cortisol: /cortisol\s*:?\s*(\d+\.?\d*)/i,
        stressDose: /stress\s+dose\s+(?:steroids|hydrocortisone)/i
      },
      
      insufficiency: [
        'adrenal insufficiency',
        'panhypopituitarism',
        'hormone replacement',
        'prednisone',
        'hydrocortisone',
        'stress dose steroids'
      ]
    },
    
    consultation: ['endocrinology consult', 'endocrine consult', 'pituitary protocol']
  }
}
```

---

## 6. 🦴 Spine

### Clinical Presentations
- **Radiculopathy**: Nerve root compression
- **Myelopathy**: Spinal cord compression
- **Claudication**: Neurogenic claudication
- **Cauda Equina**: Surgical emergency

```javascript
spine: {
  symptoms: {
    radiculopathy: {
      terms: ['radiculopathy', 'radicular pain', 'nerve root compression', 'sciatica'],
      distribution: [
        'dermatomal',
        'L4 distribution',
        'L5 distribution',
        'S1 distribution',
        'C5 distribution',
        'C6 distribution',
        'C7 distribution'
      ]
    },
    
    myelopathy: {
      terms: ['myelopathy', 'spinal cord compression', 'cord compression'],
      signs: [
        'hyperreflexia',
        'clonus',
        'Babinski sign',
        'positive Hoffman',
        'gait instability',
        'wide-based gait'
      ]
    },
    
    claudication: {
      terms: ['neurogenic claudication', 'spinal claudication', 'claudication'],
      characteristics: ['position-dependent', 'improves with flexion', 'worse with walking']
    },
    
    caudaEquina: {
      terms: ['cauda equina syndrome', 'CES'],
      criticalSigns: [
        'saddle anesthesia',
        'saddle anaesthesia',
        'urinary retention',
        'urinary incontinence',
        'fecal incontinence',
        'bowel incontinence',
        'bilateral leg weakness',
        'perineal numbness'
      ]
    },
    
    motor: {
      weakness: ['weakness', 'motor deficit', 'paresis', 'paralysis'],
      patterns: ['foot drop', 'hand weakness', 'grip weakness', 'proximal weakness']
    },
    
    sensory: {
      numbness: ['numbness', 'paresthesias', 'tingling', 'sensory loss'],
      patterns: ['stocking-glove', 'dermatomal', 'bilateral', 'unilateral']
    }
  },
  
  pathology: {
    degeneration: [
      'disc herniation',
      'herniated disc',
      'stenosis',
      'spinal stenosis',
      'central stenosis',
      'foraminal stenosis',
      'spondylolisthesis',
      'facet arthropathy',
      'degenerative disc disease'
    ],
    
    fracture: {
      types: [
        'compression fracture',
        'burst fracture',
        'chance fracture',
        'flexion-distraction injury',
        'facet dislocation',
        'hangman fracture',
        'odontoid fracture',
        'Jefferson fracture'
      ],
      stability: ['stable', 'unstable', 'TLICS score', 'AO classification']
    },
    
    infection: [
      'discitis',
      'osteomyelitis',
      'epidural abscess',
      'spinal abscess'
    ],
    
    tumor: [
      'spinal tumor',
      'metastatic disease',
      'epidural disease',
      'cord compression from tumor',
      'pathological fracture'
    ]
  },
  
  examination: {
    motorGroups: {
      cervical: {
        C5: ['deltoid', 'shoulder abduction'],
        C6: ['biceps', 'wrist extension'],
        C7: ['triceps', 'wrist flexion', 'finger extension'],
        C8: ['finger flexion', 'interossei'],
        T1: ['hand intrinsics', 'finger abduction']
      },
      
      lumbar: {
        L2: ['hip flexion', 'iliopsoas'],
        L3: ['knee extension', 'quadriceps'],
        L4: ['ankle dorsiflexion', 'tibialis anterior'],
        L5: ['great toe extension', 'EHL', 'extensor hallucis longus'],
        S1: ['ankle plantarflexion', 'gastrocnemius']
      },
      
      grading: {
        scale: '0-5 MRC scale',
        values: {
          '0': 'No contraction',
          '1': 'Trace contraction',
          '2': 'Movement without gravity',
          '3': 'Movement against gravity',
          '4': 'Movement against resistance',
          '5': 'Normal strength'
        }
      }
    },
    
    documentation: {
      preOp: /pre-?op(?:erative)?\s+exam/i,
      postOp: /post-?op(?:erative)?\s+exam/i,
      
      patterns: [
        /(?:right|left|bilateral)\s+(\w+)\s+(\d\/5)/i,  // "right deltoid 4/5"
        /motor\s+exam[:\s]+([^\.]+)/i,
        /strength[:\s]+([^\.]+)/i
      ]
    }
  },
  
  procedures: {
    decompression: [
      'laminectomy',
      'laminotomy',
      'foraminotomy',
      'discectomy',
      'hemilaminectomy',
      'corpectomy'
    ],
    
    fusion: {
      approaches: ['anterior', 'posterior', 'lateral', 'ALIF', 'PLIF', 'TLIF', 'XLIF', 'LLIF'],
      instrumentation: ['pedicle screws', 'rods', 'cage', 'plate', 'interbody cage'],
      levels: /([CTLS]\d+)-([CTLS]\d+)/i  // "L4-L5", "C5-C6"
    },
    
    stabilization: [
      'posterior instrumentation',
      'anterior plating',
      'interbody fusion',
      'posterolateral fusion'
    ]
  }
}
```

---

## 7. ⚡ Seizures & Status Epilepticus

**Critical perioperative complication requiring immediate recognition and management**

### Core Terms
- **Seizure**: Focal, generalized, tonic-clonic, absence
- **Status epilepticus**: Prolonged/repeated seizures without recovery
- **EEG**: Electroencephalogram (continuous vs routine)
- **Antiepileptic drugs (AEDs)**: Keppra, lacosamide, phenytoin, others

```javascript
seizures: {
  seizureTypes: {
    focal: {
      terms: ['focal seizure', 'partial seizure', 'focal motor', 'jacksonian march'],
      patterns: [
        /focal\s+(?:motor\s+)?seizure/i,
        /(?:left|right)[\s-]sided\s+seizure/i,
        /partial\s+seizure/i
      ]
    },
    
    generalized: {
      terms: [
        'generalized seizure',
        'generalized tonic-clonic',
        'GTC',
        'tonic-clonic seizure',
        'grand mal'
      ],
      patterns: [
        /generalized\s+(?:tonic[\s-]clonic\s+)?seizure/i,
        /GTC\s+seizure/i,
        /tonic[\s-]clonic\s+activity/i
      ]
    },
    
    status: {
      terms: ['status epilepticus', 'status', 'refractory status', 'SE'],
      patterns: [
        /status\s+epilepticus/i,
        /refractory\s+status/i,
        /prolonged\s+seizure\s+activity/i,
        /continuous\s+seizure/i
      ],
      duration: /seizure\s+lasting\s+(?:>|over|more\s+than)\s*(\d+)\s+(?:minutes|min)/i
    },
    
    subclinical: {
      terms: ['subclinical seizure', 'electrographic seizure', 'non-convulsive'],
      patterns: [
        /subclinical\s+seizure/i,
        /electrographic\s+seizure/i,
        /non[\s-]convulsive\s+(?:seizure|status)/i
      ]
    }
  },
  
  eeg: {
    types: {
      continuous: {
        terms: ['continuous EEG', 'cEEG', 'continuous monitoring'],
        patterns: [
          /continuous\s+EEG/i,
          /cEEG/i,
          /(?:24[\s-]hour|24h)\s+EEG/i,
          /EEG\s+monitoring/i
        ]
      },
      
      routine: {
        terms: ['routine EEG', 'standard EEG', '30-minute EEG'],
        patterns: [
          /routine\s+EEG/i,
          /(?:20|30)[\s-]minute\s+EEG/i,
          /standard\s+EEG/i
        ]
      }
    },
    
    findings: {
      patterns: [
        /EEG\s+(?:showed|demonstrated|revealed)\s+([^.]+)/i,
        /electrographic\s+seizure/i,
        /interictal\s+(?:epileptiform\s+)?discharges/i,
        /focal\s+slowing/i,
        /generalized\s+slowing/i,
        /periodic\s+discharges/i,
        /burst\s+suppression/i
      ],
      
      seizureActivity: [
        'electrographic seizures',
        'frequent seizures',
        'seizure burden',
        'ictal patterns'
      ],
      
      background: [
        'diffuse slowing',
        'focal slowing',
        'normal background',
        'encephalopathic background'
      ]
    },
    
    indications: [
      'altered mental status',
      'suspected subclinical seizure',
      'post-seizure monitoring',
      'medication titration',
      'refractory status epilepticus'
    ]
  },
  
  medications: {
    keppra: {
      terms: ['Keppra', 'levetiracetam', 'LEV'],
      
      patterns: {
        loading: /(?:Keppra|levetiracetam)\s+(?:load(?:ed)?|loading\s+dose)\s*:?\s*(\d+)\s*mg/i,
        maintenance: /(?:Keppra|levetiracetam)\s+(\d+)\s*mg\s+(?:PO|IV)\s+(?:BID|twice\s+daily)/i,
        increase: /(?:Keppra|levetiracetam)\s+increased\s+(?:from\s+(\d+)\s+)?to\s+(\d+)\s*mg/i
      },
      
      typicalDosing: {
        load: '1000-1500 mg IV',
        maintenance: '500-1500 mg PO/IV BID',
        maxDose: '3000 mg/day'
      }
    },
    
    lacosamide: {
      terms: ['lacosamide', 'Vimpat', 'LCM'],
      
      patterns: {
        loading: /(?:lacosamide|Vimpat)\s+(?:load(?:ed)?|loading\s+dose)\s*:?\s*(\d+)\s*mg/i,
        maintenance: /(?:lacosamide|Vimpat)\s+(\d+)\s*mg\s+(?:PO|IV)\s+(?:BID|twice\s+daily)/i
      },
      
      typicalDosing: {
        load: '200-400 mg IV',
        maintenance: '100-200 mg PO/IV BID',
        maxDose: '400 mg/day'
      }
    },
    
    phenytoin: {
      terms: ['phenytoin', 'Dilantin', 'PHT', 'fosphenytoin'],
      
      patterns: {
        loading: /(?:phenytoin|fosphenytoin|Dilantin)\s+(?:load(?:ed)?|loading\s+dose)\s*:?\s*(\d+)\s*(?:mg|PE)/i,
        maintenance: /(?:phenytoin|Dilantin)\s+(\d+)\s*mg\s+(?:PO|IV)\s+(?:daily|QD|TID)/i,
        level: /(?:phenytoin|Dilantin)\s+level\s*:?\s*(\d+(?:\.\d+)?)/i
      },
      
      typicalDosing: {
        load: '15-20 mg/kg IV (or PE for fosphenytoin)',
        maintenance: '100 mg PO/IV TID or 300 mg daily',
        targetLevel: '10-20 mcg/mL (total), 1-2 mcg/mL (free)'
      },
      
      toxicity: [
        'nystagmus',
        'ataxia',
        'diplopia',
        'rash (SJS/TEN)',
        'bone marrow suppression'
      ]
    },
    
    phenobarbital: {
      terms: ['phenobarbital', 'PHB'],
      patterns: {
        loading: /phenobarbital\s+(?:load(?:ed)?|loading\s+dose)\s*:?\s*(\d+)\s*mg/i,
        maintenance: /phenobarbital\s+(\d+)\s*mg\s+(?:PO|IV)\s+(?:daily|BID)/i
      },
      indications: ['refractory status epilepticus', 'second-line AED']
    },
    
    other: {
      benzodiazepines: {
        terms: ['lorazepam', 'Ativan', 'diazepam', 'Valium', 'midazolam', 'Versed'],
        use: 'acute seizure termination',
        patterns: [
          /(?:lorazepam|Ativan)\s+(\d+)\s*mg\s+IV/i,
          /(?:midazolam|Versed)\s+drip/i,
          /(?:diazepam|Valium)\s+(\d+)\s*mg/i
        ]
      },
      
      propofol: {
        terms: ['propofol', 'Diprivan'],
        indication: 'refractory status epilepticus',
        pattern: /propofol\s+(?:drip|infusion)/i
      },
      
      barbiturate_coma: {
        terms: ['pentobarbital', 'pentobarbital coma', 'barbiturate coma'],
        indication: 'super-refractory status',
        monitoring: 'continuous EEG, burst suppression'
      }
    }
  },
  
  management: {
    firstLine: [
      'lorazepam 2-4 mg IV',
      'or diazepam 5-10 mg IV'
    ],
    
    secondLine: [
      'levetiracetam 1000-1500 mg IV load',
      'or fosphenytoin 15-20 mg PE/kg IV',
      'or lacosamide 200-400 mg IV'
    ],
    
    thirdLine: [
      'phenobarbital 15-20 mg/kg IV',
      'midazolam infusion',
      'propofol infusion'
    ],
    
    refractoryStatus: [
      'continuous EEG monitoring',
      'pentobarbital coma',
      'ketamine',
      'ketogenic diet',
      'therapeutic hypothermia (investigational)'
    ]
  },
  
  complications: {
    neurologicalDeficit: [
      'Todd\'s paresis (post-ictal weakness)',
      'prolonged confusion',
      'cognitive impairment',
      'status-related brain injury'
    ],
    
    medical: [
      'aspiration pneumonia',
      'rhabdomyolysis',
      'metabolic acidosis',
      'hyperthermia',
      'respiratory failure'
    ]
  },
  
  outcomePredictors: {
    favorable: [
      'early seizure (within 7 days)',
      'focal seizures',
      'good response to first-line AEDs',
      'no status epilepticus'
    ],
    
    unfavorable: [
      'status epilepticus',
      'refractory seizures',
      'late onset (>7 days)',
      'frequent subclinical seizures',
      'underlying structural lesion'
    ]
  },
  
  extractionPriority: 'CRITICAL',
  confidenceTarget: 0.95
}
```

---

## 8. 🎯 Brain Metastases

**Secondary brain tumors requiring distinct management approach from primary tumors**

### Core Terms
- **Metastasis/Metastases**: Secondary tumor(s) from systemic primary
- **Primary cancer**: Lung, breast, melanoma, renal, colon (most common)
- **Resection**: Surgical removal
- **SRS**: Stereotactic radiosurgery (Gamma Knife, CyberKnife)
- **WBRT**: Whole brain radiation therapy
- **CT CAP**: CT chest/abdomen/pelvis (systemic staging)

```javascript
metastases: {
  diagnosis: {
    terms: [
      'brain metastasis',
      'brain metastases',
      'brain met',
      'brain mets',
      'metastatic disease',
      'secondary tumor',
      'cerebral metastasis'
    ],
    
    patterns: [
      /brain\s+met(?:astasis|astases|s)?/i,
      /(?:cerebral|intracranial)\s+met(?:astasis|astases|s)?/i,
      /metastatic\s+(?:lesion|tumor|disease)\s+to\s+(?:the\s+)?brain/i,
      /secondary\s+brain\s+tumor/i
    ],
    
    number: /(\d+|single|multiple|numerous)\s+(?:brain\s+)?met(?:astasis|astases|s)?/i,
    
    location: [
      /(?:frontal|parietal|temporal|occipital)\s+(?:lobe\s+)?met/i,
      /cerebellar\s+met/i,
      /brainstem\s+met/i,
      /(?:left|right|bilateral)\s+(?:hemisphere|hemispheric)\s+met/i
    ]
  },
  
  primaryCancer: {
    common: {
      lung: {
        terms: ['NSCLC', 'non-small cell lung cancer', 'SCLC', 'small cell lung cancer', 'lung cancer'],
        frequency: 'Most common (~40-50%)',
        patterns: [
          /(?:primary\s+)?lung\s+(?:cancer|carcinoma|adenocarcinoma)/i,
          /NSCLC/i,
          /SCLC/i
        ]
      },
      
      breast: {
        terms: ['breast cancer', 'breast carcinoma', 'HER2+', 'triple negative'],
        frequency: '~15-25%',
        patterns: [
          /(?:primary\s+)?breast\s+(?:cancer|carcinoma)/i,
          /HER2[\s-]positive/i,
          /triple[\s-]negative/i
        ]
      },
      
      melanoma: {
        terms: ['melanoma', 'malignant melanoma'],
        frequency: '~10%',
        pattern: /melanoma/i,
        note: 'High propensity for hemorrhage'
      },
      
      renal: {
        terms: ['renal cell carcinoma', 'RCC', 'kidney cancer', 'clear cell carcinoma'],
        frequency: '~5-10%',
        patterns: [
          /renal\s+cell\s+carcinoma/i,
          /RCC/i,
          /kidney\s+cancer/i
        ],
        note: 'Often hemorrhagic, hypervascular'
      },
      
      colon: {
        terms: ['colon cancer', 'colorectal cancer', 'CRC'],
        frequency: '~5%',
        patterns: [
          /(?:colon|colorectal)\s+(?:cancer|carcinoma)/i,
          /CRC/i
        ]
      }
    },
    
    unknown: {
      terms: ['unknown primary', 'occult primary', 'primary unknown'],
      pattern: /(?:unknown|occult)\s+primary/i,
      workup: 'CT CAP, PET scan, tissue biopsy'
    },
    
    extractionPattern: /(?:history|h\/o|known)\s+(?:of\s+)?([^.]+?)\s+(?:cancer|carcinoma|melanoma)/i
  },
  
  procedures: {
    resection: {
      terms: [
        'craniotomy for resection',
        'metastasis resection',
        'met resection',
        'excision',
        'gross total resection',
        'GTR'
      ],
      
      patterns: [
        /craniotomy\s+(?:for|with)\s+resection\s+of\s+(?:brain\s+)?met/i,
        /resection\s+of\s+(?:brain\s+)?met(?:astasis|astases)?/i,
        /(?:gross\s+total|GTR|subtotal|STR)\s+resection/i
      ],
      
      extent: {
        gtr: ['gross total resection', 'GTR', 'complete resection'],
        str: ['subtotal resection', 'STR', 'partial resection'],
        biopsy: ['biopsy only', 'diagnostic biopsy']
      },
      
      indications: [
        'single/oligometastatic disease',
        'symptomatic lesion',
        'tissue diagnosis needed',
        'radioresistant histology',
        'life expectancy >3 months',
        'KPS ≥70'
      ]
    },
    
    srs: {
      terms: [
        'stereotactic radiosurgery',
        'SRS',
        'Gamma Knife',
        'CyberKnife',
        'LINAC SRS'
      ],
      
      patterns: [
        /SRS/i,
        /stereotactic\s+radio(?:surgery|therapy)/i,
        /Gamma\s+Knife/i,
        /CyberKnife/i
      ],
      
      timing: [
        'postoperative (adjuvant to surgical bed)',
        'upfront (for unoperated lesions)',
        'salvage (for recurrence)'
      ],
      
      limitations: [
        'typically ≤3cm diameter',
        'limited number of lesions (traditionally ≤4)',
        'not for leptomeningeal disease'
      ]
    },
    
    wbrt: {
      terms: ['whole brain radiation', 'WBRT', 'whole brain RT'],
      patterns: [
        /WBRT/i,
        /whole\s+brain\s+radi(?:ation|otherapy)/i
      ],
      
      indications: [
        'multiple (>4-10) metastases',
        'leptomeningeal disease',
        'after surgical resection (historic)',
        'palliation'
      ],
      
      toxicity: [
        'neurocognitive decline',
        'alopecia',
        'fatigue'
      ]
    }
  },
  
  workup: {
    ctCap: {
      terms: [
        'CT CAP',
        'CT chest/abdomen/pelvis',
        'CT C/A/P',
        'staging CT'
      ],
      
      patterns: [
        /CT\s+(?:CAP|C\/A\/P|chest[\s\/]abdomen[\s\/]pelvis)/i,
        /staging\s+CT/i
      ],
      
      purpose: [
        'identify primary cancer',
        'assess systemic disease burden',
        'detect other metastases',
        'treatment planning'
      ],
      
      timing: 'Essential for all brain met patients'
    },
    
    petScan: {
      terms: ['PET scan', 'PET/CT', 'FDG-PET'],
      indication: 'Unknown primary or unclear primary on CT CAP'
    },
    
    mri: {
      sequences: [
        'T1 post-contrast (gold standard)',
        'T2/FLAIR',
        'DWI',
        'SWI/GRE (for hemorrhage)'
      ],
      timing: [
        'preoperative planning',
        'postoperative surveillance (q3-4 months)',
        'assess response to therapy'
      ]
    }
  },
  
  complications: {
    postoperative: {
      infection: {
        terms: ['wound infection', 'abscess', 'meningitis'],
        patterns: [
          /(?:wound|surgical\s+site)\s+infection/i,
          /postoperative\s+(?:abscess|meningitis)/i
        ]
      },
      
      woundDehiscence: {
        terms: ['wound dehiscence', 'incision breakdown', 'wound separation'],
        patterns: [
          /wound\s+dehiscence/i,
          /(?:incision|wound)\s+(?:breakdown|separation|opened)/i
        ],
        management: [
          'wound care',
          'antibiotics if infected',
          'possible revision/reclosure',
          'VAC therapy'
        ]
      },
      
      deficit: {
        terms: [
          'postoperative deficit',
          'new weakness',
          'new hemiparesis',
          'aphasia',
          'visual field cut'
        ],
        patterns: [
          /(?:new|postoperative)\s+(?:deficit|weakness|hemiparesis)/i,
          /worsening\s+(?:strength|motor\s+function)/i
        ],
        considerations: [
          'edema',
          'stroke',
          'hemorrhage',
          'surgical injury'
        ]
      },
      
      hemorrhage: {
        terms: ['postoperative hemorrhage', 'surgical bed hemorrhage', 'hematoma'],
        timing: 'Immediate postoperative period',
        imaging: 'Urgent CT head'
      },
      
      seizure: {
        terms: ['postoperative seizure', 'new-onset seizure'],
        prophylaxis: 'Controversial (not routinely recommended)',
        treatment: 'Start AED if seizure occurs'
      }
    },
    
    diseaseRelated: {
      progression: ['local recurrence', 'new metastases', 'leptomeningeal disease'],
      edema: ['vasogenic edema', 'mass effect'],
      hemorrhage: ['spontaneous hemorrhage (melanoma, RCC, thyroid)']
    }
  },
  
  medications: {
    steroids: {
      terms: ['dexamethasone', 'dex', 'Decadron'],
      indication: 'Vasogenic edema management',
      patterns: [
        /dexamethasone\s+(\d+)\s*mg/i,
        /dex\s+(\d+)\s*mg/i,
        /steroids?\s+(?:started|initiated)/i
      ],
      taper: 'Gradual taper post-surgery or post-SRS'
    },
    
    chemotherapy: {
      note: 'Systemic therapy determined by primary cancer type',
      targeted: [
        'immunotherapy (pembrolizumab, nivolumab for melanoma/NSCLC)',
        'HER2-targeted (trastuzumab for breast)',
        'EGFR/ALK inhibitors (lung)',
        'VEGF inhibitors (renal)'
      ]
    }
  },
  
  prognosis: {
    gpa: {
      name: 'Graded Prognostic Assessment',
      factors: [
        'age',
        'KPS',
        'number of metastases',
        'extracranial disease control'
      ],
      score: '0-4 (higher = better prognosis)'
    },
    
    favorable: [
      'single metastasis',
      'good performance status (KPS ≥70)',
      'controlled primary',
      'no extracranial disease',
      'age <60'
    ],
    
    unfavorable: [
      'multiple metastases',
      'poor KPS (<70)',
      'progressive systemic disease',
      'leptomeningeal involvement'
    ],
    
    medianSurvival: '3-12 months (highly variable by primary histology and GPA)'
  },
  
  extractionPriority: 'HIGH',
  confidenceTarget: 0.90
}
```

---

## 📋 Extraction Priority Matrix by Pathology

| **Pathology** | **Critical Fields** | **High Priority** | **Medium Priority** |
|--------------|---------------------|-------------------|---------------------|
| **SAH** | Ictus date, H&H/WFNS grade | EVD/LD placement, vasospasm | TCD velocities, angiography timing |
| **Tumors** | Resection extent, pathology | Dex dosing, deficits | Recurrence imaging schedule |
| **Hydrocephalus** | Shunt type, valve type, setting | Dysfunction type, revision details | Setting changes timeline |
| **TBI/cSDH** | Mechanism, hemorrhage types, GCS, anticoagulation | Procedures, imaging evolution | Rehab disposition, recurrence |
| **CSF Leak** | Location, beta-2 transferrin | LD details, endocrine workup | Repair approach, complications |
| **Spine** | Symptoms, level, pathology | Pre-op/post-op motor exam, procedure | Claudication distance, imaging findings |
| **Seizures** | Seizure type, status epilepticus, AEDs | EEG findings, medication levels | Subclinical seizures, long-term control |
| **Metastases** | Primary cancer, number of mets, resection | CT CAP results, SRS vs WBRT | GPA score, systemic therapy |

---

## 📊 Pattern Confidence Scoring

```javascript
confidenceScoring: {
  // Exact terminology match
  exact: {
    confidence: 0.95,
    examples: ['Hunt and Hess grade III', 'L4-L5 laminectomy', 'VP shunt']
  },
  
  // Abbreviation match
  abbreviation: {
    confidence: 0.90,
    examples: ['H&H 3', 'EVD', 'LD']
  },
  
  // Contextual inference
  contextual: {
    confidence: 0.80,
    examples: ['ruptured aneurysm' → 'ictus date', 'poor grade' → 'WFNS 4-5']
  },
  
  // Indirect mention
  indirect: {
    confidence: 0.70,
    examples: ['vasospasm management' → implies 'vasospasm present']
  }
}
```

---

## 🎯 ML Learning Priorities for These Pathologies

### Highest Priority (95%+ Accuracy Required)
1. **Ictus Date Extraction** (SAH): Critical for timeline, legal documentation
2. **Anticoagulation Status**: Critical for all hemorrhagic pathologies (cSDH, TBI, SAH)
3. **Seizure Detection & Classification**: Immediate management implications
4. **Primary Cancer Identification** (Metastases): Dictates entire treatment approach
5. **Grading Scales**: H&H, WFNS, Fisher variants, GCS

### High Priority (90%+ Accuracy)
6. **Motor Exam Documentation**: Pre-op vs post-op comparison with MRC grading
7. **Procedure Extraction**: Specific techniques (twist drill vs burr hole vs craniotomy)
8. **Shunt Setting Changes**: Chronological tracking with dates
9. **AED Regimen**: Medication, dosing, changes, levels
10. **CT CAP Results** (Metastases): Systemic disease assessment

### Medium Priority (85%+ Accuracy)
11. **Complication Detection**: Infection, vasospasm, dysfunction, recurrence
12. **Procedure-Level Mapping**: Specific spinal levels, tumor locations
13. **MMA Embolization**: Timing relative to surgery, technique
14. **EEG Findings**: Seizure burden, background activity
15. **Wound Complications**: Dehiscence, infection in metastasis cases

### Learning Focus Areas
- **Terminology Variations**: "twist drill" vs "twist-drill" vs "twist drill craniostomy"
- **Abbreviation Expansion**: cSDH, cEEG, AED, SRS, WBRT, CT CAP
- **Dosing Patterns**: Keppra loads, dex tapers, phenytoin levels
- **Temporal Relationships**: POD X → repeat CT, seizure → EEG → medication change
- **Context Clues**: "refractory status" implies multiple AEDs tried
- **Pathology-Specific Templates**: Each pathology has distinct narrative structure

---

## 🔄 Continuous Expansion Strategy

This database is **dynamically expanded** through multiple pathways:

### 1. User-Driven Expansion (Manual)
- **Abbreviation Entry**: Add new terms as encountered in practice
- **Pathology Addition**: New disease categories as needed
- **Pattern Refinement**: User identifies missed extractions
- **Template Updates**: Customize narrative structure per institution

### 2. ML-Driven Expansion (Automatic)
- **Correction Learning**: Every user edit teaches new patterns
- **Imported Summaries**: Reverse-engineer extraction from completed summaries
- **Pattern Generalization**: One correction → multiple related patterns
- **Pathology-Specific Learning**: Build specialized libraries per category

### 3. Deep Learning Integration (Future)
- **Medical Literature Mining**: Extract patterns from published case reports
- **BioBERT Fine-tuning**: Train on neurosurgical corpus
- **Cross-Institution Learning**: Federated learning (privacy-preserving)
- **Predictive Patterns**: Anticipate likely fields based on pathology

### 4. Research-Driven Expansion (This Update)
- **Evidence-Based Patterns**: Standards from neurosurgical guidelines
- **Comprehensive Coverage**: 8 major pathologies, 200+ patterns
- **Clinical Validation**: Patterns match real-world documentation
- **Hierarchical Organization**: From common to rare presentations

---

## 📊 Database Statistics

| Metric | Count | Coverage |
|--------|-------|----------|
| **Major Pathologies** | 8 | Core neurosurgical cases |
| **Extraction Patterns** | 200+ | Regex + context-aware |
| **Medical Abbreviations** | 150+ | Neurosurgery-specific |
| **Medications Tracked** | 30+ | Anticoagulants, AEDs, steroids |
| **Grading Scales** | 12+ | H&H, WFNS, Fisher, GCS, MRC, GPA |
| **Procedures Defined** | 50+ | From minimally invasive to open |
| **Imaging Modalities** | 15+ | CT, MRI, angiography, EEG |
| **Complications** | 40+ | Pathology-specific adverse events |

---

## 🎓 Usage Guidelines for ML Learning

### For Extraction Algorithm (`extraction.js`)
```javascript
// Priority-based pattern application
const patterns = loadPatterns('seizures');
const results = applyPatternsInOrder(text, patterns, priorityLevel='CRITICAL');

// Confidence scoring
if (exactMatch) confidence = 0.95;
else if (abbreviationMatch) confidence = 0.90;
else if (contextualInference) confidence = 0.80;

// Flag for review if confidence < 0.70
```

### For Learning Engine (`learningEngine.js`)
```javascript
// Learn from correction
async function learnFromCorrection(field, original, corrected, context) {
  // Determine pathology category
  const pathology = detectPathology(context);
  
  // Extract features specific to pathology
  const features = extractFeatures(corrected, pathology);
  
  // Update pathology-specific patterns
  await knowledgeBase.addPattern({
    pathology: pathology,
    field: field,
    pattern: features.pattern,
    confidence: 1.0  // High confidence from user correction
  });
}
```

### For Medical Abbreviations (`medicalAbbreviations.js`)
```javascript
// Dynamic loading based on detected pathology
const abbreviations = {
  ...commonAbbreviations,
  ...pathologySpecificAbbreviations[detectedPathology],
  ...userCustomAbbreviations  // Learned over time
};
```

---

## 🔐 Privacy & Compliance Notes

All patterns in this database are:
- ✅ **PHI-Free**: No patient-identifying information
- ✅ **Generalizable**: Abstract clinical concepts only
- ✅ **Shareable**: Can be exported/imported between users
- ✅ **HIPAA-Compliant**: Safe for cloud storage or sharing
- ✅ **Evidence-Based**: Derived from medical literature and standards

**Patient-Specific Data NEVER Stored**: Only the patterns, not the actual patient data.

---

## 🚀 Next Steps for Implementation

1. **Integrate patterns into `extraction.js`**: Map patterns to extraction functions
2. **Build pathology detector**: Auto-classify cases for optimal pattern selection
3. **Implement confidence scoring**: All extractions get 0.0-1.0 confidence score
4. **Create pattern versioning**: Track pattern evolution over time
5. **Build feedback UI**: Show which patterns succeeded/failed
6. **Export/Import functionality**: Share learned patterns between users
7. **Performance benchmarking**: Measure accuracy improvements vs baseline

---

**Status**: ✅ Comprehensive database ready for integration
**Version**: 2.0 (Enhanced with cSDH, seizures, metastases)
**Last Updated**: October 13, 2025
**Pattern Count**: 200+ extraction patterns across 8 pathologies
**Next Expansion**: Additional pathologies as clinically encountered + continuous ML learning
