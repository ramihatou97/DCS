# Quick Start Guide - Backend Extraction System

## 🚀 Start Servers

```bash
# Terminal 1: Start Backend (port 3001)
cd backend
npm start

# Terminal 2: Start Frontend (port 5173)
npm run dev
```

## 📋 Test the System

```bash
# Quick health check
curl http://localhost:3001/health

# Run full test suite
node test_backend_extraction.js

# Test specific endpoint
curl -X POST http://localhost:3001/api/extract \
  -H "Content-Type: application/json" \
  -d '{"notes": "65F with SAH, H&H 3", "method": "pattern"}'
```

## 🔑 API Endpoints

### 1. Full Extraction
```bash
POST /api/extract

# Pattern-based (fast, no API key needed)
{
  "notes": "clinical note text",
  "method": "pattern"
}

# LLM-based (requires API key)
{
  "notes": "clinical note text",
  "method": "llm",
  "llmProvider": "anthropic"
}

# Hybrid (best accuracy)
{
  "notes": "clinical note text",
  "method": "hybrid",
  "llmProvider": "anthropic"
}
```

### 2. Expand Abbreviations
```bash
POST /api/expand-abbreviations

{
  "text": "Pt with SAH s/p EVD"
}

# Response:
{
  "original": "Pt with SAH s/p EVD",
  "expanded": "patient with subarachnoid hemorrhage s/p external ventricular drain"
}
```

### 3. Extract Scores Only
```bash
POST /api/extract-scores

{
  "text": "H&H grade 3, Fisher 3, GCS 13"
}

# Response:
{
  "scores": {
    "huntHess": 3,
    "fisher": 3,
    "gcs": {"total": 13}
  }
}
```

## 📊 What Gets Extracted

✅ **Demographics**: MRN, age, sex  
✅ **Dates**: Ictus, admission, surgery, discharge  
✅ **Diagnosis**: Primary pathology, location  
✅ **Clinical Scores**: Hunt-Hess, Fisher, GCS, mRS, KPS, ECOG  
✅ **Procedures**: Craniotomy, EVD, coiling, clipping  
✅ **Complications**: Vasospasm, hydrocephalus, infections  
✅ **Medications**: Anticoagulation, AEDs, antibiotics  
✅ **Imaging**: CT, MRI, angiography findings  
✅ **Neuro Exam**: Motor, sensory, cranial nerves  
✅ **Discharge**: Destination, follow-up plan  

## 🔧 Troubleshooting

### Backend won't start
```bash
# Kill existing process
lsof -ti:3001 | xargs kill -9

# Start fresh
cd backend && npm start
```

### Frontend won't start
```bash
# Kill existing Vite processes
pkill -f "vite"

# Start fresh
npm run dev
```

### Extraction not working
```bash
# Check backend logs
tail -f backend/backend.log

# Test health
curl http://localhost:3001/health

# Verify API keys (if using LLM)
cat backend/.env | grep API_KEY
```

## 💡 Sample Clinical Note

```
Patient: 65F with PMH of HTN
MRN: 12345678

HPI: Found down 3/15/2024 with severe HA. GCS 13 on arrival.

CT: Diffuse SAH, Fisher 3
CTA: 7mm left PCOM aneurysm

Admission: 3/15/2024
Diagnosis: SAH, Hunt-Hess 3

Course:
- 3/15: EVD placed
- 3/16: Craniotomy for clipping
- 3/22: Mild vasospasm, treated

Neuro: Alert, CN intact, 5/5 strength, mRS 1

Meds: Keppra 500mg BID, Nimodipine 60mg Q4H, ASA 81mg

Discharge: 3/27/2024 to home
```

## 📈 Performance

- **Pattern Extraction**: ~50ms
- **LLM Extraction**: ~2-5s (depending on provider)
- **Hybrid**: ~2-5s
- **Abbreviation Expansion**: <10ms

## 🎯 Best Practices

1. **Use pattern extraction first** - Fast and free
2. **Use hybrid for complex cases** - Best accuracy
3. **Enable abbreviation expansion** - Better extraction
4. **Check confidence scores** - Validate critical fields
5. **Review extracted data** - Always verify before discharge

## 📚 More Info

- Full documentation: `BACKEND_EXTRACTION_SUMMARY.md`
- Architecture guide: `ARCHITECTURE_RECOMMENDATIONS.md`
- Implementation roadmap: `IMPLEMENTATION_ROADMAP.md`

---

**Questions?** Check the logs or test output for detailed error messages.