#!/bin/bash

# Pratham TeleHub POC - Quick Start Script
# Starts both backend and frontend in background

echo "🚀 Starting Pratham TeleHub POC..."
echo ""

# Kill any existing processes on these ports
lsof -ti:3100 | xargs kill -9 2>/dev/null || true
lsof -ti:3101 | xargs kill -9 2>/dev/null || true

# Start backend
echo "📡 Starting backend server (port 3100)..."
cd backend
node index.js > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend server (port 3101)..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 5

echo ""
echo "✅ POC Demo is running!"
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║            🎯 Pratham TeleHub POC Demo               ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "📊 URLs:"
echo "  • Frontend:  http://localhost:3101"
echo "  • Backend:   http://localhost:3100"
echo "  • WebSocket: ws://localhost:3100/ws"
echo ""
echo "📝 Logs:"
echo "  • Backend:  tail -f /root/pratham-telehub-poc/backend.log"
echo "  • Frontend: tail -f /root/pratham-telehub-poc/frontend.log"
echo ""
echo "🛑 To stop:"
echo "  • kill $BACKEND_PID $FRONTEND_PID"
echo "  • Or run: ./stop.sh"
echo ""
echo "👥 Demo Users:"
echo "  • Telecaller: Priya Sharma"
echo "  • Manager: Vikram Desai"
echo ""
echo "💡 Features to Demo:"
echo "  ✅ Real-time AI call assistant"
echo "  ✅ Live team dashboard"
echo "  ✅ Sentiment analysis"
echo "  ✅ Lead management"
echo "  ✅ Performance tracking"
echo ""

# Save PIDs for stop script
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid
