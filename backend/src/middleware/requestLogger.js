/**
 * Request Logger Middleware
 * Logs all incoming requests for monitoring and debugging
 */

const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log request
  console.log(`[REQUEST] ${req.method} ${req.path}`, {
    body: req.body ? Object.keys(req.body) : [],
    query: req.query,
    timestamp: new Date().toISOString()
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusEmoji = res.statusCode < 400 ? '[OK]' : '[ERROR]';
    
    console.log(`${statusEmoji} ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
};

module.exports = requestLogger;
