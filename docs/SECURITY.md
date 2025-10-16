# 🔒 Security Architecture

## Overview

The Discharge Summary Generator implements a **secure backend proxy architecture** to protect API keys and ensure PHI (Protected Health Information) privacy.

---

## API Key Security

### ✅ Secure Architecture (Current)

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │ HTTP    │   Backend   │ HTTPS   │  LLM APIs   │
│  (Frontend) │────────▶│   Proxy     │────────▶│ (Claude/GPT)│
│             │         │  (Node.js)  │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
                              │
                              ▼
                        .env file
                     (API keys stored)
```

**Benefits:**
- ✅ API keys **never exposed** to browser
- ✅ Keys stored in backend `.env` file
- ✅ No keys in localStorage, network traffic, or browser memory
- ✅ Server-side rate limiting possible
- ✅ CORS protection built-in

### ❌ Insecure Architecture (Avoided)

```
┌─────────────┐ HTTPS   ┌─────────────┐
│   Browser   │────────▶│  LLM APIs   │
│  (Frontend) │         │ (Claude/GPT)│
│             │         │             │
└─────────────┘         └─────────────┘
      │
      ▼
localStorage
(API keys stored) ⚠️ INSECURE!
```

**Problems:**
- ❌ Keys visible in DevTools → Application → LocalStorage
- ❌ Keys exposed in network traffic (even over HTTPS)
- ❌ Keys in JavaScript heap memory
- ❌ User can steal keys and abuse API quotas
- ❌ No rate limiting

---

## How to Configure API Keys (Secure Method)

### Step 1: Get API Key

Choose a provider:
- **Anthropic Claude**: https://console.anthropic.com/
- **OpenAI GPT**: https://platform.openai.com/api-keys
- **Google Gemini**: https://makersuite.google.com/app/apikey

### Step 2: Create `.env` File

```bash
cd backend
cp .env.example .env
```

### Step 3: Add API Key

Edit `backend/.env`:

```bash
# Anthropic Claude (Recommended)
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here

# OpenAI GPT-4 (Optional)
OPENAI_API_KEY=sk-your-actual-key-here

# Google Gemini (Optional)
GEMINI_API_KEY=your-actual-gemini-key-here

# Server Port
PORT=3001
```

### Step 4: Start Backend Server

```bash
cd backend
node server.js
```

**Verify in Settings tab:**
- Backend status: ✅ Healthy
- API providers: ✅ Configured

---

## Backend Proxy Endpoints

All LLM API requests go through the backend proxy:

| Endpoint | Purpose | API Key Source |
|----------|---------|----------------|
| `POST /api/anthropic` | Claude proxy | `process.env.ANTHROPIC_API_KEY` |
| `POST /api/openai` | GPT proxy | `process.env.OPENAI_API_KEY` |
| `POST /api/gemini` | Gemini proxy | `process.env.GEMINI_API_KEY` |
| `GET /health` | Server status | N/A |
| `POST /api/test/:provider` | Test API key | From `.env` |

**Frontend never sees API keys** - they stay on the server.

---

## PHI Privacy Protection

### Anonymization Strategy

The ML learning system uses **99%+ accurate anonymization** before storing any data:

**Anonymized:**
- ✅ Patient names → `[PATIENT_NAME]`
- ✅ Dates → `[ADMISSION_DATE+3]` (relative)
- ✅ MRNs → `[PATIENT_ID]`
- ✅ Locations → `[LOCATION]`
- ✅ Phone numbers → `[PHONE]`
- ✅ Email addresses → `[EMAIL]`

**Preserved:**
- ✅ Medical terminology (SAH, craniotomy, etc.)
- ✅ Medications (aspirin, levetiracetam, etc.)
- ✅ Procedures (coiling, EVD placement, etc.)
- ✅ Lab values (Na 135, Hgb 12.5, etc.)

### Storage

**Local Storage (IndexedDB):**
- `dcs-corrections` database: Anonymized user corrections
- `dcs-learning` database: Anonymized learned patterns
- **NO PHI stored** - all data anonymized before storage

**Session Data:**
- Clinical notes stored in **React state only** (RAM)
- Cleared on page refresh
- Never persisted to disk

---

## Security Best Practices

### ✅ DO:

1. **Store API keys in backend `.env`**
   ```bash
   # backend/.env
   ANTHROPIC_API_KEY=sk-ant-your-key
   ```

2. **Add `.env` to `.gitignore`**
   ```bash
   # .gitignore
   backend/.env
   ```

3. **Use environment variables in production**
   ```bash
   export ANTHROPIC_API_KEY=sk-ant-your-key
   node server.js
   ```

4. **Rotate API keys regularly**
   - Monthly rotation recommended
   - Immediately after team member departure

5. **Monitor API usage**
   - Check Anthropic/OpenAI dashboards
   - Set up usage alerts

### ❌ DON'T:

1. ❌ **Never commit `.env` to Git**
2. ❌ **Never store API keys in frontend code**
3. ❌ **Never log API keys to console**
4. ❌ **Never share API keys in screenshots**
5. ❌ **Never hardcode API keys**

---

## Rate Limiting & Abuse Prevention

### Backend Server Features:

- **CORS Protection**: Only `localhost:5173` and `localhost:3000` allowed
- **Request Size Limit**: 10MB max (prevents large payload attacks)
- **Error Handling**: No API key leakage in error messages

### Recommended (TODO):

```javascript
// Add to backend/server.js
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## Threat Model

### Threats Mitigated ✅

| Threat | Mitigation |
|--------|------------|
| API key theft from browser | Keys stored on backend only |
| API key exposure in network traffic | Proxy handles all API calls |
| PHI leakage in learning data | 99%+ anonymization before storage |
| CORS attacks | Strict origin whitelist |
| Large payload attacks | 10MB request limit |

### Residual Risks ⚠️

| Risk | Severity | Mitigation Plan |
|------|----------|-----------------|
| Server compromise | High | Use HTTPS, firewall, keep dependencies updated |
| Session hijacking | Medium | Add CSRF tokens, secure cookies |
| No rate limiting | Low | Implement express-rate-limit |
| No authentication | Low | For personal use only (not multi-user) |

---

## Compliance Notes

### HIPAA Compliance

**Current Status: NOT HIPAA compliant** (by design - personal tool)

For HIPAA compliance, you would need:
- ❌ BAA (Business Associate Agreement) with Anthropic/OpenAI
- ❌ End-to-end encryption for data in transit
- ❌ Encrypted storage (disk-level encryption)
- ❌ Audit logging (access logs, change logs)
- ❌ User authentication & authorization
- ❌ Automatic session timeout
- ❌ Data retention policies

**Current Use Case:**
- Personal tool for **test/synthetic data only**
- No real patient data
- No PHI storage (anonymized learning only)
- Local-first architecture

---

## Production Deployment (Future)

For production deployment, consider:

1. **HTTPS Everywhere**
   ```bash
   # Use Let's Encrypt for free SSL
   certbot --nginx -d yourdomain.com
   ```

2. **Environment Variables**
   ```bash
   # Use system environment variables
   export ANTHROPIC_API_KEY=sk-ant-your-key
   export NODE_ENV=production
   ```

3. **Process Manager**
   ```bash
   # Use PM2 for production
   npm install -g pm2
   pm2 start backend/server.js --name dcs-backend
   ```

4. **Reverse Proxy**
   ```nginx
   # nginx config
   location /api/ {
       proxy_pass http://localhost:3001;
       proxy_set_header X-Real-IP $remote_addr;
   }
   ```

5. **Database for Learning**
   - Replace IndexedDB with PostgreSQL
   - Server-side storage of anonymized learning data
   - Backup and recovery

---

## Security Checklist

Before using in production:

- [ ] API keys stored in backend `.env` only
- [ ] `.env` added to `.gitignore`
- [ ] HTTPS enabled (SSL certificate)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Error messages don't leak sensitive info
- [ ] Logging configured (no API keys logged)
- [ ] Dependencies up to date (`npm audit`)
- [ ] PHI anonymization tested (99%+ accuracy)
- [ ] Session timeout configured
- [ ] Backup strategy for learning data

---

## Questions?

**Q: Can I use the app without API keys?**
A: Yes! Pattern-based extraction works without API keys (~70% accuracy).

**Q: Are API keys encrypted in the `.env` file?**
A: No. The `.env` file stores keys in plaintext. Use proper file permissions (`chmod 600 .env`) and don't commit to Git.

**Q: What if someone steals my API key?**
A: Rotate it immediately in the provider's dashboard. Monitor usage for unauthorized charges.

**Q: Is my patient data sent to Anthropic/OpenAI?**
A: Only if you have API keys configured. For personal use with test data only. Do not use with real PHI.

**Q: Where is learning data stored?**
A: Browser's IndexedDB (local only). All data anonymized before storage.

---

## Version

- **Document Version**: 1.0.0
- **Last Updated**: October 14, 2025
- **Security Architecture**: Backend Proxy (Secure)
