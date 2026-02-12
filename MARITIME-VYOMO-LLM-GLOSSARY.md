# 📖 Maritime, Vyomo & LLM Trading - Complete Glossary

**Last Updated**: 2026-02-11
**For**: Mathematical Equivalence, Causal Time Series, LLM Training Documents

---

## 🧮 Statistical & Machine Learning Algorithms

### HMM (Hidden Markov Model)
**Full Name**: Hidden Markov Model

**What it is**: A statistical model that assumes a system can be in one of several discrete "hidden states", and transitions between these states follow probabilistic rules.

**In our context**: Used to classify vessel speed (or options IV) into 5 discrete regimes:
- **Stopped** (0-1 knots)
- **Slow** (1-5 knots)
- **Cruising** (5-15 knots)
- **Fast** (15-25 knots)
- **Emergency** (>25 knots)

**Key concept**: The "hidden" part means we infer the state (regime) from observations (speed readings), not direct measurements.

**Example**:
```typescript
// Current speed: 12 knots → Regime: "Cruising"
// 5x5 transition matrix predicts next most likely state
// Most likely: Stay in "Cruising" (70% probability)
// Second likely: Move to "Fast" (20% probability)
```

**Why it works across domains**:
- Options IV has regimes (low vol, medium vol, high vol, extreme vol)
- Vessel speed has regimes (stopped, slow, cruising, fast)
- Same mathematical structure: discrete states + transition probabilities

---

### Granger Causality
**What it is**: Statistical test to determine if one time series can predict another time series.

**Key insight**: If X "Granger-causes" Y, then past values of X help predict Y better than Y's own past values alone.

**Formula**:
```
H0: X does NOT Granger-cause Y
Test: Compare prediction error of Y using (Y_past) vs (Y_past + X_past)
p-value < 0.05 → Reject H0 → X does cause Y
```

**Example from trading**:
```
Test: Does FII selling cause IV to increase?
Result: p-value = 0.003, lag = 2 days
Interpretation: ✅ FII selling predicts IV rise 2 days later (99.7% confidence)
```

**Not the same as**: Correlation (which is symmetric and doesn't imply direction)

---

### VAR (Vector Autoregression)
**Full Name**: Vector Autoregression Model

**What it is**: Multi-variable time series model that captures relationships between multiple time series simultaneously.

**Key feature**: Allows **bidirectional causality** (X affects Y AND Y affects X)

**Formula**:
```
Y_t = c + A1*Y_{t-1} + A2*Y_{t-2} + ... + Ap*Y_{t-p} + e_t

Where:
- Y_t is a vector of multiple variables [Spot, IV, OI]
- A1, A2, ... are coefficient matrices
- Captures cross-variable effects
```

**Example**:
```
Variables: [Spot Price, IV, Open Interest]
VAR captures:
- Spot ← IV (past IV affects spot)
- IV ← Spot (past spot affects IV)
- OI ← both (past spot and IV affect OI)
- All simultaneously!
```

**Advantage over Granger**: Granger tests one direction at a time; VAR models all interactions together.

---

### SCM (Structural Causal Model)
**Full Name**: Structural Causal Model (Pearl's Framework)

**What it is**: Formal mathematical framework to represent causal relationships using directed acyclic graphs (DAGs).

**Key concept**: Distinguishes between:
- **Correlation**: X and Y move together
- **Causation**: X actually influences Y

**Notation**:
```
X → Y    (X causes Y)
X ← Z → Y    (Z causes both X and Y; X and Y are correlated but not causal)
```

**Example**:
```
Correlation: "Ice cream sales and drowning deaths are correlated"
SCM reveals: Temperature → Ice cream sales
             Temperature → Swimming → Drowning deaths
(No causal link between ice cream and drowning!)
```

**In trading**:
```
FII Selling → Spot Price → IV
(Not just: FII selling correlates with IV)
```

---

### Transfer Entropy
**What it is**: Information-theoretic measure of how much information X provides about Y's future, beyond what Y's own past provides.

**Key advantage**: Captures **nonlinear causality** (unlike Granger which assumes linear relationships)

**Formula** (simplified):
```
TE(X→Y) = Information gained about Y_future from X_past
        - Information already in Y_past
```

**When to use**: When relationships might be nonlinear (e.g., volatility spikes, regime changes)

**Example**:
```
Linear: FII selling ₹100 Cr → IV rises 2 points
Nonlinear: FII selling >₹500 Cr → IV explodes 10+ points
Transfer Entropy captures the nonlinear threshold effect
```

---

### LoRA (Low-Rank Adaptation)
**Full Name**: Low-Rank Adaptation for Large Language Models

**What it is**: Efficient fine-tuning technique that freezes the base model and trains small "adapter" layers.

**Key benefit**: Fine-tune Llama 3.1 (8B params) with only 16-32M trainable parameters (~0.4% of model)

**How it works**:
```
Instead of updating all weights:
W_new = W_frozen + ΔW

LoRA decomposes ΔW into two small matrices:
ΔW = A × B

Where A and B are much smaller (rank r = 16-32)
```

**Example**:
```
Original model: 8 billion parameters
LoRA adapters: 32 million parameters (0.4%)
Training time: 2-3 days (vs 2-3 weeks full fine-tune)
VRAM required: 24GB (vs 80GB+ for full fine-tune)
```

**Trade-off**: Slightly lower accuracy than full fine-tuning, but 10-20x faster and cheaper.

---

## 📊 Time Series Concepts

### Regime Detection
**What it is**: Classifying time series data into discrete states (regimes) based on statistical properties.

**Formula**:
```typescript
deviation = |value - mean| / stddev
percentile = rank(value) / total_count

regime = classify(deviation, percentile)
// Returns: 'stopped' | 'slow' | 'cruising' | 'fast' | 'emergency'
```

**Example**:
```
Vessel speed data: [12, 13, 11, 12, 13, 12]
Mean: 12.17 knots
Current: 12 knots
Percentile: 45%
Regime: "Cruising"
```

**Why useful**: Predicting regime *transitions* (cruising → fast) is easier than predicting exact values (12 → 18 knots).

---

### Compression Detection
**What it is**: Detecting when time series range narrows (volatility decreases), often preceding a breakout.

**Formula**:
```
recent_range = max(recent_20) - min(recent_20)
old_range = max(old_50) - min(old_50)

compression_score = (old_range - recent_range) / old_range × 100
```

**Example**:
```
Old range (50 days): IV between 15-45 (range = 30)
Recent range (20 days): IV between 22-28 (range = 6)

Compression = (30 - 6) / 30 × 100 = 80%
→ High compression → Breakout likely soon!
```

**Trading analogy**: Bollinger Bands squeeze (range narrows before explosive move)

---

### Realized Volatility (RV)
**What it is**: Actual volatility measured from historical price changes.

**Formula**:
```
RV = sqrt(sum of squared returns) × sqrt(252/n)

returns = log(price_t / price_{t-1})
```

**Example**:
```
Daily returns: [0.02, -0.01, 0.03, -0.02, 0.01]
Squared returns: [0.0004, 0.0001, 0.0009, 0.0004, 0.0001]
Sum: 0.0019
RV = sqrt(0.0019) × sqrt(252/5) = 0.31 (31% annualized)
```

**Difference from IV**: RV is historical (what happened), IV is forward-looking (what market expects).

---

### Rolling Window
**What it is**: Statistical calculation performed on a sliding window of recent data.

**Example**:
```
Data: [10, 12, 14, 15, 13, 12, 11]
Window size: 3

Rolling mean:
- Window 1: [10, 12, 14] → mean = 12
- Window 2: [12, 14, 15] → mean = 13.67
- Window 3: [14, 15, 13] → mean = 14
- And so on...
```

**Why useful**: Adapts to recent trends while filtering out noise.

---

## 🎯 Options Trading Terms

### IV (Implied Volatility)
**What it is**: Market's expectation of future price volatility, derived from option prices.

**Key point**: Higher IV → More expensive options (higher premiums)

**Example**:
```
Nifty at 22,000
ATM call option: ₹150
IV: 18% (normal)

Before earnings:
ATM call option: ₹280
IV: 32% (elevated due to uncertainty)
```

**Not the same as**: Historical volatility (what happened) vs IV (what market expects)

---

### OI (Open Interest)
**What it is**: Total number of outstanding option contracts (not yet closed or expired).

**Interpretation**:
- **Rising OI + Rising Price** → Bullish (new long positions)
- **Rising OI + Falling Price** → Bearish (new short positions)
- **Falling OI** → Unwinding positions (less conviction)

**Example**:
```
22,000 CE (Call Option)
OI: 50,000 contracts → 10,000 new contracts added
Interpretation: Strong bullish interest at 22,000 level
```

---

### PCR (Put-Call Ratio)
**What it is**: Ratio of put volume (or OI) to call volume.

**Formula**:
```
PCR = Put Volume / Call Volume
```

**Interpretation** (contrarian indicator):
- **PCR > 1.2**: Too many puts → Bullish (market too bearish)
- **PCR < 0.7**: Too many calls → Bearish (market too bullish)
- **PCR ≈ 1.0**: Neutral

**Example**:
```
Put OI: 1,20,000
Call OI: 80,000
PCR = 1.5 → Market overly bearish → Contrarian signal: Buy!
```

---

### FII (Foreign Institutional Investors)
**Who they are**: Large foreign investors (hedge funds, pension funds, etc.) trading in Indian markets.

**Why important**: Their buying/selling moves markets significantly.

**Example**:
```
FII sells ₹800 Cr in index futures
→ Spot price drops
→ IV rises (fear)
→ Granger causality detects this relationship with 2-day lag
```

---

### DII (Domestic Institutional Investors)
**Who they are**: Large Indian investors (mutual funds, insurance companies, banks).

**Market role**: Often counter FII activity (when FII sells, DII buys).

**Example**:
```
FII sells ₹1,000 Cr
DII buys ₹800 Cr
Net selling: ₹200 Cr → Mild bearish impact
```

---

### ATM (At The Money)
**What it is**: Option strike price closest to current spot price.

**Example**:
```
Nifty spot: 22,150
ATM strike: 22,100 CE (closest to spot)
```

**Characteristics**: Highest volume, highest gamma (most sensitive to price moves)

---

### ITM (In The Money)
**What it is**: Option that has intrinsic value (profitable if exercised now).

**Examples**:
```
Nifty at 22,000

Call ITM: 21,500 CE (spot > strike) → Value: ₹500
Put ITM: 22,500 PE (strike > spot) → Value: ₹500
```

---

### OTM (Out of The Money)
**What it is**: Option with no intrinsic value (would lose money if exercised now).

**Examples**:
```
Nifty at 22,000

Call OTM: 22,500 CE (spot < strike) → Intrinsic value: ₹0
Put OTM: 21,500 PE (strike < spot) → Intrinsic value: ₹0
```

**Why trade OTM**: Cheaper premiums, high leverage (100x+ returns if moves large)

---

### Greeks
**What they are**: Sensitivity measures for options pricing.

#### Delta (Δ)
- **What**: Rate of change of option price per ₹1 change in spot
- **Range**: 0 to 1 for calls, 0 to -1 for puts
- **Example**: Delta = 0.5 → If spot moves ₹1, option moves ₹0.50

#### Gamma (Γ)
- **What**: Rate of change of delta per ₹1 change in spot
- **Peak**: ATM options (highest gamma)
- **Why important**: Shows how fast delta changes

#### Theta (Θ)
- **What**: Time decay (loss of option value per day)
- **Example**: Theta = -₹10 → Option loses ₹10 daily (all else equal)

#### Vega (ν)
- **What**: Sensitivity to IV changes
- **Example**: Vega = 0.15 → If IV rises 1%, option gains ₹0.15

---

## 🌊 Maritime Terms

### AIS (Automatic Identification System)
**What it is**: Global tracking system for ships that broadcasts position, speed, course, and vessel info.

**Data transmitted**:
- Position (latitude, longitude)
- Speed (knots)
- Course (heading)
- Vessel name, IMO number
- Updated every 2-10 seconds

**Why useful for time series**: Provides continuous speed data for regime detection.

---

### IMO (International Maritime Organization)
**What it is**: Unique 7-digit identifier for every ocean-going vessel.

**Example**: IMO 9876543

**Purpose**: Track vessel history, ownership, compliance across its lifetime.

---

### Knots
**What it is**: Maritime speed unit = nautical miles per hour

**Conversion**:
- 1 knot = 1.852 km/h
- 10 knots = 18.52 km/h
- 20 knots = 37.04 km/h

**Typical speeds**:
- Container ship: 15-25 knots
- Tanker: 12-16 knots
- Cruise ship: 20-24 knots

---

### ETA (Estimated Time of Arrival)
**What it is**: Predicted arrival time at destination port.

**Affected by**:
- Current speed regime
- Weather conditions
- Port congestion
- Route deviations

**Example**:
```
Distance: 500 nm
Speed: 15 knots
ETA: 500/15 = 33.3 hours ≈ 1.4 days
```

---

### Vessel Types
- **Container**: Carries shipping containers (TEU)
- **Tanker**: Carries liquid cargo (crude oil, chemicals)
- **Bulk Carrier**: Carries dry bulk (grain, coal, ore)
- **RoRo**: Roll-on/Roll-off (cars, trucks)
- **LNG Carrier**: Carries liquefied natural gas

---

## 🤖 LLM & AI Terms

### LLM (Large Language Model)
**What it is**: Neural network trained on massive text data to understand and generate language.

**Examples**:
- Llama 3.1 (Meta) - 8B, 70B, 405B parameters
- Mistral 7B
- GPT-4, Claude (API-based)
- Qwen 2.5 (Alibaba)

**Our use case**: Fine-tune to predict options movements from news/earnings.

---

### Fine-tuning
**What it is**: Taking a pre-trained model and training it further on domain-specific data.

**Process**:
```
1. Start: Pre-trained Llama 3.1 (general knowledge)
2. Add: Your data (historical market + news + outcomes)
3. Train: 2-3 epochs with LoRA
4. Result: Model specialized for options prediction
```

**Data needed**: 1-2 years of historical data (3,000-5,000 examples)

---

### Embeddings
**What it is**: Dense vector representation of text that captures semantic meaning.

**Example**:
```
Text: "Reliance Q4 earnings beat estimates"
Embedding: [0.234, -0.891, 0.456, ..., 0.123]  (768 dimensions)

Similar text: "Reliance quarterly profit exceeds forecast"
Embedding: [0.229, -0.887, 0.461, ..., 0.119]  (very close!)
```

**Why useful**: Models can compare texts mathematically (cosine similarity).

---

### Quantization
**What it is**: Reducing model precision to save memory (e.g., 16-bit → 8-bit → 4-bit).

**Trade-off**:
- **FP16** (16-bit): Full accuracy, 2x memory of FP32
- **INT8** (8-bit): 99% accuracy, 4x memory saving
- **INT4** (4-bit): 95-97% accuracy, 8x memory saving

**Example**:
```
Llama 3.1 8B:
- FP16: 16 GB VRAM
- INT8: 8 GB VRAM (fits RTX 3090)
- INT4: 4 GB VRAM (fits RTX 3060)
```

---

### Inference
**What it is**: Running a trained model to make predictions (after training is complete).

**Example**:
```
Input: "RIL declares bonus share 1:1"
Model inference:
→ Bullish signal
→ Predicted IV change: +3 points
→ Confidence: 72%
```

**Speed**: 10-50 tokens/second on RTX 3090

---

### Token
**What it is**: Basic unit of text for LLMs (roughly 0.75 words).

**Examples**:
- "Hello" → 1 token
- "trading" → 1 token
- "fine-tuning" → 2 tokens ("fine", "-", "tuning")

**Context window**: Max tokens model can process (e.g., Llama 3.1 = 128K tokens)

---

## 📈 General Terms

### Correlation
**What it is**: Measure of how two variables move together (-1 to +1).

**Formula**:
```
Correlation = Cov(X, Y) / (StdDev(X) × StdDev(Y))
```

**Interpretation**:
- **+1**: Perfect positive (both rise together)
- **0**: No relationship
- **-1**: Perfect negative (one rises, other falls)

**Example**:
```
Correlation(FII_Selling, IV) = 0.72
→ Strong positive correlation
→ But doesn't prove causation!
```

---

### Causation
**What it is**: X directly influences Y (not just correlation).

**Test methods**:
- Granger causality test
- Randomized controlled trial
- Structural causal models

**Key principle**: Correlation ≠ Causation

**Example**:
```
Correlation: Ice cream sales and drowning deaths
Causation: Temperature causes both (spurious correlation)
```

---

### p-value
**What it is**: Probability of observing the result if null hypothesis were true.

**Interpretation**:
- **p < 0.01**: Very strong evidence (99% confidence)
- **p < 0.05**: Strong evidence (95% confidence)
- **p > 0.05**: Weak evidence (not statistically significant)

**Example**:
```
Granger test: "Does FII selling cause IV rise?"
p-value = 0.003 (0.3%)
→ Only 0.3% chance this is random
→ Very strong causal relationship
```

---

### Lag
**What it is**: Time delay between cause and effect.

**Example**:
```
FII sells ₹800 Cr today (Day 0)
IV rises after 2 days (Day 2)
→ Lag = 2 days
```

**Why important**: Knowing lag gives you trading edge (act on Day 1 before effect on Day 2).

---

### EMH (Efficient Market Hypothesis)
**What it is**: Theory that markets instantly price in all available information.

**Implication**: If true, 100% prediction is impossible (no edge).

**Forms**:
- **Weak**: Can't predict from past prices (technical analysis fails)
- **Semi-strong**: Can't predict from public info (news already priced in)
- **Strong**: Can't predict even from insider info

**Reality**: Markets are *mostly* efficient, but:
- News takes 2-6 hours to fully price in (LLM edge!)
- Causal relationships exist (60-68% accuracy achievable)

---

### Kelly Criterion
**What it is**: Formula to calculate optimal bet size based on edge and odds.

**Formula**:
```
f* = (bp - q) / b

Where:
- f* = fraction of capital to bet
- b = odds (profit ratio)
- p = win probability
- q = 1 - p (loss probability)
```

**Example**:
```
Win rate: 65% (p = 0.65)
Profit ratio: 2:1 (b = 2)
q = 0.35

Kelly = (2 × 0.65 - 0.35) / 2 = 0.475

→ Bet 47.5% of capital? NO! Too risky!
→ Use 1/4 Kelly = 11.8% (safer)
```

---

### Sharpe Ratio
**What it is**: Risk-adjusted return measure (higher is better).

**Formula**:
```
Sharpe = (Return - RiskFreeRate) / Volatility
```

**Interpretation**:
- **> 2.0**: Excellent (institutional grade)
- **1.0-2.0**: Good
- **< 1.0**: Poor (too much risk for return)

**Example**:
```
Annual return: 35%
Risk-free rate: 7%
Volatility: 18%

Sharpe = (35 - 7) / 18 = 1.56 (good!)
```

---

### Maximum Drawdown
**What it is**: Largest peak-to-trough decline in portfolio value.

**Example**:
```
Capital: ₹10 lakhs → ₹15 lakhs (peak) → ₹9 lakhs (trough) → ₹12 lakhs
Max Drawdown = (15 - 9) / 15 = 40%
```

**Why important**: Shows worst-case loss (can you handle 40% drawdown emotionally?).

---

## 🔄 Domain-Agnostic Terms

### Domain-Agnostic
**What it means**: Algorithm works across different domains without modification.

**Example**:
```
HMM regime detection:
- Works for: Options IV (financial domain)
- Works for: Vessel speed (maritime domain)
- Works for: Temperature (weather domain)
- Same math, different data!
```

**Key insight**: Statistical patterns are universal (mean, std dev, percentiles).

---

### Multi-modal
**What it is**: Combining multiple types of data (text + numbers + images).

**Example for LLM trading**:
```
Input combines:
- Text: "RIL declares ₹10,000 Cr buyback"
- Numbers: Current IV = 18%, Spot = 2,850
- Sentiment: Positive (bullish keywords detected)

→ LLM processes all three → Prediction: IV will rise 3-5 points
```

---

### Ensemble
**What it is**: Combining multiple models/signals for better predictions.

**Our hybrid system**:
```
Final prediction =
  40% × LLM_prediction +
  40% × VAR_model_prediction +
  20% × Sentiment_score
```

**Why better**: Reduces individual model errors (wisdom of crowds).

---

## 📚 Quick Reference

### Most Important Terms (Must Know)

1. **HMM** - Classifies into discrete states (regimes)
2. **Granger Causality** - Tests if X predicts Y
3. **VAR** - Multi-variable time series model
4. **IV** - Implied volatility (options pricing)
5. **LoRA** - Efficient LLM fine-tuning
6. **AIS** - Ship tracking data
7. **Regime Detection** - Classifying time series states
8. **p-value** - Statistical significance measure
9. **Correlation vs Causation** - Co-movement vs influence
10. **EMH** - Why 100% prediction is impossible

---

## 📖 Document Cross-References

| Term | Primary Document | Section |
|------|------------------|---------|
| HMM | Mathematical Equivalence | Section 4 |
| Granger Causality | Causal Time Series | Section 3.1 |
| VAR | Causal Time Series | Section 3.2 |
| LoRA | LLM Training Guide | Section 4.3 |
| Regime Detection | Mathematical Equivalence | Section 2 |
| Compression | Mathematical Equivalence | Section 5 |
| IV/OI/PCR | Causal Time Series | Section 1 |
| AIS | Integration Guide | Section 2 |
| Kelly Criterion | LLM Training Guide | Section 7.3 |
| EMH | Causal Time Series | Section 2.1 |

---

**Created**: 2026-02-11
**Total Terms**: 50+
**Complexity**: Beginner → Advanced
**Purpose**: Quick reference for all maritime/vyomo/LLM documents

---

🎓 **Pro Tip**: Bookmark this glossary while reading the technical documents!
