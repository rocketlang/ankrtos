#!/bin/bash

# Doctor Booking AI Demo - Startup Script

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║       🏥 Doctor Booking AI Voice Agent - Setup              ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Create database schema
echo "📊 Setting up database..."
PGPASSWORD="indrA@0612" psql -U ankr -d ankr_eon -f database/schema.sql 2>/dev/null
if [ $? -eq 0 ]; then
  echo "✅ Database schema created"
else
  echo "⚠️  Database schema may already exist (this is OK)"
fi
echo ""

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
  npm install --silent
  echo "✅ Dependencies installed"
else
  echo "✅ Dependencies already installed"
fi
echo ""

# Step 3: Copy env file if it doesn't exist
if [ ! -f "../.env" ]; then
  cp ../.env.example ../.env
  echo "✅ Created .env file (you can edit it for MSG91/Plivo keys)"
else
  echo "✅ .env file exists"
fi
echo ""

# Step 4: Start server
echo "🚀 Starting server..."
echo ""
node server.js
