# Narrative Parsing Improvements - Oct 17, 2025

## Problem Identified
User reported: "No information patient course, complaint, procedure" in summaries
Console showed: "LLM narrative parsed: 2/8 sections extracted"
**Root Cause**: Anthropic API credits exhausted (400 error) + Parser not matching all LLM output formats

## Critical Discovery
**API Error**: `Your credit balance is too low to access the Anthropic API`
- This is causing LLM calls to fail
- System falling back to basic templates
- Missing rich clinical detail

## Improvements Made

### 1. Enhanced Section Detection (narrativeEngine.js)
**Added support for ALL 11 sections from LLM prompt:**
- ✅ Principal Diagnosis (section 1)
- ✅ Secondary Diagnoses (section 2)
- ✅ Chief Complaint (section 3)
- ✅ History of Present Illness (section 4)
- ✅ Hospital Course (section 5)
- ✅ Procedures (section 6)
- ✅ Complications (section 7)
- ✅ Discharge Status (section 8)
- ✅ Discharge Medications (section 9)
- ✅ Discharge Disposition (section 10)
- ✅ Follow-up Plan (section 11)

**Previously**: Parser only looked for 7 sections, missing diagnoses and disposition

### 2. Flexible Parsing Patterns
**Added 4 different regex patterns for each section:**
1. Standard format: `SECTION NAME:\nContent`
2. Numbered format: `1. SECTION NAME:\nContent` (matches LLM prompt format)
3. Markdown format: `**SECTION NAME**\nContent`
4. Lenient format: Finds any header-like pattern

**Why**: LLMs can format output in various ways, this catches all variations

### 3. Intelligent Fallback System
**Three-tier extraction strategy:**
1. **Primary**: Structured section parsing (numbered headers)
2. **Fallback**: Pattern-based extraction (finds key medical terms)
3. **Last Resort**: Use entire response as hospital course if medical content detected

**Fallback patterns added:**
```javascript
- Chief complaint: /(?:chief complaint|presenting complaint)/i
- HPI: /(?:history of present illness|hpi|clinical presentation)/i
- Hospital course: /(?:hospital course|clinical course|hospital stay)/i
- Procedures: /(?:procedures?|operations?|surgical intervention)/i
```

### 4. Enhanced Validation & Logging
**Added comprehensive debugging:**
- Log first 500 chars of LLM response
- Log response length
- Log each section extraction success/failure
- Show which parsing pattern matched

**Example debug output:**
```
🔍 LLM Response (first 500 chars): [preview]
🔍 LLM Response length: 2847
✅ Extracted chiefComplaint: Patient presented with...
⚠️ Could not extract procedures from LLM response
📌 Fallback extracted hospitalCourse: [content]
```

### 5. LLM Service Logging (llmService.js)
**Added response validation:**
```javascript
📝 LLM generated narrative length: 2847
📝 LLM narrative preview: [first 300 chars]
❌ LLM returned no narrative!
```

### 6. Template Improvements (validateAndCompleteSections)
**Added templates for new sections:**
- Principal diagnosis from pathology data
- Secondary diagnoses from complications
- Discharge disposition from patient info

**Template fallback rules:**
- Only replace truly missing sections (null/"Not available.")
- Preserve ALL LLM-generated content (no length checks)
- Use structured data when LLM fails

### 7. Section Formatting Order
**Updated narrative output to include all 11 sections in correct order:**
1. Principal Diagnosis → 2. Secondary Diagnoses → 3. Chief Complaint → 
4. HPI → 5. Hospital Course → 6. Procedures → 7. Complications → 
8. Discharge Status → 9. Medications → 10. Disposition → 11. Follow-up

## Testing the Fixes

### Prerequisites
**CRITICAL**: You need valid API credits to test LLM generation:
- ❌ Anthropic Claude: Currently out of credits (fix this first!)
- ❓ OpenAI GPT-4: Check if you have credits
- ❓ Google Gemini: Alternative if others unavailable

### Test Procedure
1. **Restore API Access**:
   - Add credits to Anthropic: https://console.anthropic.com/settings/billing
   - OR configure OpenAI key in app settings
   - OR use Gemini as fallback

2. **Run with Real Data**:
   ```bash
   npm run dev
   # Load your SAH clinical note
   # Check console for debug messages
   ```

3. **Verify Logs**:
   ```
   ✅ Should see: "LLM narrative parsed: 10/11 sections extracted"
   ✅ Should see: Multiple "Extracted [section]" messages
   ❌ Should NOT see: "Could not extract" for critical sections
   ```

4. **Check Summary Output**:
   - Chief complaint present
   - Hospital course detailed
   - Procedures listed with dates
   - Medications accurate
   - Follow-up plan complete

## Files Modified

1. **src/services/narrativeEngine.js**
   - Lines 959-1095: Enhanced `parseLLMNarrative()` function
   - Lines 875-970: Updated `validateAndCompleteSections()`
   - Lines 823-836: Updated `sectionOrder` array

2. **src/services/llmService.js**
   - Lines 1141-1156: Added response logging

## Expected Improvements

### Before Fixes
- 2/8 sections extracted
- Missing: patient course, complaints, procedures
- Template fallback for most content
- Minimal clinical detail

### After Fixes (with API credits)
- 10-11/11 sections extracted
- Rich clinical narratives
- Accurate procedures, dates, medications
- Minimal template usage
- Comprehensive discharge summaries

## Action Required

**IMMEDIATE**: 
1. ✅ Add Anthropic API credits OR
2. ✅ Configure OpenAI API key OR
3. ✅ Enable Gemini as provider

**Without valid LLM access, summaries will remain template-based with minimal detail.**

## Cost Considerations

**Anthropic Claude 3.5 Sonnet**: ~$3 per 1M input tokens
**OpenAI GPT-4o**: ~$2.50 per 1M input tokens  
**Google Gemini Pro**: ~$1.25 per 1M input tokens

**Average discharge summary**: ~5,000 tokens → $0.01-0.02 per summary

## Next Steps

1. **Restore API access** (critical blocker)
2. **Test with clinical data**
3. **Enable Phase 1.5 & 3 features** (using enable_features_now.html)
4. **Run comprehensive quality tests**
5. **Deploy to production**

---

**Status**: ✅ Code improvements complete, waiting for API access restoration
**Priority**: 🔴 HIGH - Cannot test without valid LLM provider
