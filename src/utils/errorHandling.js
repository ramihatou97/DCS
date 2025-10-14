/**
 * Error Handling Utilities
 * 
 * Centralized error handling for the application
 */

/**
 * Custom error classes
 */
export class ExtractionError extends Error {
  constructor(message, field, context) {
    super(message);
    this.name = 'ExtractionError';
    this.field = field;
    this.context = context;
    this.timestamp = Date.now();
  }
}

export class ValidationError extends Error {
  constructor(message, field, value) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    this.timestamp = Date.now();
  }
}

export class MLError extends Error {
  constructor(message, operation, data) {
    super(message);
    this.name = 'MLError';
    this.operation = operation;
    this.data = data;
    this.timestamp = Date.now();
  }
}

export class StorageError extends Error {
  constructor(message, operation, key) {
    super(message);
    this.name = 'StorageError';
    this.operation = operation;
    this.key = key;
    this.timestamp = Date.now();
  }
}

export class LLMError extends Error {
  constructor(message, provider, statusCode) {
    super(message);
    this.name = 'LLMError';
    this.provider = provider;
    this.statusCode = statusCode;
    this.timestamp = Date.now();
  }
}

/**
 * Error handler wrapper
 */
export const handleError = (error, context = '') => {
  const errorInfo = {
    type: error.name || 'Error',
    message: error.message,
    context,
    timestamp: new Date().toISOString(),
    stack: error.stack
  };

  // Log to console
  console.error(`[${errorInfo.type}] ${context}:`, errorInfo);

  // Store error for debugging (optional)
  storeError(errorInfo);

  return errorInfo;
};

/**
 * Store error in localStorage for debugging
 */
const storeError = (errorInfo) => {
  try {
    const errors = JSON.parse(localStorage.getItem('dsg_errors') || '[]');
    errors.push(errorInfo);
    
    // Keep only last 50 errors
    const recentErrors = errors.slice(-50);
    
    localStorage.setItem('dsg_errors', JSON.stringify(recentErrors));
  } catch (e) {
    // Ignore storage errors
    console.warn('Could not store error:', e);
  }
};

/**
 * Get stored errors
 */
export const getStoredErrors = () => {
  try {
    return JSON.parse(localStorage.getItem('dsg_errors') || '[]');
  } catch (e) {
    return [];
  }
};

/**
 * Clear stored errors
 */
export const clearStoredErrors = () => {
  try {
    localStorage.removeItem('dsg_errors');
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Safe async execution with error handling
 */
export const safeAsync = async (fn, errorMessage = 'Operation failed', context = '') => {
  try {
    return await fn();
  } catch (error) {
    handleError(error, context || errorMessage);
    throw error;
  }
};

/**
 * Retry async operation with exponential backoff
 */
export const retryAsync = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Validate required fields
 */
export const validateRequired = (obj, requiredFields) => {
  const missing = [];
  
  for (const field of requiredFields) {
    if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
      missing.push(field);
    }
  }
  
  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      missing[0],
      obj[missing[0]]
    );
  }
  
  return true;
};

/**
 * Safe JSON parse
 */
export const safeJSONParse = (str, defaultValue = null) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.warn('JSON parse failed:', e.message);
    return defaultValue;
  }
};

/**
 * Safe JSON stringify
 */
export const safeJSONStringify = (obj, defaultValue = '{}') => {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    console.warn('JSON stringify failed:', e.message);
    return defaultValue;
  }
};

/**
 * Create error report for debugging
 */
export const createErrorReport = () => {
  const errors = getStoredErrors();
  
  const report = {
    generatedAt: new Date().toISOString(),
    totalErrors: errors.length,
    errorsByType: {},
    recentErrors: errors.slice(-10),
    errorTimeline: []
  };

  // Group by error type
  for (const error of errors) {
    const type = error.type || 'Unknown';
    report.errorsByType[type] = (report.errorsByType[type] || 0) + 1;
  }

  // Create timeline
  const last24h = Date.now() - (24 * 60 * 60 * 1000);
  report.errorTimeline = errors.filter(e => 
    new Date(e.timestamp).getTime() > last24h
  );

  return report;
};

/**
 * Assert condition
 */
export const assert = (condition, message) => {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
};

/**
 * Graceful degradation wrapper
 */
export const withFallback = (fn, fallbackFn) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.warn('Primary function failed, using fallback:', error.message);
      return await fallbackFn(...args);
    }
  };
};

/**
 * Timeout wrapper for promises
 */
export const withTimeout = (promise, timeoutMs, timeoutMessage = 'Operation timed out') => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    )
  ]);
};

export default {
  ExtractionError,
  ValidationError,
  MLError,
  StorageError,
  LLMError,
  handleError,
  getStoredErrors,
  clearStoredErrors,
  safeAsync,
  retryAsync,
  validateRequired,
  safeJSONParse,
  safeJSONStringify,
  createErrorReport,
  assert,
  withFallback,
  withTimeout
};
