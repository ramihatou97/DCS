/**
 * Semantic Deduplication Utility
 * Phase 1 Step 5: Multi-Value Extraction with Temporal Context
 *
 * Purpose:
 * - Deduplicate entities by semantic similarity (not just exact string matching)
 * - "coiling" = "endovascular coiling" = "coil embolization" → 1 procedure
 * - "aspirin" = "ASA" = "acetylsalicylic acid" → 1 medication
 * - Preserve all temporal context and dates during merging
 *
 * Integration:
 * - Used by extractProcedures(), extractComplications(), extractMedications()
 * - Leverages similarityEngine.js for similarity calculations
 * - Works in conjunction with temporalExtraction.js for date preservation
 */

import { calculateCombinedSimilarity } from './ml/similarityEngine.js';

/**
 * Procedure synonym groups for semantic matching
 * Each key is a canonical name, values are synonyms
 */
const PROCEDURE_SYNONYMS = {
  'aneurysm coiling': [
    'coiling',
    'coil embolization',
    'endovascular coiling',
    'aneurysm coiling',
    'coil',
    'coils',
    'embolization of aneurysm'
  ],
  'aneurysm clipping': [
    'clipping',
    'aneurysm clipping',
    'microsurgical clipping',
    'surgical clipping',
    'clip',
    'clips',
    'clip ligation'
  ],
  'craniotomy': [
    'craniotomy',
    'open craniotomy',
    'pterional craniotomy',
    'frontal craniotomy',
    'temporal craniotomy',
    'craniotomy for',
    'crani'
  ],
  'craniectomy': [
    'craniectomy',
    'decompressive craniectomy',
    'hemicraniectomy',
    'decompression',
    'decompressive surgery'
  ],
  'EVD placement': [
    'EVD',
    'EVD placement',
    'external ventricular drain',
    'ventriculostomy',
    'ventricular drain',
    'EVD insertion'
  ],
  'lumbar drain': [
    'lumbar drain',
    'LD',
    'LD placement',
    'lumbar drainage',
    'spinal drain'
  ],
  'VP shunt': [
    'VP shunt',
    'ventriculoperitoneal shunt',
    'shunt',
    'shunt placement',
    'shunt insertion'
  ],
  'tumor resection': [
    'resection',
    'tumor resection',
    'gross total resection',
    'GTR',
    'subtotal resection',
    'STR',
    'debulking'
  ],
  'biopsy': [
    'biopsy',
    'brain biopsy',
    'stereotactic biopsy',
    'needle biopsy'
  ],
  'cranioplasty': [
    'cranioplasty',
    'cranial reconstruction',
    'bone flap replacement',
    'skull repair'
  ],
  'angiography': [
    'angiography',
    'angiogram',
    'DSA',
    'cerebral angiography',
    'digital subtraction angiography'
  ],
  'embolization': [
    'embolization',
    'embolize',
    'embolized',
    'endovascular embolization'
  ]
};

/**
 * Medication synonym groups for semantic matching
 */
const MEDICATION_SYNONYMS = {
  'aspirin': [
    'aspirin',
    'ASA',
    'acetylsalicylic acid',
    'aspirin 81mg',
    'aspirin 325mg'
  ],
  'clopidogrel': [
    'clopidogrel',
    'Plavix',
    'clopidogrel 75mg'
  ],
  'warfarin': [
    'warfarin',
    'Coumadin',
    'warfarin sodium'
  ],
  'apixaban': [
    'apixaban',
    'Eliquis',
    'apixaban 5mg',
    'apixaban 2.5mg'
  ],
  'rivaroxaban': [
    'rivaroxaban',
    'Xarelto',
    'rivaroxaban 20mg'
  ],
  'levetiracetam': [
    'levetiracetam',
    'Keppra',
    'LEV',
    'levetiracetam 500mg',
    'levetiracetam 1000mg'
  ],
  'phenytoin': [
    'phenytoin',
    'Dilantin',
    'PHT',
    'fosphenytoin'
  ],
  'dexamethasone': [
    'dexamethasone',
    'Decadron',
    'dex',
    'dexamethasone 4mg'
  ],
  'mannitol': [
    'mannitol',
    'mannitol 20%',
    'osmotic therapy'
  ],
  'nimodipine': [
    'nimodipine',
    'Nimotop',
    'nimodipine 60mg'
  ],
  'labetalol': [
    'labetalol',
    'Trandate',
    'labetalol IV'
  ],
  'nicardipine': [
    'nicardipine',
    'Cardene',
    'nicardipine drip'
  ],
  'metoprolol': [
    'metoprolol',
    'Lopressor',
    'metoprolol tartrate',
    'metoprolol succinate'
  ],
  'atorvastatin': [
    'atorvastatin',
    'Lipitor',
    'atorvastatin 80mg'
  ],
  'pantoprazole': [
    'pantoprazole',
    'Protonix',
    'PPI',
    'pantoprazole 40mg'
  ]
};

/**
 * Complication synonym groups for semantic matching
 */
const COMPLICATION_SYNONYMS = {
  'vasospasm': [
    'vasospasm',
    'cerebral vasospasm',
    'spasm',
    'arterial narrowing',
    'delayed cerebral ischemia',
    'DCI'
  ],
  'hydrocephalus': [
    'hydrocephalus',
    'ventriculomegaly',
    'enlarged ventricles',
    'obstructive hydrocephalus',
    'communicating hydrocephalus'
  ],
  'seizure': [
    'seizure',
    'seizures',
    'convulsion',
    'epileptic activity',
    'ictal activity'
  ],
  'infection': [
    'infection',
    'meningitis',
    'ventriculitis',
    'wound infection',
    'CNS infection'
  ],
  'hemorrhage': [
    'hemorrhage',
    'bleeding',
    'rebleed',
    'rebleeding',
    'hematoma expansion'
  ],
  'stroke': [
    'stroke',
    'CVA',
    'cerebrovascular accident',
    'infarct',
    'infarction',
    'ischemic stroke'
  ],
  'edema': [
    'edema',
    'cerebral edema',
    'brain swelling',
    'mass effect'
  ]
};

/**
 * Find canonical name for an entity using synonym dictionaries
 *
 * @param {string} name - Entity name to canonicalize
 * @param {string} type - Entity type: 'procedure', 'medication', 'complication'
 * @returns {string} - Canonical name or original name if no match
 */
export const findCanonicalName = (name, type = 'procedure') => {
  const nameLower = name.toLowerCase().trim();

  let synonymDict;
  switch (type) {
    case 'procedure':
      synonymDict = PROCEDURE_SYNONYMS;
      break;
    case 'medication':
      synonymDict = MEDICATION_SYNONYMS;
      break;
    case 'complication':
      synonymDict = COMPLICATION_SYNONYMS;
      break;
    default:
      return name; // Unknown type, return as-is
  }

  // Check if name matches any synonym list
  for (const [canonical, synonyms] of Object.entries(synonymDict)) {
    if (synonyms.some(syn => nameLower.includes(syn.toLowerCase()) || syn.toLowerCase().includes(nameLower))) {
      return canonical;
    }
  }

  return name; // No match, return original
};

/**
 * Check if two procedure names are semantically similar
 * Uses both synonym dictionaries and similarity algorithms
 *
 * @param {string} name1 - First procedure name
 * @param {string} name2 - Second procedure name
 * @param {number} threshold - Similarity threshold (0-1)
 * @returns {boolean} - True if procedures are similar
 */
export const areSimilarProcedures = (name1, name2, threshold = 0.75) => {
  if (!name1 || !name2) return false;

  const n1Lower = name1.toLowerCase().trim();
  const n2Lower = name2.toLowerCase().trim();

  // Exact match
  if (n1Lower === n2Lower) return true;

  // Check synonym dictionary first
  const canonical1 = findCanonicalName(name1, 'procedure');
  const canonical2 = findCanonicalName(name2, 'procedure');

  if (canonical1 === canonical2 && canonical1 !== name1) {
    // Both map to same canonical name (not original)
    return true;
  }

  // Fall back to similarity calculation
  try {
    const similarity = calculateCombinedSimilarity(n1Lower, n2Lower);
    return similarity >= threshold;
  } catch (error) {
    console.warn('Similarity calculation failed:', error);
    return false;
  }
};

/**
 * Check if two medication names are semantically similar
 *
 * @param {string} name1 - First medication name
 * @param {string} name2 - Second medication name
 * @param {number} threshold - Similarity threshold (0-1)
 * @returns {boolean} - True if medications are similar
 */
export const areSimilarMedications = (name1, name2, threshold = 0.75) => {
  if (!name1 || !name2) return false;

  const n1Lower = name1.toLowerCase().trim();
  const n2Lower = name2.toLowerCase().trim();

  if (n1Lower === n2Lower) return true;

  const canonical1 = findCanonicalName(name1, 'medication');
  const canonical2 = findCanonicalName(name2, 'medication');

  if (canonical1 === canonical2 && canonical1 !== name1) {
    return true;
  }

  try {
    const similarity = calculateCombinedSimilarity(n1Lower, n2Lower);
    return similarity >= threshold;
  } catch (error) {
    console.warn('Similarity calculation failed:', error);
    return false;
  }
};

/**
 * Check if two complication names are semantically similar
 *
 * @param {string} name1 - First complication name
 * @param {string} name2 - Second complication name
 * @param {number} threshold - Similarity threshold (0-1)
 * @returns {boolean} - True if complications are similar
 */
export const areSimilarComplications = (name1, name2, threshold = 0.75) => {
  if (!name1 || !name2) return false;

  const n1Lower = name1.toLowerCase().trim();
  const n2Lower = name2.toLowerCase().trim();

  if (n1Lower === n2Lower) return true;

  const canonical1 = findCanonicalName(name1, 'complication');
  const canonical2 = findCanonicalName(name2, 'complication');

  if (canonical1 === canonical2 && canonical1 !== name1) {
    return true;
  }

  try {
    const similarity = calculateCombinedSimilarity(n1Lower, n2Lower);
    return similarity >= threshold;
  } catch (error) {
    console.warn('Similarity calculation failed:', error);
    return false;
  }
};

/**
 * Merge two similar entities while preserving all temporal context
 *
 * Strategy:
 * - Use canonical name as primary name
 * - Preserve all dates (array of dates)
 * - Merge details (concatenate unique details)
 * - Keep higher confidence score
 * - Track original names for reference
 *
 * @param {Object} entity1 - First entity
 * @param {Object} entity2 - Second entity
 * @param {string} type - Entity type for canonical name lookup
 * @returns {Object} - Merged entity
 */
export const mergeSimilarEntities = (entity1, entity2, type = 'procedure') => {
  if (!entity1) return entity2;
  if (!entity2) return entity1;

  // Determine canonical name
  const canonical1 = findCanonicalName(entity1.name, type);
  const canonical2 = findCanonicalName(entity2.name, type);
  const canonicalName = canonical1 !== entity1.name ? canonical1 :
                       canonical2 !== entity2.name ? canonical2 :
                       entity1.name; // Fallback to first entity's name

  // Merge dates (preserve all unique dates)
  const dates = [];

  // Handle single date or array of dates
  const addDate = (date) => {
    if (!date) return;
    if (Array.isArray(date)) {
      dates.push(...date);
    } else {
      dates.push(date);
    }
  };

  addDate(entity1.date);
  addDate(entity2.date);

  // Deduplicate dates (exact match only)
  const uniqueDates = [...new Set(dates.filter(d => d))];

  // Merge details (concatenate unique details)
  const details = [];
  if (entity1.details) details.push(entity1.details);
  if (entity2.details) details.push(entity2.details);
  const uniqueDetails = [...new Set(details.filter(d => d))];

  // Merge temporal contexts (if present)
  const temporalContexts = [];
  if (entity1.temporalContext) temporalContexts.push(entity1.temporalContext);
  if (entity2.temporalContext) temporalContexts.push(entity2.temporalContext);

  // Keep original names for traceability
  const originalNames = [entity1.name, entity2.name];

  return {
    name: canonicalName,
    date: uniqueDates.length === 1 ? uniqueDates[0] : uniqueDates,
    dates: uniqueDates, // Always provide array for multi-value support
    details: uniqueDetails.join('; ') || null,
    confidence: Math.max(entity1.confidence || 0, entity2.confidence || 0),
    temporalContexts: temporalContexts.length > 0 ? temporalContexts : undefined,
    originalNames: originalNames,
    merged: true,
    mergeCount: (entity1.mergeCount || 1) + (entity2.mergeCount || 1)
  };
};

/**
 * Cluster entities by semantic similarity
 * Groups similar entities together without merging them yet
 *
 * @param {Array} entities - Array of entities to cluster
 * @param {string} type - Entity type: 'procedure', 'medication', 'complication'
 * @param {number} threshold - Similarity threshold (0-1)
 * @returns {Array} - Array of clusters, each cluster is an array of similar entities
 */
export const clusterBySimilarity = (entities, type = 'procedure', threshold = 0.75) => {
  if (!entities || entities.length === 0) return [];

  const clusters = [];
  const processed = new Set();

  // Select appropriate similarity function
  let similarityFn;
  switch (type) {
    case 'procedure':
      similarityFn = areSimilarProcedures;
      break;
    case 'medication':
      similarityFn = areSimilarMedications;
      break;
    case 'complication':
      similarityFn = areSimilarComplications;
      break;
    default:
      similarityFn = areSimilarProcedures;
  }

  for (let i = 0; i < entities.length; i++) {
    if (processed.has(i)) continue;

    const cluster = [entities[i]];
    processed.add(i);

    // Find all similar entities
    for (let j = i + 1; j < entities.length; j++) {
      if (processed.has(j)) continue;

      if (similarityFn(entities[i].name, entities[j].name, threshold)) {
        cluster.push(entities[j]);
        processed.add(j);
      }
    }

    clusters.push(cluster);
  }

  return clusters;
};

/**
 * Deduplicate entities by semantic similarity
 * Main function for semantic deduplication
 *
 * Strategy:
 * 1. Cluster entities by semantic similarity
 * 2. Within each cluster, group by date
 * 3. Merge entities with similar names AND same date
 * 4. Preserve entities with different dates (references to same procedure on different days)
 *
 * Example:
 * Input:
 *   - "coiling on 10/1"
 *   - "endovascular coiling on 10/1"
 *   - "coil embolization on 10/3"
 *   - "s/p coiling POD#2" (reference to 10/1 procedure)
 *
 * Output:
 *   - "aneurysm coiling on 10/1" (merged first two)
 *   - "aneurysm coiling on 10/3" (different date, kept separate)
 *   - Reference linked to 10/1 procedure (not separate entry)
 *
 * @param {Array} entities - Array of entities to deduplicate
 * @param {Object} options - Deduplication options
 * @param {string} options.type - Entity type: 'procedure', 'medication', 'complication'
 * @param {number} options.threshold - Similarity threshold (0-1, default 0.75)
 * @param {boolean} options.mergeSameDate - Merge entities with same name AND same date (default true)
 * @param {boolean} options.preserveReferences - Keep references separate (default true)
 * @returns {Array} - Deduplicated entities
 */
export const deduplicateBySemanticSimilarity = (entities, options = {}) => {
  const {
    type = 'procedure',
    threshold = 0.75,
    mergeSameDate = true,
    preserveReferences = true
  } = options;

  if (!entities || entities.length === 0) return [];

  console.log(`[Semantic Dedup] Starting deduplication for ${entities.length} ${type}s...`);

  // STEP 1: Cluster by semantic similarity
  const clusters = clusterBySimilarity(entities, type, threshold);
  console.log(`[Semantic Dedup] Created ${clusters.length} semantic clusters`);

  const deduplicated = [];

  // STEP 2: Process each cluster
  for (const cluster of clusters) {
    if (cluster.length === 1) {
      // Single entity, no deduplication needed
      deduplicated.push(cluster[0]);
      continue;
    }

    console.log(`[Semantic Dedup] Processing cluster with ${cluster.length} entities: ${cluster.map(e => e.name).join(', ')}`);

    // STEP 3: Within cluster, group by date
    const dateGroups = new Map();

    for (const entity of cluster) {
      // Skip references if preserveReferences is enabled
      if (preserveReferences && entity.temporalContext?.isReference) {
        deduplicated.push(entity); // Keep reference as-is
        continue;
      }

      const dateKey = entity.date || 'no_date';

      if (!dateGroups.has(dateKey)) {
        dateGroups.set(dateKey, []);
      }
      dateGroups.get(dateKey).push(entity);
    }

    // STEP 4: Merge within each date group
    for (const [dateKey, group] of dateGroups.entries()) {
      if (!mergeSameDate || group.length === 1) {
        deduplicated.push(...group);
      } else {
        // Merge all entities in this date group
        let merged = group[0];
        for (let i = 1; i < group.length; i++) {
          merged = mergeSimilarEntities(merged, group[i], type);
        }
        deduplicated.push(merged);
        console.log(`[Semantic Dedup] Merged ${group.length} entities on ${dateKey} → "${merged.name}"`);
      }
    }
  }

  console.log(`[Semantic Dedup] Deduplication complete: ${entities.length} → ${deduplicated.length} ${type}s`);

  return deduplicated;
};

/**
 * Get statistics about semantic deduplication
 * Useful for debugging and optimization
 *
 * @param {Array} original - Original entities before deduplication
 * @param {Array} deduplicated - Deduplicated entities
 * @returns {Object} - Statistics object
 */
export const getDeduplicationStats = (original, deduplicated) => {
  const merged = deduplicated.filter(e => e.merged);
  const references = deduplicated.filter(e => e.temporalContext?.isReference);
  const newEvents = deduplicated.filter(e => !e.temporalContext?.isReference);

  return {
    original: original.length,
    deduplicated: deduplicated.length,
    reduction: original.length - deduplicated.length,
    reductionPercent: ((original.length - deduplicated.length) / original.length * 100).toFixed(1),
    merged: merged.length,
    mergedCount: merged.reduce((sum, e) => sum + (e.mergeCount || 1), 0),
    references: references.length,
    newEvents: newEvents.length,
    avgMergeCount: merged.length > 0 ?
      (merged.reduce((sum, e) => sum + (e.mergeCount || 1), 0) / merged.length).toFixed(1) : 0
  };
};

// Export synonym dictionaries for external use
export {
  PROCEDURE_SYNONYMS,
  MEDICATION_SYNONYMS,
  COMPLICATION_SYNONYMS
};
