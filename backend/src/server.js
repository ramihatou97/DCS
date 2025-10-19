/**
 * DCS Backend Server
 * 
 * Express server for Digital Clinical Scribe API
 * Provides secure backend for medical data extraction and summary generation
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Middleware
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter, healthCheckLimiter } = require('./middleware/rateLimiter');
const { validationErrorHandler } = require('./middleware/validation');

// Routes
const healthRoute = require('./routes/health');
const extractionRoute = require('./routes/extraction');
const narrativeRoute = require('./routes/narrative');
const summaryRoute = require('./routes/summary');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// MIDDLEWARE
// ============================================================================

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '50mb' })); // Large limit for clinical notes
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use(requestLogger);

// Global API rate limiting (applied to all routes except health)
// Health endpoints get their own lighter rate limit
app.use('/api/health', healthCheckLimiter);
app.use('/api', apiLimiter);

// ============================================================================
// ROUTES
// ============================================================================

app.use('/api/health', healthRoute);
app.use('/api/extract', extractionRoute);
app.use('/api/narrative', narrativeRoute);
app.use('/api/summary', summaryRoute);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'DCS Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      extract: 'POST /api/extract',
      narrative: 'POST /api/narrative',
      summary: 'POST /api/summary'
    },
    documentation: 'https://github.com/ramihatou97/DCS'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.path} not found`,
    availableEndpoints: [
      '/api/health',
      '/api/extract',
      '/api/narrative',
      '/api/summary'
    ]
  });
});

// Validation error handler (before general error handler)
app.use(validationErrorHandler);

// Error handling (must be last)
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

// Verify environment variables
const requiredEnvVars = [];
const optionalEnvVars = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'GOOGLE_API_KEY'];

// Check if at least one LLM API key is configured
const hasAnyApiKey = optionalEnvVars.some(envVar => process.env[envVar]);
if (!hasAnyApiKey) {
  console.warn('[WARNING] No LLM API keys configured. Set at least one of:');
  console.warn('   - ANTHROPIC_API_KEY');
  console.warn('   - OPENAI_API_KEY');
  console.warn('   - GOOGLE_API_KEY');
}

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🏥 Digital Clinical Scribe - Backend API');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  🚀 Server running on: http://localhost:${PORT}`);
  console.log(`  [ANALYSIS] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  🔑 API Keys configured:`);
  console.log(`     - Anthropic: ${process.env.ANTHROPIC_API_KEY ? '[SUCCESS]' : '✗'}`);
  console.log(`     - OpenAI: ${process.env.OPENAI_API_KEY ? '[SUCCESS]' : '✗'}`);
  console.log(`     - Google: ${process.env.GOOGLE_API_KEY ? '[SUCCESS]' : '✗'}`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app;
