/**
 * Debugging Utilities
 * 
 * Tools for debugging and troubleshooting the application
 */

/**
 * Enable debug mode
 */
let debugMode = false;

export const setDebugMode = (enabled) => {
  debugMode = enabled;
  if (enabled) {
    console.log('🐛 Debug mode enabled');
    window.DCS_DEBUG = true;
  } else {
    console.log('Debug mode disabled');
    window.DCS_DEBUG = false;
  }
};

export const isDebugMode = () => debugMode;

/**
 * Debug logger
 */
export const debug = {
  log: (...args) => {
    if (debugMode) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  warn: (...args) => {
    if (debugMode) {
      console.warn('[DEBUG]', ...args);
    }
  },
  
  error: (...args) => {
    if (debugMode) {
      console.error('[DEBUG]', ...args);
    }
  },
  
  table: (data) => {
    if (debugMode) {
      console.table(data);
    }
  },
  
  group: (label) => {
    if (debugMode) {
      console.group(label);
    }
  },
  
  groupEnd: () => {
    if (debugMode) {
      console.groupEnd();
    }
  },
  
  time: (label) => {
    if (debugMode) {
      console.time(label);
    }
  },
  
  timeEnd: (label) => {
    if (debugMode) {
      console.timeEnd(label);
    }
  }
};

/**
 * Performance monitoring
 */
const performanceMarks = {};

export const startMark = (label) => {
  if (debugMode) {
    performanceMarks[label] = performance.now();
    console.log(`⏱️ [${label}] Started`);
  }
};

export const endMark = (label) => {
  if (debugMode && performanceMarks[label]) {
    const duration = performance.now() - performanceMarks[label];
    console.log(`⏱️ [${label}] Completed in ${duration.toFixed(2)}ms`);
    delete performanceMarks[label];
    return duration;
  }
  return 0;
};

/**
 * Memory usage
 */
export const logMemoryUsage = () => {
  if (debugMode && performance.memory) {
    const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
    
    console.log('💾 Memory Usage:', {
      used: `${(usedJSHeapSize / 1048576).toFixed(2)} MB`,
      total: `${(totalJSHeapSize / 1048576).toFixed(2)} MB`,
      limit: `${(jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
      percentage: `${((usedJSHeapSize / jsHeapSizeLimit) * 100).toFixed(2)}%`
    });
  }
};

/**
 * Storage usage
 */
export const logStorageUsage = () => {
  if (debugMode) {
    let totalSize = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      totalSize += value ? value.length : 0;
    }
    
    console.log('💿 LocalStorage Usage:', {
      totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
      items: localStorage.length
    });
  }
};

/**
 * Inspect object
 */
export const inspect = (obj, label = 'Object') => {
  if (debugMode) {
    console.group(`🔍 ${label}`);
    console.log('Type:', typeof obj);
    console.log('Constructor:', obj?.constructor?.name);
    console.log('Keys:', Object.keys(obj || {}));
    console.log('Value:', obj);
    console.groupEnd();
  }
};

/**
 * Function call tracker
 */
const callTracker = {};

export const trackCall = (functionName) => {
  if (debugMode) {
    callTracker[functionName] = (callTracker[functionName] || 0) + 1;
  }
};

export const getCallStats = () => {
  if (debugMode) {
    return { ...callTracker };
  }
  return {};
};

export const resetCallStats = () => {
  Object.keys(callTracker).forEach(key => delete callTracker[key]);
};

/**
 * State snapshot
 */
export const captureSnapshot = (state, label = 'State') => {
  if (debugMode) {
    const snapshot = {
      timestamp: new Date().toISOString(),
      label,
      state: JSON.parse(JSON.stringify(state))
    };
    
    console.log(`📸 Snapshot: ${label}`, snapshot);
    
    // Store in window for debugging
    window.DCS_SNAPSHOTS = window.DCS_SNAPSHOTS || [];
    window.DCS_SNAPSHOTS.push(snapshot);
    
    // Keep only last 10 snapshots
    if (window.DCS_SNAPSHOTS.length > 10) {
      window.DCS_SNAPSHOTS.shift();
    }
    
    return snapshot;
  }
};

/**
 * Compare snapshots
 */
export const compareSnapshots = (snapshot1, snapshot2) => {
  if (debugMode) {
    const differences = [];
    
    const compare = (obj1, obj2, path = '') => {
      const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);
      
      for (const key of keys) {
        const currentPath = path ? `${path}.${key}` : key;
        const val1 = obj1?.[key];
        const val2 = obj2?.[key];
        
        if (JSON.stringify(val1) !== JSON.stringify(val2)) {
          differences.push({
            path: currentPath,
            before: val1,
            after: val2
          });
        }
      }
    };
    
    compare(snapshot1.state, snapshot2.state);
    
    console.log('🔄 Snapshot Differences:', differences);
    return differences;
  }
};

/**
 * Network request monitor
 */
const networkRequests = [];

export const trackNetworkRequest = (request) => {
  if (debugMode) {
    networkRequests.push({
      timestamp: Date.now(),
      ...request
    });
    
    console.log('🌐 Network Request:', request);
  }
};

export const getNetworkRequests = () => {
  return [...networkRequests];
};

export const clearNetworkRequests = () => {
  networkRequests.length = 0;
};

/**
 * Component render tracker
 */
const renderCounts = {};

export const trackRender = (componentName) => {
  if (debugMode) {
    renderCounts[componentName] = (renderCounts[componentName] || 0) + 1;
    
    if (renderCounts[componentName] > 10) {
      console.warn(`⚠️ Component ${componentName} has rendered ${renderCounts[componentName]} times`);
    }
  }
};

export const getRenderCounts = () => {
  return { ...renderCounts };
};

export const resetRenderCounts = () => {
  Object.keys(renderCounts).forEach(key => delete renderCounts[key]);
};

/**
 * Print system info
 */
export const printSystemInfo = () => {
  console.group('🖥️ System Information');
  console.log('User Agent:', navigator.userAgent);
  console.log('Platform:', navigator.platform);
  console.log('Language:', navigator.language);
  console.log('Online:', navigator.onLine);
  console.log('Cookies Enabled:', navigator.cookieEnabled);
  console.log('Screen:', `${screen.width}x${screen.height}`);
  console.log('Viewport:', `${window.innerWidth}x${window.innerHeight}`);
  console.groupEnd();
  
  logMemoryUsage();
  logStorageUsage();
};

/**
 * Export debug data
 */
export const exportDebugData = () => {
  return {
    timestamp: new Date().toISOString(),
    callStats: getCallStats(),
    renderCounts: getRenderCounts(),
    networkRequests: getNetworkRequests(),
    snapshots: window.DCS_SNAPSHOTS || [],
    errors: JSON.parse(localStorage.getItem('dsg_errors') || '[]'),
    systemInfo: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      online: navigator.onLine
    }
  };
};

/**
 * Enable all debugging features
 */
export const enableFullDebug = () => {
  setDebugMode(true);
  printSystemInfo();
  
  // Expose to window for console access
  window.DCS_DEBUG_UTILS = {
    debug,
    startMark,
    endMark,
    inspect,
    captureSnapshot,
    compareSnapshots,
    getCallStats,
    getRenderCounts,
    getNetworkRequests,
    exportDebugData,
    printSystemInfo
  };
  
  console.log('✅ Full debug mode enabled. Access utilities via window.DCS_DEBUG_UTILS');
};

export default {
  setDebugMode,
  isDebugMode,
  debug,
  startMark,
  endMark,
  logMemoryUsage,
  logStorageUsage,
  inspect,
  trackCall,
  getCallStats,
  resetCallStats,
  captureSnapshot,
  compareSnapshots,
  trackNetworkRequest,
  getNetworkRequests,
  clearNetworkRequests,
  trackRender,
  getRenderCounts,
  resetRenderCounts,
  printSystemInfo,
  exportDebugData,
  enableFullDebug
};
