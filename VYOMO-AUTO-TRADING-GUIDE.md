# Vyomo Automated Trading Engine Guide
**© 2026 ANKR Labs**

## Overview

The Vyomo Automated Trading Engine is a fully-featured system that automatically executes trades based on AI signals with comprehensive risk management.

## ✅ What's Built

### 1. **Trading Sessions**
Start a trading session with:
- Initial capital (e.g., ₹100,000)
- Max concurrent positions (e.g., 3-5)
- Position size (e.g., 20% per trade)
- Stop loss % (e.g., 2%)
- Target % (e.g., 5%)
- Daily loss limit (e.g., 5% circuit breaker)
- Symbol whitelist (e.g., NIFTY, BANKNIFTY)
- Strategy filters (e.g., BUY_CALL, BUY_PUT)

### 2. **Risk Management**
- **Position Sizing**: Auto-calculates quantity based on capital %
- **Stop Loss**: Automatic exit when loss threshold hit
- **Target**: Automatic exit when profit target hit
- **Circuit Breaker**: Stops all trading if daily loss limit reached
- **Max Positions**: Limits concurrent open trades
- **Capital Protection**: Ensures sufficient capital before each trade

### 3. **Trade Execution**
- Validates AI signal confidence (min threshold)
- Calculates position size and quantity
- Sets stop loss and target levels
- Executes trade and tracks in real-time
- Auto-closes on SL/target hit
- Updates session P&L and statistics

### 4. **Monitoring & Control**
- Real-time position tracking
- Session pause/resume/stop
- Manual trade closure
- Trade history and audit logs
- Performance statistics (win rate, P&L)

## 🚀 Quick Start

### REST API Example

**1. Create Trading Session**
```bash
curl -X POST http://localhost:4025/api/auto-trader/sessions/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Auto Trading",
    "initialCapital": 100000,
    "maxPositions": 3,
    "positionSizePercent": 20,
    "minConfidence": 70,
    "stopLossPercent": 2,
    "targetPercent": 5,
    "maxDailyLossPercent": 5,
    "allowedSymbols": ["NIFTY", "BANKNIFTY"],
    "allowedStrategies": ["BUY_CALL", "BUY_PUT"]
  }'
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": 1,
    "userId": "default_user",
    "name": "My Auto Trading",
    "initialCapital": 100000,
    "currentCapital": 100000,
    "status": "ACTIVE",
    ...
  }
}
```

**2. Execute Trade (AI Signal)**
```bash
curl -X POST http://localhost:4025/api/auto-trader/sessions/1/execute-trade \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "NIFTY",
    "action": "BUY_CALL",
    "confidence": 85.5,
    "reasoning": "Strong bullish momentum. Adaptive AI consensus 12/13.",
    "entryPrice": 250.50
  }'
```

**Response:**
```json
{
  "success": true,
  "trade": {
    "id": 1,
    "symbol": "NIFTY",
    "tradeType": "BUY_CALL",
    "quantity": 79,
    "entryPrice": 250.5,
    "stopLoss": 245.49,
    "target": 263.03,
    "positionSizeAmount": 19789.5,
    "aiConfidence": 85.5,
    "status": "OPEN"
  }
}
```

**3. Check Active Trades**
```bash
curl http://localhost:4025/api/auto-trader/sessions/1/active-trades
```

**4. Close Trade Manually**
```bash
curl -X POST http://localhost:4025/api/auto-trader/trades/1/close \
  -H "Content-Type: application/json" \
  -d '{
    "exitPrice": 263.03,
    "exitReason": "TARGET_HIT"
  }'
```

**5. Pause/Resume/Stop Session**
```bash
# Pause
curl -X POST http://localhost:4025/api/auto-trader/sessions/1/pause

# Resume
curl -X POST http://localhost:4025/api/auto-trader/sessions/1/resume

# Stop (closes all positions)
curl -X POST http://localhost:4025/api/auto-trader/sessions/1/stop
```

### GraphQL Example

```graphql
# Create session
mutation {
  createTradingSession(input: {
    name: "My Auto Trading"
    initialCapital: 100000
    maxPositions: 3
    positionSizePercent: 20
    minConfidence: 70
    stopLossPercent: 2
    targetPercent: 5
    maxDailyLossPercent: 5
    allowedSymbols: ["NIFTY", "BANKNIFTY"]
  }) {
    id
    name
    status
    currentCapital
  }
}

# Execute trade
mutation {
  executeTrade(
    sessionId: 1
    signal: {
      symbol: "NIFTY"
      action: "BUY_CALL"
      confidence: 85.5
      reasoning: "Strong bullish momentum"
      entryPrice: 250.50
    }
  ) {
    success
    trade {
      id
      symbol
      quantity
      entryPrice
      stopLoss
      target
      status
    }
    reason
  }
}

# Get session details
query {
  tradingSession(id: 1) {
    name
    currentCapital
    totalTrades
    winningTrades
    winRate
    totalPnL
    todayPnL
    status
  }
}

# Get active trades
query {
  activeTrades(sessionId: 1) {
    symbol
    tradeType
    quantity
    entryPrice
    stopLoss
    target
    pnl
    status
  }
}
```

## 📊 Real Test Results

**Session Created:** ₹100,000 capital
**Trade Executed:** BUY NIFTY CALL @ ₹250.50
- Quantity: 79 (20% position size)
- Stop Loss: ₹245.49 (2% below)
- Target: ₹263.03 (5% above)

**Trade Closed at Target:**
- Exit Price: ₹263.03
- P&L: **+₹989.87** ✅
- P&L %: **+5.002%** ✅
- Win Rate: **100%** (1W-0L)

## 🔒 Safety Features

1. **Circuit Breaker**: Auto-stops if daily loss > 5% (configurable)
2. **Position Limits**: Max 3-5 concurrent positions
3. **Capital Protection**: Won't trade if insufficient capital
4. **Confidence Filter**: Only trades signals with confidence > 70%
5. **Symbol Whitelist**: Only trades approved symbols
6. **Audit Trail**: Every event logged in database
7. **Manual Override**: Pause/stop anytime

## 🎯 Current Phase: **Notional Trading**

The system currently uses:
- ✅ Virtual/paper capital (safe for testing)
- ✅ Real AI signals
- ✅ Real position sizing calculations
- ✅ Real stop loss/target logic
- ✅ Real P&L tracking

## 🚀 Next Phase: **Broker Integration**

To connect to real brokers (Zerodha, Angel, etc.):
1. Add broker API integration
2. Real-time market data feed
3. Actual order placement
4. Live position monitoring

## 💡 Usage Patterns

### Pattern 1: Start-of-Day Auto Trading
```javascript
// Morning: Start session
const session = await createTradingSession({
  name: "NIFTY Day Trading",
  initialCapital: 50000,
  maxPositions: 2,
  positionSizePercent: 30,
  stopLossPercent: 1.5,
  targetPercent: 3,
  maxDailyLossPercent: 3
})

// System auto-trades based on AI signals throughout the day
// Auto-stops if daily loss > 3%
// Auto-exits positions at SL/target

// Evening: Stop session (closes all positions)
await stopTradingSession(session.id)
```

### Pattern 2: Strategy-Specific Session
```javascript
// Only trade Iron Condors on BANKNIFTY
const session = await createTradingSession({
  name: "BANKNIFTY Iron Condor",
  initialCapital: 100000,
  minConfidence: 80,
  allowedSymbols: ["BANKNIFTY"],
  allowedStrategies: ["IRON_CONDOR"]
})
```

### Pattern 3: Conservative Risk
```javascript
// Low risk, high confidence only
const session = await createTradingSession({
  name: "Conservative Trading",
  initialCapital: 200000,
  maxPositions: 2,
  positionSizePercent: 10,  // Only 10% per trade
  stopLossPercent: 1,       // Tight stop loss
  targetPercent: 2,         // Modest target
  maxDailyLossPercent: 2,   // Stop if down 2%
  minConfidence: 85         // High confidence signals only
})
```

## 📈 Integration with Vyomo AI

The auto-trader works seamlessly with Vyomo's Adaptive AI:

```javascript
// 1. Vyomo AI generates signal
const aiSignal = await vyomoAdaptiveAI.analyze("NIFTY")
// Result: BUY confidence 85%, reasoning: "12/13 algorithms bullish"

// 2. Auto-trader validates and executes
if (aiSignal.confidence >= session.minConfidence) {
  const result = await executeTrade(session.id, {
    symbol: aiSignal.symbol,
    action: aiSignal.action,
    confidence: aiSignal.confidence,
    reasoning: aiSignal.reasoning,
    entryPrice: currentMarketPrice
  })

  // 3. System monitors and auto-exits at SL/target
}
```

## 🎓 Best Practices

1. **Start Small**: Begin with ₹50,000-₹100,000 notional capital
2. **Test First**: Run for a week in paper trading mode
3. **Set Conservative Limits**: Max 5% daily loss, 2% stop loss
4. **Review Daily**: Check trade logs and adjust parameters
5. **Gradual Increase**: Increase capital only after consistent wins
6. **Monitor Circuit Breakers**: If triggered often, reduce risk %

## 📊 API Endpoints Summary

### REST API
- `POST /api/auto-trader/sessions/create` - Create session
- `GET /api/auto-trader/sessions/:id` - Get session
- `GET /api/auto-trader/sessions` - List sessions
- `POST /api/auto-trader/sessions/:id/pause` - Pause
- `POST /api/auto-trader/sessions/:id/resume` - Resume
- `POST /api/auto-trader/sessions/:id/stop` - Stop
- `POST /api/auto-trader/sessions/:id/execute-trade` - Execute
- `POST /api/auto-trader/trades/:id/close` - Close trade
- `GET /api/auto-trader/sessions/:id/active-trades` - Get active
- `GET /api/auto-trader/sessions/:id/trade-history` - Get history
- `POST /api/auto-trader/sessions/:id/circuit-breaker/reset` - Reset breaker

### GraphQL
- **Queries**: `tradingSession`, `tradingSessions`, `activeTrades`, `tradeHistory`
- **Mutations**: `createTradingSession`, `pauseTradingSession`, `resumeTradingSession`, `stopTradingSession`, `executeTrade`, `closeTrade`, `resetCircuitBreaker`

## 🙏 श्री गणेशाय नमः | जय गुरुजी

---

**Built with ❤️ by ANKR Labs**
**Powered by Vyomo Adaptive AI**
