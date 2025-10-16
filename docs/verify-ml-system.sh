#!/bin/bash

# ML System Verification Script
# Verifies all ML components are correctly installed and imported

echo "🧪 VERIFYING ML LEARNING SYSTEM..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

errors=0
warnings=0

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} File exists: $1"
    else
        echo -e "${RED}❌${NC} File missing: $1"
        ((errors++))
    fi
}

# Function to check if export exists in file
check_export() {
    local file=$1
    local export_name=$2

    if grep -q "export.*$export_name" "$file"; then
        echo -e "${GREEN}✅${NC} Export found: $export_name in $file"
    else
        echo -e "${RED}❌${NC} Export missing: $export_name in $file"
        ((errors++))
    fi
}

# Function to check if import exists in file
check_import() {
    local file=$1
    local import_name=$2

    if grep -q "import.*$import_name" "$file"; then
        echo -e "${GREEN}✅${NC} Import found: $import_name in $file"
    else
        echo -e "${YELLOW}⚠️${NC}  Import not found: $import_name in $file"
        ((warnings++))
    fi
}

echo "📁 Checking ML Service Files..."
echo ""

check_file "src/services/ml/anonymizer.js"
check_file "src/services/ml/correctionTracker.js"
check_file "src/services/ml/learningEngine.js"

echo ""
echo "📁 Checking ML Component Files..."
echo ""

check_file "src/components/LearningDashboard.jsx"
check_file "src/components/SummaryImporter.jsx"

echo ""
echo "📁 Checking Modified Files..."
echo ""

check_file "src/components/ExtractedDataReview.jsx"
check_file "src/App.jsx"

echo ""
echo "📁 Checking Documentation..."
echo ""

check_file "ML_LEARNING_SYSTEM.md"
check_file "TEST_ML_SYSTEM.md"

echo ""
echo "🔍 Checking Critical Exports..."
echo ""

check_export "src/utils/textUtils.js" "escapeRegExp"
check_export "src/utils/textUtils.js" "calculateSimilarity"
check_export "src/services/ml/anonymizer.js" "anonymizeText"
check_export "src/services/ml/anonymizer.js" "default"
check_export "src/services/ml/correctionTracker.js" "trackCorrection"
check_export "src/services/ml/correctionTracker.js" "default"
check_export "src/services/ml/learningEngine.js" "learnFromCorrections"
check_export "src/services/ml/learningEngine.js" "default"

echo ""
echo "🔍 Checking Critical Imports..."
echo ""

check_import "src/services/ml/learningEngine.js" "escapeRegExp"
check_import "src/components/ExtractedDataReview.jsx" "trackCorrection"
check_import "src/App.jsx" "LearningDashboard"
check_import "src/App.jsx" "SummaryImporter"

echo ""
echo "📊 VERIFICATION SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "🎉 ML Learning System is correctly installed!"
    echo ""
    echo "Next steps:"
    echo "  1. npm run dev"
    echo "  2. Open http://localhost:5173"
    echo "  3. Test using TEST_ML_SYSTEM.md guide"
    exit 0
else
    echo -e "${RED}❌ Found $errors error(s)${NC}"
    if [ $warnings -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Found $warnings warning(s)${NC}"
    fi
    echo ""
    echo "Please fix the errors above and run this script again."
    exit 1
fi
