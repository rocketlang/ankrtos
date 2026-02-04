#!/bin/bash
# Restart ANKR Interact with new Pratham Tour components

echo "🔄 Restarting ANKR Interact..."

# Kill existing Vite process
pkill -f "vite.*5173"
sleep 2

# Go to source directory
cd /root/ankr-labs-nx/packages/ankr-interact || exit 1

# Start Vite dev server
echo "🚀 Starting Vite dev server..."
nohup npm run dev:client > /root/ankr-interact-vite.log 2>&1 &

# Wait for startup
sleep 5

# Check if running
if pgrep -f "vite.*5173" > /dev/null; then
  echo "✅ ANKR Interact running on https://ankrlms.ankr.in"
  echo "📊 Logs: tail -f /root/ankr-interact-vite.log"
else
  echo "❌ Failed to start. Check logs: tail -f /root/ankr-interact-vite.log"
  exit 1
fi
