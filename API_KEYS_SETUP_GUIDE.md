# 🔑 API Keys Setup Guide

## Where to Insert API Keys

Your API keys go in: **`/Users/ramihatoum/Desktop/app/DCS/backend/.env`**

---

## Current Status

✅ File exists: `backend/.env`  
⚠️  Keys are EMPTY - need to be filled in

---

## Quick Setup (2 options)

### Option 1: Copy from .env.example (FASTEST)
Your keys are already in `.env.example`, just copy them:

```bash
cd /Users/ramihatoum/Desktop/app/DCS/backend
cp .env.example .env
```

### Option 2: Edit .env manually
Open the file and add your keys:

```bash
cd /Users/ramihatoum/Desktop/app/DCS/backend
nano .env  # or use any text editor
```

---

## What to Add

Edit these lines in `backend/.env`:

```env
ANTHROPIC_API_KEY=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
OPENAI_API_KEY=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
GOOGLE_API_KEY=AIzaSyAslxdX-d800XAdr9zsbEYdU_IgT3rDHMo
```

⚠️  **Note:** These keys are currently visible. Make sure `.env` is in your `.gitignore`!

---

## Verify Setup

After adding keys, restart the server:

```bash
cd /Users/ramihatoum/Desktop/app/DCS/backend
npm start
```

You should see:
```
🔑 API Keys configured:
   - Anthropic: ✅
   - OpenAI: ✅
   - Google: ✅
```

Instead of:
```
🔑 API Keys configured:
   - Anthropic: ✗
   - OpenAI: ✗
   - Google: ✗
```

---

## File Locations

```
/Users/ramihatoum/Desktop/app/DCS/
├── backend/
│   ├── .env              ← ADD YOUR KEYS HERE
│   ├── .env.example      ← Template with your keys
│   └── src/
│       └── server.js     ← Reads from .env
```

---

## Security Checklist

- [x] `.env` file in `.gitignore`
- [ ] Keys copied to `backend/.env`
- [ ] Server restarted
- [ ] Keys validated (✅ shown in console)

---

## Need New Keys?

Get them from:
- **Anthropic:** https://console.anthropic.com/
- **OpenAI:** https://platform.openai.com/
- **Google:** https://makersuite.google.com/

