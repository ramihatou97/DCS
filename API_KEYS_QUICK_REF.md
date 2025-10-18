# 🎯 QUICK REFERENCE: API Keys & Backend Setup

## ⚡ TL;DR

Your API keys can go in **TWO PLACES**:

1. **Backend `.env` file** (Secure - Production) ✅ **RECOMMENDED**
2. **Frontend localStorage** (Insecure - Development only) ⚠️

The system **automatically chooses** the secure option when available!

---

## 📍 Where Are Your API Keys?

### Option 1: Backend (Already Configured ✅)

**File:** `/Users/ramihatoum/Desktop/app/DCS/backend/.env`

```properties
ANTHROPIC_API_KEY=sk-ant-api03-nyg_WA3W2qm0...  ✅
OPENAI_API_KEY=sk-proj-Fdv_nrreqIiZ12...        ✅
GEMINI_API_KEY=AIzaSyAslxdX-d800XAdr...         ✅
```

**Security:** 🔒 Secure (keys on server only)

### Option 2: Frontend (Fallback Only)

**Location:** Browser localStorage

**Set via:**
```bash
# Open: enable_features_now.html
# Enter keys → Click "Save API Keys"
```

**Security:** ⚠️ Insecure (keys visible in browser)

---

## 🚀 Quick Start (3 Commands)

```bash
# Start backend (Terminal 1)
cd backend && npm start

# Start frontend (Terminal 2)
npm run dev

# Open browser
# http://localhost:5173 (auto-opens)
```

**That's it!** Backend is already configured with your API keys. ✅

---

## 🔍 How to Check Backend Status

### Method 1: Setup Tool
```bash
open enable_features_now.html
```

**You'll see:**
```
✅ Backend server is running on http://localhost:3001
API Keys Configured:
  ✅ Anthropic (Claude)
  ✅ OpenAI (GPT-4)
  ✅ Google (Gemini)
🔒 Using secure backend proxy for API calls
```

### Method 2: Terminal
```bash
curl http://localhost:3001/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "services": {
    "anthropic": true,
    "openai": true,
    "gemini": true
  }
}
```

### Method 3: Browser Console
```javascript
// Paste in console while app is running:
fetch('http://localhost:3001/health')
  .then(r => r.json())
  .then(console.log)

// Should show: {status: "healthy", services: {...}}
```

---

## 🎯 Where to Add/Update API Keys

### Production (Recommended): Backend `.env` File

```bash
# Edit backend/.env
nano backend/.env

# Add or update:
ANTHROPIC_API_KEY=sk-ant-YOUR-NEW-KEY-HERE
OPENAI_API_KEY=sk-proj-YOUR-NEW-KEY-HERE
GEMINI_API_KEY=AIza-YOUR-NEW-KEY-HERE

# Restart backend
pkill -f "node server.js"
cd backend && npm start
```

### Development (Quick Testing): Setup Tool

```bash
# Open setup tool
open enable_features_now.html

# Steps:
1. Enter API keys in the input fields
2. Click "💾 Save API Keys"
3. Click "🧪 Test All Keys" to verify
4. Refresh your app
```

### Development (Console): Direct localStorage

```javascript
// Open browser console (Cmd+Option+J)

// Set keys:
localStorage.setItem('anthropic_api_key', 'sk-ant-YOUR-KEY');
localStorage.setItem('openai_api_key', 'sk-proj-YOUR-KEY');
localStorage.setItem('google_api_key', 'AIza-YOUR-KEY');

// Verify:
console.log('Anthropic:', localStorage.getItem('anthropic_api_key'));
console.log('OpenAI:', localStorage.getItem('openai_api_key'));
console.log('Google:', localStorage.getItem('google_api_key'));
```

---

## 🔐 Security Status

### With Backend Running ✅

```
Frontend → Backend Proxy → LLM API
            ↑ (Keys here, secure)
```

**Console shows:**
```
[Backend] ✅ Available - Using secure proxy
[Anthropic] 🔒 Using backend proxy (secure)
```

### Without Backend Running ⚠️

```
Frontend → LLM API directly
   ↑ (Keys here, visible in browser)
```

**Console shows:**
```
[Backend] ❌ Unavailable - Using client-side keys
[Anthropic] ⚠️ Using client-side API key - NOT SECURE for production!
```

---

## 🧪 Quick Tests

### Test 1: Check Current API Key Location

```bash
# In browser console:
fetch('http://localhost:3001/health')
  .then(r => r.json())
  .then(d => console.log(
    d.services.anthropic ? '🔒 Backend has keys' : '⚠️ Using localStorage'
  ))
```

### Test 2: Generate a Summary

```bash
1. Start backend: cd backend && npm start
2. Start frontend: npm run dev
3. Paste any clinical note
4. Click "Generate Summary"
5. Check console for:
   ✅ "[Anthropic] 🔒 Using backend proxy (secure)"
```

### Test 3: Test API Keys

```bash
# Open: enable_features_now.html
# Click: "🧪 Test All Keys"

# Should show:
# ✅ Anthropic: Working
# ✅ Google: Working
# ✅ OpenAI: Working
```

---

## 🎯 Common Questions

### Q: Where should I put my API keys for production?

**A:** Backend `.env` file (already configured!)

### Q: Where should I put my API keys for development?

**A:** Either backend `.env` OR localStorage via `enable_features_now.html`

### Q: Can I use both?

**A:** Yes! Backend takes priority, localStorage is fallback.

### Q: How do I know which is being used?

**A:** Check console logs:
- `🔒 Using backend proxy` = Backend (secure)
- `⚠️ Using client-side API key` = localStorage (insecure)

### Q: Do I need to configure anything?

**A:** No! Backend already has your keys. Just start it:
```bash
cd backend && npm start
```

### Q: What if backend crashes during use?

**A:** App automatically falls back to localStorage keys (if configured)

---

## 📊 Decision Tree

```
                  Starting DCS App
                        │
                        ▼
            Do you need to update API keys?
                    /        \
                  YES         NO
                  /            \
                 ▼              ▼
        Edit backend/.env    Just start backend
        Restart backend         cd backend
                │               npm start
                │                   │
                └───────┬───────────┘
                        │
                        ▼
                 Backend running?
                    /        \
                  YES         NO
                  /            \
                 ▼              ▼
        🔒 Secure mode    ⚠️ Development mode
        Uses .env keys    Uses localStorage keys
                │                   │
                │                   │
                └───────┬───────────┘
                        │
                        ▼
                  npm run dev
                        │
                        ▼
                  Open app
            http://localhost:5173
                        │
                        ▼
                Generate Summary
                        │
                        ▼
            Check console for security mode
```

---

## 🎨 Setup Tool (enable_features_now.html)

### What it does:

- ✅ **Shows backend status** (running/not running)
- ✅ **Displays which API keys are configured** (backend)
- ✅ **Allows adding localStorage keys** (fallback)
- ✅ **Tests API keys** (all providers)
- ✅ **Selects AI model** (Claude, GPT, Gemini)
- ✅ **Enables all features** (14/14 features)
- ✅ **One-click complete setup**

### How to use:

```bash
# Open the tool
open enable_features_now.html

# It automatically shows:
# - Backend status
# - API keys configured
# - Current model selection
# - Feature flags status

# Use buttons to:
# - Save API keys (if backend not available)
# - Test API keys
# - Select model
# - Enable features
# - Complete setup (all at once)
```

---

## 🚨 Troubleshooting (One-Liners)

### Backend won't start
```bash
lsof -ti:3001 | xargs kill && cd backend && npm start
```

### Check if backend is running
```bash
lsof -ti:3001 && echo "✅ Running" || echo "❌ Not running"
```

### Check API keys in backend
```bash
cd backend && grep -E "API_KEY" .env
```

### Clear localStorage keys
```bash
# In browser console:
localStorage.clear()
```

### Restart everything
```bash
pkill -f "node server.js" && pkill -f "vite" && sleep 2 && cd backend && npm start & sleep 3 && npm run dev
```

---

## 📚 Full Documentation

- **BACKEND_PROXY_SETUP.md** - Complete technical guide
- **BACKEND_PROXY_COMPLETE.md** - Implementation summary
- **ENHANCED_LLM_SYSTEM.md** - LLM system documentation
- **IMPLEMENTATION_COMPLETE.md** - Overall features

---

## ✅ Checklist

**Before first use:**
- [x] Backend has API keys in `.env` ✅ (already done)
- [ ] Start backend: `cd backend && npm start`
- [ ] Start frontend: `npm run dev`
- [ ] Open app in browser
- [ ] Verify console shows: `🔒 Using backend proxy (secure)`

**That's it! You're ready to go!** 🎉

---

## 🆘 Emergency Commands

```bash
# Nuclear option (restart everything clean)
pkill -f "node server.js"
pkill -f "vite"
rm -rf node_modules/.vite
cd backend && npm start &
sleep 3
cd .. && npm run dev
```

```bash
# Check what's using ports
lsof -ti:3001  # Backend
lsof -ti:5173  # Frontend
```

```bash
# Verify backend API keys without opening file
cd backend && grep "API_KEY=" .env | head -3
```

---

**🎯 Remember:** Backend `.env` is already configured with your keys! Just start it and you're secure! 🔒✨
