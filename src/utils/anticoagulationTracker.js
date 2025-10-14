/**
 * Anticoagulation Tracker
 * 
 * CRITICAL for all hemorrhagic pathologies (SAH, TBI, cSDH)
 * Extracts and tracks blood thinner status
 */

/**
 * Comprehensive anticoagulation medications
 */
export const ANTICOAGULANTS = {
  // Antiplatelet agents
  ASPIRIN: {
    names: ['ASA', 'aspirin', 'acetylsalicylic acid', 'Ecotrin', 'Bayer'],
    type: 'antiplatelet',
    class: 'COX inhibitor',
    reversal: 'platelet transfusion',
    critical: true
  },
  CLOPIDOGREL: {
    names: ['Plavix', 'clopidogrel'],
    type: 'antiplatelet',
    class: 'P2Y12 inhibitor',
    reversal: 'platelet transfusion',
    critical: true
  },
  TICAGRELOR: {
    names: ['Brilinta', 'ticagrelor'],
    type: 'antiplatelet',
    class: 'P2Y12 inhibitor',
    reversal: 'platelet transfusion',
    critical: true
  },
  PRASUGREL: {
    names: ['Effient', 'prasugrel'],
    type: 'antiplatelet',
    class: 'P2Y12 inhibitor',
    reversal: 'platelet transfusion',
    critical: true
  },
  
  // Vitamin K antagonists
  WARFARIN: {
    names: ['Coumadin', 'warfarin', 'Jantoven'],
    type: 'anticoagulant',
    class: 'vitamin K antagonist',
    reversal: 'vitamin K, PCC, FFP',
    critical: true
  },
  
  // Direct oral anticoagulants (DOACs)
  APIXABAN: {
    names: ['Eliquis', 'apixaban'],
    type: 'anticoagulant',
    class: 'factor Xa inhibitor',
    reversal: 'andexanet alfa, PCC',
    critical: true
  },
  RIVAROXABAN: {
    names: ['Xarelto', 'rivaroxaban'],
    type: 'anticoagulant',
    class: 'factor Xa inhibitor',
    reversal: 'andexanet alfa, PCC',
    critical: true
  },
  EDOXABAN: {
    names: ['Savaysa', 'edoxaban'],
    type: 'anticoagulant',
    class: 'factor Xa inhibitor',
    reversal: 'andexanet alfa, PCC',
    critical: true
  },
  DABIGATRAN: {
    names: ['Pradaxa', 'dabigatran'],
    type: 'anticoagulant',
    class: 'direct thrombin inhibitor',
    reversal: 'idarucizumab',
    critical: true
  },
  
  // Heparins
  HEPARIN: {
    names: ['heparin', 'UFH', 'unfractionated heparin'],
    type: 'anticoagulant',
    class: 'heparin',
    reversal: 'protamine',
    critical: true
  },
  ENOXAPARIN: {
    names: ['Lovenox', 'enoxaparin', 'LMWH'],
    type: 'anticoagulant',
    class: 'low molecular weight heparin',
    reversal: 'protamine (partial)',
    critical: true
  }
};

/**
 * Extract anticoagulation status from text
 */
export const extractAnticoagulation = (text) => {
  if (!text) return { found: [], status: 'unknown' };
  
  const found = [];
  const lowerText = text.toLowerCase();
  
  for (const [drug, details] of Object.entries(ANTICOAGULANTS)) {
    for (const name of details.names) {
      // Check for medication name with word boundaries
      const regex = new RegExp(`\\b${name}\\b`, 'i');
      
      if (regex.test(text)) {
        // Check if it's a current medication or discontinued
        const isCurrent = checkIfCurrent(text, name);
        const isHeld = checkIfHeld(text, name);
        const isReversed = checkIfReversed(text, name);
        
        found.push({
          medication: drug,
          brandName: details.names[0],
          type: details.type,
          class: details.class,
          reversal: details.reversal,
          status: isReversed ? 'reversed' : isHeld ? 'held' : isCurrent ? 'current' : 'discontinued',
          context: extractContext(text, name)
        });
        
        break; // Found one name for this drug, move to next
      }
    }
  }
  
  return {
    found,
    hasAnticoagulation: found.length > 0,
    hasCurrentAnticoagulation: found.some(f => f.status === 'current'),
    hasReversed: found.some(f => f.status === 'reversed'),
    riskLevel: calculateRiskLevel(found)
  };
};

/**
 * Check if medication is current
 */
const checkIfCurrent = (text, medication) => {
  const lowerText = text.toLowerCase();
  const lowerMed = medication.toLowerCase();
  
  // Patterns indicating current use
  const currentPatterns = [
    `takes ${lowerMed}`,
    `taking ${lowerMed}`,
    `on ${lowerMed}`,
    `continues ${lowerMed}`,
    `continued ${lowerMed}`,
    `prescribed ${lowerMed}`,
    `home medications.*${lowerMed}`,
    `current medications.*${lowerMed}`
  ];
  
  // Patterns indicating not current
  const notCurrentPatterns = [
    `discontinued ${lowerMed}`,
    `stopped ${lowerMed}`,
    `held ${lowerMed}`,
    `not on ${lowerMed}`,
    `no ${lowerMed}`,
    `denies ${lowerMed}`
  ];
  
  // Check for discontinued first
  for (const pattern of notCurrentPatterns) {
    if (lowerText.includes(pattern)) {
      return false;
    }
  }
  
  // Check for current
  for (const pattern of currentPatterns) {
    if (lowerText.includes(pattern)) {
      return true;
    }
  }
  
  // Default: assume current if mentioned
  return true;
};

/**
 * Check if medication is held
 */
const checkIfHeld = (text, medication) => {
  const lowerText = text.toLowerCase();
  const lowerMed = medication.toLowerCase();
  
  const heldPatterns = [
    `held ${lowerMed}`,
    `holding ${lowerMed}`,
    `${lowerMed} held`,
    `${lowerMed} was held`,
    `stopped ${lowerMed}`,
    `withhold ${lowerMed}`
  ];
  
  return heldPatterns.some(pattern => lowerText.includes(pattern));
};

/**
 * Check if anticoagulation was reversed
 */
const checkIfReversed = (text, medication) => {
  const lowerText = text.toLowerCase();
  
  const reversalPatterns = [
    'reversed',
    'reversal',
    'vitamin K',
    'PCC',
    'prothrombin complex',
    'FFP',
    'fresh frozen plasma',
    'protamine',
    'andexanet',
    'idarucizumab',
    'platelet transfusion'
  ];
  
  // Check if reversal agents mentioned near medication
  const medIndex = lowerText.indexOf(medication.toLowerCase());
  if (medIndex === -1) return false;
  
  // Check 200 characters before and after
  const contextStart = Math.max(0, medIndex - 200);
  const contextEnd = Math.min(lowerText.length, medIndex + 200);
  const context = lowerText.substring(contextStart, contextEnd);
  
  return reversalPatterns.some(pattern => context.includes(pattern));
};

/**
 * Extract context around medication mention
 */
const extractContext = (text, medication) => {
  const lowerText = text.toLowerCase();
  const medIndex = lowerText.indexOf(medication.toLowerCase());
  
  if (medIndex === -1) return '';
  
  // Extract 100 characters before and after
  const contextStart = Math.max(0, medIndex - 100);
  const contextEnd = Math.min(text.length, medIndex + medication.length + 100);
  
  return text.substring(contextStart, contextEnd).trim();
};

/**
 * Calculate risk level based on anticoagulation status
 */
const calculateRiskLevel = (found) => {
  if (found.length === 0) return 'none';
  
  const hasMultiple = found.length > 1;
  const hasCurrent = found.some(f => f.status === 'current');
  const hasReversed = found.some(f => f.status === 'reversed');
  
  if (hasMultiple && hasCurrent) return 'critical';
  if (hasCurrent) return 'high';
  if (hasReversed) return 'moderate';
  return 'low';
};

/**
 * Format anticoagulation status for display
 */
export const formatAnticoagulationStatus = (anticoagulation) => {
  if (!anticoagulation.hasAnticoagulation) {
    return 'No anticoagulation documented';
  }
  
  const lines = [];
  
  for (const med of anticoagulation.found) {
    const statusEmoji = {
      'current': '🔴',
      'held': '🟡',
      'reversed': '🟢',
      'discontinued': '⚪'
    }[med.status] || '';
    
    lines.push(`${statusEmoji} ${med.brandName} (${med.class}) - ${med.status.toUpperCase()}`);
  }
  
  return lines.join('\n');
};

/**
 * Get reversal recommendations
 */
export const getReversalRecommendations = (anticoagulation) => {
  if (!anticoagulation.hasCurrentAnticoagulation) {
    return null;
  }
  
  const recommendations = [];
  
  for (const med of anticoagulation.found) {
    if (med.status === 'current') {
      recommendations.push({
        medication: med.brandName,
        class: med.class,
        reversal: med.reversal,
        urgency: 'immediate'
      });
    }
  }
  
  return recommendations;
};

/**
 * Check if safe for surgery
 */
export const isSafeForSurgery = (anticoagulation) => {
  if (!anticoagulation.hasAnticoagulation) return true;
  
  // Not safe if has current anticoagulation
  if (anticoagulation.hasCurrentAnticoagulation) return false;
  
  // Safe if all are held or reversed
  return anticoagulation.found.every(med => 
    ['held', 'reversed', 'discontinued'].includes(med.status)
  );
};

export default {
  ANTICOAGULANTS,
  extractAnticoagulation,
  formatAnticoagulationStatus,
  getReversalRecommendations,
  isSafeForSurgery
};
