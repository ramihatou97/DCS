/**
 * Context Provider Service
 * 
 * Provides comprehensive context for extraction and summary generation.
 * Assembles pathology context, consultant context, temporal context,
 * and clinical reasoning context to improve accuracy.
 * 
 * Features:
 * - Pathology detection and context
 * - Consultant note identification and weighting
 * - Temporal context (timeline, POD/HD tracking)
 * - Clinical reasoning context (cause-effect, complications)
 * - Cross-field context (expected relationships)
 */

import { detectPathology } from '../../config/pathologyPatterns.js';
import knowledgeBase from '../knowledge/knowledgeBase.js';

/**
 * Consultant Service Types
 */
const CONSULTANT_SERVICES = {
  neurology: {
    keywords: ['neurology consult', 'neuro consult', 'neurologist'],
    focus: ['neurological deficits', 'seizure risk', 'cognitive status'],
    weight: 1.5
  },
  ptot: {
    keywords: ['physical therapy', 'occupational therapy', 'pt consult', 'ot consult', 'pt/ot', 'ot/pt'],
    focus: ['functional status', 'mobility', 'ADL independence', 'discharge disposition'],
    weight: 2.0 // Highest weight for functional status
  },
  cardiology: {
    keywords: ['cardiology consult', 'cardio consult', 'cardiologist'],
    focus: ['cardiac risk', 'arrhythmia', 'anticoagulation'],
    weight: 1.3
  },
  infectiousDisease: {
    keywords: ['infectious disease', 'id consult', 'infectious disease consult'],
    focus: ['antibiotic selection', 'duration', 'resistance patterns'],
    weight: 1.4
  },
  endocrinology: {
    keywords: ['endocrinology', 'endocrine consult', 'endo consult'],
    focus: ['glucose management', 'steroid tapering', 'thyroid function', 'DI', 'ACTH'],
    weight: 1.3
  },
  nephrology: {
    keywords: ['nephrology', 'renal consult', 'nephro consult'],
    focus: ['renal function', 'fluid management', 'dialysis'],
    weight: 1.2
  },
  pulmonology: {
    keywords: ['pulmonology', 'pulm consult', 'pulmonologist'],
    focus: ['ventilator weaning', 'oxygen requirements', 'respiratory status'],
    weight: 1.2
  }
};

/**
 * Context Provider Class
 */
class ContextProvider {
  constructor() {
    this.context = null;
  }
  
  /**
   * Build comprehensive context from notes and extracted data
   */
  buildContext(notes, extractedData = null) {
    const noteText = Array.isArray(notes) ? notes.join('\n\n') : notes;
    
    this.context = {
      pathology: this.detectPathologyContext(noteText, extractedData),
      consultants: this.identifyConsultants(noteText),
      temporal: this.buildTemporalContext(noteText, extractedData),
      clinical: this.inferClinicalContext(noteText, extractedData),
      knowledge: this.getRelevantKnowledge(noteText, extractedData)
    };
    
    return this.context;
  }
  
  /**
   * Detect pathology and get relevant context
   */
  detectPathologyContext(noteText, extractedData) {
    // Detect pathology
    const detectedPathologies = detectPathology(noteText);

    // FIX: Extract the 'type' property from the detected pathology object
    // detectPathology returns array of objects: [{ type: 'SAH', name: '...', confidence: 0.9 }]
    // We need the string 'SAH', not the entire object
    const primaryPathologyObj = detectedPathologies[0];
    const primaryPathology = primaryPathologyObj?.type || 'general';

    // Get pathology-specific context
    const examProtocol = knowledgeBase.getExamProtocol(primaryPathology);
    const gradingScales = knowledgeBase.getGradingScales(primaryPathology);
    const redFlags = knowledgeBase.getRedFlags(primaryPathology);
    const followUp = knowledgeBase.getFollowUpProtocol(primaryPathology);

    return {
      primary: primaryPathology,
      detected: detectedPathologies,
      examProtocol,
      gradingScales,
      redFlags,
      followUp,
      expectedFields: this.getExpectedFields(primaryPathology)
    };
  }
  
  /**
   * Identify consultant notes and their focus areas
   */
  identifyConsultants(noteText) {
    const noteLower = noteText.toLowerCase();
    const identified = [];
    
    for (const [service, config] of Object.entries(CONSULTANT_SERVICES)) {
      for (const keyword of config.keywords) {
        if (noteLower.includes(keyword.toLowerCase())) {
          identified.push({
            service,
            focus: config.focus,
            weight: config.weight,
            keyword
          });
          break; // Only count once per service
        }
      }
    }
    
    return {
      present: identified.length > 0,
      services: identified,
      count: identified.length,
      hasPTOT: identified.some(c => c.service === 'ptot'),
      hasNeurology: identified.some(c => c.service === 'neurology'),
      hasID: identified.some(c => c.service === 'infectiousDisease')
    };
  }
  
  /**
   * Build temporal context (timeline, POD/HD tracking)
   */
  buildTemporalContext(noteText, extractedData) {
    const timeline = {
      admission: null,
      procedures: [],
      complications: [],
      discharge: null
    };
    
    // Extract admission date
    const admissionMatch = noteText.match(/admitted?\s+(?:on|date)?\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i);
    if (admissionMatch) {
      timeline.admission = admissionMatch[1];
    }
    
    // Extract discharge date
    const dischargeMatch = noteText.match(/discharged?\s+(?:on|date)?\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i);
    if (dischargeMatch) {
      timeline.discharge = dischargeMatch[1];
    }
    
    // Extract POD/HD references
    const podMatches = noteText.matchAll(/POD\s*#?\s*(\d+)/gi);
    const hdMatches = noteText.matchAll(/HD\s*#?\s*(\d+)/gi);
    
    const pods = [...podMatches].map(m => parseInt(m[1]));
    const hds = [...hdMatches].map(m => parseInt(m[1]));
    
    return {
      timeline,
      pods: [...new Set(pods)].sort((a, b) => a - b),
      hds: [...new Set(hds)].sort((a, b) => a - b),
      hasPOD: pods.length > 0,
      hasHD: hds.length > 0,
      maxPOD: pods.length > 0 ? Math.max(...pods) : null,
      maxHD: hds.length > 0 ? Math.max(...hds) : null
    };
  }
  
  /**
   * Infer clinical reasoning context
   */
  inferClinicalContext(noteText, extractedData) {
    const noteLower = noteText.toLowerCase();
    
    // Detect complications
    const complications = {
      infection: noteLower.includes('meningitis') || noteLower.includes('infection'),
      seizure: noteLower.includes('seizure'),
      hemorrhage: noteLower.includes('hemorrhage') || noteLower.includes('bleeding'),
      vasospasm: noteLower.includes('vasospasm'),
      hydrocephalus: noteLower.includes('hydrocephalus'),
      di: noteLower.includes('diabetes insipidus') || noteLower.includes(' di '),
      csfLeak: noteLower.includes('csf leak') || noteLower.includes('rhinorrhea')
    };
    
    // Detect interventions
    const interventions = {
      evd: noteLower.includes('evd') || noteLower.includes('ventriculostomy'),
      lumbarDrain: noteLower.includes('lumbar drain'),
      craniotomy: noteLower.includes('craniotomy'),
      coiling: noteLower.includes('coiling'),
      clipping: noteLower.includes('clipping')
    };
    
    // Detect medications (key ones)
    const medications = {
      nimodipine: noteLower.includes('nimodipine'),
      dexamethasone: noteLower.includes('dexamethasone') || noteLower.includes('decadron'),
      levetiracetam: noteLower.includes('levetiracetam') || noteLower.includes('keppra'),
      ddavp: noteLower.includes('ddavp') || noteLower.includes('desmopressin')
    };
    
    // Infer clinical reasoning
    const reasoning = [];
    
    if (medications.nimodipine) {
      reasoning.push({
        observation: 'Nimodipine mentioned',
        inference: 'SAH with vasospasm risk',
        expectedFindings: ['Hunt-Hess grade', 'Fisher grade', 'aneurysm location']
      });
    }
    
    if (interventions.evd) {
      reasoning.push({
        observation: 'EVD placed',
        inference: 'Hydrocephalus or ICP management',
        expectedFindings: ['ICP values', 'ventricular size', 'EVD output']
      });
    }
    
    if (complications.infection && noteLower.includes('vancomycin')) {
      reasoning.push({
        observation: 'Infection + Vancomycin',
        inference: 'Bacterial meningitis treatment',
        expectedFindings: ['CSF analysis', 'cultures', 'ID consult', 'PICC line']
      });
    }
    
    if (medications.ddavp) {
      reasoning.push({
        observation: 'DDAVP mentioned',
        inference: 'Diabetes insipidus',
        expectedFindings: ['Polyuria', 'Hypernatremia', 'Urine osmolality', 'Endocrine consult']
      });
    }
    
    return {
      complications,
      interventions,
      medications,
      reasoning,
      complexity: reasoning.length // Higher = more complex case
    };
  }
  
  /**
   * Get relevant knowledge for context
   */
  getRelevantKnowledge(noteText, extractedData) {
    const pathology = this.context?.pathology?.primary || 'general';
    
    return {
      examProtocol: knowledgeBase.getExamProtocol(pathology),
      redFlags: knowledgeBase.getRedFlags(pathology),
      followUp: knowledgeBase.getFollowUpProtocol(pathology)
    };
  }
  
  /**
   * Get expected fields for pathology
   * @param {string|object} pathology - Pathology type (string) or pathology object with 'type' property
   * @returns {array} Expected fields for the pathology
   */
  getExpectedFields(pathology) {
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

    const expectedFields = {
      general: ['demographics', 'examination', 'procedures', 'medications', 'complications'],
      SAH: ['gradingScales.huntHess', 'gradingScales.fisher', 'aneurysm.location', 'vasospasm', 'nimodipine'],
      TUMORS: ['tumor.type', 'tumor.location', 'resectionExtent', 'histology', 'adjuvantTherapy'],
      SPINE: ['spineLevel', 'approach', 'instrumentation', 'fusion', 'neurologicalStatus'],
      TBI_CSDH: ['gcs', 'mechanism', 'icpManagement', 'imaging'],
      HYDROCEPHALUS: ['ventricularSize', 'evd', 'shunt'],
      SEIZURES: ['seizureType', 'aed', 'eeg', 'neurologyCons ult']
    };

    return expectedFields[pathologyString] || expectedFields.general;
  }
  
  /**
   * Get context for specific field
   */
  getFieldContext(field) {
    if (!this.context) return null;
    
    // Return relevant context for the field
    return {
      pathology: this.context.pathology,
      consultants: this.context.consultants,
      temporal: this.context.temporal,
      clinical: this.context.clinical
    };
  }
  
  /**
   * Get consultant weight for field
   */
  getConsultantWeight(field) {
    if (!this.context?.consultants?.present) return 1.0;
    
    // Functional status fields get PT/OT weight
    if (field.includes('functional') || field.includes('mobility') || field.includes('adl')) {
      const ptot = this.context.consultants.services.find(c => c.service === 'ptot');
      return ptot ? ptot.weight : 1.0;
    }
    
    // Neurological fields get neurology weight
    if (field.includes('neuro') || field.includes('deficit') || field.includes('exam')) {
      const neuro = this.context.consultants.services.find(c => c.service === 'neurology');
      return neuro ? neuro.weight : 1.0;
    }
    
    return 1.0;
  }
  
  /**
   * Validate temporal consistency
   */
  validateTemporalConsistency(dates) {
    const errors = [];
    
    if (dates.admission && dates.discharge) {
      const admission = new Date(dates.admission);
      const discharge = new Date(dates.discharge);
      
      if (discharge < admission) {
        errors.push({
          field: 'dates',
          message: 'Discharge date is before admission date',
          severity: 'error'
        });
      }
    }
    
    if (dates.procedure && dates.admission) {
      const procedure = new Date(dates.procedure);
      const admission = new Date(dates.admission);
      
      if (procedure < admission) {
        errors.push({
          field: 'procedure.date',
          message: 'Procedure date is before admission date',
          severity: 'warning'
        });
      }
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  /**
   * Get current context
   */
  getContext() {
    return this.context;
  }
  
  /**
   * Clear context
   */
  clearContext() {
    this.context = null;
  }
}

// Export singleton instance
const contextProvider = new ContextProvider();
export default contextProvider;

// Export for testing
export { CONSULTANT_SERVICES };

