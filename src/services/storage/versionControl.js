/**
 * Version Control Service
 * 
 * Manages versioning for learned patterns and extraction rules
 * Allows rollback and comparison between versions
 */

/**
 * Create a new version of a pattern
 */
export const versionPattern = (pattern) => {
  const currentVersion = pattern.version || 0;
  
  return {
    ...pattern,
    version: currentVersion + 1,
    timestamp: Date.now(),
    previousVersion: currentVersion,
    versionHistory: [
      ...(pattern.versionHistory || []),
      {
        version: currentVersion,
        timestamp: pattern.timestamp || Date.now(),
        snapshot: { ...pattern }
      }
    ].slice(-10) // Keep last 10 versions
  };
};

/**
 * Compare two pattern versions
 */
export const compareVersions = (oldPattern, newPattern) => {
  const changes = {
    version: {
      old: oldPattern.version,
      new: newPattern.version
    },
    modifications: []
  };

  // Compare pattern fields
  const keys = new Set([...Object.keys(oldPattern), ...Object.keys(newPattern)]);
  
  for (const key of keys) {
    if (key === 'version' || key === 'timestamp' || key === 'versionHistory') {
      continue; // Skip meta fields
    }

    const oldValue = oldPattern[key];
    const newValue = newPattern[key];

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.modifications.push({
        field: key,
        oldValue,
        newValue,
        type: !oldValue ? 'added' : !newValue ? 'removed' : 'modified'
      });
    }
  }

  return changes;
};

/**
 * Rollback to a specific version
 */
export const rollbackToVersion = (pattern, targetVersion) => {
  if (!pattern.versionHistory || pattern.versionHistory.length === 0) {
    throw new Error('No version history available');
  }

  const versionSnapshot = pattern.versionHistory.find(
    v => v.version === targetVersion
  );

  if (!versionSnapshot) {
    throw new Error(`Version ${targetVersion} not found in history`);
  }

  return {
    ...versionSnapshot.snapshot,
    version: pattern.version + 1, // Create new version from rollback
    timestamp: Date.now(),
    rolledBackFrom: pattern.version,
    versionHistory: pattern.versionHistory
  };
};

/**
 * Get version history summary
 */
export const getVersionHistory = (pattern) => {
  if (!pattern.versionHistory) {
    return [{
      version: pattern.version || 0,
      timestamp: pattern.timestamp || Date.now(),
      isCurrent: true
    }];
  }

  return [
    ...pattern.versionHistory.map(v => ({
      version: v.version,
      timestamp: v.timestamp,
      isCurrent: false
    })),
    {
      version: pattern.version,
      timestamp: pattern.timestamp,
      isCurrent: true
    }
  ];
};

/**
 * Create a snapshot of current state
 */
export const createSnapshot = (pattern) => {
  return {
    version: pattern.version,
    timestamp: Date.now(),
    snapshot: { ...pattern }
  };
};

/**
 * Merge version changes
 */
export const mergeVersions = (basePattern, changes) => {
  return {
    ...basePattern,
    ...changes,
    version: (basePattern.version || 0) + 1,
    timestamp: Date.now(),
    mergedFrom: {
      baseVersion: basePattern.version,
      changes: Object.keys(changes)
    }
  };
};

/**
 * Calculate version difference score
 * Returns a score (0-1) indicating how different versions are
 */
export const calculateVersionDifference = (v1, v2) => {
  const changes = compareVersions(v1, v2);
  
  if (changes.modifications.length === 0) {
    return 0; // Identical
  }

  // Count total fields
  const totalFields = new Set([
    ...Object.keys(v1),
    ...Object.keys(v2)
  ]).size;

  // Difference ratio
  return changes.modifications.length / totalFields;
};

/**
 * Check if version is compatible
 */
export const isVersionCompatible = (pattern, minVersion = 0) => {
  const currentVersion = pattern.version || 0;
  return currentVersion >= minVersion;
};

/**
 * Get latest stable version
 */
export const getLatestStableVersion = (versionHistory) => {
  if (!versionHistory || versionHistory.length === 0) {
    return null;
  }

  // Find the latest version marked as stable
  const stableVersions = versionHistory.filter(v => v.snapshot?.stable);
  
  if (stableVersions.length === 0) {
    return versionHistory[versionHistory.length - 1]; // Return latest
  }

  return stableVersions[stableVersions.length - 1];
};

/**
 * Mark version as stable
 */
export const markAsStable = (pattern) => {
  return {
    ...pattern,
    stable: true,
    stableTimestamp: Date.now()
  };
};

/**
 * Create version metadata
 */
export const createVersionMetadata = (pattern, metadata = {}) => {
  return {
    ...pattern,
    metadata: {
      ...(pattern.metadata || {}),
      ...metadata,
      lastModified: Date.now()
    }
  };
};

export default {
  versionPattern,
  compareVersions,
  rollbackToVersion,
  getVersionHistory,
  createSnapshot,
  mergeVersions,
  calculateVersionDifference,
  isVersionCompatible,
  getLatestStableVersion,
  markAsStable,
  createVersionMetadata
};
