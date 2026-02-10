#!/bin/bash

# Pratham TeleHub POC - Quick Setup Script
# This script sets up and runs the complete demo

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║        Pratham TeleHub POC - Setup Script           ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Database Setup
echo "📦 Step 1: Setting up database..."
PGPASSWORD="indrA@0612" psql -U ankr -d ankr_eon -f database/schema.sql > /dev/null 2>&1
echo "✅ Database schema created"

echo "📦 Step 2: Loading sample data..."
PGPASSWORD="indrA@0612" psql -U ankr -d ankr_eon -f database/seed.sql > /dev/null 2>&1
echo "✅ Sample data loaded"

# Step 2: Backend Setup
echo "📦 Step 3: Installing backend dependencies..."
cd backend
npm install > /dev/null 2>&1
echo "✅ Backend dependencies installed"
cd ..

# Step 3: Frontend Setup
echo "📦 Step 4: Installing frontend dependencies..."
cd frontend
npm install > /dev/null 2>&1
echo "✅ Frontend dependencies installed"
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║              🚀 READY TO LAUNCH POC!                   ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "To start the POC demo:"
echo ""
echo "  Terminal 1 (Backend):"
echo "  cd /root/pratham-telehub-poc/backend"
echo "  npm start"
echo ""
echo "  Terminal 2 (Frontend):"
echo "  cd /root/pratham-telehub-poc/frontend"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:3101"
echo ""
echo "Or use the quick start script:"
echo "  ./start.sh"
echo ""
