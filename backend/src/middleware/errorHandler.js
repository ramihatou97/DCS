/**
 * Global Error Handler Middleware
 * Catches and formats all errors in a consistent way
 */

const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('[ERROR] Error:', err.message);
  console.error('Stack:', err.stack);

  // Default error status and message
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Determine if error details should be exposed
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Build error response
  const errorResponse = {
    error: {
      message,
      status,
      timestamp: new Date().toISOString(),
      path: req.path
    }
  };

  // Add stack trace in development mode
  if (isDevelopment) {
    errorResponse.error.stack = err.stack;
    errorResponse.error.details = err.details || null;
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    errorResponse.error.validation = err.errors;
  }

  if (err.name === 'UnauthorizedError') {
    errorResponse.error.message = 'Unauthorized access';
  }

  // Send error response
  res.status(status).json(errorResponse);
};

module.exports = errorHandler;
