/**
 * Local Storage Manager
 * 
 * Centralized localStorage management for application data
 */

const STORAGE_PREFIX = 'dsg_';
const STORAGE_VERSION = '1.0';

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  // Application data
  EXTRACTED_DATA: `${STORAGE_PREFIX}extracted_data`,
  NOTES: `${STORAGE_PREFIX}notes`,
  SUMMARY: `${STORAGE_PREFIX}summary`,
  
  // Settings
  SETTINGS: `${STORAGE_PREFIX}settings`,
  USER_PREFERENCES: `${STORAGE_PREFIX}preferences`,
  
  // Learning data
  LEARNING_HISTORY: `${STORAGE_PREFIX}learning_history`,
  CORRECTIONS: `${STORAGE_PREFIX}corrections`,
  
  // Session data
  SESSION: `${STORAGE_PREFIX}session`,
  LAST_SAVE: `${STORAGE_PREFIX}last_save`
};

/**
 * Save data to localStorage
 */
export const saveData = (key, data) => {
  try {
    const wrappedData = {
      version: STORAGE_VERSION,
      timestamp: Date.now(),
      data
    };
    
    localStorage.setItem(key, JSON.stringify(wrappedData));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    
    if (error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded');
      // Attempt cleanup
      cleanupOldData();
      // Try again
      try {
        localStorage.setItem(key, JSON.stringify({
          version: STORAGE_VERSION,
          timestamp: Date.now(),
          data
        }));
        return true;
      } catch (retryError) {
        console.error('Still quota exceeded after cleanup');
        return false;
      }
    }
    
    return false;
  }
};

/**
 * Load data from localStorage
 */
export const loadData = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    
    if (!item) return defaultValue;
    
    const parsed = JSON.parse(item);
    
    // Check version compatibility
    if (parsed.version !== STORAGE_VERSION) {
      console.warn(`Version mismatch for ${key}. Expected ${STORAGE_VERSION}, got ${parsed.version}`);
      // Could implement migration here
    }
    
    return parsed.data;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};

/**
 * Remove data from localStorage
 */
export const removeData = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing from localStorage:', error);
    return false;
  }
};

/**
 * Check if key exists
 */
export const hasData = (key) => {
  return localStorage.getItem(key) !== null;
};

/**
 * Get all keys with app prefix
 */
export const getAllKeys = () => {
  const keys = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      keys.push(key);
    }
  }
  
  return keys;
};

/**
 * Get storage usage
 */
export const getStorageUsage = () => {
  let totalSize = 0;
  const breakdown = {};
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      const value = localStorage.getItem(key);
      const size = value ? value.length : 0;
      totalSize += size;
      breakdown[key] = size;
    }
  }
  
  return {
    totalSize,
    totalSizeKB: (totalSize / 1024).toFixed(2),
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    breakdown
  };
};

/**
 * Clear all app data
 */
export const clearAllData = () => {
  try {
    const keys = getAllKeys();
    for (const key of keys) {
      localStorage.removeItem(key);
    }
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
};

/**
 * Cleanup old data (older than 30 days)
 */
export const cleanupOldData = (maxAgeDays = 30) => {
  const now = Date.now();
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  
  let cleaned = 0;
  
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    
    if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
    
    try {
      const item = localStorage.getItem(key);
      if (!item) continue;
      
      const parsed = JSON.parse(item);
      
      if (parsed.timestamp && (now - parsed.timestamp) > maxAgeMs) {
        localStorage.removeItem(key);
        cleaned++;
      }
    } catch (error) {
      // If we can't parse it, it might be corrupted, remove it
      localStorage.removeItem(key);
      cleaned++;
    }
  }
  
  console.log(`Cleaned up ${cleaned} old localStorage entries`);
  return cleaned;
};

/**
 * Export all data for backup
 */
export const exportAllData = () => {
  const data = {};
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      data[key] = localStorage.getItem(key);
    }
  }
  
  return {
    exportedAt: new Date().toISOString(),
    version: STORAGE_VERSION,
    data
  };
};

/**
 * Import data from backup
 */
export const importAllData = (backup) => {
  if (!backup || !backup.data) {
    throw new Error('Invalid backup format');
  }
  
  try {
    for (const [key, value] of Object.entries(backup.data)) {
      localStorage.setItem(key, value);
    }
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};

/**
 * Save session data
 */
export const saveSession = (sessionData) => {
  return saveData(STORAGE_KEYS.SESSION, {
    ...sessionData,
    lastActivity: Date.now()
  });
};

/**
 * Load session data
 */
export const loadSession = () => {
  const session = loadData(STORAGE_KEYS.SESSION);
  
  if (!session) return null;
  
  // Check if session is still valid (24 hours)
  const maxSessionAge = 24 * 60 * 60 * 1000;
  if (session.lastActivity && (Date.now() - session.lastActivity) > maxSessionAge) {
    removeData(STORAGE_KEYS.SESSION);
    return null;
  }
  
  return session;
};

/**
 * Update last save timestamp
 */
export const updateLastSave = () => {
  return saveData(STORAGE_KEYS.LAST_SAVE, Date.now());
};

/**
 * Get last save timestamp
 */
export const getLastSave = () => {
  return loadData(STORAGE_KEYS.LAST_SAVE);
};

export default {
  STORAGE_KEYS,
  saveData,
  loadData,
  removeData,
  hasData,
  getAllKeys,
  getStorageUsage,
  clearAllData,
  cleanupOldData,
  exportAllData,
  importAllData,
  saveSession,
  loadSession,
  updateLastSave,
  getLastSave
};
