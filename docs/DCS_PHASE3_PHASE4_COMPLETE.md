# PHASE 3 (CONTINUED) & PHASE 4: ERROR BOUNDARIES, LOGGING, AND ENHANCEMENTS

This document contains error boundaries, logging implementation, and Phase 4 enhancements.

---

## 3.3 Add Error Boundaries (React)

### **3.3.1 Create Error Boundary Component**

**File:** `src/components/ErrorBoundary.jsx` (NEW)

```javascript
/**
 * Error Boundary Component
 * 
 * Catches React errors and displays fallback UI
 */

import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    if (this.props.resetOnError) {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 text-center mb-4">
              Something went wrong
            </h1>

            <p className="text-gray-600 text-center mb-6">
              We're sorry, but an unexpected error occurred. Your data is safe and has not been lost.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Error Details:</h3>
                <pre className="text-sm text-red-600 overflow-auto max-h-40">
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-700 hover:text-gray-900">
                      Component Stack
                    </summary>
                    <pre className="text-xs text-gray-600 mt-2 overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>

            <p className="text-sm text-gray-500 text-center mt-6">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### **3.3.2 Wrap App with Error Boundary**

**File:** `src/main.jsx` (UPDATE)

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AppProvider } from './context/AppContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary resetOnError={false}>
      <AppProvider>
        <App />
      </AppProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
```

---

## 3.4 Add Proper Logging (Backend)

### **3.4.1 Install Winston**

```bash
cd backend
npm install winston
```

### **3.4.2 Create Logger Service**

**File:** `backend/utils/logger.js` (NEW)

```javascript
/**
 * Logging Service
 * 
 * Centralized logging with Winston
 */

import winston from 'winston';
import fs from 'fs';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Create logs directory
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        logFormat
      )
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

export default logger;
```

### **3.4.3 Replace console.log with Logger**

Update all backend files to use logger:

```javascript
// BEFORE
console.log('Server running on port 3001');
console.error('Error:', error);

// AFTER
import logger from './utils/logger.js';

logger.info('Server running on port 3001');
logger.error('Error:', error);
```

---

## 3.5 Phase 3 Success Criteria

Phase 3 is complete when:

- ✅ Input validation on all endpoints
- ✅ Rate limiting applied
- ✅ Error boundaries in React app
- ✅ Winston logging implemented
- ✅ All console.log replaced
- ✅ No security vulnerabilities

---

## 🚀 PHASE 4: OPTIONAL ENHANCEMENTS

**Priority:** LOW  
**Timeline:** Week 5-6 (2 weeks)  
**Risk:** LOW  

### **Overview**

Optional improvements for production readiness.

---

## 4.1 TypeScript Migration (Optional)

### **Benefits**
- Catch 80% of bugs at compile time
- Better IDE autocomplete
- Self-documenting code
- Easier refactoring

### **Migration Steps**

```bash
# Install TypeScript
npm install --save-dev typescript @types/react @types/react-dom @types/node

# Create tsconfig.json
npx tsc --init

# Configure tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}

# Rename files gradually
# .js → .ts
# .jsx → .tsx
```

### **Example Type Definitions**

**File:** `src/types/api.ts` (NEW)

```typescript
export interface ExtractedData {
  demographics: {
    age: number | null;
    gender: string | null;
    mrn: string | null;
  };
  dates: {
    admission: string | null;
    surgery: string | null;
    discharge: string | null;
  };
  diagnosis: {
    primary: string | null;
    pathology: string | null;
    location: string | null;
    molecular: string | null;
  };
  procedures: Procedure[];
  imaging: {
    preOp: ImagingFinding[];
    postOp: ImagingFinding[];
  };
  neuroExam: NeuroExamFinding[];
  functionalScores: {
    kps: number | null;
    ecog: number | null;
    mrs: number | null;
    gcs: number | null;
  };
  complications: Complication[];
  medications: {
    preOp: Medication[];
    postOp: Medication[];
    discharge: Medication[];
  };
  consultations: Consultation[];
  discharge: {
    destination: string | null;
    followUp: FollowUp[];
  };
  labs: LabResult[];
}

export interface ExtractionResult {
  success: boolean;
  extracted: ExtractedData;
  confidence: Record<string, number>;
  metadata: {
    extractionMethod: string[];
    processingTime: number;
    noteCount: number;
    completeness: number;
  };
}
```

---

## 4.2 Add Comprehensive Testing

### **4.2.1 Unit Tests (Jest)**

```bash
# Install Jest
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**Example Test:** `src/services/__tests__/apiClient.test.js`

```javascript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import apiClient from '../apiClient.js';

describe('apiClient', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should extract medical data successfully', async () => {
    const mockResponse = {
      success: true,
      extracted: { demographics: { age: 45 } }
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await apiClient.extractMedicalData('test note');
    
    expect(result.success).toBe(true);
    expect(result.extracted.demographics.age).toBe(45);
  });

  it('should handle API errors gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(
      apiClient.extractMedicalData('test note')
    ).rejects.toThrow('Network error');
  });
});
```

### **4.2.2 E2E Tests (Playwright)**

```bash
# Install Playwright
npm install --save-dev @playwright/test
npx playwright install
```

**Example Test:** `tests/e2e/extraction.spec.js`

```javascript
import { test, expect } from '@playwright/test';

test('complete extraction workflow', async ({ page }) => {
  await page.goto('http://localhost:5173');

  await page.fill('textarea[placeholder*="paste"]', 'Patient is 45yo male with GBM');
  await page.click('button:has-text("Extract Data")');

  await page.waitForSelector('text=Extraction Complete', { timeout: 30000 });

  await expect(page.locator('text=45')).toBeVisible();
  await expect(page.locator('text=male')).toBeVisible();
});
```

---

## 4.3 Performance Monitoring

**File:** `src/utils/performance.js` (NEW)

```javascript
/**
 * Performance Monitoring
 */

export function measurePerformance(name, fn) {
  return async (...args) => {
    const start = performance.now();
    
    try {
      const result = await fn(...args);
      const duration = performance.now() - start;
      
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
      
      if (window.analytics) {
        window.analytics.track('performance', {
          operation: name,
          duration,
        });
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`❌ ${name} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  };
}
```

---

## 4.4 Health Monitoring Dashboard

**File:** `backend/routes/admin.js` (NEW)

```javascript
/**
 * Admin/Monitoring Routes
 */

import express from 'express';
import os from 'os';

const router = express.Router();

router.get('/health', async (_req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      limit: Math.round(os.totalmem() / 1024 / 1024),
    },
    cpu: {
      usage: process.cpuUsage(),
      cores: os.cpus().length,
    },
    services: {
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
    },
  };

  res.json(health);
});

export default router;
```

---

## ✅ FINAL CHECKLIST

### **Phase 1: Critical Fixes** ✅
- [ ] Fix syntax error in backend/server.js
- [ ] Fix property access error in extraction.js
- [ ] Remove all unused imports
- [ ] Verify build succeeds

### **Phase 2: Backend Migration** ✅
- [ ] Create apiClient.js
- [ ] Migrate LLM service
- [ ] Migrate extraction engine
- [ ] Migrate summary generator
- [ ] Update frontend components
- [ ] Delete migrated files
- [ ] Verify 65% bundle reduction

### **Phase 3: Code Quality** ✅
- [ ] Add input validation
- [ ] Add rate limiting
- [ ] Add error boundaries
- [ ] Replace console.log with logger

### **Phase 4: Enhancements** (Optional)
- [ ] Add TypeScript
- [ ] Add unit tests
- [ ] Add E2E tests
- [ ] Add performance monitoring

---

## 🎯 EXPECTED OUTCOMES

- ⚡ Bundle Size: 867KB → 300KB (65% reduction)
- ⚡ Load Time: 3s → 1s (67% faster)
- ⚡ Extraction Speed: 5s → 2s (60% faster)
- 🔒 API keys secure on backend
- 🔒 Input validation on all endpoints
- 🔒 Rate limiting prevents abuse
- ✅ Privacy-first design maintained
- ✅ HIPAA compliant
- ✅ No-extrapolation principle enforced

---

**END OF COMPLETE IMPLEMENTATION GUIDE**

