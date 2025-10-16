/**
 * CORS Proxy Server for Discharge Summary Generator
 *
 * Proxies requests to Anthropic and OpenAI APIs to bypass CORS restrictions
 * Keeps API keys secure on the server side
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import rateLimit from 'express-rate-limit';
import extractionRoutes from './routes/extraction.js';
import { sanitizeRequest, validateLLMRequest } from './middleware/validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'anthropic-version'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting - prevents abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});

// Apply rate limiting to all API routes
app.use('/api', limiter);

// Apply input sanitization to all requests
app.use(sanitizeRequest);

// Mount extraction routes
app.use('/api', extractionRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY
    }
  });
});

// Anthropic Claude API proxy
app.post('/api/anthropic', validateLLMRequest, async (req, res) => {
  console.log('📨 Anthropic API request received');
  
  try {
    // Get API key from environment or request header
    const apiKey = process.env.ANTHROPIC_API_KEY || req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ 
        error: 'No Anthropic API key configured. Add ANTHROPIC_API_KEY to .env file or pass in header.' 
      });
    }

    // Forward request to Anthropic
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Anthropic API error:', data);
      return res.status(response.status).json(data);
    }

    console.log('✅ Anthropic API success');
    res.json(data);

  } catch (error) {
    console.error('❌ Proxy error (Anthropic):', error.message);
    res.status(500).json({ 
      error: 'Proxy server error',
      message: error.message 
    });
  }
});

// OpenAI GPT API proxy
app.post('/api/openai', validateLLMRequest, async (req, res) => {
  console.log('📨 OpenAI API request received');
  
  try {
    // Get API key from environment or request header
    const apiKey = process.env.OPENAI_API_KEY || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({ 
        error: 'No OpenAI API key configured. Add OPENAI_API_KEY to .env file or pass in header.' 
      });
    }

    // Forward request to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ OpenAI API error:', data);
      return res.status(response.status).json(data);
    }

    console.log('✅ OpenAI API success');
    res.json(data);

  } catch (error) {
    console.error('❌ Proxy error (OpenAI):', error.message);
    res.status(500).json({ 
      error: 'Proxy server error',
      message: error.message 
    });
  }
});

// Google Gemini API proxy (optional, for consistency)
app.post('/api/gemini', validateLLMRequest, async (req, res) => {
  console.log('📨 Gemini API request received');
  
  try {
    const apiKey = process.env.GEMINI_API_KEY || req.query.key;
    
    if (!apiKey) {
      return res.status(401).json({ 
        error: 'No Gemini API key configured. Add GEMINI_API_KEY to .env file.' 
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Gemini API error:', data);
      return res.status(response.status).json(data);
    }

    console.log('✅ Gemini API success');
    res.json(data);

  } catch (error) {
    console.error('❌ Proxy error (Gemini):', error.message);
    res.status(500).json({ 
      error: 'Proxy server error',
      message: error.message 
    });
  }
});

// Test endpoint for API keys
app.post('/api/test/:provider', async (req, res) => {
  const { provider } = req.params;
  console.log(`🧪 Testing ${provider} API key...`);

  try {
    let response;
    
    switch (provider) {
      case 'anthropic':
        const anthropicKey = process.env.ANTHROPIC_API_KEY || req.headers['x-api-key'];
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }]
          })
        });
        break;

      case 'openai':
        const openaiKey = process.env.OPENAI_API_KEY || req.headers['authorization']?.replace('Bearer ', '');
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }]
          })
        });
        break;

      case 'gemini':
        const geminiKey = process.env.GEMINI_API_KEY;
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Hi' }] }]
            })
          }
        );
        break;

      default:
        return res.status(400).json({ error: 'Unknown provider' });
    }

    if (response.ok) {
      console.log(`✅ ${provider} API key is valid`);
      res.json({ valid: true, provider });
    } else {
      const error = await response.json();
      console.log(`❌ ${provider} API key is invalid:`, error);
      res.status(response.status).json({ valid: false, error });
    }

  } catch (error) {
    console.error(`❌ Test error (${provider}):`, error.message);
    res.status(500).json({ valid: false, error: error.message });
  }
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🚀 DCS Proxy Server');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  📡 Server running on: http://localhost:${PORT}`);
  console.log(`  🏥 Health check: http://localhost:${PORT}/health`);
  console.log('\n  API Keys Configured:');
  console.log(`    Anthropic: ${process.env.ANTHROPIC_API_KEY ? '✅' : '❌'}`);
  console.log(`    OpenAI:    ${process.env.OPENAI_API_KEY ? '✅' : '❌'}`);
  console.log(`    Gemini:    ${process.env.GEMINI_API_KEY ? '✅' : '❌'}`);
  console.log('\n  Endpoints:');
  console.log(`    POST /api/anthropic - Claude proxy`);
  console.log(`    POST /api/openai    - GPT proxy`);
  console.log(`    POST /api/gemini    - Gemini proxy`);
  console.log(`    POST /api/test/:provider - Test API key`);
  console.log(`    POST /api/extract - Full extraction (pattern + LLM)`);
  console.log(`    POST /api/extract-scores - Extract clinical scores`);
  console.log(`    POST /api/expand-abbreviations - Expand medical abbreviations`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
