# 🔧 Troubleshooting Guide

## Quick Fixes

### Application Won't Start

**Problem**: `npm run dev` fails with module errors
```bash
# Solution 1: Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Solution 2: Clear npm cache
npm cache clean --force
npm install
```

**Problem**: "Port 5173 already in use"
```bash
# Solution: Kill the process or use a different port
lsof -ti:5173 | xargs kill -9
# OR
PORT=5174 npm run dev
```

### Backend Connection Issues

**Problem**: "CORS error" or "Failed to fetch"
```bash
# Check backend is running
curl http://localhost:3001/health

# Should return: {"status":"healthy",...}

# If not running, start it:
cd backend
node server.js
```

**Problem**: Backend starts but API calls fail
- Check API keys are set in `backend/.env`
- Verify `.env` file exists (copy from `.env.example`)
- Check console for specific error messages

### Build Errors

**Problem**: "Cannot resolve module"
```bash
# Verify all dependencies are installed
npm list --depth=0

# Reinstall specific package
npm install <package-name>
```

**Problem**: "Out of memory" during build
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Storage Issues

**Problem**: "QuotaExceededError" in localStorage
```javascript
// Open browser console and run:
localStorage.clear();
// OR selectively clear app data:
Object.keys(localStorage)
  .filter(key => key.startsWith('dsg_'))
  .forEach(key => localStorage.removeItem(key));
```

**Problem**: IndexedDB errors
1. Open DevTools (F12)
2. Go to Application → Storage → IndexedDB
3. Right-click database → Delete
4. Reload page

### Runtime Errors

**Problem**: "Cannot read property of undefined"
- Enable debug mode: `window.DCS_DEBUG_UTILS?.enableFullDebug()`
- Check browser console for detailed stack trace
- Verify data structure matches expected format

**Problem**: Extraction returns empty results
- Verify input notes have medical content
- Check LLM provider is configured in Settings
- Enable debug mode and check extraction logs

**Problem**: Summary generation fails
- Verify API keys are valid
- Check backend health: `curl http://localhost:3001/health`
- Try different LLM provider
- Check network tab for API errors

## Common Scenarios

### Scenario 1: Fresh Install Issues

```bash
# Complete setup from scratch
cd /path/to/DCS

# Frontend setup
npm install
npm run build

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env and add API keys
node server.js &
cd ..

# Start frontend
npm run dev
```

### Scenario 2: After Git Pull

```bash
# Update dependencies
npm install
cd backend && npm install && cd ..

# Rebuild
npm run build

# Run tests
bash run-tests.sh
```

### Scenario 3: API Key Issues

**Symptoms**: 
- 401 Unauthorized errors
- "Invalid API key" messages
- LLM calls timeout

**Solution**:
1. Check `backend/.env` has valid keys:
   ```bash
   cat backend/.env
   ```

2. Test API key validity:
   ```bash
   # Test Anthropic key
   curl -X POST http://localhost:3001/api/test/anthropic

   # Test OpenAI key
   curl -X POST http://localhost:3001/api/test/openai
   ```

3. If keys are invalid:
   - Anthropic: https://console.anthropic.com/
   - OpenAI: https://platform.openai.com/api-keys
   - Gemini: https://makersuite.google.com/app/apikey

### Scenario 4: Performance Issues

**Symptoms**:
- Slow extraction
- UI freezes
- High memory usage

**Solutions**:

1. Clear old data:
```javascript
// In browser console
localStorage.clear();
indexedDB.deleteDatabase('dcs-learning');
indexedDB.deleteDatabase('dcs-storage');
```

2. Reduce batch size:
   - Process fewer notes at once
   - Split large notes into smaller sections

3. Check browser performance:
```javascript
// Enable performance monitoring
window.DCS_DEBUG_UTILS?.enableFullDebug();
window.DCS_DEBUG_UTILS?.logMemoryUsage();
```

### Scenario 5: Data Not Persisting

**Problem**: Corrections/settings lost on refresh

**Causes**:
- Privacy mode/incognito browsing (storage disabled)
- Auto-save disabled in Settings
- Browser storage quota exceeded

**Solutions**:
1. Check if in privacy mode
2. Enable auto-save in Settings
3. Clear old data to free up space
4. Use Export feature to backup data

## Browser-Specific Issues

### Chrome/Edge
- Clear site data: DevTools → Application → Clear Storage
- Disable extensions that might interfere
- Check for Brave Shield or similar blockers

### Firefox
- Check Enhanced Tracking Protection settings
- Allow storage for the site
- Clear cookies and site data

### Safari
- Enable localStorage in Preferences
- Disable content blockers
- Check Intelligent Tracking Prevention settings

## Development Issues

### Hot Module Replacement (HMR) Not Working
```bash
# Restart dev server
npm run dev

# If still not working, clear cache:
rm -rf node_modules/.vite
npm run dev
```

### TypeScript Errors (if using TypeScript)
```bash
# Regenerate types
npm run build

# Check for type errors
npx tsc --noEmit
```

### ESLint Errors
```bash
# Auto-fix common issues
npx eslint src --fix

# Check for remaining issues
npx eslint src
```

## Debugging Tools

### Enable Debug Mode
```javascript
// In browser console
window.DCS_DEBUG_UTILS?.enableFullDebug();

// Available utilities:
// - window.DCS_DEBUG_UTILS.debug (logging)
// - window.DCS_DEBUG_UTILS.inspect (object inspection)
// - window.DCS_DEBUG_UTILS.captureSnapshot (state capture)
// - window.DCS_DEBUG_UTILS.exportDebugData (export all debug info)
```

### Check Stored Errors
```javascript
// View all stored errors
import { getStoredErrors } from './utils/errorHandling.js';
console.table(getStoredErrors());

// Clear error log
import { clearStoredErrors } from './utils/errorHandling.js';
clearStoredErrors();
```

### Export Debug Report
```javascript
// Get comprehensive debug data
const debugData = window.DCS_DEBUG_UTILS?.exportDebugData();
console.log(JSON.stringify(debugData, null, 2));

// Copy to clipboard for sharing
navigator.clipboard.writeText(JSON.stringify(debugData, null, 2));
```

## Database Issues

### Reset Learning Database
```javascript
// In browser console
import { clearAllData } from './services/storage/learningDatabase.js';
clearAllData().then(() => {
  console.log('Learning data cleared');
  location.reload();
});
```

### Export/Import Learning Data
```javascript
// Export for backup
import { exportLearningData } from './services/storage/learningDatabase.js';
const backup = await exportLearningData();
console.log(JSON.stringify(backup));

// Import from backup
import { importLearningData } from './services/storage/learningDatabase.js';
await importLearningData(backupData);
```

## Network Issues

### Check Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Reproduce the issue
5. Check failed requests for details

### Proxy Issues
```bash
# Check if backend is accessible
curl http://localhost:3001/health

# Check CORS headers
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     http://localhost:3001/api/anthropic
```

## Performance Optimization

### Reduce Bundle Size
```bash
# Analyze bundle
npm run build -- --mode production

# Check bundle analyzer (if installed)
npx vite-bundle-visualizer
```

### Clear Caches
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Clear build output
rm -rf dist

# Rebuild
npm run build
```

## Getting Help

### Collect Diagnostic Information

```bash
# System info
node -v
npm -v
git --version

# Package versions
npm list react react-dom vite

# Run tests
bash run-tests.sh

# Check logs
cat /tmp/build.log
```

### Create Issue Report

Include the following:
1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Environment**:
   - OS and version
   - Browser and version
   - Node.js version
5. **Debug data**: `window.DCS_DEBUG_UTILS?.exportDebugData()`
6. **Console errors**: Copy from DevTools console
7. **Network errors**: Screenshot from Network tab

## Quick Reference Commands

```bash
# Install dependencies
npm install && cd backend && npm install && cd ..

# Run tests
bash run-tests.sh

# Start dev server
npm run dev

# Start backend
cd backend && node server.js

# Build production
npm run build

# Preview production build
npm run preview

# Clear everything and start fresh
rm -rf node_modules package-lock.json dist
rm -rf backend/node_modules backend/package-lock.json
npm install && cd backend && npm install && cd ..
npm run build

# Check system status
bash verify-ml-system.sh
```

## Still Having Issues?

1. Search existing issues: https://github.com/ramihatou97/DCS/issues
2. Check documentation: `README.md`, `ML_LEARNING_SYSTEM.md`
3. Enable debug mode and export diagnostic data
4. Create a new issue with full diagnostic information

---

**Last Updated**: October 2025
**Version**: 1.0.0
