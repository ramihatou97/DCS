#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 DCS System Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Node.js
echo "1️⃣  Node.js Version:"
node --version
echo ""

# Check backend server
echo "2️⃣  Backend Server (Port 3001):"
if lsof -ti:3001 > /dev/null 2>&1; then
  echo "   ✅ Running"
  curl -s http://localhost:3001/health | jq '.' 2>/dev/null || curl -s http://localhost:3001/health
else
  echo "   ❌ NOT RUNNING"
fi
echo ""

# Check frontend server
echo "3️⃣  Frontend Server (Port 5173):"
if lsof -ti:5173 > /dev/null 2>&1; then
  echo "   ✅ Running on http://localhost:5173"
else
  echo "   ❌ NOT RUNNING"
fi
echo ""

# Check root .env
echo "4️⃣  Backend Configuration:"
if [ -f ".env" ]; then
  echo "   ✅ .env file exists"
  echo "   API Keys configured:"
  grep -E "^(ANTHROPIC|OPENAI|GEMINI)_API_KEY=" .env 2>/dev/null | sed 's/=.*/=***/' | sed 's/^/      /'
else
  echo "   ❌ .env file missing"
fi
echo ""

# Check critical files
echo "5️⃣  Critical Files:"
files=(
  "src/services/extraction.js"
  "src/services/comprehensiveExtraction.js"
  "src/services/dataMerger.js"
  "src/services/validation.js"
  "src/components/ExtractedDataReview.jsx"
  "backend/server.js"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "   ✅ $file"
  else
    echo "   ❌ $file MISSING"
  fi
done
echo ""

# Check sample note
echo "6️⃣  Sample Note:"
if [ -f "sample-note-SAH.txt" ]; then
  echo "   ✅ sample-note-SAH.txt exists ($(wc -l < sample-note-SAH.txt) lines)"
else
  echo "   ❌ sample-note-SAH.txt missing"
fi
echo ""

# Check recent commit
echo "7️⃣  Git Status:"
echo "   Latest commit: $(git log -1 --oneline)"
echo "   Branch: $(git branch --show-current)"
if [ -n "$(git status --porcelain)" ]; then
  echo "   ⚠️  Uncommitted changes:"
  git status --short | sed 's/^/      /'
else
  echo "   ✅ Clean working directory"
fi
echo ""

# System summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 System Status Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

BACKEND_OK=0
FRONTEND_OK=0
CONFIG_OK=0

lsof -ti:3001 > /dev/null 2>&1 && BACKEND_OK=1
lsof -ti:5173 > /dev/null 2>&1 && FRONTEND_OK=1
[ -f ".env" ] && CONFIG_OK=1

if [ $BACKEND_OK -eq 1 ] && [ $FRONTEND_OK -eq 1 ] && [ $CONFIG_OK -eq 1 ]; then
  echo "✅ ALL SYSTEMS OPERATIONAL"
  echo ""
  echo "🚀 Ready to test:"
  echo "   1. Open http://localhost:5173"
  echo "   2. Upload sample-note-SAH.txt"
  echo "   3. Click 'Process Notes'"
  echo "   4. Review extracted data"
  echo "   5. Generate summary"
else
  echo "⚠️  SYSTEM ISSUES DETECTED"
  [ $BACKEND_OK -eq 0 ] && echo "   ❌ Backend server not running"
  [ $FRONTEND_OK -eq 0 ] && echo "   ❌ Frontend server not running"
  [ $CONFIG_OK -eq 0 ] && echo "   ❌ Backend .env missing"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
