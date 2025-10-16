# UI Testing Checklist - Phase 2 & Phase 3

**Application URL:** http://localhost:5174  
**Backend:** Running on port 3001  
**Frontend:** Running on port 5174

---

## 🧪 **TESTING CHECKLIST**

### **Test 1: Basic SAH Note** ⭐ (Start Here)

**Paste this note:**
```
Patient: John Doe, 55M
Admission Date: October 10, 2025

Chief Complaint: Sudden severe headache

History: Patient presented with sudden onset severe headache. 
CT head showed subarachnoid hemorrhage. Hunt and Hess grade 3.
CTA revealed left MCA aneurysm.

Procedure: Left craniotomy for aneurysm clipping performed on October 11, 2025.

Course: Patient tolerated procedure well. No vasospasm. 
Started on nimodipine. Neurologically stable.

Discharge: October 15, 2025 to home with neurosurgery follow-up.
```

**What to Check:**

#### ✅ **Phase 1 Features (Already Implemented):**
- [ ] Pathology detected: "SAH"
- [ ] Hunt-Hess grade extracted: "3"
- [ ] Negation working: "No vasospasm" should NOT appear as complication
- [ ] Procedure extracted: "Left craniotomy for aneurysm clipping"
- [ ] Medication extracted: "nimodipine"
- [ ] Dates extracted correctly

#### ✅ **Phase 2 Features (NEW - Steps 4-5):**
- [ ] **Clinical Intelligence Panel** visible
- [ ] **Timeline Events** showing:
  - Admission (October 10)
  - Surgery (October 11)
  - Discharge (October 15)
- [ ] **Relationships** section (may be empty for simple notes)
- [ ] **Treatment Responses** tracked
- [ ] **Functional Evolution** (if mRS/GCS present)

#### ✅ **Phase 3 Features (NEW - Steps 1-4):**
- [ ] **Quality Dashboard** visible
- [ ] **Overall Quality Score** displayed (should be 70-90% for complete notes)
- [ ] **Extraction Quality** metrics shown
- [ ] **Summary Quality** metrics shown
- [ ] **Medical Writing Style** applied:
  - [ ] Past tense for history ("presented", "showed")
  - [ ] Present tense for discharge status ("is stable")
  - [ ] Abbreviations expanded first mention: "subarachnoid hemorrhage (SAH)"
- [ ] **Narrative Transitions** smooth between sections

---

### **Test 2: Complex SAH with Complications** 🔥

**Paste this note:**
```
Patient: Jane Smith, 48M
Admission: October 1, 2025

Presentation: Sudden severe headache with loss of consciousness.
Hunt-Hess grade 4, Fisher grade 3.

Imaging: CT showed diffuse SAH. CTA revealed 8mm ACOM aneurysm.

Procedure: Cerebral angiogram with coiling on October 2, 2025.
EVD placed for hydrocephalus.

Complications:
- POD 7: Vasospasm treated with hypertensive therapy
- POD 3: Seizure, started on Keppra
- POD 14: Persistent hydrocephalus, VP shunt placed

Discharge: October 20, 2025 to rehab. mRS 3.
Follow-up: Neurosurgery in 2 weeks, angiogram in 6 months.
```

**What to Check:**

#### ✅ **Phase 2 Features - Advanced:**
- [ ] **Timeline Events** showing all complications with dates:
  - POD 3: Seizure
  - POD 7: Vasospasm
  - POD 14: VP shunt
- [ ] **Relationships** extracted:
  - CAUSE_EFFECT: "SAH caused hydrocephalus"
  - TREATMENT_OUTCOME: "Hypertensive therapy for vasospasm"
  - COMPLICATION: "Vasospasm complicated by..."
  - PREVENTION: "Keppra to prevent seizures"
- [ ] **Treatment Responses** showing:
  - Nimodipine → Vasospasm prevention
  - Hypertensive therapy → Vasospasm treatment
  - Keppra → Seizure prevention
- [ ] **Functional Evolution** showing mRS progression

#### ✅ **Phase 3 Features - Advanced:**
- [ ] **Quality Score** higher (80-90%) due to completeness
- [ ] **Extraction Completeness** showing all fields extracted
- [ ] **Narrative Coherence** with smooth transitions:
  - "Subsequently, the patient developed vasospasm..."
  - "As a result, hypertensive therapy was initiated..."
  - "Despite treatment, persistent hydrocephalus required..."
- [ ] **Medical Writing Style** consistent throughout

---

### **Test 3: Multiple Pathologies** 🧠

**Paste this note:**
```
Patient: Mary Johnson, 62F
Admission: October 8, 2025

Presentation: Seizure

Imaging: MRI showed progression of right frontal glioblastoma, WHO Grade IV, 
IDH-wildtype, with surrounding edema and hydrocephalus.

Procedures:
- October 8: EVD placement for hydrocephalus
- October 9: Right frontal craniotomy for tumor resection
- October 12: EVD removed

Medications: Keppra for seizure prophylaxis

Discharge: October 14, 2025 to rehab
Follow-up: Oncology for chemoradiation, neurosurgery in 2 weeks
```

**What to Check:**

#### ✅ **Phase 2 Features - Multiple Pathologies:**
- [ ] **Multiple pathologies detected:**
  - Primary: Glioblastoma (TUMORS)
  - Secondary: Hydrocephalus
  - Tertiary: Seizures
- [ ] **Timeline** showing sequence:
  - Seizure → Imaging → EVD → Surgery → EVD removal
- [ ] **Relationships** between pathologies:
  - "Tumor caused hydrocephalus"
  - "Tumor caused seizure"
  - "EVD indicated for hydrocephalus"

#### ✅ **Phase 3 Features - Complex Narrative:**
- [ ] **Narrative synthesis** integrating multiple pathologies
- [ ] **Quality metrics** reflecting complexity
- [ ] **Coherent story** despite multiple conditions

---

## 📊 **QUALITY METRICS INTERPRETATION**

### **Overall Quality Score:**
- **90-100%:** Excellent - All fields present, high confidence
- **80-89%:** Good - Most fields present, good confidence
- **70-79%:** Fair - Some missing fields, acceptable confidence
- **<70%:** Poor - Many missing fields, low confidence

### **Extraction Quality:**
- **Completeness:** % of expected fields extracted
- **Confidence:** Average confidence across all extractions
- **Missing Fields:** List of critical missing data

### **Summary Quality:**
- **Readability:** Flesch Reading Ease score (60-70 = standard)
- **Completeness:** % of sections with content
- **Coherence:** Logical flow and transitions
- **Word Count:** Length of generated summary

---

## 🐛 **COMMON ISSUES & SOLUTIONS**

### **Issue: Quality Dashboard not visible**
**Solution:**
1. Check browser console for errors (F12)
2. Verify extraction completed successfully
3. Refresh page (Cmd+R / Ctrl+R)

### **Issue: Relationships showing 0**
**Solution:**
- This is expected for simple notes
- Relationships require explicit causal language
- Try Test 2 (Complex SAH) for better results

### **Issue: Quality score seems low**
**Solution:**
- Check if note has all required fields
- Simple notes naturally score lower
- Add more details (grades, scores, dates) to improve

### **Issue: Medical writing style not applied**
**Solution:**
- Check if using LLM generation (not template)
- Verify LLM provider is configured
- Check console for style application logs

---

## ✅ **SUCCESS CRITERIA**

After testing all 3 scenarios, you should see:

### **Phase 2 (Steps 4-5):**
- ✅ Clinical Intelligence panel displays
- ✅ Timeline events with dates
- ✅ Relationships extracted (in complex notes)
- ✅ Treatment responses tracked
- ✅ Functional evolution shown

### **Phase 3 (Steps 1-4):**
- ✅ Quality Dashboard displays
- ✅ Overall quality score calculated
- ✅ Extraction/validation/summary metrics shown
- ✅ Medical writing style applied
- ✅ Narrative transitions smooth

### **No Regressions:**
- ✅ Phase 1 features still working
- ✅ No console errors
- ✅ Application doesn't freeze
- ✅ All extractions complete successfully

---

## 📝 **TESTING NOTES**

**Record your observations:**

### Test 1 (Basic SAH):
- Quality Score: _____
- Phase 2 Features: ✅ / ❌
- Phase 3 Features: ✅ / ❌
- Issues Found: _____

### Test 2 (Complex SAH):
- Quality Score: _____
- Relationships Found: _____
- Timeline Events: _____
- Issues Found: _____

### Test 3 (Multiple Pathologies):
- Quality Score: _____
- Pathologies Detected: _____
- Narrative Coherence: ✅ / ❌
- Issues Found: _____

---

## 🚀 **AFTER TESTING**

Once you've completed testing:

1. **Document any issues found**
2. **Note quality scores achieved**
3. **Verify no regressions**
4. **Proceed to Phase 4 implementation**

---

**Ready to test? Start with Test 1 (Basic SAH) in the browser!** 🎯

