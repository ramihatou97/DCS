# Phase 1 - Step 4: Context-Aware Abbreviation Expansion

**Date:** 2025-10-15  
**Priority:** HIGH  
**Effort:** Low (1 day)  
**Expected Improvement:** +4% extraction accuracy  
**Status:** 🔄 **IN PROGRESS**

---

## 🎯 Objective

Enhance the existing abbreviation system with:
1. **Context-aware disambiguation** - "MS" → "mental status" vs "motor strength" vs "multiple sclerosis"
2. **Institution-specific abbreviations** - User-configurable terms
3. **Pathology-aware expansion** - Use detected pathology to disambiguate
4. **Integration with preprocessing** - Expand abbreviations before extraction

---

## 📋 Current State Analysis

### **Existing File: `src/utils/medicalAbbreviations.js`**

**Strengths:**
- ✅ 316 medical abbreviations (comprehensive)
- ✅ Organized by category (anticoagulants, SAH, tumors, etc.)
- ✅ Basic expansion functions (`expandAbbreviation`, `expandAllAbbreviations`)
- ✅ Extraction function (`extractAbbreviations`)
- ✅ Custom abbreviation support (`addCustomAbbreviation`)

**Gaps:**
- ❌ No context-aware disambiguation
- ❌ No pathology-aware expansion
- ❌ No institution-specific abbreviations
- ❌ Not integrated with preprocessing pipeline
- ❌ No ambiguous abbreviation handling

---

## 🔧 Enhancement Plan

### **1. Add Context-Aware Disambiguation**

**Ambiguous Abbreviations:**
- **MS** → mental status, motor strength, multiple sclerosis, mitral stenosis
- **DC** → discharge, decompressive craniectomy
- **PE** → pulmonary embolism, physical exam
- **PT** → Physical Therapy, patient, prothrombin time
- **ST** → Speech Therapy, sinus tachycardia
- **PC** → posterior communicating, palliative care
- **AC** → anterior communicating, anticoagulation
- **LD** → lumbar drain, lactate dehydrogenase
- **HTS** → hypertonic saline, heel to shin

**Disambiguation Strategy:**
```javascript
export const expandAbbreviationWithContext = (abbrev, context, pathology) => {
  // Use surrounding words and pathology to disambiguate
  const lowerContext = context.toLowerCase();
  
  if (abbrev === 'MS') {
    if (lowerContext.includes('alert') || lowerContext.includes('oriented')) {
      return 'mental status';
    }
    if (lowerContext.includes('motor') || lowerContext.includes('strength') || lowerContext.includes('5/5')) {
      return 'motor strength';
    }
    if (pathology === 'SPINE' || lowerContext.includes('extremit')) {
      return 'motor strength';
    }
    return 'multiple sclerosis'; // Default
  }
  
  // ... more disambiguation rules
};
```

### **2. Add Institution-Specific Abbreviations**

**User-Configurable Dictionary:**
```javascript
export const INSTITUTION_SPECIFIC_ABBREVIATIONS = {
  // Common institution-specific terms
  'NSGY': 'Neurosurgery',
  'NICU': 'Neurological Intensive Care Unit',
  'SICU': 'Surgical Intensive Care Unit',
  'MICU': 'Medical Intensive Care Unit',
  'CCU': 'Cardiac Care Unit',
  'PACU': 'Post-Anesthesia Care Unit',
  'OR': 'Operating Room',
  'ER': 'Emergency Room',
  'ED': 'Emergency Department',
  'ICU': 'Intensive Care Unit',
  'PICU': 'Pediatric Intensive Care Unit',
  'CVICU': 'Cardiovascular Intensive Care Unit',
  // User can add more via settings
};
```

### **3. Add Pathology-Aware Expansion**

**Use Detected Pathology:**
```javascript
export const expandWithPathologyContext = (abbrev, pathology) => {
  const pathologySpecific = {
    'SAH': {
      'DC': 'decompressive craniectomy',
      'PC': 'posterior communicating',
      'AC': 'anterior communicating',
      'HTS': 'hypertonic saline'
    },
    'TUMORS': {
      'DC': 'discharge',
      'PC': 'palliative care',
      'MS': 'multiple sclerosis'
    },
    'SPINE': {
      'MS': 'motor strength',
      'PT': 'Physical Therapy',
      'LD': 'lactate dehydrogenase'
    },
    'HYDROCEPHALUS': {
      'LD': 'lumbar drain',
      'HTS': 'hypertonic saline'
    }
  };
  
  return pathologySpecific[pathology]?.[abbrev] || MEDICAL_ABBREVIATIONS[abbrev] || abbrev;
};
```

### **4. Integrate with Preprocessing**

**Modify `src/utils/textUtils.js`:**
```javascript
import { expandAbbreviationsInText } from './medicalAbbreviations.js';

export const preprocessClinicalNote = (text, options = {}) => {
  // ... existing preprocessing ...
  
  // PHASE 1 STEP 4: Expand abbreviations with context
  if (options.expandAbbreviations !== false) {
    text = expandAbbreviationsInText(text, {
      pathology: options.pathology,
      preserveOriginal: true, // Keep "SAH (subarachnoid hemorrhage)"
      institutionSpecific: true
    });
  }
  
  return text;
};
```

---

## 📝 Implementation Steps

### **Step 1: Enhance `medicalAbbreviations.js`** ✅

**Add:**
1. `AMBIGUOUS_ABBREVIATIONS` - Dictionary of ambiguous terms
2. `INSTITUTION_SPECIFIC_ABBREVIATIONS` - User-configurable terms
3. `PATHOLOGY_SPECIFIC_ABBREVIATIONS` - Pathology-aware mappings
4. `expandAbbreviationWithContext()` - Context-aware expansion
5. `expandWithPathologyContext()` - Pathology-aware expansion
6. `expandAbbreviationsInText()` - Smart text expansion
7. `getAmbiguousAbbreviations()` - List ambiguous terms

### **Step 2: Integrate with `textUtils.js`** ✅

**Modify:**
- `preprocessClinicalNote()` - Add abbreviation expansion step
- Add option to enable/disable expansion
- Pass pathology context from extraction

### **Step 3: Update `extraction.js`** ✅

**Modify:**
- Pass pathology types to preprocessing
- Enable abbreviation expansion by default
- Add logging for expanded abbreviations

### **Step 4: Add User Settings** ✅

**Create:**
- Settings UI for institution-specific abbreviations
- Import/export custom abbreviation dictionary
- Toggle for abbreviation expansion

---

## 🧪 Testing Strategy

### **Test Cases:**

**1. Context-Aware Disambiguation:**
```javascript
// Test MS disambiguation
{ text: "Patient is alert and oriented, MS intact", expected: "mental status" }
{ text: "Motor exam: MS 5/5 in all extremities", expected: "motor strength" }
{ text: "History of MS with spinal lesions", expected: "multiple sclerosis" }

// Test DC disambiguation
{ text: "Patient underwent DC for malignant edema", pathology: "SAH", expected: "decompressive craniectomy" }
{ text: "Patient ready for DC to rehab", expected: "discharge" }

// Test PE disambiguation
{ text: "PE reveals no focal deficits", expected: "physical exam" }
{ text: "CT angiogram negative for PE", expected: "pulmonary embolism" }
```

**2. Pathology-Aware Expansion:**
```javascript
{ abbrev: "DC", pathology: "SAH", expected: "decompressive craniectomy" }
{ abbrev: "DC", pathology: "TUMORS", expected: "discharge" }
{ abbrev: "MS", pathology: "SPINE", expected: "motor strength" }
```

**3. Institution-Specific:**
```javascript
{ text: "Patient transferred to NSGY NICU", expected: "Neurosurgery Neurological Intensive Care Unit" }
```

**4. Integration:**
```javascript
// Test preprocessing with abbreviation expansion
const text = "55M with aSAH from ACoA aneurysm. Underwent coiling. MS intact. DC to rehab.";
const processed = preprocessClinicalNote(text, { pathology: ['SAH'], expandAbbreviations: true });
// Should expand: aSAH, ACoA, MS (mental status), DC (discharge)
```

---

## 📊 Expected Results

### **Before Enhancement:**
- Abbreviations left unexpanded
- Ambiguous terms cause confusion
- Institution-specific terms not recognized

### **After Enhancement:**
- ✅ Context-aware disambiguation (95% accuracy)
- ✅ Pathology-aware expansion
- ✅ Institution-specific terms supported
- ✅ Integrated with preprocessing
- ✅ +4% extraction accuracy

---

## 🔒 Safety & Defensive Programming

### **Fallback Strategy:**
```javascript
try {
  // Attempt context-aware expansion
  expanded = expandAbbreviationWithContext(abbrev, context, pathology);
} catch (error) {
  console.warn('Context-aware expansion failed, using basic expansion:', error.message);
  // Fallback to basic expansion
  expanded = MEDICAL_ABBREVIATIONS[abbrev] || abbrev;
}
```

### **Preserve Original:**
- Always keep original abbreviation in parentheses
- Example: "SAH (subarachnoid hemorrhage)"
- Prevents information loss

### **No Breaking Changes:**
- All existing functions remain unchanged
- New functions are additive
- Expansion is optional (can be disabled)

---

## 📚 Files to Modify

### **1. `src/utils/medicalAbbreviations.js`**
- Add ambiguous abbreviations dictionary
- Add institution-specific abbreviations
- Add pathology-specific mappings
- Add context-aware expansion functions
- **Lines to add:** ~200

### **2. `src/utils/textUtils.js`**
- Integrate abbreviation expansion in preprocessing
- **Lines to modify:** ~10

### **3. `src/services/extraction.js`**
- Pass pathology to preprocessing
- Enable abbreviation expansion
- **Lines to modify:** ~5

---

## 🎯 Success Criteria

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| Context disambiguation accuracy | 95% | Test suite |
| Pathology-aware accuracy | 100% | Test suite |
| No breaking changes | Yes | Build + existing tests |
| Integration seamless | Yes | Extraction pipeline |
| Performance impact | <5ms | Benchmark |

---

## 🚀 Implementation Order

1. ✅ Create implementation plan (this document)
2. 🔄 Enhance `medicalAbbreviations.js` with new functions
3. 🔄 Integrate with `textUtils.js` preprocessing
4. 🔄 Update `extraction.js` to pass pathology context
5. 🔄 Build and test
6. 🔄 Create automated test suite
7. 🔄 Verify 100% pass rate
8. ✅ Document and mark Step 4 complete

---

**Ready to implement Step 4: Context-Aware Abbreviation Expansion!** 🚀

