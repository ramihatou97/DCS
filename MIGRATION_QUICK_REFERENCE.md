# 🚀 FRONTEND-BACKEND SEPARATION - QUICK REFERENCE

**For detailed instructions, see:** `FRONTEND_BACKEND_SEPARATION_IMPLEMENTATION_DIRECTIVE.md`

---

## 📋 QUICK START

### **1. Pre-Migration Setup (5 minutes)**

```bash
cd /Users/ramihatoum/Desktop/app/DCS

# Create baseline
BASELINE_DATE=$(date +%Y%m%d_%H%M%S)
git tag -a "baseline-pre-separation-${BASELINE_DATE}" -m "Baseline"
git checkout -b "feature/frontend-backend-separation"

# Verify build works
npm run build
```

---

## 🎯 PHASE OVERVIEW

| Phase | Duration | Key Deliverables | Checkpoint |
|-------|----------|------------------|------------|
| **Phase 0: Preparation** | 2-3 days | Directory structure, feature flags, shared constants | All 5 scenarios pass (unchanged) |
| **Phase 1: Backend Foundation** | 5-7 days | Services moved to backend, API routes created | Backend works independently |
| **Phase 2: Frontend API Client** | 3-4 days | API client layer, App.jsx updated | All 5 scenarios pass (both modes) |
| **Phase 3: Integration & Testing** | 5-7 days | Backend enabled by default, comprehensive testing | Zero functionality loss confirmed |
| **Phase 4: Deployment** | 2-3 days | Documentation, monitoring, production deployment | System deployed and monitored |

**Total:** 4 weeks + 1-2 week buffer = **5-6 weeks**

---

## ⚡ CRITICAL COMMANDS

### **Test All 5 Scenarios**
```bash
npm run dev
# In browser: Test scenarios from BUG_FIX_TESTING_GUIDE.md
# 1. Basic SAH note
# 2. Multiple pathologies
# 3. No pathology
# 4. Spine case
# 5. Batch upload
```

### **Build & Verify**
```bash
npm run build
# Expected: ✓ built in XXXXms (no errors)
```

### **Test Backend Independently**
```bash
cd backend && node server.js &
curl http://localhost:3001/health
node test-backend-api.js
```

### **Enable/Disable Backend API**
```javascript
// In browser console:
import { enableFeature, disableFeature } from './shared/featureFlags.js';

// Enable backend
enableFeature('USE_BACKEND_EXTRACTION');

// Disable backend (rollback to legacy)
disableFeature('USE_BACKEND_EXTRACTION');
```

---

## 🔄 ROLLBACK PROCEDURES

### **Quick Rollback (No Code Changes)**
```javascript
// In browser console:
import { disableFeature } from './shared/featureFlags.js';
disableFeature('USE_BACKEND_EXTRACTION');
// System automatically falls back to legacy mode
```

### **Full Rollback (Code Changes)**
```bash
# Find baseline tag
git tag -l "baseline-*"

# Rollback
git checkout baseline-pre-separation-YYYYMMDD_HHMMSS
npm run build
```

### **Phase-Specific Rollback**
```bash
# Rollback to specific phase
git checkout phase1-backend-foundation
# or
git checkout phase2-frontend-api-client
```

---

## ✅ SUCCESS CRITERIA CHECKLIST

### **After Each Phase**
- [ ] Build succeeds with 0 errors
- [ ] All 5 test scenarios pass
- [ ] No new console errors
- [ ] Quality metrics maintained (96%+ accuracy, 95%+ completeness)
- [ ] Changes committed with descriptive message

### **Final Verification**
- [ ] All 6 export formats work (text, PDF, JSON, HL7, FHIR, clinical template)
- [ ] ML learning system intact
- [ ] Backend API enabled by default
- [ ] Automatic fallback working
- [ ] Zero functionality loss confirmed
- [ ] Performance within acceptable range (< 50% degradation)

---

## 🚨 EMERGENCY PROCEDURES

### **If Build Fails**
```bash
# Rollback last commit
git reset --hard HEAD~1

# Or rollback to baseline
git checkout baseline-pre-separation-YYYYMMDD_HHMMSS
```

### **If Tests Fail**
```bash
# Check feature flags
grep "USE_BACKEND" shared/featureFlags.js

# Disable backend API
sed -i '' 's/USE_BACKEND_EXTRACTION: true/USE_BACKEND_EXTRACTION: false/' shared/featureFlags.js

# Rebuild
npm run build
```

### **If Backend Not Responding**
```bash
# Check backend is running
curl http://localhost:3001/health

# Restart backend
cd backend
pkill -f "node server.js"
node server.js &
```

---

## 📊 KEY METRICS TO MONITOR

| Metric | Baseline | Target | Alert If |
|--------|----------|--------|----------|
| Extraction Accuracy | 96%+ | 96%+ | < 95% |
| Summary Completeness | 95%+ | 95%+ | < 94% |
| Processing Time | < 10s | < 15s | > 20s |
| Build Time | ~2.5s | < 5s | > 10s |
| API Response Time | N/A | < 3s | > 5s |

---

## 🔗 IMPORTANT FILES

| File | Purpose |
|------|---------|
| `FRONTEND_BACKEND_SEPARATION_IMPLEMENTATION_DIRECTIVE.md` | Complete step-by-step guide |
| `shared/constants.js` | Shared constants (API config, models, fields) |
| `shared/featureFlags.js` | Feature flags for safe rollback |
| `backend/src/routes/extraction.js` | Extraction API route |
| `frontend/src/services/api/apiClient.js` | Base HTTP client |
| `frontend/src/services/api/extractionAPI.js` | Extraction API wrapper |
| `test-backend-api.js` | Backend independent test |
| `test-e2e-migration.js` | End-to-end migration test |
| `migration-baseline/` | Baseline documentation and test results |

---

## 📞 QUICK TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| CORS errors | Check `backend/server.js` CORS origin includes `http://localhost:5173` |
| API keys not working | Verify `backend/.env` has all API keys |
| Feature flags not working | Check `shared/featureFlags.js` syntax |
| Import errors | Run `./fix-service-imports.sh` |
| Backend not starting | Check port 3001 not in use: `lsof -ti:3001 \| xargs kill -9` |
| Frontend not building | Clear cache: `rm -rf node_modules dist && npm install` |

---

## 🎯 DAILY CHECKLIST

### **Start of Day**
- [ ] Pull latest changes: `git pull origin feature/frontend-backend-separation`
- [ ] Verify build works: `npm run build`
- [ ] Check backend health: `curl http://localhost:3001/health`

### **End of Day**
- [ ] Run all 5 test scenarios
- [ ] Commit changes with descriptive message
- [ ] Push to remote: `git push origin feature/frontend-backend-separation`
- [ ] Document any issues or blockers

---

## 📈 PROGRESS TRACKING

```bash
# Check current phase
git log --oneline | grep "Phase"

# Check completed milestones
git tag -l "phase*"

# View changes since baseline
git diff baseline-pre-separation-YYYYMMDD_HHMMSS --stat
```

---

## 🎉 COMPLETION CHECKLIST

When all phases are complete:

```bash
# Final verification
npm run build                    # ✅ Build succeeds
npm run test                     # ✅ All tests pass
node test-backend-api.js         # ✅ Backend tests pass
node test-e2e-migration.js       # ✅ E2E tests pass

# Merge to main
git checkout main
git merge feature/frontend-backend-separation

# Tag release
git tag -a "v2.0.0-frontend-backend-separated" -m "Version 2.0.0"

# Push
git push origin main --tags

# Deploy
# Follow DEPLOYMENT_GUIDE_V2.md
```

---

**For detailed instructions, see:** `FRONTEND_BACKEND_SEPARATION_IMPLEMENTATION_DIRECTIVE.md`

**For deployment, see:** `DEPLOYMENT_GUIDE_V2.md` (created in Phase 4)

**For rollback, see:** "ROLLBACK PROCEDURES" section in main directive

---

**Good luck with the migration! 🚀**


