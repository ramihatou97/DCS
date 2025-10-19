# 🎯 QUICK REFERENCE: API Keys & Backend Setup

## ⚡ TL;DR

Your API keys **MUST** be in the **Backend `.env` file** (Secure - Production Ready) ✅

**Security Update:** Client-side API key storage has been removed for security. All LLM calls now route through the backend server.

---

## 📍 Where Are Your API Keys?

### Backend `.env` File (Required ✅)

**File:** `/Users/ramihatoum/Desktop/app/DCS/backend/.env`

```properties
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
```

**Security:** 🔒 Secure (keys on server only, never exposed to browser)

**Note:** The `.env.example` file contains placeholders. Copy it to `.env` and add your real keys.

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

### Method 1: Terminal
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

### Method 2: Browser Console
```javascript
// Paste in console while app is running:
fetch('http://localhost:3001/health')
  .then(r => r.json())
  .then(console.log)

// Should show: {status: "healthy", services: {...}}
```

---

## 🎯 How to Add/Update API Keys

### Backend `.env` File (Required)

```bash
# Step 1: Copy the example file (if you haven't already)
cp backend/.env.example backend/.env

# Step 2: Edit backend/.env
nano backend/.env

# Step 3: Add your real API keys:
ANTHROPIC_API_KEY=sk-ant-YOUR-NEW-KEY-HERE
OPENAI_API_KEY=sk-proj-YOUR-NEW-KEY-HERE
GOOGLE_API_KEY=AIza-YOUR-NEW-KEY-HERE

# Step 4: Restart backend
pkill -f "node server.js"
cd backend && npm start
```

**Get API Keys:**
- **Anthropic (Claude):** https://console.anthropic.com/settings/keys
- **OpenAI (GPT-4):** https://platform.openai.com/api-keys
- **Google (Gemini):** https://makersuite.google.com/app/apikey

---

## 🔐 Security Architecture

### Secure Backend-Only Design ✅

```
Frontend → Backend Proxy → LLM API
            ↑ (Keys here, secure)
```

**Console shows:**
```
[Backend] ✅ Available - Using secure proxy
[Anthropic] 🔒 Using backend proxy (secure)
```

### Without Backend Running ❌

```
Frontend → ❌ ERROR
```

**Console shows:**
```
[Backend] ❌ Unavailable
Error: Backend server is not available. Please start the backend server to use LLM features.
```

**Note:** The application requires the backend server to be running. There is no client-side fallback for security reasons.

---

## 🧪 Quick Tests

### Test 1: Check Backend Health

```bash
# In browser console:
fetch('http://localhost:3001/health')
  .then(r => r.json())
  .then(d => console.log(
    d.services.anthropic ? '🔒 Backend has Anthropic key' : '❌ No Anthropic key',
    d.services.openai ? '🔒 Backend has OpenAI key' : '❌ No OpenAI key',
    d.services.gemini ? '🔒 Backend has Gemini key' : '❌ No Gemini key'
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

---

## 🎯 Common Questions

### Q: Where should I put my API keys?

**A:** Backend `.env` file only. Client-side storage has been removed for security.

### Q: What if I don't have a `.env` file?

**A:** Copy `backend/.env.example` to `backend/.env` and add your real API keys.

### Q: How do I know if my keys are working?

**A:** Check console logs:
- `🔒 Using backend proxy` = Backend is working (secure)
- Check `/health` endpoint: `curl http://localhost:3001/health`

### Q: Do I need to configure anything?

**A:** Just add your API keys to `backend/.env` and start the backend:
```bash
cd backend && npm start
```

### Q: What if the backend is not running?

**A:** The application will show an error message. You must start the backend to use LLM features.

### Q: Can I use the app without API keys?

**A:** Pattern-based extraction works without API keys (~70% accuracy), but LLM features require at least one API key configured in the backend.

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
        🔒 App works      ❌ App shows error
        Secure mode       "Backend required"
                │                   │
                │                   │
                │                   ▼
                │           Start backend to proceed
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
            Check console: "🔒 Using backend proxy"
```

---

## 🎨 Feature Management

### Model Selection

The app supports multiple LLM providers:
- **Claude Sonnet 3.5** (Anthropic) - Best for structured extraction
- **GPT-4o** (OpenAI) - Excellent medical knowledge
- **Gemini 1.5 Pro** (Google) - Cost-effective

Select your preferred model in the Settings page of the application.

### Feature Flags

All features are enabled by default. You can manage feature flags through the application's Settings interface.

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

**🎯 Remember:** All API keys must be in `backend/.env`. The backend server is required for LLM features. Start it with `cd backend && npm start` 🔒✨

**🔒 Security:** Client-side API key storage has been removed. All LLM calls route through the secure backend proxy.
