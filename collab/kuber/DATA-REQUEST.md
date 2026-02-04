# Kuber - Data Request Template

**To:** Bharat
**From:** ANKR Labs
**Date:** January 2026
**Purpose:** Data requirements for trading pattern analysis

---

## Overview

To discover meaningful patterns in your Nifty trading indicators, we need historical data in a structured format. This document outlines exactly what we need, how to format it, and how to share it securely.

---

## Data Required

### 1. Price Data (OHLCV)

| Field | Description | Format |
|-------|-------------|--------|
| timestamp | Date and time | YYYY-MM-DD HH:MM:SS |
| open | Opening price | Decimal |
| high | High price | Decimal |
| low | Low price | Decimal |
| close | Closing price | Decimal |
| volume | Trading volume | Integer |

**Frequency:** 1-minute or 5-minute candles preferred
**History:** Minimum 1 year, ideally 2+ years

---

### 2. Indicator Values

| Field | Description | Format |
|-------|-------------|--------|
| timestamp | Must match price data | YYYY-MM-DD HH:MM:SS |
| indicator_1 | Your first indicator | Decimal |
| indicator_2 | Your second indicator | Decimal |
| ... | Additional indicators | Decimal |
| indicator_N | Last indicator | Decimal |

**Note:** Please provide indicator names/descriptions separately

---

### 3. Trade Signals (If Available)

| Field | Description | Format |
|-------|-------------|--------|
| timestamp | Signal time | YYYY-MM-DD HH:MM:SS |
| signal_type | BUY / SELL / HOLD | String |
| confidence | Signal strength (optional) | 0-100 |
| actual_outcome | What happened after | UP / DOWN / FLAT |
| pnl | Profit/Loss if traded | Decimal |

---

### 4. Indicator Documentation

For each indicator, please provide:

| Item | Description |
|------|-------------|
| Name | What you call it |
| Formula | How it's calculated (if proprietary, brief description) |
| Range | Typical value range |
| Interpretation | What high/low values mean |
| Timeframe | Lookback period used |

---

## Sample Data Format

### Option A: Single CSV (Recommended)

```csv
timestamp,open,high,low,close,volume,rsi,macd,macd_signal,supertrend,custom_ind_1,custom_ind_2,signal
2025-01-15 09:15:00,22450.50,22465.25,22445.00,22460.75,150000,45.2,12.5,10.2,22440.00,0.75,-0.32,BUY
2025-01-15 09:16:00,22460.75,22470.00,22455.50,22468.25,120000,46.1,13.2,10.8,22442.50,0.82,-0.28,HOLD
2025-01-15 09:17:00,22468.25,22475.50,22462.00,22470.00,135000,47.3,14.1,11.5,22445.00,0.88,-0.25,HOLD
```

### Option B: Separate Files

1. `nifty_ohlcv.csv` - Price data
2. `indicators.csv` - Indicator values (with timestamp)
3. `signals.csv` - Trade signals
4. `indicator_docs.md` - Indicator descriptions

---

## Data Volume Estimate

| Timeframe | Rows (1-min) | Rows (5-min) |
|-----------|--------------|--------------|
| 1 month | ~8,000 | ~1,600 |
| 6 months | ~48,000 | ~9,600 |
| 1 year | ~96,000 | ~19,200 |
| 2 years | ~192,000 | ~38,400 |

**Target:** 1-2 years of data = 20K-200K rows (very manageable)

---

## Data Quality Checklist

Please ensure:

- [ ] No missing timestamps during market hours
- [ ] Consistent timezone (IST preferred)
- [ ] No null/blank values (use 0 or previous value)
- [ ] Decimal precision consistent
- [ ] Column headers in first row
- [ ] UTF-8 encoding

---

## Secure Sharing Options

### Option 1: Direct Upload (Recommended)
- Provide secure upload link
- End-to-end encrypted

### Option 2: Cloud Share
- Google Drive / Dropbox with restricted access
- Share with specific ANKR email

### Option 3: Email
- For small samples (<10MB)
- Password-protected ZIP

---

## What We'll Do With It

### Phase 1: Exploratory Analysis
- Data quality validation
- Basic statistics
- Correlation matrix
- Visual patterns

### Phase 2: Pattern Discovery
- Multi-indicator correlations
- Time-based patterns
- Regime detection
- Anomaly identification

### Phase 3: Model Building
- Predictive models
- Feature importance
- Backtest simulation
- Performance metrics

### Phase 4: Delivery
- Pattern documentation
- Interactive dashboard
- Recommendations

---

## Confidentiality

- All data stays on secure ANKR infrastructure
- No sharing with third parties
- Analysis results shared only with Bharat
- NDA available if required
- Data deleted upon request after project

---

## Questions for Bharat

Before sending data, please clarify:

1. **Instruments:** Nifty50 futures, options, or spot?
2. **Timeframe:** What candle size do you primarily trade?
3. **Trading style:** Scalping, intraday, or swing?
4. **Indicator count:** How many custom indicators?
5. **Historical depth:** How far back does your data go?
6. **Signal generation:** Manual or automated currently?

---

## Quick Start

### Minimum to Get Started
- 1 month of data
- Price + 3-5 key indicators
- Any format (we'll clean)

### Ideal Dataset
- 1+ year of data
- Price + all indicators
- Trade signals with outcomes
- Indicator documentation

---

## Timeline

| Milestone | Timeline |
|-----------|----------|
| Data received | Day 0 |
| Quality check | Day 1-2 |
| Exploratory analysis | Day 3-5 |
| Initial findings call | Day 7 |
| Deep analysis | Day 8-14 |
| Final report | Day 21 |

---

## Contact for Data Submission

**ANKR Labs**
- Primary: [Anil's email]
- Secure upload: [Link to be provided]

---

*Ready to discover patterns? Send the data and let's find your edge.*
