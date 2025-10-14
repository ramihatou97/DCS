# 🚀 Quick Setup Guide

## Prerequisites

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Git**: Latest version

Check your versions:
```bash
node -v   # Should be v18.0.0 or higher
npm -v    # Should be 9.0.0 or higher
```

## Installation (5 minutes)

### Step 1: Clone Repository
```bash
git clone https://github.com/ramihatou97/DCS.git
cd DCS
```

### Step 2: Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Step 3: Configure API Keys
```bash
# Copy example environment file
cd backend
cp .env.example .env

# Edit .env and add your API keys
# Get keys from:
# - Anthropic: https://console.anthropic.com/
# - OpenAI: https://platform.openai.com/api-keys
# - Gemini: https://makersuite.google.com/app/apikey

# Example .env content:
# ANTHROPIC_API_KEY=sk-ant-your-key-here
# OPENAI_API_KEY=sk-your-key-here
# GEMINI_API_KEY=your-gemini-key-here
```

### Step 4: Run Tests (Optional but Recommended)
```bash
bash run-tests.sh
```

### Step 5: Start Application

**Option A: Manual Start (Recommended for Development)**
```bash
# Terminal 1: Start backend
cd backend
node server.js

# Terminal 2: Start frontend
npm run dev

# Open http://localhost:5173
```

**Option B: Using Helper Scripts**
```bash
# Start everything at once (if scripts are set up)
./start-all.sh

# Or individually
./server.sh start
```

## Verify Installation

### Test Backend
```bash
# Health check
curl http://localhost:3001/health

# Expected response:
# {"status":"healthy","services":{"anthropic":true,"openai":true,"gemini":true}}
```

### Test Frontend
1. Open http://localhost:5173
2. You should see the "Discharge Summary Generator" interface
3. Navigate through tabs: Upload, Review, Generate, Learning, Settings

## First-Time Usage

### 1. Test Extraction
1. Go to **Upload Notes** tab
2. Use the sample file: `sample-note-SAH.txt`
3. Click **Process Notes**
4. Extracted data should appear in **Review Data** tab

### 2. Test Generation
1. After extraction, go to **Generate Summary** tab
2. Select an LLM provider (Claude, GPT, or Gemini)
3. Click **Generate Summary**
4. Summary should appear in ~5-10 seconds

### 3. Test Learning System
1. Make some corrections in **Review Data**
2. Go to **Learning Dashboard**
3. View correction statistics and learned patterns

## Common Setup Issues

### Issue: Dependencies won't install
```bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port already in use
```bash
# Frontend (5173)
lsof -ti:5173 | xargs kill -9

# Backend (3001)
lsof -ti:3001 | xargs kill -9
```

### Issue: API keys not working
```bash
# Test keys individually
cd backend
curl -X POST http://localhost:3001/api/test/anthropic
curl -X POST http://localhost:3001/api/test/openai
```

## Development Workflow

### Daily Startup
```bash
# 1. Pull latest changes
git pull

# 2. Update dependencies (if package.json changed)
npm install
cd backend && npm install && cd ..

# 3. Start servers
# Terminal 1
cd backend && node server.js

# Terminal 2
npm run dev
```

### Making Changes

1. **Code Changes**: Edit files in `src/`
2. **Hot Reload**: Changes appear automatically
3. **Build Test**: Run `npm run build` before committing
4. **Run Tests**: Run `bash run-tests.sh` before pushing

### Before Committing

```bash
# 1. Build succeeds
npm run build

# 2. Tests pass
bash run-tests.sh

# 3. Verify ML system
bash verify-ml-system.sh

# 4. Check for console errors
# Run app and check browser DevTools
```

## Project Structure Overview

```
DCS/
├── src/                      # Frontend source code
│   ├── components/           # React components
│   ├── services/             # Business logic
│   │   ├── ml/              # ML learning system
│   │   └── storage/         # Data persistence
│   ├── utils/               # Utility functions
│   ├── config/              # Configuration files
│   └── styles/              # CSS files
│
├── backend/                 # Backend proxy server
│   ├── server.js           # Express server
│   ├── package.json        # Backend dependencies
│   └── .env                # API keys (gitignored)
│
├── dist/                    # Build output (gitignored)
├── node_modules/            # Dependencies (gitignored)
│
├── package.json             # Frontend dependencies
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS config
│
├── README.md               # Main documentation
├── TROUBLESHOOTING.md      # Common issues
├── TESTING_AND_DEBUGGING.md # Testing guide
├── ML_LEARNING_SYSTEM.md   # ML system docs
│
└── run-tests.sh            # Automated tests
```

## Available Scripts

### Frontend
```bash
npm run dev      # Start dev server (port 5173)
npm run build    # Build for production
npm run preview  # Preview production build
```

### Backend
```bash
cd backend
node server.js   # Start server (port 3001)
npm run dev      # Start with hot reload (if configured)
```

### Testing
```bash
bash run-tests.sh           # Run all automated tests
bash verify-ml-system.sh    # Verify ML components
```

## Next Steps

1. **Read Documentation**:
   - `README.md` - Project overview
   - `ML_LEARNING_SYSTEM.md` - ML features
   - `CLINICAL_OBJECTIVES.md` - Clinical requirements

2. **Try Sample Workflows**:
   - Process sample notes in `sample-note-SAH.txt`
   - Test extraction and generation
   - Explore learning dashboard

3. **Configure Settings**:
   - Set default LLM provider
   - Adjust confidence thresholds
   - Enable/disable auto-save

4. **Explore Advanced Features**:
   - Pattern learning
   - Correction tracking
   - Data export/import

## Getting Help

- **Documentation**: See `docs/` folder
- **Troubleshooting**: See `TROUBLESHOOTING.md`
- **Issues**: https://github.com/ramihatou97/DCS/issues
- **Debug Mode**: Enable in browser console:
  ```javascript
  window.DCS_DEBUG_UTILS?.enableFullDebug()
  ```

## Quick Reference

| Task | Command |
|------|---------|
| Install all | `npm install && cd backend && npm install && cd ..` |
| Start backend | `cd backend && node server.js` |
| Start frontend | `npm run dev` |
| Run tests | `bash run-tests.sh` |
| Build | `npm run build` |
| Debug | Open DevTools → Console → `window.DCS_DEBUG_UTILS.enableFullDebug()` |

---

**Estimated Setup Time**: 5-10 minutes
**First-Time Run**: Additional 2-3 minutes for API key setup

Happy coding! 🎉
