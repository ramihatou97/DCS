# 🚀 QUICK START: Testing Phase 1 Improvements

**Goal:** Validate that Phase 1 fixes improve DCS app accuracy from 43.3% to 70%+

---

## PREREQUISITES

1. ✅ Phase 1 code changes applied to `src/services/llmService.js`
2. ✅ Backend proxy server running on `http://localhost:3001`
3. ✅ API keys configured on backend (Claude, GPT-4o, or Gemini)
4. ✅ `summaries.md` file present in project root

---

## STEP 1: Build the Project

```bash
npm run build
```

**Expected Output:**
```
✓ built in XXXms
```

**If errors occur:**
- Check syntax in `src/services/llmService.js`
- Review `PHASE1_CHANGES_SUMMARY.md` for correct changes

---

## STEP 2: Start Backend Proxy Server

**Terminal 1:**
```bash
cd backend
node server.js
```

**Expected Output:**
```
🚀 CORS Proxy Server running on http://localhost:3001
✅ Anthropic API key configured
✅ OpenAI API key configured
✅ Gemini API key configured
```

**If errors occur:**
- Verify API keys in `backend/.env`
- Check port 3001 is not in use

---

## STEP 3: Run Automated Test

**Terminal 2:**
```bash
node test-phase1-improvements.js
```

**Expected Output:**
```
🧪 PHASE 1 IMPROVEMENTS TEST

Testing DCS app with Phase 1 fixes against Robert Chen case

📄 Loading clinical notes...
✅ Loaded clinical notes: XXXXX characters, 741 lines

🤖 Generating discharge summary with DCS app...
✅ Summary generated in X.Xs

💾 Output saved to: phase1-test-output.txt

📊 Analyzing output...

============================================================
ACCURACY RESULTS
============================================================
Demographics:          XX.X% (✅ MRN, ✅ Name)
Complications:         XX.X% (X/4 captured)
Medications:           XX.X% (X found)
Functional Status:     XX.X% (✅ Late recovery)
Discharge Destination: XX.X% (✅ Present)
============================================================
OVERALL ACCURACY:      XX.X%
============================================================

🔍 CRITICAL CHECKS:
  Demographics section present: ✅ YES
  Neurogenic shock captured:    ✅ YES
  UTI captured:                 ✅ YES
  Oxycodone q6h (not q4h):      ✅ YES
  Late recovery documented:     ✅ YES

🎯 SUCCESS CRITERIA:
  ✅ Target accuracy achieved: XX.X% >= 70%
  📈 Improvement over baseline: +XX.X percentage points
```

---

## STEP 4: Review Generated Output

**Open the generated file:**
```bash
cat phase1-test-output.txt
```

**Or open in editor:**
```bash
code phase1-test-output.txt
```

**What to look for:**

### ✅ Demographics Section (NEW)
```
Patient: Robert Chen, MRN: 45678912, Age: 67, Gender: Male
Admission: 09/20/2025, Discharge: 10/13/2025, Length of Stay: 23 days
Attending: Dr. Patterson, Service: Neurosurgery
```

### ✅ Secondary Diagnoses Section (NEW)
```
SECONDARY DIAGNOSES:
1. Neurogenic shock (resolved)
2. Bilateral pulmonary embolism (POD 10)
3. Postoperative MRSA wound infection (POD 14)
4. Urinary tract infection (POD 8, resolved)
...
```

### ✅ Correct Medication Dosing
```
DISCHARGE MEDICATIONS:
- Oxycodone 5mg PO q6h PRN pain  ← Should be q6h, NOT q4h
- Vancomycin 1g IV q12h x 4 weeks
...
```

### ✅ Late Neurologic Recovery
```
DISCHARGE STATUS:
...
On POD 20, encouraging neurological recovery was observed. The patient 
demonstrated trace flicker (1/5) in the left quadriceps muscle...
```

### ✅ All Complications Listed
```
COMPLICATIONS:
1. Neurogenic shock (POD 0-5) - managed with pressors
2. Urinary tract infection (POD 8) - treated with antibiotics
3. Bilateral pulmonary embolism (POD 10) - IVC filter placed
4. MRSA wound infection (POD 14) - I&D x2, vancomycin
```

---

## STEP 5: Compare to Ground Truth

**Open Gemini output (ground truth):**
```bash
# View lines 876-1036 in summaries.md
sed -n '876,1036p' summaries.md
```

**Compare:**
1. Demographics completeness
2. Secondary diagnoses coverage
3. Medication accuracy
4. Functional status detail
5. Complication completeness

---

## SUCCESS CRITERIA

### ✅ Phase 1 Success (Target: 70%+)

- [ ] Overall accuracy ≥ 70%
- [ ] Demographics section present with all 8 fields
- [ ] Secondary diagnoses section present
- [ ] Neurogenic shock captured
- [ ] UTI captured
- [ ] Oxycodone frequency correct (q6h not q4h)
- [ ] Late recovery documented (L leg 1/5)
- [ ] Discharge destination stated
- [ ] No critical errors (wrong dates, wrong dosages)

### 🎯 Stretch Goal (Target: 80%+)

- [ ] Overall accuracy ≥ 80%
- [ ] All 11 secondary diagnoses captured
- [ ] All 5 procedures with correct dates
- [ ] All 10 medications with exact dosages
- [ ] Detailed neurologic exam
- [ ] Professional narrative quality

---

## TROUBLESHOOTING

### Issue: Test Script Fails to Load Notes

**Error:**
```
Error: Could not find end of clinical notes in summaries.md
```

**Solution:**
- Verify `summaries.md` exists in project root
- Check file contains "# Summary 1: DCS App" marker
- Ensure file is not corrupted

### Issue: Summary Generation Fails

**Error:**
```
❌ Summary generation failed: [error message]
```

**Solutions:**
1. **Backend not running:**
   ```bash
   cd backend && node server.js
   ```

2. **API key missing:**
   - Check `backend/.env` has API keys
   - Verify at least one provider configured

3. **Timeout:**
   - Increase timeout in test script
   - Check network connection

### Issue: Low Accuracy (<70%)

**Possible Causes:**
1. **Phase 1 changes not applied correctly**
   - Review `PHASE1_CHANGES_SUMMARY.md`
   - Verify all 4 changes in `llmService.js`
   - Run `npm run build` again

2. **LLM not following prompt**
   - Try different provider (Claude vs GPT-4o vs Gemini)
   - Check prompt in `llmService.js` lines 822-929

3. **Note truncation still too aggressive**
   - Verify truncation limit is 30000 (line 817)
   - Consider removing truncation entirely

### Issue: Specific Fields Missing

**Demographics missing:**
- Check prompt has section 0 (Patient Demographics)
- Verify `summarizeExtractedData` includes name, MRN, etc.

**Late recovery missing:**
- Check truncation limit (should be 30000)
- Verify prompt emphasizes "late neurologic recovery"
- Check neuro_exam in `summarizeExtractedData`

**Medications wrong:**
- Check prompt has "MEDICATION ACCURACY" section
- Verify "copy verbatim" instruction present

---

## NEXT STEPS

### If Phase 1 Successful (≥70% accuracy)

1. **Document results:**
   - Save test output
   - Note accuracy scores
   - Capture any issues

2. **Test additional cases:**
   ```bash
   # Test with SAH case
   # Modify test script to use docs/sample-note-SAH.txt
   ```

3. **Proceed to Phase 2:**
   - Review `DCS_ACCURACY_IMPROVEMENT_PLAN.md` Phase 2 section
   - Begin single-pass architecture implementation

### If Phase 1 Unsuccessful (<70% accuracy)

1. **Review output:**
   - Identify which categories are low
   - Check for specific missing elements

2. **Refine prompts:**
   - Add more emphasis to weak areas
   - Provide more examples

3. **Debug:**
   - Check console logs
   - Verify LLM provider is working
   - Test with different provider

4. **Re-test:**
   ```bash
   node test-phase1-improvements.js
   ```

---

## ADDITIONAL TESTING

### Test with Different Case Types

**SAH Case:**
```bash
# Modify test script to use SAH notes
# Expected: Similar accuracy improvement
```

**Brain Tumor Case:**
```bash
# Create test case for brain tumor
# Expected: Pathology-specific sections work
```

**Multiple Cases:**
```bash
# Run batch testing
# Expected: Consistent accuracy across pathologies
```

---

## REPORTING RESULTS

### Create Test Report

**Template:**
```markdown
# Phase 1 Test Results

**Date:** [Date]
**Tester:** [Name]
**Test Case:** Robert Chen (Spinal Cord Injury)

## Results
- Overall Accuracy: XX.X%
- Demographics: XX.X%
- Complications: XX.X%
- Medications: XX.X%
- Functional Status: XX.X%

## Critical Checks
- [✅/❌] Demographics present
- [✅/❌] Neurogenic shock captured
- [✅/❌] UTI captured
- [✅/❌] Oxycodone q6h correct
- [✅/❌] Late recovery documented

## Issues Found
1. [Issue description]
2. [Issue description]

## Recommendations
- [Recommendation]
```

### Share Results

1. **Save test output:**
   ```bash
   cp phase1-test-output.txt results/phase1-test-$(date +%Y%m%d).txt
   ```

2. **Document in GitHub:**
   - Create issue with test results
   - Tag relevant team members

3. **Update documentation:**
   - Add results to `PHASE1_CHANGES_SUMMARY.md`
   - Update `EXECUTIVE_SUMMARY_ACCURACY_IMPROVEMENT.md`

---

## SUPPORT

**Questions:**
- Review `DCS_ACCURACY_IMPROVEMENT_PLAN.md` for detailed information
- Check `IMPLEMENTATION_GUIDE_PHASE1.md` for step-by-step guide
- Review `PHASE1_CHANGES_SUMMARY.md` for change details

**Issues:**
- Check console logs for errors
- Verify all prerequisites met
- Review troubleshooting section above

---

**Document Version:** 1.0  
**Last Updated:** October 16, 2025  
**Estimated Testing Time:** 15-30 minutes

