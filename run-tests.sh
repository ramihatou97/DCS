#!/bin/bash

# Automated Test Script for DCS Application
# Tests build, verification, and basic functionality

set -e  # Exit on error

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     DCS Application - Automated Test Suite                   ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0
WARNINGS=0

# Test result function
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}"
        ((FAILED++))
    fi
}

# Warning function
test_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    ((WARNINGS++))
}

# Test 1: Check Node.js version
echo -e "${BLUE}[Test 1/10]${NC} Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    test_result 0
else
    echo "  Required: Node.js >= 18, Found: $(node -v)"
    test_result 1
fi

# Test 2: Check npm version
echo -e "${BLUE}[Test 2/10]${NC} Checking npm version..."
NPM_VERSION=$(npm -v | cut -d'.' -f1)
if [ "$NPM_VERSION" -ge 9 ]; then
    test_result 0
else
    echo "  Required: npm >= 9, Found: $(npm -v)"
    test_result 1
fi

# Test 3: Verify dependencies
echo -e "${BLUE}[Test 3/10]${NC} Verifying dependencies installation..."
if [ -d "node_modules" ] && [ -f "node_modules/.package-lock.json" ]; then
    test_result 0
else
    test_warning "Dependencies not installed, installing now..."
    npm install > /dev/null 2>&1
    test_result $?
fi

# Test 4: Check critical files
echo -e "${BLUE}[Test 4/10]${NC} Checking critical files..."
MISSING_FILES=0

critical_files=(
    "src/App.jsx"
    "src/main.jsx"
    "src/services/extraction.js"
    "src/services/validation.js"
    "src/services/ml/correctionTracker.js"
    "src/services/ml/learningEngine.js"
    "src/services/ml/anonymizer.js"
    "src/components/BatchUpload.jsx"
    "src/components/ExtractedDataReview.jsx"
    "src/components/SummaryGenerator.jsx"
    "package.json"
    "vite.config.js"
)

for file in "${critical_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "  Missing: $file"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

if [ $MISSING_FILES -eq 0 ]; then
    test_result 0
else
    echo "  Found $MISSING_FILES missing files"
    test_result 1
fi

# Test 5: Run ML system verification
echo -e "${BLUE}[Test 5/10]${NC} Running ML system verification..."
if [ -f "verify-ml-system.sh" ]; then
    bash verify-ml-system.sh > /dev/null 2>&1
    test_result $?
else
    test_warning "verify-ml-system.sh not found"
    test_result 1
fi

# Test 6: Build application
echo -e "${BLUE}[Test 6/10]${NC} Building application..."
npm run build > /tmp/build.log 2>&1
BUILD_RESULT=$?

if [ $BUILD_RESULT -eq 0 ]; then
    # Check if dist directory was created
    if [ -d "dist" ]; then
        test_result 0
    else
        echo "  Build succeeded but dist directory not found"
        test_result 1
    fi
else
    echo "  Build failed. Check /tmp/build.log for details"
    test_result 1
fi

# Test 7: Check build output size
echo -e "${BLUE}[Test 7/10]${NC} Validating build output..."
if [ -d "dist" ]; then
    DIST_SIZE=$(du -sh dist | cut -f1)
    echo "  Build size: $DIST_SIZE"
    
    # Check if critical files exist in dist
    if [ -f "dist/index.html" ] && [ -d "dist/assets" ]; then
        test_result 0
    else
        echo "  Missing critical files in dist"
        test_result 1
    fi
else
    echo "  dist directory not found"
    test_result 1
fi

# Test 8: Check backend setup
echo -e "${BLUE}[Test 8/10]${NC} Checking backend configuration..."
if [ -d "backend" ] && [ -f "backend/server.js" ] && [ -f "backend/package.json" ]; then
    test_result 0
else
    echo "  Backend files incomplete"
    test_result 1
fi

# Test 9: Verify backend dependencies
echo -e "${BLUE}[Test 9/10]${NC} Verifying backend dependencies..."
if [ -d "backend/node_modules" ]; then
    test_result 0
else
    test_warning "Backend dependencies not installed, installing..."
    cd backend
    npm install > /dev/null 2>&1
    BACKEND_INSTALL=$?
    cd ..
    test_result $BACKEND_INSTALL
fi

# Test 10: Check documentation
echo -e "${BLUE}[Test 10/10]${NC} Checking documentation..."
DOC_MISSING=0

documentation_files=(
    "README.md"
    "ML_LEARNING_SYSTEM.md"
    "TESTING_AND_DEBUGGING.md"
)

for doc in "${documentation_files[@]}"; do
    if [ ! -f "$doc" ]; then
        echo "  Missing: $doc"
        DOC_MISSING=$((DOC_MISSING + 1))
    fi
done

if [ $DOC_MISSING -eq 0 ]; then
    test_result 0
else
    echo "  Found $DOC_MISSING missing documentation files"
    test_result 1
fi

# Summary
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                      TEST SUMMARY                             ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "  ${GREEN}Passed:${NC}   $PASSED"
echo -e "  ${RED}Failed:${NC}   $FAILED"
echo -e "  ${YELLOW}Warnings:${NC} $WARNINGS"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "🚀 Application is ready to run:"
    echo "   Frontend: npm run dev"
    echo "   Backend:  cd backend && node server.js"
    echo ""
    exit 0
else
    echo -e "${RED}❌ $FAILED test(s) failed${NC}"
    echo ""
    echo "Please fix the issues above and run the tests again."
    echo ""
    exit 1
fi
