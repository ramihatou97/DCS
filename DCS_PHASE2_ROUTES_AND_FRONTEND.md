# PHASE 2: ROUTES AND FRONTEND UPDATES

This document contains API routes and frontend component updates.

---

## 2.9 Create Summary Routes

**File:** `backend/routes/summary.js` (NEW)

```javascript
/**
 * Summary Generation API Routes
 */

import express from 'express';
import summaryEngine from '../services/summaryEngine.js';

const router = express.Router();

/**
 * POST /api/generate-summary
 * Generate discharge summary from extracted data
 */
router.post('/generate-summary', async (req, res) => {
  try {
    const { extractedData, notes, options = {} } = req.body;
    
    // Validate input
    if (!extractedData || typeof extractedData !== 'object') {
      return res.status(400).json({
        error: 'Invalid input: extractedData is required and must be an object',
      });
    }
    
    if (!notes) {
      return res.status(400).json({
        error: 'Invalid input: notes are required',
      });
    }
    
    console.log('Generating discharge summary...');
    
    const result = await summaryEngine.generateDischargeSummary(
      extractedData,
      notes,
      options
    );
    
    res.json(result);
    
  } catch (error) {
    console.error('Summary generation error:', error);
    res.status(500).json({
      error: error.message || 'Summary generation failed',
    });
  }
});

export default router;
```

---

## 2.10 Update Extraction Routes

**File:** `backend/routes/extraction.js` (UPDATE)

```javascript
/**
 * Extraction API Routes
 * 
 * Updated to use new extractionEngine service
 */

import express from 'express';
import extractionEngine from '../services/extractionEngine.js';

const router = express.Router();

/**
 * POST /api/extract
 * Extract medical entities from clinical notes
 */
router.post('/extract', async (req, res) => {
  try {
    const { notes, options = {} } = req.body;
    
    // Validate input
    if (!notes) {
      return res.status(400).json({
        error: 'Invalid input: notes are required',
      });
    }
    
    console.log(`Extracting from ${Array.isArray(notes) ? notes.length : 1} note(s)...`);
    
    const result = await extractionEngine.extractMedicalEntities(notes, options);
    
    res.json(result);
    
  } catch (error) {
    console.error('Extraction error:', error);
    res.status(500).json({
      error: error.message || 'Extraction failed',
    });
  }
});

/**
 * POST /api/extract-scores
 * Extract clinical scores (KPS, ECOG, mRS, GCS)
 */
router.post('/extract-scores', async (req, res) => {
  try {
    const { text, options = {} } = req.body;
    
    if (!text) {
      return res.status(400).json({
        error: 'Invalid input: text is required',
      });
    }
    
    const result = extractionEngine.extractClinicalScores(text, options);
    
    res.json(result);
    
  } catch (error) {
    console.error('Score extraction error:', error);
    res.status(500).json({
      error: error.message || 'Score extraction failed',
    });
  }
});

/**
 * POST /api/expand-abbreviations
 * Expand medical abbreviations
 */
router.post('/expand-abbreviations', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        error: 'Invalid input: text is required',
      });
    }
    
    // Import abbreviation expander from neurosurgeryExtractor
    const { expandAbbreviations } = await import('../services/neurosurgeryExtractor.js');
    const result = expandAbbreviations(text);
    
    res.json(result);
    
  } catch (error) {
    console.error('Abbreviation expansion error:', error);
    res.status(500).json({
      error: error.message || 'Abbreviation expansion failed',
    });
  }
});

export default router;
```

---

## 2.11 Update Backend Server

**File:** `backend/server.js` (UPDATE)

Add the following imports at the top:

```javascript
import llmRoutes from './routes/llm.js';
import summaryRoutes from './routes/summary.js';
```

Add the following route mounts (after existing routes):

```javascript
// Mount new routes
app.use('/api/llm', llmRoutes);
app.use('/api', summaryRoutes);
```

**Complete updated server.js structure:**

```javascript
/**
 * CORS Proxy Server for Discharge Summary Generator
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import extractionRoutes from './routes/extraction.js';
import llmRoutes from './routes/llm.js';
import summaryRoutes from './routes/summary.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount routes
app.use('/api', extractionRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api', summaryRoutes);

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
```

---

## 2.12 Update Frontend Components

### **2.12.1 Update src/App.jsx**

**Find and replace imports:**

```javascript
// BEFORE
import { extractMedicalEntities } from './services/extraction.js';
import { generateDischargeSummary } from './services/summaryGenerator.js';

// AFTER
import apiClient from './services/apiClient.js';
```

**Update handleExtraction function:**

```javascript
// BEFORE
const handleExtraction = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const learnedPatterns = await mlLearningEngine.getLearnedPatterns();
    
    const extraction = await extractMedicalEntities(notes, {
      learnedPatterns,
      includeConfidence: true,
      enableDeduplication: true,
    });
    
    if (!extraction.success) {
      throw new Error(extraction.error || 'Extraction failed');
    }
    
    setExtractedData(extraction.extracted, extraction.metadata);
    setCurrentStep('review');
  } catch (err) {
    setError({ type: 'extraction', message: err.message });
  } finally {
    setLoading(false);
  }
};

// AFTER
const handleExtraction = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const learnedPatterns = await mlLearningEngine.getLearnedPatterns();
    
    const extraction = await apiClient.extractMedicalData(notes, {
      learnedPatterns,
      includeConfidence: true,
      enableDeduplication: true,
      enableLLM: true,
      llmProvider: state.settings.preferredLLM || 'claude',
    });
    
    if (!extraction.success) {
      throw new Error(extraction.error || 'Extraction failed');
    }
    
    setExtractedData(extraction.extracted, extraction.metadata);
    setCurrentStep('review');
  } catch (err) {
    setError({ type: 'extraction', message: err.message });
  } finally {
    setLoading(false);
  }
};
```

**Update handleGenerateSummary function:**

```javascript
// BEFORE
const handleGenerateSummary = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const result = await generateDischargeSummary(notes, {
      validateData: true,
      includeMetadata: true,
    });
    
    if (!result.success) {
      throw new Error(result.errors?.[0]?.message || 'Generation failed');
    }
    
    setSummary(result.summary);
    setCurrentStep('export');
  } catch (err) {
    setError({ type: 'generation', message: err.message });
  } finally {
    setLoading(false);
  }
};

// AFTER
const handleGenerateSummary = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const validatedData = state.extractedData;
    
    const result = await apiClient.generateSummary(validatedData, notes, {
      style: state.settings.summaryStyle || 'formal',
      includeTimeline: true,
      llmProvider: state.settings.preferredLLM || 'claude',
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Generation failed');
    }
    
    setSummary(result.summary);
    
    if (result.timeline) {
      dispatch({
        type: ACTIONS.SET_TIMELINE,
        payload: result.timeline,
      });
    }
    
    setCurrentStep('export');
  } catch (err) {
    setError({ type: 'generation', message: err.message });
  } finally {
    setLoading(false);
  }
};
```

---

### **2.12.2 Update src/components/Settings.jsx**

**Update imports:**

```javascript
// BEFORE
import { testLLMProvider } from '../services/llmService.js';

// AFTER
import apiClient from '../services/apiClient.js';
```

**Update testLLMConnection function:**

```javascript
// BEFORE
const testLLMConnection = async (provider) => {
  setTesting(provider);
  try {
    const result = await testLLMProvider(provider);
    setTestResults(prev => ({
      ...prev,
      [provider]: result.success ? 'success' : 'failed'
    }));
  } catch (error) {
    setTestResults(prev => ({
      ...prev,
      [provider]: 'failed'
    }));
  } finally {
    setTesting(null);
  }
};

// AFTER
const testLLMConnection = async (provider) => {
  setTesting(provider);
  try {
    const result = await apiClient.testLLMProvider(provider);
    setTestResults(prev => ({
      ...prev,
      [provider]: result.success ? 'success' : 'failed'
    }));
  } catch (error) {
    setTestResults(prev => ({
      ...prev,
      [provider]: 'failed'
    }));
  } finally {
    setTesting(null);
  }
};
```

---

*Continue to next section for file deletion and verification...*

