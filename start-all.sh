#!/bin/bash

# Discharge Summary Generator - Dual Server Startup Script
# Starts both backend proxy and frontend dev server

set -e

PROJECT_DIR="/Users/ramihatoum/Desktop/app/DCS"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Discharge Summary Generator - Dual Server Startup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if .env exists
if [ ! -f "$PROJECT_DIR/backend/.env" ]; then
    echo "⚠️  WARNING: backend/.env not found!"
    echo ""
    echo "Please create it from the template:"
    echo "  cd backend"
    echo "  cp .env.example .env"
    echo "  # Then edit .env and add your API keys"
    echo ""
    read -p "Continue anyway? (y/N): " continue
    if [ "$continue" != "y" ] && [ "$continue" != "Y" ]; then
        echo "Exiting..."
        exit 1
    fi
fi

echo "🧹 Cleaning up old processes..."
# Kill any existing Vite processes
pkill -f "vite" 2>/dev/null || true

# Kill any existing node processes on port 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

sleep 1

echo "✅ Cleanup complete"
echo ""

# Start backend proxy server
echo "🚀 Starting backend proxy server..."
cd "$PROJECT_DIR/backend"
npm start > /tmp/dcs-backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
for i in {1..20}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Backend proxy ready on port 3001"
        break
    fi
    sleep 0.5
done

# Check if backend actually started
if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "❌ Backend proxy failed to start!"
    echo "Check logs: tail -f /tmp/dcs-backend.log"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "🚀 Starting frontend dev server..."
cd "$PROJECT_DIR"

# Start frontend (this will keep running in foreground)
npm run dev &
FRONTEND_PID=$!

# Wait for frontend
echo "⏳ Waiting for frontend to start..."
for i in {1..20}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "✅ Frontend ready on port 5173"
        break
    fi
    sleep 0.5
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Both servers are running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  🔹 Backend Proxy:  http://localhost:3001"
echo "  🔹 Frontend App:   http://localhost:5173"
echo ""
echo "  📊 Backend logs:   tail -f /tmp/dcs-backend.log"
echo "  📊 Frontend logs:  (shown below)"
echo ""
echo "  Backend PID: $BACKEND_PID"
echo "  Frontend PID: $FRONTEND_PID"
echo ""
echo "  Press Ctrl+C to stop both servers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "✅ Servers stopped"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT TERM

# Wait for frontend process (keeps script running)
wait $FRONTEND_PID
