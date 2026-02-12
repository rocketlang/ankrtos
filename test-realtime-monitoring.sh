#!/bin/bash

# Test Real-Time Price Monitoring
# © 2026 Vyomo - ANKR Labs

API="http://localhost:4025/api/auto-trader"

echo "════════════════════════════════════════════════════════"
echo "   व्योमो REAL-TIME MONITORING TEST"
echo "════════════════════════════════════════════════════════"
echo ""

# Create session
echo "🌅 Creating trading session..."
SESSION=$(curl -s -X POST "$API/sessions/create" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Real-Time Monitoring Test",
    "initialCapital": 50000,
    "maxPositions": 2,
    "positionSizePercent": 30,
    "minConfidence": 70,
    "stopLossPercent": 2,
    "targetPercent": 5,
    "maxDailyLossPercent": 5
  }')

SESSION_ID=$(echo $SESSION | jq -r '.session.id')
echo "✅ Session ID: $SESSION_ID"
echo ""

# Execute a trade
echo "📊 Executing trade..."
TRADE=$(curl -s -X POST "$API/sessions/$SESSION_ID/execute-trade" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "NIFTY",
    "action": "BUY_CALL",
    "confidence": 75.0,
    "reasoning": "Testing real-time monitoring",
    "entryPrice": 250.50
  }')

if [ "$(echo $TRADE | jq -r '.success')" == "true" ]; then
  TRADE_ID=$(echo $TRADE | jq -r '.trade.id')
  SL=$(echo $TRADE | jq -r '.trade.stopLoss')
  TARGET=$(echo $TRADE | jq -r '.trade.target')

  echo "✅ Trade executed: ID=$TRADE_ID"
  echo "   Entry: ₹250.50"
  echo "   Stop Loss: ₹$SL (auto-exit when hit)"
  echo "   Target: ₹$TARGET (auto-exit when hit)"
  echo ""
  echo "🔄 Real-time monitoring is now active!"
  echo "   System checks prices every 10 seconds"
  echo "   Will auto-close if SL or target hit"
  echo ""

  # Monitor for 30 seconds
  echo "📡 Monitoring for 30 seconds..."
  for i in {1..3}; do
    sleep 10
    echo "   [Check $i] Fetching current status..."

    STATUS=$(curl -s "$API/sessions/$SESSION_ID/active-trades")
    ACTIVE_COUNT=$(echo $STATUS | jq '.trades | length')

    if [ "$ACTIVE_COUNT" -eq "0" ]; then
      echo "   ✅ Trade auto-closed!"
      break
    else
      echo "   📊 Trade still active (monitoring...)"
    fi
  done

  echo ""
  echo "═══ FINAL STATUS ═══"
  curl -s "$API/sessions/$SESSION_ID" | jq '{
    status,
    totalTrades,
    winningTrades,
    losingTrades,
    totalPnL,
    winRate
  }'

else
  echo "❌ Trade failed: $(echo $TRADE | jq -r '.reason')"
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "   🙏 Real-Time Monitoring Active!"
echo "════════════════════════════════════════════════════════"
