#!/bin/bash

echo "🧹 MARI8X - Clean Start Script"
echo "================================"
echo ""

# 1. Kill ALL running backends
echo "1️⃣ Stopping all backend processes..."
pkill -9 -f "tsx.*maritime.*main"
pkill -9 -f "node.*maritime.*backend"
sleep 2
echo "   ✅ All backends stopped"
echo ""

# 2. Clear logs
echo "2️⃣ Clearing old logs..."
rm -f /tmp/mari8x-*.log /tmp/backend-*.log
echo "   ✅ Logs cleared"
echo ""

# 3. Start backend
echo "3️⃣ Starting backend (single instance)..."
cd /root/apps/ankr-maritime/backend
nohup npm run dev > /tmp/mari8x-backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
echo ""

# 4. Wait for backend
echo "4️⃣ Waiting for backend to start (15 seconds)..."
sleep 15
echo ""

# 5. Test GraphQL
echo "5️⃣ Testing GraphQL endpoint..."
RESPONSE=$(curl -s http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}')

if echo "$RESPONSE" | grep -q "Query"; then
  echo "   ✅ GraphQL is READY!"
  echo ""
  echo "6️⃣ Testing Fun Facts..."
  curl -s http://localhost:4000/graphql \
    -H "Content-Type: application/json" \
    -d '{"query":"{ aisFunFacts { dataScale { totalPositions } lastUpdated } }"}' \
    | python3 -c "import sys, json; d=json.load(sys.stdin); print('   ✅ Fun Facts Working!' if d.get('data') else '   ❌ Fun Facts Not Loaded')"
  echo ""
  echo "================================"
  echo "✅ MARI8X BACKEND IS READY!"
  echo ""
  echo "📡 GraphQL Playground: http://localhost:4000/graphql"
  echo "📊 Test Query:"
  echo "   query { aisFunFacts { dataScale { totalPositions uniqueVessels } } }"
  echo ""
else
  echo "   ❌ GraphQL not responding"
  echo "   Check logs: tail -f /tmp/mari8x-backend.log"
fi
