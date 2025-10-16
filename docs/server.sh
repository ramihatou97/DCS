#!/bin/bash

# Discharge Summary Generator - Server Manager
# Ensures clean start/stop of Vite dev server

# Use script location as project directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="${SCRIPT_DIR}"
PORT=5173

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Discharge Summary Generator - Server Manager${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Function to kill all Vite processes
kill_vite_processes() {
    echo -e "${YELLOW}🔍 Checking for existing Vite processes...${NC}"
    
    # Find all Vite processes
    VITE_PIDS=$(ps aux | grep -i vite | grep -v grep | awk '{print $2}')
    
    if [ -z "$VITE_PIDS" ]; then
        echo -e "${GREEN}✓ No existing Vite processes found${NC}"
        return 0
    fi
    
    echo -e "${RED}⚠ Found zombie Vite processes:${NC}"
    ps aux | grep -i vite | grep -v grep | awk '{printf "  PID: %s (Port: %s)\n", $2, $11}'
    
    echo -e "${YELLOW}🧹 Killing zombie processes...${NC}"
    echo "$VITE_PIDS" | while read pid; do
        kill -9 "$pid" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}  ✓ Killed process $pid${NC}"
        fi
    done
    
    # Double check - kill by port if needed
    PORT_PIDS=$(lsof -ti:5173,5174,5175,5176,5177 2>/dev/null)
    if [ -n "$PORT_PIDS" ]; then
        echo -e "${YELLOW}🔧 Cleaning up port occupants...${NC}"
        echo "$PORT_PIDS" | while read pid; do
            kill -9 "$pid" 2>/dev/null
            echo -e "${GREEN}  ✓ Freed port from PID $pid${NC}"
        done
    fi
    
    sleep 1
    echo -e "${GREEN}✓ All zombie processes eliminated${NC}"
}

# Function to check if server is running
check_server() {
    if lsof -ti:$PORT >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to start server
start_server() {
    echo -e "\n${YELLOW}🚀 Starting Vite dev server...${NC}"
    cd "$PROJECT_DIR" || { echo -e "${RED}✗ Failed to change directory to $PROJECT_DIR${NC}"; exit 1; }
    
    # Start server in background with proper signal handling
    npm run dev &
    SERVER_PID=$!
    
    # Wait for server to start (max 10 seconds)
    echo -e "${YELLOW}⏳ Waiting for server to start...${NC}"
    for _ in {1..20}; do
        sleep 0.5
        if check_server; then
            echo -e "${GREEN}✓ Server started successfully!${NC}"
            echo -e "${GREEN}  URL: http://localhost:$PORT/${NC}"
            echo -e "${GREEN}  PID: $SERVER_PID${NC}"
            echo ""
            echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo -e "${GREEN}✓ Server is ready! Open http://localhost:$PORT/ in your browser${NC}"
            echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            return 0
        fi
        echo -n "."
    done
    
    echo -e "\n${RED}✗ Server failed to start${NC}"
    return 1
}

# Function to stop server
stop_server() {
    echo -e "${YELLOW}🛑 Stopping Vite dev server...${NC}"
    kill_vite_processes
    echo -e "${GREEN}✓ Server stopped${NC}"
}

# Function to restart server
restart_server() {
    echo -e "${BLUE}🔄 Restarting server...${NC}"
    stop_server
    sleep 2
    start_server
}

# Function to show status
show_status() {
    echo -e "${BLUE}📊 Server Status:${NC}"
    if check_server; then
        echo -e "${GREEN}✓ Server is RUNNING on http://localhost:$PORT/${NC}"
        echo -e "\n${YELLOW}Active processes:${NC}"
        ps aux | grep -i vite | grep -v grep | awk '{printf "  PID: %s, CPU: %s%%, Mem: %s%%\n", $2, $3, $4}'
    else
        echo -e "${RED}✗ Server is NOT running${NC}"
        
        # Check for zombie processes
        ZOMBIES=$(ps aux | grep -i vite | grep -v grep | wc -l | tr -d ' ')
        if [ "$ZOMBIES" -gt 0 ]; then
            echo -e "${RED}⚠ Warning: Found $ZOMBIES zombie Vite process(es)${NC}"
            echo -e "${YELLOW}  Run './server.sh clean' to remove them${NC}"
        fi
    fi
}

# Main command handler
case "$1" in
    start)
        kill_vite_processes
        start_server
        ;;
    stop)
        stop_server
        ;;
    restart)
        restart_server
        ;;
    clean)
        kill_vite_processes
        ;;
    status)
        show_status
        ;;
    *)
        echo -e "${YELLOW}Usage:${NC}"
        echo -e "  ${GREEN}./server.sh start${NC}   - Clean start (kills zombies, starts fresh)"
        echo -e "  ${GREEN}./server.sh stop${NC}    - Stop all Vite processes"
        echo -e "  ${GREEN}./server.sh restart${NC} - Restart server cleanly"
        echo -e "  ${GREEN}./server.sh clean${NC}   - Kill zombie processes only"
        echo -e "  ${GREEN}./server.sh status${NC}  - Check server status"
        echo ""
        echo -e "${BLUE}Quick Start:${NC}"
        echo -e "  ${GREEN}./server.sh start${NC}"
        exit 1
        ;;
esac
