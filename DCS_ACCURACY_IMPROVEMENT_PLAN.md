# 🚨 DCS APP ACCURACY IMPROVEMENT PLAN
## From 43.3% to 95%+ Accuracy

**Analysis Date:** October 16, 2025  
**Priority:** CRITICAL - Patient Safety Issue  
**Current Accuracy:** 43.3%  
**Target Accuracy:** 95%+  
**Comparison Baseline:** Gemini (98.6%), OpenAI (92.0%), Claude (91.5%)

---

## EXECUTIVE SUMMARY

### Critical Finding
**The DCS app uses the same LLM providers (Claude, GPT-4o, Gemini) but achieves only 43.3% accuracy compared to 90%+ for direct API calls.** This dramatic underperformance is NOT due to the LLM quality, but due to:

1. **Over-engineered extraction pipeline** that loses information between phases
2. **Template-based narrative generation** that discards LLM-generated content
3. **Inadequate prompts** that don't explicitly request critical clinical elements
4. **Information loss during orchestration** - data extracted but not passed to narrative
5. **Section validation logic** that may be filtering out correct data

### Root Cause Analysis Summary

| Issue | Root Cause | Impact | Fix Complexity |
|-------|------------|--------|----------------|
| Missing neurologic recovery | Narrative generation doesn't receive functional status updates | **CRITICAL** | Medium |
| Wrong dates | Prompt doesn't emphasize date accuracy | High | Low |
| Wrong medication dosing | Extraction successful but narrative generation loses precision | High | Low |
| Missing demographics | Prompt doesn't request demographics section | High | Low |
| Missing secondary diagnoses | Narrative template doesn't have secondary diagnoses section | High | Low |
| Missing complications | Prompt doesn't emphasize ALL complications | High | Low |
| Missing discharge destination | Extraction successful but narrative doesn't include it | Medium | Low |

### Key Insight
**Direct LLM calls succeed because they use ONE comprehensive prompt that requests everything.** The DCS app uses a **multi-phase approach** (extract → validate → generate narrative) where information is lost at each transition.

### Recommended Strategy
**Shift from "extract-then-template" to "guided LLM generation with structured validation"**

---

## PART 1: ROOT CAUSE ANALYSIS

### 1.1 Architecture Comparison

#### **Direct LLM Call (Gemini/Claude/OpenAI - 90%+ accuracy)**
```
Clinical Notes → Single Comprehensive Prompt → Complete Discharge Summary
```

**Advantages:**
- ✅ No information loss
- ✅ LLM sees full context
- ✅ Natural narrative flow
- ✅ All sections generated together

#### **DCS App Current Architecture (43.3% accuracy)**
```
Clinical Notes → Extraction (LLM) → Validation → Narrative Generation (LLM) → Output
                     ↓                  ↓                    ↓
              Structured JSON    Filter/Validate    Template-based sections
```

**Problems:**
- ❌ Information loss at each transition
- ❌ Extraction JSON doesn't capture everything
- ❌ Narrative generation receives incomplete data
- ❌ Template logic may override LLM output
- ❌ Two separate LLM calls don't share context

### 1.2 Specific Code Analysis

#### **Issue #1: Missing Neurologic Recovery (CRITICAL)**

**File:** `src/services/narrativeEngine.js` (lines 103-200)  
**File:** `src/services/llmService.js` (lines 723-840)

**Root Cause:**
The narrative generation prompt (line 797-829 in `llmService.js`) requests:
```
6. DISCHARGE STATUS: Functional status (GCS/mRS/KPS), neuro exam, medications, discharge destination
```

But the prompt uses **truncated notes** (line 793):
```javascript
const truncatedNotes = truncateSourceNotes(sourceNotes, 15000);
```

And **concise extracted data** (line 792):
```javascript
const conciseData = summarizeExtractedData(extractedData);
```

The `summarizeExtractedData` function (lines 646-673) creates a summary that includes:
```javascript
discharge_status: {
  destination: extracted.discharge?.destination,
  mrs: extracted.discharge?.mrs,
  kps: extracted.discharge?.kps,
  gcs: extracted.discharge?.gcs
}
```

**But it does NOT include:**
- ❌ Detailed neurologic exam findings
- ❌ Motor strength by muscle group
- ❌ Sensory levels
- ❌ Reflex status
- ❌ **Late neurologic recovery events**

**Why Direct LLM Calls Succeed:**
They pass the FULL clinical notes to the LLM in a single prompt, so the LLM sees:
```
POD 20 Progress Note:
Neuro: FINALLY seeing some change!
- L leg: Trace flicker of movement in quad! [1/5]
- R leg: Still [0/5]
- UE: Slightly improved - C8/T1 now [3/5]!
```

The DCS app's truncation logic (lines 679-711) may cut this out, or the `summarizeExtractedData` doesn't capture it.

**Evidence:**
- Gemini, Claude, OpenAI all captured the POD 20 recovery (100% accuracy)
- DCS app stated "Lower extremities 0/5 throughout" (0% accuracy)

---

#### **Issue #2: Wrong Procedure Dates**

**File:** `src/services/llmService.js` (lines 395-609)

**Root Cause:**
The extraction prompt (lines 395-609) includes chronological intelligence guidance:
```
2. CHRONOLOGICAL INTELLIGENCE & DEDUPLICATION:
   - CRITICAL: If "coiling" or any procedure is mentioned in 5 daily notes, this is ONE procedure, not five
   - Identify the ACTUAL procedure date (usually first mention or with explicit date/operator)
```

**But the prompt doesn't emphasize:**
- ❌ "Verify dates against note timestamps"
- ❌ "Cross-reference POD numbers with admission date"
- ❌ "If a date seems wrong, recalculate from POD"

**Example of Failure:**
- Ground truth: I&D performed on **10/04/2025 (POD 14)**
- DCS app output: "October 2, 2025"
- Error: **2 days off**

**Why Direct LLM Calls Succeed:**
They likely have better date verification logic or the single-pass approach reduces date calculation errors.

---

#### **Issue #3: Wrong Medication Dosing**

**File:** `src/services/llmService.js` (lines 646-673)

**Root Cause:**
The `summarizeExtractedData` function (line 663-665) summarizes medications as:
```javascript
medications: extracted.medications?.slice(0, 10).map(m =>
  `${m.name || m.medication} ${m.dosage || ''} ${m.frequency || ''}`.trim()
) || [],
```

This creates strings like: `"Oxycodone 5mg q6h PRN"`

**But the narrative generation prompt** (lines 797-829) doesn't emphasize:
- ❌ "Preserve exact medication dosages and frequencies"
- ❌ "Do not modify medication instructions"
- ❌ "Copy medication details verbatim from extracted data"

**Result:** The LLM may "hallucinate" or "correct" the frequency:
- Extracted: `"Oxycodone 5mg q6h PRN"`
- LLM output: `"Oxycodone 5mg q4h PRN"` ❌

**Why Direct LLM Calls Succeed:**
They extract medications directly from the full notes in a single pass, reducing transcription errors.

---

#### **Issue #4: Missing Demographics**

**File:** `src/services/llmService.js` (lines 797-829)

**Root Cause:**
The narrative generation prompt does NOT request a demographics/header section:
```
REQUIRED SECTIONS:
1. CHIEF COMPLAINT: 1-2 sentence presenting problem
2. HISTORY OF PRESENT ILLNESS: Chronological narrative from symptom onset through admission
3. HOSPITAL COURSE: Day-by-day narrative including procedures, complications, treatment response
4. PROCEDURES: List with dates and operators
5. COMPLICATIONS: If any, describe with management
6. DISCHARGE STATUS: Functional status (GCS/mRS/KPS), neuro exam, medications, discharge destination
7. FOLLOW-UP: Clinic appointments, imaging, instructions
```

**Missing:**
- ❌ Patient name
- ❌ MRN
- ❌ Admission date
- ❌ Discharge date
- ❌ Length of stay
- ❌ Attending physician

**Why Direct LLM Calls Succeed:**
Their prompts explicitly request:
```
Generate a discharge summary with:
- Patient demographics (name, MRN, age, gender, dates)
- Principal diagnosis
- Secondary diagnoses
- [rest of sections]
```

---

#### **Issue #5: Missing Secondary Diagnoses**

**File:** `src/services/narrativeEngine.js` (lines 103-200)  
**File:** `src/services/llmService.js` (lines 797-829)

**Root Cause:**
The narrative generation prompt does NOT request a "Secondary Diagnoses" section. It only requests:
1. Chief Complaint
2. History of Present Illness
3. Hospital Course
4. Procedures
5. Complications
6. Discharge Status
7. Follow-up

**Missing section:** "Secondary Diagnoses" or "Problem List"

**Why Direct LLM Calls Succeed:**
They explicitly request:
```
Generate a discharge summary with:
- Principal diagnosis
- Secondary diagnoses (all comorbidities and complications)
- [rest of sections]
```

---

#### **Issue #6: Missing Complications (50%)**

**File:** `src/services/llmService.js` (lines 646-673)

**Root Cause:**
The `summarizeExtractedData` function (lines 659-662) summarizes complications as:
```javascript
complications: extracted.complications?.map(c => ({
  name: c.complication || c.name,
  severity: c.severity
})) || [],
```

**But it doesn't include:**
- ❌ Timing (POD)
- ❌ Management details
- ❌ Resolution status

**And the extraction may have missed complications** if they weren't explicitly labeled as "complications" in the notes.

**Example:**
- Neurogenic shock was mentioned in the notes as "hypotensive and bradycardic, requiring pressors"
- But it may not have been extracted as a "complication" if the word "neurogenic shock" wasn't used

**Why Direct LLM Calls Succeed:**
They see the full clinical context and can infer complications from clinical descriptions.

---

#### **Issue #7: Missing Discharge Destination**

**File:** `src/services/llmService.js` (lines 646-673)

**Root Cause:**
The `summarizeExtractedData` function (line 667) includes:
```javascript
discharge_status: {
  destination: extracted.discharge?.destination,
  ...
}
```

**But the narrative generation prompt** (line 826) only mentions:
```
6. DISCHARGE STATUS: Functional status (GCS/mRS/KPS), neuro exam, medications, discharge destination
```

The prompt doesn't emphasize that discharge destination should be a **prominent, clearly stated section**.

**Result:** The LLM may include it in the discharge status paragraph but not as a clear, standalone statement.

**Why Direct LLM Calls Succeed:**
They have explicit sections for "Disposition" or "Discharge Destination" in their prompts.

---

## PART 2: SPECIFIC CODE FIXES

### Fix #1: Add Demographics Section to Narrative Prompt

**File:** `src/services/llmService.js`  
**Lines:** 797-829

**Current Code:**
```javascript
REQUIRED SECTIONS:
1. CHIEF COMPLAINT: 1-2 sentence presenting problem
2. HISTORY OF PRESENT ILLNESS: ...
```

**Fixed Code:**
```javascript
REQUIRED SECTIONS:
0. PATIENT DEMOGRAPHICS (HEADER):
   - Patient name, MRN, age, gender
   - Admission date, discharge date, length of stay
   - Attending physician
   - Format: "Patient: [Name], MRN: [MRN], Age: [Age], Gender: [M/F]
             Admission: [Date], Discharge: [Date], LOS: [X] days
             Attending: Dr. [Name]"

1. CHIEF COMPLAINT: 1-2 sentence presenting problem
2. HISTORY OF PRESENT ILLNESS: ...
```

**Expected Impact:** +25% accuracy on demographics (0% → 100%)

---

### Fix #2: Add Secondary Diagnoses Section

**File:** `src/services/llmService.js`  
**Lines:** 797-829

**Current Code:**
```javascript
REQUIRED SECTIONS:
1. CHIEF COMPLAINT: ...
2. HISTORY OF PRESENT ILLNESS: ...
3. HOSPITAL COURSE: ...
```

**Fixed Code:**
```javascript
REQUIRED SECTIONS:
0. PATIENT DEMOGRAPHICS: [as above]

1. PRINCIPAL DIAGNOSIS: Primary reason for admission

2. SECONDARY DIAGNOSES: Complete list including:
   - All complications (with timing and resolution status)
   - Comorbidities (pre-existing conditions)
   - Hospital-acquired conditions
   Format as numbered list with details

3. CHIEF COMPLAINT: ...
4. HISTORY OF PRESENT ILLNESS: ...
5. HOSPITAL COURSE: ...
```

**Expected Impact:** +50% accuracy on secondary diagnoses (0% → 100%)

---

### Fix #3: Enhance Medication Extraction Guidance

**File:** `src/services/llmService.js`  
**Lines:** 797-829

**Add to prompt:**
```javascript
MEDICATION ACCURACY REQUIREMENTS:
- Extract ALL discharge medications with EXACT dosages and frequencies
- Do NOT modify or "correct" medication instructions
- Copy medication details VERBATIM from the notes
- Include route of administration (PO, IV, SQ, etc.)
- Specify duration for time-limited medications (e.g., "x 4 more weeks")
- Format: "Medication name dose route frequency (duration if applicable)"
  Example: "Vancomycin 1g IV q12h x 4 weeks"
```

**Expected Impact:** +40% accuracy on medications (60% → 100%)

---

### Fix #4: Emphasize Date Verification

**File:** `src/services/llmService.js`  
**Lines:** 395-609 (extraction prompt)

**Add to extraction prompt:**
```javascript
DATE VERIFICATION PROTOCOL:
- Cross-reference all dates with note timestamps
- Verify POD calculations: POD X = Admission Date + X days
- If a procedure date seems inconsistent, recalculate from POD
- Format all dates as YYYY-MM-DD
- Double-check: Does "POD 14" match the stated date?
```

**Expected Impact:** +15% accuracy on dates (85% → 100%)

---

### Fix #5: Enhance Functional Status Extraction

**File:** `src/services/llmService.js`  
**Lines:** 646-673 (summarizeExtractedData function)

**Current Code:**
```javascript
discharge_status: {
  destination: extracted.discharge?.destination,
  mrs: extracted.discharge?.mrs,
  kps: extracted.discharge?.kps,
  gcs: extracted.discharge?.gcs
}
```

**Fixed Code:**
```javascript
discharge_status: {
  destination: extracted.discharge?.destination,
  mrs: extracted.discharge?.mrs,
  kps: extracted.discharge?.kps,
  gcs: extracted.discharge?.gcs,
  // ADD DETAILED NEUROLOGIC EXAM
  neuro_exam: {
    motor: extracted.discharge?.motorExam || extracted.functionalScores?.motorExam,
    sensory: extracted.discharge?.sensoryExam || extracted.functionalScores?.sensoryExam,
    reflexes: extracted.discharge?.reflexes || extracted.functionalScores?.reflexes,
    cranial_nerves: extracted.discharge?.cranialNerves,
    // CRITICAL: Include any late recovery events
    recovery_events: extracted.discharge?.recoveryEvents || []
  }
}
```

**AND update narrative prompt to emphasize:**
```javascript
6. DISCHARGE STATUS:
   - Detailed neurological examination (motor strength by muscle group, sensory level, reflexes)
   - Functional scores (GCS, mRS, KPS, ASIA if applicable)
   - **CRITICAL: Document any late neurologic recovery or improvement**
   - Discharge medications (complete list with exact dosages)
   - Discharge destination
```

**Expected Impact:** +37.5% accuracy on functional status (62.5% → 100%)

---

## PART 3: ARCHITECTURE RECOMMENDATIONS

### Option A: Single-Pass LLM Generation (RECOMMENDED)

**Approach:** Use ONE comprehensive LLM call to generate the complete discharge summary directly from clinical notes.

**Architecture:**
```
Clinical Notes → Single Comprehensive Prompt → Complete Discharge Summary → Structured Parsing
```

**Advantages:**
- ✅ No information loss
- ✅ Matches Gemini/Claude/OpenAI approach (90%+ accuracy)
- ✅ Simpler codebase
- ✅ Faster (one LLM call instead of two)
- ✅ Better narrative coherence

**Disadvantages:**
- ⚠️ Less structured extraction (but can parse output)
- ⚠️ Harder to validate individual fields
- ⚠️ May need post-processing to extract structured data

**Implementation:**
1. Create new comprehensive prompt that requests ALL sections
2. Parse LLM output into structured sections
3. Extract structured data from narrative (reverse extraction)
4. Validate completeness

**Estimated Accuracy:** 90-95%

---

### Option B: Enhanced Two-Phase Approach (CURRENT + FIXES)

**Approach:** Keep current architecture but fix information loss issues.

**Architecture:**
```
Clinical Notes → Enhanced Extraction → Enhanced Narrative Generation → Output
                        ↓                          ↓
                 Complete JSON           Full context + extracted data
```

**Changes:**
1. **Don't truncate notes** for narrative generation
2. **Don't summarize extracted data** - pass full extraction
3. **Enhance prompts** with all missing sections
4. **Add validation** to ensure all sections present

**Advantages:**
- ✅ Maintains structured extraction
- ✅ Easier to validate
- ✅ Can leverage existing code
- ✅ Incremental improvement

**Disadvantages:**
- ⚠️ Still two LLM calls (slower, more expensive)
- ⚠️ Risk of information loss remains
- ⚠️ More complex codebase

**Estimated Accuracy:** 85-90%

---

### Option C: Hybrid Approach (BEST OF BOTH)

**Approach:** Use single-pass LLM for narrative, then extract structured data from narrative.

**Architecture:**
```
Clinical Notes → Comprehensive LLM Generation → Complete Narrative
                                                        ↓
                                                 Parse & Extract
                                                        ↓
                                              Structured Data + Narrative
```

**Advantages:**
- ✅ Best narrative quality (single-pass)
- ✅ Structured data available (parsed from narrative)
- ✅ Simpler than two-phase
- ✅ Matches successful approach

**Disadvantages:**
- ⚠️ Parsing may miss some structured data
- ⚠️ Requires robust parsing logic

**Estimated Accuracy:** 92-98%

---

## RECOMMENDATION: Option C (Hybrid Approach)

**Rationale:**
1. Matches the approach used by Gemini/Claude/OpenAI (90%+ accuracy)
2. Simpler than current two-phase approach
3. Better narrative quality
4. Can still extract structured data for UI

**Implementation Strategy:**
1. Create comprehensive single-pass prompt
2. Generate complete narrative
3. Parse narrative into sections
4. Extract structured data from narrative
5. Validate completeness

---

## PART 4: ENHANCED PROMPTS

### Comprehensive Single-Pass Prompt

```javascript
export const COMPREHENSIVE_DISCHARGE_SUMMARY_PROMPT = `You are an expert neurosurgery attending physician. Generate a complete, professional discharge summary from the clinical notes below.

CLINICAL NOTES:
{sourceNotes}

REQUIRED SECTIONS (in this order):

0. PATIENT DEMOGRAPHICS
   - Patient name, MRN, age, gender
   - Admission date, discharge date, length of stay
   - Attending physician
   - Service

1. PRINCIPAL DIAGNOSIS
   - Primary reason for admission with full details

2. SECONDARY DIAGNOSES
   - All complications (with POD/timing and resolution status)
   - Pre-existing comorbidities
   - Hospital-acquired conditions
   - Format as numbered list

3. CHIEF COMPLAINT
   - 1-2 sentence presenting problem

4. HISTORY OF PRESENT ILLNESS
   - Chronological narrative from symptom onset through admission
   - Include mechanism of injury if trauma
   - Include initial presentation and ED course

5. HOSPITAL COURSE
   - Day-by-day or system-by-system narrative
   - Include all procedures with dates
   - Include all complications with management
   - Track clinical evolution and response to treatment
   - **CRITICAL: Document any late neurologic recovery or improvement**

6. PROCEDURES PERFORMED
   - List all procedures with exact dates and operators
   - Format: "Date: Procedure name (Operator: Dr. Name)"

7. COMPLICATIONS
   - List all complications with timing (POD), management, and resolution status
   - Include: infections, bleeding, neurologic changes, medical complications

8. CONDITION AT DISCHARGE / DISCHARGE STATUS
   - **Detailed neurological examination:**
     * Motor strength (by muscle group with grades)
     * Sensory examination (levels)
     * Reflexes (with grades)
     * Cranial nerves if applicable
   - Functional scores (GCS, mRS, KPS, ASIA if applicable)
   - **Document any neurologic recovery or improvement during hospitalization**
   - General physical examination findings

9. DISCHARGE MEDICATIONS
   - **Complete list with EXACT dosages, routes, and frequencies**
   - **Do NOT modify medication instructions - copy verbatim**
   - Include duration for time-limited medications
   - Format: "Medication name dose route frequency (duration)"
     Example: "Vancomycin 1g IV q12h x 4 weeks"

10. DISCHARGE DISPOSITION
    - Discharge destination (home, rehab, SNF, etc.)
    - Level of care required
    - Support services arranged

11. FOLLOW-UP PLAN
    - Clinic appointments (specialty, timeframe)
    - Imaging studies (type, timeframe)
    - Activity restrictions
    - Wound care instructions
    - Red flag symptoms to watch for

CRITICAL ACCURACY REQUIREMENTS:

1. DATES:
   - Verify all dates against note timestamps
   - Cross-check POD calculations (POD X = Admission Date + X days)
   - Format all dates as MM/DD/YYYY or Month DD, YYYY
   - If a date seems inconsistent, recalculate from POD

2. MEDICATIONS:
   - Extract ALL discharge medications
   - Preserve EXACT dosages and frequencies
   - Do NOT modify or "correct" medication instructions
   - Include route and duration

3. NEUROLOGIC EXAM:
   - Document detailed motor exam (strength by muscle group)
   - Include sensory level
   - Document reflexes
   - **CRITICAL: Capture any late neurologic recovery or improvement**

4. COMPLICATIONS:
   - List ALL complications mentioned in notes
   - Include timing (POD or date)
   - Describe management
   - Note resolution status

5. DEMOGRAPHICS:
   - Include patient name, MRN, dates, attending physician
   - Calculate length of stay

WRITING STYLE:
- Professional medical prose for attending physicians
- Use appropriate medical terminology
- Chronological flow with specific dates
- Synthesize multiple notes into coherent narrative
- Deduplicate repetitive mentions

Generate the complete discharge summary now:`;
```

---

## PART 5: IMPLEMENTATION ROADMAP

### Phase 1: Critical Fixes (Week 1) - Patient Safety

**Priority:** CRITICAL  
**Goal:** Fix neurologic recovery documentation, date accuracy, medication dosing

**Tasks:**
1. ✅ Add demographics section to narrative prompt
2. ✅ Add secondary diagnoses section to narrative prompt
3. ✅ Enhance medication extraction guidance
4. ✅ Add date verification protocol
5. ✅ Enhance functional status extraction
6. ✅ Test with Robert Chen case (spinal cord injury)

**Files to Modify:**
- `src/services/llmService.js` (lines 797-829)
- `src/services/llmService.js` (lines 646-673)
- `src/services/llmService.js` (lines 395-609)

**Success Metrics:**
- Neurologic recovery documentation: 0% → 100%
- Date accuracy: 85% → 100%
- Medication dosing accuracy: 60% → 100%
- **Overall accuracy: 43.3% → 70%+**

**Testing:**
- Run DCS app on Robert Chen case
- Compare output to Gemini/Claude/OpenAI
- Verify all 10 critical failures are fixed

---

### Phase 2: Architecture Refactoring (Week 2-3) - Completeness

**Priority:** HIGH  
**Goal:** Implement single-pass LLM generation (Option C)

**Tasks:**
1. ✅ Create comprehensive single-pass prompt
2. ✅ Implement narrative parsing logic
3. ✅ Extract structured data from narrative
4. ✅ Update UI to handle new format
5. ✅ Migrate existing code to new architecture
6. ✅ Test with multiple case types

**Files to Create/Modify:**
- `src/services/singlePassGeneration.js` (NEW)
- `src/services/narrativeParser.js` (NEW)
- `src/services/summaryOrchestrator.js` (MODIFY)
- `src/components/SummaryDisplay.jsx` (MODIFY)

**Success Metrics:**
- Demographics capture: 25% → 100%
- Secondary diagnoses: 0% → 100%
- Complications capture: 25% → 100%
- **Overall accuracy: 70% → 90%+**

---

### Phase 3: Quality Enhancement (Week 4) - Excellence

**Priority:** MEDIUM  
**Goal:** Achieve 95%+ accuracy and professional quality

**Tasks:**
1. ✅ Implement post-generation validation
2. ✅ Add section completeness checks
3. ✅ Enhance narrative flow and transitions
4. ✅ Add clinical reasoning validation
5. ✅ Implement quality scoring
6. ✅ Test with diverse case types

**Files to Create/Modify:**
- `src/services/postGenerationValidation.js` (NEW)
- `src/services/qualityScoring.js` (ENHANCE)
- `src/utils/narrativeQuality.js` (NEW)

**Success Metrics:**
- Section completeness: 90% → 100%
- Narrative quality: 70% → 95%+
- Clinical reasoning: 40% → 90%+
- **Overall accuracy: 90% → 95%+**

---

## PART 6: VALIDATION STRATEGY

### Test Cases

**Test Case 1: Robert Chen (Spinal Cord Injury)**
- Source: `summaries.md` (lines 1-741)
- Ground truth: Gemini output (98.6% accuracy)
- Critical elements: Late neurologic recovery, multiple complications, complex medication regimen

**Test Case 2: Subarachnoid Hemorrhage**
- Source: `docs/sample-note-SAH.txt`
- Critical elements: Hunt-Hess grade, vasospasm, aneurysm treatment

**Test Case 3: Brain Tumor**
- Critical elements: Extent of resection, histopathology, adjuvant therapy

**Test Case 4: Intracerebral Hemorrhage**
- Critical elements: Anticoagulation reversal, volume, mass effect

**Test Case 5: Traumatic Brain Injury**
- Critical elements: GCS trajectory, ICP management, rehabilitation

### Validation Metrics

| Category | Target | Measurement |
|----------|--------|-------------|
| Demographics | 100% | All 8 fields present and accurate |
| Diagnoses | 100% | Primary + all secondary diagnoses |
| Procedures | 95% | All procedures with correct dates |
| Complications | 100% | All complications with timing |
| Medications | 100% | All medications with exact dosing |
| Functional Status | 100% | Detailed exam + recovery events |
| Discharge Destination | 100% | Clearly stated |
| Follow-up | 100% | All appointments listed |
| **Overall** | **95%+** | Weighted average |

### Regression Testing

**Automated Test Suite:**
1. Run DCS app on all 5 test cases
2. Parse output and extract structured data
3. Compare against ground truth
4. Calculate accuracy scores
5. Flag any regressions

**Continuous Monitoring:**
- Track accuracy metrics for each case type
- Alert if accuracy drops below 90%
- Review and fix any new issues

---

## PART 7: EXPECTED OUTCOMES

### Accuracy Projections

| Phase | Timeline | Expected Accuracy | Key Improvements |
|-------|----------|-------------------|------------------|
| **Baseline** | Current | 43.3% | - |
| **Phase 1** | Week 1 | 70-75% | Demographics, medications, dates |
| **Phase 2** | Week 2-3 | 90-92% | Architecture refactoring, completeness |
| **Phase 3** | Week 4 | 95-98% | Quality enhancement, validation |

### Success Criteria

✅ **Zero critical errors:**
- No wrong dates
- No wrong medication dosages
- No missing critical clinical findings

✅ **95%+ completeness:**
- All demographics present
- All complications captured
- All medications listed
- Detailed functional status

✅ **Professional quality:**
- Narrative flow comparable to Gemini
- Appropriate medical terminology
- Chronological organization
- Clinical reasoning evident

---

## CONCLUSION

The DCS app's 43.3% accuracy is **NOT due to LLM quality** but due to **architectural issues** that cause information loss. By implementing the fixes outlined in this plan, we can achieve 95%+ accuracy within 4 weeks.

**Key Takeaway:** Simplify the architecture, enhance the prompts, and trust the LLM to generate comprehensive discharge summaries in a single pass.

**Next Steps:**
1. Review and approve this plan
2. Begin Phase 1 implementation (Week 1)
3. Test with Robert Chen case
4. Proceed to Phase 2 and 3

---

**Document Version:** 1.0  
**Last Updated:** October 16, 2025  
**Author:** DCS Development Team

