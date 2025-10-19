# 🚀 DCS Backend - Deployment Checklist

**Last Updated:** October 18, 2025  
**Status:** Pre-Deployment Fixes Applied ✅

---

## 📋 Table of Contents

1. [Critical Fixes Applied](#critical-fixes-applied)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Environment Configuration](#environment-configuration)
4. [Security Checklist](#security-checklist)
5. [Performance Optimization](#performance-optimization)
6. [Monitoring & Logging](#monitoring--logging)
7. [Testing Requirements](#testing-requirements)
8. [Deployment Steps](#deployment-steps)
9. [Post-Deployment Verification](#post-deployment-verification)
10. [Rollback Plan](#rollback-plan)

---

## ✅ Critical Fixes Applied

### 1. **LLM Cache Implementation** 🔴 BLOCKING → ✅ FIXED
- **Issue:** `getCachedLLMResponse is not defined` error
- **Fix:** Created `backend/src/utils/llmCache.js` with NodeCache
- **Status:** ✅ Complete
- **Files Modified:**
  - `backend/src/utils/llmCache.js` (new)
  - `backend/src/services/llmService.js` (updated imports)

### 2. **Quality Metrics Defensive Checks** 🟡 MEDIUM → ✅ FIXED
- **Issue:** Quality metrics crashes on null/undefined LLM responses
- **Fix:** Added comprehensive null/undefined checks
- **Status:** ✅ Complete
- **Files Modified:**
  - `backend/src/services/qualityMetrics.js` (complete rewrite)

### 3. **Standardized Error Handling** 🟡 MEDIUM → ✅ FIXED
- **Issue:** Inconsistent error responses across endpoints
- **Fix:** Created AppError class and handleAsync wrapper
- **Status:** ✅ Complete
- **Files Created:**
  - `backend/src/utils/errors.js` (new)
- **Files Modified:**
  - `backend/src/routes/extraction.js` (applied handleAsync)

### 4. **Input Validation** 🔴 CRITICAL → ✅ FIXED
- **Issue:** No input validation - security risk
- **Fix:** Created express-validator middleware
- **Status:** ✅ Complete
- **Files Created:**
  - `backend/src/middleware/validation.js` (new)
- **Files Modified:**
  - `backend/src/routes/extraction.js` (applied validation)
  - `backend/src/server.js` (added validationErrorHandler)

### 5. **Rate Limiting** 🔴 CRITICAL → ✅ FIXED
- **Issue:** No rate limiting - cost control and abuse prevention
- **Fix:** Created rate limiting middleware with tiered limits
- **Status:** ✅ Complete
- **Files Created:**
  - `backend/src/middleware/rateLimiter.js` (new)
- **Files Modified:**
  - `backend/src/server.js` (applied rate limiters)
  - `backend/src/routes/extraction.js` (applied LLM limiter)

### 6. **Learning Engine Storage** ✅ ALREADY FIXED
- **Issue:** Originally used IndexedDB (browser-only)
- **Status:** ✅ Already uses file-based storage (`backend/data/learned_patterns.json`)
- **No changes needed**

---

## 📋 Pre-Deployment Checklist

### Critical Items (MUST FIX)

- [x] **Fix getCachedLLMResponse undefined error**
  - ✅ Created `backend/src/utils/llmCache.js`
  - ✅ Updated `backend/src/services/llmService.js`

- [x] **Fix quality metrics null/undefined handling**
  - ✅ Updated `backend/src/services/qualityMetrics.js`

- [x] **Add environment variable configuration**
  - ✅ Updated `backend/.env.example`

- [x] **Implement error handling middleware**
  - ✅ Created `backend/src/utils/errors.js`
  - ✅ Applied to routes

- [x] **Add input validation**
  - ✅ Created `backend/src/middleware/validation.js`
  - ✅ Applied to extraction endpoint

- [ ] **Configure LLM API keys**
  - ⚠️ Copy `backend/.env.example` to `backend/.env`
  - ⚠️ Add real API keys (at least one required)

- [ ] **Run integration tests**
  - ⚠️ Execute `cd backend && npm test`
  - ⚠️ Verify all 49 tests pass

### High Priority Items (SHOULD FIX)

- [x] **Add rate limiting**
  - ✅ Created `backend/src/middleware/rateLimiter.js`
  - ✅ Applied to server.js

- [ ] **Set up monitoring/logging**
  - ⚠️ Consider Winston for structured logging
  - ⚠️ Set up error tracking (Sentry, etc.)

- [ ] **Configure production database** (if using)
  - ⚠️ Set DATABASE_URL in .env
  - ⚠️ Run migrations

- [ ] **Set up Redis caching** (for distributed deployments)
  - ⚠️ Configure Redis connection
  - ⚠️ Update rate limiters to use Redis store

### Nice to Have Items

- [ ] **LLM response streaming**
- [ ] **Advanced performance metrics**
- [ ] **A/B testing framework**
- [ ] **Automated backup system**

---

## 🔐 Environment Configuration

### Required Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

```bash
# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com

# LLM API Keys (at least one required)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
OPENAI_API_KEY=sk-xxxxx
GOOGLE_API_KEY=xxxxx

# Default LLM Model
DEFAULT_LLM_MODEL=claude-sonnet-3.5

# Cache Configuration
CACHE_TTL=3600                  # 1 hour
CACHE_MAX_SIZE=100              # 100 entries

# Rate Limiting
API_RATE_WINDOW=900000          # 15 minutes
API_RATE_MAX=100                # 100 requests
LLM_RATE_WINDOW=3600000         # 1 hour
LLM_RATE_MAX=50                 # 50 LLM calls

# Quality Metrics
QUALITY_THRESHOLD=0.8           # 80% minimum
```

### Environment Variable Validation

```bash
# Run this to verify environment variables
cd backend
node -e "
require('dotenv').config();
const required = ['PORT', 'NODE_ENV', 'FRONTEND_URL'];
const llmKeys = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'GOOGLE_API_KEY'];
const missing = required.filter(k => !process.env[k]);
const hasLLM = llmKeys.some(k => process.env[k]);

if (missing.length) {
  console.error('❌ Missing required env vars:', missing.join(', '));
  process.exit(1);
}
if (!hasLLM) {
  console.error('❌ At least one LLM API key required');
  process.exit(1);
}
console.log('✅ All environment variables configured correctly');
"
```

---

## 🔒 Security Checklist

### API Key Security

- [ ] **Never commit `.env` file to git**
  - ✅ Already in `.gitignore`
  - ⚠️ Double-check: `git status` should NOT show `.env`

- [ ] **Rotate API keys before production**
  - ⚠️ Generate fresh production API keys
  - ⚠️ Never use development keys in production

- [ ] **Use environment variable injection** (recommended)
  - ⚠️ Use platform env vars (Heroku, AWS, etc.)
  - ⚠️ Don't rely solely on .env file in production

### Network Security

- [ ] **Enable HTTPS/TLS**
  - ⚠️ Use SSL certificate (Let's Encrypt, etc.)
  - ⚠️ Force HTTPS redirection
  - ⚠️ Set secure CORS policy

- [ ] **Configure CORS properly**
  - ⚠️ Set specific `FRONTEND_URL` (not `*`)
  - ⚠️ Enable credentials only if needed

- [ ] **Add security headers**
  - ⚠️ Install: `npm install helmet`
  - ⚠️ Add to `server.js`: `app.use(helmet())`

### Input Security

- [x] **Input validation** ✅ Already implemented
  - ✅ Using express-validator
  - ✅ Applied to extraction endpoint
  - ⚠️ Apply to narrative and summary endpoints too

- [ ] **Rate limiting** ✅ Already implemented
  - ✅ API rate limiter: 100 requests/15 min
  - ✅ LLM rate limiter: 50 requests/hour
  - ⚠️ Adjust limits based on production traffic

---

## ⚡ Performance Optimization

### Caching Strategy

- [x] **LLM response caching** ✅ Already implemented
  - ✅ NodeCache with 1-hour TTL
  - ✅ Max 100 entries
  - ⚠️ Monitor cache hit rate in production

- [ ] **Consider Redis for distributed caching**
  - ⚠️ Required for multi-instance deployments
  - ⚠️ Better for high-traffic applications

### Response Compression

```bash
# Install compression middleware
cd backend
npm install compression
```

Add to `server.js`:
```javascript
const compression = require('compression');
app.use(compression());
```

### Database Optimization (if using)

- [ ] **Add database indexes**
- [ ] **Enable connection pooling**
- [ ] **Set up read replicas** (for high traffic)

---

## 📊 Monitoring & Logging

### Recommended: Winston Logger

```bash
cd backend
npm install winston
```

Create `backend/src/utils/logger.js`:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

module.exports = logger;
```

### Metrics to Monitor

- **LLM API Costs**
  - Daily spend limit
  - Cost per request
  - Provider comparison

- **Performance Metrics**
  - Response time (p50, p95, p99)
  - Request rate
  - Error rate

- **Cache Metrics**
  - Hit rate
  - Miss rate
  - Eviction rate

### Recommended Monitoring Services

- **Application Monitoring:** New Relic, Datadog, or Application Insights
- **Error Tracking:** Sentry, Rollbar
- **Log Aggregation:** Loggly, Papertrail, or CloudWatch

---

## 🧪 Testing Requirements

### Pre-Deployment Testing

```bash
cd backend

# 1. Run all tests
npm test

# Expected output:
# Test Suites: 2 passed, 2 total
# Tests:       49 passed, 49 total
# Time:        < 1s

# 2. Run tests with coverage
npm test -- --coverage

# 3. Check for linting errors
npm run lint  # (if configured)
```

### Manual Testing Checklist

- [ ] **Health check endpoint**
  ```bash
  curl http://localhost:3001/api/health
  # Should return: {"status":"healthy"}
  ```

- [ ] **Extraction endpoint**
  ```bash
  curl -X POST http://localhost:3001/api/extract \
    -H "Content-Type: application/json" \
    -d '{"text":"Patient admitted with headache..."}'
  ```

- [ ] **Rate limiting**
  ```bash
  # Send >100 requests in 15 minutes
  # Should return 429 after limit
  ```

- [ ] **Error handling**
  ```bash
  # Send invalid input
  curl -X POST http://localhost:3001/api/extract \
    -H "Content-Type: application/json" \
    -d '{"text":""}'
  # Should return 400 with validation error
  ```

---

## 🚀 Deployment Steps

### Option 1: Docker Deployment (Recommended)

1. **Build Docker image**
   ```bash
   cd backend
   docker build -t dcs-backend:latest .
   ```

2. **Run container**
   ```bash
   docker run -d \
     -p 3001:3001 \
     -e ANTHROPIC_API_KEY=your_key \
     -e NODE_ENV=production \
     --name dcs-backend \
     dcs-backend:latest
   ```

3. **Verify**
   ```bash
   curl http://localhost:3001/api/health
   ```

### Option 2: Traditional Deployment

1. **Prepare server**
   ```bash
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Clone and install**
   ```bash
   git clone https://github.com/ramihatou97/DCS.git
   cd DCS/backend
   npm ci --production
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   nano .env  # Add production values
   ```

4. **Start with PM2**
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name dcs-backend
   pm2 save
   pm2 startup
   ```

### Option 3: Cloud Platform (Heroku, AWS, Azure)

#### Heroku
```bash
heroku create dcs-backend
heroku config:set ANTHROPIC_API_KEY=your_key
heroku config:set NODE_ENV=production
git push heroku main
```

#### AWS Elastic Beanstalk
```bash
eb init dcs-backend
eb create dcs-backend-env
eb setenv ANTHROPIC_API_KEY=your_key NODE_ENV=production
eb deploy
```

---

## ✅ Post-Deployment Verification

### 1. Health Check
```bash
curl https://your-domain.com/api/health
# Expected: {"status":"healthy"}
```

### 2. Extraction Test
```bash
curl -X POST https://your-domain.com/api/extract \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Patient: John Doe, 55M. Admitted with severe headache. Diagnosis: Subarachnoid hemorrhage. Procedure: Endovascular coiling performed on 10/15/2025."
  }'
```

### 3. Rate Limiting Test
```bash
# Send multiple requests rapidly
for i in {1..10}; do
  curl -X POST https://your-domain.com/api/extract \
    -H "Content-Type: application/json" \
    -d '{"text":"test"}' &
done
```

### 4. Error Handling Test
```bash
# Test invalid input
curl -X POST https://your-domain.com/api/extract \
  -H "Content-Type: application/json" \
  -d '{"text":""}'
# Expected: 400 with validation error
```

### 5. Monitor Logs
```bash
# If using PM2
pm2 logs dcs-backend

# If using Docker
docker logs dcs-backend

# If using cloud platform
# Check platform-specific logs
```

---

## 🔄 Rollback Plan

### Quick Rollback Steps

1. **Identify the issue**
   - Check error logs
   - Monitor error rate
   - Check LLM API status

2. **Stop the service**
   ```bash
   # PM2
   pm2 stop dcs-backend
   
   # Docker
   docker stop dcs-backend
   
   # Cloud platform
   heroku ps:scale web=0
   ```

3. **Revert to previous version**
   ```bash
   # Git
   git revert HEAD
   git push origin main
   
   # Docker
   docker run -d dcs-backend:previous-tag
   
   # PM2
   pm2 restart dcs-backend@previous
   ```

4. **Verify rollback**
   ```bash
   curl https://your-domain.com/api/health
   ```

### Rollback Triggers

Rollback immediately if:
- **Error rate > 5%** (check monitoring dashboard)
- **LLM API costs spike unexpectedly** (>2x normal)
- **Response time > 30 seconds** (p95)
- **Critical functionality broken** (extraction fails)

---

## 📞 Support & Troubleshooting

### Common Issues

#### Issue: LLM API calls failing
```bash
# Check API keys
echo $ANTHROPIC_API_KEY
# Should not be empty

# Check network connectivity
curl https://api.anthropic.com
```

#### Issue: High memory usage
```bash
# Check cache size
# Reduce CACHE_MAX_SIZE in .env

# Restart service
pm2 restart dcs-backend
```

#### Issue: Rate limiting too strict
```bash
# Adjust in .env
API_RATE_MAX=200  # Increase from 100
LLM_RATE_MAX=100  # Increase from 50
```

### Contact Information

- **GitHub Issues:** https://github.com/ramihatou97/DCS/issues
- **Email:** [your-email]
- **Slack/Discord:** [your-channel]

---

## 📚 Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Integration Tests Report](./TASK4_ITEM4_INTEGRATION_TESTS_REPORT.md)
- [Performance Optimization Report](./TASK4_ITEM5_PERFORMANCE_OPTIMIZATION_REPORT.md)

---

**Deployment Checklist Version:** 1.0  
**Last Updated:** October 18, 2025  
**Next Review:** Before production deployment
