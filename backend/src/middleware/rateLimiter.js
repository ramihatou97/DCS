/**
 * Rate Limiting Middleware
 * 
 * Protects API endpoints from abuse and controls LLM API costs.
 * Uses express-rate-limit for flexible rate limiting strategies.
 * 
 * Features:
 * - General API rate limiting (per IP)
 * - Strict LLM endpoint rate limiting (cost control)
 * - Customizable time windows and limits
 * - User-friendly error messages
 * - Redis support for distributed deployments (future)
 */

const rateLimit = require('express-rate-limit');
const { RateLimitError } = require('../utils/errors');

// Configuration from environment or defaults
const API_RATE_WINDOW = parseInt(process.env.API_RATE_WINDOW) || 15 * 60 * 1000; // 15 minutes
const API_RATE_MAX = parseInt(process.env.API_RATE_MAX) || 100; // 100 requests per window

const LLM_RATE_WINDOW = parseInt(process.env.LLM_RATE_WINDOW) || 60 * 60 * 1000; // 1 hour
const LLM_RATE_MAX = parseInt(process.env.LLM_RATE_MAX) || 50; // 50 LLM calls per hour

/**
 * General API Rate Limiter
 * Applies to all API endpoints to prevent abuse
 */
const apiLimiter = rateLimit({
  windowMs: API_RATE_WINDOW,
  max: API_RATE_MAX,
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(API_RATE_WINDOW / 1000) // seconds
    }
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  
  // Skip successful requests
  skipSuccessfulRequests: false,
  
  // Skip failed requests
  skipFailedRequests: false,
  
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    console.warn(`[Rate Limit] API limit reached for IP: ${req.ip}`);

    const error = new RateLimitError(
      'Too many requests from this IP, please try again later',
      Math.ceil(API_RATE_WINDOW / 1000)
    );

    res.status(429).json(error.toJSON());
  }
});

/**
 * Strict LLM Rate Limiter
 * Applies to LLM-powered endpoints to control costs
 */
const llmLimiter = rateLimit({
  windowMs: LLM_RATE_WINDOW,
  max: LLM_RATE_MAX,
  message: {
    success: false,
    error: {
      message: 'LLM request limit exceeded. Please try again later to avoid excessive API costs.',
      code: 'LLM_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(LLM_RATE_WINDOW / 1000) // seconds
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  skipSuccessfulRequests: false,
  skipFailedRequests: true, // Don't count failed LLM requests (they didn't cost anything)

  handler: (req, res) => {
    console.warn(`[Rate Limit] LLM limit reached for IP: ${req.ip}`);

    const error = new RateLimitError(
      'LLM request limit exceeded. Please try again later to avoid excessive API costs.',
      Math.ceil(LLM_RATE_WINDOW / 1000)
    );

    res.status(429).json(error.toJSON());
  }
});

/**
 * Lenient Rate Limiter for Health Checks
 * Very high limits for monitoring endpoints
 */
const healthCheckLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    success: false,
    error: {
      message: 'Too many health check requests',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Custom rate limiter factory
 * Create custom rate limiters with specific configurations
 * 
 * @param {Object} options - Rate limiter options
 * @returns {Function} Rate limiting middleware
 */
function createRateLimiter(options = {}) {
  const defaults = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
      success: false,
      error: {
        message: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED'
      }
    },
    standardHeaders: true,
    legacyHeaders: false
  };

  return rateLimit({ ...defaults, ...options });
}

/**
 * Rate limit skip condition
 * Skip rate limiting for certain conditions (e.g., internal requests)
 * 
 * @param {Object} req - Express request object
 * @returns {boolean} True if rate limiting should be skipped
 */
function shouldSkipRateLimit(req) {
  // Skip rate limiting for internal requests
  if (req.ip === '127.0.0.1' || req.ip === '::1') {
    return true;
  }
  
  // Skip if special header is present (for testing)
  if (process.env.NODE_ENV === 'test' && req.headers['x-skip-rate-limit']) {
    return true;
  }
  
  return false;
}

/**
 * Get rate limit status for current request
 * Useful for displaying remaining requests to users
 * 
 * @param {Object} req - Express request object
 * @returns {Object} Rate limit status
 */
function getRateLimitStatus(req) {
  return {
    limit: req.rateLimit?.limit || null,
    current: req.rateLimit?.current || null,
    remaining: req.rateLimit?.remaining || null,
    resetTime: req.rateLimit?.resetTime || null
  };
}

module.exports = {
  apiLimiter,
  llmLimiter,
  healthCheckLimiter,
  createRateLimiter,
  shouldSkipRateLimit,
  getRateLimitStatus
};
