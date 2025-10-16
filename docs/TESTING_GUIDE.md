# 🧪 End-to-End Testing Guide

## ✅ Current Status
- Frontend: http://localhost:5173 (Running)
- Backend: http://localhost:3001 (Running)
- All form fields fixed with id/name attributes
- HAR file analysis: 100% success rate, no errors

---

## 🎯 Complete Testing Workflow

### Step 1: Verify Servers Are Running
```bash
# Check frontend
curl -s http://localhost:5173 | head -1
# Should return: <!doctype html>

# Check backend health
curl -s http://localhost:3001/health
# Should return: {"status":"healthy","services":{...}}
```

### Step 2: Open the App
Navigate to: **http://localhost:5173**

You should see:
- ✅ Clean medical-themed UI
- ✅ 4 tabs: Upload Notes | Review Data | Generate Summary | Settings
- ✅ Brain icon in header
- ✅ No console errors (press F12 to check)

---

## 🧪 Test Case 1: Upload & Extract (File Upload)

### Actions:
1. Go to **Upload Notes** tab
2. Click **"Select Files"** or drag & drop
3. Select `test-note-comprehensive.txt`
4. Click **"Process Notes"** button

### Expected Results:
✅ **Console Output:**
```javascript
"Notes uploaded: 1"
"Starting extraction..."
"Using Anthropic Claude 3.5 Sonnet for extraction task"
"POST http://localhost:3001/api/anthropic" (Status: 200)
"✅ LLM extraction successful"
"Merging 2 extraction results"
"Timeline built: X events"
"Extraction complete"
```

✅ **Browser Behavior:**
- Loading spinner appears
- "Processing..." message shows
- Takes 5-15 seconds
- Automatically switches to **Review Data** tab
- Success notification appears

✅ **Data Extracted:**
All fields should be populated:
- **Basic Info**: John Doe, 12345678, 06/15/1960, Male, 65
- **Diagnoses**: CAD, s/p CABG x3
- **Procedures**: CABG x3
- **PMH**: HTN, DM, Hyperlipidemia, Previous MI
- **Allergies**: Penicillin (rash)
- **Medications**: All 6 discharge meds with dosages
- **Vitals**: BP 128/76, HR 78, SpO2 97%
- **Labs**: Hgb 11.2, Cr 0.9, K 4.1
- **Timeline**: POD #1 events in chronological order

---

## 🧪 Test Case 2: Manual Entry

### Actions:
1. Go to **Upload Notes** tab
2. Click **"Manual Entry"** button
3. Paste this short note:
   ```
   POD #2
   Patient: Jane Smith, 45F
   Diagnosis: Brain tumor resection
   Vitals: BP 110/70, HR 65
   Neuro: Alert, moving all extremities
   Plan: Continue dexamethasone, PT consult
   ```
4. Click **"Add Note"**
5. Click **"Process Notes"**

### Expected Results:
✅ Same extraction workflow as Test Case 1
✅ Modal closes after adding note
✅ Data extracted from pasted text

---

## 🧪 Test Case 3: Edit Extracted Data

### Actions:
1. In **Review Data** tab (after extraction)
2. Click **Edit** button (pencil icon) on any field
3. Modify the value
4. Click **Save** (✓) or **Cancel** (✗)

### Expected Results:
✅ Edit modal opens with current value
✅ Input has proper `id` and `name` attributes (no console warnings)
✅ Save updates the value immediately
✅ Cancel discards changes
✅ Confidence indicator shows if manually edited

---

## 🧪 Test Case 4: Generate Discharge Summary

### Actions:
1. Go to **Generate Summary** tab
2. Review the pre-filled data
3. Click **"Generate Summary"** button
4. Wait for generation (5-10 seconds)

### Expected Results:
✅ **Console Output:**
```javascript
"Generating summary..."
"Using Anthropic Claude 3.5 Sonnet for summarization task"
"POST http://localhost:3001/api/anthropic" (Status: 200)
"Summary generated successfully"
```

✅ **Summary Display:**
7 sections should appear:
1. **Patient Demographics** - Name, MRN, DOB, etc.
2. **Admission/Discharge** - Dates, attending, diagnoses
3. **Hospital Course** - Chronological narrative of POD events
4. **Procedures** - CABG x3 details
5. **Medications** - All 6 discharge meds formatted
6. **Follow-up** - Cardiology in 2 weeks, PCP in 1 week
7. **Disposition** - Discharge location and condition

✅ **Actions Available:**
- **Copy to Clipboard** button (copies entire summary)
- **Download** button (saves as `discharge-summary-{timestamp}.txt`)
- **Regenerate** button (creates new summary with different wording)

---

## 🧪 Test Case 5: Settings & Provider Selection

### Actions:
1. Go to **Settings** tab
2. Toggle **"Auto-select by Task Quality"**
3. Select different providers from dropdowns
4. Verify no console warnings about form fields

### Expected Results:
✅ Toggle switch works smoothly
✅ When auto-select enabled: Provider dropdowns show "Auto (Best: Claude)"
✅ When auto-select disabled: Can manually select provider
✅ All form fields have `id` and `name` attributes (no warnings)
✅ API keys section shows all 3 providers (if keys added)

---

## 🧪 Test Case 6: Error Handling

### Actions:
1. Stop backend server: `pkill -f "node server"`
2. Try to process notes

### Expected Results:
❌ **Error Handling:**
- "Failed to connect to backend" error message
- User-friendly error notification
- Retry button available
- Console shows: `Failed to fetch` or `ERR_CONNECTION_REFUSED`

### Recovery:
```bash
cd /Users/ramihatoum/Desktop/app/DCS/backend
node server.js &
```

---

## 🧪 Test Case 7: Form Accessibility (Your Recent Fix)

### Actions:
1. Open **DevTools** (F12)
2. Go to **Console** tab
3. Interact with all forms:
   - Upload file input
   - Manual entry textarea
   - Settings toggles/selects
   - Edit fields in Review Data
   - API key inputs

### Expected Results:
✅ **NO warnings about:**
- "A form field element should have an id or name attribute"

✅ **All inputs have:**
- Unique `id` attribute
- Matching `name` attribute
- Proper labels (for screen readers)

---

## 📊 Success Criteria

Your app is working correctly if:

- [x] Both servers running (5173 & 3001)
- [x] Page loads in <500ms
- [x] No console errors on load
- [x] File upload works
- [x] Manual entry works
- [x] Extraction completes in 5-15 seconds
- [x] Review Data shows all fields
- [x] Can edit and save field values
- [x] Generate Summary creates 7-section output
- [x] Can copy/download summary
- [x] Settings controls work
- [x] No form accessibility warnings
- [x] Backend API calls return 200 OK

---

## 🔍 Debugging Checklist

If something doesn't work:

**1. Check Servers:**
```bash
lsof -ti:5173  # Frontend running?
lsof -ti:3001  # Backend running?
curl http://localhost:3001/health  # Backend healthy?
```

**2. Check Console (F12):**
- Look for red error messages
- Check Network tab for failed requests
- Verify API calls go to localhost:3001

**3. Check Backend Logs:**
```bash
# If backend running in terminal, check output
# Look for "📨 Anthropic API request received"
```

**4. Check API Keys:**
```bash
cat /Users/ramihatoum/Desktop/app/DCS/backend/.env
# Should have all 3 keys
```

**5. Nuclear Option:**
```bash
# Restart everything
pkill -f "node server"
pkill -f "vite"
cd /Users/ramihatoum/Desktop/app/DCS
./launch.sh
```

---

## 🎉 Test Results Template

After testing, document your results:

```
✅ Upload File: PASS
✅ Manual Entry: PASS
✅ Data Extraction: PASS
✅ Edit Fields: PASS
✅ Generate Summary: PASS
✅ Copy/Download: PASS
✅ Settings: PASS
✅ Form Accessibility: PASS (no warnings)
✅ Error Handling: PASS
✅ Performance: <500ms load, 5-15s extraction

🎉 All tests passed! App is production-ready!
```

---

## 📝 Next Steps After Testing

Once all tests pass:

1. **Test with real clinical notes** - Use actual hospital notes
2. **Fine-tune patterns** - Adjust `pathologyPatterns.js` for your format
3. **Customize summary** - Modify `SummaryGenerator.jsx` sections
4. **Add specialties** - Extend patterns for other medical specialties
5. **Deploy** - Set up on secure server with authentication

---

**Ready to test?** Start with Test Case 1 using `test-note-comprehensive.txt`! 🚀
