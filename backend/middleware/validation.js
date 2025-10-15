/**
 * Input Validation Middleware
 *
 * Sanitizes and validates incoming requests to prevent injection attacks
 * Uses express-validator for comprehensive validation
 */

import { body, validationResult } from 'express-validator';

/**
 * Validates LLM API requests (Anthropic, OpenAI, Gemini)
 */
export const validateLLMRequest = [
  body('model').optional().isString().trim().isLength({ max: 100 }),
  body('messages').optional().isArray({ max: 50 }),
  body('messages.*.role').optional().isIn(['user', 'assistant', 'system']),
  body('messages.*.content').optional().isString().trim().isLength({ max: 100000 }),
  body('max_tokens').optional().isInt({ min: 1, max: 100000 }),
  body('temperature').optional().isFloat({ min: 0, max: 2 }),
  body('top_p').optional().isFloat({ min: 0, max: 1 }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
];

/**
 * Validates extraction API requests
 */
export const validateExtractionRequest = [
  body('notes').isString().trim().isLength({ min: 1, max: 500000 })
    .withMessage('Notes must be a string between 1 and 500,000 characters'),
  body('method').optional().isIn(['pattern', 'llm', 'hybrid'])
    .withMessage('Method must be pattern, llm, or hybrid'),
  body('llmProvider').optional().isIn(['anthropic', 'openai', 'gemini'])
    .withMessage('LLM provider must be anthropic, openai, or gemini'),
  body('options').optional().isObject(),
  body('options.enableLLM').optional().isBoolean(),
  body('options.enableDeduplication').optional().isBoolean(),
  body('options.learnedPatterns').optional().isObject(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
];

/**
 * Validates abbreviation expansion requests
 */
export const validateAbbreviationRequest = [
  body('text').isString().trim().isLength({ min: 1, max: 100000 })
    .withMessage('Text must be a string between 1 and 100,000 characters'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
];

/**
 * Validates score extraction requests
 */
export const validateScoresRequest = [
  body('notes').isString().trim().isLength({ min: 1, max: 100000 })
    .withMessage('Notes must be a string between 1 and 100,000 characters'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
];

/**
 * Sanitize request body to prevent XSS and injection attacks
 * This is a basic sanitizer - for production, consider using DOMPurify on client side
 */
export const sanitizeRequest = (req, res, next) => {
  if (req.body) {
    // Remove any potential script tags or dangerous HTML
    const sanitize = (obj) => {
      if (typeof obj === 'string') {
        return obj
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      } else if (Array.isArray(obj)) {
        return obj.map(sanitize);
      } else if (obj && typeof obj === 'object') {
        return Object.fromEntries(
          Object.entries(obj).map(([key, value]) => [key, sanitize(value)])
        );
      }
      return obj;
    };

    req.body = sanitize(req.body);
  }
  next();
};
