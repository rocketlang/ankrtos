#!/bin/bash
cd /root/apps/ankr-maritime/backend

# Kill existing
pkill -9 -f "ankr-maritime.*main.ts"
sleep 3

# Start fresh
npx tsx src/main.ts 2>&1 | tee /tmp/mari8x-backend.log &

echo "Backend restarting... PID: $!"
sleep 5
echo "Checking status..."
curl -s http://localhost:4051/health
