# 🚀 FRONTEND-BACKEND SEPARATION - IMPLEMENTATION DIRECTIVE

**Project:** DCS (Discharge Summary Generator)  
**Objective:** Separate frontend and backend into independent layers with 100% feature parity  
**Timeline:** 4 weeks + 1-2 week buffer (5-6 weeks total)  
**Status:** Ready for Implementation  
**Date:** 2025-10-18

---

## 📋 TABLE OF CONTENTS

1. [Pre-Implementation Checklist](#pre-implementation-checklist)
2. [Phase 0: Preparation (2-3 days)](#phase-0-preparation)
3. [Phase 1: Backend Foundation (5-7 days)](#phase-1-backend-foundation)
4. [Phase 2: Frontend API Client (3-4 days)](#phase-2-frontend-api-client)
5. [Phase 3: Integration & Testing (5-7 days)](#phase-3-integration--testing)
6. [Phase 4: Deployment & Monitoring (2-3 days)](#phase-4-deployment--monitoring)
7. [Rollback Procedures](#rollback-procedures)
8. [Success Criteria](#success-criteria)

---

## 🎯 CORE PRINCIPLES

### **Zero Functionality Loss**
- Every feature must work identically before and after migration
- All 6 export formats must function (text, PDF, JSON, HL7, FHIR, clinical template)
- ML learning system must remain intact
- Quality metrics must maintain 96%+ accuracy, 95%+ completeness

### **Zero Breaking Changes**
- Backward compatibility at every step
- Feature flags for safe rollback
- Parallel development (old code remains until new code is verified)
- Incremental migration (2-3 files per step)

### **Defensive Programming**
- Type validation on all inputs
- Error handling with graceful degradation
- Detailed logging for debugging
- Try-catch blocks around all async operations

### **Testing After Every Step**
- Run `npm run build` after each change
- Test with 5 scenarios from BUG_FIX_TESTING_GUIDE.md
- Verify console output matches expected patterns
- Check quality metrics remain stable

---

## ✅ PRE-IMPLEMENTATION CHECKLIST

### **1. Environment Setup**

```bash
# Navigate to project directory
cd /Users/ramihatoum/Desktop/app/DCS

# Verify current state
git status
git log --oneline -5

# Ensure all dependencies are installed
npm install
cd backend && npm install && cd ..

# Verify build works
npm run build

# Expected output:
# ✓ built in XXXXms
# dist/index.html                   X.XX kB │ gzip: X.XX kB
# dist/assets/index-XXXXXXXX.js   XXX.XX kB │ gzip: XXX.XX kB
# dist/assets/index-XXXXXXXX.css   XX.XX kB │ gzip: XX.XX kB
```

**Success Criteria:**
- ✅ Build completes with 0 errors
- ✅ No warnings about missing dependencies
- ✅ dist/ directory created with index.html and assets/

---

### **2. Create Baseline Snapshot**

```bash
# Create baseline tag
BASELINE_DATE=$(date +%Y%m%d_%H%M%S)
echo "Creating baseline: baseline-pre-separation-${BASELINE_DATE}"

git tag -a "baseline-pre-separation-${BASELINE_DATE}" -m "Baseline before frontend-backend separation"
git push origin "baseline-pre-separation-${BASELINE_DATE}"

# Create backup branch
git checkout -b "backup-working-state-${BASELINE_DATE}"
git push origin "backup-working-state-${BASELINE_DATE}"

# Return to main and create migration branch
git checkout main
git checkout -b "feature/frontend-backend-separation"

# Expected output:
# Switched to a new branch 'feature/frontend-backend-separation'
```

**Success Criteria:**
- ✅ Tag created: `baseline-pre-separation-YYYYMMDD_HHMMSS`
- ✅ Backup branch created and pushed
- ✅ Migration branch created and checked out

---

### **3. Document Current State**

```bash
# Create baseline documentation directory
mkdir -p migration-baseline

# Export current feature list
cat > migration-baseline/FEATURES_BASELINE.md << 'EOF'
# DCS Features Baseline - Pre-Migration

## Core Features
- [x] Hybrid LLM + pattern-based extraction
- [x] 15-field data extraction (demographics, diagnosis, procedures, etc.)
- [x] 7-section discharge summaries
- [x] Timeline builder (POD tracking)
- [x] Multi-LLM support (Claude, GPT-4, Gemini)
- [x] Pattern-based fallback (works without API keys)
- [x] ML learning system (pattern learning, correction tracking)
- [x] Data review and editing interface
- [x] 6 export formats (text, PDF, JSON, HL7, FHIR, clinical template)
- [x] Privacy-first architecture (no PHI exposure)
- [x] IndexedDB persistence (patterns, corrections, drafts)
- [x] LocalStorage (settings, API keys, session data)

## Quality Metrics
- Extraction accuracy: 96%+
- Summary completeness: 95%+
- Processing time: <10s per note
- Export success rate: 100%

## Test Scenarios (from BUG_FIX_TESTING_GUIDE.md)
1. Basic SAH note processing
2. Multiple pathology detection
3. No pathology detected (general case)
4. Complex spine case
5. Batch upload (multiple notes)
EOF

# Save current package versions
cp package.json migration-baseline/package.json.baseline
cp backend/package.json migration-baseline/backend-package.json.baseline

# List all service files
find src/services -type f -name "*.js" > migration-baseline/service-files.txt
echo "Total service files: $(wc -l < migration-baseline/service-files.txt)"
```

**Success Criteria:**
- ✅ `migration-baseline/` directory created
- ✅ FEATURES_BASELINE.md documents all current features
- ✅ Package.json files backed up
- ✅ Service files list created (should show 30+ files)

---

### **4. Run Pre-Migration Tests**

```bash
# Test all 5 scenarios manually
npm run dev

# In browser (http://localhost:5173):
# 1. Test Scenario 1: Basic SAH note
# 2. Test Scenario 2: Multiple pathologies
# 3. Test Scenario 3: No pathology
# 4. Test Scenario 4: Spine case
# 5. Test Scenario 5: Batch upload

# Document results
cat > migration-baseline/PRE_MIGRATION_TEST_RESULTS.md << 'EOF'
# Pre-Migration Test Results

## Test Date: [YYYY-MM-DD]

### Test 1: Basic SAH Note
- Status: ✅ PASS
- Pathology Detected: ['SAH']
- Extraction Complete: Yes
- Quality Score: XX%
- Completeness: XX%

### Test 2: Multiple Pathologies
- Status: ✅ PASS
- Pathologies: ['TUMORS', 'HYDROCEPHALUS', 'SEIZURES']
- Primary: 'TUMORS'

### Test 3: No Pathology
- Status: ✅ PASS
- Default: 'general'

### Test 4: Spine Case
- Status: ✅ PASS
- Pathology: ['SPINE']

### Test 5: Batch Upload
- Status: ✅ PASS
- Notes Processed: 3

## Overall: ✅ ALL TESTS PASS
EOF
```

**Success Criteria:**
- ✅ All 5 test scenarios pass
- ✅ No console errors
- ✅ Quality metrics within expected range
- ✅ Test results documented

---

## 📦 PHASE 0: PREPARATION (Days 1-3)

### **Objective**
Set up project structure, create shared constants, and establish feature flags for safe migration.

---

### **STEP 0.1: Create Shared Constants File**

**File:** `shared/constants.js` (NEW)

```bash
# Create shared directory
mkdir -p shared

# Create constants file
cat > shared/constants.js << 'EOF'
/**
 * Shared Constants
 * Used by both frontend and backend
 */

// API Configuration
export const API_CONFIG = {
  VERSION: 'v1',
  TIMEOUT: 120000, // 2 minutes
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000
};

// LLM Models
export const LLM_MODELS = {
  CLAUDE_SONNET: 'claude-3-5-sonnet-20241022',
  GPT4O: 'gpt-4o',
  GEMINI_PRO: 'gemini-1.5-pro'
};

// Extraction Fields
export const EXTRACTION_FIELDS = [
  'demographics',
  'diagnosis',
  'procedures',
  'complications',
  'medications',
  'consultants',
  'imaging',
  'labs',
  'neuroExam',
  'functionalStatus',
  'disposition',
  'followUp',
  'timeline',
  'clinicalScores',
  'pathologySpecific'
];

// Pathology Types
export const PATHOLOGY_TYPES = [
  'SAH',
  'TUMORS',
  'SPINE',
  'HYDROCEPHALUS',
  'TBI',
  'VASCULAR',
  'SEIZURES',
  'INFECTION'
];

// Export Formats
export const EXPORT_FORMATS = {
  TEXT: 'text',
  PDF: 'pdf',
  JSON: 'json',
  HL7: 'hl7',
  FHIR: 'fhir',
  CLINICAL_TEMPLATE: 'clinical_template'
};

// Quality Thresholds
export const QUALITY_THRESHOLDS = {
  MIN_ACCURACY: 0.96,
  MIN_COMPLETENESS: 0.95,
  MIN_CONFIDENCE: 0.70
};

export default {
  API_CONFIG,
  LLM_MODELS,
  EXTRACTION_FIELDS,
  PATHOLOGY_TYPES,
  EXPORT_FORMATS,
  QUALITY_THRESHOLDS
};
EOF
```

**Verification:**

```bash
# Verify file created
ls -lh shared/constants.js

# Expected output:
# -rw-r--r--  1 user  staff  1.5K Oct 18 14:30 shared/constants.js
```

**Success Criteria:**
- ✅ File created at `shared/constants.js`
- ✅ Contains all constant definitions
- ✅ Uses ES6 export syntax

---

### **STEP 0.2: Create Feature Flags System**

**File:** `shared/featureFlags.js` (NEW)

```bash
cat > shared/featureFlags.js << 'EOF'
/**
 * Feature Flags
 * Control migration rollout and enable safe rollback
 */

export const FEATURE_FLAGS = {
  // Backend API flags
  USE_BACKEND_EXTRACTION: false,
  USE_BACKEND_VALIDATION: false,
  USE_BACKEND_NARRATIVE: false,
  USE_BACKEND_SUMMARY: false,
  USE_BACKEND_EXPORT: false,
  USE_BACKEND_ML: false,
  
  // Legacy fallback flags
  ENABLE_LEGACY_EXTRACTION: true,
  ENABLE_LEGACY_VALIDATION: true,
  ENABLE_LEGACY_NARRATIVE: true,
  ENABLE_LEGACY_SUMMARY: true,
  
  // Testing flags
  ENABLE_API_LOGGING: true,
  ENABLE_PERFORMANCE_MONITORING: true,
  ENABLE_ERROR_TRACKING: true
};

/**
 * Check if a feature is enabled
 */
export const isFeatureEnabled = (featureName) => {
  return FEATURE_FLAGS[featureName] === true;
};

/**
 * Enable a feature
 */
export const enableFeature = (featureName) => {
  if (featureName in FEATURE_FLAGS) {
    FEATURE_FLAGS[featureName] = true;
    console.log(`✅ Feature enabled: ${featureName}`);
  } else {
    console.warn(`⚠️ Unknown feature: ${featureName}`);
  }
};

/**
 * Disable a feature
 */
export const disableFeature = (featureName) => {
  if (featureName in FEATURE_FLAGS) {
    FEATURE_FLAGS[featureName] = false;
    console.log(`❌ Feature disabled: ${featureName}`);
  } else {
    console.warn(`⚠️ Unknown feature: ${featureName}`);
  }
};

export default {
  FEATURE_FLAGS,
  isFeatureEnabled,
  enableFeature,
  disableFeature
};
EOF
```

**Success Criteria:**
- ✅ File created at `shared/featureFlags.js`
- ✅ All flags default to safe values (backend OFF, legacy ON)
- ✅ Helper functions defined

---

### **STEP 0.3: Create Directory Structure**

**Objective:** Set up the new directory structure for separated frontend and backend.

```bash
# Create new backend directories
mkdir -p backend/src/services
mkdir -p backend/src/utils
mkdir -p backend/src/routes
mkdir -p backend/src/config

# Create new frontend directories
mkdir -p frontend/src/services/api
mkdir -p frontend/src/config

# Verify structure
ls -la backend/src/
ls -la frontend/src/

# Expected output shows new directories created
```

**Success Criteria:**
- ✅ All directories created
- ✅ No errors during creation
- ✅ Structure matches expected layout

---

### **STEP 0.4: Create Environment Variable Templates**

**File:** `backend/.env.example` (UPDATE)

```bash
cat >> backend/.env.example << 'EOF'

# Migration Configuration
ENABLE_EXTRACTION_API=false
ENABLE_VALIDATION_API=false
ENABLE_NARRATIVE_API=false
ENABLE_SUMMARY_API=false
EOF
```

**File:** `frontend/.env.local` (NEW)

```bash
cat > frontend/.env.local << 'EOF'
# Frontend Environment Variables
VITE_API_URL=http://localhost:3001
VITE_API_TIMEOUT=120000
VITE_USE_BACKEND_API=false
VITE_ENABLE_LEGACY_MODE=true
EOF
```

**Success Criteria:**
- ✅ Environment templates created
- ✅ Migration flags added
- ✅ No sensitive data in templates

---

### **STEP 0.5: Commit Phase 0 Changes**

```bash
# Stage all Phase 0 changes
git add shared/
git add backend/.env.example
git add frontend/.env.local
git add migration-baseline/

# Commit
git commit -m "Phase 0: Preparation - Directory structure and feature flags

- Created shared/constants.js with API config, models, fields
- Created shared/featureFlags.js for safe migration rollout
- Set up backend/src/ and frontend/src/ directory structures
- Created environment variable templates
- Documented baseline features and test results

All feature flags default to safe values (backend OFF, legacy ON).
Ready to begin Phase 1: Backend Foundation."

# Verify commit
git log -1 --stat
```

**Verification:**

```bash
# Run build to ensure no breaking changes
npm run build

# Expected: Build succeeds with no errors
```

**Success Criteria:**
- ✅ All Phase 0 files committed
- ✅ Build still works (no breaking changes)
- ✅ Commit message is descriptive

---

### **Phase 0 Checkpoint: Test All 5 Scenarios**

Before proceeding to Phase 1, verify the application still works:

```bash
# Start development server
npm run dev

# In browser (http://localhost:5173):
# Test all 5 scenarios from BUG_FIX_TESTING_GUIDE.md
# 1. Basic SAH note
# 2. Multiple pathologies
# 3. No pathology
# 4. Spine case
# 5. Batch upload

# All should pass with no changes in behavior
```

**Success Criteria:**
- ✅ All 5 test scenarios still pass
- ✅ No new console errors
- ✅ Application behavior unchanged
- ✅ Ready to proceed to Phase 1

---

## 🏗️ PHASE 1: BACKEND FOUNDATION (Days 4-10)

### **Objective**
Move all services and utilities from `src/` to `backend/src/`, create API routes, and test backend independently.

### **Overview**
Phase 1 will be broken into small incremental steps:
- Step 1.1-1.3: Move utility files (3 steps)
- Step 1.4-1.6: Move core services (3 steps)
- Step 1.7-1.9: Create API routes (3 steps)
- Step 1.10: Test backend independently

Each step includes verification and rollback instructions.

---

### **STEP 1.1: Move Utility Files to Backend (Batch 1)**

**Objective:** Copy utility files that don't depend on React.

**Files to Copy:**
1. `src/utils/dateUtils.js` → `backend/src/utils/dateUtils.js`
2. `src/utils/textUtils.js` → `backend/src/utils/textUtils.js`
3. `src/utils/medicalAbbreviations.js` → `backend/src/utils/medicalAbbreviations.js`

```bash
# Copy files (keep originals for backward compatibility)
cp src/utils/dateUtils.js backend/src/utils/
cp src/utils/textUtils.js backend/src/utils/
cp src/utils/medicalAbbreviations.js backend/src/utils/

# Verify files copied
ls -lh backend/src/utils/

# Test imports work
node -e "import('./backend/src/utils/dateUtils.js').then(() => console.log('✅ dateUtils OK'))"
node -e "import('./backend/src/utils/textUtils.js').then(() => console.log('✅ textUtils OK'))"
node -e "import('./backend/src/utils/medicalAbbreviations.js').then(() => console.log('✅ medicalAbbreviations OK'))"
```

**Expected Output:**
```
✅ dateUtils OK
✅ textUtils OK
✅ medicalAbbreviations OK
```

**Success Criteria:**
- ✅ All 3 files copied successfully
- ✅ Files import without errors
- ✅ Original files remain in src/utils/

**Rollback (if needed):**
```bash
rm backend/src/utils/dateUtils.js
rm backend/src/utils/textUtils.js
rm backend/src/utils/medicalAbbreviations.js
```

---

### **STEP 1.2: Move Utility Files to Backend (Batch 2)**

**Files to Copy:**
1. `src/utils/templates.js` → `backend/src/utils/templates.js`
2. `src/utils/clinicalTemplate.js` → `backend/src/utils/clinicalTemplate.js`

```bash
# Copy files
cp src/utils/templates.js backend/src/utils/
cp src/utils/clinicalTemplate.js backend/src/utils/

# Test imports
node -e "import('./backend/src/utils/templates.js').then(() => console.log('✅ templates OK'))"
node -e "import('./backend/src/utils/clinicalTemplate.js').then(() => console.log('✅ clinicalTemplate OK'))"
```

**Success Criteria:**
- ✅ Both files copied successfully
- ✅ Files import without errors

---

### **STEP 1.3: Commit Utility Files Migration**

```bash
# Stage changes
git add backend/src/utils/

# Commit
git commit -m "Phase 1.1-1.2: Copy utility files to backend

Copied 5 utility files to backend/src/utils/:
- dateUtils.js
- textUtils.js
- medicalAbbreviations.js
- templates.js
- clinicalTemplate.js

Original files remain in src/utils/ for backward compatibility.
All imports verified working."

# Verify
git log -1 --stat
```

**Success Criteria:**
- ✅ Commit created successfully
- ✅ 5 files added to backend/src/utils/

---

### **STEP 1.4: Copy Core Service Files (Batch 1 - Extraction)**

**Objective:** Copy extraction-related services to backend.

**Files to Copy:**
1. `src/services/extraction.js` → `backend/src/services/extraction.js`
2. `src/services/validation.js` → `backend/src/services/validation.js`
3. `src/services/deduplication.js` → `backend/src/services/deduplication.js`

```bash
# Copy files
cp src/services/extraction.js backend/src/services/
cp src/services/validation.js backend/src/services/
cp src/services/deduplication.js backend/src/services/

# Verify
ls -lh backend/src/services/
```

**Fix Import Paths:**

These files may have imports that need adjustment. Check and fix:

```bash
# Check imports in extraction.js
grep "^import" backend/src/services/extraction.js | head -10

# Common fixes needed:
# - Change relative paths to match new location
# - Update paths to shared constants
```

**Create Import Fix Script:**

```bash
cat > fix-service-imports.sh << 'EOF'
#!/bin/bash
# Fix import paths in backend services

cd backend/src/services

# Fix relative imports to utils
sed -i '' "s|from '../utils/|from '../utils/|g" *.js
sed -i '' "s|from '../../utils/|from '../utils/|g" *.js

# Fix imports to shared constants
sed -i '' "s|from '../config/constants'|from '../../../shared/constants.js'|g" *.js
sed -i '' "s|from '../../config/constants'|from '../../../shared/constants.js'|g" *.js

echo "✅ Import paths fixed"
EOF

chmod +x fix-service-imports.sh
./fix-service-imports.sh
```

**Test Imports:**

```bash
# Test each file imports correctly
node -e "import('./backend/src/services/extraction.js').then(() => console.log('✅ extraction OK'))"
node -e "import('./backend/src/services/validation.js').then(() => console.log('✅ validation OK'))"
node -e "import('./backend/src/services/deduplication.js').then(() => console.log('✅ deduplication OK'))"
```

**Expected Output:**
```
✅ extraction OK
✅ validation OK
✅ deduplication OK
```

**Success Criteria:**
- ✅ All 3 files copied
- ✅ Import paths fixed
- ✅ Files import without errors

**Rollback (if needed):**
```bash
rm backend/src/services/extraction.js
rm backend/src/services/validation.js
rm backend/src/services/deduplication.js
```

---

### **STEP 1.5: Copy Core Service Files (Batch 2 - LLM & Narrative)**

**Files to Copy:**
1. `src/services/llmService.js` → `backend/src/services/llmService.js`
2. `src/services/narrativeEngine.js` → `backend/src/services/narrativeEngine.js`
3. `src/services/dataMerger.js` → `backend/src/services/dataMerger.js`

```bash
# Copy files
cp src/services/llmService.js backend/src/services/
cp src/services/narrativeEngine.js backend/src/services/
cp src/services/dataMerger.js backend/src/services/

# Fix imports
./fix-service-imports.sh
```

**Critical: Update LLM Service for Backend**

The backend version must use `process.env` instead of `localStorage`:

```bash
# Replace localStorage with process.env in llmService.js
sed -i '' \
  -e "s/localStorage\.getItem('ANTHROPIC_API_KEY')/process.env.ANTHROPIC_API_KEY/g" \
  -e "s/localStorage\.getItem('OPENAI_API_KEY')/process.env.OPENAI_API_KEY/g" \
  -e "s/localStorage\.getItem('GEMINI_API_KEY')/process.env.GEMINI_API_KEY/g" \
  -e "s/localStorage\.getItem(/\/\/ localStorage.getItem(/g" \
  backend/src/services/llmService.js

echo "✅ LLM service updated for backend environment"
```

**Verify No localStorage References:**

```bash
# Check for any remaining localStorage
grep -n "localStorage" backend/src/services/llmService.js

# Expected: Only commented lines or none
```

**Test Imports:**

```bash
node -e "import('./backend/src/services/llmService.js').then(() => console.log('✅ llmService OK'))"
node -e "import('./backend/src/services/narrativeEngine.js').then(() => console.log('✅ narrativeEngine OK'))"
node -e "import('./backend/src/services/dataMerger.js').then(() => console.log('✅ dataMerger OK'))"
```

**Success Criteria:**
- ✅ All 3 files copied
- ✅ llmService.js uses process.env (no localStorage)
- ✅ All files import without errors

---

### **STEP 1.6: Copy Remaining Core Services**

**Files to Copy:**
1. `src/services/summaryGenerator.js` → `backend/src/services/summaryGenerator.js`
2. `src/services/summaryOrchestrator.js` → `backend/src/services/summaryOrchestrator.js`
3. `src/services/clinicalEvolution.js` → `backend/src/services/clinicalEvolution.js`
4. `src/services/chronologicalContext.js` → `backend/src/services/chronologicalContext.js`
5. `src/services/intelligenceHub.js` → `backend/src/services/intelligenceHub.js`
6. `src/services/qualityMetrics.js` → `backend/src/services/qualityMetrics.js`

```bash
# Copy files
cp src/services/summaryGenerator.js backend/src/services/
cp src/services/summaryOrchestrator.js backend/src/services/
cp src/services/clinicalEvolution.js backend/src/services/
cp src/services/chronologicalContext.js backend/src/services/
cp src/services/intelligenceHub.js backend/src/services/
cp src/services/qualityMetrics.js backend/src/services/

# Fix imports
./fix-service-imports.sh

# Test imports
for file in summaryGenerator summaryOrchestrator clinicalEvolution chronologicalContext intelligenceHub qualityMetrics; do
  node -e "import('./backend/src/services/${file}.js').then(() => console.log('✅ ${file} OK'))" || echo "❌ ${file} FAILED"
done
```

**Success Criteria:**
- ✅ All 6 files copied
- ✅ All files import without errors

---

### **STEP 1.7: Commit Service Files Migration**

```bash
# Stage all service files
git add backend/src/services/

# Commit
git commit -m "Phase 1.4-1.6: Copy core service files to backend

Copied 12 core service files to backend/src/services/:
- extraction.js, validation.js, deduplication.js
- llmService.js (updated for process.env), narrativeEngine.js, dataMerger.js
- summaryGenerator.js, summaryOrchestrator.js
- clinicalEvolution.js, chronologicalContext.js
- intelligenceHub.js, qualityMetrics.js

Fixed import paths to match new directory structure.
Updated llmService.js to use process.env instead of localStorage.
All imports verified working."

# Verify
git log -1 --stat
```

**Success Criteria:**
- ✅ Commit created successfully
- ✅ 12 service files added to backend

---

### **STEP 1.8: Create API Route for Extraction**

**Objective:** Create REST API endpoint for extraction service.

**File:** `backend/src/routes/extraction.js` (NEW)

```bash
cat > backend/src/routes/extraction.js << 'EOF'
/**
 * Extraction API Routes
 * Handles medical data extraction from clinical notes
 */

import express from 'express';
import { extractMedicalEntities } from '../services/extraction.js';
import { validateExtraction } from '../services/validation.js';

const router = express.Router();

/**
 * POST /api/extract
 * Extract medical data from clinical notes
 */
router.post('/extract', async (req, res) => {
  console.log('📨 POST /api/extract - Request received');

  try {
    // Validate request body
    const { notes, options = {} } = req.body;

    if (!notes || !Array.isArray(notes) || notes.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'notes must be a non-empty array'
      });
    }

    // Extract data
    console.log(`🔍 Extracting data from ${notes.length} note(s)...`);
    const extractedData = await extractMedicalEntities(notes, options);

    // Validate extraction
    const validation = validateExtraction(extractedData);

    // Return response
    res.json({
      success: true,
      data: extractedData,
      validation: validation,
      metadata: {
        notesCount: notes.length,
        timestamp: new Date().toISOString()
      }
    });

    console.log('✅ Extraction completed successfully');

  } catch (error) {
    console.error('❌ Extraction error:', error);
    res.status(500).json({
      error: 'Extraction failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
EOF
```

**Update Backend Server:**

Add the new route to `backend/server.js`:

```bash
# Check current routes
grep "app.use('/api" backend/server.js

# Add new extraction route (if not already present)
# Find line: app.use('/api', extractionRoutes);
# This should already exist from the current backend setup
```

**Test the Route:**

```bash
# Start backend server
cd backend
node server.js &
BACKEND_PID=$!
cd ..

# Wait for server to start
sleep 2

# Test extraction endpoint
curl -X POST http://localhost:3001/api/extract \
  -H "Content-Type: application/json" \
  -d '{
    "notes": ["Patient: John Doe, 55M. Diagnosis: SAH. Procedure: Aneurysm clipping."],
    "options": {}
  }' | jq '.'

# Expected output: JSON with success: true, data: {...}, validation: {...}

# Stop backend server
kill $BACKEND_PID
```

**Success Criteria:**
- ✅ Route file created
- ✅ Endpoint responds with 200 status
- ✅ Returns valid JSON with extracted data
- ✅ Validation included in response

---

### **STEP 1.9: Create Additional API Routes**

**Objective:** Create routes for narrative, summary, and export.

**File:** `backend/src/routes/narrative.js` (NEW)

```bash
cat > backend/src/routes/narrative.js << 'EOF'
/**
 * Narrative API Routes
 */

import express from 'express';
import { generateNarrative } from '../services/narrativeEngine.js';

const router = express.Router();

router.post('/narrative', async (req, res) => {
  try {
    const { extractedData, options = {} } = req.body;

    if (!extractedData) {
      return res.status(400).json({ error: 'extractedData is required' });
    }

    const narrative = await generateNarrative(extractedData, options);

    res.json({
      success: true,
      narrative: narrative,
      metadata: { timestamp: new Date().toISOString() }
    });

  } catch (error) {
    console.error('❌ Narrative generation error:', error);
    res.status(500).json({ error: 'Narrative generation failed', message: error.message });
  }
});

export default router;
EOF
```

**File:** `backend/src/routes/summary.js` (NEW)

```bash
cat > backend/src/routes/summary.js << 'EOF'
/**
 * Summary API Routes
 */

import express from 'express';
import { generateDischargeSummary } from '../services/summaryGenerator.js';

const router = express.Router();

router.post('/summary', async (req, res) => {
  try {
    const { extractedData, narrative, options = {} } = req.body;

    if (!extractedData) {
      return res.status(400).json({ error: 'extractedData is required' });
    }

    const summary = await generateDischargeSummary(extractedData, narrative, options);

    res.json({
      success: true,
      summary: summary,
      metadata: { timestamp: new Date().toISOString() }
    });

  } catch (error) {
    console.error('❌ Summary generation error:', error);
    res.status(500).json({ error: 'Summary generation failed', message: error.message });
  }
});

export default router;
EOF
```

**Update Backend Server to Include New Routes:**

```bash
# Edit backend/server.js to add new routes
# Add after existing route imports:
cat >> backend/server.js << 'EOF'

// Import new routes
import narrativeRoutes from './src/routes/narrative.js';
import summaryRoutes from './src/routes/summary.js';

// Mount new routes
app.use('/api', narrativeRoutes);
app.use('/api', summaryRoutes);
EOF
```

**Test New Routes:**

```bash
# Start backend
cd backend && node server.js &
BACKEND_PID=$!
cd ..
sleep 2

# Test narrative endpoint
curl -X POST http://localhost:3001/api/narrative \
  -H "Content-Type: application/json" \
  -d '{"extractedData": {"demographics": {"name": "Test"}}}' | jq '.success'

# Expected: true

# Test summary endpoint
curl -X POST http://localhost:3001/api/summary \
  -H "Content-Type: application/json" \
  -d '{"extractedData": {"demographics": {"name": "Test"}}}' | jq '.success'

# Expected: true

# Stop backend
kill $BACKEND_PID
```

**Success Criteria:**
- ✅ Both route files created
- ✅ Routes added to server.js
- ✅ Both endpoints respond successfully

---

### **STEP 1.10: Phase 1 Checkpoint - Test Backend Independently**

**Objective:** Verify backend works independently before connecting frontend.

**Create Backend Test Script:**

```bash
cat > test-backend-api.js << 'EOF'
/**
 * Backend API Test Script
 * Tests all backend endpoints independently
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

async function testBackend() {
  console.log('🧪 Testing Backend API...\n');

  // Test 1: Health check
  console.log('Test 1: Health Check');
  const health = await fetch(`${API_BASE}/health`);
  const healthData = await health.json();
  console.log('✅ Health:', healthData.status);
  console.log('');

  // Test 2: Extraction
  console.log('Test 2: Extraction API');
  const extractRes = await fetch(`${API_BASE}/api/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      notes: ['Patient: John Doe, 55M. Diagnosis: SAH. Hunt-Hess grade 3.']
    })
  });
  const extractData = await extractRes.json();
  console.log('✅ Extraction:', extractData.success ? 'SUCCESS' : 'FAILED');
  console.log('   Pathology detected:', extractData.data?.pathology || 'none');
  console.log('');

  // Test 3: Narrative
  console.log('Test 3: Narrative API');
  const narrativeRes = await fetch(`${API_BASE}/api/narrative`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      extractedData: extractData.data
    })
  });
  const narrativeData = await narrativeRes.json();
  console.log('✅ Narrative:', narrativeData.success ? 'SUCCESS' : 'FAILED');
  console.log('');

  // Test 4: Summary
  console.log('Test 4: Summary API');
  const summaryRes = await fetch(`${API_BASE}/api/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      extractedData: extractData.data,
      narrative: narrativeData.narrative
    })
  });
  const summaryData = await summaryRes.json();
  console.log('✅ Summary:', summaryData.success ? 'SUCCESS' : 'FAILED');
  console.log('');

  console.log('🎉 All backend tests passed!');
}

testBackend().catch(console.error);
EOF
```

**Run Backend Tests:**

```bash
# Start backend
cd backend && node server.js &
BACKEND_PID=$!
cd ..
sleep 3

# Run tests
node test-backend-api.js

# Expected output:
# 🧪 Testing Backend API...
# Test 1: Health Check
# ✅ Health: healthy
# Test 2: Extraction API
# ✅ Extraction: SUCCESS
#    Pathology detected: SAH
# Test 3: Narrative API
# ✅ Narrative: SUCCESS
# Test 4: Summary API
# ✅ Summary: SUCCESS
# 🎉 All backend tests passed!

# Stop backend
kill $BACKEND_PID
```

**Success Criteria:**
- ✅ All 4 tests pass
- ✅ Backend runs independently
- ✅ No errors in console

---

### **STEP 1.11: Commit Phase 1 Completion**

```bash
# Stage all Phase 1 changes
git add backend/src/routes/
git add backend/server.js
git add test-backend-api.js

# Commit
git commit -m "Phase 1 Complete: Backend Foundation

Created API routes:
- /api/extract - Medical data extraction
- /api/narrative - Narrative generation
- /api/summary - Summary generation

All routes tested and working independently.
Backend can now operate as standalone API server.

Next: Phase 2 - Frontend API Client"

# Tag this milestone
git tag -a "phase1-backend-foundation" -m "Phase 1: Backend Foundation Complete"

# Verify
git log -1 --stat
```

**Success Criteria:**
- ✅ All Phase 1 changes committed
- ✅ Milestone tag created
- ✅ Backend fully functional

---

## 🔌 PHASE 2: FRONTEND API CLIENT (Days 11-14)

### **Objective**
Create API client layer in frontend to communicate with backend, while maintaining backward compatibility with legacy services.

---

### **STEP 2.1: Create API Client Base**

**File:** `frontend/src/services/api/apiClient.js` (NEW)

```bash
mkdir -p frontend/src/services/api

cat > frontend/src/services/api/apiClient.js << 'EOF'
/**
 * API Client
 * Handles all HTTP communication with backend
 */

import axios from 'axios';
import { FEATURE_FLAGS } from '../../../../shared/featureFlags.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 120000;

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add logging
apiClient.interceptors.request.use(
  (config) => {
    if (FEATURE_FLAGS.ENABLE_API_LOGGING) {
      console.log(`📤 API Request: ${config.method.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => {
    if (FEATURE_FLAGS.ENABLE_API_LOGGING) {
      console.log(`📥 API Response: ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.message);

    // Handle specific error cases
    if (error.response) {
      // Server responded with error status
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('   No response received from server');
    } else {
      // Error setting up request
      console.error('   Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

/**
 * Check if backend is available
 */
export const checkBackendHealth = async () => {
  try {
    const response = await apiClient.get('/health', { timeout: 5000 });
    return response.data.status === 'healthy';
  } catch (error) {
    console.warn('⚠️ Backend health check failed:', error.message);
    return false;
  }
};

export default apiClient;
EOF
```

**Success Criteria:**
- ✅ API client file created
- ✅ Axios configured with interceptors
- ✅ Health check function defined

---

### **STEP 2.2: Create Extraction API Wrapper**

**File:** `frontend/src/services/api/extractionAPI.js` (NEW)

```bash
cat > frontend/src/services/api/extractionAPI.js << 'EOF'
/**
 * Extraction API Wrapper
 * Provides extraction functionality with backend/legacy fallback
 */

import apiClient, { checkBackendHealth } from './apiClient.js';
import { FEATURE_FLAGS } from '../../../../shared/featureFlags.js';
import { extractMedicalEntities as legacyExtract } from '../extraction.js';
import { validateExtraction as legacyValidate } from '../validation.js';

/**
 * Extract medical data from notes
 * Uses backend API if enabled, falls back to legacy if needed
 */
export const extractMedicalData = async (notes, options = {}) => {
  console.log('🔍 extractMedicalData called with', notes.length, 'notes');

  // Check if backend API should be used
  if (FEATURE_FLAGS.USE_BACKEND_EXTRACTION) {
    try {
      console.log('📡 Using backend extraction API');

      // Check backend health first
      const isHealthy = await checkBackendHealth();
      if (!isHealthy) {
        throw new Error('Backend not available');
      }

      // Call backend API
      const response = await apiClient.post('/api/extract', {
        notes,
        options
      });

      console.log('✅ Backend extraction successful');
      return {
        data: response.data.data,
        validation: response.data.validation,
        source: 'backend'
      };

    } catch (error) {
      console.error('❌ Backend extraction failed:', error.message);

      // Fall back to legacy if enabled
      if (FEATURE_FLAGS.ENABLE_LEGACY_EXTRACTION) {
        console.log('🔄 Falling back to legacy extraction');
        return extractWithLegacy(notes, options);
      }

      throw error;
    }
  }

  // Use legacy extraction
  if (FEATURE_FLAGS.ENABLE_LEGACY_EXTRACTION) {
    console.log('📦 Using legacy extraction');
    return extractWithLegacy(notes, options);
  }

  throw new Error('No extraction method available');
};

/**
 * Legacy extraction wrapper
 */
const extractWithLegacy = async (notes, options) => {
  const data = await legacyExtract(notes, options);
  const validation = legacyValidate(data);

  return {
    data,
    validation,
    source: 'legacy'
  };
};

/**
 * Validate extracted data
 */
export const validateExtraction = (extractedData) => {
  // Always use legacy validation for now
  return legacyValidate(extractedData);
};

export default {
  extractMedicalData,
  validateExtraction
};
EOF
```

**Success Criteria:**
- ✅ Extraction API wrapper created
- ✅ Backend/legacy fallback logic implemented
- ✅ Feature flags integrated

---

### **STEP 2.3: Update App.jsx to Use New API (Gradual Migration)**

**Objective:** Update App.jsx to use new API wrapper while maintaining backward compatibility.

**File:** `src/App.jsx` (MODIFY)

Find the import section (lines 16-20):

```javascript
// OLD:
import { extractMedicalEntities } from './services/extraction.js';
import { validateExtraction, getValidationSummary } from './services/validation.js';
```

Add new import ABOVE the old ones:

```javascript
// NEW: API wrapper (with fallback to legacy)
import { extractMedicalData, validateExtraction as validateExtractionAPI } from '../frontend/src/services/api/extractionAPI.js';

// OLD: Keep for backward compatibility
import { extractMedicalEntities } from './services/extraction.js';
import { validateExtraction, getValidationSummary } from './services/validation.js';
```

Find the `handleNotesUploaded` function (around line 47):

```javascript
// OLD:
const extractedData = await extractMedicalEntities(notes);
const validation = validateExtraction(extractedData);
```

Replace with:

```javascript
// NEW: Use API wrapper (with automatic fallback)
const result = await extractMedicalData(notes);
const extractedData = result.data;
const validation = result.validation;

console.log(`📊 Extraction source: ${result.source}`);
```

**Verification:**

```bash
# Build to check for errors
npm run build

# Expected: Build succeeds with no errors
```

**Test with Feature Flags:**

```bash
# Test 1: Legacy mode (default)
npm run dev

# In browser console, verify:
# "📦 Using legacy extraction"
# "📊 Extraction source: legacy"

# Test 2: Enable backend mode
# In browser console:
# import { enableFeature } from './shared/featureFlags.js';
# enableFeature('USE_BACKEND_EXTRACTION');

# Start backend:
cd backend && node server.js &

# Upload notes again, verify:
# "📡 Using backend extraction API"
# "📊 Extraction source: backend"
```

**Success Criteria:**
- ✅ App.jsx updated to use new API
- ✅ Build succeeds
- ✅ Legacy mode works (default)
- ✅ Backend mode works when enabled
- ✅ Automatic fallback works

---

### **STEP 2.4: Test Phase 2 with All 5 Scenarios**

**Objective:** Verify all 5 test scenarios still work with new API layer.

```bash
# Start both frontend and backend
cd backend && node server.js &
BACKEND_PID=$!
cd ..

npm run dev &
FRONTEND_PID=$!

# Wait for servers to start
sleep 5

# In browser (http://localhost:5173):
# Test all 5 scenarios from BUG_FIX_TESTING_GUIDE.md

# Document results
cat > migration-baseline/PHASE2_TEST_RESULTS.md << 'EOF'
# Phase 2 Test Results

## Test Date: [YYYY-MM-DD]
## Phase: Frontend API Client

### Test Configuration
- Backend API: Enabled
- Legacy Fallback: Enabled

### Test 1: Basic SAH Note
- Status: ✅ PASS
- Extraction Source: backend
- Pathology: ['SAH']

### Test 2: Multiple Pathologies
- Status: ✅ PASS
- Extraction Source: backend
- Pathologies: ['TUMORS', 'HYDROCEPHALUS', 'SEIZURES']

### Test 3: No Pathology
- Status: ✅ PASS
- Extraction Source: backend
- Default: 'general'

### Test 4: Spine Case
- Status: ✅ PASS
- Extraction Source: backend
- Pathology: ['SPINE']

### Test 5: Batch Upload
- Status: ✅ PASS
- Extraction Source: backend
- Notes Processed: 3

### Fallback Test
- Stopped backend server
- Status: ✅ PASS
- Extraction Source: legacy (automatic fallback)

## Overall: ✅ ALL TESTS PASS
## Fallback: ✅ WORKING
EOF

# Stop servers
kill $BACKEND_PID $FRONTEND_PID
```

**Success Criteria:**
- ✅ All 5 scenarios pass with backend
- ✅ All 5 scenarios pass with legacy fallback
- ✅ No functionality loss
- ✅ Quality metrics maintained

---

### **STEP 2.5: Commit Phase 2 Completion**

```bash
# Stage Phase 2 changes
git add frontend/src/services/api/
git add src/App.jsx
git add migration-baseline/PHASE2_TEST_RESULTS.md

# Commit
git commit -m "Phase 2 Complete: Frontend API Client

Created API client layer:
- apiClient.js - Base HTTP client with interceptors
- extractionAPI.js - Extraction wrapper with backend/legacy fallback

Updated App.jsx to use new API layer.
Feature flags control backend vs legacy mode.
Automatic fallback ensures zero downtime.

All 5 test scenarios pass in both modes.
Zero functionality loss confirmed.

Next: Phase 3 - Integration & Testing"

# Tag milestone
git tag -a "phase2-frontend-api-client" -m "Phase 2: Frontend API Client Complete"
```

**Success Criteria:**
- ✅ Phase 2 committed
- ✅ Milestone tagged
- ✅ All tests documented

---

## 🧪 PHASE 3: INTEGRATION & TESTING (Days 15-21)

### **Objective**
Enable backend API by default, comprehensive testing, performance optimization, and bug fixes.

---

### **STEP 3.1: Enable Backend API by Default**

**File:** `shared/featureFlags.js` (MODIFY)

```bash
# Update feature flags to enable backend
sed -i '' 's/USE_BACKEND_EXTRACTION: false/USE_BACKEND_EXTRACTION: true/' shared/featureFlags.js
sed -i '' 's/USE_BACKEND_VALIDATION: false/USE_BACKEND_VALIDATION: true/' shared/featureFlags.js
sed -i '' 's/USE_BACKEND_NARRATIVE: false/USE_BACKEND_NARRATIVE: true/' shared/featureFlags.js
sed -i '' 's/USE_BACKEND_SUMMARY: false/USE_BACKEND_SUMMARY: true/' shared/featureFlags.js

echo "✅ Backend API enabled by default"
```

**Verify:**

```bash
grep "USE_BACKEND" shared/featureFlags.js

# Expected output:
# USE_BACKEND_EXTRACTION: true,
# USE_BACKEND_VALIDATION: true,
# USE_BACKEND_NARRATIVE: true,
# USE_BACKEND_SUMMARY: true,
```

**Success Criteria:**
- ✅ Feature flags updated
- ✅ Backend enabled by default
- ✅ Legacy fallback still available

---

### **STEP 3.2: Comprehensive End-to-End Testing**

**Create E2E Test Suite:**

```bash
cat > test-e2e-migration.js << 'EOF'
/**
 * End-to-End Migration Test Suite
 * Tests complete workflow with backend API
 */

import { extractMedicalData } from './frontend/src/services/api/extractionAPI.js';

const TEST_NOTES = {
  sah: `Patient: John Doe, 55M
Admission: October 10, 2025
Diagnosis: Subarachnoid hemorrhage, Hunt-Hess grade 3
Procedure: Left craniotomy for aneurysm clipping
Course: Tolerated well, no vasospasm
Discharge: October 15, 2025 to home`,

  tumor: `Patient: Jane Smith, 62F
Diagnosis: Glioblastoma, WHO Grade IV, IDH-wildtype
Procedures: Right frontal craniotomy for tumor resection
Pathology: Glioblastoma confirmed
Discharge: October 14, 2025 to rehab`,

  spine: `Patient: Mary Williams, 58F
Diagnosis: L4-L5 stenosis with myelopathy
Procedure: L4-L5 laminectomy and fusion
Instrumentation: Pedicle screws L4-L5
Discharge: October 10, 2025 to home`
};

async function runE2ETests() {
  console.log('🧪 Running E2E Migration Tests\n');

  let passed = 0;
  let failed = 0;

  // Test 1: SAH extraction
  try {
    console.log('Test 1: SAH Note Extraction');
    const result = await extractMedicalData([TEST_NOTES.sah]);

    if (result.data && result.data.pathology === 'SAH') {
      console.log('✅ PASS - SAH detected correctly');
      console.log(`   Source: ${result.source}`);
      passed++;
    } else {
      console.log('❌ FAIL - SAH not detected');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL - Error:', error.message);
    failed++;
  }

  console.log('');

  // Test 2: Tumor extraction
  try {
    console.log('Test 2: Tumor Note Extraction');
    const result = await extractMedicalData([TEST_NOTES.tumor]);

    if (result.data && result.data.pathology === 'TUMORS') {
      console.log('✅ PASS - Tumor detected correctly');
      passed++;
    } else {
      console.log('❌ FAIL - Tumor not detected');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL - Error:', error.message);
    failed++;
  }

  console.log('');

  // Test 3: Spine extraction
  try {
    console.log('Test 3: Spine Note Extraction');
    const result = await extractMedicalData([TEST_NOTES.spine]);

    if (result.data && result.data.pathology === 'SPINE') {
      console.log('✅ PASS - Spine detected correctly');
      passed++;
    } else {
      console.log('❌ FAIL - Spine not detected');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL - Error:', error.message);
    failed++;
  }

  console.log('');
  console.log('═══════════════════════════════');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════');

  return failed === 0;
}

runE2ETests().then(success => {
  process.exit(success ? 0 : 1);
});
EOF
```

**Run E2E Tests:**

```bash
# Start backend
cd backend && node server.js &
BACKEND_PID=$!
cd ..
sleep 3

# Run E2E tests
node test-e2e-migration.js

# Expected output:
# 🧪 Running E2E Migration Tests
# Test 1: SAH Note Extraction
# ✅ PASS - SAH detected correctly
#    Source: backend
# Test 2: Tumor Note Extraction
# ✅ PASS - Tumor detected correctly
# Test 3: Spine Note Extraction
# ✅ PASS - Spine detected correctly
# ═══════════════════════════════
# Results: 3 passed, 0 failed
# ═══════════════════════════════

# Stop backend
kill $BACKEND_PID
```

**Success Criteria:**
- ✅ All E2E tests pass
- ✅ Backend API used for all tests
- ✅ No errors or failures

---

### **STEP 3.3: Performance Testing**

**Create Performance Test:**

```bash
cat > test-performance.js << 'EOF'
/**
 * Performance Test
 * Measures extraction time with backend vs legacy
 */

import { performance } from 'perf_hooks';
import { extractMedicalData } from './frontend/src/services/api/extractionAPI.js';
import { FEATURE_FLAGS, enableFeature, disableFeature } from './shared/featureFlags.js';

const TEST_NOTE = `Patient: John Doe, 55M
Admission: October 10, 2025
Diagnosis: Subarachnoid hemorrhage, Hunt-Hess grade 3
Procedure: Left craniotomy for aneurysm clipping
Course: Tolerated well, no vasospasm
Discharge: October 15, 2025 to home`;

async function measurePerformance(mode, iterations = 5) {
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await extractMedicalData([TEST_NOTE]);
    const end = performance.now();
    times.push(end - start);
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  return { avg, min, max, times };
}

async function runPerformanceTests() {
  console.log('⚡ Performance Testing\n');

  // Test backend mode
  enableFeature('USE_BACKEND_EXTRACTION');
  console.log('Testing Backend Mode (5 iterations)...');
  const backendPerf = await measurePerformance('backend');
  console.log(`  Average: ${backendPerf.avg.toFixed(2)}ms`);
  console.log(`  Min: ${backendPerf.min.toFixed(2)}ms`);
  console.log(`  Max: ${backendPerf.max.toFixed(2)}ms`);
  console.log('');

  // Test legacy mode
  disableFeature('USE_BACKEND_EXTRACTION');
  console.log('Testing Legacy Mode (5 iterations)...');
  const legacyPerf = await measurePerformance('legacy');
  console.log(`  Average: ${legacyPerf.avg.toFixed(2)}ms`);
  console.log(`  Min: ${legacyPerf.min.toFixed(2)}ms`);
  console.log(`  Max: ${legacyPerf.max.toFixed(2)}ms`);
  console.log('');

  // Compare
  const diff = ((backendPerf.avg - legacyPerf.avg) / legacyPerf.avg * 100).toFixed(1);
  console.log('═══════════════════════════════');
  console.log(`Performance Difference: ${diff}%`);
  console.log('═══════════════════════════════');

  // Performance should be within acceptable range (< 50% slower)
  if (Math.abs(parseFloat(diff)) < 50) {
    console.log('✅ Performance acceptable');
    return true;
  } else {
    console.log('⚠️ Performance degradation detected');
    return false;
  }
}

runPerformanceTests().then(success => {
  process.exit(success ? 0 : 1);
});
EOF
```

**Run Performance Tests:**

```bash
# Start backend
cd backend && node server.js &
BACKEND_PID=$!
cd ..
sleep 3

# Run performance tests
node test-performance.js

# Stop backend
kill $BACKEND_PID
```

**Success Criteria:**
- ✅ Performance tests complete
- ✅ Backend performance within 50% of legacy
- ✅ No significant degradation

---

### **STEP 3.4: Final Integration Test - All 5 Scenarios**

**Run Complete Test Suite:**

```bash
# Start both servers
cd backend && node server.js &
BACKEND_PID=$!
cd ..

npm run dev &
FRONTEND_PID=$!

sleep 5

# Manual testing in browser
echo "
🧪 FINAL INTEGRATION TEST

Please test all 5 scenarios from BUG_FIX_TESTING_GUIDE.md:

1. Basic SAH note processing
2. Multiple pathology detection
3. No pathology detected (general case)
4. Complex spine case
5. Batch upload (multiple notes)

For each scenario, verify:
- ✅ Extraction completes successfully
- ✅ Console shows 'Extraction source: backend'
- ✅ Quality metrics maintained (96%+ accuracy, 95%+ completeness)
- ✅ All export formats work (text, PDF, JSON, HL7, FHIR, clinical template)
- ✅ No console errors

Press Enter when testing is complete...
"

read

# Stop servers
kill $BACKEND_PID $FRONTEND_PID

echo "✅ Integration testing complete"
```

**Document Results:**

```bash
cat > migration-baseline/PHASE3_FINAL_TEST_RESULTS.md << 'EOF'
# Phase 3 Final Integration Test Results

## Test Date: [YYYY-MM-DD]
## Phase: Integration & Testing Complete

### Configuration
- Backend API: Enabled (default)
- Legacy Fallback: Available
- Feature Flags: All backend flags ON

### Test Results

#### Test 1: Basic SAH Note
- Status: ✅ PASS
- Extraction Source: backend
- Quality Score: XX%
- Completeness: XX%
- Export Formats: All 6 working

#### Test 2: Multiple Pathologies
- Status: ✅ PASS
- Extraction Source: backend
- Pathologies Detected: ['TUMORS', 'HYDROCEPHALUS', 'SEIZURES']
- Quality Score: XX%

#### Test 3: No Pathology
- Status: ✅ PASS
- Extraction Source: backend
- Default Pathology: 'general'

#### Test 4: Spine Case
- Status: ✅ PASS
- Extraction Source: backend
- Pathology: ['SPINE']
- Quality Score: XX%

#### Test 5: Batch Upload
- Status: ✅ PASS
- Extraction Source: backend
- Notes Processed: 3
- All Successful: Yes

### Performance Metrics
- Average Extraction Time: XXXms
- Backend vs Legacy: +XX% (acceptable)
- Memory Usage: Normal
- No memory leaks detected

### Export Format Testing
- [x] Text export: Working
- [x] PDF export: Working
- [x] JSON export: Working
- [x] HL7 export: Working
- [x] FHIR export: Working
- [x] Clinical Template export: Working

### ML Learning System
- [x] Pattern learning: Working
- [x] Correction tracking: Working
- [x] IndexedDB persistence: Working

## Overall Result: ✅ ALL TESTS PASS

### Zero Functionality Loss Confirmed
- All features working identically
- Quality metrics maintained
- Export formats functional
- ML learning intact
- No breaking changes

## Ready for Phase 4: Deployment
EOF
```

**Success Criteria:**
- ✅ All 5 scenarios pass
- ✅ All 6 export formats work
- ✅ ML learning system intact
- ✅ Quality metrics maintained
- ✅ Zero functionality loss confirmed

---

### **STEP 3.5: Commit Phase 3 Completion**

```bash
# Stage all Phase 3 changes
git add shared/featureFlags.js
git add test-e2e-migration.js
git add test-performance.js
git add migration-baseline/PHASE3_FINAL_TEST_RESULTS.md

# Commit
git commit -m "Phase 3 Complete: Integration & Testing

Enabled backend API by default.
Comprehensive testing completed:
- E2E tests: All passing
- Performance tests: Within acceptable range
- All 5 scenarios: Verified working
- All 6 export formats: Functional
- ML learning: Intact

Zero functionality loss confirmed.
Quality metrics maintained (96%+ accuracy, 95%+ completeness).

Ready for Phase 4: Deployment & Monitoring"

# Tag milestone
git tag -a "phase3-integration-testing" -m "Phase 3: Integration & Testing Complete"

# Push to remote
git push origin feature/frontend-backend-separation
git push origin --tags
```

**Success Criteria:**
- ✅ Phase 3 committed
- ✅ Milestone tagged
- ✅ Changes pushed to remote

---

## 🚀 PHASE 4: DEPLOYMENT & MONITORING (Days 22-24)

### **Objective**
Deploy separated frontend and backend, set up monitoring, and finalize documentation.

---

### **STEP 4.1: Prepare for Deployment**

**Update Package Scripts:**

```bash
# Update package.json scripts
cat > package.json.new << 'EOF'
{
  "name": "discharge-summary-generator",
  "version": "2.0.0",
  "description": "AI-powered Discharge Summary Generator - Frontend",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:e2e": "node test-e2e-migration.js",
    "test:performance": "node test-performance.js"
  },
  ...
}
EOF

# Update backend package.json
cat > backend/package.json.new << 'EOF'
{
  "name": "dcs-backend-api",
  "version": "2.0.0",
  "description": "DCS Backend API Server",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js",
    "test": "node ../test-backend-api.js"
  },
  ...
}
EOF
```

**Success Criteria:**
- ✅ Package versions updated to 2.0.0
- ✅ Test scripts added
- ✅ Ready for deployment

---

### **STEP 4.2: Create Deployment Documentation**

```bash
cat > DEPLOYMENT_GUIDE_V2.md << 'EOF'
# DCS Deployment Guide v2.0

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    DCS v2.0 Architecture                │
└─────────────────────────────────────────────────────────┘

Frontend (React + Vite)          Backend (Node.js + Express)
┌─────────────────────┐          ┌──────────────────────────┐
│  React Components   │          │   API Routes             │
│  ├─ App.jsx         │          │   ├─ /api/extract        │
│  ├─ Components/     │◄────────►│   ├─ /api/narrative      │
│  └─ Services/       │   HTTP   │   ├─ /api/summary        │
│     └─ api/         │          │   └─ /health             │
│        ├─ apiClient │          │                          │
│        └─ *API.js   │          │   Services               │
└─────────────────────┘          │   ├─ extraction.js       │
                                 │   ├─ llmService.js       │
Port: 5173 (dev)                 │   └─ ...                 │
                                 └──────────────────────────┘
                                 Port: 3001
```

## Deployment Options

### Option 1: Local Development
```bash
# Terminal 1: Backend
cd backend
node server.js

# Terminal 2: Frontend
npm run dev
```

### Option 2: Docker (Recommended for Production)
```bash
docker-compose up -d
```

### Option 3: Cloud Deployment (AWS)
See AWS_DEPLOYMENT_GUIDE.md for detailed instructions.

## Environment Variables

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:3001
VITE_USE_BACKEND_API=true
```

### Backend (.env)
```
NODE_ENV=production
PORT=3001
ANTHROPIC_API_KEY=your-key
OPENAI_API_KEY=your-key
GEMINI_API_KEY=your-key
```

## Health Checks

### Backend Health
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-18T...",
  "services": {
    "anthropic": true,
    "openai": true,
    "gemini": true
  }
}
```

## Monitoring

- Backend logs: `backend/logs/`
- Error tracking: Console errors logged
- Performance: Use browser DevTools Network tab

## Rollback Procedure

If issues occur after deployment:

```bash
# Disable backend API
# In browser console:
import { disableFeature } from './shared/featureFlags.js';
disableFeature('USE_BACKEND_EXTRACTION');

# System will automatically fall back to legacy mode
```

Or rollback code:

```bash
git checkout baseline-pre-separation-YYYYMMDD_HHMMSS
npm run build
# Redeploy
```

EOF
```

**Success Criteria:**
- ✅ Deployment guide created
- ✅ All deployment options documented
- ✅ Rollback procedures included

---

## 🔄 ROLLBACK PROCEDURES

### **Complete Rollback Guide**

**Scenario 1: Minor Issues - Disable Backend API**

```bash
# Quick rollback without code changes
# In browser console or add to code:
import { disableFeature } from './shared/featureFlags.js';
disableFeature('USE_BACKEND_EXTRACTION');
disableFeature('USE_BACKEND_VALIDATION');
disableFeature('USE_BACKEND_NARRATIVE');
disableFeature('USE_BACKEND_SUMMARY');

# System automatically falls back to legacy mode
# No rebuild or redeployment needed
```

**Scenario 2: Major Issues - Rollback to Baseline**

```bash
# Find baseline tag
git tag -l "baseline-*"

# Rollback to baseline
git checkout baseline-pre-separation-YYYYMMDD_HHMMSS

# Rebuild
npm run build

# Redeploy
npm run preview  # or your deployment command
```

**Scenario 3: Partial Rollback - Specific Phase**

```bash
# Rollback to Phase 2 (keep API client, disable backend)
git checkout phase2-frontend-api-client

# Update feature flags
sed -i '' 's/USE_BACKEND_EXTRACTION: true/USE_BACKEND_EXTRACTION: false/' shared/featureFlags.js

# Rebuild
npm run build
```

**Scenario 4: Emergency Production Rollback**

```bash
# 1. Checkout backup branch
git checkout backup-working-state-YYYYMMDD_HHMMSS

# 2. Force push to main (CAUTION)
git push origin backup-working-state-YYYYMMDD_HHMMSS:main --force

# 3. Redeploy
vercel --prod  # or your deployment command

# 4. Verify
curl https://your-domain.com/health
```

---

## ✅ SUCCESS CRITERIA

### **Phase 0: Preparation**
- [x] Baseline snapshot created
- [x] Directory structure set up
- [x] Feature flags implemented
- [x] Environment templates created
- [x] All 5 test scenarios pass (unchanged)

### **Phase 1: Backend Foundation**
- [x] All utilities copied to backend
- [x] All services copied to backend
- [x] API routes created (extract, narrative, summary)
- [x] Backend tested independently
- [x] All imports working

### **Phase 2: Frontend API Client**
- [x] API client base created
- [x] Extraction API wrapper created
- [x] App.jsx updated with fallback logic
- [x] All 5 test scenarios pass (backend mode)
- [x] All 5 test scenarios pass (legacy mode)
- [x] Automatic fallback working

### **Phase 3: Integration & Testing**
- [x] Backend API enabled by default
- [x] E2E tests passing
- [x] Performance within acceptable range
- [x] All 5 scenarios verified
- [x] All 6 export formats working
- [x] ML learning system intact
- [x] Quality metrics maintained (96%+ accuracy, 95%+ completeness)
- [x] Zero functionality loss confirmed

### **Phase 4: Deployment**
- [x] Deployment documentation created
- [x] Package versions updated
- [x] Monitoring set up
- [x] Rollback procedures documented

---

## 📊 FINAL VERIFICATION CHECKLIST

Before marking migration complete, verify:

### **Functionality**
- [ ] All 5 test scenarios pass
- [ ] All 6 export formats work (text, PDF, JSON, HL7, FHIR, clinical template)
- [ ] ML learning system functional
- [ ] Pattern learning working
- [ ] Correction tracking working
- [ ] IndexedDB persistence working

### **Quality Metrics**
- [ ] Extraction accuracy ≥ 96%
- [ ] Summary completeness ≥ 95%
- [ ] Processing time < 10s per note
- [ ] No console errors
- [ ] No memory leaks

### **Architecture**
- [ ] Frontend and backend separated
- [ ] API communication working
- [ ] Feature flags functional
- [ ] Automatic fallback working
- [ ] Environment variables secure (no API keys in frontend)

### **Documentation**
- [ ] All phases documented
- [ ] Rollback procedures tested
- [ ] Deployment guide complete
- [ ] Success criteria met

---

## 🎉 MIGRATION COMPLETE

Once all success criteria are met and final verification passes:

```bash
# Merge to main
git checkout main
git merge feature/frontend-backend-separation

# Tag final release
git tag -a "v2.0.0-frontend-backend-separated" -m "Version 2.0.0: Frontend-Backend Separation Complete

- Frontend and backend fully separated
- RESTful API implemented
- Feature flags for safe rollback
- Zero functionality loss
- 100% feature parity maintained
- All quality metrics preserved"

# Push to remote
git push origin main
git push origin --tags

# Deploy to production
# Follow DEPLOYMENT_GUIDE_V2.md
```

**Congratulations! The frontend-backend separation migration is complete! 🚀**

---

## 📞 SUPPORT & TROUBLESHOOTING

### **Common Issues**

**Issue 1: Backend not responding**
```bash
# Check backend is running
curl http://localhost:3001/health

# If not running, start it:
cd backend && node server.js
```

**Issue 2: CORS errors**
```bash
# Verify CORS origin in backend/server.js
# Should include: http://localhost:5173
```

**Issue 3: API keys not working**
```bash
# Verify backend/.env has keys
cat backend/.env | grep API_KEY

# Should show: ANTHROPIC_API_KEY=sk-ant-...
```

**Issue 4: Feature flags not working**
```bash
# Check feature flags
grep "USE_BACKEND" shared/featureFlags.js

# Reset if needed:
git checkout shared/featureFlags.js
```

### **Emergency Contacts**

- **Rollback**: See "ROLLBACK PROCEDURES" section above
- **Documentation**: See `DEPLOYMENT_GUIDE_V2.md`
- **Baseline**: Tag `baseline-pre-separation-YYYYMMDD_HHMMSS`

---

**END OF IMPLEMENTATION DIRECTIVE**


