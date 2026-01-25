# Option Chain Time Series Analysis
## Comprehensive Possibilities Document

**Prepared for:** Kuber & Pratham Data Initiative
**Date:** January 2026
**Data Frequency:** 1-minute intervals

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Data Requirements](#data-requirements)
3. [Volatility Analysis Indicators](#volatility-analysis-indicators)
4. [Flow & Sentiment Indicators](#flow--sentiment-indicators)
5. [Greeks-Based Signals](#greeks-based-signals)
6. [Price Discovery & Arbitrage](#price-discovery--arbitrage)
7. [Advanced Composite Indicators](#advanced-composite-indicators)
8. [Machine Learning Applications](#machine-learning-applications)
9. [Real-Time Alerting System](#real-time-alerting-system)
10. [Visualization & Dashboards](#visualization--dashboards)
11. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

This document outlines the full spectrum of analytical possibilities using high-frequency (1-minute) option chain data. The goal is to extract actionable trading signals, sentiment indicators, and risk metrics from options market microstructure.

**Key Value Propositions:**
- Early detection of institutional positioning
- Volatility regime identification
- Directional bias extraction from derivatives flow
- Risk management through real-time greeks monitoring
- Automated alert generation for trading opportunities

---

## Data Requirements

### Essential Fields (Per Strike, Per Expiry)

| Field | Description | Priority |
|-------|-------------|----------|
| `timestamp` | Unix timestamp or ISO format, 1-min granularity | Critical |
| `underlying_price` | Spot price of underlying asset | Critical |
| `strike_price` | Option strike price | Critical |
| `expiry_date` | Contract expiration date | Critical |
| `option_type` | CE (Call) / PE (Put) | Critical |
| `ltp` | Last traded price | Critical |
| `bid_price` | Best bid | High |
| `ask_price` | Best ask | High |
| `bid_qty` | Bid quantity | High |
| `ask_qty` | Ask quantity | High |
| `volume` | Traded volume (cumulative or incremental) | Critical |
| `open_interest` | Open interest | Critical |
| `oi_change` | Change in OI from previous day | High |
| `iv` | Implied volatility (if pre-calculated) | High |

### Derived Fields (Can Calculate)

| Field | Derivation |
|-------|------------|
| `moneyness` | Strike / Spot (or log ratio) |
| `time_to_expiry` | Days/minutes to expiration |
| `delta` | Black-Scholes or market-derived |
| `gamma` | Second derivative of delta |
| `theta` | Time decay |
| `vega` | Volatility sensitivity |
| `spread` | Ask - Bid |
| `mid_price` | (Bid + Ask) / 2 |

### Underlying Assets to Track

| Asset | Symbol | Lot Size | Notes |
|-------|--------|----------|-------|
| Nifty 50 | NIFTY | 25 | Most liquid, primary focus |
| Bank Nifty | BANKNIFTY | 15 | High volatility, good for intraday |
| Fin Nifty | FINNIFTY | 25 | Sector-specific |
| Sensex | SENSEX | 10 | BSE alternative |
| Stock Options | Various | Varies | Top 10-20 F&O stocks |

### Historical Depth Recommendations

| Use Case | Minimum History | Ideal History |
|----------|-----------------|---------------|
| Backtesting strategies | 6 months | 2+ years |
| ML model training | 1 year | 3+ years |
| Volatility regime analysis | 3 months | 1 year |
| Intraday pattern detection | 1 month | 3 months |

---

## Volatility Analysis Indicators

### 1. Implied Volatility (IV) Metrics

#### 1.1 ATM IV Tracking
```
ATM_IV = IV of strike closest to spot price
ATM_IV_Change_1min = ATM_IV(t) - ATM_IV(t-1)
ATM_IV_Change_5min = ATM_IV(t) - ATM_IV(t-5)
```

**Signal Logic:**
- Sudden IV spike (>2 std dev) → Event anticipation
- IV compression before expiry → Normal theta decay
- IV expansion in low-volume → Potential insider activity

#### 1.2 IV Percentile & Rank
```
IV_Percentile = % of days in past year where IV was lower
IV_Rank = (Current IV - 52w Low) / (52w High - 52w Low)
```

**Use Case:** Identify cheap/expensive options for buying/selling strategies

#### 1.3 IV Skew
```
Call_Skew = IV(OTM Call) - IV(ATM)
Put_Skew = IV(OTM Put) - IV(ATM)
Skew_Ratio = Put_Skew / Call_Skew
```

**Interpretation:**
- High put skew → Fear/hedging demand
- High call skew → Speculative call buying
- Skew inversion → Unusual, investigate

#### 1.4 IV Term Structure
```
Near_IV = ATM IV of nearest weekly expiry
Far_IV = ATM IV of monthly expiry
Term_Structure = Far_IV - Near_IV
```

**Interpretation:**
- Positive (contango) → Normal market
- Negative (backwardation) → Near-term event/stress
- Flattening → Uncertainty about timing

#### 1.5 Volatility Surface
3D representation: Strike (x) × Expiry (y) × IV (z)

**Tracking:**
- Surface shifts (parallel, twist, butterfly)
- Smile/smirk shape changes
- Kink detection at specific strikes

### 2. Realized vs Implied Volatility

#### 2.1 Volatility Risk Premium (VRP)
```
RV_20 = 20-period realized volatility (annualized)
VRP = ATM_IV - RV_20
```

**Signal:**
- High VRP → Options expensive, favor selling
- Low/Negative VRP → Options cheap, favor buying

#### 2.2 IV-RV Ratio
```
IV_RV_Ratio = ATM_IV / RV_20
```
- Ratio > 1.3 → Significant premium
- Ratio < 0.9 → Discount (rare)

---

## Flow & Sentiment Indicators

### 3. Put-Call Ratio (PCR) Variants

#### 3.1 Volume PCR
```
PCR_Volume = Total Put Volume / Total Call Volume
PCR_Volume_MA5 = 5-period moving average
```

#### 3.2 OI PCR
```
PCR_OI = Total Put OI / Total Call OI
PCR_OI_Change = PCR_OI(t) - PCR_OI(t-1)
```

#### 3.3 Weighted PCR (by Premium)
```
Put_Premium = Σ(Put_Volume × Put_LTP × Lot_Size)
Call_Premium = Σ(Call_Volume × Call_LTP × Lot_Size)
PCR_Premium = Put_Premium / Call_Premium
```

**Interpretation Matrix:**

| PCR Level | Trend | Interpretation |
|-----------|-------|----------------|
| > 1.3 | Rising | Bearish sentiment building |
| > 1.3 | Falling | Bearish unwinding |
| < 0.7 | Rising | Bullish momentum |
| < 0.7 | Falling | Bullish exhaustion |
| 0.9 - 1.1 | Stable | Neutral/indecisive |

### 4. Open Interest Analysis

#### 4.1 Max Pain Calculation
```
For each strike K:
  Call_Pain = Σ max(0, Spot - K) × Call_OI(K)
  Put_Pain = Σ max(0, K - Spot) × Put_OI(K)
  Total_Pain(K) = Call_Pain + Put_Pain

Max_Pain_Strike = argmin(Total_Pain)
```

**Tracking:**
- Max pain migration speed
- Distance from spot to max pain
- Expiry convergence patterns

#### 4.2 OI Concentration Zones
```
Strike_OI_Rank = rank(Total_OI) for each strike
Resistance_Zone = Highest Call OI strikes above spot
Support_Zone = Highest Put OI strikes below spot
```

#### 4.3 OI Buildup/Unwinding Matrix

| Price Move | OI Change | Interpretation |
|------------|-----------|----------------|
| Up | Up | Long buildup (bullish) |
| Up | Down | Short covering (weak bullish) |
| Down | Up | Short buildup (bearish) |
| Down | Down | Long unwinding (weak bearish) |

#### 4.4 Cumulative OI Change
```
COI_Calls = Σ OI_Change for all calls
COI_Puts = Σ OI_Change for all puts
Net_COI = COI_Calls - COI_Puts
```

### 5. Volume Analysis

#### 5.1 Volume-Weighted Average Strike (VWAS)
```
VWAS_Calls = Σ(Strike × Call_Volume) / Σ(Call_Volume)
VWAS_Puts = Σ(Strike × Put_Volume) / Σ(Put_Volume)
```

**Interpretation:** Where is activity concentrated?

#### 5.2 Unusual Volume Detection
```
Volume_ZScore = (Current_Volume - MA_Volume) / StdDev_Volume
Unusual_Flag = Volume_ZScore > 2.5
```

#### 5.3 Block Trade Detection
```
If single trade > 5× average trade size → Block flag
Track: Strike, direction (buy/sell), time
```

#### 5.4 Volume Profile by Moneyness
```
ITM_Volume = Σ Volume where |moneyness| < 0.97
ATM_Volume = Σ Volume where 0.97 ≤ |moneyness| ≤ 1.03
OTM_Volume = Σ Volume where |moneyness| > 1.03
```

### 6. Order Flow Indicators

#### 6.1 Bid-Ask Imbalance
```
BA_Imbalance = (Bid_Qty - Ask_Qty) / (Bid_Qty + Ask_Qty)
```
- Positive → Buying pressure
- Negative → Selling pressure

#### 6.2 Spread Analysis
```
Spread_Pct = (Ask - Bid) / Mid × 100
Spread_ZScore = (Current_Spread - MA_Spread) / StdDev_Spread
```
- Widening spread → Uncertainty/risk-off
- Tight spread → Confidence/high liquidity

#### 6.3 Trade Direction Inference
```
If Trade_Price ≥ Ask → Buyer initiated
If Trade_Price ≤ Bid → Seller initiated
Else → Neutral/mid execution
```

---

## Greeks-Based Signals

### 7. Delta Exposure

#### 7.1 Net Delta
```
Net_Delta = Σ(Call_OI × Call_Delta) - Σ(Put_OI × Put_Delta)
```
Normalized: `Net_Delta / Total_OI`

**Interpretation:**
- Positive → Market net long
- Negative → Market net short

#### 7.2 Delta by Strike Heatmap
Visual representation of delta concentration across strikes

#### 7.3 Delta Hedging Pressure
```
Delta_Change = Net_Delta(t) - Net_Delta(t-1)
If |Delta_Change| > threshold → Hedging activity
```

### 8. Gamma Exposure (GEX)

#### 8.1 Dealer Gamma Calculation
```
GEX_Strike = (Call_OI × Call_Gamma - Put_OI × Put_Gamma) × Spot × 100
Total_GEX = Σ GEX_Strike
```

**Interpretation:**
- Positive GEX → Dealers hedge by selling rallies, buying dips (mean-reverting)
- Negative GEX → Dealers amplify moves (trending)

#### 8.2 Gamma Flip Point
Strike where GEX changes sign → Key pivot level

#### 8.3 Gamma Wall
Strike with maximum absolute gamma → Strong support/resistance

### 9. Vega Exposure

#### 9.1 Net Vega
```
Net_Vega = Σ(OI × Vega) for all options
```

**Use:** Sensitivity of market to IV changes

#### 9.2 Vega by Expiry
```
Near_Vega = Vega of weekly expiry options
Far_Vega = Vega of monthly options
Vega_Ratio = Near_Vega / Far_Vega
```

### 10. Theta Decay Tracking

#### 10.1 Daily Theta Burn
```
Total_Theta = Σ(OI × Theta × Lot_Size)
```
Amount of premium decaying per day

#### 10.2 Theta Acceleration
```
Theta_Velocity = Theta(t) - Theta(t-1)
```
Accelerating near expiry

---

## Price Discovery & Arbitrage

### 11. Synthetic Positions

#### 11.1 Synthetic Futures Price
```
Synthetic_Future = Strike + Call_Price - Put_Price
Fair_Future = Spot × e^(r × T)
Basis = Synthetic_Future - Fair_Future
```

**Arbitrage Signal:** |Basis| > transaction costs

#### 11.2 Put-Call Parity Deviation
```
Parity_Deviation = Call - Put - Spot + Strike × e^(-r×T)
```
Should be ~0; deviations indicate mispricing

### 12. Options-Implied Direction

#### 12.1 Risk Reversal
```
Risk_Reversal = Call_IV(25δ) - Put_IV(25δ)
```
- Positive → Bullish bias
- Negative → Bearish bias

#### 12.2 Butterfly Spread IV
```
Butterfly = 0.5 × (Call_IV(25δ) + Put_IV(25δ)) - ATM_IV
```
Measures tail risk pricing

### 13. Cross-Asset Signals

#### 13.1 Index vs Stock Options
```
If Bank_Nifty_IV >> Nifty_IV → Banking sector stress
If Stock_IV >> Index_IV → Stock-specific event
```

#### 13.2 Expiry Arbitrage
```
Weekly_IV vs Monthly_IV → Term premium
```

---

## Advanced Composite Indicators

### 14. Fear & Greed Index (Options-Based)

**Components:**
| Component | Weight | Bullish | Bearish |
|-----------|--------|---------|---------|
| PCR_OI | 20% | < 0.8 | > 1.2 |
| IV_Percentile | 20% | < 30 | > 70 |
| Put_Skew | 15% | Low | High |
| GEX | 15% | Positive | Negative |
| OI_Buildup | 15% | Call heavy | Put heavy |
| Volume_Ratio | 15% | Call heavy | Put heavy |

```
Fear_Greed_Score = Weighted sum normalized to 0-100
```

### 15. Smart Money Indicator

**Logic:**
- Track OTM option activity with high premium
- Unusual OI buildup in specific strikes
- Block trades in illiquid strikes
- Divergence between volume and OI

```
Smart_Money_Score = f(Unusual_Volume, Block_Trades, OTM_Activity, Premium_Paid)
```

### 16. Regime Detection

**Volatility Regime:**
| Regime | IV_Percentile | GEX | Behavior |
|--------|---------------|-----|----------|
| Low Vol | < 25 | Positive | Mean reversion |
| Normal | 25-75 | Mixed | Trend following |
| High Vol | > 75 | Negative | Momentum |
| Crisis | > 90 | Very Negative | Capitulation |

### 17. Expiry Positioning Index

```
Days_to_Expiry = T
Weekly_OI_Concentration = Weekly_OI / Total_OI
Rollover_Activity = OI_Change(Near) vs OI_Change(Far)
Expiry_Pressure = f(Max_Pain_Distance, Weekly_Concentration, Rollover)
```

---

## Machine Learning Applications

### 18. Prediction Models

#### 18.1 Direction Prediction
**Features:**
- PCR (volume, OI, premium)
- IV metrics (level, change, skew)
- GEX and delta exposure
- OI buildup patterns
- Technical indicators on underlying

**Target:** Next 15min/1hr/1day return sign

#### 18.2 Volatility Prediction
**Features:**
- Historical IV time series
- IV term structure
- Event calendar (earnings, expiry, RBI)
- VIX correlation

**Target:** Next day IV level or direction

#### 18.3 Strike Clustering
**Method:** K-means on volume/OI patterns
**Use:** Identify institutional positioning zones

### 19. Anomaly Detection

#### 19.1 Unusual Activity Detection
- Isolation Forest on volume/OI changes
- Autoencoders for pattern deviation
- Statistical process control

#### 19.2 Manipulation Detection
- Spoofing patterns (large orders cancelled)
- Wash trading (volume without OI change)
- Front-running signatures

### 20. Reinforcement Learning

**Environment:** Options market simulator
**Agent:** Learns optimal hedging/speculation
**Reward:** Risk-adjusted returns

---

## Real-Time Alerting System

### 21. Alert Categories

#### 21.1 Volatility Alerts
```
- IV_Spike: ATM_IV increases > 3% in 5 minutes
- IV_Crush: ATM_IV decreases > 5% in 15 minutes
- Skew_Inversion: Put_Skew < Call_Skew (unusual)
- Term_Structure_Flip: Near_IV > Far_IV (backwardation)
```

#### 21.2 Flow Alerts
```
- Heavy_Call_Buying: Call_Volume > 2× Put_Volume in 15 min
- Heavy_Put_Buying: Put_Volume > 2× Call_Volume in 15 min
- OI_Surge: OI_Change > 3σ from mean
- Block_Trade: Single trade > ₹5Cr notional
```

#### 21.3 Greeks Alerts
```
- Gamma_Flip: GEX changes sign
- Delta_Extreme: Net_Delta > 95th percentile
- Max_Pain_Shift: Max pain moves > 1 strike in 1 hour
```

#### 21.4 Price Discovery Alerts
```
- Parity_Violation: Put-Call parity deviation > 0.5%
- Basis_Blowout: Synthetic - Futures > 0.3%
- Risk_Reversal_Extreme: RR > 2σ from mean
```

### 22. Alert Delivery

| Channel | Use Case | Latency |
|---------|----------|---------|
| Telegram | Real-time trading alerts | < 1 sec |
| WhatsApp | Summary & EOD reports | < 5 sec |
| Email | Daily digest | 1 min |
| Dashboard | Continuous monitoring | Real-time |
| Webhook | System integration | < 1 sec |

### 23. Alert Prioritization

| Priority | Criteria | Action |
|----------|----------|--------|
| P0 - Critical | Multi-signal confluence | Immediate notification |
| P1 - High | Single strong signal | Within 1 minute |
| P2 - Medium | Moderate deviation | Batch every 5 minutes |
| P3 - Low | Minor anomaly | Include in summary |

---

## Visualization & Dashboards

### 24. Real-Time Displays

#### 24.1 Option Chain Heatmap
- Rows: Strikes
- Columns: Metrics (IV, Volume, OI, Greeks)
- Color: Gradient based on value/change

#### 24.2 OI & Volume Dashboard
- Bar chart: OI by strike (calls vs puts)
- Line overlay: Spot price movement
- Annotations: Max pain, support/resistance

#### 24.3 IV Surface 3D Plot
- X: Strike (or moneyness)
- Y: Time to expiry
- Z: Implied volatility
- Animation: Time evolution

#### 24.4 Greeks Exposure Charts
- GEX by strike (bar chart)
- Net delta time series
- Vega profile by expiry

### 25. Historical Analysis Views

#### 25.1 Backtest Results
- Equity curve
- Drawdown chart
- Win rate by market regime
- Signal distribution

#### 25.2 Pattern Library
- Saved patterns that preceded moves
- Statistical significance scores
- Similar pattern matcher

### 26. Report Generation

#### 26.1 Pre-Market Report
- Overnight OI changes
- Global cues impact on IV
- Key levels for the day
- Event calendar

#### 26.2 Intraday Snapshots
- Hourly summary
- Notable flows
- Regime assessment

#### 26.3 EOD Report
- Day's activity summary
- Major OI changes
- IV movement analysis
- Setup for next day

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Data Infrastructure:**
- [ ] Set up data ingestion pipeline
- [ ] Design database schema (TimescaleDB recommended)
- [ ] Implement data validation & cleaning
- [ ] Create historical data backfill process

**Basic Indicators:**
- [ ] PCR calculations (volume, OI, premium)
- [ ] ATM IV tracking
- [ ] Max pain calculation
- [ ] OI change analysis

### Phase 2: Core Analytics (Weeks 3-4)

**Volatility Suite:**
- [ ] IV surface construction
- [ ] Skew calculations
- [ ] Term structure analysis
- [ ] VRP computation

**Flow Analysis:**
- [ ] Unusual volume detection
- [ ] Block trade identification
- [ ] OI concentration zones
- [ ] Volume profile

### Phase 3: Greeks & Advanced (Weeks 5-6)

**Greeks Engine:**
- [ ] Delta/Gamma/Vega/Theta calculations
- [ ] GEX computation
- [ ] Net delta tracking
- [ ] Gamma flip detection

**Composite Indicators:**
- [ ] Fear & Greed index
- [ ] Smart money indicator
- [ ] Regime classifier

### Phase 4: Alerting & Visualization (Weeks 7-8)

**Alert System:**
- [ ] Define alert rules
- [ ] Implement Telegram/WhatsApp integration
- [ ] Priority & throttling logic
- [ ] Alert history & analytics

**Dashboards:**
- [ ] Real-time option chain view
- [ ] OI/Volume visualization
- [ ] IV surface display
- [ ] Mobile-friendly interface

### Phase 5: ML & Optimization (Weeks 9-12)

**Machine Learning:**
- [ ] Feature engineering pipeline
- [ ] Direction prediction model
- [ ] Volatility forecasting
- [ ] Anomaly detection

**Backtesting:**
- [ ] Strategy simulation engine
- [ ] Performance metrics
- [ ] Walk-forward analysis

---

## Technical Architecture

### Recommended Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Database | TimescaleDB | Time-series optimized PostgreSQL |
| Streaming | Redis Streams | Low-latency pub/sub |
| Compute | Python/NumPy | Financial libraries ecosystem |
| API | FastAPI | High-performance REST/WebSocket |
| Visualization | Plotly/Dash | Interactive charts |
| Alerts | Telegram Bot API | Free, instant, reliable |
| ML | PyTorch/scikit-learn | Flexible, production-ready |

### Data Flow

```
[Market Data Feed]
       ↓
[Ingestion Service]
       ↓
[TimescaleDB] ←→ [Redis Cache]
       ↓
[Analytics Engine]
       ↓
  ┌────┴────┐
  ↓         ↓
[API]   [Alerting]
  ↓         ↓
[Dashboard] [Telegram/WhatsApp]
```

### Scalability Considerations

- Partition data by underlying and date
- Use materialized views for common aggregations
- Implement query caching for repeated calculations
- Consider GPU acceleration for Greeks computation

---

## Risk & Compliance Notes

1. **Data Licensing:** Ensure proper licensing for redistribution
2. **Exchange Rules:** Comply with NSE/BSE data usage policies
3. **SEBI Regulations:** Automated trading requires broker approval
4. **Personal Trading:** Maintain proper audit trails

---

## Next Steps

1. **Immediate:** Get sample data from Kuber/Pratham
2. **Week 1:** Validate data quality and completeness
3. **Week 2:** Implement Phase 1 indicators
4. **Ongoing:** Iterate based on signal effectiveness

---

## Appendix

### A. Glossary

| Term | Definition |
|------|------------|
| ATM | At-the-money (strike ≈ spot) |
| OTM | Out-of-the-money |
| ITM | In-the-money |
| GEX | Gamma exposure |
| VRP | Volatility risk premium |
| PCR | Put-call ratio |
| IV | Implied volatility |
| RV | Realized volatility |

### B. Formula Reference

**Black-Scholes Greeks:**
```
Delta_Call = N(d1)
Delta_Put = N(d1) - 1
Gamma = φ(d1) / (S × σ × √T)
Vega = S × φ(d1) × √T
Theta_Call = -(S × φ(d1) × σ)/(2√T) - r × K × e^(-rT) × N(d2)

where:
d1 = (ln(S/K) + (r + σ²/2)T) / (σ√T)
d2 = d1 - σ√T
N(x) = standard normal CDF
φ(x) = standard normal PDF
```

### C. Sample Queries

**Get current ATM IV:**
```sql
SELECT iv FROM option_chain
WHERE underlying = 'NIFTY'
  AND ABS(strike - spot_price) = (
    SELECT MIN(ABS(strike - spot_price))
    FROM option_chain
    WHERE underlying = 'NIFTY'
  )
  AND option_type = 'CE'
ORDER BY timestamp DESC
LIMIT 1;
```

**Calculate PCR:**
```sql
SELECT
  SUM(CASE WHEN option_type = 'PE' THEN volume ELSE 0 END) /
  NULLIF(SUM(CASE WHEN option_type = 'CE' THEN volume ELSE 0 END), 0) as pcr_volume
FROM option_chain
WHERE underlying = 'NIFTY'
  AND timestamp >= NOW() - INTERVAL '1 hour';
```

---

*Document Version: 1.0*
*Last Updated: January 2026*
