// market-analysis.ts
// Maritime market analysis: freight trend analysis, route economics comparison, market spread calculation.
// Pure functions — no DB or Prisma dependency.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FreightTrendResult {
  trend: 'bullish' | 'bearish' | 'sideways'
  movingAvg7: number
  movingAvg30: number
  volatility: number
  support: number
  resistance: number
}

export interface RouteEconomicsInput {
  route: string
  rate: number
  distance: number
  days: number
  portCost: number
}

export interface RouteEconomicsResult {
  route: string
  netRevenue: number
  tcePerDay: number
  rank: number
}

export interface MarketSpreadResult {
  spread: number
  spreadPct: number
  recommendation: 'spot' | 'tc' | 'neutral'
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

function movingAverage(values: number[], window: number): number {
  if (values.length === 0) return 0
  const slice = values.slice(0, Math.min(window, values.length))
  return round(slice.reduce((sum, v) => sum + v, 0) / slice.length)
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1)
  return round(Math.sqrt(variance))
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyze freight index trend using technical analysis.
 *
 * Expects indices sorted by date descending (most recent first).
 * Uses moving averages (7-day and 30-day), volatility (standard deviation),
 * and support/resistance levels (min/max in the window).
 *
 * Trend determination:
 * - bullish: 7-day MA > 30-day MA and latest value above 7-day MA
 * - bearish: 7-day MA < 30-day MA and latest value below 7-day MA
 * - sideways: otherwise
 */
export function analyzeFreightTrend(
  indices: Array<{ date: Date; value: number }>,
): FreightTrendResult {
  if (indices.length === 0) {
    return { trend: 'sideways', movingAvg7: 0, movingAvg30: 0, volatility: 0, support: 0, resistance: 0 }
  }

  // Sort by date descending (most recent first) to ensure correct ordering
  const sorted = [...indices].sort((a, b) => b.date.getTime() - a.date.getTime())
  const values = sorted.map((i) => i.value)

  const ma7 = movingAverage(values, 7)
  const ma30 = movingAverage(values, 30)
  const volatility = standardDeviation(values.slice(0, 30))

  // Support = lowest value in window, Resistance = highest
  const windowValues = values.slice(0, Math.min(30, values.length))
  const support = round(Math.min(...windowValues))
  const resistance = round(Math.max(...windowValues))

  const latestValue = values[0]
  let trend: 'bullish' | 'bearish' | 'sideways' = 'sideways'

  if (ma7 > ma30 && latestValue > ma7) {
    trend = 'bullish'
  } else if (ma7 < ma30 && latestValue < ma7) {
    trend = 'bearish'
  }

  return { trend, movingAvg7: ma7, movingAvg30: ma30, volatility, support, resistance }
}

/**
 * Compare route economics by calculating TCE (Time Charter Equivalent) per day.
 *
 * TCE = (net revenue) / voyage days
 * Net revenue = (rate * distance_factor) - port costs - bunker estimate
 *
 * For simplicity, rate is assumed to be the gross freight in USD.
 * Results are sorted by TCE descending and ranked.
 */
export function compareRouteEconomics(
  routes: Array<RouteEconomicsInput>,
): Array<RouteEconomicsResult> {
  const results = routes.map((r) => {
    // Net revenue: rate minus port costs
    // In a real scenario, rate could be per MT, but here we use gross revenue
    const netRevenue = round(r.rate - r.portCost)
    const tcePerDay = r.days > 0 ? round(netRevenue / r.days) : 0

    return {
      route: r.route,
      netRevenue,
      tcePerDay,
      rank: 0, // assigned after sorting
    }
  })

  // Sort by TCE descending
  results.sort((a, b) => b.tcePerDay - a.tcePerDay)

  // Assign ranks
  for (let i = 0; i < results.length; i++) {
    results[i].rank = i + 1
  }

  return results
}

/**
 * Calculate market spread between spot and time-charter rates.
 *
 * Spread = spotRate - tcRate
 * Recommendation logic:
 * - If spread > 15% of TC rate → recommend spot (market is paying premium for spot)
 * - If spread < -15% of TC rate → recommend TC (TC is at premium, lock it in)
 * - Otherwise → neutral
 *
 * Vessel type is provided for context but the core logic is the same across types.
 */
export function calculateMarketSpread(
  spotRate: number,
  tcRate: number,
  _vesselType: string,
): MarketSpreadResult {
  const spread = round(spotRate - tcRate)
  const spreadPct = tcRate !== 0 ? round((spread / tcRate) * 100) : 0

  let recommendation: 'spot' | 'tc' | 'neutral' = 'neutral'
  if (spreadPct > 15) {
    recommendation = 'spot'
  } else if (spreadPct < -15) {
    recommendation = 'tc'
  }

  return { spread, spreadPct, recommendation }
}
