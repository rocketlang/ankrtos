# Kuber - Trading Pattern Discovery

**Collaboration Partner:** Bharat
**ANKR Lead:** Anil
**Date:** January 2026
**Status:** Discovery Phase

---

## 1. Project Overview

### What is Kuber?
- **Type:** Proprietary trading analysis tool for Nifty
- **Owner:** Bharat (personal prop trading project)
- **Focus:** Pattern discovery in Nifty index movements
- **Data:** Custom indicators and trading signals

### Objective
Use ANKR's AI capabilities to discover patterns in Bharat's proprietary trading indicators that could predict Nifty movements with statistical significance.

---

## 2. Market Context

### Nifty Trading Landscape

**Nifty 50** is India's benchmark stock index comprising 50 large-cap companies across 13 sectors, representing ~65% of free-float market cap on NSE.

**Key Trading Instruments:**
- Nifty Futures
- Nifty Options (Calls/Puts)
- Bank Nifty (banking sector derivative)
- Nifty Weekly Options (high volume)

### Algo Trading in India

| Segment | Algo Share |
|---------|------------|
| Institutional Trading | 50-60% |
| Retail Trading | Growing rapidly |
| Options Volume | 90%+ in index options |

**Source:** [Motilal Oswal - Algorithmic Trading Strategies](https://www.motilaloswal.com/learning-centre/2025/8/top-7-algorithmic-trading-strategies-with-examples-and-risks)

---

## 3. Current State (Bharat's Setup)

### Available Data (Assumed)
- [ ] Historical Nifty price data (OHLCV)
- [ ] Custom indicator values
- [ ] Entry/exit signals
- [ ] Trade outcomes (P&L)
- [ ] Time-series metadata

### Indicators Likely in Use
| Category | Common Indicators |
|----------|------------------|
| Trend | Moving Averages (SMA, EMA), Supertrend, ADX |
| Momentum | RSI, MACD, Stochastic, ROC |
| Volatility | Bollinger Bands, ATR, VIX correlation |
| Volume | OBV, Volume Profile, VWAP |
| Custom | Bharat's proprietary calculations |

### Current Analysis Approach
Likely manual pattern observation + backtesting with standard tools (TradingView, Amibroker, Python)

---

## 4. ANKR Opportunity

### What AI Can Discover

#### 4.1 Multi-Indicator Correlation Patterns
**Problem:** Humans can track 2-3 indicators simultaneously. AI can analyze 20+.

**Approach:**
- Correlate all indicator combinations with price movements
- Find non-obvious relationships
- Identify which indicator states precede significant moves

**Example Discovery:**
"When RSI is between 45-55 AND ADX > 25 AND VWAP slope is negative AND custom_indicator_X crosses above 0, there's a 67% probability of >0.5% move within 30 mins"

#### 4.2 Time-Based Patterns
**What to look for:**
- Intraday patterns (opening hour, closing hour, lunch lull)
- Day-of-week effects (Monday gaps, Friday profit booking)
- Expiry day behavior (weekly/monthly options)
- Event-based patterns (pre/post RBI announcements)

#### 4.3 Regime Detection
**Market Regimes:**
- Trending up
- Trending down
- Range-bound/Choppy
- High volatility
- Low volatility

**Value:** Different indicator combinations work in different regimes. AI can identify which strategies to deploy when.

#### 4.4 Anomaly Detection
- Unusual indicator readings that preceded big moves
- False signal identification (when indicators said X but market did Y)
- Outlier analysis for risk management

---

## 5. Technical Approach

### Data Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    KUBER x ANKR PIPELINE                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐                                           │
│  │ Bharat's    │                                           │
│  │ Raw Data    │──────┐                                    │
│  │ (CSV/API)   │      │                                    │
│  └─────────────┘      ▼                                    │
│                 ┌─────────────┐                            │
│                 │ Data        │                            │
│                 │ Ingestion   │                            │
│                 │ & Cleaning  │                            │
│                 └─────────────┘                            │
│                       │                                    │
│         ┌─────────────┼─────────────┐                      │
│         ▼             ▼             ▼                      │
│  ┌─────────────┐┌─────────────┐┌─────────────┐            │
│  │ Feature     ││ Time Series ││ Statistical │            │
│  │ Engineering ││ Analysis    ││ Testing     │            │
│  └─────────────┘└─────────────┘└─────────────┘            │
│         │             │             │                      │
│         └─────────────┼─────────────┘                      │
│                       ▼                                    │
│                 ┌─────────────┐                            │
│                 │ ML Models   │                            │
│                 │ - XGBoost   │                            │
│                 │ - LSTM      │                            │
│                 │ - Ensemble  │                            │
│                 └─────────────┘                            │
│                       │                                    │
│                       ▼                                    │
│                 ┌─────────────┐                            │
│                 │ Pattern     │                            │
│                 │ Discovery   │                            │
│                 │ Dashboard   │                            │
│                 └─────────────┘                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Analysis Methods

#### Method 1: Correlation Analysis
```
For each indicator combination:
  - Calculate correlation with future returns (1min, 5min, 15min, 1hr)
  - Filter for statistically significant relationships (p < 0.05)
  - Rank by predictive power
```

#### Method 2: Classification Models
```
Target: Will Nifty move >X% in next N minutes? (Binary)
Features: All indicator values at time T
Models: Random Forest, XGBoost, Neural Networks
Output: Feature importance + prediction accuracy
```

#### Method 3: Clustering
```
Cluster similar market conditions together
Identify which indicator states cluster with:
  - Big up moves
  - Big down moves
  - Sideways action
  - Fakeouts
```

#### Method 4: Sequence Analysis
```
Look for temporal patterns:
  - What indicator sequence precedes breakouts?
  - What's the typical signal degradation curve?
  - How long are signals valid?
```

---

## 6. Data Requirements

### From Bharat
| Data Type | Format | Frequency | History |
|-----------|--------|-----------|---------|
| Nifty OHLCV | CSV/JSON | 1-min or 5-min | 2+ years |
| Indicator Values | CSV | Same as OHLCV | 2+ years |
| Trade Log | CSV | Per trade | All available |
| Custom Signals | CSV | Event-based | All available |

### Data Quality Checklist
- [ ] No gaps in time series
- [ ] Aligned timestamps
- [ ] Indicator calculations documented
- [ ] Corporate actions adjusted
- [ ] Holiday/non-trading days handled

### Privacy & Confidentiality
- All analysis done on ANKR secure infrastructure
- Bharat retains IP on indicators
- Discovered patterns shared only with Bharat
- NDA if required

---

## 7. Potential Discoveries

### High-Value Patterns

| Pattern Type | Example | Value |
|--------------|---------|-------|
| **Entry Signals** | Indicator combo predicts 0.5%+ move | Direct alpha |
| **Exit Optimization** | Best time to book profits | Improved P&L |
| **False Signal Filter** | Conditions when signals fail | Reduced losses |
| **Regime Classifier** | Identify current market regime | Strategy selection |
| **Risk Events** | Indicators preceding volatility spike | Position sizing |

### What Would Be "Game-Changing"
1. **Consistent 60%+ win rate** with positive risk-reward
2. **Regime predictor** that switches strategies automatically
3. **Expiry day edge** for weekly options
4. **Overnight gap predictor** for morning trades

---

## 8. Technical Implementation

### Tools & Stack

| Component | Technology |
|-----------|------------|
| Data Storage | PostgreSQL / TimescaleDB |
| Processing | Python (Pandas, NumPy) |
| ML Framework | Scikit-learn, XGBoost, PyTorch |
| Visualization | Plotly, Streamlit Dashboard |
| Backtesting | Custom / Backtrader |
| Cloud | AWS/GCP |

### Deliverables

1. **Pattern Report** - Documented findings with statistical backing
2. **Feature Importance Analysis** - Which indicators matter most
3. **Interactive Dashboard** - Explore patterns visually
4. **Backtest Results** - Hypothetical performance of discovered patterns
5. **Signal Generator** (if patterns are strong) - Real-time alerting

---

## 9. Research References

### Algo Trading Resources
- [uTrade Algos - Nifty Algo Trading](https://www.utradealgos.com/blog/what-is-algo-trading-nifty-and-how-does-it-work)
- [GitHub - Nifty Options Trading](https://github.com/srikar-kodakandla/fully-automated-nifty-options-trading)
- [GitHub - Algo Trading Strategies India](https://github.com/buzzsubash/algo_trading_strategies_india)

### Common Approaches
- Supertrend + ADX combination
- RSI divergence
- VWAP bounce strategies
- Options Greeks analysis
- Institutional flow tracking

---

## 10. Risk Considerations

### Market Risk Disclaimers
- Past patterns don't guarantee future results
- Market regime changes can invalidate patterns
- Overfitting is a major risk with ML approaches
- Execution slippage affects real-world results

### Mitigation
- Out-of-sample testing mandatory
- Walk-forward validation
- Paper trading before live deployment
- Continuous monitoring for pattern decay

---

## 11. Commercial Potential

### If Patterns Are Strong

| Path | Description | Upside |
|------|-------------|--------|
| **Personal Trading** | Bharat uses for own prop trading | Direct P&L |
| **Signal Service** | Sell signals to subscribers | Recurring revenue |
| **Algo Product** | Packaged algo for retail traders | Product business |
| **Hedge Fund** | Raise capital, trade professionally | AUM-based fees |
| **IP Licensing** | License patterns to trading firms | One-time/royalty |

### VC/Funding Angle
- Fintech/Trading AI is hot space
- Demonstrated alpha attracts capital
- India's retail trading boom = market opportunity

---

## 12. Next Steps

### Immediate Actions
1. **Data Sharing:** Bharat provides sample dataset (1 month)
2. **Initial Analysis:** ANKR runs correlation study
3. **Review Call:** Discuss preliminary findings
4. **Full Dataset:** If promising, get complete history
5. **Deep Dive:** Comprehensive pattern discovery

### Data Format Request
```
timestamp,open,high,low,close,volume,indicator1,indicator2,...,indicatorN,signal
2025-01-15 09:15:00,22450,22465,22445,22460,150000,45.2,0.3,...,1.2,BUY
2025-01-15 09:16:00,22460,22470,22455,22468,120000,46.1,0.4,...,1.1,HOLD
...
```

### Timeline
- **Week 1:** Data ingestion and quality check
- **Week 2:** Exploratory analysis
- **Week 3:** ML model training
- **Week 4:** Pattern documentation and review

---

## 13. Questions for Bharat

1. What indicators are you currently using?
2. What timeframe do you trade (scalping, intraday, swing)?
3. What's your current win rate and average R:R?
4. Any specific patterns you've observed but can't quantify?
5. What would make this collaboration "successful" for you?
6. Data availability - how far back does your data go?
7. Are you trading Nifty futures, options, or both?

---

*Document Version: 1.0*
*Last Updated: January 2026*
