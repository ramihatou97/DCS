# 🔒 Backend Proxy Setup - Complete Guide

## ⚠️ DEPRECATION NOTICE

**This document is outdated.** The localStorage fallback system described here has been removed for security reasons.

**Current Architecture (as of 2025-10-18):**
- ✅ All API keys MUST be in `backend/.env`
- ✅ All LLM calls route through backend proxy
- ❌ No client-side API key storage
- ❌ No localStorage fallback

**See updated documentation:**
- `API_KEYS_QUICK_REF.md` - Quick reference guide
- `LLM_CLEANUP_REPORT.md` - Security improvements
- `LLM_CLEANUP_SUMMARY.md` - Quick summary

---

## ✅ What Was Implemented (Historical)

The DCS app originally had **automatic backend detection** with **localStorage fallback**. **The fallback has been removed.**

### 🎯 Key Features

1. **✅ Automatic Backend Detection**
   - Frontend checks if backend is running on startup
   - Routes API calls through backend when available
   - Falls back to localStorage keys if backend unavailable

2. **✅ Secure API Key Storage**
   - Production: Keys in `backend/.env` (server-side only)
   - Development: Keys in localStorage (frontend fallback)
   - Backend already configured with your API keys ✅

3. **✅ Zero Configuration Required**
   - System automatically uses backend when running
   - No code changes needed
   - Seamless fallback to frontend if backend down

---

## 📋 Where Your API Keys Are Stored

### Backend (.env file) - ✅ ALREADY CONFIGURED

Your backend already has API keys configured in:
```bash
/Users/ramihatoum/Desktop/app/DCS/backend/.env
```

**Current keys (from your .env file):**
- ✅ **Anthropic API Key**: `sk-ant-api03-nyg_WA3W2qm...` (Claude)
- ✅ **OpenAI API Key**: `sk-proj-Fdv_nrreqIiZ...` (GPT-4)
- ✅ **Gemini API Key**: `AIzaSyAslxdX-d800...` (Gemini)

### Frontend (localStorage) - Optional Fallback

If backend is not running, frontend will use localStorage keys:
- `anthropic_api_key`
- `openai_api_key`
- `google_api_key`

---

## 🚀 How It Works

### When Backend Is Running

```
User Request
    ↓
Frontend App
    ↓
[Backend Detection] ✅ Backend available
    ↓
🔒 Route through http://localhost:3001/api/anthropic
    ↓
Backend Server
    ↓
Uses API keys from .env file (secure)
    ↓
Calls Anthropic/OpenAI/Gemini API
    ↓
Returns response to frontend
```

**Console Output:**
```
[Backend] ✅ Available - Using secure proxy
[Anthropic] 🔒 Using backend proxy (secure)
[LLM] ✅ Success with Claude 3.5 Sonnet | 2843ms | $0.0142
```

### When Backend Is NOT Running

```
User Request
    ↓
Frontend App
    ↓
[Backend Detection] ❌ Backend unavailable
    ↓
⚠️ Use localStorage API keys (fallback)
    ↓
Calls Anthropic/OpenAI/Gemini API directly
    ↓
Returns response to frontend
```

**Console Output:**
```
[Backend] ❌ Unavailable - Using client-side keys
[Anthropic] ⚠️ Using client-side API key - NOT SECURE for production!
[LLM] ✅ Success with Claude 3.5 Sonnet | 2843ms | $0.0142
```

---

## 🎯 Quick Start Guide

### Option 1: Use Backend (Recommended - Secure)

```bash
# Step 1: Start backend server
cd backend
npm start

# You'll see:
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#   🚀 DCS Proxy Server
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#   📡 Server running on: http://localhost:3001
#   🏥 Health check: http://localhost:3001/health
#
#   API Keys Configured:
#     Anthropic: ✅
#     OpenAI:    ✅
#     Gemini:    ✅
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Step 2: Start frontend (new terminal)
cd /Users/ramihatoum/Desktop/app/DCS
npm run dev

# Step 3: Open app
# Browser will open at http://localhost:5173
# Frontend automatically detects and uses backend proxy
```

### Option 2: Frontend Only (Development Fallback)

```bash
# Step 1: Configure API keys in browser
# Open: enable_features_now.html
# Enter your API keys
# Click "Save API Keys"

# Step 2: Start frontend
npm run dev

# Step 3: Open app
# Browser opens at http://localhost:5173
# Uses localStorage keys (insecure - development only)
```

---

## 🧪 Testing the Setup

### Test 1: Check Backend Status

```bash
# Open browser to:
open enable_features_now.html

# You'll see:
# ✅ Backend server is running on http://localhost:3001
# API Keys Configured:
#   ✅ Anthropic (Claude)
#   ✅ OpenAI (GPT-4)
#   ✅ Google (Gemini)
# 🔒 Using secure backend proxy for API calls
```

### Test 2: Generate a Summary

```bash
# 1. Start backend: cd backend && npm start
# 2. Start frontend: npm run dev
# 3. Paste a clinical note
# 4. Click "Generate Summary"
# 5. Check console for:
```

**Expected Console Output:**
```
[Backend] ✅ Available - Using secure proxy
[LLM] 🎯 Primary: Claude 3.5 Sonnet for data_extraction
[Anthropic] 🔒 Using backend proxy (secure)
[LLM] ✅ Success with Claude 3.5 Sonnet | 2843ms | $0.0142
💰 Cost: $0.0142 | Provider: Claude 3.5 Sonnet | Task: data_extraction | Duration: 2843ms
```

### Test 3: API Key Testing

```bash
# Open enable_features_now.html
# Click "🧪 Test All Keys"

# You'll see:
# ✅ Anthropic: Working
# ✅ Google: Working
# ✅ OpenAI: Working
```

---

## 🔧 Configuration Files

### Backend Configuration

**File:** `backend/.env`
```properties
# Backend API Keys (Server-side only - NEVER exposed to browser)
ANTHROPIC_API_KEY=sk-ant-api03-nyg_WA3W2qm0-dd2CSH1D...
OPENAI_API_KEY=sk-proj-Fdv_nrreqIiZ12WxE8p8MJgAZnb3Pg...
GEMINI_API_KEY=AIzaSyAslxdX-d800XAdr9zsbEYdU_IgT3rDHMo

# Server Port
PORT=3001
```

**File:** `backend/server.js`
```javascript
// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY
    }
  });
});

// Anthropic proxy
app.post('/api/anthropic', validateLLMRequest, async (req, res) => {
  // Uses process.env.ANTHROPIC_API_KEY (secure)
});

// OpenAI proxy
app.post('/api/openai', validateLLMRequest, async (req, res) => {
  // Uses process.env.OPENAI_API_KEY (secure)
});

// Gemini proxy
app.post('/api/gemini', validateLLMRequest, async (req, res) => {
  // Uses process.env.GEMINI_API_KEY (secure)
});
```

### Frontend Configuration

**File:** `src/services/llmService.js`
```javascript
// Automatic backend detection
const checkBackendAvailable = async () => {
  try {
    const response = await fetch('http://localhost:3001/health', {
      method: 'GET',
      signal: AbortSignal.timeout(2000)
    });
    backendAvailable = response.ok;
    console.log(`[Backend] ${backendAvailable ? '✅ Available' : '❌ Unavailable'}`);
    return backendAvailable;
  } catch (error) {
    backendAvailable = false;
    return false;
  }
};

// Auto-routing for Anthropic
const callAnthropicAPI = async (model, prompt, systemPrompt, options) => {
  const useBackend = await checkBackendAvailable();
  
  if (useBackend) {
    // SECURE: Route through backend proxy
    console.log('[Anthropic] 🔒 Using backend proxy (secure)');
    const response = await fetch('http://localhost:3001/api/anthropic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model.model,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    // Backend has API key, frontend doesn't need it
  } else {
    // FALLBACK: Use localStorage key
    console.warn('[Anthropic] ⚠️ Using client-side API key - NOT SECURE for production!');
    const apiKey = localStorage.getItem('anthropic_api_key');
    // Direct API call
  }
};
```

---

## 📊 Security Comparison

| Aspect | Backend Proxy (Secure) | Frontend localStorage (Insecure) |
|--------|------------------------|----------------------------------|
| **API Keys** | Server-side (.env file) | Browser storage (visible) |
| **Visibility** | Hidden from users | Visible in DevTools |
| **CORS** | No CORS issues | CORS restrictions |
| **Rate Limiting** | Server-side control | No control |
| **Monitoring** | Server logs all calls | No server logs |
| **Production Ready** | ✅ Yes | ❌ No (development only) |
| **Security Level** | 🔒 High | ⚠️ Low |

---

## 🎯 Best Practices

### For Development

```bash
# Option A: Use backend (recommended)
cd backend && npm start  # Terminal 1
npm run dev              # Terminal 2

# Option B: Frontend only (quick testing)
open enable_features_now.html
# Enter API keys
npm run dev
```

### For Production

```bash
# 1. Ensure backend/.env has API keys
cat backend/.env  # Should show keys

# 2. Start backend first
cd backend
npm start

# 3. Build frontend
cd ..
npm run build

# 4. Deploy both backend and frontend
# Backend: Deploy to server (Railway, Heroku, AWS, etc.)
# Frontend: Deploy to CDN (Vercel, Netlify, Cloudflare, etc.)
```

---

## 🔍 Troubleshooting

### Issue: "Backend server is not running"

**Solution:**
```bash
# Check if backend is running
lsof -ti:3001

# If not running, start it
cd backend
npm start

# If port 3001 is in use
lsof -ti:3001 | xargs kill
npm start
```

### Issue: "All LLM providers failed"

**Solution:**
```bash
# Check backend has API keys
cd backend
cat .env  # Should show ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY

# Test backend endpoint
curl http://localhost:3001/health

# Should return:
# {"status":"healthy","services":{"anthropic":true,"openai":true,"gemini":true}}
```

### Issue: "Using client-side API key - NOT SECURE"

**This is expected if:**
- Backend is not running
- Backend is running but frontend can't reach it

**Solution:**
```bash
# 1. Start backend
cd backend && npm start

# 2. Refresh frontend
# Backend detection will retry on next API call

# 3. Check console - should now show:
# [Backend] ✅ Available - Using secure proxy
```

### Issue: API keys in localStorage not working

**Solution:**
```bash
# Open browser console
localStorage.getItem('anthropic_api_key')  # Should return your key

# If null, set it:
localStorage.setItem('anthropic_api_key', 'sk-ant-api03-...')

# Or use the setup page:
open enable_features_now.html
# Enter keys and click "Save API Keys"
```

---

## 📖 API Endpoints Reference

### Backend Endpoints

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/health` | GET | Check server status | No |
| `/api/anthropic` | POST | Claude API proxy | Server-side (from .env) |
| `/api/openai` | POST | GPT API proxy | Server-side (from .env) |
| `/api/gemini` | POST | Gemini API proxy | Server-side (from .env) |
| `/api/test/:provider` | POST | Test API key | Server-side (from .env) |

### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2025-10-17T12:34:56.789Z",
  "services": {
    "anthropic": true,
    "openai": true,
    "gemini": true
  }
}
```

---

## 🎉 Summary

### ✅ What You Have Now

1. **Backend Server** - Running on port 3001 with API keys configured
2. **Automatic Detection** - Frontend auto-detects backend availability
3. **Secure Proxy** - API calls routed through backend when available
4. **Fallback System** - Uses localStorage keys if backend unavailable
5. **Setup Tool** - `enable_features_now.html` for configuration
6. **Zero Config** - Works out of the box

### 🚀 Next Steps

1. **Start Backend**: `cd backend && npm start`
2. **Start Frontend**: `npm run dev`
3. **Generate Summary**: Test with a real clinical note
4. **Monitor Console**: Watch for "🔒 Using backend proxy (secure)"
5. **Check Costs**: View usage statistics in Settings tab

### 📝 Remember

- ✅ **Backend running** = Secure API calls (production-ready)
- ⚠️ **Backend not running** = localStorage keys (development only)
- 🔒 **Never commit .env file** to Git
- 📊 **Monitor costs** in Settings → Usage Statistics

---

## 🆘 Need Help?

### Quick Checks

```bash
# 1. Is backend running?
lsof -ti:3001 && echo "✅ Backend running" || echo "❌ Backend not running"

# 2. Are API keys configured?
cd backend && grep -E "ANTHROPIC|OPENAI|GEMINI" .env

# 3. Is frontend connecting?
# Open browser console and look for:
# [Backend] ✅ Available - Using secure proxy
```

### Common Commands

```bash
# Start everything
cd backend && npm start &  # Start backend in background
npm run dev                # Start frontend

# Stop everything
pkill -f "node server.js"  # Stop backend
pkill -f "vite"            # Stop frontend

# Check status
lsof -ti:3001  # Backend port
lsof -ti:5173  # Frontend port
```

---

**🎉 Setup Complete! Your API keys are now secure and the system automatically uses the backend proxy when available.**

**Happy summarizing! 🏥✨**
