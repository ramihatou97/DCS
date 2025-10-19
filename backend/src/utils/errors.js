/**
 * Standardized Error Handling Utilities
 * 
 * Provides consistent error handling across the application with:
 * - Custom error classes for different error types
 * - Async error wrapper for Express routes
 * - Operational vs programmer error distinction
 * 
 * Usage:
 * const { AppError, handleAsync } = require('../utils/errors');
 * 
 * // In routes:
 * router.post('/extract', handleAsync(async (req, res, next) => {
 *   if (!req.body.text) {
 *     throw new AppError('Clinical note text is required', 400, 'MISSING_TEXT');
 *   }
 *   // ... rest of route logic
 * }));
 */

/**
 * Custom Application Error Class
 * Extends Error with additional properties for HTTP responses
 */
class AppError extends Error {
  /**
   * Create an application error
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {string} code - Error code for programmatic handling (default: INTERNAL_ERROR)
   * @param {Object} details - Additional error details (optional)
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Operational errors are expected, programmer errors are not
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON response
   * @returns {Object} JSON representation of error
   */
  toJSON() {
    return {
      success: false,
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        timestamp: this.timestamp,
        ...(this.details && { details: this.details })
      }
    };
  }
}

/**
 * Validation Error - 400 Bad Request
 */
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Not Found Error - 404 Not Found
 */
class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

/**
 * Unauthorized Error - 401 Unauthorized
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * Forbidden Error - 403 Forbidden
 */
class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * Rate Limit Error - 429 Too Many Requests
 */
class RateLimitError extends AppError {
  constructor(message = 'Too many requests', retryAfter = null) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
  }
}

/**
 * LLM API Error - 502 Bad Gateway
 */
class LLMAPIError extends AppError {
  constructor(message = 'LLM API request failed', provider = null) {
    super(message, 502, 'LLM_API_ERROR', { provider });
  }
}

/**
 * Async Error Handler Wrapper
 * Wraps async route handlers to catch errors and pass to Express error middleware
 * 
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped function with error handling
 * 
 * Usage:
 * router.post('/extract', handleAsync(async (req, res, next) => {
 *   const result = await extractMedicalEntities(req.body.text);
 *   res.json({ success: true, data: result });
 * }));
 */
function handleAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create error from unknown error type
 * Normalizes errors from different sources
 * 
 * @param {any} error - Error of unknown type
 * @returns {AppError} Normalized application error
 */
function normalizeError(error) {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // Standard Error
  if (error instanceof Error) {
    return new AppError(
      error.message || 'An unexpected error occurred',
      500,
      'INTERNAL_ERROR'
    );
  }

  // String error
  if (typeof error === 'string') {
    return new AppError(error, 500, 'INTERNAL_ERROR');
  }

  // Unknown error type
  return new AppError(
    'An unexpected error occurred',
    500,
    'INTERNAL_ERROR',
    { originalError: String(error) }
  );
}

/**
 * Check if error is operational (expected) or programmer error (bug)
 * @param {Error} error - Error to check
 * @returns {boolean} True if operational error
 */
function isOperationalError(error) {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Log error with appropriate level
 * @param {Error} error - Error to log
 */
function logError(error) {
  const isOperational = isOperationalError(error);
  const level = isOperational ? 'warn' : 'error';
  
  console[level]('[Error]', {
    message: error.message,
    code: error.code || 'UNKNOWN',
    statusCode: error.statusCode || 500,
    operational: isOperational,
    stack: !isOperational ? error.stack : undefined
  });
}

module.exports = {
  // Error classes
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  RateLimitError,
  LLMAPIError,
  
  // Utility functions
  handleAsync,
  normalizeError,
  isOperationalError,
  logError
};
