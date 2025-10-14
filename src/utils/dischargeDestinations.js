/**
 * Discharge Destinations Classification
 * 
 * Comprehensive discharge destination detection and categorization
 */

/**
 * Discharge destination categories
 */
export const DISCHARGE_DESTINATIONS = {
  HOME: {
    key: 'home',
    label: 'Home',
    description: 'Independent living at home',
    patterns: [
      /\bdischarged\s+(?:to\s+)?home\b/i,
      /\bsent\s+home\b/i,
      /\bhome\s+discharge\b/i,
      /\bgoing\s+home\b/i,
      /\breturn(?:ed|ing)?\s+home\b/i,
      /\bdischarge\s+destination:\s*home\b/i
    ],
    priority: 1,
    independence: 'high'
  },
  
  HOME_WITH_SERVICES: {
    key: 'home_with_services',
    label: 'Home with Services',
    description: 'Home with home health, VNA, or visiting nursing',
    patterns: [
      /home\s+with\s+(?:home\s+health|VNA|visiting\s+nurse|services)/i,
      /home\s+with\s+home\s+care/i,
      /home\s+health\s+services/i,
      /VNA\s+(?:services|arranged)/i
    ],
    priority: 2,
    independence: 'moderate-high'
  },
  
  REHABILITATION: {
    key: 'rehabilitation',
    label: 'Rehabilitation Facility',
    description: 'Acute inpatient rehabilitation',
    patterns: [
      /\brehab(?:ilitation)?\s+(?:facility|center|hospital)\b/i,
      /\binpatient\s+rehab(?:ilitation)?\b/i,
      /\bacute\s+rehab(?:ilitation)?\b/i,
      /\bIRF\b/,
      /\btransfer(?:red)?\s+to\s+rehab(?:ilitation)?\b/i,
      /\bdischarge(?:d)?\s+to\s+rehab(?:ilitation)?\b/i
    ],
    priority: 3,
    independence: 'moderate'
  },
  
  SKILLED_NURSING: {
    key: 'skilled_nursing',
    label: 'Skilled Nursing Facility',
    description: 'SNF or subacute rehabilitation',
    patterns: [
      /\bSNF\b/,
      /\bskilled\s+nursing\s+facility\b/i,
      /\bsubacute\s+rehab(?:ilitation)?\b/i,
      /\bnursing\s+home\b/i
    ],
    priority: 4,
    independence: 'moderate-low'
  },
  
  LONG_TERM_CARE: {
    key: 'long_term_care',
    label: 'Long-Term Care',
    description: 'LTC or extended care facility',
    patterns: [
      /\bLTC\b/,
      /\blong[- ]term\s+care\b/i,
      /\bextended\s+care\s+facility\b/i,
      /\bECF\b/
    ],
    priority: 5,
    independence: 'low'
  },
  
  LTAC: {
    key: 'ltac',
    label: 'Long-Term Acute Care',
    description: 'LTAC hospital',
    patterns: [
      /\bLTAC\b/,
      /\blong[- ]term\s+acute\s+care\b/i,
      /\bLTACH\b/
    ],
    priority: 6,
    independence: 'low'
  },
  
  SATELLITE_CARE: {
    key: 'satellite_care',
    label: 'Satellite Care',
    description: 'Transfer to peripheral hospital for continued care',
    patterns: [
      /\bsatellite\s+(?:care|hospital)\b/i,
      /\btransfer(?:red)?\s+to\s+(?:peripheral|outside|local)\s+hospital\b/i,
      /\bcloser\s+to\s+home\s+hospital\b/i,
      /\bcontinued\s+care\s+at\s+(?:peripheral|local)\b/i
    ],
    priority: 7,
    independence: 'varies'
  },
  
  REPATRIATION: {
    key: 'repatriation',
    label: 'Repatriation',
    description: 'Return to home country or region for continued care',
    patterns: [
      /\brepatriation\b/i,
      /\brepatriate(?:d)?\b/i,
      /\bhome\s+hospital\b/i,
      /\breturn(?:ed|ing)?\s+to\s+home\s+(?:country|region)\b/i,
      /\btransfer(?:red)?\s+to\s+home\s+(?:country|hospital)\b/i
    ],
    priority: 8,
    independence: 'varies'
  },
  
  HOSPICE: {
    key: 'hospice',
    label: 'Hospice Care',
    description: 'End-of-life palliative care',
    patterns: [
      /\bhospice\b/i,
      /\bpalliative\s+care\s+(?:facility|program)\b/i,
      /\bend[- ]of[- ]life\s+care\b/i,
      /\bcomfort\s+measures\s+only\b/i,
      /\bCMO\b/
    ],
    priority: 9,
    independence: 'low'
  },
  
  DECEASED: {
    key: 'deceased',
    label: 'Deceased',
    description: 'Patient expired during hospitalization',
    patterns: [
      /\bdeceased\b/i,
      /\bdied\b/i,
      /\bdeath\b/i,
      /\bexpired\b/i,
      /\bpassed\s+away\b/i,
      /\bdemise\b/i,
      /\bmortality\b/i,
      /\bcode\s+(?:blue|black)\b/i,
      /\bdiscontinued\s+life\s+support\b/i,
      /\bwithdrawal\s+of\s+care\b/i
    ],
    priority: 10,
    independence: 'n/a'
  },
  
  OTHER_HOSPITAL: {
    key: 'other_hospital',
    label: 'Transfer to Another Hospital',
    description: 'Transfer to another acute care hospital',
    patterns: [
      /\btransfer(?:red)?\s+to\s+(?:another|different|outside)\s+hospital\b/i,
      /\bhigher\s+level\s+of\s+care\b/i,
      /\btransfer\s+for\s+(?:further|continued)\s+management\b/i
    ],
    priority: 11,
    independence: 'varies'
  }
};

/**
 * Extract discharge destination from text
 */
export const extractDischargeDestination = (text) => {
  if (!text) return null;
  
  const lowerText = text.toLowerCase();
  const matches = [];
  
  // Check each destination type
  for (const [key, destination] of Object.entries(DISCHARGE_DESTINATIONS)) {
    for (const pattern of destination.patterns) {
      if (pattern.test(text)) {
        matches.push({
          destination: destination.key,
          label: destination.label,
          description: destination.description,
          independence: destination.independence,
          priority: destination.priority,
          matchedPattern: pattern.source,
          context: extractContext(text, pattern)
        });
        break; // Found match for this destination, move to next
      }
    }
  }
  
  // Sort by priority and return best match
  if (matches.length === 0) return null;
  
  matches.sort((a, b) => a.priority - b.priority);
  
  return {
    primary: matches[0],
    alternatives: matches.slice(1),
    confidence: calculateConfidence(matches[0], text)
  };
};

/**
 * Extract context around matched pattern
 */
const extractContext = (text, pattern) => {
  const match = text.match(pattern);
  if (!match) return '';
  
  const matchIndex = match.index;
  const contextStart = Math.max(0, matchIndex - 100);
  const contextEnd = Math.min(text.length, matchIndex + match[0].length + 100);
  
  return text.substring(contextStart, contextEnd).trim();
};

/**
 * Calculate confidence score
 */
const calculateConfidence = (match, text) => {
  let confidence = 0.7; // Base confidence
  
  // Increase confidence if explicit discharge section
  if (/discharge\s+(?:destination|status|plan)/i.test(text)) {
    confidence += 0.2;
  }
  
  // Increase confidence if date mentioned
  if (/discharge(?:d)?\s+on\s+\d{1,2}[-/]\d{1,2}/i.test(text)) {
    confidence += 0.1;
  }
  
  return Math.min(confidence, 0.99);
};

/**
 * Format destination for display
 */
export const formatDestination = (destination) => {
  if (!destination) return 'Not documented';
  
  let formatted = `${destination.primary.label}`;
  
  if (destination.primary.description) {
    formatted += `\n${destination.primary.description}`;
  }
  
  if (destination.alternatives.length > 0) {
    formatted += '\n\nPossible alternatives:';
    for (const alt of destination.alternatives) {
      formatted += `\n- ${alt.label}`;
    }
  }
  
  return formatted;
};

/**
 * Get discharge planning recommendations based on destination
 */
export const getDischargeRecommendations = (destinationKey) => {
  const recommendations = {
    home: [
      'Ensure patient has adequate support at home',
      'Provide clear discharge instructions',
      'Arrange follow-up appointments',
      'Ensure medication reconciliation'
    ],
    home_with_services: [
      'Arrange VNA or home health services',
      'Coordinate PT/OT if needed',
      'Ensure DME (durable medical equipment) available',
      'Medication management plan'
    ],
    rehabilitation: [
      'Complete rehab screening',
      'Arrange insurance authorization',
      'Coordinate transfer with rehab facility',
      'Provide comprehensive medical summary'
    ],
    skilled_nursing: [
      'SNF screening and placement',
      'Insurance authorization',
      'Medication list and care plan',
      'Contact information for family'
    ],
    long_term_care: [
      'LTC placement coordination',
      'Long-term care planning',
      'Guardian/POA documentation',
      'Chronic care management plan'
    ],
    satellite_care: [
      'Coordinate transfer with accepting facility',
      'Provide complete medical records',
      'Ensure accepting physician identified',
      'Transfer summary with pending issues'
    ],
    repatriation: [
      'International transfer coordination',
      'Complete medical documentation',
      'Medication supply for travel',
      'Emergency contact information'
    ],
    hospice: [
      'Goals of care documentation',
      'DNR/DNI status confirmation',
      'Symptom management plan',
      'Family support services',
      'Hospice referral completed'
    ],
    deceased: [
      'Death certificate',
      'Family notification',
      'Autopsy discussion (if appropriate)',
      'Organ donation discussion (if appropriate)',
      'Funeral arrangements coordination'
    ]
  };
  
  return recommendations[destinationKey] || [];
};

/**
 * Validate destination data completeness
 */
export const validateDischargeData = (destination, extractedData) => {
  const issues = [];
  
  if (!destination) {
    issues.push({
      severity: 'critical',
      message: 'Discharge destination not documented'
    });
    return issues;
  }
  
  // Check for required data based on destination
  switch (destination.primary.destination) {
    case 'home':
    case 'home_with_services':
      if (!extractedData.followUp) {
        issues.push({
          severity: 'high',
          message: 'Follow-up appointments not documented'
        });
      }
      break;
      
    case 'rehabilitation':
    case 'skilled_nursing':
      if (!extractedData.functionalStatus) {
        issues.push({
          severity: 'high',
          message: 'Functional status assessment missing'
        });
      }
      break;
      
    case 'hospice':
      if (!extractedData.goalsOfCare) {
        issues.push({
          severity: 'high',
          message: 'Goals of care discussion not documented'
        });
      }
      break;
  }
  
  return issues;
};

/**
 * Get discharge readiness criteria
 */
export const getDischargeReadinessCriteria = (destinationKey) => {
  const criteria = {
    home: [
      'Medically stable',
      'Adequate pain control',
      'Able to perform ADLs or has adequate support',
      'Understanding of discharge instructions',
      'Follow-up arranged'
    ],
    rehabilitation: [
      'Medically stable',
      'Can tolerate 3 hours of therapy daily',
      'Insurance authorization obtained',
      'Rehab bed available'
    ],
    hospice: [
      'Goals of care aligned with hospice philosophy',
      'Life expectancy < 6 months',
      'DNR/DNI status documented',
      'Family agrees with plan'
    ]
  };
  
  return criteria[destinationKey] || ['Medically stable', 'Appropriate level of care arranged'];
};

export default {
  DISCHARGE_DESTINATIONS,
  extractDischargeDestination,
  formatDestination,
  getDischargeRecommendations,
  validateDischargeData,
  getDischargeReadinessCriteria
};
