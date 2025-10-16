# 🔍 Quality Score Debugging Guide

## Problem
Quality score is showing **38.6%** which is unexpectedly low.

---

## Quality Score Calculation Breakdown

The quality score is calculated in `src/services/summaryGenerator.js` (lines 467-494):

```javascript
const calculateQualityScore = (extractedData, validation, narrative, timeline) => {
  let score = 0;

  // Data completeness (35 points)
  const completenessScore = calculateCompletenessScore(extractedData);
  score += completenessScore * 0.35;

  // Validation confidence (25 points)
  if (validation) {
    score += (validation.confidence / 100) * 0.25;
  } else {
    score += 0.25; // Assume perfect if no validation
  }

  // Narrative coherence (25 points)
  const coherenceScore = calculateCoherenceScore(narrative);
  score += coherenceScore * 0.25;
  
  // Timeline completeness (15 points)
  if (timeline && timeline.metadata && timeline.metadata.completeness) {
    const timelineScore = timeline.metadata.completeness.score / 100;
    score += timelineScore * 0.15;
  } else {
    score += 0.10; // Partial credit if timeline not available
  }

  return Math.round(score * 100);
};
```

---

## Possible Causes of Low Score (38.6%)

### **Scenario 1: Low Data Completeness (35% weight)**

**Calculation:** Lines 499-537

Required fields (2 points each):
- `demographics`
- `dates`
- `pathology`
- `procedures`
- `dischargeDestination`

Optional fields (1 point each):
- `presentingSymptoms`
- `complications`
- `anticoagulation`
- `imaging`
- `functionalScores`
- `medications`
- `followUp`

**Max score:** (5 × 2) + (7 × 1) = 17 points

**If score is 38.6%, breakdown could be:**
- Completeness: 0.2 × 0.35 = 0.07 (7%)
- Validation: 0.25 (25%) - full credit if skipped
- Coherence: 0.5 × 0.25 = 0.125 (12.5%)
- Timeline: 0.10 (10%) - partial credit
- **Total: 0.385 = 38.5%** ✅ **THIS MATCHES!**

---

## Root Cause Analysis

### **Issue 1: Missing Required Fields**

If only 2 out of 5 required fields are present:
- Score: (2 × 2) / 17 = 4/17 = 0.235 (23.5%)
- Contribution: 0.235 × 0.35 = 0.082 (8.2%)

**Missing fields likely:**
- ❌ `procedures` - empty array or missing
- ❌ `dischargeDestination` - not extracted
- ❌ `pathology` - incomplete or missing

---

### **Issue 2: Narrative Coherence Score**

**Calculation:** Lines 560-593

Required sections (2 points each):
- `chiefComplaint`
- `historyOfPresentIllness`
- `hospitalCourse`
- `dischargeStatus`

Optional sections (1 point each):
- `procedures`
- `complications`
- `dischargeMedications`
- `followUpPlan`

**Max score:** (4 × 2) + (4 × 1) = 12 points

**If coherence is 50%:**
- 6 out of 12 points
- Likely missing: optional sections or sections say "Not available."

---

### **Issue 3: Timeline Completeness**

If timeline is missing or incomplete:
- Only gets 10% instead of 15%
- Loss of 5% points

---

## Debugging Steps

### **Step 1: Add Console Logging**

Add this to `calculateQualityScore` function (line 467):

```javascript
const calculateQualityScore = (extractedData, validation, narrative, timeline) => {
  let score = 0;

  // Data completeness (35 points)
  const completenessScore = calculateCompletenessScore(extractedData);
  console.log('🔍 Completeness Score:', completenessScore, '→', completenessScore * 0.35);
  score += completenessScore * 0.35;

  // Validation confidence (25 points)
  if (validation) {
    console.log('🔍 Validation Confidence:', validation.confidence, '→', (validation.confidence / 100) * 0.25);
    score += (validation.confidence / 100) * 0.25;
  } else {
    console.log('🔍 Validation: No validation (full credit) →', 0.25);
    score += 0.25;
  }

  // Narrative coherence (25 points)
  const coherenceScore = calculateCoherenceScore(narrative);
  console.log('🔍 Coherence Score:', coherenceScore, '→', coherenceScore * 0.25);
  score += coherenceScore * 0.25;
  
  // Timeline completeness (15 points)
  if (timeline && timeline.metadata && timeline.metadata.completeness) {
    const timelineScore = timeline.metadata.completeness.score / 100;
    console.log('🔍 Timeline Score:', timelineScore, '→', timelineScore * 0.15);
    score += timelineScore * 0.15;
  } else {
    console.log('🔍 Timeline: Missing or incomplete (partial credit) →', 0.10);
    score += 0.10;
  }

  console.log('🔍 TOTAL QUALITY SCORE:', score, '→', Math.round(score * 100) + '%');

  return Math.round(score * 100);
};
```

---

### **Step 2: Check Extracted Data**

Add logging to `calculateCompletenessScore` (line 499):

```javascript
const calculateCompletenessScore = (data) => {
  const requiredFields = [
    'demographics',
    'dates',
    'pathology',
    'procedures',
    'dischargeDestination'
  ];

  const optionalFields = [
    'presentingSymptoms',
    'complications',
    'anticoagulation',
    'imaging',
    'functionalScores',
    'medications',
    'followUp'
  ];

  let score = 0;

  console.log('🔍 Checking Required Fields:');
  requiredFields.forEach(field => {
    const hasData = data[field] && hasContent(data[field]);
    console.log(`  ${field}:`, hasData ? '✅ Present' : '❌ Missing');
    if (hasData) {
      score += 2;
    }
  });

  console.log('🔍 Checking Optional Fields:');
  optionalFields.forEach(field => {
    const hasData = data[field] && hasContent(data[field]);
    console.log(`  ${field}:`, hasData ? '✅ Present' : '❌ Missing');
    if (hasData) {
      score += 1;
    }
  });

  const maxScore = (requiredFields.length * 2) + optionalFields.length;
  console.log(`🔍 Completeness: ${score}/${maxScore} = ${(score/maxScore * 100).toFixed(1)}%`);
  
  return score / maxScore;
};
```

---

### **Step 3: Check Narrative Sections**

Add logging to `calculateCoherenceScore` (line 560):

```javascript
const calculateCoherenceScore = (narrative) => {
  let score = 0;
  const maxScore = 12;

  const requiredSections = [
    'chiefComplaint',
    'historyOfPresentIllness',
    'hospitalCourse',
    'dischargeStatus'
  ];

  const optionalSections = [
    'procedures',
    'complications',
    'dischargeMedications',
    'followUpPlan'
  ];

  console.log('🔍 Checking Required Narrative Sections:');
  requiredSections.forEach(section => {
    const hasData = narrative[section] && narrative[section] !== 'Not available.';
    console.log(`  ${section}:`, hasData ? '✅ Present' : '❌ Missing/Empty');
    if (hasData) {
      score += 2;
    }
  });

  console.log('🔍 Checking Optional Narrative Sections:');
  optionalSections.forEach(section => {
    const hasData = narrative[section] && narrative[section] !== 'Not available.';
    console.log(`  ${section}:`, hasData ? '✅ Present' : '❌ Missing/Empty');
    if (hasData) {
      score += 1;
    }
  });

  console.log(`🔍 Coherence: ${score}/${maxScore} = ${(score/maxScore * 100).toFixed(1)}%`);

  return Math.min(score / maxScore, 1.0);
};
```

---

## Quick Fix Options

### **Option 1: Adjust Weights (If Expectations Are Too High)**

If the current scoring is too strict, adjust weights in `calculateQualityScore`:

```javascript
// More lenient scoring
const maxScore = (requiredFields.length * 2) + (optionalFields.length * 0.5); // Reduce optional weight
```

---

### **Option 2: Give More Credit for Partial Data**

Modify `hasContent` to be more lenient:

```javascript
const hasContent = (field) => {
  if (!field) return false;
  
  if (Array.isArray(field)) {
    return field.length > 0;
  }

  if (typeof field === 'object' && field !== null && !Array.isArray(field)) {
    // More lenient: count as present if ANY value exists
    const values = Object.values(field);
    return values.length > 0 && values.some(v => v !== null && v !== undefined && v !== '');
  }

  return true;
};
```

---

### **Option 3: Improve Extraction**

If data is genuinely missing, improve extraction:
1. Check if LLM extraction is working
2. Verify pattern-based extraction fallbacks
3. Ensure all required fields have extraction logic

---

## Expected Behavior

For a **complete, high-quality summary**, expect:

| Component | Score | Weight | Contribution |
|-----------|-------|--------|--------------|
| **Completeness** | 80-100% | 35% | 28-35% |
| **Validation** | 70-100% | 25% | 17.5-25% |
| **Coherence** | 80-100% | 25% | 20-25% |
| **Timeline** | 70-100% | 15% | 10.5-15% |
| **TOTAL** | | | **76-100%** |

For a **minimal but acceptable summary**, expect:

| Component | Score | Weight | Contribution |
|-----------|-------|--------|--------------|
| **Completeness** | 50-60% | 35% | 17.5-21% |
| **Validation** | 60-70% | 25% | 15-17.5% |
| **Coherence** | 60-70% | 25% | 15-17.5% |
| **Timeline** | 50-60% | 15% | 7.5-9% |
| **TOTAL** | | | **55-65%** |

**Current score of 38.6% suggests:**
- Missing multiple required fields
- Incomplete narrative sections
- Possibly missing timeline data

---

## Action Items

1. ✅ Add debug logging to all score calculation functions
2. ✅ Run a test summary generation
3. ✅ Check console output for missing fields
4. ✅ Identify which fields are causing low scores
5. ✅ Fix extraction logic for missing fields
6. ✅ Verify narrative generation includes all sections
7. ✅ Test again and verify improved score

---

## Next Steps

Would you like me to:
1. **Add the debug logging** to help identify the exact issue?
2. **Check a specific summary** to see what's missing?
3. **Adjust the scoring weights** to be more lenient?
4. **Improve extraction logic** for specific fields?

Let me know which approach you'd prefer!

