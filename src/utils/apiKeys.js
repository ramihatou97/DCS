/**
 * API Key Management
 * 
 * Secure storage and retrieval of API keys for LLM services
 */

const API_KEY_STORAGE_PREFIX = 'dsg_api_key_';

/**
 * Supported API providers
 */
export const API_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GEMINI: 'gemini'
};

/**
 * Store API key securely in localStorage
 */
export const storeApiKey = (provider, key) => {
  if (!provider || !key) {
    throw new Error('Provider and key are required');
  }
  
  try {
    const storageKey = `${API_KEY_STORAGE_PREFIX}${provider}`;
    localStorage.setItem(storageKey, btoa(key)); // Simple encoding (not encryption)
    return true;
  } catch (error) {
    console.error('Error storing API key:', error);
    return false;
  }
};

/**
 * Retrieve API key from localStorage
 */
export const getApiKey = (provider) => {
  if (!provider) return null;
  
  try {
    const storageKey = `${API_KEY_STORAGE_PREFIX}${provider}`;
    const encoded = localStorage.getItem(storageKey);
    return encoded ? atob(encoded) : null;
  } catch (error) {
    console.error('Error retrieving API key:', error);
    return null;
  }
};

/**
 * Remove API key from storage
 */
export const removeApiKey = (provider) => {
  if (!provider) return false;
  
  try {
    const storageKey = `${API_KEY_STORAGE_PREFIX}${provider}`;
    localStorage.removeItem(storageKey);
    return true;
  } catch (error) {
    console.error('Error removing API key:', error);
    return false;
  }
};

/**
 * Check if API key exists for provider
 */
export const hasApiKey = (provider) => {
  return getApiKey(provider) !== null;
};

/**
 * Get all configured providers
 */
export const getConfiguredProviders = () => {
  const configured = [];
  
  for (const provider of Object.values(API_PROVIDERS)) {
    if (hasApiKey(provider)) {
      configured.push(provider);
    }
  }
  
  return configured;
};

/**
 * Validate API key format (basic check)
 */
export const validateApiKeyFormat = (provider, key) => {
  if (!key || typeof key !== 'string') return false;
  
  const patterns = {
    [API_PROVIDERS.OPENAI]: /^sk-[A-Za-z0-9]{48,}$/,
    [API_PROVIDERS.ANTHROPIC]: /^sk-ant-[A-Za-z0-9-_]{95,}$/,
    [API_PROVIDERS.GEMINI]: /^[A-Za-z0-9-_]{39}$/
  };
  
  const pattern = patterns[provider];
  return pattern ? pattern.test(key) : key.length > 20; // Fallback check
};

/**
 * Mask API key for display
 */
export const maskApiKey = (key) => {
  if (!key || key.length < 8) return '••••••••';
  
  const visibleStart = key.substring(0, 4);
  const visibleEnd = key.substring(key.length - 4);
  const masked = '•'.repeat(Math.min(key.length - 8, 20));
  
  return `${visibleStart}${masked}${visibleEnd}`;
};

/**
 * Clear all API keys
 */
export const clearAllApiKeys = () => {
  try {
    for (const provider of Object.values(API_PROVIDERS)) {
      removeApiKey(provider);
    }
    return true;
  } catch (error) {
    console.error('Error clearing API keys:', error);
    return false;
  }
};

/**
 * Export API keys (for backup)
 */
export const exportApiKeys = () => {
  const keys = {};
  
  for (const provider of Object.values(API_PROVIDERS)) {
    const key = getApiKey(provider);
    if (key) {
      keys[provider] = key;
    }
  }
  
  return keys;
};

/**
 * Import API keys (from backup)
 */
export const importApiKeys = (keys) => {
  if (!keys || typeof keys !== 'object') return false;
  
  try {
    for (const [provider, key] of Object.entries(keys)) {
      if (Object.values(API_PROVIDERS).includes(provider)) {
        storeApiKey(provider, key);
      }
    }
    return true;
  } catch (error) {
    console.error('Error importing API keys:', error);
    return false;
  }
};

export default {
  API_PROVIDERS,
  storeApiKey,
  getApiKey,
  removeApiKey,
  hasApiKey,
  getConfiguredProviders,
  validateApiKeyFormat,
  maskApiKey,
  clearAllApiKeys,
  exportApiKeys,
  importApiKeys
};
