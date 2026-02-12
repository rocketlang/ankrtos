#!/bin/bash

# Vyomo Auto Trading - Full Day Simulation
# © 2026 ANKR Labs

API="http://localhost:4025/api/auto-trader"

echo "════════════════════════════════════════════════════════"
echo "   व्योमो AUTOMATED TRADING - FULL DAY SIMULATION"
echo "   Testing Date: 12 Feb 2026"
echo "════════════════════════════════════════════════════════"
echo ""

# Morning 9:00 AM - Start Trading Session
echo "🌅 [09:00 AM] Starting trading session..."
SESSION=$(curl -s -X POST "$API/sessions/create" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Full Day Test - 12 Feb 2026",
    "initialCapital": 100000,
    "maxPositions": 3,
    "positionSizePercent": 20,
    "minConfidence": 70,
    "stopLossPercent": 2,
    "targetPercent": 5,
    "maxDailyLossPercent": 5,
    "allowedSymbols": ["NIFTY", "BANKNIFTY"],
    "allowedStrategies": ["BUY_CALL", "BUY_PUT"]
  }')

SESSION_ID=$(echo $SESSION | jq -r '.session.id')
echo "✅ Session created: ID=$SESSION_ID"
echo "💰 Initial Capital: ₹100,000"
echo ""

sleep 2

# Trade 1: 09:30 AM - Morning rally signal
echo "📊 [09:30 AM] AI Signal received..."
echo "   Symbol: NIFTY | Action: BUY_CALL"
echo "   Confidence: 85.5% | Reasoning: Strong opening, bullish momentum"
TRADE1=$(curl -s -X POST "$API/sessions/$SESSION_ID/execute-trade" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "NIFTY",
    "action": "BUY_CALL",
    "confidence": 85.5,
    "reasoning": "Strong opening momentum. 12/13 algorithms bullish. VIX declining.",
    "entryPrice": 248.50
  }')

if [ "$(echo $TRADE1 | jq -r '.success')" == "true" ]; then
  TRADE1_ID=$(echo $TRADE1 | jq -r '.trade.id')
  QTY=$(echo $TRADE1 | jq -r '.trade.quantity')
  SL=$(echo $TRADE1 | jq -r '.trade.stopLoss')
  TARGET=$(echo $TRADE1 | jq -r '.trade.target')
  echo "✅ Trade #1 executed"
  echo "   Entry: ₹248.50 | Qty: $QTY | SL: ₹$SL | Target: ₹$TARGET"
else
  echo "❌ Trade rejected: $(echo $TRADE1 | jq -r '.reason')"
fi
echo ""

sleep 2

# 10:15 AM - Trade 1 hits target
echo "🎯 [10:15 AM] NIFTY rallies to target..."
CLOSE1=$(curl -s -X POST "$API/trades/$TRADE1_ID/close" \
  -H "Content-Type: application/json" \
  -d '{
    "exitPrice": 261.0,
    "exitReason": "TARGET_HIT"
  }')

PNL1=$(echo $CLOSE1 | jq -r '.trade.pnl')
PNL1_PCT=$(echo $CLOSE1 | jq -r '.trade.pnlPercent')
echo "✅ Trade #1 closed at target!"
echo "   P&L: ₹$PNL1 (+$PNL1_PCT%)"
echo ""

sleep 2

# Trade 2: 11:00 AM - Bank Nifty signal
echo "📊 [11:00 AM] AI Signal received..."
echo "   Symbol: BANKNIFTY | Action: BUY_PUT"
echo "   Confidence: 78.2% | Reasoning: Banking sector weakness"
TRADE2=$(curl -s -X POST "$API/sessions/$SESSION_ID/execute-trade" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BANKNIFTY",
    "action": "BUY_PUT",
    "confidence": 78.2,
    "reasoning": "Banking sector showing weakness. Risk-off sentiment. 10/13 algorithms bearish.",
    "entryPrice": 182.75
  }')

if [ "$(echo $TRADE2 | jq -r '.success')" == "true" ]; then
  TRADE2_ID=$(echo $TRADE2 | jq -r '.trade.id')
  QTY2=$(echo $TRADE2 | jq -r '.trade.quantity')
  SL2=$(echo $TRADE2 | jq -r '.trade.stopLoss')
  TARGET2=$(echo $TRADE2 | jq -r '.trade.target')
  echo "✅ Trade #2 executed"
  echo "   Entry: ₹182.75 | Qty: $QTY2 | SL: ₹$SL2 | Target: ₹$TARGET2"
else
  echo "❌ Trade rejected: $(echo $TRADE2 | jq -r '.reason')"
fi
echo ""

sleep 2

# 12:00 PM - Trade 2 hits target
echo "🎯 [12:00 PM] BANKNIFTY PUT reaches target..."
CLOSE2=$(curl -s -X POST "$API/trades/$TRADE2_ID/close" \
  -H "Content-Type: application/json" \
  -d '{
    "exitPrice": 191.90,
    "exitReason": "TARGET_HIT"
  }')

PNL2=$(echo $CLOSE2 | jq -r '.trade.pnl')
PNL2_PCT=$(echo $CLOSE2 | jq -r '.trade.pnlPercent')
echo "✅ Trade #2 closed at target!"
echo "   P&L: ₹$PNL2 (+$PNL2_PCT%)"
echo ""

sleep 2

# Trade 3: 01:30 PM - Afternoon signal
echo "📊 [01:30 PM] AI Signal received..."
echo "   Symbol: NIFTY | Action: BUY_CALL"
echo "   Confidence: 72.8% | Reasoning: Post-lunch recovery"
TRADE3=$(curl -s -X POST "$API/sessions/$SESSION_ID/execute-trade" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "NIFTY",
    "action": "BUY_CALL",
    "confidence": 72.8,
    "reasoning": "Post-lunch recovery visible. Global markets positive. 9/13 algorithms bullish.",
    "entryPrice": 255.25
  }')

if [ "$(echo $TRADE3 | jq -r '.success')" == "true" ]; then
  TRADE3_ID=$(echo $TRADE3 | jq -r '.trade.id')
  QTY3=$(echo $TRADE3 | jq -r '.trade.quantity')
  SL3=$(echo $TRADE3 | jq -r '.trade.stopLoss')
  TARGET3=$(echo $TRADE3 | jq -r '.trade.target')
  echo "✅ Trade #3 executed"
  echo "   Entry: ₹255.25 | Qty: $QTY3 | SL: ₹$SL3 | Target: ₹$TARGET3"
else
  echo "❌ Trade rejected: $(echo $TRADE3 | jq -r '.reason')"
fi
echo ""

sleep 2

# 02:15 PM - Trade 3 hits stop loss
echo "⚠️  [02:15 PM] NIFTY reverses, stop loss triggered..."
CLOSE3=$(curl -s -X POST "$API/trades/$TRADE3_ID/close" \
  -H "Content-Type: application/json" \
  -d '{
    "exitPrice": 250.15,
    "exitReason": "STOP_LOSS"
  }')

PNL3=$(echo $CLOSE3 | jq -r '.trade.pnl')
PNL3_PCT=$(echo $CLOSE3 | jq -r '.trade.pnlPercent')
echo "🛑 Trade #3 closed at stop loss"
echo "   P&L: ₹$PNL3 ($PNL3_PCT%)"
echo ""

sleep 2

# Trade 4: 02:45 PM - Late afternoon signal
echo "📊 [02:45 PM] AI Signal received..."
echo "   Symbol: BANKNIFTY | Action: BUY_CALL"
echo "   Confidence: 81.3% | Reasoning: Banking sector bounce"
TRADE4=$(curl -s -X POST "$API/sessions/$SESSION_ID/execute-trade" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BANKNIFTY",
    "action": "BUY_CALL",
    "confidence": 81.3,
    "reasoning": "Banking sector bouncing back. Strong buying in PSU banks. 11/13 algorithms bullish.",
    "entryPrice": 178.50
  }')

if [ "$(echo $TRADE4 | jq -r '.success')" == "true" ]; then
  TRADE4_ID=$(echo $TRADE4 | jq -r '.trade.id')
  QTY4=$(echo $TRADE4 | jq -r '.trade.quantity')
  SL4=$(echo $TRADE4 | jq -r '.trade.stopLoss')
  TARGET4=$(echo $TRADE4 | jq -r '.trade.target')
  echo "✅ Trade #4 executed"
  echo "   Entry: ₹178.50 | Qty: $QTY4 | SL: ₹$SL4 | Target: ₹$TARGET4"
else
  echo "❌ Trade rejected: $(echo $TRADE4 | jq -r '.reason')"
fi
echo ""

sleep 2

# 03:20 PM - Trade 4 hits target
echo "🎯 [03:20 PM] BANKNIFTY CALL reaches target..."
CLOSE4=$(curl -s -X POST "$API/trades/$TRADE4_ID/close" \
  -H "Content-Type: application/json" \
  -d '{
    "exitPrice": 187.45,
    "exitReason": "TARGET_HIT"
  }')

PNL4=$(echo $CLOSE4 | jq -r '.trade.pnl')
PNL4_PCT=$(echo $CLOSE4 | jq -r '.trade.pnlPercent')
echo "✅ Trade #4 closed at target!"
echo "   P&L: ₹$PNL4 (+$PNL4_PCT%)"
echo ""

sleep 2

# 03:30 PM - Market close, get final stats
echo "🌆 [03:30 PM] Market closing, stopping session..."
curl -s -X POST "$API/sessions/$SESSION_ID/stop" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Market close"}'

echo "✅ Session stopped"
echo ""

sleep 2

# Final Report
echo "════════════════════════════════════════════════════════"
echo "   📊 FULL DAY TRADING REPORT"
echo "════════════════════════════════════════════════════════"

FINAL=$(curl -s "$API/sessions/$SESSION_ID")

echo ""
echo "Session: $(echo $FINAL | jq -r '.name')"
echo "Status: $(echo $FINAL | jq -r '.status')"
echo ""
echo "💰 CAPITAL:"
echo "   Initial:  ₹$(echo $FINAL | jq -r '.initialCapital' | xargs printf "%'.2f")"
echo "   Final:    ₹$(echo $FINAL | jq -r '.currentCapital' | xargs printf "%'.2f")"
echo ""
echo "📈 PERFORMANCE:"
echo "   Total P&L:     ₹$(echo $FINAL | jq -r '.totalPnL' | xargs printf "%'.2f")"
echo "   Return:        $(echo $FINAL | jq -r '.totalPnL' | awk '{printf "%.2f%%", ($1/100000)*100}')"
echo "   Total Trades:  $(echo $FINAL | jq -r '.totalTrades')"
echo "   Winning:       $(echo $FINAL | jq -r '.winningTrades') ✅"
echo "   Losing:        $(echo $FINAL | jq -r '.losingTrades') ❌"
echo "   Win Rate:      $(echo $FINAL | jq -r '.winRate' | xargs printf "%.1f")%"
echo ""

# Get trade history
echo "📋 TRADE HISTORY:"
HISTORY=$(curl -s "$API/sessions/$SESSION_ID/trade-history?limit=10")
echo "$HISTORY" | jq -r '.trades[] | "   [\(.id)] \(.symbol) \(.tradeType) | Entry: ₹\(.entryPrice) → Exit: ₹\(.exitPrice // "OPEN") | P&L: ₹\(.pnl // 0) | \(.exitReason // "OPEN")"'

echo ""
echo "════════════════════════════════════════════════════════"
echo "   🙏 श्री गणेशाय नमः | जय गुरुजी"
echo "════════════════════════════════════════════════════════"
