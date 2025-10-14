/**
 * Discharge Summary Templates
 * 
 * Pathology-specific templates with standard sections
 */

import { PATHOLOGY_TYPES } from '../config/pathologyPatterns.js';

/**
 * Standard section structure for all discharge summaries
 */
export const STANDARD_SECTIONS = {
  HEADER: 'header',
  DEMOGRAPHICS: 'demographics',
  PRESENTATION: 'presentation',
  DIAGNOSTIC_WORKUP: 'diagnosticWorkup',
  MANAGEMENT: 'management',
  CLINICAL_EVOLUTION: 'clinicalEvolution',
  COMPLICATIONS: 'complications',
  CONSULTATIONS: 'consultations',
  DISCHARGE_STATUS: 'dischargeStatus',
  FUNCTIONAL_STATUS: 'functionalStatus',
  FOLLOW_UP: 'followUp',
  MEDICATIONS: 'medications'
};

/**
 * Base template structure
 */
const BASE_TEMPLATE = {
  header: {
    title: 'DISCHARGE SUMMARY',
    required: true,
    order: 1
  },
  demographics: {
    title: 'PATIENT INFORMATION',
    required: true,
    order: 2,
    fields: ['age', 'sex', 'anticoagulation', 'medicalHistory']
  },
  presentation: {
    title: 'CLINICAL PRESENTATION',
    required: true,
    order: 3,
    fields: ['symptoms', 'onset', 'progression', 'admissionDate']
  },
  diagnosticWorkup: {
    title: 'DIAGNOSTIC WORKUP',
    required: true,
    order: 4,
    fields: ['imaging', 'investigations', 'diagnosis']
  },
  management: {
    title: 'MANAGEMENT',
    required: true,
    order: 5,
    fields: ['procedures', 'medicalManagement']
  },
  clinicalEvolution: {
    title: 'CLINICAL EVOLUTION',
    required: true,
    order: 6,
    narrative: true
  },
  complications: {
    title: 'COMPLICATIONS',
    required: false,
    order: 7,
    conditional: true
  },
  consultations: {
    title: 'CONSULTATIONS',
    required: false,
    order: 8,
    conditional: true
  },
  dischargeStatus: {
    title: 'DISCHARGE STATUS',
    required: true,
    order: 9,
    fields: ['clinicalStatus', 'neurologicalExam', 'destination']
  },
  functionalStatus: {
    title: 'FUNCTIONAL STATUS',
    required: true,
    order: 10,
    fields: ['kps', 'ecog', 'mRS']
  },
  followUp: {
    title: 'FOLLOW-UP',
    required: true,
    order: 11,
    fields: ['appointments', 'imaging', 'instructions']
  },
  medications: {
    title: 'DISCHARGE MEDICATIONS',
    required: true,
    order: 12
  }
};

/**
 * SAH-specific template
 */
export const SAH_TEMPLATE = {
  ...BASE_TEMPLATE,
  presentation: {
    ...BASE_TEMPLATE.presentation,
    fields: ['ictusDate', 'symptoms', 'onset', 'grading', 'admissionDate'],
    specificFields: ['H&H grade', 'WFNS grade', 'Fisher grade', 'modified Fisher grade']
  },
  diagnosticWorkup: {
    ...BASE_TEMPLATE.diagnosticWorkup,
    specificFields: ['CTA', 'DSA', 'aneurysm location', 'aneurysm size']
  },
  management: {
    ...BASE_TEMPLATE.management,
    specificFields: ['EVD placement', 'lumbar drain', 'coiling', 'clipping', 'flow diverter', 'vasospasm management']
  },
  clinicalEvolution: {
    ...BASE_TEMPLATE.clinicalEvolution,
    focusAreas: ['vasospasm monitoring', 'TCD velocities', 'DCI events', 'drain management']
  }
};

/**
 * Tumor-specific template
 */
export const TUMOR_TEMPLATE = {
  ...BASE_TEMPLATE,
  presentation: {
    ...BASE_TEMPLATE.presentation,
    specificFields: ['seizure history', 'focal deficits', 'tumor location']
  },
  diagnosticWorkup: {
    ...BASE_TEMPLATE.diagnosticWorkup,
    specificFields: ['MRI findings', 'enhancement pattern', 'size', 'location', 'mass effect']
  },
  management: {
    ...BASE_TEMPLATE.management,
    specificFields: ['resection extent (GTR/STR)', 'intraoperative findings', 'pathology', 'molecular markers']
  },
  clinicalEvolution: {
    ...BASE_TEMPLATE.clinicalEvolution,
    focusAreas: ['neurological status', 'steroid taper', 'wound healing', 'post-op imaging']
  },
  followUp: {
    ...BASE_TEMPLATE.followUp,
    specificFields: ['adjuvant therapy plan', 'neuro-oncology follow-up', 'MRI surveillance']
  }
};

/**
 * Hydrocephalus-specific template
 */
export const HYDROCEPHALUS_TEMPLATE = {
  ...BASE_TEMPLATE,
  presentation: {
    ...BASE_TEMPLATE.presentation,
    specificFields: ['headache', 'nausea/vomiting', 'vision changes', 'gait disturbance', 'cognitive changes']
  },
  diagnosticWorkup: {
    ...BASE_TEMPLATE.diagnosticWorkup,
    specificFields: ['CT head', 'MRI brain', 'ventricular size', 'periventricular edema']
  },
  management: {
    ...BASE_TEMPLATE.management,
    specificFields: ['shunt type', 'valve setting', 'catheter placement', 'ETV']
  },
  clinicalEvolution: {
    ...BASE_TEMPLATE.clinicalEvolution,
    focusAreas: ['shunt function', 'symptom improvement', 'imaging follow-up']
  },
  followUp: {
    ...BASE_TEMPLATE.followUp,
    specificFields: ['shunt series', 'valve adjustment', 'symptoms to watch']
  }
};

/**
 * TBI/cSDH-specific template
 */
export const TBI_CSDH_TEMPLATE = {
  ...BASE_TEMPLATE,
  presentation: {
    ...BASE_TEMPLATE.presentation,
    specificFields: ['mechanism of injury', 'GCS', 'anticoagulation status', 'LOC', 'amnesia']
  },
  diagnosticWorkup: {
    ...BASE_TEMPLATE.diagnosticWorkup,
    specificFields: ['CT head', 'hematoma size', 'midline shift', 'septations', 'density']
  },
  management: {
    ...BASE_TEMPLATE.management,
    specificFields: ['burr hole craniotomy', 'twist drill', 'craniotomy', 'MMA embolization', 'subdural drain']
  },
  clinicalEvolution: {
    ...BASE_TEMPLATE.clinicalEvolution,
    focusAreas: ['repeat CT protocol', 'drain output', 'neurological exam', 'reaccumulation']
  },
  followUp: {
    ...BASE_TEMPLATE.followUp,
    specificFields: ['repeat CT timing', 'anticoagulation resumption', 'symptoms to watch']
  }
};

/**
 * Spine-specific template
 */
export const SPINE_TEMPLATE = {
  ...BASE_TEMPLATE,
  presentation: {
    ...BASE_TEMPLATE.presentation,
    specificFields: ['radiculopathy', 'myelopathy', 'claudication', 'motor deficit', 'sensory deficit']
  },
  diagnosticWorkup: {
    ...BASE_TEMPLATE.diagnosticWorkup,
    specificFields: ['MRI spine', 'level of pathology', 'stenosis', 'compression', 'instability']
  },
  management: {
    ...BASE_TEMPLATE.management,
    specificFields: ['surgical approach', 'levels treated', 'decompression', 'fusion', 'instrumentation']
  },
  clinicalEvolution: {
    ...BASE_TEMPLATE.clinicalEvolution,
    focusAreas: ['motor strength by level', 'sensory exam', 'pain control', 'ambulation']
  },
  followUp: {
    ...BASE_TEMPLATE.followUp,
    specificFields: ['bracing', 'PT referral', 'imaging follow-up', 'return to activities']
  }
};

/**
 * Seizure-specific template
 */
export const SEIZURE_TEMPLATE = {
  ...BASE_TEMPLATE,
  presentation: {
    ...BASE_TEMPLATE.presentation,
    specificFields: ['seizure type', 'frequency', 'duration', 'status epilepticus', 'prior AEDs']
  },
  diagnosticWorkup: {
    ...BASE_TEMPLATE.diagnosticWorkup,
    specificFields: ['EEG findings', 'MRI brain', 'underlying etiology']
  },
  management: {
    ...BASE_TEMPLATE.management,
    specificFields: ['AED regimen', 'loading doses', 'maintenance doses', 'drug levels']
  },
  clinicalEvolution: {
    ...BASE_TEMPLATE.clinicalEvolution,
    focusAreas: ['seizure control', 'AED adjustments', 'EEG monitoring', 'side effects']
  },
  followUp: {
    ...BASE_TEMPLATE.followUp,
    specificFields: ['AED compliance', 'drug levels', 'neurology follow-up', 'driving restrictions']
  }
};

/**
 * Metastases-specific template
 */
export const METASTASES_TEMPLATE = {
  ...BASE_TEMPLATE,
  demographics: {
    ...BASE_TEMPLATE.demographics,
    fields: ['age', 'sex', 'anticoagulation', 'medicalHistory', 'primaryCancer', 'systemicTherapy']
  },
  presentation: {
    ...BASE_TEMPLATE.presentation,
    specificFields: ['neurological symptoms', 'number of mets', 'location', 'edema']
  },
  diagnosticWorkup: {
    ...BASE_TEMPLATE.diagnosticWorkup,
    specificFields: ['MRI brain', 'CT CAP', 'PET scan', 'GPA score']
  },
  management: {
    ...BASE_TEMPLATE.management,
    specificFields: ['resection', 'SRS', 'WBRT', 'steroids', 'systemic therapy coordination']
  },
  clinicalEvolution: {
    ...BASE_TEMPLATE.clinicalEvolution,
    focusAreas: ['neurological recovery', 'wound healing', 'steroid taper', 'oncology coordination']
  },
  followUp: {
    ...BASE_TEMPLATE.followUp,
    specificFields: ['radiation oncology', 'medical oncology', 'MRI surveillance', 'systemic disease management']
  }
};

/**
 * CSF Leak-specific template
 */
export const CSF_LEAK_TEMPLATE = {
  ...BASE_TEMPLATE,
  presentation: {
    ...BASE_TEMPLATE.presentation,
    specificFields: ['rhinorrhea', 'otorrhea', 'headache', 'meningitis history']
  },
  diagnosticWorkup: {
    ...BASE_TEMPLATE.diagnosticWorkup,
    specificFields: ['beta-2 transferrin', 'CT cisternogram', 'MRI brain', 'leak location']
  },
  management: {
    ...BASE_TEMPLATE.management,
    specificFields: ['lumbar drain', 'surgical repair', 'approach', 'graft material']
  },
  clinicalEvolution: {
    ...BASE_TEMPLATE.clinicalEvolution,
    focusAreas: ['leak resolution', 'drain management', 'endocrine function', 'vision']
  },
  followUp: {
    ...BASE_TEMPLATE.followUp,
    specificFields: ['endocrinology follow-up', 'ophthalmology', 'symptoms to watch']
  }
};

/**
 * Get template by pathology type
 */
export const getTemplateByPathology = (pathologyType) => {
  const templates = {
    [PATHOLOGY_TYPES.SAH]: SAH_TEMPLATE,
    [PATHOLOGY_TYPES.TUMORS]: TUMOR_TEMPLATE,
    [PATHOLOGY_TYPES.HYDROCEPHALUS]: HYDROCEPHALUS_TEMPLATE,
    [PATHOLOGY_TYPES.TBI_CSDH]: TBI_CSDH_TEMPLATE,
    [PATHOLOGY_TYPES.SPINE]: SPINE_TEMPLATE,
    [PATHOLOGY_TYPES.SEIZURES]: SEIZURE_TEMPLATE,
    [PATHOLOGY_TYPES.METASTASES]: METASTASES_TEMPLATE,
    [PATHOLOGY_TYPES.CSF_LEAK]: CSF_LEAK_TEMPLATE
  };
  
  return templates[pathologyType] || BASE_TEMPLATE;
};

/**
 * Generate discharge summary from extracted data using template
 */
export const generateFromTemplate = (extractedData, pathologyType) => {
  const template = getTemplateByPathology(pathologyType);
  let summary = '';
  
  // Sort sections by order
  const sections = Object.entries(template)
    .filter(([key, section]) => section.order)
    .sort(([, a], [, b]) => a.order - b.order);
  
  for (const [sectionKey, section] of sections) {
    // Skip conditional sections if no data
    if (section.conditional && !extractedData[sectionKey]) {
      continue;
    }
    
    // Add section title
    summary += `\n${section.title}\n`;
    summary += '='.repeat(section.title.length) + '\n\n';
    
    // Add section content
    if (section.narrative) {
      // Narrative sections
      summary += extractedData[sectionKey] || 'No significant events documented.';
    } else if (section.fields) {
      // Field-based sections
      for (const field of section.fields) {
        const value = extractedData[sectionKey]?.[field];
        if (value) {
          const fieldLabel = formatFieldLabel(field);
          summary += `${fieldLabel}: ${value}\n`;
        }
      }
    } else {
      // Free-form content
      summary += extractedData[sectionKey] || 'Not documented.';
    }
    
    summary += '\n\n';
  }
  
  return summary;
};

/**
 * Format field label for display
 */
const formatFieldLabel = (field) => {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

/**
 * Validate required sections
 */
export const validateTemplate = (extractedData, pathologyType) => {
  const template = getTemplateByPathology(pathologyType);
  const missing = [];
  
  for (const [sectionKey, section] of Object.entries(template)) {
    if (section.required && !extractedData[sectionKey]) {
      missing.push(section.title);
    }
  }
  
  return {
    isValid: missing.length === 0,
    missingRequired: missing
  };
};

export default {
  BASE_TEMPLATE,
  SAH_TEMPLATE,
  TUMOR_TEMPLATE,
  HYDROCEPHALUS_TEMPLATE,
  TBI_CSDH_TEMPLATE,
  SPINE_TEMPLATE,
  SEIZURE_TEMPLATE,
  METASTASES_TEMPLATE,
  CSF_LEAK_TEMPLATE,
  getTemplateByPathology,
  generateFromTemplate,
  validateTemplate
};
