/**
 * Learning Database Service
 * 
 * Manages IndexedDB for ML learning data storage
 * Used for pattern storage and correction tracking
 */

import { openDB } from 'idb';

const DB_NAME = 'DischargeSummaryLearning';
const DB_VERSION = 1;

// Store names
const STORE_PATTERNS = 'patterns';
const STORE_CORRECTIONS = 'corrections';
const STORE_METRICS = 'metrics';

/**
 * Initialize learning database
 * Creates object stores for patterns, corrections, and metrics
 */
export const initDB = async () => {
  try {
    return await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Patterns store - for learned extraction patterns
        if (!db.objectStoreNames.contains(STORE_PATTERNS)) {
          const patternStore = db.createObjectStore(STORE_PATTERNS, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          patternStore.createIndex('field', 'field');
          patternStore.createIndex('pathology', 'pathology');
          patternStore.createIndex('confidence', 'confidence');
          patternStore.createIndex('timestamp', 'timestamp');
        }

        // Corrections store - for user corrections
        if (!db.objectStoreNames.contains(STORE_CORRECTIONS)) {
          const correctionStore = db.createObjectStore(STORE_CORRECTIONS, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          correctionStore.createIndex('field', 'field');
          correctionStore.createIndex('timestamp', 'timestamp');
          correctionStore.createIndex('correctionType', 'correctionType');
        }

        // Metrics store - for performance tracking
        if (!db.objectStoreNames.contains(STORE_METRICS)) {
          const metricsStore = db.createObjectStore(STORE_METRICS, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          metricsStore.createIndex('metric', 'metric');
          metricsStore.createIndex('timestamp', 'timestamp');
        }
      }
    });
  } catch (error) {
    console.error('Error initializing learning database:', error);
    throw error;
  }
};

/**
 * Get database instance
 */
export const getDB = async () => {
  return await initDB();
};

/**
 * Store a learned pattern
 */
export const storePattern = async (pattern) => {
  const db = await getDB();
  const tx = db.transaction(STORE_PATTERNS, 'readwrite');
  const id = await tx.store.add({
    ...pattern,
    timestamp: Date.now()
  });
  await tx.done;
  return id;
};

/**
 * Get all patterns
 */
export const getAllPatterns = async () => {
  const db = await getDB();
  return await db.getAll(STORE_PATTERNS);
};

/**
 * Get patterns by field
 */
export const getPatternsByField = async (field) => {
  const db = await getDB();
  return await db.getAllFromIndex(STORE_PATTERNS, 'field', field);
};

/**
 * Update pattern
 */
export const updatePattern = async (id, updates) => {
  const db = await getDB();
  const tx = db.transaction(STORE_PATTERNS, 'readwrite');
  const existing = await tx.store.get(id);
  
  if (existing) {
    await tx.store.put({
      ...existing,
      ...updates,
      id,
      lastUpdated: Date.now()
    });
    await tx.done;
  }
};

/**
 * Delete pattern
 */
export const deletePattern = async (id) => {
  const db = await getDB();
  await db.delete(STORE_PATTERNS, id);
};

/**
 * Store correction
 */
export const storeCorrection = async (correction) => {
  const db = await getDB();
  const tx = db.transaction(STORE_CORRECTIONS, 'readwrite');
  const id = await tx.store.add({
    ...correction,
    timestamp: Date.now()
  });
  await tx.done;
  return id;
};

/**
 * Get all corrections
 */
export const getAllCorrections = async () => {
  const db = await getDB();
  return await db.getAll(STORE_CORRECTIONS);
};

/**
 * Get corrections by field
 */
export const getCorrectionsByField = async (field) => {
  const db = await getDB();
  return await db.getAllFromIndex(STORE_CORRECTIONS, 'field', field);
};

/**
 * Store metric
 */
export const storeMetric = async (metric) => {
  const db = await getDB();
  const tx = db.transaction(STORE_METRICS, 'readwrite');
  const id = await tx.store.add({
    ...metric,
    timestamp: Date.now()
  });
  await tx.done;
  return id;
};

/**
 * Get all metrics
 */
export const getAllMetrics = async () => {
  const db = await getDB();
  return await db.getAll(STORE_METRICS);
};

/**
 * Clear all data from a store
 */
export const clearStore = async (storeName) => {
  const db = await getDB();
  const tx = db.transaction(storeName, 'readwrite');
  await tx.store.clear();
  await tx.done;
};

/**
 * Clear all learning data
 */
export const clearAllData = async () => {
  await clearStore(STORE_PATTERNS);
  await clearStore(STORE_CORRECTIONS);
  await clearStore(STORE_METRICS);
};

/**
 * Export all learning data
 */
export const exportLearningData = async () => {
  const patterns = await getAllPatterns();
  const corrections = await getAllCorrections();
  const metrics = await getAllMetrics();

  return {
    exportedAt: new Date().toISOString(),
    version: DB_VERSION,
    patterns,
    corrections,
    metrics
  };
};

/**
 * Import learning data
 */
export const importLearningData = async (data) => {
  if (!data || !data.patterns) {
    throw new Error('Invalid import data format');
  }

  const db = await getDB();

  // Import patterns
  if (data.patterns && data.patterns.length > 0) {
    const tx = db.transaction(STORE_PATTERNS, 'readwrite');
    for (const pattern of data.patterns) {
      delete pattern.id; // Let it auto-generate
      await tx.store.add(pattern);
    }
    await tx.done;
  }

  // Import corrections
  if (data.corrections && data.corrections.length > 0) {
    const tx = db.transaction(STORE_CORRECTIONS, 'readwrite');
    for (const correction of data.corrections) {
      delete correction.id;
      await tx.store.add(correction);
    }
    await tx.done;
  }

  // Import metrics
  if (data.metrics && data.metrics.length > 0) {
    const tx = db.transaction(STORE_METRICS, 'readwrite');
    for (const metric of data.metrics) {
      delete metric.id;
      await tx.store.add(metric);
    }
    await tx.done;
  }
};

export default {
  initDB,
  getDB,
  storePattern,
  getAllPatterns,
  getPatternsByField,
  updatePattern,
  deletePattern,
  storeCorrection,
  getAllCorrections,
  getCorrectionsByField,
  storeMetric,
  getAllMetrics,
  clearStore,
  clearAllData,
  exportLearningData,
  importLearningData
};
