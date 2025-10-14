#!/bin/bash

################################################################################
# DCS App Launch Script
# Starts both frontend and backend servers
################################################################################

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# App directory
APP_DIR="/Users/ramihatoum/Desktop/app/DCS"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           DCS App Launcher - Starting Servers...                 ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check if port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}  Killing existing process on port $port (PID: $pid)${NC}"
        kill -9 $pid 2>/dev/null || true
        sleep 1
    fi
}

# Clean up any existing processes
echo -e "${YELLOW}🧹 Cleaning up existing processes...${NC}"
kill_port 3001
kill_port 5173
echo ""

# Start Backend Server
echo -e "${GREEN}🚀 Starting Backend Proxy Server (port 3001)...${NC}"
cd "$APP_DIR/backend"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: backend/.env file not found!${NC}"
    echo -e "${YELLOW}   Create it from .env.example and add your API keys.${NC}"
    exit 1
fi

# Start backend in background
nohup node server.js > backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}  ✅ Backend started (PID: $BACKEND_PID)${NC}"
echo ""

# Wait for backend to be ready
echo -e "${BLUE}⏳ Waiting for backend to be ready...${NC}"
sleep 2

# Check backend health
HEALTH_CHECK=$(curl -s http://localhost:3001/health 2>/dev/null || echo "failed")
if [[ $HEALTH_CHECK == *"healthy"* ]]; then
    echo -e "${GREEN}  ✅ Backend is healthy!${NC}"
else
    echo -e "${RED}  ❌ Backend health check failed!${NC}"
    exit 1
fi
echo ""

# Start Frontend Server
echo -e "${GREEN}🚀 Starting Frontend Server (port 5173)...${NC}"
cd "$APP_DIR"

# Start frontend in background
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}  ✅ Frontend started (PID: $FRONTEND_PID)${NC}"
echo ""

# Wait for frontend to be ready
echo -e "${BLUE}⏳ Waiting for frontend to be ready...${NC}"
sleep 3

# Check if frontend is serving
if check_port 5173; then
    echo -e "${GREEN}  ✅ Frontend is running!${NC}"
else
    echo -e "${RED}  ❌ Frontend failed to start!${NC}"
    exit 1
fi
echo ""

# Summary
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    ✅ ALL SYSTEMS READY!                         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📡 Servers Running:${NC}"
echo -e "   Frontend:  ${BLUE}http://localhost:5173${NC}  (PID: $FRONTEND_PID)"
echo -e "   Backend:   ${BLUE}http://localhost:3001${NC}  (PID: $BACKEND_PID)"
echo ""
echo -e "${GREEN}🏥 Health Check:${NC}"
curl -s http://localhost:3001/health | python3 -c "import sys, json; data=json.load(sys.stdin); print(f\"   Status: {data['status']}\\n   Services: Anthropic={'✅' if data['services']['anthropic'] else '❌'} OpenAI={'✅' if data['services']['openai'] else '❌'} Gemini={'✅' if data['services']['gemini'] else '❌'}\")"
echo ""
echo -e "${GREEN}📂 Logs:${NC}"
echo -e "   Backend:   ${BLUE}$APP_DIR/backend/backend.log${NC}"
echo -e "   Frontend:  ${BLUE}$APP_DIR/frontend.log${NC}"
echo ""
echo -e "${YELLOW}🌐 Opening app in browser...${NC}"
sleep 2
open http://localhost:5173
echo ""
echo -e "${GREEN}✨ App is ready to use!${NC}"
echo ""
echo -e "${YELLOW}To stop servers:${NC}"
echo -e "   kill $BACKEND_PID $FRONTEND_PID"
echo -e "   ${YELLOW}or${NC}"
echo -e "   pkill -f 'node server.js'"
echo -e "   pkill -f 'vite'"
echo ""
