#!/bin/bash

################################################################################
# GitHub Repository Setup & Push Script
# For DCS (Discharge Summary Generator)
################################################################################

echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║                  🚀 GitHub Repository Setup                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 PREREQUISITES:${NC}"
echo "1. Create a new repository on GitHub: https://github.com/new"
echo "2. Repository name: DCS (or your choice)"
echo "3. Description: AI-Powered Discharge Summary Generator"
echo "4. Keep it Public or Private (your choice)"
echo "5. DON'T initialize with README, .gitignore, or license"
echo ""
echo -e "${YELLOW}Press Enter when you've created the GitHub repository...${NC}"
read

echo ""
echo -e "${BLUE}🔗 Enter your GitHub repository details:${NC}"
echo ""

# Get GitHub username
read -p "GitHub username: " GITHUB_USERNAME
if [ -z "$GITHUB_USERNAME" ]; then
    echo -e "${RED}❌ Username cannot be empty!${NC}"
    exit 1
fi

# Get repository name
read -p "Repository name (default: DCS): " REPO_NAME
REPO_NAME=${REPO_NAME:-DCS}

# Construct GitHub URL
GITHUB_URL="https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

echo ""
echo -e "${GREEN}✅ Repository URL: ${GITHUB_URL}${NC}"
echo ""
echo -e "${YELLOW}Proceed with push? (y/n): ${NC}"
read -p "" CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo -e "${RED}❌ Aborted.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🚀 Setting up remote and pushing...${NC}"
echo ""

# Add remote
echo -e "${YELLOW}Adding remote 'origin'...${NC}"
git remote add origin "$GITHUB_URL" 2>/dev/null || git remote set-url origin "$GITHUB_URL"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Remote added${NC}"
else
    echo -e "${RED}❌ Failed to add remote${NC}"
    exit 1
fi

# Push to GitHub
echo ""
echo -e "${YELLOW}Pushing to GitHub (main branch)...${NC}"
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    ✅ SUCCESS! PUSHED TO GITHUB                          ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}📂 Your repository:${NC}"
    echo -e "   ${BLUE}${GITHUB_URL%.git}${NC}"
    echo ""
    echo -e "${GREEN}📝 Next steps:${NC}"
    echo "   1. Visit your repository on GitHub"
    echo "   2. Copy README_GITHUB.md content to main README.md (or rename it)"
    echo "   3. Add your email and contact info to README"
    echo "   4. Add repository badges and screenshots"
    echo "   5. Update CONTRIBUTING.md if you want contributors"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT SECURITY REMINDERS:${NC}"
    echo "   - backend/.env is in .gitignore (API keys NOT pushed) ✅"
    echo "   - Verify no sensitive data in public repository"
    echo "   - Review GitHub > Settings > Secrets for CI/CD"
    echo ""
    echo -e "${GREEN}🎉 Happy coding!${NC}"
else
    echo ""
    echo -e "${RED}❌ Failed to push to GitHub${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "1. Check you've created the repository on GitHub"
    echo "2. Verify your GitHub authentication:"
    echo "   - Personal Access Token (recommended)"
    echo "   - SSH keys configured"
    echo "3. Try manual push:"
    echo "   git remote add origin $GITHUB_URL"
    echo "   git push -u origin main"
    echo ""
    exit 1
fi
