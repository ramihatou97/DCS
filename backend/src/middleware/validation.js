/**
 * Input Validation Middleware
 * 
 * Provides validation middleware for API endpoints using express-validator.
 * Ensures clinical notes and options meet requirements before processing.
 * 
 * Features:
 * - Text length validation
 * - Type checking
 * - Sanitization
 * - Detailed error messages
 */

const { body, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

/**
 * Validation middleware for clinical note extraction endpoint
 */
const validateClinicalNote = [
  // Validate text field
  body('text')
    .exists().withMessage('Clinical note text is required')
    .isString().withMessage('Clinical note must be a string')
    .trim()
    .isLength({ min: 10, max: 50000 })
    .withMessage('Clinical note must be between 10 and 50,000 characters')
    .custom((value) => {
      // Check for meaningful content (not just whitespace)
      if (value.replace(/\s+/g, '').length < 10) {
        throw new Error('Clinical note must contain meaningful text');
      }
      return true;
    }),

  // Validate options.usePatterns (optional)
  body('options.usePatterns')
    .optional()
    .isBoolean()
    .withMessage('usePatterns must be a boolean'),

  // Validate options.enableLearning (optional)
  body('options.enableLearning')
    .optional()
    .isBoolean()
    .withMessage('enableLearning must be a boolean'),

  // Validate options.useLLM (optional)
  body('options.useLLM')
    .optional()
    .isBoolean()
    .withMessage('useLLM must be a boolean'),

  // Middleware to check validation result
  (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }));

      throw new ValidationError(
        'Validation failed for clinical note input',
        { errors: errorMessages }
      );
    }

    next();
  }
];

/**
 * Validation middleware for narrative generation endpoint
 */
const validateNarrativeInput = [
  // Validate extractedData field
  body('extractedData')
    .exists().withMessage('Extracted data is required')
    .isObject().withMessage('Extracted data must be an object')
    .custom((value) => {
      // Check for required fields in extracted data
      const requiredFields = ['demographics', 'pathology', 'procedures'];
      const missingFields = requiredFields.filter(field => !(field in value));
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields in extracted data: ${missingFields.join(', ')}`);
      }
      return true;
    }),

  // Validate options (optional)
  body('options')
    .optional()
    .isObject()
    .withMessage('Options must be an object'),

  // Middleware to check validation result
  (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }));

      throw new ValidationError(
        'Validation failed for narrative generation input',
        { errors: errorMessages }
      );
    }

    next();
  }
];

/**
 * Validation middleware for summary orchestration endpoint
 */
const validateSummaryInput = [
  // Validate clinicalNote field
  body('clinicalNote')
    .exists().withMessage('Clinical note is required')
    .isString().withMessage('Clinical note must be a string')
    .trim()
    .isLength({ min: 10, max: 50000 })
    .withMessage('Clinical note must be between 10 and 50,000 characters'),

  // Validate options (optional)
  body('options')
    .optional()
    .isObject()
    .withMessage('Options must be an object'),

  // Validate options.extractedData (optional)
  body('options.extractedData')
    .optional()
    .isObject()
    .withMessage('extractedData must be an object'),

  // Middleware to check validation result
  (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }));

      throw new ValidationError(
        'Validation failed for summary generation input',
        { errors: errorMessages }
      );
    }

    next();
  }
];

/**
 * Validation middleware for learning feedback endpoint
 */
const validateFeedback = [
  // Validate correction field
  body('correction')
    .exists().withMessage('Correction data is required')
    .isObject().withMessage('Correction must be an object'),

  // Validate correction.field
  body('correction.field')
    .exists().withMessage('Correction field name is required')
    .isString().withMessage('Field name must be a string')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Field name must be between 1 and 100 characters'),

  // Validate correction.original
  body('correction.original')
    .exists().withMessage('Original value is required'),

  // Validate correction.corrected
  body('correction.corrected')
    .exists().withMessage('Corrected value is required'),

  // Middleware to check validation result
  (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }));

      throw new ValidationError(
        'Validation failed for feedback input',
        { errors: errorMessages }
      );
    }

    next();
  }
];

/**
 * Generic validation error handler
 * Can be used as a catch-all for validation errors
 */
function validationErrorHandler(err, req, res, next) {
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json(err.toJSON());
  }
  next(err);
}

module.exports = {
  validateClinicalNote,
  validateNarrativeInput,
  validateSummaryInput,
  validateFeedback,
  validationErrorHandler
};
