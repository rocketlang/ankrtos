# Vyomo AI Agent - Decision Nudge & Algorithm Bucketing

## Real Purpose: Guide Users to Better Decisions

### Core Questions We Need to Answer:

1. **Which algorithms work in WHICH market conditions?**
   - Trending vs Range-bound
   - High volatility vs Low volatility
   - News-driven vs Technical-driven
   - Expiry week vs Normal week

2. **How does AI intervention change user behavior?**
   - Does it prevent bad trades?
   - Does it improve win rate?
   - Does it reduce losses?
   - Does it stop emotional trading?

3. **What "nudges" are most effective?**
   - Warning vs Suggestion vs Block
   - Early vs Late intervention
   - Confidence-based vs Rule-based

---

## Testing Framework v2: Decision-Centric

### Phase 1: Market Regime Classification

**Bucket the data into market regimes:**

```
Regime 1: HIGH VOLATILITY + TRENDING
- VIX > 20
- Clear direction (up/down > 2% daily)
- Example: Budget day, Election results
- Best algos: MOMENTUM, BREAKOUT, GAMMA_SCALPING

Regime 2: HIGH VOLATILITY + RANGE-BOUND
- VIX > 20
- No clear direction (choppy)
- Example: Geopolitical uncertainty
- Best algos: STRADDLE, IRON_CONDOR, IV_SKEW

Regime 3: LOW VOLATILITY + TRENDING
- VIX < 15
- Slow steady direction
- Example: Post-rally consolidation
- Best algos: TREND_FOLLOWING, DELTA_NEUTRAL

Regime 4: LOW VOLATILITY + RANGE-BOUND
- VIX < 15
- Sideways market
- Example: Summer doldrums
- Best algos: THETA_DECAY, BUTTERFLY_SPREAD

Regime 5: NEWS-DRIVEN EVENTS
- Scheduled events (RBI policy, earnings)
- Breaking news
- Example: RBI rate decision day
- Best algos: NEWS_SENTIMENT, ORDER_FLOW, PUT_CALL_RATIO

Regime 6: EXPIRY WEEK
- Options expiry proximity
- Increased volatility + volume
- Example: Weekly/monthly expiry
- Best algos: VEGA_HEDGING, GAMMA_SCALPING, ORDER_FLOW
```

---

## Phase 2: Algorithm Performance by Regime

### Test Structure:

For each of 13 algorithms, measure:

```javascript
{
  algorithm: "MOMENTUM_MA50",
  performance: {
    regime1_high_vol_trending: {
      winRate: 68%,
      avgProfit: +2.3%,
      trades: 45,
      rating: "⭐⭐⭐⭐⭐ Excellent"
    },
    regime2_high_vol_rangebound: {
      winRate: 42%,
      avgProfit: -0.8%,
      trades: 38,
      rating: "⭐⭐ Poor - AVOID"
    },
    // ... other regimes
  },
  bestRegimes: ["HIGH_VOL_TRENDING", "LOW_VOL_TRENDING"],
  worstRegimes: ["HIGH_VOL_RANGEBOUND"],
  recommendation: "Use only in trending markets"
}
```

### Metrics per Algorithm per Regime:

1. **Win Rate** = Winning Trades / Total Trades
2. **Average Profit/Loss** = Total P&L / Total Trades
3. **Sharpe Ratio** = (Avg Return - Risk Free) / Std Dev
4. **Max Drawdown** = Largest peak-to-trough decline
5. **Recovery Time** = Days to recover from drawdown

---

## Phase 3: AI Nudge Effectiveness

### Scenario Testing:

**Scenario A: Algorithm Conflict Detected**
```
Market: High volatility, range-bound (Regime 2)
User wants to: BUY (following MOMENTUM algo)
Conflict: 7 algos say SELL, 4 say BUY, 2 NEUTRAL

AI Analysis:
- MOMENTUM (BUY) has 42% win rate in Regime 2 ❌
- 7 algos saying SELL have 65% win rate in Regime 2 ✅
- This is a high-confidence SELL regime

AI Nudge Options:
1. Soft Warning: "7 algorithms disagree. Consider waiting."
2. Hard Warning: "MOMENTUM underperforms in choppy markets (-0.8% avg)"
3. Suggestion: "Try STRADDLE strategy instead (65% win rate here)"
4. Block: "Trade blocked. High risk of loss."

Test: Which nudge prevents bad trades without annoying user?
```

**Scenario B: Revenge Trading Detected**
```
User situation:
- 3 consecutive losses
- About to increase position size by 2x
- Following MOMENTUM algo (which is LOSING today)

AI Analysis:
- Revenge trading pattern detected ⚠️
- Position sizing error detected ⚠️
- MOMENTUM algo has 3 losses today (market regime changed)
- Current regime: Range-bound (MOMENTUM doesn't work here)

AI Nudge Options:
1. Soft: "You've had 3 losses. Consider taking a break."
2. Medium: "Your position size increased 2x. This is risky."
3. Hard: "Market regime changed. MOMENTUM stopped working."
4. Block: "Trade paused for 30 minutes. Cool down period."

Test: Which nudge stops revenge trading most effectively?
```

**Scenario C: Algorithm Working Well**
```
Market: High volatility, trending up (Regime 1)
User wants to: BUY (following MOMENTUM)
Alignment: 9 algos say BUY, 2 NEUTRAL, 2 SELL

AI Analysis:
- MOMENTUM has 68% win rate in Regime 1 ✅
- 9/13 algos agree (high consensus) ✅
- Market regime favorable ✅
- User has good track record today ✅

AI Nudge:
"✅ Good trade setup. MOMENTUM has 68% win rate in trending markets."

Test: Does positive reinforcement improve user confidence?
```

---

## Phase 4: Decision Quality Metrics

### A/B Testing Framework:

**Control Group (No AI):**
- User trades based on 13 algorithm signals alone
- No conflict warnings
- No behavior pattern detection
- No regime-based guidance

**Treatment Group (With AI):**
- AI detects conflicts and warns user
- AI detects bad behavior patterns
- AI recommends best algorithms for current regime
- AI nudges toward better decisions

### Measure:

```
Metric 1: Win Rate Improvement
- Control: 52% win rate
- Treatment: 58% win rate
- Impact: +6% (11.5% relative improvement) ✅

Metric 2: Average Profit per Trade
- Control: +₹245
- Treatment: +₹380
- Impact: +₹135 (55% improvement) ✅

Metric 3: Max Drawdown Reduction
- Control: -₹15,000 (3 consecutive losses)
- Treatment: -₹8,500 (AI stopped 3rd loss)
- Impact: -43% drawdown ✅

Metric 4: Revenge Trading Prevention
- Control: 18 revenge trades (lost ₹12,000)
- Treatment: 4 revenge trades (lost ₹2,500)
- Impact: 78% reduction ✅

Metric 5: Regime-Appropriate Algorithm Usage
- Control: User used MOMENTUM in all regimes
- Treatment: User switched to STRADDLE in choppy markets
- Impact: Win rate improved from 42% → 65% ✅

Metric 6: User Satisfaction
- Control: 3.2/5 (frustrated by losses)
- Treatment: 4.5/5 (feels guided and supported)
- Impact: +40% satisfaction ✅
```

---

## Phase 5: Testing Methodology

### Step 1: Historical Backtesting

```javascript
// For each day in historical data:
1. Classify market regime
2. Get 13 algorithm signals
3. Measure algorithm performance in that regime
4. Simulate user decision (with/without AI)
5. Track outcomes
```

### Step 2: Algorithm Bucketing

```javascript
// Build performance matrix
const algorithmPerformance = {
  MOMENTUM_MA50: {
    HIGH_VOL_TRENDING: { winRate: 68%, avgProfit: 2.3%, trades: 45 },
    HIGH_VOL_RANGEBOUND: { winRate: 42%, avgProfit: -0.8%, trades: 38 },
    LOW_VOL_TRENDING: { winRate: 61%, avgProfit: 1.5%, trades: 52 },
    // ... other regimes
  },
  // ... other algorithms
};

// Identify best algorithms per regime
const bestAlgorithms = {
  HIGH_VOL_TRENDING: ["MOMENTUM_MA50", "BREAKOUT_BOLLINGER", "GAMMA_SCALPING"],
  HIGH_VOL_RANGEBOUND: ["STRADDLE", "IRON_CONDOR", "IV_SKEW"],
  // ... other regimes
};
```

### Step 3: Nudge Testing

```javascript
// Simulate different nudge strategies
const nudgeStrategies = [
  {
    name: "Soft Warning Only",
    intervention: "Show warning, let user decide",
    effectiveness: "45% bad trades prevented"
  },
  {
    name: "Hard Warning + Alternative",
    intervention: "Show warning + suggest better algorithm",
    effectiveness: "72% bad trades prevented"
  },
  {
    name: "Temporary Block",
    intervention: "Block trade for 5 minutes",
    effectiveness: "85% bad trades prevented, 20% user annoyance"
  },
  {
    name: "Educational Nudge",
    intervention: "Explain WHY algorithm won't work here",
    effectiveness: "78% bad trades prevented, user learns"
  }
];

// Find optimal nudge strategy
const optimalNudge = findBestTradeoff(effectiveness, userAnnoyance, education);
```

---

## Expected Output: Algorithm Performance Report

```
╔════════════════════════════════════════════════════════════════╗
║        VYOMO ALGORITHM PERFORMANCE BY MARKET REGIME            ║
╚════════════════════════════════════════════════════════════════╝

REGIME 1: HIGH VOLATILITY + TRENDING (45 days)
─────────────────────────────────────────────────────────────────
⭐⭐⭐⭐⭐ MOMENTUM_MA50          Win: 68%  Profit: +2.3%  [USE]
⭐⭐⭐⭐⭐ BREAKOUT_BOLLINGER     Win: 65%  Profit: +2.1%  [USE]
⭐⭐⭐⭐  GAMMA_SCALPING         Win: 61%  Profit: +1.8%  [GOOD]
⭐⭐⭐    MOMENTUM_RSI           Win: 58%  Profit: +1.2%  [OK]
⭐⭐     STRADDLE               Win: 48%  Profit: -0.5%  [AVOID]
⭐       IRON_CONDOR            Win: 35%  Profit: -1.8%  [NEVER]

REGIME 2: HIGH VOLATILITY + RANGE-BOUND (38 days)
─────────────────────────────────────────────────────────────────
⭐⭐⭐⭐⭐ STRADDLE               Win: 72%  Profit: +3.1%  [USE]
⭐⭐⭐⭐⭐ IRON_CONDOR            Win: 68%  Profit: +2.5%  [USE]
⭐⭐⭐⭐  IV_SKEW                Win: 63%  Profit: +1.9%  [GOOD]
⭐⭐⭐    DELTA_NEUTRAL          Win: 56%  Profit: +0.8%  [OK]
⭐⭐     MOMENTUM_MA50          Win: 42%  Profit: -0.8%  [AVOID]
⭐       BREAKOUT_BOLLINGER     Win: 38%  Profit: -1.5%  [NEVER]

... [other regimes]

AI DECISION SUPPORT EFFECTIVENESS
─────────────────────────────────────────────────────────────────
Win Rate Improvement:        +6.0% (52% → 58%)
Profit per Trade:            +55% (₹245 → ₹380)
Max Drawdown Reduction:      -43% (₹15k → ₹8.5k)
Revenge Trading Prevention:  -78% (18 → 4 incidents)
User Satisfaction:           +40% (3.2 → 4.5 / 5)

OPTIMAL NUDGE STRATEGY: "Educational + Alternative Suggestion"
- Effectiveness: 78% bad trades prevented
- User Annoyance: Low (4.2/5 satisfaction)
- Learning: High (users understand WHY)
```

---

## Implementation Checklist

### 1. Market Regime Classifier ✅
```typescript
function classifyMarketRegime(data: MarketData): Regime {
  const vix = data.vix;
  const trend = calculateTrend(data.prices);
  const isNewsDay = checkNewsCalendar(data.date);
  const isExpiryWeek = checkExpiryProximity(data.date);

  if (isExpiryWeek) return "EXPIRY_WEEK";
  if (isNewsDay) return "NEWS_DRIVEN";
  if (vix > 20 && Math.abs(trend) > 0.02) return "HIGH_VOL_TRENDING";
  if (vix > 20 && Math.abs(trend) < 0.02) return "HIGH_VOL_RANGEBOUND";
  // ... etc
}
```

### 2. Algorithm Performance Tracker ✅
```typescript
function trackAlgorithmPerformance(
  algorithm: string,
  regime: Regime,
  signal: Signal,
  outcome: TradeOutcome
) {
  // Store in database
  await prisma.algorithmPerformance.create({
    data: {
      algorithm,
      regime,
      signal,
      outcome: outcome.profit,
      winRate: calculateWinRate(algorithm, regime),
      timestamp: new Date()
    }
  });
}
```

### 3. AI Decision Engine ✅
```typescript
function aiDecisionSupport(
  userIntent: Trade,
  algorithmSignals: Signal[],
  marketRegime: Regime,
  userHistory: UserBehavior
): AIDecision {
  // 1. Check algorithm performance in this regime
  const algoPerformance = getPerformance(userIntent.algorithm, marketRegime);

  // 2. Check for conflicts
  const conflict = detectConflict(algorithmSignals);

  // 3. Check for bad behavior
  const behaviorIssue = detectBehaviorAnomaly(userHistory);

  // 4. Generate nudge
  if (algoPerformance.winRate < 50%) {
    return {
      action: "WARN",
      message: `${userIntent.algorithm} has only ${algoPerformance.winRate}% win rate in ${marketRegime}`,
      suggestion: `Try ${getBestAlgorithm(marketRegime)} instead (${bestPerf.winRate}% win rate)`,
      confidence: 85
    };
  }

  // ... more logic
}
```

### 4. A/B Testing Framework ✅
```typescript
function assignUserToGroup(userId: string): "CONTROL" | "TREATMENT" {
  // 50/50 split
  return hash(userId) % 2 === 0 ? "CONTROL" : "TREATMENT";
}

function trackDecision(
  userId: string,
  group: string,
  aiSuggestion: AIDecision | null,
  userAction: Trade,
  outcome: TradeOutcome
) {
  await prisma.abTest.create({
    data: {
      userId,
      group,
      aiSuggestion: aiSuggestion?.message,
      userFollowed: userAction.matches(aiSuggestion),
      profit: outcome.profit,
      timestamp: new Date()
    }
  });
}
```

---

## Success Criteria

### Minimum Viable:
- [ ] 6 market regimes classified
- [ ] 13 algorithms tested in each regime
- [ ] Performance matrix completed (13 × 6 = 78 data points)
- [ ] 3 nudge strategies tested
- [ ] +5% win rate improvement vs control

### Production Ready:
- [ ] 12+ months of data tested
- [ ] +10% win rate improvement
- [ ] +50% profit per trade
- [ ] -40% max drawdown
- [ ] 4.5/5 user satisfaction
- [ ] <10% user annoyance (nudge fatigue)

---

## Next Step: Build Testing Pipeline

Want me to create the regime classifier and algorithm bucketing test script?
