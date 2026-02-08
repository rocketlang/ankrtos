#!/bin/bash

echo "🚀 Starting HumanProof MVP..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if node_modules exist
if [ ! -d "backend/node_modules" ]; then
  echo "📦 Installing backend dependencies..."
  cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  cd frontend && npm install && cd ..
fi

# Initialize database
echo "🗄️  Initializing database..."
cd backend && npm run migrate && cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Starting servers..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📡 Backend: http://localhost:3001"
echo "🌐 Frontend: http://localhost:5173"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Start backend and frontend concurrently
cd backend && npm run dev &
BACKEND_PID=$!

cd frontend && npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
