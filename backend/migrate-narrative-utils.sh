#!/bin/bash

echo "🚀 MIGRATING NARRATIVE UTILITIES FROM FRONTEND"
echo "=============================================="

SRC="src/utils"
DEST="backend/src/utils"
CONVERT="backend/convert-to-commonjs.sh"

# Critical narrative utilities (MUST HAVE)
CRITICAL=(
  "narrativeSynthesis.js"
  "medicalWritingStyle.js"
  "narrativeTransitions.js"
  "narrativeTemplates.js"
  "narrativeSectionGenerators.js"
)

# Important utilities (SHOULD HAVE)
IMPORTANT=(
  "specificNarrativeGenerators.js"
  "dateUtils.js"
  "textUtils.js"
  "medicalAbbreviations.js"
  "clinicalTemplate.js"
  "validationUtils.js"
)

echo ""
echo "📋 CRITICAL FILES (5):"
for file in "${CRITICAL[@]}"; do
  if [ -f "$SRC/$file" ]; then
    echo "  → Copying $file..."
    cp "$SRC/$file" "$DEST/$file"
    bash "$CONVERT" "$DEST/$file"
    echo "    ✅ Migrated and converted"
  else
    echo "    ❌ $file not found in frontend"
  fi
done

echo ""
echo "📋 IMPORTANT FILES (6):"
for file in "${IMPORTANT[@]}"; do
  if [ -f "$SRC/$file" ]; then
    # Check if already exists
    if [ -f "$DEST/$file" ]; then
      SIZE=$(wc -l < "$DEST/$file" | tr -d ' ')
      if [ "$SIZE" -lt 100 ]; then
        echo "  → Replacing stub $file..."
        cp "$SRC/$file" "$DEST/$file"
        bash "$CONVERT" "$DEST/$file"
        echo "    ✅ Replaced stub with real file"
      else
        echo "  ⏭️  $file already exists (${SIZE} lines) - skipping"
      fi
    else
      echo "  → Copying $file..."
      cp "$SRC/$file" "$DEST/$file"
      bash "$CONVERT" "$DEST/$file"
      echo "    ✅ Migrated and converted"
    fi
  else
    echo "    ❌ $file not found in frontend"
  fi
done

echo ""
echo "=============================================="
echo "✅ MIGRATION COMPLETE"
echo ""
echo "Verifying conversions..."
for file in "${CRITICAL[@]}" "${IMPORTANT[@]}"; do
  if [ -f "$DEST/$file" ]; then
    if node -c "$DEST/$file" 2>/dev/null; then
      LINES=$(wc -l < "$DEST/$file" | tr -d ' ')
      echo "  ✅ $file ($LINES lines) - syntax OK"
    else
      echo "  ⚠️  $file - syntax errors detected"
    fi
  fi
done
