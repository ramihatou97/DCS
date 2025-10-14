# 🧪 Application Testing & Debugging Guide

## Quick Start Testing

### 1. Build & Run Checks

```bash
# Install dependencies
npm install
cd backend && npm install && cd ..

# Build the application
npm run build

# Start dev server
npm run dev

# Visit http://localhost:5173
```

### 2. Backend Setup

```bash
# Start backend server
cd backend
node server.js

# Backend runs on http://localhost:3001
# Health check: http://localhost:3001/health
```

## Testing Checklist

### ✅ Component Testing

- [ ] **BatchUpload Component**
  - Upload single file
  - Upload multiple files
  - Drag & drop functionality
  - File validation
  - Error handling for invalid files

- [ ] **ExtractedDataReview Component**
  - Display extracted data
  - Edit fields
  - Save corrections
  - Validation indicators
  - Confidence scores display

- [ ] **SummaryGenerator Component**
  - Generate summary with LLM
  - Preview summary
  - Export as PDF
  - Export as text
  - Template selection

- [ ] **LearningDashboard Component**
  - Display correction statistics
  - Show learned patterns
  - Export/import learning data
  - Accuracy metrics

- [ ] **SummaryImporter Component**
  - Import previous summaries
  - Parse structured data
  - Learn from imported data

- [ ] **Settings Component**
  - LLM provider selection
  - API key management
  - Auto-save toggle
  - Privacy settings

### ✅ Service Testing

#### Extraction Service
```javascript
import { extractMedicalEntities } from './services/extraction.js';

// Test extraction
const notes = [
  { content: "65-year-old male with SAH...", type: "progress" }
];
const result = await extractMedicalEntities(notes);
console.log('Extracted:', result);
```

#### Validation Service
```javascript
import { validateExtraction } from './services/validation.js';

// Test validation
const validation = validateExtraction(extractedData, originalText);
console.log('Validation:', validation);
```

#### ML Services
```javascript
import { trackCorrection } from './services/ml/correctionTracker.js';
import { learnFromCorrections } from './services/ml/learningEngine.js';

// Test correction tracking
await trackCorrection({
  field: 'patientAge',
  originalValue: '64',
  correctedValue: '65',
  context: 'Patient demographics'
});

// Test learning
await learnFromCorrections('patientAge');
```

### ✅ Storage Testing

#### LocalStorage
```javascript
import { saveData, loadData } from './services/storage/localStorageManager.js';

// Test save/load
saveData('test_key', { data: 'test' });
const loaded = loadData('test_key');
console.log('Loaded:', loaded);
```

#### IndexedDB
```javascript
import { initDB } from './services/storage/learningDatabase.js';

// Test DB initialization
const db = await initDB();
console.log('DB initialized:', db);
```

### ✅ Error Handling

```javascript
import { handleError, getStoredErrors } from './utils/errorHandling.js';

// Test error handling
try {
  throw new Error('Test error');
} catch (error) {
  handleError(error, 'Test context');
}

// View stored errors
console.log('Errors:', getStoredErrors());
```

### ✅ Debugging

```javascript
import { enableFullDebug, debug } from './utils/debugUtils.js';

// Enable debug mode
enableFullDebug();

// Use debug utilities
debug.log('Test message');
debug.table([{ id: 1, name: 'Test' }]);
```

## End-to-End Workflow Testing

### Test Scenario 1: Basic Extraction
1. Start application
2. Upload a test note (use `sample-note-SAH.txt`)
3. Click "Process Notes"
4. Verify extraction results appear
5. Check confidence scores
6. Review validation status

### Test Scenario 2: Data Correction & Learning
1. Complete Test Scenario 1
2. Navigate to "Review Data" tab
3. Edit a field (e.g., patient age)
4. Save correction
5. Navigate to "Learning Dashboard"
6. Verify correction was tracked
7. Check learned patterns

### Test Scenario 3: Summary Generation
1. Complete Test Scenario 1
2. Navigate to "Generate Summary" tab
3. Select LLM provider
4. Click "Generate Summary"
5. Review generated summary
6. Export as PDF
7. Export as text

### Test Scenario 4: Import & Learn
1. Navigate to "Import Summary" tab
2. Paste a previous discharge summary
3. Click "Import & Learn"
4. Verify data extraction
5. Check learning dashboard for new patterns

## Common Issues & Troubleshooting

### Build Errors

**Issue**: Module not found
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Issue**: Vite build fails
```bash
# Solution: Clear cache
npm run build -- --force
```

### Runtime Errors

**Issue**: "Cannot read property of undefined"
- Check component prop validation
- Verify data structure matches expected format
- Use browser DevTools to inspect state

**Issue**: LocalStorage quota exceeded
```javascript
// Solution: Clear old data
import { clearAllData } from './services/storage/localStorageManager.js';
clearAllData();
```

**Issue**: IndexedDB errors
```javascript
// Solution: Clear IndexedDB
// Open DevTools > Application > IndexedDB > Delete database
```

### API Issues

**Issue**: LLM API calls fail
- Verify API keys are set in Settings
- Check backend server is running
- Verify CORS configuration
- Check network tab for error details

**Issue**: Backend connection refused
```bash
# Solution: Restart backend
cd backend
node server.js
```

## Performance Testing

### Load Testing
```javascript
// Test with multiple notes
const notes = Array(10).fill({
  content: "Test note content...",
  type: "progress"
});

const start = performance.now();
const result = await extractMedicalEntities(notes);
const duration = performance.now() - start;

console.log(`Processed ${notes.length} notes in ${duration}ms`);
```

### Memory Testing
```javascript
import { logMemoryUsage } from './utils/debugUtils.js';

// Before operation
logMemoryUsage();

// Perform operation
await heavyOperation();

// After operation
logMemoryUsage();
```

## Automated Testing Script

```bash
#!/bin/bash

echo "🧪 Running DCS Application Tests"
echo ""

# Build test
echo "1. Testing build..."
npm run build
if [ $? -eq 0 ]; then
  echo "✅ Build successful"
else
  echo "❌ Build failed"
  exit 1
fi

# Verification script
echo ""
echo "2. Running verification..."
bash verify-ml-system.sh
if [ $? -eq 0 ]; then
  echo "✅ Verification passed"
else
  echo "❌ Verification failed"
  exit 1
fi

# Backend test
echo ""
echo "3. Testing backend..."
cd backend
npm install > /dev/null 2>&1
timeout 5 node server.js &
SERVER_PID=$!
sleep 2

# Health check
curl -s http://localhost:3001/health > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ Backend healthy"
else
  echo "❌ Backend failed"
fi

kill $SERVER_PID
cd ..

echo ""
echo "✨ All tests completed"
```

## Manual Test Cases

### Test Case 1: Patient Demographics Extraction
**Input**: Note with "65-year-old male"
**Expected**: patientAge: 65, patientGender: "Male"
**Confidence**: High (>0.8)

### Test Case 2: Pathology Detection
**Input**: Note with "subarachnoid hemorrhage"
**Expected**: pathology: ["SAH"], pathologyType: ["Vascular"]
**Confidence**: High (>0.9)

### Test Case 3: Date Parsing
**Input**: Note with "admitted 01/15/2024"
**Expected**: admissionDate: "2024-01-15"
**Validation**: Date format correct

### Test Case 4: Procedure Extraction
**Input**: Note with "underwent craniotomy"
**Expected**: procedures: ["Craniotomy"]
**Related**: surgicalProcedures array populated

### Test Case 5: Medication Extraction
**Input**: Note with "aspirin 81mg daily"
**Expected**: medications: includes aspirin entry
**Details**: Dose and frequency captured

## Browser Compatibility

Tested and supported:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

Known issues:
- ⚠️ IE11: Not supported (uses modern ES6+ features)

## Debug Mode

Enable comprehensive debugging:
```javascript
// In browser console
window.DCS_DEBUG_UTILS.enableFullDebug();

// Available utilities:
// - window.DCS_DEBUG_UTILS.debug
// - window.DCS_DEBUG_UTILS.inspect
// - window.DCS_DEBUG_UTILS.captureSnapshot
// - window.DCS_DEBUG_UTILS.exportDebugData
```

## Continuous Integration

Recommended CI checks:
1. `npm install` - Dependency installation
2. `npm run build` - Production build
3. `bash verify-ml-system.sh` - System verification
4. Backend health check
5. Lighthouse performance audit

## Reporting Issues

When reporting bugs, include:
1. Steps to reproduce
2. Expected vs actual behavior
3. Browser and version
4. Console errors (if any)
5. Debug data export: `window.DCS_DEBUG_UTILS.exportDebugData()`

## Performance Benchmarks

Target performance metrics:
- Initial load: < 3 seconds
- Extraction (single note): < 2 seconds
- Summary generation: < 10 seconds
- UI interactions: < 100ms
- Build time: < 10 seconds

---

**Last Updated**: October 2025
**Version**: 1.0.0
