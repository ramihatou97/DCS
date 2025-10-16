# User Guide: Editing Discharge Summaries & ML Learning

## 🎯 Quick Start

### How to Edit a Generated Summary:

1. **Generate a summary** (Upload → Extract → Review → Generate)
2. **Click "Edit Summary"** button (blue button at top)
3. **Edit any section** by typing directly in the text areas
4. **Click "Save Corrections"** when done
5. **Done!** Your changes are saved and the system learns from them

---

## 🧠 How the Learning Works

### What Happens When You Edit:

Every time you save corrections, the system:

1. **Compares** your edited text to the original
2. **Identifies patterns** in your corrections
3. **Learns your preferences** (style, terminology, detail level)
4. **Applies learning** to future summaries

### What the System Learns:

| What You Do | What System Learns |
|-------------|-------------------|
| Make text shorter | You prefer concise style |
| Make text longer | You prefer detailed style |
| Expand abbreviations | Spell out terms on first use |
| Add abbreviations | Use standard abbreviations |
| Add specific dates | Include dates for all events |
| Add "left" or "right" | Always specify laterality |
| Add transition words | Use phrases like "Subsequently," |
| Reorder sentences | Preferred sentence structure |

### How Many Corrections Needed:

- **2 corrections:** System starts learning pattern
- **3-5 corrections:** Pattern becomes reliable
- **10+ corrections:** Strong pattern, high confidence
- **20+ corrections:** Near-perfect matching

---

## 📝 Editing Tips

### Best Practices:

1. **Be Consistent:**
   - If you expand "SAH" once, do it every time
   - If you prefer concise style, keep it consistent
   - Consistency helps the system learn faster

2. **Edit What Matters:**
   - Focus on style, terminology, and structure
   - Don't worry about minor typos
   - The system learns from meaningful changes

3. **Use Standard Medical Language:**
   - The system learns medical terminology
   - Use standard abbreviations (GCS, mRS, EVD, etc.)
   - Spell out on first use if that's your preference

4. **Add Clinical Details:**
   - If you add laterality (left/right), do it consistently
   - If you add specific dates, do it for all events
   - If you add procedure details, be thorough

### Common Edits:

#### **Style Changes:**

**Original:**
```
The patient is a 64-year-old male who presented with sudden severe headache.
```

**Concise Edit:**
```
64-year-old male with sudden severe headache.
```

**System Learns:** User prefers concise style

---

#### **Abbreviation Expansion:**

**Original:**
```
Patient admitted with SAH, Hunt-Hess 3, Fisher 4.
```

**Expanded Edit:**
```
Patient admitted with subarachnoid hemorrhage (SAH), Hunt-Hess grade 3, Fisher grade 4.
```

**System Learns:** Expand abbreviations on first use

---

#### **Adding Detail:**

**Original:**
```
Patient underwent craniotomy.
```

**Detailed Edit:**
```
On hospital day 2, patient underwent right frontal craniotomy for aneurysm clipping.
```

**System Learns:** Add timing, laterality, and procedure details

---

#### **Adding Transitions:**

**Original:**
```
Patient underwent coiling. Patient was monitored for vasospasm.
```

**With Transitions:**
```
Patient underwent coiling. Subsequently, patient was monitored for vasospasm.
```

**System Learns:** Use transition phrases between sentences

---

## 🏥 Pathology-Specific Learning

The system learns different patterns for different pathology types:

### **SAH (Subarachnoid Hemorrhage):**
- Learns to emphasize Hunt-Hess and Fisher grades
- Learns vasospasm monitoring details
- Learns nimodipine therapy descriptions
- Learns aneurysm securing method details

### **Brain Tumor:**
- Learns to specify tumor location and size
- Learns extent of resection descriptions
- Learns histopathology reporting
- Learns adjuvant therapy planning

### **ICH (Intracerebral Hemorrhage):**
- Learns hemorrhage location and volume
- Learns blood pressure management details
- Learns anticoagulation reversal descriptions
- Learns surgical vs medical management rationale

### **Trauma/TBI:**
- Learns mechanism and GCS reporting
- Learns CT findings descriptions
- Learns ICP management details
- Learns rehabilitation assessment

### **Spine:**
- Learns levels and approach descriptions
- Learns neurological status reporting
- Learns instrumentation details
- Learns activity restriction specifications

---

## 📊 Tracking Your Progress

### Check Learning Dashboard:

1. Go to **"Learning"** tab
2. View **correction statistics**
3. See **learned patterns**
4. Track **accuracy improvements**

### What You'll See:

- **Total corrections made**
- **Patterns learned** (by section)
- **Accuracy trends** over time
- **Most corrected sections**

---

## 💡 Pro Tips

### Maximize Learning Efficiency:

1. **Start with Hospital Course:**
   - This section benefits most from learning
   - Make consistent edits here first
   - System learns narrative flow

2. **Focus on One Pattern at a Time:**
   - Week 1: Work on abbreviations
   - Week 2: Work on detail level
   - Week 3: Work on transitions
   - Focused learning is faster

3. **Review Before Editing:**
   - Read the whole summary first
   - Identify consistent issues
   - Make similar edits across sections

4. **Use the Same Terminology:**
   - Pick your preferred terms and stick to them
   - "Craniotomy" vs "Crani" - choose one
   - "Post-operative day" vs "POD" - be consistent

### Common Mistakes to Avoid:

❌ **Don't:** Make random, inconsistent edits
✅ **Do:** Make consistent, pattern-based edits

❌ **Don't:** Edit only one summary
✅ **Do:** Edit multiple summaries consistently

❌ **Don't:** Change your style frequently
✅ **Do:** Maintain consistent preferences

❌ **Don't:** Ignore the learning dashboard
✅ **Do:** Check progress regularly

---

## 🔒 Privacy & Security

### What Gets Stored:

- ✅ **Patterns** (e.g., "user prefers concise style")
- ✅ **Structures** (e.g., "add laterality to procedures")
- ✅ **Preferences** (e.g., "expand abbreviations")

### What Does NOT Get Stored:

- ❌ **Patient names**
- ❌ **Dates** (anonymized to [DATE])
- ❌ **Locations** (anonymized to [LOCATION])
- ❌ **MRNs** (anonymized to [MRN])
- ❌ **Any PHI**

### Storage Location:

- **Client-side only** (your browser)
- **IndexedDB** (local database)
- **No server transmission**
- **HIPAA-compliant**

---

## 🎓 Example Learning Journey

### Week 1: First 5 Summaries
- System learns basic style (concise vs detailed)
- Learns abbreviation preferences
- Starts recognizing patterns

### Week 2: 10-15 Summaries
- Style consistency improves
- Terminology matches preferences
- Transition phrases more natural

### Week 3: 20-30 Summaries
- Minimal editing required
- Pathology-specific patterns learned
- Institution-specific terms learned

### Month 2: 50+ Summaries
- Near-perfect style matching
- Rare corrections needed
- System fully adapted to your style

---

## 🆘 Troubleshooting

### "My edits aren't being saved"
- Make sure you click "Save Corrections" (not Cancel)
- Check browser console for errors
- Verify IndexedDB is enabled in browser

### "System isn't learning from my edits"
- Need at least 2 similar corrections for pattern
- Check Learning Dashboard for learned patterns
- Ensure edits are consistent across summaries

### "Learned patterns not applying"
- Patterns apply to new summaries only
- Regenerate summary to see improvements
- Check that patterns are enabled in Learning Dashboard

### "Want to reset learning"
- Go to Learning Dashboard
- Click "Clear All Learning Data"
- Confirm reset

---

## 📞 Support

For questions or issues:
1. Check browser console for error messages
2. Review Learning Dashboard for statistics
3. Verify corrections are being tracked (console logs)
4. Contact support with specific examples

---

## 🎉 Summary

**Editing summaries helps the AI learn YOUR style!**

The more you edit, the better the system gets at generating summaries that match your preferences. After 20-30 summaries, you'll notice significant improvements and require minimal editing.

**Happy editing!** 🚀

