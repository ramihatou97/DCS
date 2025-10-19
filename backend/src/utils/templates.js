/**
 * Narrative templates for discharge summaries
 * TODO: Replace with real templates from frontend
 */

const SECTION_TEMPLATES = {
  chiefComplaint: {
    template: '${patientAge}-year-old ${patientGender} presenting with ${complaint}',
    required: ['complaint']
  },
  hospitalCourse: {
    template: 'The patient was admitted for ${reason}. ${details}',
    required: ['reason', 'details']
  },
  procedures: {
    template: 'During hospitalization, the following procedures were performed: ${procedures}',
    required: ['procedures']
  },
  medications: {
    template: 'Discharge medications: ${medications}',
    required: ['medications']
  },
  followUp: {
    template: 'Follow-up appointments: ${followUp}',
    required: ['followUp']
  },
  instructions: {
    template: 'Discharge instructions: ${instructions}',
    required: ['instructions']
  }
};

const NARRATIVE_TEMPLATES = {
  ...SECTION_TEMPLATES
};

/**
 * Get template by pathology
 * @param {string} pathology - The pathology type
 * @returns {Object} Template object
 */
const getTemplateByPathology = (pathology) => {
  // TODO: Implement pathology-specific templates
  return SECTION_TEMPLATES;
};

module.exports = {
  SECTION_TEMPLATES,
  NARRATIVE_TEMPLATES,
  getTemplateByPathology
};
