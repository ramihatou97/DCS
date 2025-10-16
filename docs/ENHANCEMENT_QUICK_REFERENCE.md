# 🚀 DCS Enhancement Quick Reference

**For Developers:** Quick access to new utilities and how to use them.

---

## 🔧 New Utilities

### 1. Negation Detection (`src/utils/negationDetection.js`)

**Purpose:** Prevent extraction of negated medical concepts

**Quick Usage:**
```javascript
import { isConceptNegated, validateComplicationExtraction } from '../utils/negationDetection.js';

// Check if a concept is negated
const result = isConceptNegated('vasospasm', 'no evidence of vasospasm');
// → { isNegated: true, trigger: 'no evidence of', confidence: 0.9 }

// Validate a complication
const validation = validateComplicationExtraction('vasospasm', sourceText);
if (!validation.valid) {
  console.log(validation.reason); // "Complication appears to be negated"
}
```

**Key Functions:**
- `isConceptNegated(concept, text)` - Check if concept is negated
- `filterNegatedConcepts(items, text)` - Filter array of concepts
- `validateComplicationExtraction(comp, text)` - Validate single complication
- `sentenceContainsNegation(sentence)` - Quick negation check

---

### 2. Temporal Qualifiers (`src/utils/temporalQualifiers.js`)

**Purpose:** Extract temporal context (past, present, future, admission, discharge)

**Quick Usage:**
```javascript
import { extractTemporalQualifier, isHistoricalFinding } from '../utils/temporalQualifiers.js';

// Extract temporal context
const temporal = extractTemporalQualifier('stroke', 'prior history of stroke');
// → { category: 'PAST', confidence: 0.9, type: 'past' }

// Check if finding is historical
const historical = isHistoricalFinding('stroke', 'prior history of stroke');
// → { isHistorical: true, confidence: 0.9, recommendation: 'Include in PMH' }
```

**Key Functions:**
- `extractTemporalQualifier(concept, text)` - Get temporal context
- `isHistoricalFinding(finding, text)` - Check if historical vs current
- `filterActiveComplications(complications, text)` - Filter to active only
- `categorizeByTemporalContext(items, text)` - Group by temporal category

**Temporal Categories:**
- `PAST` - Historical findings
- `PRESENT` - Current status
- `FUTURE` - Planned actions
- `ADMISSION` - At admission
- `DISCHARGE` - At discharge
- `PREOP` - Before surgery
- `POSTOP` - After surgery
- `ACUTE` - New onset
- `CHRONIC` - Long-standing

---

### 3. Source Quality Assessment (`src/utils/sourceQuality.js`)

**Purpose:** Assess clinical note quality and calibrate confidence scores

**Quick Usage:**
```javascript
import { assessSourceQuality, calibrateConfidence } from '../utils/sourceQuality.js';

// Assess note quality
const quality = assessSourceQuality(noteText);
// → { 
//   overallScore: 0.85, 
//   grade: 'GOOD',
//   factors: { structure: 0.9, completeness: 0.8, ... },
//   issues: [...],
//   recommendations: [...]
// }

// Calibrate confidence based on quality
const calibrated = calibrateConfidence(0.9, quality);
// → 0.85 (adjusted down if quality is poor)
```

**Quality Grades:**
- `EXCELLENT` - Score ≥ 0.9
- `GOOD` - Score ≥ 0.75
- `FAIR` - Score ≥ 0.6
- `POOR` - Score ≥ 0.4
- `VERY_POOR` - Score < 0.4

---

## 🎯 Common Integration Patterns

### Pattern 1: Filter Extracted Complications

```javascript
// In extraction.js
import { validateComplicationExtraction } from '../utils/negationDetection.js';

const extractComplications = (text, pathologyTypes) => {
  // Extract complications (existing code)
  const complications = [...];
  
  // NEW: Filter negated complications
  return complications.filter(comp => {
    const validation = validateComplicationExtraction(comp.name, text);
    return validation.valid;
  });
};
```

### Pattern 2: Separate Historical from Current

```javascript
// In extraction.js
import { isHistoricalFinding } from '../utils/temporalQualifiers.js';

const categorizeConditions = (conditions, text) => {
  const historical = [];
  const current = [];
  
  for (const condition of conditions) {
    const temporal = isHistoricalFinding(condition, text);
    if (temporal.isHistorical) {
      historical.push(condition);
    } else {
      current.push(condition);
    }
  }
  
  return { historical, current };
};
```

### Pattern 3: Calibrate Confidence Scores

```javascript
// In extraction.js
import { assessSourceQuality, calibrateConfidence } from '../utils/sourceQuality.js';

const extractWithQualityAwareness = (text) => {
  // Assess quality first
  const quality = assessSourceQuality(text);
  
  // Extract data
  const data = extractData(text);
  
  // Calibrate all confidence scores
  for (const [key, value] of Object.entries(data)) {
    if (value?.confidence) {
      value.confidence = calibrateConfidence(value.confidence, quality);
    }
  }
  
  return { data, quality };
};
```

---

## 🧪 Testing Examples

### Test Negation Detection

```javascript
const tests = [
  { text: 'no evidence of vasospasm', concept: 'vasospasm', expected: true },
  { text: 'patient has vasospasm', concept: 'vasospasm', expected: false },
  { text: 'denies headache', concept: 'headache', expected: true },
  { text: 'no change in status', concept: 'change', expected: false } // pseudo-negation
];

for (const test of tests) {
  const result = isConceptNegated(test.concept, test.text);
  console.assert(result.isNegated === test.expected);
}
```

---

## 📊 Implementation Checklist

### Phase 1: Foundation (Weeks 1-2)

- [x] **1.1 Negation Detection** - IMPLEMENTED
  - [x] Created `src/utils/negationDetection.js`
  - [ ] Integrated into `src/services/extraction.js`
  - [ ] Updated LLM prompts
  - [ ] Added tests

- [x] **1.2 Temporal Qualifiers** - IMPLEMENTED
  - [x] Created `src/utils/temporalQualifiers.js`
  - [ ] Integrated into extraction
  - [ ] Enriched timeline
  - [ ] Added tests

- [x] **1.5 Source Quality** - IMPLEMENTED
  - [x] Created `src/utils/sourceQuality.js`
  - [ ] Integrated into extraction
  - [ ] Created UI component
  - [ ] Added tests

- [ ] **1.3 Abbreviation Expansion**
  - [ ] Expand `src/utils/medicalAbbreviations.js`
  - [ ] Add context-aware expansion
  - [ ] Create user configuration

- [ ] **1.4 Multi-Value Extraction**
  - [ ] Update `extractProcedures()`
  - [ ] Update `extractComplications()`
  - [ ] Update `extractMedications()`

---

## 🚀 Next Steps

1. **Integrate Phase 1 utilities** into extraction pipeline
2. **Create UI components** for source quality display
3. **Add comprehensive tests** for all new utilities
4. **Measure impact** on extraction accuracy
5. **Proceed to Phase 2** (Context & Intelligence)

---

**Ready to enhance DCS!** 🎉

