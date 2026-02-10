#!/bin/bash

# Stop Pratham TeleHub POC

echo "🛑 Stopping Pratham TeleHub POC..."

# Kill saved PIDs
if [ -f .backend.pid ]; then
  kill $(cat .backend.pid) 2>/dev/null || true
  rm .backend.pid
fi

if [ -f .frontend.pid ]; then
  kill $(cat .frontend.pid) 2>/dev/null || true
  rm .frontend.pid
fi

# Kill by port (backup method)
lsof -ti:3100 | xargs kill -9 2>/dev/null || true
lsof -ti:3101 | xargs kill -9 2>/dev/null || true

echo "✅ Stopped all services"
