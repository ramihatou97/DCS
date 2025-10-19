#!/bin/bash

echo "🔍 FINDING ALL MISSING DEPENDENCIES"
echo "===================================="

cd backend

# Try to load server and capture all missing module errors
OUTPUT=$(node src/server.js 2>&1)

# Extract all missing module paths
MISSING=$(echo "$OUTPUT" | grep "Cannot find module" | grep -o "'[^']*'" | tr -d "'" | sort -u)

if [ -z "$MISSING" ]; then
  echo "✅ No missing modules found!"
  exit 0
fi

echo ""
echo "❌ MISSING MODULES:"
echo "$MISSING" | while read module; do
  echo "  - $module"
done

echo ""
echo "🔎 SEARCHING FRONTEND FOR THESE FILES:"
echo "$MISSING" | while read module; do
  # Extract filename from path
  FILE=$(basename "$module")
  
  # Search in frontend
  FOUND=$(find ../src -name "$FILE" 2>/dev/null | head -1)
  
  if [ -n "$FOUND" ]; then
    SIZE=$(ls -lh "$FOUND" | awk '{print $5}')
    echo "  ✅ $FILE found at $FOUND ($SIZE)"
  else
    echo "  ❌ $FILE NOT FOUND in frontend - needs stub"
  fi
done
