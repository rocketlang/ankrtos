# Vyomo Proprietary Algorithms

> **Innovative Trading Intelligence That Others Don't Have**
>
> Author: Bharat Anil | Last Updated: 19th January 2026

---

## Introduction

While most trading platforms offer the same indicators (RSI, MACD, Bollinger Bands), Vyomo focuses on **protecting retail traders** and giving them an edge through algorithms that detect what institutions and operators are doing.

These algorithms are designed specifically for the **Indian market context** where:
- Operators manipulate small/mid-cap stocks
- Stop-loss hunting is common
- Retail traders consistently lose to informed money
- Expiry days have predictable patterns

---

## 1. Retail Trap Detector

### The Problem
90% of retail stop-losses are placed at obvious levels (round numbers, recent lows/highs). Institutions know this and deliberately push prices to these levels to trigger stops before reversing.

### Our Solution

```
Algorithm: Retail Trap Detection

Inputs:
- Price levels where maximum stop-losses likely exist
- Volume profile at these levels
- Time of day (traps common in first hour and last hour)

Detection Logic:
1. Identify "stop cluster zones" (round numbers, recent swing points)
2. Monitor for low-volume approach to these zones
3. Detect rapid spike through zone followed by reversal
4. Calculate "trap probability" based on historical patterns

Output:
- Alert: "Stop-loss hunt likely at 23,000. Avoid placing stops here."
- Post-trap alert: "Trap completed at 22,980. Consider entry now."
```

### Why It's Unique
No platform tells retail WHERE their stops are being hunted. We do.

---

## 2. Manipulation Pattern Recognition (MPR)

### The Problem
Indian small/mid-cap stocks are frequently manipulated through:
- Pump-and-dump schemes
- Circular trading (wash trading)
- News front-running
- Social media coordination

### Our Solution

```
Algorithm: Manipulation Pattern Recognition

Patterns Detected:

1. OPERATOR ACCUMULATION
   - Slow, steady buying over 2-4 weeks
   - Increasing delivery percentage
   - Low volatility during accumulation
   - Sudden volume spike = distribution phase

2. PUMP AND DUMP
   - 50%+ price rise in < 30 days
   - Social media mention spike
   - Promoter selling during rise
   - Volume spike followed by collapse

3. CIRCULAR TRADING
   - Same quantity traded back-and-forth
   - Unusual bid-ask patterns
   - Limited unique participants

4. NEWS FRONT-RUNNING
   - Unusual OI buildup before announcements
   - Volume spike 1-3 days before news
   - Insider buying patterns

Scoring:
- Each pattern gets a probability score
- Combined "Manipulation Risk Score" (0-100)
- Stocks above 70 get "AVOID" rating
```

### Alert Examples
- "STOCK XYZ showing 78% match with pump-and-dump pattern. Avoid."
- "Unusual OI buildup before results. Possible front-running."
- "Promoter pledge increased to 60%. Red flag."

---

## 3. Smart Money vs Dumb Money Flow

### The Problem
Retail trades at the wrong time, institutions trade at the right time.

### Our Solution

```
Algorithm: Smart/Dumb Money Flow Analysis

Time Segmentation:
- 9:15-9:30 AM: Opening FOMO (Dumb Money)
- 9:30-10:00 AM: Reaction trades (Mixed)
- 10:00-2:30 PM: Institutional activity (Smart Money)
- 2:30-3:00 PM: Retail averaging (Dumb Money)
- 3:00-3:30 PM: Institutional positioning (Smart Money)

Flow Analysis:
1. Track buy/sell pressure in each segment
2. Compare option chain changes by segment
3. Identify divergence between smart and dumb money

Signals:
- Dumb buying + Smart selling = BEARISH
- Dumb selling + Smart buying = BULLISH
- Both aligned = Strong trend
```

### Why It Matters
When retail is panic selling but institutions are quietly buying, it's usually a bottom.

---

## 4. Volatility Regime Prediction

### The Problem
Most traders react to volatility AFTER big moves. We predict regime changes BEFORE they happen.

### Our Solution

```
Algorithm: Hidden Markov Model for Volatility Regimes

Regimes:
1. LOW_VOL: Compression, narrow ranges
2. NORMAL: Typical market conditions
3. HIGH_VOL: Expansion, large swings
4. CRISIS: Extreme moves, circuit breakers

Transition Predictions:
- LOW_VOL → HIGH_VOL: Breakout imminent
- HIGH_VOL → LOW_VOL: Trend exhaustion
- NORMAL → CRISIS: Black swan indicators

Features Used:
- ATR compression/expansion
- IV percentile changes
- VIX/India VIX spread
- Put/Call IV skew
- Historical regime durations

Output:
- Current regime + confidence
- Probability of regime change in next 1-5 days
- Recommended position sizing
```

### Alert Example
"NIFTY in volatility compression for 8 days. 73% probability of breakout within 3 sessions. Prepare for directional move."

---

## 5. Expiry Day Physics

### The Problem
Options expiry days have predictable "gravitational" effects due to dealer hedging, but retail doesn't understand this.

### Our Solution

```
Algorithm: Gamma Exposure (GEX) Analysis

Calculations:
1. GEX at each strike = Gamma × OI × Contract Size × Spot
2. Net GEX = Call GEX - Put GEX
3. Gamma Flip Point = Where net GEX changes sign

Market Behavior:
- Positive GEX: Dealers sell rallies, buy dips (mean reversion)
- Negative GEX: Dealers chase price (momentum)
- Gamma Flip: Key pivot level for the day

Expiry Predictions:
1. Max Pain gravitational pull
2. Expected intraday range from GEX distribution
3. Pin probability for high-OI strikes
```

### Alert Example
"Gamma flip at 23,150. Above = buy dips. Below = sell rallies. Max pin probability at 23,200 is 67%."

---

## 6. FII-DII Divergence Alpha

### The Problem
FII and DII flows are published, but interpretation is often wrong.

### Our Solution

```
Algorithm: Institutional Flow Divergence

Scenarios:
1. FII SELLS + DII BUYS HEAVILY
   → Usually market bottom
   → DII absorbing panic selling
   → Historical win rate: 72%

2. FII BUYS + DII SELLS
   → Sustainable rally likely
   → Smart money accumulating
   → Historical win rate: 68%

3. BOTH SELLING
   → Real trouble, stay out
   → No support from either side
   → Average drawdown: 8%

4. BOTH BUYING
   → Strong rally, but late stage
   → Watch for exhaustion

Divergence Score:
- Rolling 5-day FII vs DII difference
- Normalized score: -100 (extreme divergence bearish) to +100
```

---

## 7. Liquidity Void Mapping

### The Problem
Price moves fast through levels with no orders. Retail stop-losses placed in these voids get terrible fills.

### Our Solution

```
Algorithm: Liquidity Void Detection

Process:
1. Analyze historical volume profile
2. Identify price levels with minimal trading
3. Map "air pockets" where price can gap

Void Characteristics:
- Less than 10% of average volume at level
- Created by gap up/down moves
- Often unfilled for days/weeks

Alert Usage:
- "Liquidity void from 22,950-22,900. Fast move likely if breached."
- "Don't place stop-loss in void. Use 22,880 instead."
```

---

## 8. Narrative Cycle Trading

### The Problem
Markets move on narratives (EV, AI, renewable, defense), but retail enters at the wrong stage.

### Our Solution

```
Algorithm: Narrative Lifecycle Detection (NLP-based)

Stages:
1. WHISPER (Best entry)
   - Few mentions, smart money accumulating
   - Sector PE below historical average

2. EARLY ADOPTER
   - Broker reports emerging
   - First retail interest

3. MAINSTREAM (Dangerous)
   - News channels covering
   - High social media volume
   - "Everyone" talking about it

4. SATURATION (Exit)
   - Mutual fund NFOs in theme
   - Retail FOMO at peak
   - Valuations stretched

5. REVERSAL
   - Narrative exhausted
   - Smart money exiting
   - "Theme is dead" articles

Detection:
- NLP analysis of news, social media, broker reports
- Volume of mentions over time
- Sentiment trajectory
- Valuation percentile
```

### Alert Example
"EV theme at Stage 4 (Saturation). 'Electric vehicle' mentions up 400% in 30 days. Late entry risky."

---

## 9. Circuit Breaker Prediction

### The Problem
Small/mid-cap circuits can trap traders. Predicting them gives an edge.

### Our Solution

```
Algorithm: Circuit Probability Model

For Upper Circuit:
- Delivery % trending up (accumulation)
- Concentrated buying (few large buyers)
- Low float + high demand
- Technical breakout setup

For Lower Circuit:
- Promoter selling/pledging
- Delivery % dropping
- Concentrated selling
- Breaking key support

Features:
- Historical circuit frequency
- Float vs average volume ratio
- Price distance from 52-week high/low
- News sentiment score
```

---

## 10. Cross-Asset Anomaly Detection

### The Problem
Markets are interconnected. Anomalies in correlations often predict moves.

### Our Solution

```
Algorithm: Correlation Anomaly Detector

Relationships Monitored:
- USDINR vs NIFTY (inverse correlation)
- Global VIX vs India VIX (spread)
- FII Cash vs FII Derivatives (divergence)
- NIFTY vs Bank NIFTY ratio (extreme readings)
- Bond yields vs equity (correlation shifts)

Anomaly Detection:
- Z-score of correlation vs historical
- Alert when correlation breaks down
- Mean reversion probability

Example:
"USDINR rising but NIFTY also rising. Historical anomaly.
One of them will correct. Probability: NIFTY correction 65%."
```

---

## Implementation Priority

| Algorithm | Impact | Complexity | Priority |
|-----------|--------|------------|----------|
| Retail Trap Detector | High | Medium | P0 |
| Manipulation Pattern | High | High | P0 |
| Smart/Dumb Money | High | Medium | P1 |
| GEX Analysis | High | Medium | P1 |
| FII-DII Divergence | Medium | Low | P1 |
| Volatility Regime | Medium | High | P2 |
| Liquidity Voids | Medium | Medium | P2 |
| Narrative Cycle | Medium | High | P2 |
| Circuit Prediction | Low | Medium | P3 |
| Cross-Asset Anomaly | Low | High | P3 |

---

## Competitive Advantage

| Feature | Zerodha | Sensibull | Opstra | Vyomo |
|---------|---------|-----------|--------|-------|
| Option Chain | Yes | Yes | Yes | Yes |
| Greeks | Yes | Yes | Yes | Yes |
| IV Analysis | Basic | Yes | Yes | Yes |
| Plain Language | No | No | No | **Yes** |
| Hindi Support | No | No | No | **Yes** |
| Manipulation Detection | No | No | No | **Yes** |
| Stop-Loss Hunt Alert | No | No | No | **Yes** |
| Smart Money Flow | No | Partial | No | **Yes** |
| GEX Analysis | No | Yes | Yes | **Yes** |
| Voice Narration | No | No | No | **Yes** |

---

## Conclusion

These algorithms give Vyomo a unique edge by:

1. **Protecting retail** from manipulation and traps
2. **Explaining** complex data in simple terms
3. **Predicting** rather than just measuring
4. **Localizing** for Indian market dynamics

The goal isn't to make traders rich quick - it's to **stop them from losing money** to operators and institutions.

---

*Confidential - ANKR Labs Internal Document*

*श्री गणेशाय नमः | जय गुरुजी*

*© 2026 ANKR Labs - Powerp Box IT Solutions Pvt Ltd*
