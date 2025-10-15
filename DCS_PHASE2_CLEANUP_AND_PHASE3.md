# PHASE 2: CLEANUP & PHASE 3: CODE QUALITY

This document contains Phase 2 cleanup procedures and complete Phase 3 implementation.

---

## 2.13 Delete Migrated Frontend Files

**IMPORTANT:** Create backup before deleting!

```bash
# Create backup
mkdir -p ../DCS_backup_$(date +%Y%m%d)
cp -r src/services ../DCS_backup_$(date +%Y%m%d)/

# Delete migrated files
rm src/services/extraction.js
rm src/services/llmService.js
rm src/services/summaryGenerator.js
rm src/services/deduplication.js
rm src/services/chronologicalContext.js
rm src/services/narrativeEngine.js
rm src/services/dataMerger.js
rm src/services/clinicalEvolution.js

# Verify remaining files
ls -la src/services/
```

**Expected remaining files:**
```
src/services/
├── apiClient.js          ← NEW (thin client)
├── validation.js         ← KEEP (immediate feedback)
├── ml/                   ← KEEP (privacy-first learning)
│   ├── learningEngine.js
│   ├── correctionTracker.js
│   └── patternMatcher.js
└── storage/              ← KEEP (local IndexedDB)
    ├── storageService.js
    └── indexedDB.js
```

---

## 2.14 Phase 2 Verification

### **Backend Verification**

```bash
cd backend

# Install all dependencies
npm install

# Start backend
npm start

# Test endpoints (in another terminal)
# Test health
curl http://localhost:3001/health

# Test extraction
curl -X POST http://localhost:3001/api/extract \
  -H "Content-Type: application/json" \
  -d '{"notes":"45yo male with GBM","options":{}}'

# Test LLM
curl -X POST http://localhost:3001/api/llm/extract \
  -H "Content-Type: application/json" \
  -d '{"text":"Patient with glioblastoma","provider":"claude"}'

# Test summary
curl -X POST http://localhost:3001/api/generate-summary \
  -H "Content-Type: application/json" \
  -d '{"extractedData":{"demographics":{"age":45}},"notes":"Test"}'
```

### **Frontend Verification**

```bash
cd ..

# Build frontend
npm run build

# Check bundle size
ls -lh dist/assets/

# Expected: ~300KB (down from 867KB)

# Start dev server
npm run dev

# Manual testing:
# 1. Open http://localhost:5173
# 2. Upload notes
# 3. Extract data
# 4. Generate summary
# 5. Verify no errors
```

### **Success Criteria**

Phase 2 is complete when:

- ✅ All backend services created
- ✅ All routes working
- ✅ Frontend uses apiClient
- ✅ Migrated files deleted
- ✅ Bundle size reduced by 65%
- ✅ All features work via API
- ✅ No console errors

---

## 🎨 PHASE 3: CODE QUALITY IMPROVEMENTS

**Priority:** MEDIUM  
**Timeline:** Week 4 (1 week)  
**Risk:** LOW  

### **Overview**

This phase adds validation, rate limiting, error boundaries, and proper logging.

---

## 3.1 Add Input Validation

### **3.1.1 Install Dependencies**

```bash
cd backend
npm install express-validator isomorphic-dompurify
```

### **3.1.2 Create Validation Middleware**

**File:** `backend/middleware/validation.js` (NEW)

```javascript
/**
 * Input Validation Middleware
 */

import { body, validationResult } from 'express-validator';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Handle validation errors
 */
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  
  next();
}

/**
 * Sanitize text input
 */
function sanitizeText(text) {
  if (typeof text !== 'string') return text;
  
  let sanitized = DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
  
  return sanitized.trim();
}

/**
 * Validate extraction request
 */
export const validateExtractionRequest = [
  body('notes')
    .exists().withMessage('Notes are required')
    .custom((value) => {
      if (typeof value === 'string') {
        return value.length > 0 && value.length < 1000000;
      }
      if (Array.isArray(value)) {
        return value.length > 0 && value.length < 100;
      }
      return false;
    })
    .withMessage('Invalid notes format')
    .customSanitizer((value) => {
      if (typeof value === 'string') {
        return sanitizeText(value);
      }
      if (Array.isArray(value)) {
        return value.map(note => sanitizeText(note));
      }
      return value;
    }),
  
  body('options')
    .optional()
    .isObject().withMessage('Options must be an object'),
  
  handleValidationErrors
];

/**
 * Validate LLM request
 */
export const validateLLMRequest = [
  body('text')
    .exists().withMessage('Text is required')
    .isString().withMessage('Text must be string')
    .isLength({ min: 1, max: 500000 }).withMessage('Text too long')
    .customSanitizer(sanitizeText),
  
  body('provider')
    .optional()
    .isIn(['claude', 'gpt4', 'gemini']).withMessage('Invalid provider'),
  
  handleValidationErrors
];

/**
 * Validate summary generation request
 */
export const validateSummaryRequest = [
  body('extractedData')
    .exists().withMessage('Extracted data is required')
    .isObject().withMessage('Extracted data must be object'),
  
  body('notes')
    .exists().withMessage('Notes are required'),
  
  body('options')
    .optional()
    .isObject().withMessage('Options must be object'),
  
  handleValidationErrors
];

export default {
  validateExtractionRequest,
  validateLLMRequest,
  validateSummaryRequest,
  handleValidationErrors,
};
```

### **3.1.3 Apply Validation to Routes**

Update routes to use validation:

```javascript
// backend/routes/extraction.js
import { validateExtractionRequest } from '../middleware/validation.js';

router.post('/extract', validateExtractionRequest, async (req, res) => {
  // ... handler
});

// backend/routes/llm.js
import { validateLLMRequest } from '../middleware/validation.js';

router.post('/extract', validateLLMRequest, async (req, res) => {
  // ... handler
});

// backend/routes/summary.js
import { validateSummaryRequest } from '../middleware/validation.js';

router.post('/generate-summary', validateSummaryRequest, async (req, res) => {
  // ... handler
});
```

---

## 3.2 Add Rate Limiting

### **3.2.1 Install Dependencies**

```bash
cd backend
npm install express-rate-limit
```

### **3.2.2 Create Rate Limiter Middleware**

**File:** `backend/middleware/rateLimiter.js` (NEW)

```javascript
/**
 * Rate Limiting Middleware
 */

import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * LLM endpoint rate limiter
 * 10 requests per minute per IP
 */
export const llmLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    error: 'Too many LLM requests, please slow down',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
});

/**
 * Extraction endpoint rate limiter
 * 20 requests per 5 minutes per IP
 */
export const extractionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: {
    error: 'Too many extraction requests, please wait',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Summary generation rate limiter
 * 10 requests per 10 minutes per IP
 */
export const summaryLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: {
    error: 'Too many summary generation requests, please wait',
    retryAfter: '10 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default {
  apiLimiter,
  llmLimiter,
  extractionLimiter,
  summaryLimiter,
};
```

### **3.2.3 Apply Rate Limiting to Server**

**File:** `backend/server.js` (UPDATE)

```javascript
import { 
  apiLimiter, 
  llmLimiter, 
  extractionLimiter, 
  summaryLimiter 
} from './middleware/rateLimiter.js';

// Apply rate limiting (BEFORE routes)
app.use('/api', apiLimiter);
app.use('/api/llm', llmLimiter);
app.use('/api/extract', extractionLimiter);
app.use('/api/generate-summary', summaryLimiter);

// Then mount routes...
```

---

*Continue to next section for error boundaries and logging...*

