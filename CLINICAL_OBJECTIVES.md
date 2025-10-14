# Discharge Summary Generator - Clinical Objectives & Constraints

## 🎯 Primary Mission

Create **accurate, chronologically coherent medical narratives** that capture the patient's complete journey from admission to discharge, synthesizing unstructured, repetitive, variable-style clinical notes into comprehensive neurosurgical discharge summaries.

---

## 📋 Input Note Types

| Note Type | Content Focus | Contains | Priority |
|-----------|--------------|----------|----------|
| **Admission Notes** | Initial presentation, history, physical exam | Demographics, presentation, initial workup | HIGH |
| **Progress Notes** | Daily clinical status, events | **Often contains procedure details** | HIGH |
| **Operative Notes** | Surgical procedure details | Procedure specifics (when separate) | HIGH |
| **Procedure Notes** | Intervention specifics | Procedure details (when separate) | HIGH |
| **Consultant Notes** | Specialist recommendations | Thrombosis, ID, Neurology, Palliative input | MEDIUM |
| **PT/OT Notes** | Functional assessment | **ONLY source for functional scores** | HIGH |
| **Medication List** | Drug regimen | Provided separately | LOW |

**Key Note:** Procedure information is frequently embedded in progress notes rather than separate operative/procedure notes.

---

## 🎯 Critical Extraction Targets (In Priority Order)

### 1. Demographics & Baseline Status
- **Age** (explicit)
- **Sex** (M/F/Other)
- **Anticoagulation Status** (CRITICAL for neurosurgery):
  - ASA / Aspirin (acetylsalicylic acid)
  - Plavix / Clopidogrel
  - Coumadin / Warfarin
  - Brilinta / Ticagrelor
  - Eliquis / Apixaban
  - Xarelto / Rivaroxaban
  - Pradaxa / Dabigatran

### 2. Medical & Surgical History
- Focus on **neurosurgically significant** conditions
- Previous procedures, relevant comorbidities
- Baseline neurological status

### 3. Clinical Presentation
- **Onset:** When symptoms began
- **Symptoms:** Initial and evolving complaints
- **Progression:** How condition developed over time
- **Severity:** Clinical trajectory

### 4. Diagnostic Workup
- **Imaging:** CT, MRI, angiography, etc.
- **Investigations:** Labs, special studies
- **Diagnosis:** Final clinical diagnosis (from documented findings)

### 5. Management (Surgical & Medical)
- **Procedures:** Extract from:
  - Operative notes (when separate)
  - Procedure notes (when separate)
  - **Progress notes** (most common location)
- **Indication:** Why procedure was performed
- **Details:** Key operative findings/steps
- **Medical Management:** Medications, interventions

### 6. Clinical Evolution (Day-by-Day)
- **POD (Post-Operative Day) entries**
- **Significant Events:**
  - Seizures
  - Bleeding/hemorrhage
  - Neurological changes
  - Other complications
- **Daily clinical status**
- **Imaging findings** (repeat scans)

### 7. Neurological Examinations
- **Pre-operative exam:** Baseline status
- **Post-operative exam:** Immediate post-op status
- **Serial exams:** Evolution over time
- **Discharge exam:** Final neurological status

### 8. Consultations
Commonly involved services:
- **Thrombosis Service:** Anticoagulation management
- **Infectious Disease:** Infection workup/management
- **Neurology:** Seizure management, stroke workup
- **Palliative Care:** Goals of care, symptom management
- **Other specialist services**

Extract for each consultation:
- **Service**
- **Reason for consult**
- **Recommendations**
- **Final plan**

### 9. Complications
- **Detection:** How/when identified
- **Type:** Specific complication
- **Workup:** Investigations performed
- **Management:** Interventions/treatment
- **Outcome:** Resolution or ongoing management

### 10. Family Meetings & Goals of Care
- **Participants:** Family members, healthcare team
- **Discussion topics:** Prognosis, treatment options
- **Decisions made:** Code status, goals of care
- **Outcomes:** Agreed-upon plan

### 11. Discharge Status
- **Clinical condition:** Final status before discharge
- **Functional status:** KPS, ECOG, mRS (see below)
- **Discharge destination:**
  - Home
  - Home hospital (repatriation)
  - Hospice
  - Satellite care facility
  - Rehabilitation center
  - Long-term care (LTC)
  - Palliative care
  - **Death** (include mortality outcomes)

### 12. Follow-up Plans
- **Clinic appointments:** Service, timing
- **Imaging:** Scheduled scans
- **Other:** Labs, consultations

### 13. Functional Status Assessment
**⚠️ SPECIAL NOTE:** This is the **ONLY field where the application generates/calculates information**.

- **KPS (Karnofsky Performance Status):** 0-100 scale
- **ECOG (Performance Status):** 0-5 scale
- **mRS (Modified Rankin Scale):** 0-6 scale

**Calculated from:**
- PT (Physical Therapy) notes
- OT (Occupational Therapy) notes
- Clinical examination (neurological, motor, sensory)

**Combined assessment** of:
- Mobility
- Self-care ability
- Cognitive function
- Assistance level required
- Activity limitations

---

## 🚫 Critical Constraints

### ❌ NEVER Extrapolate or Recommend

**The application must NEVER:**
- Generate medical recommendations
- Suggest treatment plans
- Extrapolate beyond documented facts
- Make clinical assumptions
- Propose diagnostic or therapeutic interventions

**Exception:** Functional status scores (KPS, ECOG, mRS) can be calculated from PT/OT notes and clinical exams.

### ✅ ALWAYS Document Source

**Every extracted field must have:**
- Clear source in clinical notes
- Direct documentation (not inferred)
- Verifiable text match

**If not documented → Do not extract**

---

## 📝 Summary Output Requirements

### Core Narrative Structure
A **chronologically accurate, logically coherent** narrative covering:

1. **Admission Phase**
   - Demographics (age, sex)
   - Anticoagulation status
   - Relevant history
   - Presenting symptoms
   - Initial examination

2. **Diagnostic Phase**
   - Workup performed
   - Imaging findings
   - Investigation results
   - Final diagnosis

3. **Intervention Phase**
   - Indication for procedure
   - Procedure details (from any source: operative note, procedure note, or progress note)
   - Pre-operative neurological status

4. **Post-Intervention Evolution**
   - Day-by-day progression (when significant)
   - POD entries
   - Clinical events (seizures, bleeding, etc.)
   - Serial neurological exams
   - Repeat imaging findings

5. **Consultations** (integrated chronologically)
   - Service consulted
   - Reason
   - Recommendations
   - Outcome

6. **Complications** (if any)
   - Identification
   - Workup
   - Management
   - Resolution

7. **Goals of Care** (if applicable)
   - Family meetings
   - Discussions held
   - Decisions made

8. **Discharge Phase**
   - Final clinical status
   - Post-operative neurological exam
   - Functional status (KPS/ECOG/mRS)
   - Discharge destination
   - Follow-up plans

### Summary Characteristics
- **Concise yet complete:** Cover entire hospital course without excessive detail
- **Chronologically organized:** Clear timeline from admission to discharge
- **Logically coherent:** Events flow naturally with cause-effect relationships
- **Medically accurate:** Only documented facts
- **Neurosurgically focused:** Emphasize relevant clinical information

---

## 🔧 Special Handling Notes

### Medications
- **Not primary focus:** Medication list provided separately
- **Exception:** Anticoagulation status is CRITICAL and must be extracted
- Extract blood thinners: ASA, Plavix, warfarin, ticagrelor, etc.

### Procedures
- Check **multiple sources:**
  1. Progress notes (most common)
  2. Operative notes (when separate)
  3. Procedure notes (when separate)
- Extract complete picture from all available sources

### Consultations
- Common services: Thrombosis, ID, Neurology, Palliative
- Extract: service + reason + plan
- Integrate into chronological narrative

### Functional Status
- **ONLY generative/calculated field**
- Requires PT/OT notes + clinical exam
- Calculate KPS, ECOG, mRS
- Flag if insufficient source data

### Discharge Destinations
Must accurately identify:
- Home discharge
- Transfer to home hospital (repatriation)
- Hospice placement
- Satellite care facility
- Rehabilitation center
- Long-term care facility
- Palliative care
- Death/mortality

---

## 🎓 Pathology-Specific Considerations

*[Awaiting user input on specific pathologies, treatments, abbreviations, and investigations for accurate extraction and summarization]*

**Expected categories:**
- Neurosurgical pathologies (tumors, vascular, trauma, spine, etc.)
- Specific procedures and techniques
- Imaging modalities and findings terminology
- Complication types
- Investigation protocols
- Pathology-specific abbreviations

---

## 📊 Quality Metrics

### Accuracy Requirements
- Demographics: 99%+ accuracy
- Procedures: 95%+ accuracy
- Complications: 95%+ accuracy
- Medications (anticoagulation): 98%+ accuracy
- Functional scores: 90%+ accuracy
- Timeline coherence: 100% (no chronological errors)

### No-Extrapolation Compliance
- 100% adherence to documented facts only
- Zero medical recommendations generated
- Functional scores: only calculated field

### Narrative Quality
- Chronological coherence: 100%
- Logical flow: Clear cause-effect relationships
- Completeness: Cover entire admission to discharge
- Conciseness: Avoid redundancy, focus on key events

---

## 🔄 Learning System Integration

The ML learning system should prioritize learning:

1. **Anticoagulation extraction** patterns (critical for neurosurgery)
2. **Procedure location detection** (progress vs operative notes)
3. **Consultant note parsing** (service-specific formats)
4. **Complication identification** (neurosurgical complications)
5. **Discharge destination classification** (various facilities/outcomes)
6. **Functional status indicators** (PT/OT terminology)
7. **Timeline reconstruction** (chronological ordering)
8. **Pathology-specific patterns** (per user corrections)

**Learning from:**
- User corrections of extracted data
- Imported discharge summaries (with or without source notes)
- Pathology-specific templates
- Institution-specific terminology

**Privacy:**
- 100% local learning
- Complete PHI removal before pattern storage
- HIPAA-compliant anonymization

---

**Document Version:** 1.0  
**Last Updated:** October 13, 2025  
**Status:** Awaiting pathology-specific details from user
