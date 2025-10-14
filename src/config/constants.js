/**
 * Application Constants
 */

// API Configuration
export const API_CONFIG = {
  ANTHROPIC: {
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 4096,
    temperature: 0.3 // Lower for medical accuracy
  },
  OPENAI: {
    model: 'gpt-4-turbo-preview',
    maxTokens: 4096,
    temperature: 0.3
  },
  GEMINI: {
    model: 'gemini-pro',
    maxTokens: 4096,
    temperature: 0.3
  }
};

// Confidence Thresholds
export const CONFIDENCE = {
  CRITICAL: 0.95, // Must review if below
  HIGH: 0.85,
  MEDIUM: 0.70,
  LOW: 0.50,
  REVIEW_THRESHOLD: 0.70 // Flag for manual review
};

// Extraction Targets (13 critical fields)
export const EXTRACTION_TARGETS = {
  DEMOGRAPHICS: 'demographics',
  ANTICOAGULATION: 'anticoagulation',
  MEDICAL_HISTORY: 'medicalHistory',
  PRESENTATION: 'presentation',
  DIAGNOSTIC_WORKUP: 'diagnosticWorkup',
  MANAGEMENT: 'management',
  CLINICAL_EVOLUTION: 'clinicalEvolution',
  CONSULTATIONS: 'consultations',
  COMPLICATIONS: 'complications',
  NEUROLOGICAL_EXAMS: 'neurologicalExams',
  FAMILY_MEETINGS: 'familyMeetings',
  DISCHARGE_STATUS: 'dischargeStatus',
  FOLLOW_UP: 'followUp'
};

// Discharge Destinations
export const DISCHARGE_DESTINATIONS = {
  HOME: 'home',
  HOME_WITH_SERVICES: 'home_with_services',
  REHABILITATION: 'rehabilitation',
  LONG_TERM_CARE: 'long_term_care',
  SATELLITE_CARE: 'satellite_care',
  HOSPICE: 'hospice',
  REPATRIATION: 'repatriation',
  DECEASED: 'deceased'
};

// Functional Status Scores
export const FUNCTIONAL_SCORES = {
  KPS: {
    name: 'Karnofsky Performance Status',
    range: [0, 100],
    increment: 10,
    description: 'General functional status'
  },
  ECOG: {
    name: 'ECOG Performance Status',
    range: [0, 5],
    increment: 1,
    description: 'Activity level and self-care'
  },
  MRS: {
    name: 'Modified Rankin Scale',
    range: [0, 6],
    increment: 1,
    description: 'Degree of disability'
  }
};

// Timeline Event Types
export const EVENT_TYPES = {
  ADMISSION: 'admission',
  PROCEDURE: 'procedure',
  COMPLICATION: 'complication',
  CONSULTATION: 'consultation',
  MEDICATION_CHANGE: 'medication_change',
  IMAGING: 'imaging',
  CLINICAL_CHANGE: 'clinical_change',
  DISCHARGE: 'discharge'
};

// Deduplication Similarity Thresholds
export const SIMILARITY_THRESHOLDS = {
  EXACT_MATCH: 1.0,
  VERY_HIGH: 0.95,
  HIGH: 0.85,
  MEDIUM: 0.70,
  LOW: 0.50
};

// Abbreviation Expansions
export const MEDICAL_ABBREVIATIONS = {
  // General
  'pt': 'patient',
  'pts': 'patients',
  'hx': 'history',
  'yo': 'year old',
  'yom': 'year old male',
  'yof': 'year old female',
  
  // Neurosurgery
  'SAH': 'subarachnoid hemorrhage',
  'aSAH': 'aneurysmal subarachnoid hemorrhage',
  'SDH': 'subdural hematoma',
  'cSDH': 'chronic subdural hematoma',
  'EDH': 'epidural hematoma',
  'IVH': 'intraventricular hemorrhage',
  'ICH': 'intracerebral hemorrhage',
  'DAI': 'diffuse axonal injury',
  'TBI': 'traumatic brain injury',
  'EVD': 'external ventricular drain',
  'LD': 'lumbar drain',
  'VP': 'ventriculoperitoneal',
  'VA': 'ventriculoatrial',
  'LP': 'lumbar puncture',
  'MMA': 'middle meningeal artery',
  
  // Imaging
  'CT': 'computed tomography',
  'CTA': 'CT angiography',
  'CTP': 'CT perfusion',
  'MRI': 'magnetic resonance imaging',
  'MRA': 'MR angiography',
  'MRV': 'MR venography',
  'DSA': 'digital subtraction angiography',
  
  // Clinical
  'GCS': 'Glasgow Coma Scale',
  'NIHSS': 'NIH Stroke Scale',
  'mRS': 'modified Rankin Scale',
  'KPS': 'Karnofsky Performance Status',
  'ECOG': 'Eastern Cooperative Oncology Group',
  'POD': 'postoperative day',
  'HD': 'hospital day',
  'LOS': 'length of stay',
  
  // Tumors
  'GBM': 'glioblastoma',
  'GTR': 'gross total resection',
  'STR': 'subtotal resection',
  'NTR': 'near total resection',
  'IDH': 'isocitrate dehydrogenase',
  'MGMT': 'O6-methylguanine-DNA methyltransferase',
  'WHO': 'World Health Organization',
  
  // Medications
  'ASA': 'aspirin',
  'dex': 'dexamethasone',
  'LEV': 'levetiracetam',
  'PHT': 'phenytoin',
  'LCM': 'lacosamide',
  
  // Lab
  'WBC': 'white blood cell',
  'Hgb': 'hemoglobin',
  'Hct': 'hematocrit',
  'plt': 'platelet',
  'INR': 'international normalized ratio',
  'PTT': 'partial thromboplastin time',
  'Na': 'sodium',
  'K': 'potassium',
  'Cr': 'creatinine',
  'BUN': 'blood urea nitrogen'
};

// Recommendation Language Patterns (for no-extrapolation guard)
export const RECOMMENDATION_PATTERNS = [
  /\b(?:should|recommend|advise|suggest|consider|propose)\b/gi,
  /\b(?:would|could|may|might)\s+(?:be|benefit|help)\b/gi,
  /\b(?:plan to|intend to|will)\b/gi,
  /\b(?:patient needs|requires|must)\b/gi,
  /\bif\b.*\bthen\b/gi,
  /\b(?:optimal|ideal|best|preferred)\s+(?:approach|treatment|management)\b/gi
];

// Follow-Up Template IDs
export const FOLLOW_UP_TEMPLATES = {
  TUMOR: 'tumor',
  CSDH: 'csdh',
  SAH: 'sah',
  TRANSSPHENOIDAL: 'transsphenoidal',
  SPINE: 'spine',
  HYDROCEPHALUS: 'hydrocephalus'
};

// Consultant Services
export const CONSULTANT_SERVICES = {
  INFECTIOUS_DISEASE: 'infectious_disease',
  THROMBOSIS: 'thrombosis',
  ENDOCRINOLOGY: 'endocrinology',
  NEUROLOGY: 'neurology',
  PALLIATIVE_CARE: 'palliative_care',
  CARDIOLOGY: 'cardiology',
  NEPHROLOGY: 'nephrology'
};

// Export Options
export const EXPORT_OPTIONS = {
  TEXT: {
    extension: '.txt',
    mimeType: 'text/plain',
    description: 'Plain text (copy-paste ready)'
  },
  PDF: {
    extension: '.pdf',
    mimeType: 'application/pdf',
    description: 'PDF document (formatted)'
  }
};

// App Metadata
export const APP_METADATA = {
  name: 'Discharge Summary Generator',
  version: '1.0.0',
  description: 'AI-powered neurosurgical discharge summary generator with ML learning',
  author: 'Dr. Rami Hatoum',
  lastUpdated: '2025-10-13'
};

// Error Messages
export const ERROR_MESSAGES = {
  NO_NOTES: 'Please upload clinical notes before proceeding',
  EXTRACTION_FAILED: 'Failed to extract data from notes',
  SUMMARY_GENERATION_FAILED: 'Failed to generate discharge summary',
  EXPORT_FAILED: 'Failed to export summary',
  API_KEY_MISSING: 'API key required for LLM enhancement',
  NETWORK_ERROR: 'Network error - check your connection',
  STORAGE_ERROR: 'Failed to save/load data',
  VALIDATION_ERROR: 'Data validation failed',
  EXTRAPOLATION_DETECTED: 'Potential extrapolation detected - review required'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  NOTES_UPLOADED: 'Notes uploaded successfully',
  EXTRACTION_COMPLETE: 'Data extracted successfully',
  SUMMARY_GENERATED: 'Discharge summary generated',
  EXPORT_COMPLETE: 'Summary exported successfully',
  SETTINGS_SAVED: 'Settings saved',
  LEARNING_UPDATED: 'ML patterns updated',
  DRAFT_SAVED: 'Draft saved',
  DATA_CLEARED: 'Patient data cleared (ML learning preserved)'
};

// UI Constants
export const UI = {
  HEADER_HEIGHT: '64px',
  SIDEBAR_WIDTH: '256px',
  MAX_CONTENT_WIDTH: '1200px',
  ANIMATION_DURATION: 200, // ms
  DEBOUNCE_DELAY: 300 // ms
};

// Local Storage Keys
export const STORAGE_KEYS = {
  THEME: 'dcs_theme',
  API_KEYS: 'dcs_api_keys',
  SETTINGS: 'dcs_settings',
  SESSION_ID: 'dcs_session_id'
};
