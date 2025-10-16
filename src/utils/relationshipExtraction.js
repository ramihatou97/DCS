/**
 * Clinical Relationship Extraction
 * 
 * Phase 2 Step 4: Extracts clinical relationships from text
 * 
 * Purpose:
 * - Extract cause-effect relationships (SAH → vasospasm)
 * - Extract treatment-outcome relationships (nimodipine → no vasospasm)
 * - Extract temporal relationships (POD 3 → complication)
 * - Extract contraindication relationships (anticoagulation contraindicated due to hemorrhage)
 * - Extract indication relationships (hydrocephalus → EVD placement)
 * 
 * @module relationshipExtraction
 */

/**
 * Relationship types
 */
export const RELATIONSHIP_TYPES = {
  CAUSE_EFFECT: 'CAUSE_EFFECT',           // Event A caused Event B
  TREATMENT_OUTCOME: 'TREATMENT_OUTCOME', // Treatment A led to Outcome B
  TEMPORAL: 'TEMPORAL',                   // Event A occurred before/after Event B
  CONTRAINDICATION: 'CONTRAINDICATION',   // Treatment A contraindicated due to Condition B
  INDICATION: 'INDICATION',               // Condition A indicates Treatment B
  COMPLICATION: 'COMPLICATION',           // Procedure A complicated by Event B
  PREVENTION: 'PREVENTION'                // Treatment A prevented Complication B
};

/**
 * Cause-effect patterns
 */
const CAUSE_EFFECT_PATTERNS = [
  // Direct causation
  /(.+?)\s+(?:caused|led to|resulted in)\s+(.+?)(?:\.|,|;|\n)/gi,
  /(?:due to|secondary to|because of|as a result of)\s+(.+?),\s+(.+?)(?:\.|,|;|\n)/gi,
  /(.+?)\s+(?:complicated by)\s+(.+?)(?:\.|,|;|\n)/gi,
  /(.+?)\s+(?:precipitated|triggered)\s+(.+?)(?:\.|,|;|\n)/gi,
  
  // Specific medical causation
  /(?:SAH|subarachnoid hemorrhage)\s+(?:caused|led to|resulted in)\s+(.+?)(?:\.|,|;|\n)/gi,
  /(?:vasospasm|cerebral vasospasm)\s+(?:due to|secondary to)\s+(.+?)(?:\.|,|;|\n)/gi,
  /(?:hydrocephalus)\s+(?:secondary to|due to)\s+(.+?)(?:\.|,|;|\n)/gi,
  /(?:seizure|seizures)\s+(?:secondary to|due to)\s+(.+?)(?:\.|,|;|\n)/gi
];

/**
 * Treatment-outcome patterns
 */
const TREATMENT_OUTCOME_PATTERNS = [
  // Treatment success
  /(?:treated with|started on|given)\s+(.+?),?\s+(?:with|resulting in|leading to)\s+(.+?)(?:\.|,|;|\n)/gi,
  /(.+?)\s+(?:improved|resolved|stabilized)\s+(?:with|after|following)\s+(.+?)(?:\.|,|;|\n)/gi,
  /(?:following|after)\s+(.+?),\s+(?:patient|pt)\s+(.+?)(?:\.|,|;|\n)/gi,
  
  // Specific treatments
  /(?:nimodipine)\s+(?:for|to prevent)\s+(.+?)(?:\.|,|;|\n)/gi,
  /(?:EVD|ventriculostomy)\s+(?:placed|inserted)\s+(?:for|to treat)\s+(.+?)(?:\.|,|;|\n)/gi,
  /(?:keppra|levetiracetam|phenytoin)\s+(?:for|to prevent)\s+(?:seizure|seizures)/gi
];

/**
 * Contraindication patterns
 */
const CONTRAINDICATION_PATTERNS = [
  /(.+?)\s+(?:contraindicated|held|withheld|avoided)\s+(?:due to|because of|given)\s+(.+?)(?:\.|,|;|\n)/gi,
  /(?:anticoagulation|heparin|warfarin|coumadin)\s+(?:held|withheld|contraindicated)\s+(?:due to|given)\s+(.+?)(?:\.|,|;|\n)/gi,
  /(?:unable to|could not)\s+(?:give|start|initiate)\s+(.+?)\s+(?:due to|because of)\s+(.+?)(?:\.|,|;|\n)/gi
];

/**
 * Indication patterns
 */
const INDICATION_PATTERNS = [
  /(?:given|in setting of|in context of)\s+(.+?),\s+(?:patient|pt)\s+(?:underwent|received|started on)\s+(.+?)(?:\.|,|;|\n)/gi,
  /(?:for|to treat|to address)\s+(.+?),\s+(?:patient|pt)\s+(?:underwent|received|started on)\s+(.+?)(?:\.|,|;|\n)/gi,
  /(.+?)\s+(?:indicated|warranted|necessitated)\s+(.+?)(?:\.|,|;|\n)/gi
];

/**
 * Complication patterns
 */
const COMPLICATION_PATTERNS = [
  /(.+?)\s+(?:complicated by|followed by)\s+(.+?)(?:\.|,|;|\n)/gi,
  /(?:post-?op|postoperative|post-?procedure)\s+(?:course)?\s*(?:complicated by|notable for)\s+(.+?)(?:\.|,|;|\n)/gi,
  /(?:developed|experienced)\s+(.+?)\s+(?:following|after)\s+(.+?)(?:\.|,|;|\n)/gi
];

/**
 * Prevention patterns
 */
const PREVENTION_PATTERNS = [
  /(.+?)\s+(?:to prevent|for prevention of|prophylaxis for)\s+(.+?)(?:\.|,|;|\n)/gi,
  /(?:no|without)\s+(.+?)\s+(?:despite|with)\s+(.+?)(?:\.|,|;|\n)/gi,
  /(.+?)\s+(?:prevented|avoided)\s+(?:by|with|through)\s+(.+?)(?:\.|,|;|\n)/gi
];

/**
 * Extract all clinical relationships from text
 * 
 * @param {string} text - Clinical text
 * @param {Object} extractedData - Extracted structured data for context
 * @returns {Array} Array of relationship objects
 */
export function extractClinicalRelationships(text, extractedData = {}) {
  console.log('[Phase 2 Step 4] Extracting clinical relationships...');
  
  const relationships = [];
  
  try {
    // Extract cause-effect relationships
    relationships.push(...extractCauseEffectRelationships(text));
    
    // Extract treatment-outcome relationships
    relationships.push(...extractTreatmentOutcomeRelationships(text, extractedData));
    
    // Extract contraindication relationships
    relationships.push(...extractContraindicationRelationships(text));
    
    // Extract indication relationships
    relationships.push(...extractIndicationRelationships(text));
    
    // Extract complication relationships
    relationships.push(...extractComplicationRelationships(text, extractedData));
    
    // Extract prevention relationships
    relationships.push(...extractPreventionRelationships(text, extractedData));
    
    // Deduplicate relationships
    const deduplicated = deduplicateRelationships(relationships);
    
    console.log(`[Phase 2 Step 4] Extracted ${deduplicated.length} unique relationships`);
    
    return deduplicated;
    
  } catch (error) {
    console.error('[Phase 2 Step 4] Error extracting relationships:', error);
    return [];
  }
}

/**
 * Extract cause-effect relationships
 */
function extractCauseEffectRelationships(text) {
  const relationships = [];
  
  for (const pattern of CAUSE_EFFECT_PATTERNS) {
    let match;
    pattern.lastIndex = 0; // Reset regex
    
    while ((match = pattern.exec(text)) !== null) {
      const cause = cleanRelationshipText(match[1]);
      const effect = cleanRelationshipText(match[2]);
      
      if (cause && effect && cause.length > 3 && effect.length > 3) {
        relationships.push({
          type: RELATIONSHIP_TYPES.CAUSE_EFFECT,
          cause,
          effect,
          confidence: 0.8,
          source: 'pattern',
          rawMatch: match[0]
        });
      }
    }
  }
  
  return relationships;
}

/**
 * Extract treatment-outcome relationships
 */
function extractTreatmentOutcomeRelationships(text, extractedData) {
  const relationships = [];
  
  for (const pattern of TREATMENT_OUTCOME_PATTERNS) {
    let match;
    pattern.lastIndex = 0;
    
    while ((match = pattern.exec(text)) !== null) {
      const treatment = cleanRelationshipText(match[1]);
      const outcome = cleanRelationshipText(match[2]);
      
      if (treatment && outcome && treatment.length > 3 && outcome.length > 3) {
        relationships.push({
          type: RELATIONSHIP_TYPES.TREATMENT_OUTCOME,
          treatment,
          outcome,
          confidence: 0.85,
          source: 'pattern',
          rawMatch: match[0]
        });
      }
    }
  }
  
  return relationships;
}

/**
 * Extract contraindication relationships
 */
function extractContraindicationRelationships(text) {
  const relationships = [];
  
  for (const pattern of CONTRAINDICATION_PATTERNS) {
    let match;
    pattern.lastIndex = 0;
    
    while ((match = pattern.exec(text)) !== null) {
      const treatment = cleanRelationshipText(match[1]);
      const reason = cleanRelationshipText(match[2]);
      
      if (treatment && reason && treatment.length > 3 && reason.length > 3) {
        relationships.push({
          type: RELATIONSHIP_TYPES.CONTRAINDICATION,
          treatment,
          reason,
          confidence: 0.9,
          source: 'pattern',
          rawMatch: match[0]
        });
      }
    }
  }
  
  return relationships;
}

/**
 * Extract indication relationships
 */
function extractIndicationRelationships(text) {
  const relationships = [];
  
  for (const pattern of INDICATION_PATTERNS) {
    let match;
    pattern.lastIndex = 0;
    
    while ((match = pattern.exec(text)) !== null) {
      const indication = cleanRelationshipText(match[1]);
      const treatment = cleanRelationshipText(match[2]);
      
      if (indication && treatment && indication.length > 3 && treatment.length > 3) {
        relationships.push({
          type: RELATIONSHIP_TYPES.INDICATION,
          indication,
          treatment,
          confidence: 0.8,
          source: 'pattern',
          rawMatch: match[0]
        });
      }
    }
  }
  
  return relationships;
}

/**
 * Extract complication relationships
 */
function extractComplicationRelationships(text, extractedData) {
  const relationships = [];
  
  for (const pattern of COMPLICATION_PATTERNS) {
    let match;
    pattern.lastIndex = 0;
    
    while ((match = pattern.exec(text)) !== null) {
      const procedure = cleanRelationshipText(match[1]);
      const complication = cleanRelationshipText(match[2]);
      
      if (procedure && complication && procedure.length > 3 && complication.length > 3) {
        relationships.push({
          type: RELATIONSHIP_TYPES.COMPLICATION,
          procedure,
          complication,
          confidence: 0.85,
          source: 'pattern',
          rawMatch: match[0]
        });
      }
    }
  }
  
  return relationships;
}

/**
 * Extract prevention relationships
 */
function extractPreventionRelationships(text, extractedData) {
  const relationships = [];
  
  for (const pattern of PREVENTION_PATTERNS) {
    let match;
    pattern.lastIndex = 0;
    
    while ((match = pattern.exec(text)) !== null) {
      const treatment = cleanRelationshipText(match[1]);
      const complication = cleanRelationshipText(match[2]);
      
      if (treatment && complication && treatment.length > 3 && complication.length > 3) {
        relationships.push({
          type: RELATIONSHIP_TYPES.PREVENTION,
          treatment,
          complication,
          confidence: 0.75,
          source: 'pattern',
          rawMatch: match[0]
        });
      }
    }
  }
  
  return relationships;
}

/**
 * Clean relationship text
 */
function cleanRelationshipText(text) {
  if (!text) return '';
  
  return text
    .trim()
    .replace(/^(the|a|an)\s+/i, '')
    .replace(/\s+/g, ' ')
    .replace(/[,;]$/, '')
    .trim();
}

/**
 * Deduplicate relationships based on similarity
 */
function deduplicateRelationships(relationships) {
  const unique = [];
  
  for (const rel of relationships) {
    const isDuplicate = unique.some(existing => {
      if (existing.type !== rel.type) return false;
      
      // Check similarity based on relationship type
      switch (rel.type) {
        case RELATIONSHIP_TYPES.CAUSE_EFFECT:
          return areSimilar(existing.cause, rel.cause) && areSimilar(existing.effect, rel.effect);
        case RELATIONSHIP_TYPES.TREATMENT_OUTCOME:
          return areSimilar(existing.treatment, rel.treatment) && areSimilar(existing.outcome, rel.outcome);
        case RELATIONSHIP_TYPES.CONTRAINDICATION:
          return areSimilar(existing.treatment, rel.treatment) && areSimilar(existing.reason, rel.reason);
        case RELATIONSHIP_TYPES.INDICATION:
          return areSimilar(existing.indication, rel.indication) && areSimilar(existing.treatment, rel.treatment);
        case RELATIONSHIP_TYPES.COMPLICATION:
          return areSimilar(existing.procedure, rel.procedure) && areSimilar(existing.complication, rel.complication);
        case RELATIONSHIP_TYPES.PREVENTION:
          return areSimilar(existing.treatment, rel.treatment) && areSimilar(existing.complication, rel.complication);
        default:
          return false;
      }
    });
    
    if (!isDuplicate) {
      unique.push(rel);
    }
  }
  
  return unique;
}

/**
 * Check if two strings are similar (simple similarity check)
 */
function areSimilar(str1, str2) {
  if (!str1 || !str2) return false;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return true;
  
  // One contains the other
  if (s1.includes(s2) || s2.includes(s1)) return true;
  
  return false;
}

export default {
  extractClinicalRelationships,
  RELATIONSHIP_TYPES
};

