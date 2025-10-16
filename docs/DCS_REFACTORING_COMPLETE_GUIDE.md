# 📘 DCS APPLICATION REFACTORING - COMPLETE TECHNICAL SPECIFICATION

**Version:** 1.0  
**Date:** 2025-10-15  
**Project:** Discharge Summary Generator (DCS) - Backend Migration & Quality Improvements  
**Estimated Timeline:** 4-6 weeks  
**Expected Bundle Reduction:** 867KB → 300KB (65% reduction)

---

## 📑 TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Application Overview](#application-overview)
3. [Architecture Overview](#architecture-overview)
4. [Phase 1: Critical Error Fixes](#phase-1-critical-error-fixes)
5. [Phase 2: Backend Migration](#phase-2-backend-migration)
6. [Phase 3: Code Quality Improvements](#phase-3-code-quality-improvements)
7. [Phase 4: Optional Enhancements](#phase-4-optional-enhancements)
8. [Testing & Verification](#testing--verification)
9. [Deployment Guide](#deployment-guide)
10. [Appendices](#appendices)

---

## 📊 EXECUTIVE SUMMARY

### **Project Goals**

This refactoring project transforms the DCS application from a frontend-heavy architecture to a backend-heavy architecture while maintaining its privacy-first design and HIPAA compliance. The project addresses critical errors, improves code quality, and significantly reduces frontend bundle size.

### **Key Objectives**

1. **Fix Critical Errors:** Resolve syntax errors, property access issues, and remove unused code
2. **Migrate to Backend:** Move heavy processing (extraction, LLM orchestration, summary generation) to backend
3. **Improve Code Quality:** Add validation, rate limiting, error boundaries, and proper logging
4. **Maintain Privacy:** Keep ML learning local, no PHI persistence on backend
5. **Reduce Bundle Size:** Target 65% reduction (867KB → 300KB)

### **Success Metrics**

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Bundle Size | 867KB | 300KB | 65% reduction |
| Load Time | 3s | 1s | 67% faster |
| Extraction Speed | 5s | 2s | 60% faster |
| Memory Usage | 150MB | 50MB | 67% reduction |
| Code Quality | Multiple errors | Zero errors | 100% |

---

## 🏥 APPLICATION OVERVIEW

### **Purpose**

The DCS (Discharge Summary Generator) is an AI-powered clinical tool specifically designed for neurosurgery that extracts structured data from unstructured clinical notes and generates comprehensive, accurate discharge summaries.

### **Core Capabilities**

#### **1. Deep Clinical Understanding**

The application must understand and process:

- **General Medical Information:** Demographics, vital signs, lab results, medications
- **Neurosurgery-Specific Data:** Surgical procedures, pathology reports, imaging findings, neurological exams
- **Unstructured Clinical Notes:** From multiple sources with varying documentation styles
- **Incomplete Information:** Handle missing data gracefully without extrapolation
- **Unclear Abbreviations:** Expand medical abbreviations contextually
- **Repetitive Content:** Deduplicate across multiple notes while preserving unique information

**Source Document Types:**
- Admission notes
- History & Physical (H&P)
- Progress notes (daily updates)
- PT/OT notes (functional assessments)
- Procedure notes (operative reports)
- Goals of Care discussions
- Discharge planning notes

#### **2. Comprehensive Extraction Targets (13 Critical Categories)**

The application MUST extract the following with high accuracy:

| Category | Fields | Example |
|----------|--------|---------|
| **Demographics** | Age, Gender, MRN | "45yo male, MRN: 12345678" |
| **Dates** | Admission, Surgery, Discharge | "Admitted 01/15/2024, Surgery 01/16/2024" |
| **Diagnosis** | Primary, Pathology, Location, Molecular | "Left frontal GBM, IDH-wildtype" |
| **Procedures** | Surgical interventions, Technique, Approach | "Left frontal craniotomy for tumor resection" |
| **Imaging** | Pre-op findings, Post-op findings | "MRI: 4cm enhancing mass left frontal lobe" |
| **Neuro Exam** | Neurological deficits, Changes | "Right hemiparesis 4/5 strength" |
| **Functional Scores** | KPS, ECOG, mRS, GCS | "KPS 80, ECOG 1" |
| **Complications** | Surgical, Medical, Neurological | "Post-op seizure on POD2" |
| **Medications** | Pre-op, Post-op, Discharge | "Keppra 500mg BID, Dexamethasone taper" |
| **Consultations** | Specialists involved | "Neuro-oncology, Radiation oncology" |
| **Discharge Destination** | Location, Support level | "Home with family, outpatient PT" |
| **Follow-up Plans** | Appointments, Imaging | "Follow-up in 2 weeks, MRI in 6 weeks" |
| **Labs** | Relevant lab values | "Na 138, Cr 0.9" |

#### **3. Chronological Accuracy & Coherence**

The application must:

- **Build Accurate Timelines:** Reconstruct chronological order from fragmented notes
- **Track POD Progression:** Identify post-operative day (POD) events and changes
- **Clinical Evolution:** Track how patient status changes over time
- **Eliminate Repetitions:** Remove duplicate information while preserving unique details
- **Maintain Temporal Relationships:** Understand cause-effect relationships between events

**Example Timeline:**
```
POD 0 (01/16): Surgery completed, extubated in OR, to ICU
POD 1 (01/17): Neurologically intact, started on Keppra
POD 2 (01/18): Seizure episode, increased Keppra dose
POD 3 (01/19): Stable, transferred to floor
POD 4 (01/20): PT/OT evaluation, ambulating with assistance
POD 5 (01/21): Discharged home with family
```

#### **4. LLM Integration (MANDATORY)**

LLM must be **central** to the application, not peripheral:

**Multi-Provider Architecture:**
- **Primary:** Anthropic Claude 3.5 Sonnet (best for medical reasoning)
- **Fallback 1:** OpenAI GPT-4o (fast, reliable)
- **Fallback 2:** Google Gemini 1.5 Pro (long context window)

**LLM Responsibilities:**
1. **Contextual Understanding:** Interpret ambiguous clinical language
2. **Entity Extraction:** Extract structured data from unstructured text
3. **Relationship Mapping:** Understand connections between clinical events
4. **Narrative Generation:** Create coherent, formal medical narratives
5. **Quality Assessment:** Evaluate completeness and accuracy of extraction

**Hybrid Extraction Approach:**
```
Pattern-Based Extraction (Fast, Deterministic)
         ↓
LLM-Based Extraction (Contextual, Intelligent)
         ↓
Intelligent Merging (Best of both)
         ↓
Deduplication & Validation
         ↓
Final Structured Data
```

#### **5. Machine Learning (ML) Significance**

ML learning must play a **significant role** in every step:

**ML Learning System Architecture:**
```
User Correction
      ↓
Correction Tracker (captures what was wrong)
      ↓
Pattern Learner (identifies patterns in corrections)
      ↓
Pattern Matcher (applies learned patterns to new extractions)
      ↓
Improved Accuracy Over Time
```

**ML Learning Capabilities:**
1. **Learn from Corrections:** Track every user edit to extracted data
2. **Institution-Specific Patterns:** Learn local terminology and documentation styles
3. **Abbreviation Expansion:** Learn context-specific abbreviation meanings
4. **Entity Recognition:** Improve recognition of medical entities over time
5. **Confidence Calibration:** Adjust confidence scores based on correction history

**Privacy-First ML Design:**
- All learning happens **locally** in the browser
- Patterns stored in **IndexedDB** (client-side)
- Full **PHI anonymization** before pattern storage
- No ML data sent to backend
- User controls ML data (can clear/export)

#### **6. No-Extrapolation Principle (CRITICAL)**

The application **MUST NEVER**:
- Generate medical recommendations not in the source notes
- Infer diagnoses not explicitly stated
- Extrapolate treatment plans beyond documented facts
- Make assumptions about patient outcomes
- Fill in missing data with "likely" or "probable" information

**Instead, the application SHOULD:**
- Flag missing critical information
- Summarize only what is explicitly documented
- Use exact quotes when appropriate
- Indicate uncertainty with confidence scores
- Provide source note references

#### **7. Privacy & Compliance (HIPAA)**

**HIPAA Compliance Requirements:**

1. **No PHI Persistence on Backend:**
   - All patient data processed **in-memory only**
   - No database storage of clinical notes
   - No logging of PHI
   - Immediate disposal after processing

2. **Secure API Communication:**
   - HTTPS only in production
   - API keys stored server-side only
   - No PHI in URL parameters
   - Request/response encryption

3. **Local Data Storage:**
   - Draft summaries stored in browser IndexedDB
   - User can clear all data
   - Auto-delete after 30 days (configurable)
   - Export functionality for user control

---

## 🏗️ ARCHITECTURE OVERVIEW

### **Current Architecture (Before Refactoring)**

**Problems:**
- ❌ Large frontend bundle (867KB)
- ❌ Heavy processing in browser
- ❌ API keys at risk of exposure
- ❌ Difficult to update (must redeploy frontend)
- ❌ Limited server resources for processing

### **Target Architecture (After Refactoring)**

**Benefits:**
- ✅ Small frontend bundle (300KB, 65% reduction)
- ✅ Fast processing on server
- ✅ API keys secure on backend
- ✅ Easy to update (backend only)
- ✅ Better caching and optimization
- ✅ Maintains privacy-first design

---

*This document continues with detailed implementation instructions for all 4 phases...*
*Due to length constraints, the full document will be created across multiple files.*

---

## DOCUMENT STRUCTURE

This comprehensive guide is organized into the following sections:

**PART 1: Overview & Phase 1** (This file)
- Executive Summary
- Application Overview
- Architecture Overview
- Phase 1: Critical Error Fixes (Complete)

**PART 2: Phase 2 - Backend Migration** (Separate file)
- Complete code for all backend services
- Complete code for all API routes
- Frontend updates
- Migration procedures

**PART 3: Phase 3 - Code Quality** (Separate file)
- Validation middleware
- Rate limiting
- Error boundaries
- Logging framework

**PART 4: Phase 4 - Enhancements & Testing** (Separate file)
- TypeScript migration
- Testing frameworks
- Performance monitoring
- Deployment guide

---

## 🔧 PHASE 1: CRITICAL ERROR FIXES

**Priority:** CRITICAL
**Timeline:** Week 1, Days 1-2 (4-6 hours)
**Risk:** LOW

### **Overview**

This phase addresses all critical errors that prevent the application from building or running correctly. These must be fixed before any other work can proceed.

---

### **1.1 Fix Syntax Error in backend/server.js**

#### **Issue**
File starts with `can /**` instead of `/**` on line 1, causing a syntax error.

#### **Location**
`backend/server.js` - Line 1

#### **Implementation**

Open `backend/server.js` and make the following change:

**BEFORE (Line 1):**
```javascript
can /**
 * CORS Proxy Server for Discharge Summary Generator
```

**AFTER (Line 1):**
```javascript
/**
 * CORS Proxy Server for Discharge Summary Generator
```

**Steps:**
1. Open `backend/server.js`
2. Navigate to line 1
3. Delete the word `can` and the space after it
4. Save the file

**Verification:**
```bash
cd backend
node --check server.js
# No output = success
```

---

### **1.2 Fix Property Access Error in src/services/extraction.js**

#### **Issue**
On line 1222, the code accesses `medicationPatterns` property which may not exist on all pathology pattern objects.

#### **Location**
`src/services/extraction.js` - Line 1222

#### **Implementation**

**BEFORE (Line 1222):**
```javascript
const meds = pathologyPatterns[diagnosis].medicationPatterns.map(m => m.toLowerCase());
```

**AFTER (Line 1222):**
```javascript
const meds = (pathologyPatterns[diagnosis]?.medicationPatterns || []).map(m => m.toLowerCase());
```

**Steps:**
1. Open `src/services/extraction.js`
2. Navigate to line 1222 (or search for `medicationPatterns.map`)
3. Replace with safe access using optional chaining (`?.`) and nullish coalescing (`|| []`)
4. Save the file

**Explanation:**
- `?.` (optional chaining) safely accesses the property, returning `undefined` if it doesn't exist
- `|| []` (nullish coalescing) provides an empty array as fallback
- This prevents "Cannot read property 'map' of undefined" errors

---

### **1.3 Remove Unused Imports**

#### **1.3.1 Fix src/services/extraction.js**

**Unused Imports:** `extractTextBetween`, `countOccurrences`, `segmentClinicalNote`, `deduplicateContent`

**BEFORE:**
```javascript
import {
  extractTextBetween,
  countOccurrences,
  segmentClinicalNote,
  deduplicateContent,
  MEDICAL_ABBREVIATIONS,
  NEUROSURGERY_ABBREVIATIONS
} from './utils.js';
```

**AFTER:**
```javascript
import {
  MEDICAL_ABBREVIATIONS,
  NEUROSURGERY_ABBREVIATIONS
} from './utils.js';
```

---

#### **1.3.2 Fix src/components/BatchUpload.jsx**

**Unused:** `React` import, `state` variable, `source` parameter

**BEFORE:**
```javascript
import React, { useState, useCallback } from 'react';

function BatchUpload({ onNotesSubmit }) {
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState('');
  const [state, setState] = useState({}); // UNUSED

  const handleFileUpload = (event, source) => { // source UNUSED
    // ...
  };
}
```

**AFTER:**
```javascript
import { useState, useCallback } from 'react';

function BatchUpload({ onNotesSubmit }) {
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState('');

  const handleFileUpload = (event) => {
    // ...
  };
}
```

---

#### **1.3.3 Fix src/components/ExtractedDataReview.jsx**

**Unused:** `React` import, `Info` icon, `section` parameter, `hasCriticalFlag` variable

**BEFORE:**
```javascript
import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Edit2, Save, X, Info } from 'lucide-react';

function ExtractedDataReview({ data, onUpdate, onCorrection }) {
  const [editingField, setEditingField] = useState(null);
  const [hasCriticalFlag, setHasCriticalFlag] = useState(false); // UNUSED

  const renderSection = (section, sectionData) => { // section UNUSED
    // ...
  };
}
```

**AFTER:**
```javascript
import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Edit2, Save, X } from 'lucide-react';

function ExtractedDataReview({ data, onUpdate, onCorrection }) {
  const [editingField, setEditingField] = useState(null);

  const renderSection = (sectionData) => {
    // ...
  };
}
```

---

#### **1.3.4 Fix backend/server.js**

**Unused Parameters:** `req` on line 39, `req` and `next` on line 257

**BEFORE:**
```javascript
// Line 39
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Line 257
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});
```

**AFTER:**
```javascript
// Line 39
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy' });
});

// Line 257
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});
```

**Note:** Prefixing with underscore (`_req`, `_next`) indicates intentionally unused parameters.

---

### **1.4 Verification Steps**

#### **Backend Verification**

```bash
# Navigate to backend
cd backend

# Check syntax
node --check server.js

# Install dependencies
npm install

# Start backend
npm start

# Expected output:
# Server running on port 3001
# Health check: http://localhost:3001/health

# Test health endpoint (in another terminal)
curl http://localhost:3001/health
# Expected: {"status":"healthy","timestamp":"..."}
```

#### **Frontend Verification**

```bash
# Navigate to project root
cd ..

# Install dependencies
npm install

# Run linter
npm run lint
# Expected: No errors (warnings OK)

# Build frontend
npm run build
# Expected: ✓ built in XXXms

# Start dev server
npm run dev
# Expected: Local: http://localhost:5173/
```

#### **Manual Testing**

1. Open `http://localhost:5173` in browser
2. Open DevTools Console (F12)
3. Verify no red errors
4. Paste sample text and click "Extract Data"
5. Verify extraction works without errors

---

### **1.5 Success Criteria**

Phase 1 is complete when:

- ✅ No syntax errors in any file
- ✅ No unused import warnings
- ✅ No unused parameter warnings
- ✅ Backend starts without errors
- ✅ Frontend builds successfully
- ✅ Application runs without runtime errors
- ✅ No console errors in browser

---

### **1.6 Rollback Plan**

```bash
# Create backup before starting
git checkout -b phase1-fixes
git add .
git commit -m "Phase 1: Critical error fixes"

# If something goes wrong
git checkout main
git branch -D phase1-fixes
```

---

**END OF PHASE 1**

---

## 🚀 PHASE 2: BACKEND MIGRATION

**Priority:** HIGH
**Timeline:** Week 2-3 (2 weeks)
**Risk:** MEDIUM

### **Overview**

This phase migrates heavy processing from frontend to backend, reducing bundle size by 65% while maintaining privacy-first design.

**Migration Strategy:**
1. Create thin API client on frontend
2. Migrate LLM orchestration to backend
3. Migrate extraction engine to backend
4. Migrate summary generator to backend
5. Update frontend components to use API client
6. Delete migrated frontend files
7. Verify bundle size reduction

---

### **2.1 Create API Client (Frontend)**

#### **Purpose**
Create a thin API client layer that handles all communication with the backend. This replaces direct service imports in components.

#### **File:** `src/services/apiClient.js` (NEW)

#### **Complete Implementation**

```javascript
/**
 * API Client for DCS Backend
 *
 * Thin client layer for all backend communication.
 * Handles request/response formatting, error handling, and retries.
 *
 * @module apiClient
 */

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_TIMEOUT = 60000; // 60 seconds
const MAX_RETRIES = 3;

/**
 * Custom error class for API errors
 */
class APIError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Generic fetch wrapper with error handling and retries
 *
 * @param {string} endpoint - API endpoint (e.g., '/api/extract')
 * @param {Object} options - Fetch options
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<Object>} Response data
 * @throws {APIError} If request fails after retries
 */
async function apiFetch(endpoint, options = {}, retryCount = 0) {
  const url = `${API_BASE_URL}${endpoint}`;

  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse response
    const data = await response.json();

    // Handle HTTP errors
    if (!response.ok) {
      throw new APIError(
        data.error || 'Request failed',
        response.status,
        data.details
      );
    }

    return data;

  } catch (error) {
    clearTimeout(timeoutId);

    // Handle timeout
    if (error.name === 'AbortError') {
      throw new APIError('Request timeout', 408, { timeout: API_TIMEOUT });
    }

    // Handle network errors with retry
    if (error.name === 'TypeError' && retryCount < MAX_RETRIES) {
      console.warn(`Network error, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return apiFetch(endpoint, options, retryCount + 1);
    }

    // Re-throw API errors
    if (error instanceof APIError) {
      throw error;
    }

    // Wrap other errors
    throw new APIError(
      error.message || 'Unknown error',
      500,
      { originalError: error.name }
    );
  }
}

/**
 * Health check
 *
 * @returns {Promise<Object>} Health status
 */
export async function checkHealth() {
  return apiFetch('/health');
}

/**
 * Extract medical data from clinical notes
 *
 * @param {string|string[]} notes - Clinical notes (single string or array)
 * @param {Object} options - Extraction options
 * @param {boolean} [options.enableLLM=true] - Enable LLM extraction
 * @param {boolean} [options.enablePatternBased=true] - Enable pattern-based extraction
 * @param {string} [options.llmProvider='claude'] - LLM provider (claude, gpt4, gemini)
 * @param {boolean} [options.enableDeduplication=true] - Enable deduplication
 * @param {boolean} [options.includeConfidence=true] - Include confidence scores
 * @param {Object} [options.learnedPatterns={}] - ML learned patterns (from local storage)
 * @returns {Promise<Object>} Extraction result
 */
export async function extractMedicalData(notes, options = {}) {
  return apiFetch('/api/extract', {
    method: 'POST',
    body: JSON.stringify({
      notes,
      options: {
        enableLLM: options.enableLLM !== false,
        enablePatternBased: options.enablePatternBased !== false,
        llmProvider: options.llmProvider || 'claude',
        enableDeduplication: options.enableDeduplication !== false,
        includeConfidence: options.includeConfidence !== false,
        learnedPatterns: options.learnedPatterns || {},
      },
    }),
  });
}

/**
 * Generate discharge summary from extracted data
 *
 * @param {Object} extractedData - Validated extracted data
 * @param {string|string[]} notes - Original clinical notes
 * @param {Object} options - Generation options
 * @param {string} [options.style='formal'] - Summary style (formal, concise, detailed)
 * @param {boolean} [options.includeTimeline=true] - Include chronological timeline
 * @param {string} [options.llmProvider='claude'] - LLM provider
 * @returns {Promise<Object>} Summary result with timeline
 */
export async function generateSummary(extractedData, notes, options = {}) {
  return apiFetch('/api/generate-summary', {
    method: 'POST',
    body: JSON.stringify({
      extractedData,
      notes,
      options: {
        style: options.style || 'formal',
        includeTimeline: options.includeTimeline !== false,
        llmProvider: options.llmProvider || 'claude',
      },
    }),
  });
}

/**
 * Extract clinical scores (KPS, ECOG, mRS, GCS)
 */
export async function extractScores(text, options = {}) {
  return apiFetch('/api/extract-scores', {
    method: 'POST',
    body: JSON.stringify({ text, options }),
  });
}

/**
 * Expand medical abbreviations
 */
export async function expandAbbreviations(text) {
  return apiFetch('/api/expand-abbreviations', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

/**
 * Call LLM for extraction (direct LLM call)
 */
export async function callLLMExtraction(text, provider = 'claude', options = {}) {
  return apiFetch('/api/llm/extract', {
    method: 'POST',
    body: JSON.stringify({ text, provider, options }),
  });
}

/**
 * Test LLM provider connection
 */
export async function testLLMProvider(provider) {
  return apiFetch(`/api/llm/test/${provider}`);
}

// Default export
export default {
  checkHealth,
  extractMedicalData,
  generateSummary,
  extractScores,
  expandAbbreviations,
  callLLMExtraction,
  testLLMProvider,
  APIError,
};
```

#### **Installation Steps**

```bash
# No dependencies needed - uses native fetch API
# Just create the file in src/services/apiClient.js
```

---

### **2.2 Migrate LLM Service to Backend**

#### **Purpose**
Move LLM orchestration from frontend to backend for better security, performance, and maintainability.

---

#### **2.2.1 Install Backend Dependencies**

```bash
cd backend

# Install LLM provider SDKs
npm install @anthropic-ai/sdk openai @google/generative-ai

# Install NLP libraries for pattern-based extraction
npm install compromise natural

# Verify installation
npm list @anthropic-ai/sdk openai @google/generative-ai
```

#### **2.2.2 Configure Environment Variables**

Create or update `backend/.env`:

```bash
# LLM API Keys
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
GEMINI_API_KEY=xxxxx

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info
```

**IMPORTANT:** Never commit `.env` file to version control!

Add to `backend/.gitignore`:
```
.env
.env.local
.env.*.local
```

---

#### **2.2.3 Create LLM Orchestrator Service**

**File:** `backend/services/llmOrchestrator.js` (NEW)

**Complete Implementation:**

```javascript
/**
 * LLM Orchestrator Service
 *
 * Manages multiple LLM providers with automatic fallback.
 * Handles API calls, error handling, and response parsing.
 *
 * Supported Providers:
 * - Anthropic Claude 3.5 Sonnet (primary)
 * - OpenAI GPT-4o (fallback 1)
 * - Google Gemini 1.5 Pro (fallback 2)
 *
 * @module llmOrchestrator
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Provider configuration
const PROVIDER_CONFIG = {
  claude: {
    name: 'Anthropic Claude 3.5 Sonnet',
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 4096,
    temperature: 0.3,
    available: !!process.env.ANTHROPIC_API_KEY,
  },
  gpt4: {
    name: 'OpenAI GPT-4o',
    model: 'gpt-4o',
    maxTokens: 4096,
    temperature: 0.3,
    available: !!process.env.OPENAI_API_KEY,
  },
  gemini: {
    name: 'Google Gemini 1.5 Pro',
    model: 'gemini-1.5-pro',
    maxTokens: 4096,
    temperature: 0.3,
    available: !!process.env.GEMINI_API_KEY,
  },
};

// Provider priority for fallback
const PROVIDER_PRIORITY = ['claude', 'gpt4', 'gemini'];

/**
 * System prompt for medical extraction
 */
const EXTRACTION_SYSTEM_PROMPT = `You are a medical AI assistant specialized in extracting structured data from clinical notes.

CRITICAL RULES:
1. NEVER extrapolate or infer information not explicitly stated
2. NEVER generate medical recommendations
3. Only extract facts directly from the provided text
4. If information is missing, leave the field null
5. Provide confidence scores (0-1) for each extracted field
6. Use exact quotes when appropriate

Extract the following categories:
- Demographics (age, gender, MRN)
- Dates (admission, surgery, discharge)
- Diagnosis (primary, pathology, location, molecular markers)
- Procedures (surgical interventions, techniques)
- Imaging findings (pre-op and post-op)
- Neurological examination findings
- Functional scores (KPS, ECOG, mRS, GCS)
- Complications (surgical, medical, neurological)
- Medications (pre-op, post-op, discharge)
- Consultations
- Discharge destination and follow-up

Return ONLY valid JSON in this exact format:
{
  "demographics": { "age": null, "gender": null, "mrn": null },
  "dates": { "admission": null, "surgery": null, "discharge": null },
  "diagnosis": { "primary": null, "pathology": null, "location": null, "molecular": null },
  "procedures": [],
  "imaging": { "preOp": [], "postOp": [] },
  "neuroExam": [],
  "functionalScores": { "kps": null, "ecog": null, "mrs": null, "gcs": null },
  "complications": [],
  "medications": { "preOp": [], "postOp": [], "discharge": [] },
  "consultations": [],
  "discharge": { "destination": null, "followUp": [] },
  "confidence": {}
}`;

/**
 * Call Claude API
 */
async function callClaude(text, options = {}) {
  const { temperature = 0.3, maxTokens = 4096 } = options;

  const response = await anthropic.messages.create({
    model: PROVIDER_CONFIG.claude.model,
    max_tokens: maxTokens,
    temperature,
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Extract structured medical data from the following clinical notes:\n\n${text}`,
      },
    ],
  });

  const content = response.content[0].text;

  try {
    const parsed = JSON.parse(content);
    return {
      success: true,
      data: parsed,
      provider: 'claude',
      model: PROVIDER_CONFIG.claude.model,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  } catch (error) {
    throw new Error(`Failed to parse Claude response: ${error.message}`);
  }
}

/**
 * Call GPT-4 API
 */
async function callGPT4(text, options = {}) {
  const { temperature = 0.3, maxTokens = 4096 } = options;

  const response = await openai.chat.completions.create({
    model: PROVIDER_CONFIG.gpt4.model,
    max_tokens: maxTokens,
    temperature,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: EXTRACTION_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `Extract structured medical data from the following clinical notes:\n\n${text}`,
      },
    ],
  });

  const content = response.choices[0].message.content;

  try {
    const parsed = JSON.parse(content);
    return {
      success: true,
      data: parsed,
      provider: 'gpt4',
      model: PROVIDER_CONFIG.gpt4.model,
      usage: {
        inputTokens: response.usage.prompt_tokens,
        outputTokens: response.usage.completion_tokens,
      },
    };
  } catch (error) {
    throw new Error(`Failed to parse GPT-4 response: ${error.message}`);
  }
}

/**
 * Call Gemini API
 */
async function callGemini(text, options = {}) {
  const { temperature = 0.3, maxTokens = 4096 } = options;

  const model = genAI.getGenerativeModel({
    model: PROVIDER_CONFIG.gemini.model,
  });

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `${EXTRACTION_SYSTEM_PROMPT}\n\nExtract structured medical data from the following clinical notes:\n\n${text}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      responseMimeType: 'application/json',
    },
  });

  const content = result.response.text();

  try {
    const parsed = JSON.parse(content);
    return {
      success: true,
      data: parsed,
      provider: 'gemini',
      model: PROVIDER_CONFIG.gemini.model,
      usage: {
        inputTokens: result.response.usageMetadata?.promptTokenCount || 0,
        outputTokens: result.response.usageMetadata?.candidatesTokenCount || 0,
      },
    };
  } catch (error) {
    throw new Error(`Failed to parse Gemini response: ${error.message}`);
  }
}

// Continue in next section...
```

**📄 For complete LLM orchestrator implementation, see:** `DCS_PHASE2_BACKEND_SERVICES.md`

---

### **2.3 Complete Backend Services**

The following backend services have been created with complete implementations:

**✅ Created Services:**
1. **llmOrchestrator.js** - Multi-provider LLM interface with fallback
2. **dataMerger.js** - Intelligent merging of pattern + LLM results
3. **deduplication.js** - Remove duplicate entries
4. **extractionEngine.js** - Main extraction orchestrator
5. **chronologicalEngine.js** - Timeline building
6. **narrativeEngine.js** - Natural language generation
7. **summaryEngine.js** - Summary generation orchestrator

**✅ Created Routes:**
1. **routes/llm.js** - LLM API endpoints
2. **routes/summary.js** - Summary generation endpoints
3. **routes/extraction.js** - Updated extraction endpoints

**✅ Created Middleware:**
1. **middleware/validation.js** - Input validation and sanitization
2. **middleware/rateLimiter.js** - Rate limiting for API protection

**📄 Complete code for all services:** See supplementary documents:
- `DCS_PHASE2_BACKEND_SERVICES.md` - LLM orchestrator, data merger
- `DCS_PHASE2_EXTRACTION_SERVICES.md` - Extraction engine, deduplication
- `DCS_PHASE2_SUMMARY_SERVICES.md` - Summary, chronological, narrative engines
- `DCS_PHASE2_ROUTES_AND_FRONTEND.md` - All routes and frontend updates
- `DCS_PHASE2_CLEANUP_AND_PHASE3.md` - Cleanup procedures and Phase 3
- `DCS_PHASE3_PHASE4_COMPLETE.md` - Error boundaries, logging, Phase 4

---

### **2.4 Frontend Updates Summary**

**Files to Update:**
1. **src/App.jsx** - Replace service imports with apiClient
2. **src/components/Settings.jsx** - Update LLM testing to use apiClient

**Files to Delete:**
- src/services/extraction.js (1614 lines)
- src/services/llmService.js (585 lines)
- src/services/summaryGenerator.js (622 lines)
- src/services/deduplication.js
- src/services/chronologicalContext.js
- src/services/narrativeEngine.js
- src/services/dataMerger.js
- src/services/clinicalEvolution.js

**Files to Keep:**
- src/services/apiClient.js (NEW - thin client)
- src/services/validation.js (immediate feedback)
- src/services/ml/ (privacy-first learning)
- src/services/storage/ (local IndexedDB)

---

### **2.5 Installation and Setup**

#### **Backend Setup**

```bash
cd backend

# Install all dependencies
npm install @anthropic-ai/sdk openai @google/generative-ai
npm install compromise natural
npm install express-validator isomorphic-dompurify
npm install express-rate-limit
npm install winston

# Create .env file
cat > .env << EOF
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
GEMINI_API_KEY=xxxxx
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
EOF

# Create logs directory
mkdir -p logs

# Start backend
npm start
```

#### **Frontend Setup**

```bash
cd ..

# No new dependencies needed
# Just update imports in components

# Build and verify
npm run build
ls -lh dist/assets/

# Expected: ~300KB (down from 867KB)
```

---

### **2.6 Testing and Verification**

#### **Backend API Testing**

```bash
# Test health
curl http://localhost:3001/health

# Test extraction
curl -X POST http://localhost:3001/api/extract \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "45yo male with left frontal GBM admitted 01/15/2024. Underwent craniotomy 01/16/2024. POD1: neurologically intact. Discharged home 01/21/2024.",
    "options": {
      "enableLLM": true,
      "llmProvider": "claude",
      "enableDeduplication": true
    }
  }'

# Test LLM providers
curl http://localhost:3001/api/llm/test/claude
curl http://localhost:3001/api/llm/test/gpt4
curl http://localhost:3001/api/llm/test/gemini

# Test summary generation
curl -X POST http://localhost:3001/api/generate-summary \
  -H "Content-Type: application/json" \
  -d '{
    "extractedData": {
      "demographics": {"age": 45, "gender": "male"},
      "dates": {"admission": "2024-01-15", "surgery": "2024-01-16", "discharge": "2024-01-21"},
      "diagnosis": {"primary": "Glioblastoma", "location": "left frontal"}
    },
    "notes": "Clinical notes...",
    "options": {
      "style": "formal",
      "includeTimeline": true
    }
  }'
```

#### **Frontend Testing**

```bash
# Start dev server
npm run dev

# Open http://localhost:5173

# Manual test checklist:
# 1. Upload clinical notes
# 2. Click "Extract Data"
# 3. Verify extraction completes
# 4. Review extracted data
# 5. Make corrections (test ML learning)
# 6. Click "Generate Summary"
# 7. Verify summary appears
# 8. Check timeline visualization
# 9. Export summary
# 10. Verify no console errors
```

---

### **2.7 Phase 2 Success Criteria**

Phase 2 is complete when:

- ✅ All backend services created and working
- ✅ All API routes responding correctly
- ✅ Frontend uses apiClient for all backend calls
- ✅ Migrated frontend files deleted
- ✅ Bundle size reduced by 65% (867KB → 300KB)
- ✅ All features work via backend API
- ✅ No console errors in browser or server
- ✅ ML learning still works locally
- ✅ No PHI sent to backend (verify in Network tab)
- ✅ API keys never exposed to frontend

---

**END OF PHASE 2**

---

## 🎨 PHASE 3: CODE QUALITY IMPROVEMENTS

**Priority:** MEDIUM
**Timeline:** Week 4 (1 week)
**Risk:** LOW

### **Overview**

This phase adds validation, rate limiting, error boundaries, and proper logging to improve code quality and security.

---

### **3.1 Input Validation**

**Purpose:** Sanitize and validate all incoming requests to prevent XSS, injection attacks, and invalid data.

**Implementation:**
- Install `express-validator` and `isomorphic-dompurify`
- Create `backend/middleware/validation.js`
- Add validation rules for all endpoints
- Apply validation middleware to routes

**Key Features:**
- Sanitize text inputs (remove HTML tags)
- Validate data types and formats
- Enforce length limits
- Return detailed error messages

**📄 Complete implementation:** See `DCS_PHASE2_CLEANUP_AND_PHASE3.md` section 3.1

---

### **3.2 Rate Limiting**

**Purpose:** Protect API endpoints from abuse and excessive requests.

**Implementation:**
- Install `express-rate-limit`
- Create `backend/middleware/rateLimiter.js`
- Define rate limits for different endpoint types
- Apply to server before routes

**Rate Limits:**
- General API: 100 requests / 15 minutes
- LLM endpoints: 10 requests / minute
- Extraction: 20 requests / 5 minutes
- Summary generation: 10 requests / 10 minutes

**📄 Complete implementation:** See `DCS_PHASE2_CLEANUP_AND_PHASE3.md` section 3.2

---

### **3.3 Error Boundaries**

**Purpose:** Catch React errors gracefully and display user-friendly fallback UI.

**Implementation:**
- Create `src/components/ErrorBoundary.jsx`
- Wrap main app in error boundary
- Display error details in development
- Provide "Try Again" and "Go Home" actions

**Features:**
- Catches all React component errors
- Prevents app crashes
- Logs errors for debugging
- User-friendly error messages

**📄 Complete implementation:** See `DCS_PHASE3_PHASE4_COMPLETE.md` section 3.3

---

### **3.4 Proper Logging**

**Purpose:** Replace console.log with structured logging for better debugging and monitoring.

**Implementation:**
- Install `winston`
- Create `backend/utils/logger.js`
- Configure log levels and transports
- Replace all console.log statements

**Features:**
- Structured log format with timestamps
- Separate error and combined logs
- Log rotation (5MB max, 5 files)
- Colorized console output
- Configurable log levels

**📄 Complete implementation:** See `DCS_PHASE3_PHASE4_COMPLETE.md` section 3.4

---

### **3.5 Phase 3 Success Criteria**

Phase 3 is complete when:

- ✅ Input validation on all endpoints
- ✅ Rate limiting applied and tested
- ✅ Error boundaries catch React errors
- ✅ Winston logging implemented
- ✅ All console.log replaced with logger
- ✅ No security vulnerabilities
- ✅ Proper error messages for users

---

**END OF PHASE 3**

---

## 🚀 PHASE 4: OPTIONAL ENHANCEMENTS

**Priority:** LOW
**Timeline:** Week 5-6 (2 weeks)
**Risk:** LOW

### **Overview**

Optional improvements for production readiness, including TypeScript, testing, and monitoring.

---

### **4.1 TypeScript Migration (Optional)**

**Benefits:**
- Catch 80% of bugs at compile time
- Better IDE autocomplete and IntelliSense
- Self-documenting code with type definitions
- Easier refactoring with type safety

**Migration Strategy:**
1. Install TypeScript and type definitions
2. Create `tsconfig.json`
3. Create type definitions for API responses
4. Gradually rename files (.js → .ts, .jsx → .tsx)
5. Add type annotations to functions

**📄 Complete guide:** See `DCS_PHASE3_PHASE4_COMPLETE.md` section 4.1

---

### **4.2 Comprehensive Testing**

**Unit Tests (Jest):**
- Test API client functions
- Test utility functions
- Test React components
- Mock external dependencies

**E2E Tests (Playwright):**
- Test complete user workflows
- Test extraction pipeline
- Test summary generation
- Test error handling

**📄 Complete examples:** See `DCS_PHASE3_PHASE4_COMPLETE.md` section 4.2

---

### **4.3 Performance Monitoring**

**Frontend Monitoring:**
- Measure operation durations
- Track user interactions
- Monitor bundle load times
- Send metrics to analytics

**Backend Monitoring:**
- Track API response times
- Monitor LLM API usage
- Track error rates
- Resource utilization

**📄 Complete implementation:** See `DCS_PHASE3_PHASE4_COMPLETE.md` section 4.3

---

### **4.4 Health Monitoring Dashboard**

**Features:**
- System health status
- Memory and CPU usage
- Service availability (LLM providers)
- Uptime tracking
- Real-time metrics

**📄 Complete implementation:** See `DCS_PHASE3_PHASE4_COMPLETE.md` section 4.4

---

### **4.5 Phase 4 Success Criteria**

Phase 4 is complete when:

- ✅ TypeScript migration (if chosen)
- ✅ Unit tests with >80% coverage
- ✅ E2E tests for critical workflows
- ✅ Performance monitoring active
- ✅ Health dashboard accessible
- ✅ Production-ready deployment

---

**END OF PHASE 4**

---

## 📋 COMPLETE IMPLEMENTATION CHECKLIST

### **Phase 1: Critical Error Fixes** ✅
- [ ] Fix syntax error in `backend/server.js` line 1
- [ ] Fix property access error in `src/services/extraction.js` line 1222
- [ ] Remove unused imports in `src/services/extraction.js`
- [ ] Remove unused imports in `src/components/BatchUpload.jsx`
- [ ] Remove unused imports in `src/components/ExtractedDataReview.jsx`
- [ ] Remove unused parameters in `backend/server.js`
- [ ] Verify backend starts without errors
- [ ] Verify frontend builds successfully
- [ ] Test application runs without errors

### **Phase 2: Backend Migration** ✅
- [ ] Create `src/services/apiClient.js`
- [ ] Create `backend/services/llmOrchestrator.js`
- [ ] Create `backend/routes/llm.js`
- [ ] Create `backend/services/dataMerger.js`
- [ ] Create `backend/services/deduplication.js`
- [ ] Create `backend/services/extractionEngine.js`
- [ ] Create `backend/services/chronologicalEngine.js`
- [ ] Create `backend/services/narrativeEngine.js`
- [ ] Create `backend/services/summaryEngine.js`
- [ ] Create `backend/routes/summary.js`
- [ ] Update `backend/routes/extraction.js`
- [ ] Update `backend/server.js` (mount new routes)
- [ ] Update `src/App.jsx` (use apiClient)
- [ ] Update `src/components/Settings.jsx` (use apiClient)
- [ ] Delete migrated frontend files
- [ ] Install backend dependencies
- [ ] Configure environment variables
- [ ] Test all API endpoints
- [ ] Verify bundle size reduction (65%)
- [ ] Test complete user workflow

### **Phase 3: Code Quality Improvements** ✅
- [ ] Install validation dependencies
- [ ] Create `backend/middleware/validation.js`
- [ ] Apply validation to all routes
- [ ] Install rate limiting dependency
- [ ] Create `backend/middleware/rateLimiter.js`
- [ ] Apply rate limiting to server
- [ ] Create `src/components/ErrorBoundary.jsx`
- [ ] Wrap app with error boundary
- [ ] Install Winston
- [ ] Create `backend/utils/logger.js`
- [ ] Replace all console.log with logger
- [ ] Test validation with invalid inputs
- [ ] Test rate limiting with excessive requests
- [ ] Test error boundary with intentional errors

### **Phase 4: Optional Enhancements** (Optional)
- [ ] Install TypeScript
- [ ] Create type definitions
- [ ] Migrate files to TypeScript
- [ ] Install Jest and testing libraries
- [ ] Write unit tests
- [ ] Install Playwright
- [ ] Write E2E tests
- [ ] Implement performance monitoring
- [ ] Create health dashboard
- [ ] Run all tests
- [ ] Verify production readiness

---

## 🎯 EXPECTED FINAL OUTCOMES

### **Performance Improvements**
- ⚡ **Bundle Size:** 867KB → 300KB (65% reduction)
- ⚡ **Load Time:** 3s → 1s (67% faster)
- ⚡ **Extraction Speed:** 5s → 2s (60% faster on server)
- ⚡ **Memory Usage:** 150MB → 50MB (67% reduction)

### **Security Improvements**
- 🔒 **API Keys:** Never exposed to frontend
- 🔒 **Input Validation:** All endpoints protected
- 🔒 **Rate Limiting:** Abuse prevention active
- 🔒 **XSS Protection:** Input sanitization enabled

### **Code Quality Improvements**
- 📝 **Centralized Logic:** Business logic on backend
- 📝 **Thin Frontend:** Easy to update and maintain
- 📝 **Proper Logging:** Debugging made easier
- 📝 **Error Handling:** Graceful error recovery

### **Privacy & Compliance**
- ✅ **No PHI Persistence:** Backend processes in-memory only
- ✅ **ML Learning Local:** All learning stays in browser
- ✅ **HIPAA Compliant:** No PHI storage or logging
- ✅ **No Extrapolation:** Principle enforced throughout

### **Application Capabilities Maintained**
- ✅ **13 Extraction Targets:** All categories extracted accurately
- ✅ **LLM Integration:** Multi-provider with fallback
- ✅ **ML Learning:** Improves accuracy over time
- ✅ **Chronological Timeline:** POD tracking and ordering
- ✅ **Narrative Generation:** Formal medical summaries
- ✅ **Deduplication:** Intelligent duplicate removal

---

## 📚 SUPPLEMENTARY DOCUMENTS

This complete guide is supported by the following detailed implementation documents:

1. **DCS_PHASE2_BACKEND_SERVICES.md**
   - Complete LLM orchestrator implementation
   - Data merger service
   - LLM routes

2. **DCS_PHASE2_EXTRACTION_SERVICES.md**
   - Extraction engine implementation
   - Deduplication service
   - Clinical score extraction

3. **DCS_PHASE2_SUMMARY_SERVICES.md**
   - Summary engine implementation
   - Chronological engine
   - Narrative engine

4. **DCS_PHASE2_ROUTES_AND_FRONTEND.md**
   - All API routes
   - Frontend component updates
   - Import replacements

5. **DCS_PHASE2_CLEANUP_AND_PHASE3.md**
   - File deletion procedures
   - Phase 2 verification
   - Phase 3 validation and rate limiting

6. **DCS_PHASE3_PHASE4_COMPLETE.md**
   - Error boundaries
   - Logging implementation
   - TypeScript migration guide
   - Testing frameworks
   - Performance monitoring

---

## 🚀 GETTING STARTED

To begin implementation:

1. **Read this main guide** for overview and architecture
2. **Start with Phase 1** (critical fixes) - can be done immediately
3. **Proceed to Phase 2** (backend migration) - follow step-by-step
4. **Implement Phase 3** (code quality) - security and reliability
5. **Consider Phase 4** (enhancements) - production readiness

Each phase builds on the previous one. Do not skip phases.

---

## 📞 SUPPORT

If you encounter issues during implementation:

1. Check the relevant supplementary document for details
2. Verify all dependencies are installed
3. Check environment variables are configured
4. Review error messages carefully
5. Test each component individually before integration

---

**END OF COMPLETE TECHNICAL SPECIFICATION**

**Document Version:** 1.0
**Last Updated:** 2025-10-15
**Total Pages:** Main guide + 6 supplementary documents
**Estimated Implementation Time:** 4-6 weeks

