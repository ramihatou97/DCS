/**
 * LLM Response Cache Utility
 * 
 * Provides in-memory caching for LLM responses to reduce API calls and costs.
 * Uses node-cache for fast, TTL-based caching.
 * 
 * Features:
 * - Automatic TTL expiration (configurable)
 * - Memory-efficient storage
 * - Cache statistics tracking
 * - Automatic cleanup of expired entries
 */

const NodeCache = require('node-cache');

// Cache configuration from environment or defaults
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 3600; // 1 hour default
const CACHE_MAX_SIZE = parseInt(process.env.CACHE_MAX_SIZE) || 100; // 100 entries default
const CACHE_CHECK_PERIOD = 600; // Check for expired entries every 10 minutes

// Initialize cache
const cache = new NodeCache({
  stdTTL: CACHE_TTL,
  checkperiod: CACHE_CHECK_PERIOD,
  useClones: false, // Don't clone objects for performance
  maxKeys: CACHE_MAX_SIZE
});

// Cache statistics
let stats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0
};

/**
 * Get cached LLM response
 * @param {string} key - Cache key (usually derived from prompt)
 * @returns {any|null} Cached value or null if not found
 */
function getCachedLLMResponse(key) {
  if (!key || typeof key !== 'string') {
    console.warn('[Cache] Invalid cache key provided');
    return null;
  }

  const value = cache.get(key);
  
  if (value !== undefined) {
    stats.hits++;
    console.log(`[Cache] HIT: ${key.substring(0, 50)}... (${stats.hits} total hits)`);
    return value;
  } else {
    stats.misses++;
    console.log(`[Cache] MISS: ${key.substring(0, 50)}... (${stats.misses} total misses)`);
    return null;
  }
}

/**
 * Set cached LLM response
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} [ttl] - Optional custom TTL in seconds
 * @returns {boolean} True if successful
 */
function setCachedLLMResponse(key, value, ttl) {
  if (!key || typeof key !== 'string') {
    console.warn('[Cache] Invalid cache key provided');
    return false;
  }

  if (value === undefined || value === null) {
    console.warn('[Cache] Cannot cache null or undefined value');
    return false;
  }

  const success = cache.set(key, value, ttl || CACHE_TTL);
  
  if (success) {
    stats.sets++;
    console.log(`[Cache] SET: ${key.substring(0, 50)}... (${stats.sets} total sets)`);
  } else {
    console.warn(`[Cache] Failed to set: ${key.substring(0, 50)}...`);
  }

  return success;
}

/**
 * Delete cached LLM response
 * @param {string} key - Cache key to delete
 * @returns {number} Number of deleted entries
 */
function deleteCachedLLMResponse(key) {
  const deleted = cache.del(key);
  
  if (deleted > 0) {
    stats.deletes += deleted;
    console.log(`[Cache] DELETE: ${key.substring(0, 50)}... (${deleted} entries)`);
  }

  return deleted;
}

/**
 * Clear all cached entries
 */
function clearCache() {
  cache.flushAll();
  console.log('[Cache] All entries cleared');
  
  // Reset statistics
  stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0
  };
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
function getCacheStats() {
  const cacheStats = cache.getStats();
  
  return {
    // Our tracked stats
    hits: stats.hits,
    misses: stats.misses,
    sets: stats.sets,
    deletes: stats.deletes,
    hitRate: stats.hits + stats.misses > 0 
      ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2) + '%'
      : '0%',
    
    // Node-cache stats
    keys: cacheStats.keys,
    ksize: cacheStats.ksize,
    vsize: cacheStats.vsize,
    
    // Configuration
    ttl: CACHE_TTL,
    maxSize: CACHE_MAX_SIZE
  };
}

/**
 * Check if cache has a specific key
 * @param {string} key - Cache key to check
 * @returns {boolean} True if key exists
 */
function hasCachedLLMResponse(key) {
  return cache.has(key);
}

/**
 * Get all cache keys
 * @returns {string[]} Array of cache keys
 */
function getCacheKeys() {
  return cache.keys();
}

// Event listeners for monitoring
cache.on('set', (key, value) => {
  // Optional: Add custom logic when items are set
});

cache.on('del', (key, value) => {
  // Optional: Add custom logic when items are deleted
});

cache.on('expired', (key, value) => {
  console.log(`[Cache] EXPIRED: ${key.substring(0, 50)}...`);
});

cache.on('flush', () => {
  console.log('[Cache] Cache flushed');
});

// Export cache functions
module.exports = {
  getCachedLLMResponse,
  setCachedLLMResponse,
  deleteCachedLLMResponse,
  clearCache,
  getCacheStats,
  hasCachedLLMResponse,
  getCacheKeys
};
