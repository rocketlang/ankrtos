// ffa-valuation.ts
// Maritime FFA (Forward Freight Agreement) valuation and risk management service.
// Mark-to-market, Value-at-Risk, Greeks, portfolio risk, and hedge ratio analysis.
// Pure functions — no DB or Prisma dependency.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FFAPosition {
  entryPrice: number
  currentPrice: number
  quantity: number
  lotSize: number
  direction: 'long' | 'short'
}

export interface MTMResult {
  mtmValue: number
  percentReturn: number
  dollarReturn: number
}

export interface VaRResult {
  var: number
  cvar: number
}

export interface GreeksInput {
  quantity: number
  lotSize: number
  daysToExpiry: number
  volatility: number
  entryPrice: number
  currentPrice: number
}

export interface GreeksResult {
  delta: number
  gamma: number
  theta: number
  vega: number
}

export interface PortfolioPosition {
  route: string
  direction: string
  quantity: number
  lotSize: number
  entryPrice: number
  currentPrice: number
}

export interface RouteConcentration {
  route: string
  exposure: number
  percent: number
}

export interface PortfolioRiskResult {
  netExposure: number
  grossExposure: number
  longExposure: number
  shortExposure: number
  concentrationByRoute: RouteConcentration[]
}

export interface HedgeRatioResult {
  hedgeRatio: number
  basisRisk: number
  recommendation: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

/**
 * Compute the mean of an array of numbers.
 * Returns 0 for an empty array.
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/**
 * Compute the sample standard deviation (N-1 denominator).
 * Returns 0 for arrays with fewer than 2 elements.
 */
function stddev(values: number[]): number {
  if (values.length < 2) return 0
  const avg = mean(values)
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / (values.length - 1)
  return Math.sqrt(variance)
}

/**
 * Standard normal probability density function (phi).
 * phi(x) = (1 / sqrt(2*pi)) * exp(-x^2 / 2)
 */
function normalPDF(x: number): number {
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x)
}

/**
 * Map a confidence level to the corresponding z-score for VaR calculation.
 * Common values: 0.95 -> 1.645, 0.99 -> 2.326.
 * For other levels, uses a rational approximation of the inverse normal CDF.
 */
function zScoreForConfidence(confidence: number): number {
  // Use well-known z-scores for standard confidence levels
  if (Math.abs(confidence - 0.99) < 0.001) return 2.326
  if (Math.abs(confidence - 0.975) < 0.001) return 1.96
  if (Math.abs(confidence - 0.95) < 0.001) return 1.645
  if (Math.abs(confidence - 0.90) < 0.001) return 1.282

  // Rational approximation (Abramowitz and Stegun formula 26.2.23)
  // for the inverse of the standard normal CDF.
  const p = 1 - confidence
  if (p <= 0 || p >= 1) return 0

  const t = Math.sqrt(-2 * Math.log(p))
  const c0 = 2.515517
  const c1 = 0.802853
  const c2 = 0.010328
  const d1 = 1.432788
  const d2 = 0.189269
  const d3 = 0.001308
  return round(t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t), 4)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate Mark-to-Market (MTM) for an FFA position.
 *
 * MTM value represents the unrealised P&L of a position based on the
 * difference between the current market price and the entry price,
 * scaled by quantity and lot size.
 *
 * For long positions the holder profits when prices rise; for short
 * positions the holder profits when prices fall.
 *
 * mtmValue     = (currentPrice - entryPrice) * quantity * lotSize * directionMultiplier
 * percentReturn = ((currentPrice / entryPrice) - 1) * 100 * directionMultiplier
 * dollarReturn  = mtmValue
 */
export function calculateMTM(position: FFAPosition): MTMResult {
  const { entryPrice, currentPrice, quantity, lotSize, direction } = position
  const directionMultiplier = direction === 'long' ? 1 : -1

  if (entryPrice === 0) {
    return { mtmValue: 0, percentReturn: 0, dollarReturn: 0 }
  }

  const mtmValue = round((currentPrice - entryPrice) * quantity * lotSize * directionMultiplier)
  const percentReturn = round(((currentPrice / entryPrice) - 1) * 100 * directionMultiplier, 4)
  const dollarReturn = mtmValue

  return { mtmValue, percentReturn, dollarReturn }
}

/**
 * Calculate Value-at-Risk (VaR) and Conditional VaR (CVaR / Expected Shortfall).
 *
 * Two methods are supported:
 *
 * **Historical** — sort returns ascending, pick the percentile.
 *   VaR  = returns[floor((1 - confidence) * n)]
 *   CVaR = mean of all returns at or below the VaR threshold
 *
 * **Parametric** (variance-covariance) — assumes normally distributed returns.
 *   VaR  = mean - z * stddev
 *   CVaR = mean - stddev * (phi(z) / (1 - confidence))
 *   where phi is the standard normal PDF and z is the z-score for the given confidence.
 *
 * Returns are expected as decimal fractions (e.g. -0.02 for a 2% loss).
 * VaR and CVaR are returned as negative numbers (losses).
 */
export function calculateVaR(
  returns: number[],
  confidence: number,
  method: 'historical' | 'parametric',
): VaRResult {
  if (returns.length === 0) {
    return { var: 0, cvar: 0 }
  }

  // Clamp confidence to a sensible range
  const conf = Math.max(0.01, Math.min(confidence, 0.999))

  if (method === 'historical') {
    // --- Historical simulation ---
    const sorted = [...returns].sort((a, b) => a - b)
    const n = sorted.length
    const index = Math.floor((1 - conf) * n)
    const varValue = round(sorted[Math.max(index, 0)], 6)

    // CVaR: mean of all observations at or below the VaR threshold
    const tailReturns = sorted.filter((r) => r <= varValue)
    const cvarValue = tailReturns.length > 0 ? round(mean(tailReturns), 6) : varValue

    return { var: varValue, cvar: cvarValue }
  }

  // --- Parametric (variance-covariance) ---
  const mu = mean(returns)
  const sigma = stddev(returns)

  if (sigma === 0) {
    return { var: round(mu, 6), cvar: round(mu, 6) }
  }

  const z = zScoreForConfidence(conf)
  const varValue = round(mu - z * sigma, 6)
  const cvarValue = round(mu - sigma * (normalPDF(z) / (1 - conf)), 6)

  return { var: varValue, cvar: cvarValue }
}

/**
 * Calculate simplified Greeks for an FFA (futures) position.
 *
 * FFAs are linear derivatives, so the Greeks are simpler than for options:
 *
 * - **Delta**: Sensitivity to underlying price changes.
 *   Always +1 for a long future and -1 for a short future.
 *   Here we return the absolute delta = 1 for a single lot.
 *
 * - **Gamma**: Rate of change of delta. Zero for linear instruments.
 *
 * - **Theta**: Time-decay estimate. For a futures position this represents
 *   the daily P&L erosion due to cost-of-carry / roll yield.
 *   Approximation: notional * annualised volatility / sqrt(252).
 *
 * - **Vega**: Sensitivity to a 1-percentage-point change in implied volatility.
 *   Approximation: notional * sqrt(daysToExpiry / 252) / 100.
 */
export function calculateGreeks(position: GreeksInput): GreeksResult {
  const { quantity, lotSize, daysToExpiry, volatility, currentPrice } = position
  const notional = quantity * lotSize * currentPrice

  // Delta: 1.0 for linear futures
  const delta = round(1.0, 4)

  // Gamma: 0 for linear instruments
  const gamma = 0

  // Theta: daily time-decay estimate
  // notional * annualised vol / sqrt(252) gives a dollar-per-day figure
  const annualisedVol = volatility > 0 ? volatility : 0
  const theta = notional > 0 ? round(notional * annualisedVol / Math.sqrt(252), 2) : 0

  // Vega: sensitivity to 1pp change in vol
  const daysClamp = Math.max(daysToExpiry, 0)
  const vega = notional > 0 ? round(notional * Math.sqrt(daysClamp / 252) / 100, 2) : 0

  return { delta, gamma, theta, vega }
}

/**
 * Analyse portfolio-level risk across multiple FFA positions.
 *
 * Calculates:
 * - **Long exposure**: sum of notional for all long positions
 * - **Short exposure**: sum of notional for all short positions
 * - **Net exposure**: long - short (positive = net long, negative = net short)
 * - **Gross exposure**: long + short
 * - **Concentration by route**: grouped and sorted by absolute exposure descending,
 *   with each route's percentage of gross exposure
 */
export function calculatePortfolioRisk(
  positions: PortfolioPosition[],
): PortfolioRiskResult {
  if (positions.length === 0) {
    return {
      netExposure: 0,
      grossExposure: 0,
      longExposure: 0,
      shortExposure: 0,
      concentrationByRoute: [],
    }
  }

  let longExposure = 0
  let shortExposure = 0

  // Route -> exposure accumulator (signed)
  const routeExposures = new Map<string, number>()

  for (const pos of positions) {
    const notional = pos.quantity * pos.lotSize * pos.currentPrice
    const isLong = pos.direction.toLowerCase() === 'long'

    if (isLong) {
      longExposure += notional
    } else {
      shortExposure += notional
    }

    // Accumulate signed exposure per route (long positive, short negative)
    const signedNotional = isLong ? notional : -notional
    const current = routeExposures.get(pos.route) ?? 0
    routeExposures.set(pos.route, current + signedNotional)
  }

  const netExposure = round(longExposure - shortExposure)
  const grossExposure = round(longExposure + shortExposure)
  longExposure = round(longExposure)
  shortExposure = round(shortExposure)

  // Build concentration array — use absolute exposure for sorting and percentage
  const concentrationByRoute: RouteConcentration[] = []
  for (const [route, signedExposure] of routeExposures) {
    const absExposure = Math.abs(signedExposure)
    concentrationByRoute.push({
      route,
      exposure: round(signedExposure),
      percent: grossExposure > 0 ? round((absExposure / grossExposure) * 100, 2) : 0,
    })
  }

  // Sort by absolute exposure descending
  concentrationByRoute.sort((a, b) => Math.abs(b.exposure) - Math.abs(a.exposure))

  return {
    netExposure,
    grossExposure,
    longExposure,
    shortExposure,
    concentrationByRoute,
  }
}

/**
 * Suggest an optimal hedge ratio comparing physical and paper (FFA) exposure.
 *
 * The hedge ratio indicates what fraction of the physical cargo exposure
 * is covered by paper (FFA) positions.
 *
 * - hedgeRatio = paperExposure / physicalExposure (clamped to 0–2)
 * - basisRisk  = |1 - hedgeRatio| * physicalExposure
 *   (the dollar amount of exposure that remains due to imperfect hedging)
 *
 * Recommendation bands:
 * - < 0.5:   "Under-hedged — significant freight risk remains"
 * - 0.5–0.8: "Partially hedged — moderate residual exposure"
 * - 0.8–1.2: "Well hedged — exposure is adequately covered"
 * - > 1.2:   "Over-hedged — speculative paper surplus"
 */
export function suggestHedgeRatio(
  physicalExposure: number,
  paperExposure: number,
): HedgeRatioResult {
  if (physicalExposure === 0) {
    return {
      hedgeRatio: 0,
      basisRisk: 0,
      recommendation: paperExposure > 0
        ? 'Over-hedged — speculative paper surplus'
        : 'No physical exposure to hedge',
    }
  }

  // Clamp the ratio between 0 and 2
  const rawRatio = paperExposure / physicalExposure
  const hedgeRatio = round(Math.max(0, Math.min(rawRatio, 2)), 4)

  const basisRisk = round(Math.abs(1 - hedgeRatio) * physicalExposure)

  let recommendation: string
  if (hedgeRatio < 0.5) {
    recommendation = 'Under-hedged — significant freight risk remains'
  } else if (hedgeRatio < 0.8) {
    recommendation = 'Partially hedged — moderate residual exposure'
  } else if (hedgeRatio <= 1.2) {
    recommendation = 'Well hedged — exposure is adequately covered'
  } else {
    recommendation = 'Over-hedged — speculative paper surplus'
  }

  return { hedgeRatio, basisRisk, recommendation }
}
