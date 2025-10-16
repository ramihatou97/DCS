# 🔑 API Keys Setup Guide

## 📍 Where to Insert API Keys

Your API keys should be stored in the `.env` file at the root of the project:

```
/Users/ramihatoum/Desktop/app/DCS/.env
```

## 📋 Step-by-Step Setup

### 1. Open the .env File

```bash
# Using TextEdit (Mac)
open -a TextEdit .env

# OR using nano (Terminal)
nano .env

# OR using VS Code
code .env
```

### 2. Get Your API Keys

You need API keys from three providers:

#### A. Anthropic Claude (Primary)
1. Go to: https://console.anthropic.com/settings/keys
2. Click "Create Key"
3. Name it: "DCS App"
4. Copy the key (starts with `sk-ant-`)

#### B. OpenAI (Fallback)
1. Go to: https://platform.openai.com/api-keys
2. Click "+ Create new secret key"
3. Name it: "DCS App"
4. Copy the key (starts with `sk-proj-` or `sk-`)

#### C. Google Gemini (Alternative)
1. Go to: https://makersuite.google.com/app/apikey
2. Click "Create API key"
3. Copy the key (starts with `AIza`)

### 3. Insert Keys in .env File

Replace the placeholder text with your actual keys:

```bash
# DCS Backend API Keys
# IMPORTANT: Never commit this file to git!

# Anthropic Claude API Key
ANTHROPIC_API_KEY=sk-ant-api03-YOUR-ACTUAL-KEY-HERE

# OpenAI API Key
OPENAI_API_KEY=sk-proj-YOUR-ACTUAL-KEY-HERE

# Google Gemini API Key
GEMINI_API_KEY=AIzaYOUR-ACTUAL-KEY-HERE
```

### 4. Save the File

- **TextEdit**: File → Save (⌘S)
- **nano**: Ctrl+O, Enter, Ctrl+X
- **VS Code**: File → Save (⌘S)

### 5. Verify Keys are Loaded

```bash
# Restart backend server
lsof -ti:3001 | xargs kill -9
cd /Users/ramihatoum/Desktop/app/DCS
node server.js &

# Check health endpoint
curl http://localhost:3001/health
```

**Expected output:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-14T...",
  "services": {
    "anthropic": true,
    "openai": true,
    "gemini": true
  }
}
```

---

## ✅ Verification Checklist

- [ ] `.env` file exists at `/Users/ramihatoum/Desktop/app/DCS/.env`
- [ ] File contains all 3 API keys (ANTHROPIC, OPENAI, GEMINI)
- [ ] Keys don't have quotes around them
- [ ] No extra spaces before or after `=`
- [ ] Backend server restarted after adding keys
- [ ] Health endpoint shows all 3 services as `true`

---

## 🧪 Test Each API Key

### Test Anthropic
```bash
curl -X POST http://localhost:3001/api/test/anthropic
```

**Expected:** `{"success":true,"provider":"anthropic"}`

### Test OpenAI
```bash
curl -X POST http://localhost:3001/api/test/openai
```

**Expected:** `{"success":true,"provider":"openai"}`

### Test Gemini
```bash
curl -X POST http://localhost:3001/api/test/gemini
```

**Expected:** `{"success":true,"provider":"gemini"}`

---

## 🚨 Common Issues & Fixes

### Issue 1: "No API key configured"
**Fix:** Make sure `.env` file has no typos:
- Correct: `ANTHROPIC_API_KEY=sk-ant-...`
- Wrong: `ANTHROPIC_API_KEYS=...` (extra S)
- Wrong: `ANTHROPIC_API_KEY =...` (space before =)

### Issue 2: "Invalid API key"
**Fix:**
1. Copy key again from provider website
2. Make sure no extra characters (spaces, newlines)
3. Key format should be:
   - Anthropic: `sk-ant-api03-...`
   - OpenAI: `sk-proj-...` or `sk-...`
   - Gemini: `AIza...`

### Issue 3: "Backend shows all keys as false"
**Fix:**
1. Check `.env` file exists: `ls -la .env`
2. Check file content: `cat .env` (be careful, shows actual keys!)
3. Restart backend: `lsof -ti:3001 | xargs kill -9 && node server.js &`

### Issue 4: ".env file is .rtf format"
**Fix:**
1. Delete the `.env.rtf` file
2. Create new `.env` file (plain text only)
3. Use Terminal: `nano .env` or VS Code: `code .env`

---

## 🔒 Security Best Practices

✅ **DO:**
- Keep `.env` file in root directory
- Never commit `.env` to git (it's in `.gitignore`)
- Rotate keys periodically (every 3-6 months)
- Use different keys for development vs production

❌ **DON'T:**
- Share `.env` file via email/Slack
- Upload to GitHub/cloud storage
- Hardcode keys in source code
- Use same keys across multiple apps

---

## 💰 API Pricing (Approximate)

| Provider | Model | Cost per 1M tokens |
|----------|-------|-------------------|
| **Anthropic** | Claude 3.5 Sonnet | $3 input / $15 output |
| **OpenAI** | GPT-4 Turbo | $10 input / $30 output |
| **Google** | Gemini Pro | $0.50 input / $1.50 output |

**Estimated cost per discharge summary:** $0.10 - $0.30 depending on note length

---

## 🎯 Quick Start (After Setup)

1. **Verify keys loaded**:
   ```bash
   curl http://localhost:3001/health
   ```

2. **Open app**:
   ```
   http://localhost:5173
   ```

3. **Upload sample note**:
   - Use `sample-note-SAH.txt` from project root
   - Click "Process Notes"
   - Should extract data successfully

4. **Generate summary**:
   - Review extracted data
   - Click "Proceed to Generate Summary"
   - Should create comprehensive discharge summary

---

## 📞 Support

If you have issues:
1. Check health endpoint: `curl http://localhost:3001/health`
2. Verify `.env` file exists and has correct format
3. Restart backend server
4. Check browser console for errors

---

**Last Updated:** 2025-10-14
**File Location:** `/Users/ramihatoum/Desktop/app/DCS/.env`
