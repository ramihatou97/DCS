#!/bin/bash

# 🚀 Quick Deployment Script for DCS
# Deploys to Vercel (Frontend) + Railway (Backend)

set -e

echo "🚀 DCS Quick Deployment Script"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed${NC}"
        echo "Install it with: $2"
        exit 1
    else
        echo -e "${GREEN}✓ $1 is installed${NC}"
    fi
}

echo "Checking prerequisites..."
check_tool "npm" "Visit https://nodejs.org"
check_tool "vercel" "npm install -g vercel"
check_tool "railway" "npm install -g @railway/cli"
echo ""

# Build the frontend
echo "📦 Building frontend..."
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend build successful${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi
echo ""

# Deploy frontend to Vercel
echo "🌐 Deploying frontend to Vercel..."
vercel --prod
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend deployed successfully${NC}"
else
    echo -e "${RED}❌ Frontend deployment failed${NC}"
    exit 1
fi
echo ""

# Deploy backend to Railway
echo "🚂 Deploying backend to Railway..."
cd backend
railway up
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend deployed successfully${NC}"
else
    echo -e "${RED}❌ Backend deployment failed${NC}"
    exit 1
fi
cd ..
echo ""

# Success message
echo ""
echo "================================"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Get your Railway backend URL from: railway status"
echo "2. Update VITE_API_PROXY_URL in Vercel environment variables"
echo "3. Redeploy frontend: vercel --prod"
echo ""
echo -e "${YELLOW}⚠️  Don't forget to set environment variables in Railway:${NC}"
echo "   - ANTHROPIC_API_KEY"
echo "   - OPENAI_API_KEY"
echo "   - GEMINI_API_KEY"
echo ""
