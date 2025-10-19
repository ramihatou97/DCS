# 🤖 LLM Quick Reference Guide

**Quick answers to: "What do LLMs do in this app?"**

---

## 🎯 What LLMs Do (In 30 Seconds)

LLMs are **AI engines** that:
1. **Read** unstructured clinical notes
2. **Extract** structured medical data (92-98% accuracy)
3. **Write** professional discharge summaries

They are **NOT** autonomous - they're controlled by the app's orchestration system.

---

## 📍 Where LLMs Are Used

### Two Main Places:

#### 1️⃣ **Phase 1: Data Extraction** (Optional)
```
Clinical Notes → 🤖 LLM → Structured Data
```
- **File:** `src/services/extraction.js`
- **Function:** `extractWithLLM()`
- **When:** User clicks "Process Notes"
- **Fallback:** Pattern-based extraction if LLM unavailable

#### 2️⃣ **Phase 3: Narrative Generation** (Optional)
```
Structured Data → 🤖 LLM → Professional Summary
```
- **File:** `src/services/narrativeEngine.js`
- **Function:** `generateSummaryWithLLM()`
- **When:** User clicks "Generate Summary"
- **Fallback:** Template-based generation if LLM unavailable

---

## 🎛️ Who Controls the LLM?

### Control Hierarchy:

```
👤 USER
  ├─ Selects which model (Claude, GPT, Gemini)
  ├─ Can disable LLM entirely
  └─ Reviews & corrects all outputs
      ↓
🎯 ORCHESTRATOR
  ├─ Decides when to call LLM
  ├─ Enforces quality thresholds
  └─ Manages fallback to patterns
      ↓
✅ VALIDATOR
  ├─ Checks LLM output completeness
  ├─ Validates accuracy
  └─ Rejects invalid data
      ↓
📊 MONITOR
  ├─ Tracks API usage
  ├─ Monitors costs
  └─ Measures performance
      ↓
🤖 LLM API
```

**Key Point:** LLMs never make decisions - they only process data when explicitly called.

---

## 🔄 How LLMs Interact with Other Code

### Integration Map:

```
┌─────────────────────────────────────────────────────────────┐
│                   Clinical Notes (Input)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
┌──────────────────┐            ┌──────────────────┐
│  Pattern-Based   │            │  🤖 LLM-Based    │
│  Extraction      │            │  Extraction      │
│  (Always runs)   │            │  (If available)  │
└────────┬─────────┘            └────────┬─────────┘
         │                               │
         └───────────┬───────────────────┘
                     ▼
         ┌─────────────────────┐
         │ Merge Results       │
         │ (Best of both)      │
         └──────────┬──────────┘
                    ▼
         ┌─────────────────────┐
         │ Validation Layer    │
         │ (Check quality)     │
         └──────────┬──────────┘
                    ▼
         ┌─────────────────────┐
         │ Intelligence Hub    │
         │ (Build timeline)    │
         └──────────┬──────────┘
                    ▼
         ┌─────────────────────┐
         │ Template-Based  OR  │
         │ 🤖 LLM-Based        │
         │ Narrative           │
         └──────────┬──────────┘
                    ▼
         ┌─────────────────────┐
         │ Final Quality Check │
         └──────────┬──────────┘
                    ▼
         ┌─────────────────────┐
         │ Display to User     │
         └─────────────────────┘
```

---

## 🤔 Common Questions

### Q: Does the app need LLMs to work?
**A: NO.** The app has pattern-based extraction that works without LLMs (85-90% accuracy vs 92-98% with LLMs).

### Q: Are LLMs making medical decisions?
**A: NO.** LLMs only extract data and write text. No diagnosis, treatment recommendations, or clinical decisions.

### Q: What if the LLM makes a mistake?
**A: Multiple safeguards:**
- Validation layer catches errors
- Pattern-based extraction provides cross-check
- User reviews and can correct anything
- Learning system improves over time

### Q: How much do LLMs cost?
**A:** ~$0.03-0.05 per complete summary ($10-25/month for moderate use)

### Q: Which LLM provider is best?
**A:** Claude 3.5 Sonnet (Anthropic) is recommended for medical text, but all three work well:
- **Anthropic Claude** - Best quality
- **OpenAI GPT** - Great alternative
- **Google Gemini** - Most cost-effective

### Q: Can I use the app offline?
**A: YES** - Pattern-based mode works completely offline (no LLM needed).

---

## 🔒 Security & Privacy

### How LLMs are Used Safely:

✅ **API Keys Secure**
- Stored in backend only (never in browser)
- Never exposed to frontend
- Environment variables in production

✅ **PHI Protection**
- Clinical notes sent to LLM for processing
- Providers have HIPAA Business Associate Agreements
- Zero-retention options enabled where available
- Future: Full anonymization before sending

✅ **No Autonomous Behavior**
- LLMs called only when explicitly requested
- All outputs validated before use
- User can override any result

---

## 📊 LLM Providers Comparison

| Provider | Recommended Model | Cost/Summary | Speed | Quality |
|----------|------------------|--------------|-------|---------|
| **Anthropic** | Claude 3.5 Sonnet ⭐ | $0.035 | Medium | Excellent |
| **OpenAI** | GPT-4o ⭐ | $0.025 | Fast | Excellent |
| **Google** | Gemini 1.5 Pro ⭐ | $0.018 | Fast | Very Good |

---

## 🎓 Key Concepts

### LLM = AI Processing Engine
- Reads unstructured text
- Extracts structured data
- Generates professional writing
- Understands medical context

### Hybrid Approach (Default)
- Pattern-based extraction (always runs)
- LLM extraction (if available)
- Merge results (best of both)
- 95-98% accuracy

### Governance Framework
- Orchestrator decides when to call LLM
- Validator checks all outputs
- Monitor tracks costs and performance
- User has final control

### Fallback System
- Primary: Selected LLM model
- Fallback 1: Alternative LLM
- Fallback 2: Another LLM
- Final: Pattern-based (always works)

---

## 📖 Full Documentation

For complete details, see:
- **[LLM_ROLES_AND_ARCHITECTURE.md](./LLM_ROLES_AND_ARCHITECTURE.md)** - Full explanation (59KB, 1,761 lines)
- **[ENHANCED_LLM_SYSTEM.md](./ENHANCED_LLM_SYSTEM.md)** - Implementation details
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture

---

## 🚀 Try It Yourself

1. **Open Settings tab**
2. **Select an LLM model** (Claude 3.5 Sonnet recommended)
3. **Upload clinical notes**
4. **Click "Process Notes"** → See LLM extraction
5. **Click "Generate Summary"** → See LLM narrative
6. **Check Cost Dashboard** → See usage tracking

**Without LLM:**
- Toggle "Use Pattern-Only Mode" in Settings
- Same workflow works (slightly lower accuracy)

---

**Quick Summary:**
- 🤖 LLMs = Smart extraction & writing engines
- 🎯 Controlled by orchestration system
- ✅ Validated before use
- 🔄 Pattern fallback available
- 💰 Cost tracked & optimized
- 🔒 Secure & governed

**The app uses LLMs as tools, not decision-makers.**
