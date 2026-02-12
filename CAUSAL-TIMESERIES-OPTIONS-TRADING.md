# Causal Time Series Analysis for Options Trading
## Why Correlation ≠ Causation & How to Predict Better

---

## The Fundamental Problem

### Current State (Correlation-Based)

**Vyomo & Most Trading Systems Use**:
```typescript
// Correlation: "When IV goes up, prices move"
if (currentIV > historicalIV) {
  prediction = "volatility expanding"
}

// Problem: This is CORRELATION, not CAUSATION
// IV rising could be:
// 1. CAUSE: Market makers pricing in risk → Price will move
// 2. EFFECT: Price already moved → IV reacting
// 3. SPURIOUS: Both driven by third factor (news event)
```

**Why This Loses Money**:
- ❌ Trading on lagging indicators (effect, not cause)
- ❌ False signals from spurious correlations
- ❌ Missing the actual causal chain
- ❌ No understanding of WHY markets move

---

## Can We Achieve 100% Prediction?

### Short Answer: **NO** (But We Can Get Much Better)

**Fundamental Limits**:

1. **Efficient Market Hypothesis (EMH)**
   - If markets were 100% predictable, arbitrage would eliminate the edge
   - Information gets priced in instantly
   - True surprise events (black swans) are unpredictable by definition

2. **Chaos Theory**
   - Markets are complex adaptive systems
   - Small changes → exponential divergence (butterfly effect)
   - Long-term predictions impossible even with perfect models

3. **Gödel's Incompleteness**
   - Any predictive system becomes part of the system it predicts
   - Reflexivity: predictions change behavior, which invalidates predictions

**Realistic Goal**: 60-70% directional accuracy with **proper risk management**

---

## Capturing Causal Relationships

### 1. Granger Causality

**Concept**: X "Granger-causes" Y if past values of X help predict Y better than past values of Y alone.

**Mathematical Test**:
```
Model 1 (restricted): Y_t = α + Σ β_i Y_{t-i} + ε_t
Model 2 (unrestricted): Y_t = α + Σ β_i Y_{t-i} + Σ γ_j X_{t-j} + ε_t

If Model 2 has significantly lower error → X Granger-causes Y
```

**Example (Options Trading)**:
```typescript
// Test: Does FII flow Granger-cause NIFTY IV?
const grangerTest = (fiiFlow: number[], niftyIV: number[]) => {
  // Model 1: Predict IV from its own history
  const model1Error = fitAutoregression(niftyIV, lags=5)

  // Model 2: Predict IV from its history + FII flow
  const model2Error = fitVAR(niftyIV, fiiFlow, lags=5)

  // F-test: Is improvement significant?
  const fStat = ((model1Error - model2Error) / p) / (model2Error / (n - 2*p - 1))

  if (fStat > criticalValue) {
    return "FII flow CAUSES IV changes"
  }
  return "No causal relationship"
}
```

**Implementation**:
```typescript
// Real example: Test if OI buildup causes price movement
interface GrangerCausalityTest {
  cause: number[]      // e.g., Call OI changes
  effect: number[]     // e.g., Spot price changes
  lags: number         // How many periods to look back
}

function testGrangerCausality(test: GrangerCausalityTest): {
  isCausal: boolean
  fStatistic: number
  pValue: number
  optimalLag: number
} {
  const { cause, effect, lags } = test

  // Step 1: Build restricted model (effect ~ its own lags)
  const restrictedModel = buildAutoregressiveModel(effect, lags)
  const restrictedSSR = calculateSSR(restrictedModel)

  // Step 2: Build unrestricted model (effect ~ its lags + cause lags)
  const unrestrictedModel = buildVARModel(effect, cause, lags)
  const unrestrictedSSR = calculateSSR(unrestrictedModel)

  // Step 3: F-test
  const n = effect.length
  const p = lags
  const fStat = ((restrictedSSR - unrestrictedSSR) / p) / (unrestrictedSSR / (n - 2*p - 1))
  const pValue = fDistribution(fStat, p, n - 2*p - 1)

  return {
    isCausal: pValue < 0.05,
    fStatistic: fStat,
    pValue,
    optimalLag: findOptimalLag(cause, effect)
  }
}

// Example usage
const oiChanges = [1000, 1500, 2000, 1800, 2500, 3000, 2800]  // Call OI
const priceChanges = [0.5, 0.8, 1.2, 1.0, 1.5, 1.8, 1.6]      // % price moves

const result = testGrangerCausality({
  cause: oiChanges,
  effect: priceChanges,
  lags: 2
})

if (result.isCausal) {
  console.log(`Call OI buildup CAUSES price movement with ${result.optimalLag}-period lag`)
  console.log(`Confidence: ${(1 - result.pValue) * 100}%`)
} else {
  console.log('No causal relationship detected')
}
```

---

### 2. Vector Autoregression (VAR)

**Concept**: Model multiple time series simultaneously, capturing feedback loops.

**Model**:
```
Y_t = A_1 Y_{t-1} + A_2 Y_{t-2} + ... + A_p Y_{t-p} + ε_t

where Y_t = [SpotPrice, IV, CallOI, PutOI, FIIFlow, ...]^T
```

**Why VAR > Univariate Models**:
- ✅ Captures bidirectional causality (feedback loops)
- ✅ Models simultaneous effects
- ✅ Includes cross-variable lags
- ✅ Produces impulse response functions (IRFs)

**Example**:
```typescript
interface VARModel {
  variables: string[]           // ['spot', 'iv', 'callOI', 'putOI']
  data: Record<string, number[]>
  lags: number
}

function fitVAR(model: VARModel): {
  coefficients: number[][][]    // A_1, A_2, ..., A_p matrices
  impulseResponse: (shock: string, target: string) => number[]
  forecast: (horizon: number) => Record<string, number[]>
} {
  const { variables, data, lags } = model
  const n = variables.length

  // Step 1: Construct lagged design matrix
  const X = constructLaggedMatrix(data, lags)

  // Step 2: OLS estimation for each equation
  const coefficients: number[][][] = []

  for (const targetVar of variables) {
    const y = data[targetVar]
    const beta = solveOLS(y, X)
    coefficients.push(beta)
  }

  // Step 3: Impulse Response Function
  const impulseResponse = (shock: string, target: string, horizon: number = 20) => {
    const shockIdx = variables.indexOf(shock)
    const targetIdx = variables.indexOf(target)

    const response: number[] = []
    let state = Array(n).fill(0)
    state[shockIdx] = 1  // 1 std dev shock

    for (let h = 0; h < horizon; h++) {
      // Apply VAR dynamics
      state = applyVAR(state, coefficients)
      response.push(state[targetIdx])
    }

    return response
  }

  // Step 4: Forecast
  const forecast = (horizon: number) => {
    const forecasts: Record<string, number[]> = {}
    let state = variables.map(v => data[v][data[v].length - 1])

    for (let h = 0; h < horizon; h++) {
      state = applyVAR(state, coefficients)
      variables.forEach((v, i) => {
        if (!forecasts[v]) forecasts[v] = []
        forecasts[v].push(state[i])
      })
    }

    return forecasts
  }

  return { coefficients, impulseResponse, forecast }
}

// Real example: Model NIFTY ecosystem
const niftyVAR = fitVAR({
  variables: ['spot', 'iv', 'callOI', 'putOI', 'fiiFlow', 'vix'],
  data: {
    spot: [...],      // NIFTY spot prices
    iv: [...],        // Implied volatility
    callOI: [...],    // Call open interest
    putOI: [...],     // Put open interest
    fiiFlow: [...],   // FII buying/selling
    vix: [...]        // VIX India
  },
  lags: 5
})

// Question: If FII sells ₹1000 Cr, what happens to IV?
const irf = niftyVAR.impulseResponse('fiiFlow', 'iv', horizon=10)
console.log('IV response to FII selling:', irf)
// Output: [0, 0.2, 0.5, 0.8, 1.0, 0.9, 0.7, 0.5, 0.3, 0.1]
// Interpretation: IV peaks 4 days after FII selling, then decays
```

---

### 3. Structural Causal Models (SCM)

**Concept**: Explicitly model causal graph with directed edges.

**Example Causal Graph**:
```
News Event
    ↓
FII Flow ──→ Spot Price ──→ IV
    ↓            ↓
    └──→ Options OI ────→ Gamma Squeeze
```

**Do-Calculus** (Pearl's Framework):
```
P(IV | do(FII_sell))  ≠  P(IV | FII_sell observed)

"do(FII_sell)" = Force FII to sell (intervention)
"FII_sell observed" = FII happened to sell (observation)
```

**Implementation**:
```typescript
interface CausalGraph {
  nodes: string[]
  edges: { from: string; to: string; strength: number }[]
}

const marketCausalGraph: CausalGraph = {
  nodes: ['news', 'fii', 'spot', 'iv', 'oi', 'gamma'],
  edges: [
    { from: 'news', to: 'fii', strength: 0.6 },
    { from: 'news', to: 'spot', strength: 0.4 },
    { from: 'fii', to: 'spot', strength: 0.8 },
    { from: 'spot', to: 'iv', strength: 0.9 },
    { from: 'fii', to: 'oi', strength: 0.5 },
    { from: 'oi', to: 'gamma', strength: 0.7 },
    { from: 'gamma', to: 'spot', strength: 0.6 }  // Feedback loop!
  ]
}

// Pearl's backdoor criterion: Control for confounders
function estimateCausalEffect(
  treatment: string,  // e.g., 'fii'
  outcome: string,    // e.g., 'spot'
  graph: CausalGraph,
  data: Record<string, number[]>
): number {
  // Find confounders (common causes)
  const confounders = findConfounders(treatment, outcome, graph)

  // Adjust for confounders using regression
  const adjustedEffect = multipleRegression(
    y: data[outcome],
    x: data[treatment],
    controls: confounders.map(c => data[c])
  )

  return adjustedEffect.treatmentCoefficient
}

// Example: True causal effect of FII flow on spot price
const causalEffect = estimateCausalEffect('fii', 'spot', marketCausalGraph, historicalData)
console.log(`₹1000 Cr FII buying → Spot moves ${causalEffect}% (causal effect)`)

// Compare with naive correlation
const naiveCorr = correlation(historicalData.fii, historicalData.spot)
console.log(`Naive correlation: ${naiveCorr}`)
// Often overstates effect because it includes confounders (news)
```

---

### 4. Transfer Entropy

**Concept**: Information-theoretic measure of causal influence (works for nonlinear systems).

**Formula**:
```
TE(X → Y) = Σ p(y_t, y_{t-1}, x_{t-1}) log( p(y_t | y_{t-1}, x_{t-1}) / p(y_t | y_{t-1}) )

Interpretation: How much does knowing X's past reduce uncertainty about Y's future?
```

**Advantages over Granger**:
- ✅ Detects nonlinear causality
- ✅ Doesn't assume Gaussian noise
- ✅ Model-free (no functional form needed)

**Implementation**:
```typescript
function transferEntropy(
  source: number[],    // X (potential cause)
  target: number[],    // Y (effect)
  lag: number = 1
): number {
  // Discretize continuous data into bins
  const sourceBins = discretize(source, bins=10)
  const targetBins = discretize(target, bins=10)

  let te = 0

  for (let t = lag; t < target.length; t++) {
    const y_t = targetBins[t]
    const y_t1 = targetBins[t - 1]
    const x_t1 = sourceBins[t - 1]

    // Compute joint and conditional probabilities
    const p_yyx = jointProbability(y_t, y_t1, x_t1)
    const p_yx = jointProbability(y_t, x_t1)
    const p_y = probability(y_t)
    const p_y_given_yx = p_yyx / jointProbability(y_t1, x_t1)
    const p_y_given_y = p_yx / probability(y_t1)

    te += p_yyx * Math.log2(p_y_given_yx / p_y_given_y)
  }

  return te
}

// Example: Does VIX cause NIFTY IV?
const te_vix_to_iv = transferEntropy(vixData, niftyIVData)
const te_iv_to_vix = transferEntropy(niftyIVData, vixData)

if (te_vix_to_iv > te_iv_to_vix + 0.1) {
  console.log('VIX → NIFTY IV (unidirectional causality)')
} else if (Math.abs(te_vix_to_iv - te_iv_to_vix) < 0.1) {
  console.log('Bidirectional causality (feedback loop)')
}
```

---

## Practical Application: Options Trading System

### Architecture: Causal + Correlational Hybrid

```
┌──────────────────────────────────────────────────────────────┐
│                  DATA LAYER                                   │
│  - Spot prices, IV, OI, Greeks, FII/DII, News, VIX          │
└────────────────────────┬─────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                  │
        ▼                                  ▼
┌───────────────────┐          ┌────────────────────┐
│  CAUSAL LAYER     │          │  CORRELATIONAL     │
│  (Slow, Robust)   │          │  (Fast, Noisy)     │
├───────────────────┤          ├────────────────────┤
│ - Granger tests   │          │ - HMM regimes      │
│ - VAR models      │          │ - Compression      │
│ - SCM graphs      │          │ - Percentiles      │
│ - Transfer entropy│          │ - Moving averages  │
└────────┬──────────┘          └─────────┬──────────┘
         │                                │
         └────────────┬───────────────────┘
                      ▼
         ┌─────────────────────────────┐
         │   FUSION LAYER              │
         │   (Bayesian combination)    │
         └──────────────┬──────────────┘
                        │
                        ▼
         ┌─────────────────────────────┐
         │   DECISION LAYER            │
         │   - Entry/exit signals      │
         │   - Position sizing         │
         │   - Risk management         │
         └─────────────────────────────┘
```

### Code Implementation

```typescript
interface CausalOptionsStrategy {
  // Layer 1: Causal analysis (updated daily)
  causalSignals: {
    fiiCausesIV: boolean          // Granger test result
    oiCausesSpot: boolean
    virusality: number            // How strong are causal links?
    lagStructure: number[]        // Optimal lags for each causal path
  }

  // Layer 2: Real-time correlational signals
  realtimeSignals: {
    currentRegime: SpeedRegime
    compressionScore: number
    ivPercentile: number
  }

  // Layer 3: Fusion
  fusedPrediction: {
    direction: 'up' | 'down' | 'neutral'
    confidence: number            // 0-100
    expectedMove: number          // %
    timeHorizon: number           // days
  }
}

class CausalOptionsTrader {
  private varModel: VARModel
  private grangerTests: Map<string, GrangerResult>
  private causalGraph: CausalGraph

  constructor() {
    // Initialize models
    this.varModel = this.buildVARModel()
    this.grangerTests = this.runGrangerTests()
    this.causalGraph = this.inferCausalGraph()
  }

  /**
   * Daily update: Rebuild causal models with latest data
   */
  async updateCausalModels(data: MarketData): Promise<void> {
    console.log('🔬 Updating causal models...')

    // 1. Test Granger causality for all pairs
    this.grangerTests = new Map()

    const tests = [
      { cause: 'fii', effect: 'iv', hypothesis: 'FII flow causes IV' },
      { cause: 'callOI', effect: 'spot', hypothesis: 'Call OI causes spot moves' },
      { cause: 'putOI', effect: 'spot', hypothesis: 'Put OI causes spot moves' },
      { cause: 'vix', effect: 'niftyIV', hypothesis: 'VIX causes NIFTY IV' }
    ]

    for (const test of tests) {
      const result = testGrangerCausality({
        cause: data[test.cause],
        effect: data[test.effect],
        lags: 5
      })

      this.grangerTests.set(`${test.cause}_${test.effect}`, result)

      if (result.isCausal) {
        console.log(`✓ ${test.hypothesis} (lag=${result.optimalLag}, p=${result.pValue.toFixed(3)})`)
      } else {
        console.log(`✗ ${test.hypothesis} rejected`)
      }
    }

    // 2. Update VAR model
    this.varModel = fitVAR({
      variables: ['spot', 'iv', 'callOI', 'putOI', 'fii', 'vix'],
      data: data.getLatest(60),  // 60 days
      lags: 5
    })

    // 3. Infer causal graph structure
    this.causalGraph = this.inferCausalGraph()
  }

  /**
   * Real-time: Generate trading signal
   */
  generateSignal(currentState: MarketSnapshot): TradingSignal {
    // Step 1: Get causal prediction (why will market move?)
    const causalPrediction = this.getCausalPrediction(currentState)

    // Step 2: Get correlational prediction (what patterns do we see?)
    const corrPrediction = this.getCorrelationalPrediction(currentState)

    // Step 3: Fuse predictions with Bayesian combination
    const fusedSignal = this.fusePredictions(causalPrediction, corrPrediction)

    // Step 4: Risk management overlay
    const finalSignal = this.applyRiskManagement(fusedSignal, currentState)

    return finalSignal
  }

  private getCausalPrediction(state: MarketSnapshot): Prediction {
    // Use VAR model to forecast
    const forecast = this.varModel.forecast(horizon=5)

    // Check causal paths
    const signals: Signal[] = []

    // Example: FII → IV causal path
    if (this.grangerTests.get('fii_iv')?.isCausal) {
      const lag = this.grangerTests.get('fii_iv')!.optimalLag
      const fiiChange = state.fii - state.fiiHistory[lag]

      if (fiiChange < -500) {  // FII selling ₹500 Cr
        // Use IRF to predict IV response
        const ivResponse = this.varModel.impulseResponse('fii', 'iv', 10)
        const predictedIVIncrease = ivResponse[lag] * Math.abs(fiiChange / 1000)

        signals.push({
          source: 'causal:fii_iv',
          direction: 'up',
          strength: 0.8,
          reasoning: `FII selling ${fiiChange} Cr → IV expected to rise ${predictedIVIncrease}%`,
          confidence: 0.75
        })
      }
    }

    // Example: Call OI → Spot causal path (gamma squeeze)
    if (this.grangerTests.get('callOI_spot')?.isCausal) {
      const oiChange = state.callOI - state.callOIHistory[1]
      const gammaExposure = this.calculateGammaExposure(state)

      if (oiChange > 0 && gammaExposure > 5000) {  // Crores of gamma
        signals.push({
          source: 'causal:gamma_squeeze',
          direction: 'up',
          strength: 0.9,
          reasoning: `Large call OI buildup → Gamma squeeze likely → Spot may rally`,
          confidence: 0.70
        })
      }
    }

    // Aggregate signals
    return this.aggregateSignals(signals)
  }

  private getCorrelationalPrediction(state: MarketSnapshot): Prediction {
    // Use Vyomo-style regime detection
    const regime = classifyRegime(state.spot, state.spotPercentile)
    const compression = calculateCompressionScore(state.spotHistory)
    const transition = getMostLikelyTransition(regime)

    const signals: Signal[] = []

    // Compression breakout signal
    if (compression > 75) {
      signals.push({
        source: 'pattern:compression',
        direction: transition?.to === 'fast' ? 'up' : 'down',
        strength: compression / 100,
        reasoning: `Compression ${compression}/100 → Breakout imminent`,
        confidence: 0.60  // Lower confidence (correlation, not causation)
      })
    }

    // IV percentile signal
    if (state.ivPercentile < 20) {
      signals.push({
        source: 'pattern:iv_low',
        direction: 'up',
        strength: 0.6,
        reasoning: `IV at ${state.ivPercentile}th percentile → Mean reversion expected`,
        confidence: 0.55
      })
    }

    return this.aggregateSignals(signals)
  }

  private fusePredictions(causal: Prediction, corr: Prediction): TradingSignal {
    // Bayesian fusion: Causal evidence gets higher weight
    const causalWeight = 0.7
    const corrWeight = 0.3

    // Weight by confidence
    const weightedCausal = causal.confidence * causalWeight
    const weightedCorr = corr.confidence * corrWeight

    // Normalize
    const totalWeight = weightedCausal + weightedCorr

    const finalConfidence = (
      causal.confidence * (weightedCausal / totalWeight) +
      corr.confidence * (weightedCorr / totalWeight)
    )

    // Direction: Must agree on both or have high causal confidence
    let direction: 'up' | 'down' | 'neutral' = 'neutral'

    if (causal.direction === corr.direction) {
      direction = causal.direction  // Both agree → high confidence
    } else if (causal.confidence > 0.75) {
      direction = causal.direction  // Causal signal very strong → trust it
    } else {
      direction = 'neutral'  // Conflicting signals → stay out
    }

    return {
      direction,
      confidence: finalConfidence,
      expectedMove: causal.expectedMove * causalWeight + corr.expectedMove * corrWeight,
      timeHorizon: Math.ceil(causal.timeHorizon * causalWeight + corr.timeHorizon * corrWeight),
      reasoning: [
        `Causal: ${causal.reasoning}`,
        `Pattern: ${corr.reasoning}`
      ]
    }
  }

  private applyRiskManagement(signal: TradingSignal, state: MarketSnapshot): TradingSignal {
    // Rule 1: Never bet against strong trends (even with high confidence)
    const trendStrength = this.calculateTrendStrength(state)
    if (trendStrength > 0.8 && signal.direction !== 'up') {
      signal.confidence *= 0.5
      signal.reasoning.push('WARNING: Betting against strong uptrend')
    }

    // Rule 2: Reduce confidence near major events
    if (this.isNearMajorEvent(state)) {
      signal.confidence *= 0.7
      signal.reasoning.push('INFO: Major event nearby, reducing confidence')
    }

    // Rule 3: Minimum confidence threshold
    if (signal.confidence < 0.55) {
      signal.direction = 'neutral'
      signal.reasoning.push('PASS: Confidence too low')
    }

    // Rule 4: Position sizing based on confidence
    signal.positionSize = this.calculatePositionSize(signal.confidence)

    return signal
  }

  private calculatePositionSize(confidence: number): number {
    // Kelly Criterion: f* = (p*b - q) / b
    // where p = win probability, q = 1-p, b = win/loss ratio

    const winProb = confidence
    const lossProb = 1 - confidence
    const winLossRatio = 2.0  // Expect 2:1 reward:risk

    const kellFraction = (winProb * winLossRatio - lossProb) / winLossRatio

    // Use 25% of Kelly (conservative)
    const positionSize = Math.max(0, Math.min(kellFraction * 0.25, 0.10))  // Max 10% capital

    return positionSize
  }
}

// Usage
const trader = new CausalOptionsTrader()

// Daily: Update causal models
await trader.updateCausalModels(marketData)

// Intraday: Generate signals
const signal = trader.generateSignal(currentSnapshot)

if (signal.direction !== 'neutral') {
  console.log(`
    🎯 SIGNAL: ${signal.direction.toUpperCase()}
    Confidence: ${(signal.confidence * 100).toFixed(0)}%
    Expected Move: ${signal.expectedMove.toFixed(1)}%
    Time Horizon: ${signal.timeHorizon} days
    Position Size: ${(signal.positionSize * 100).toFixed(1)}% of capital

    Reasoning:
    ${signal.reasoning.join('\n    ')}
  `)

  // Execute trade
  executeTrade(signal)
}
```

---

## Why This Approach Is Better

### Comparison Table

| Aspect | Pure Correlation (Vyomo) | Causal + Correlation (Proposed) |
|--------|-------------------------|----------------------------------|
| **Prediction Type** | "IV is high → Expect mean reversion" | "FII selling → IV will rise in 2 days" |
| **Lead Time** | Lagging (reacts to moves) | Leading (predicts before moves) |
| **False Signals** | High (spurious correlations) | Lower (filters confounders) |
| **Confidence** | Generic (50-70%) | Context-specific (40-85%) |
| **Risk Management** | Fixed (always same size) | Adaptive (Kelly sizing) |
| **Win Rate** | ~52-55% | ~60-65% (estimated) |
| **Why It Loses** | Trading noise, not signal | Fewer false positives |

---

## Realistic Expectations

### What Causal Analysis CAN Do

✅ **Increase Win Rate**: 52% → 60-65% (directional accuracy)
✅ **Reduce Drawdowns**: Avoid false signals during choppy markets
✅ **Better Position Sizing**: Bet more when confidence is high
✅ **Understand WHY**: Not just "what" but "why" markets move
✅ **Adapt Faster**: Detect regime changes before they're obvious

### What It CANNOT Do

❌ **Predict Black Swans**: COVID, war, sudden policy changes
❌ **Beat HFTs on Speed**: Latency-sensitive opportunities gone
❌ **100% Win Rate**: Market has inherent randomness
❌ **Work During Crashes**: Causal structure breaks during panics
❌ **Replace Risk Management**: Still need stops, position limits

---

## Implementation Roadmap

### Phase 1: Foundation (2 weeks)

1. **Data Collection**
   - Historical: Spot, IV, OI, Greeks, FII/DII (5 years)
   - Real-time: Live feeds from NSE/BSE

2. **Causal Testing**
   - Implement Granger causality tests
   - Test all variable pairs
   - Document causal relationships

3. **VAR Model**
   - Fit 5-variable VAR
   - Generate impulse response functions
   - Validate out-of-sample

### Phase 2: Integration (2 weeks)

4. **Hybrid System**
   - Merge causal + correlational signals
   - Bayesian fusion layer
   - Backtest on historical data

5. **Risk Management**
   - Kelly criterion position sizing
   - Drawdown limits
   - Event filters

### Phase 3: Live Trading (4 weeks)

6. **Paper Trading**
   - Live signals, no real money
   - Track performance vs. benchmarks
   - Tune parameters

7. **Small Capital Live**
   - Start with ₹1-2 lakhs
   - Max 2% risk per trade
   - Monitor for 30 days

8. **Scale Up**
   - If profitable, increase capital gradually
   - Never exceed 10% portfolio in single position

---

## Risk Management (Critical!)

### Rules to Prevent Losses

1. **Maximum Loss Per Trade: 2%**
   ```typescript
   const maxLoss = accountBalance * 0.02
   const stopLoss = entryPrice - (maxLoss / quantity)
   ```

2. **Maximum Daily Loss: 6%**
   ```typescript
   if (dailyLoss > accountBalance * 0.06) {
     stopTradingForDay = true
   }
   ```

3. **Confidence-Based Sizing**
   ```typescript
   if (confidence < 0.60) {
     positionSize = 0  // Don't trade
   } else if (confidence < 0.70) {
     positionSize = accountBalance * 0.02
   } else {
     positionSize = accountBalance * 0.05  // Max 5%
   }
   ```

4. **Diversification**
   - Never 100% in options
   - Split across strategies (buying, selling, spreads)
   - Multiple underlyings (NIFTY, BANKNIFTY, stocks)

5. **Circuit Breakers**
   ```typescript
   const rules = [
     { condition: 'VIX > 30', action: 'Reduce position size by 50%' },
     { condition: '3 losses in row', action: 'Stop trading for 24h' },
     { condition: 'Market gap > 2%', action: 'Wait 30 min before entry' }
   ]
   ```

---

## Example: Full Trade Flow

```typescript
// 2026-02-11, 9:30 AM

// Step 1: Check causal signals
const causalCheck = trader.getCausalPrediction(currentState)
// Output:
// {
//   direction: 'up',
//   confidence: 0.78,
//   reasoning: 'FII bought ₹800 Cr yesterday → Spot expected to rise 0.5-0.8% in next 2 days (Granger lag=1, p=0.003)',
//   expectedMove: 0.65
// }

// Step 2: Check correlational signals
const corrCheck = trader.getCorrelationalPrediction(currentState)
// Output:
// {
//   direction: 'up',
//   confidence: 0.62,
//   reasoning: 'Compression score 76/100 → Breakout likely. IV at 18th percentile → Mean reversion expected.',
//   expectedMove: 0.50
// }

// Step 3: Fuse signals
const fusedSignal = trader.fusePredictions(causalCheck, corrCheck)
// Output:
// {
//   direction: 'up',
//   confidence: 0.73,  // Weighted average (70% causal, 30% corr)
//   expectedMove: 0.60,
//   timeHorizon: 2
// }

// Step 4: Risk management
const finalSignal = trader.applyRiskManagement(fusedSignal, currentState)
// Output:
// {
//   direction: 'up',
//   confidence: 0.73,
//   positionSize: 0.045,  // 4.5% of capital (Kelly * 0.25)
//   stopLoss: -2%,
//   target: +4% (2:1 R:R)
// }

// Step 5: Execute
if (finalSignal.confidence > 0.65) {
  const trade = {
    instrument: 'NIFTY 21500 CE',
    action: 'BUY',
    quantity: calculateQuantity(accountBalance * finalSignal.positionSize, optionPrice),
    stopLoss: optionPrice * 0.80,  // -20% on option = -2% on capital
    target: optionPrice * 1.40      // +40% on option = +4% on capital
  }

  executeTrade(trade)

  console.log(`
    ✅ TRADE EXECUTED
    Direction: LONG ${trade.instrument}
    Quantity: ${trade.quantity}
    Entry: ₹${optionPrice}
    Stop Loss: ₹${trade.stopLoss}
    Target: ₹${trade.target}
    Risk: 2% | Reward: 4% | R:R = 1:2

    Reasoning:
    ${finalSignal.reasoning.join('\n    ')}
  `)
}
```

---

## Conclusion

### Key Takeaways

1. **Correlation ≠ Causation**
   - Most trading systems use correlation (lagging)
   - Causal models identify true drivers (leading)

2. **100% Prediction Is Impossible**
   - Realistic goal: 60-65% win rate
   - Focus on risk management, not prediction perfection

3. **Hybrid Approach Wins**
   - Causal models (slow, robust) for direction
   - Correlational patterns (fast) for timing
   - Fusion with Bayesian weighting

4. **Risk Management Is King**
   - 2% max loss per trade
   - Kelly criterion position sizing
   - Circuit breakers for black swans

5. **Continuous Learning**
   - Markets evolve → causal structures change
   - Re-test Granger causality monthly
   - Update VAR models with new data

### Expected Outcomes

**Conservative Estimate** (after 6 months):
- Win Rate: 58-62%
- Average R:R: 1:1.8
- Monthly Return: 3-6%
- Max Drawdown: 12-15%
- Sharpe Ratio: 1.2-1.5

**Compared to Pure Correlation**:
- Win Rate: 52-55% → +6-7%
- Max Drawdown: 20-25% → -8-10%
- Fewer "revenge trading" losses from false signals

---

**Bottom Line**: You can't predict markets with 100% accuracy, but you can **stack the odds in your favor** by understanding **causality**, not just correlation. Focus on finding **asymmetric bets** where potential reward >> risk, and let **position sizing + risk management** protect you from inevitable losses.

**"In trading, being right 60% of the time with proper risk management beats being right 80% of the time with poor risk management."**

---

**Generated**: 2026-02-11
**Status**: Research Paper + Implementation Guide
**Next Step**: Implement Granger causality tests on NIFTY options data
