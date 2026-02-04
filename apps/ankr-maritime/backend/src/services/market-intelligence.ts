// market-intelligence.ts
// Market intelligence service: market share tracking, turning-point detection,
// tonnage supply/demand analysis, and arbitrage opportunity identification.
// Pure functions — no DB or Prisma dependency.

// ---------------------------------------------------------------------------
// Types — Inputs
// ---------------------------------------------------------------------------

export interface FixtureCountEntry {
  route: string
  vesselType: string
  count: number
  period: string           // YYYY-MM or ISO date
}

export interface MarketFixtureEntry {
  route: string
  vesselType: string
  totalCount: number
  period: string
}

export interface RateDataPoint {
  date: string             // ISO date
  value: number
}

export interface HeatmapSnapshot {
  region: string
  supply: number           // number of available vessels
  demand: number           // number of open cargoes
  period: string           // YYYY-MM or ISO date
}

export interface RouteRate {
  route: string
  rate: number
  vesselType: string
  distance?: number        // nautical miles (optional, used for triangulation)
  durationDays?: number    // estimated voyage duration
}

// ---------------------------------------------------------------------------
// Types — Outputs
// ---------------------------------------------------------------------------

export interface RouteShare {
  route: string
  share: number            // percentage 0-100
  trend: 'increasing' | 'decreasing' | 'stable'
}

export interface VesselTypeShare {
  type: string
  share: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

export interface MarketShareResult {
  overall: number          // overall market share percentage
  byRoute: RouteShare[]
  byVesselType: VesselTypeShare[]
}

export interface MarketSignal {
  date: string
  type: 'sma_crossover' | 'rsi' | 'bollinger_breakout' | 'support_resistance'
  direction: 'bullish' | 'bearish'
  strength: 'strong' | 'moderate' | 'weak'
  description: string
}

export interface TurningPointResult {
  signals: MarketSignal[]
  currentTrend: 'bullish' | 'bearish' | 'neutral'
  rsi: number
  bollingerPosition: number  // 0-1: where current price sits within bands
}

export interface RegionBalance {
  region: string
  supply: number
  demand: number
  balance: number           // supply - demand (positive = oversupplied)
  classification: 'tight' | 'balanced' | 'oversupplied'
  ratePressure: number      // -100 to +100 (positive = upward pressure on rates)
}

export interface TonnageSupplyDemandResult {
  regions: RegionBalance[]
  overallMarket: {
    totalSupply: number
    totalDemand: number
    balance: number
    classification: 'tight' | 'balanced' | 'oversupplied'
    ratePressure: number
  }
}

export interface ArbitrageOpportunity {
  description: string
  routes: string[]
  differential: number      // USD per day or per MT
  estimatedProfit: number
  riskLevel: 'low' | 'medium' | 'high'
}

export interface ArbitrageResult {
  opportunities: ArbitrageOpportunity[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0
  const avg = mean(values)
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / (values.length - 1)
  return Math.sqrt(variance)
}

/**
 * Parse a period string into { year, month }.
 */
function parsePeriod(period: string): { year: number; month: number } {
  const d = new Date(period)
  if (!isNaN(d.getTime())) {
    return { year: d.getFullYear(), month: d.getMonth() + 1 }
  }
  const parts = period.split('-')
  return {
    year: parseInt(parts[0], 10) || 2025,
    month: parseInt(parts[1], 10) || 1,
  }
}

/**
 * Calculate Simple Moving Average (SMA) over a window size.
 * Returns an array aligned to the end of the input (same length, with NaN for initial periods).
 */
function smaArray(values: number[], window: number): (number | null)[] {
  const result: (number | null)[] = []
  for (let i = 0; i < values.length; i++) {
    if (i < window - 1) {
      result.push(null)
    } else {
      const slice = values.slice(i - window + 1, i + 1)
      result.push(slice.reduce((sum, v) => sum + v, 0) / window)
    }
  }
  return result
}

/**
 * Calculate RSI (Relative Strength Index) for a given period.
 * Returns an array of the same length as input, with null for initial entries.
 *
 * RSI = 100 - (100 / (1 + RS))
 * RS = avg gain / avg loss over the period
 */
function calculateRSI(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [null]  // first value has no change

  if (values.length < 2) return result

  // Calculate changes
  const changes: number[] = []
  for (let i = 1; i < values.length; i++) {
    changes.push(values[i] - values[i - 1])
  }

  let avgGain = 0
  let avgLoss = 0

  for (let i = 0; i < changes.length; i++) {
    const change = changes[i]
    const gain = change > 0 ? change : 0
    const loss = change < 0 ? Math.abs(change) : 0

    if (i < period) {
      // Accumulate for the initial period
      avgGain += gain
      avgLoss += loss

      if (i === period - 1) {
        // First RSI value
        avgGain /= period
        avgLoss /= period
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
        result.push(round(100 - (100 / (1 + rs)), 2))
      } else {
        result.push(null)
      }
    } else {
      // Smoothed RSI (Wilder's method)
      avgGain = (avgGain * (period - 1) + gain) / period
      avgLoss = (avgLoss * (period - 1) + loss) / period
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
      result.push(round(100 - (100 / (1 + rs)), 2))
    }
  }

  return result
}

/**
 * Detect local minima and maxima in a series (support/resistance levels).
 * A point is a local minimum if it is lower than both neighbors.
 * A point is a local maximum if it is higher than both neighbors.
 */
function findLocalExtremes(
  values: number[],
  dates: string[],
): { minima: { date: string; value: number }[]; maxima: { date: string; value: number }[] } {
  const minima: { date: string; value: number }[] = []
  const maxima: { date: string; value: number }[] = []

  for (let i = 1; i < values.length - 1; i++) {
    if (values[i] < values[i - 1] && values[i] < values[i + 1]) {
      minima.push({ date: dates[i], value: values[i] })
    }
    if (values[i] > values[i - 1] && values[i] > values[i + 1]) {
      maxima.push({ date: dates[i], value: values[i] })
    }
  }

  return { minima, maxima }
}

/**
 * Determine trend for a 3-month rolling share series.
 * Compares the most recent value to the average of previous values.
 */
function detectShareTrend(
  shares: number[],
): 'increasing' | 'decreasing' | 'stable' {
  if (shares.length < 2) return 'stable'

  const recent = shares[shares.length - 1]
  const previous = mean(shares.slice(0, -1))

  if (previous === 0) return recent > 0 ? 'increasing' : 'stable'

  const change = (recent - previous) / previous
  if (change > 0.05) return 'increasing'
  if (change < -0.05) return 'decreasing'
  return 'stable'
}

/**
 * Classify a supply-demand balance ratio into a market state.
 * ratio = supply / demand
 */
function classifyBalance(supply: number, demand: number): 'tight' | 'balanced' | 'oversupplied' {
  if (demand === 0) return supply > 0 ? 'oversupplied' : 'balanced'
  const ratio = supply / demand
  if (ratio < 0.85) return 'tight'
  if (ratio > 1.15) return 'oversupplied'
  return 'balanced'
}

/**
 * Compute rate pressure from supply and demand.
 * Returns -100 to +100 where positive means upward pressure on rates.
 *
 * When demand exceeds supply, rates face upward pressure.
 * Pressure = ((demand - supply) / max(demand, supply)) * 100, clamped to [-100, 100].
 */
function computeRatePressure(supply: number, demand: number): number {
  const maxVal = Math.max(supply, demand)
  if (maxVal === 0) return 0
  const pressure = ((demand - supply) / maxVal) * 100
  return round(Math.max(-100, Math.min(100, pressure)))
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate market share from own fixture counts vs total market fixtures.
 *
 * Market share is computed:
 * - Overall: sum(own fixtures) / sum(market fixtures) * 100
 * - By route: own count on route / market count on route * 100
 * - By vessel type: own count for type / market count for type * 100
 *
 * Trend is based on a 3-month rolling average of monthly share values.
 * When multiple periods are present, the trend compares the latest share
 * to the average of prior period shares:
 * - "increasing" if latest share is >5% above prior average
 * - "decreasing" if latest share is >5% below prior average
 * - "stable" otherwise
 */
export function calculateMarketShare(
  fixtureData: FixtureCountEntry[],
  totalMarketFixtures: MarketFixtureEntry[],
): MarketShareResult {
  if (fixtureData.length === 0 || totalMarketFixtures.length === 0) {
    return { overall: 0, byRoute: [], byVesselType: [] }
  }

  // --- Overall market share ---
  const totalOwn = fixtureData.reduce((sum, e) => sum + e.count, 0)
  const totalMarket = totalMarketFixtures.reduce((sum, e) => sum + e.totalCount, 0)
  const overall = totalMarket > 0 ? round((totalOwn / totalMarket) * 100) : 0

  // --- By route ---
  // Aggregate own and market counts per route, per period
  const routeOwnByPeriod = new Map<string, Map<string, number>>()
  const routeMarketByPeriod = new Map<string, Map<string, number>>()

  for (const entry of fixtureData) {
    if (!routeOwnByPeriod.has(entry.route)) {
      routeOwnByPeriod.set(entry.route, new Map())
    }
    const periodMap = routeOwnByPeriod.get(entry.route)!
    periodMap.set(entry.period, (periodMap.get(entry.period) ?? 0) + entry.count)
  }

  for (const entry of totalMarketFixtures) {
    if (!routeMarketByPeriod.has(entry.route)) {
      routeMarketByPeriod.set(entry.route, new Map())
    }
    const periodMap = routeMarketByPeriod.get(entry.route)!
    periodMap.set(entry.period, (periodMap.get(entry.period) ?? 0) + entry.totalCount)
  }

  const allRoutes = new Set([...routeOwnByPeriod.keys(), ...routeMarketByPeriod.keys()])
  const byRoute: RouteShare[] = []

  for (const route of allRoutes) {
    const ownPeriods = routeOwnByPeriod.get(route) ?? new Map()
    const marketPeriods = routeMarketByPeriod.get(route) ?? new Map()

    const totalOwnRoute = [...ownPeriods.values()].reduce((s, v) => s + v, 0)
    const totalMarketRoute = [...marketPeriods.values()].reduce((s, v) => s + v, 0)
    const share = totalMarketRoute > 0 ? round((totalOwnRoute / totalMarketRoute) * 100) : 0

    // Build per-period share series for trend detection
    const allPeriods = [...new Set([...ownPeriods.keys(), ...marketPeriods.keys()])].sort()
    const shareSeries: number[] = allPeriods.map((p) => {
      const own = ownPeriods.get(p) ?? 0
      const market = marketPeriods.get(p) ?? 0
      return market > 0 ? (own / market) * 100 : 0
    })

    byRoute.push({
      route,
      share,
      trend: detectShareTrend(shareSeries),
    })
  }

  // Sort by share descending
  byRoute.sort((a, b) => b.share - a.share)

  // --- By vessel type ---
  const typeOwnByPeriod = new Map<string, Map<string, number>>()
  const typeMarketByPeriod = new Map<string, Map<string, number>>()

  for (const entry of fixtureData) {
    if (!typeOwnByPeriod.has(entry.vesselType)) {
      typeOwnByPeriod.set(entry.vesselType, new Map())
    }
    const periodMap = typeOwnByPeriod.get(entry.vesselType)!
    periodMap.set(entry.period, (periodMap.get(entry.period) ?? 0) + entry.count)
  }

  for (const entry of totalMarketFixtures) {
    if (!typeMarketByPeriod.has(entry.vesselType)) {
      typeMarketByPeriod.set(entry.vesselType, new Map())
    }
    const periodMap = typeMarketByPeriod.get(entry.vesselType)!
    periodMap.set(entry.period, (periodMap.get(entry.period) ?? 0) + entry.totalCount)
  }

  const allTypes = new Set([...typeOwnByPeriod.keys(), ...typeMarketByPeriod.keys()])
  const byVesselType: VesselTypeShare[] = []

  for (const type of allTypes) {
    const ownPeriods = typeOwnByPeriod.get(type) ?? new Map()
    const marketPeriods = typeMarketByPeriod.get(type) ?? new Map()

    const totalOwnType = [...ownPeriods.values()].reduce((s, v) => s + v, 0)
    const totalMarketType = [...marketPeriods.values()].reduce((s, v) => s + v, 0)
    const share = totalMarketType > 0 ? round((totalOwnType / totalMarketType) * 100) : 0

    const allPeriods = [...new Set([...ownPeriods.keys(), ...marketPeriods.keys()])].sort()
    const shareSeries: number[] = allPeriods.map((p) => {
      const own = ownPeriods.get(p) ?? 0
      const market = marketPeriods.get(p) ?? 0
      return market > 0 ? (own / market) * 100 : 0
    })

    byVesselType.push({
      type,
      share,
      trend: detectShareTrend(shareSeries),
    })
  }

  byVesselType.sort((a, b) => b.share - a.share)

  return { overall, byRoute, byVesselType }
}

/**
 * Detect market turning points using technical analysis indicators.
 *
 * Input rate data should be sorted chronologically (oldest first).
 *
 * Indicators:
 *
 * 1. **SMA Crossover (20-day vs 50-day)**
 *    - Bullish (Golden Cross): 20-day SMA crosses above 50-day SMA
 *    - Bearish (Death Cross): 20-day SMA crosses below 50-day SMA
 *
 * 2. **RSI (14-period Relative Strength Index)**
 *    - Overbought (>70): bearish signal — potential reversal downward
 *    - Oversold (<30): bullish signal — potential reversal upward
 *    - Strength is "strong" at extremes (>80 or <20), "moderate" otherwise
 *
 * 3. **Bollinger Band Breakouts (20-period, 2 standard deviations)**
 *    - Upper band breakout: bearish signal (price extended too far above mean)
 *    - Lower band breakout: bullish signal (price dropped below mean band)
 *
 * 4. **Support/Resistance Levels**
 *    - Local minima = support levels (bullish when price approaches from above)
 *    - Local maxima = resistance levels (bearish when price approaches from below)
 *    - Only the 3 most recent levels of each type are reported
 *
 * Current trend is determined by the latest SMA relationship:
 * - 20-day SMA > 50-day SMA => bullish
 * - 20-day SMA < 50-day SMA => bearish
 * - Otherwise (or insufficient data) => neutral
 */
export function detectMarketTurningPoints(
  rateData: RateDataPoint[],
): TurningPointResult {
  const defaultResult: TurningPointResult = {
    signals: [],
    currentTrend: 'neutral',
    rsi: 50,
    bollingerPosition: 0.5,
  }

  if (rateData.length < 5) return defaultResult

  // Sort chronologically (oldest first)
  const sorted = [...rateData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )
  const values = sorted.map((d) => d.value)
  const dates = sorted.map((d) => d.date)

  const signals: MarketSignal[] = []

  // --- SMA Crossover (20-day vs 50-day) ---
  const sma20 = smaArray(values, 20)
  const sma50 = smaArray(values, 50)

  for (let i = 1; i < values.length; i++) {
    const prev20 = sma20[i - 1]
    const curr20 = sma20[i]
    const prev50 = sma50[i - 1]
    const curr50 = sma50[i]

    if (prev20 === null || curr20 === null || prev50 === null || curr50 === null) continue

    // Golden cross: 20-SMA crosses above 50-SMA
    if (prev20 <= prev50 && curr20 > curr50) {
      signals.push({
        date: dates[i],
        type: 'sma_crossover',
        direction: 'bullish',
        strength: 'strong',
        description: `Golden Cross: 20-day SMA (${round(curr20)}) crossed above 50-day SMA (${round(curr50)})`,
      })
    }

    // Death cross: 20-SMA crosses below 50-SMA
    if (prev20 >= prev50 && curr20 < curr50) {
      signals.push({
        date: dates[i],
        type: 'sma_crossover',
        direction: 'bearish',
        strength: 'strong',
        description: `Death Cross: 20-day SMA (${round(curr20)}) crossed below 50-day SMA (${round(curr50)})`,
      })
    }
  }

  // --- RSI (14-period) ---
  const rsiValues = calculateRSI(values, 14)

  for (let i = 0; i < rsiValues.length; i++) {
    const rsi = rsiValues[i]
    if (rsi === null) continue

    if (rsi > 70) {
      // Only signal on the transition into overbought territory
      const prevRsi = i > 0 ? rsiValues[i - 1] : null
      if (prevRsi !== null && prevRsi <= 70) {
        signals.push({
          date: dates[i],
          type: 'rsi',
          direction: 'bearish',
          strength: rsi > 80 ? 'strong' : 'moderate',
          description: `RSI overbought at ${rsi} — potential bearish reversal`,
        })
      }
    }

    if (rsi < 30) {
      const prevRsi = i > 0 ? rsiValues[i - 1] : null
      if (prevRsi !== null && prevRsi >= 30) {
        signals.push({
          date: dates[i],
          type: 'rsi',
          direction: 'bullish',
          strength: rsi < 20 ? 'strong' : 'moderate',
          description: `RSI oversold at ${rsi} — potential bullish reversal`,
        })
      }
    }
  }

  // --- Bollinger Bands (20-period, 2 std dev) ---
  const bbPeriod = 20
  for (let i = bbPeriod - 1; i < values.length; i++) {
    const window = values.slice(i - bbPeriod + 1, i + 1)
    const bbMean = mean(window)
    const bbStd = stddev(window)
    const upperBand = bbMean + 2 * bbStd
    const lowerBand = bbMean - 2 * bbStd

    // Check for breakout (current value vs bands)
    if (values[i] > upperBand) {
      const prevInBand = i > 0 && values[i - 1] <= upperBand
      if (prevInBand) {
        signals.push({
          date: dates[i],
          type: 'bollinger_breakout',
          direction: 'bearish',
          strength: values[i] > bbMean + 2.5 * bbStd ? 'strong' : 'moderate',
          description: `Upper Bollinger Band breakout at ${round(values[i])} (band: ${round(upperBand)})`,
        })
      }
    }

    if (values[i] < lowerBand) {
      const prevInBand = i > 0 && values[i - 1] >= lowerBand
      if (prevInBand) {
        signals.push({
          date: dates[i],
          type: 'bollinger_breakout',
          direction: 'bullish',
          strength: values[i] < bbMean - 2.5 * bbStd ? 'strong' : 'moderate',
          description: `Lower Bollinger Band breakout at ${round(values[i])} (band: ${round(lowerBand)})`,
        })
      }
    }
  }

  // --- Support / Resistance (local extremes) ---
  const { minima, maxima } = findLocalExtremes(values, dates)

  // Report the 3 most recent support levels
  const recentSupports = minima.slice(-3)
  for (const s of recentSupports) {
    signals.push({
      date: s.date,
      type: 'support_resistance',
      direction: 'bullish',
      strength: 'weak',
      description: `Support level identified at ${round(s.value)}`,
    })
  }

  // Report the 3 most recent resistance levels
  const recentResistances = maxima.slice(-3)
  for (const r of recentResistances) {
    signals.push({
      date: r.date,
      type: 'support_resistance',
      direction: 'bearish',
      strength: 'weak',
      description: `Resistance level identified at ${round(r.value)}`,
    })
  }

  // Sort all signals chronologically
  signals.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // --- Current trend from latest SMA relationship ---
  const latest20 = sma20[sma20.length - 1]
  const latest50 = sma50[sma50.length - 1]
  let currentTrend: 'bullish' | 'bearish' | 'neutral' = 'neutral'
  if (latest20 !== null && latest50 !== null) {
    if (latest20 > latest50) currentTrend = 'bullish'
    else if (latest20 < latest50) currentTrend = 'bearish'
  }

  // --- Latest RSI ---
  let latestRsi = 50
  for (let i = rsiValues.length - 1; i >= 0; i--) {
    if (rsiValues[i] !== null) {
      latestRsi = rsiValues[i]!
      break
    }
  }

  // --- Bollinger position (where current price sits within bands) ---
  let bollingerPosition = 0.5
  if (values.length >= bbPeriod) {
    const lastWindow = values.slice(-bbPeriod)
    const bbMean = mean(lastWindow)
    const bbStd = stddev(lastWindow)
    const upperBand = bbMean + 2 * bbStd
    const lowerBand = bbMean - 2 * bbStd
    const bandWidth = upperBand - lowerBand
    if (bandWidth > 0) {
      bollingerPosition = round(
        Math.max(0, Math.min(1, (values[values.length - 1] - lowerBand) / bandWidth)),
        3,
      )
    }
  }

  return {
    signals,
    currentTrend,
    rsi: latestRsi,
    bollingerPosition,
  }
}

/**
 * Analyse tonnage supply vs demand balance across regions.
 *
 * Takes heatmap snapshots (one per region per period) and computes:
 * - Per-region: average supply and demand, balance, classification, rate pressure
 * - Overall market: aggregate across all regions
 *
 * Classification:
 * - "tight": supply/demand ratio < 0.85 (vessel shortage, rates likely rising)
 * - "oversupplied": ratio > 1.15 (surplus tonnage, rates likely falling)
 * - "balanced": ratio between 0.85 and 1.15
 *
 * Rate pressure:
 * - Derived from ((demand - supply) / max(demand, supply)) * 100
 * - Positive pressure = upward pressure on freight rates (demand exceeds supply)
 * - Negative pressure = downward pressure (excess supply)
 * - Range: -100 to +100
 */
export function calculateTonnageSupplyDemand(
  heatmapData: HeatmapSnapshot[],
): TonnageSupplyDemandResult {
  if (heatmapData.length === 0) {
    return {
      regions: [],
      overallMarket: {
        totalSupply: 0,
        totalDemand: 0,
        balance: 0,
        classification: 'balanced',
        ratePressure: 0,
      },
    }
  }

  // Group by region
  const regionMap = new Map<string, HeatmapSnapshot[]>()
  for (const snap of heatmapData) {
    if (!regionMap.has(snap.region)) {
      regionMap.set(snap.region, [])
    }
    regionMap.get(snap.region)!.push(snap)
  }

  const regions: RegionBalance[] = []
  let totalSupply = 0
  let totalDemand = 0

  for (const [region, snapshots] of regionMap) {
    // Use the latest snapshot's values if multiple periods exist,
    // or average across periods for a smoothed view
    const avgSupply = round(mean(snapshots.map((s) => s.supply)))
    const avgDemand = round(mean(snapshots.map((s) => s.demand)))
    const balance = round(avgSupply - avgDemand)
    const classification = classifyBalance(avgSupply, avgDemand)
    const ratePressure = computeRatePressure(avgSupply, avgDemand)

    regions.push({
      region,
      supply: avgSupply,
      demand: avgDemand,
      balance,
      classification,
      ratePressure,
    })

    totalSupply += avgSupply
    totalDemand += avgDemand
  }

  // Sort by rate pressure descending (tightest markets first)
  regions.sort((a, b) => b.ratePressure - a.ratePressure)

  totalSupply = round(totalSupply)
  totalDemand = round(totalDemand)

  return {
    regions,
    overallMarket: {
      totalSupply,
      totalDemand,
      balance: round(totalSupply - totalDemand),
      classification: classifyBalance(totalSupply, totalDemand),
      ratePressure: computeRatePressure(totalSupply, totalDemand),
    },
  }
}

/**
 * Identify freight rate arbitrage opportunities.
 *
 * Analyses:
 *
 * 1. **Rate differentials**: For the same vessel type, compare rates across routes.
 *    If two routes have significantly different rates (>15% differential), the
 *    higher-rate route represents a repositioning opportunity.
 *
 * 2. **Triangulation opportunities**: For three routes A->B, B->C, C->A, if the sum
 *    of the three leg rates exceeds the direct A->C rate by enough margin, a
 *    triangulation play exists. We look for chains where the multi-leg voyage yields
 *    more revenue per day than direct routing.
 *
 * 3. **Ballast bonus opportunities**: Routes with unusually high rates may indicate
 *    positioning opportunities where a ballast leg to reach the load port is justified
 *    by the premium freight rate.
 *
 * Risk levels:
 * - "low": differential > 30%, well-established routes
 * - "medium": differential 15-30%, moderate route familiarity
 * - "high": differential < 15% or involves speculative positioning
 */
export function identifyArbitrageOpportunities(
  rates: RouteRate[],
): ArbitrageResult {
  if (rates.length < 2) {
    return { opportunities: [] }
  }

  const opportunities: ArbitrageOpportunity[] = []

  // --- 1. Rate differentials within the same vessel type ---
  const byVesselType = new Map<string, RouteRate[]>()
  for (const r of rates) {
    if (!byVesselType.has(r.vesselType)) {
      byVesselType.set(r.vesselType, [])
    }
    byVesselType.get(r.vesselType)!.push(r)
  }

  for (const [vesselType, typeRates] of byVesselType) {
    if (typeRates.length < 2) continue

    // Sort by rate descending
    const sorted = [...typeRates].sort((a, b) => b.rate - a.rate)

    // Compare each pair for significant differentials
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const high = sorted[i]
        const low = sorted[j]

        if (low.rate <= 0) continue
        const differential = round(high.rate - low.rate)
        const diffPct = round((differential / low.rate) * 100)

        if (diffPct < 15) continue  // Not significant enough

        // Estimate profit: differential * average duration (if available)
        const avgDuration = mean(
          [high.durationDays, low.durationDays].filter((d): d is number => d !== undefined && d > 0),
        ) || 30

        const estimatedProfit = round(differential * avgDuration)

        let riskLevel: 'low' | 'medium' | 'high'
        if (diffPct > 30) riskLevel = 'low'
        else if (diffPct > 20) riskLevel = 'medium'
        else riskLevel = 'high'

        opportunities.push({
          description: `Rate differential: ${high.route} (${round(high.rate)}) vs ${low.route} (${round(low.rate)}) for ${vesselType} — ${diffPct}% premium`,
          routes: [high.route, low.route],
          differential,
          estimatedProfit,
          riskLevel,
        })
      }
    }
  }

  // --- 2. Triangulation opportunities ---
  // Look for route chains A->B, B->C, C->A based on route naming
  // Route format assumption: "ORIGIN-DEST" or "ORIGIN to DEST"
  const routeEndpoints = new Map<string, { origin: string; dest: string; rate: RouteRate }>()

  for (const r of rates) {
    const parts = r.route.split(/[-–>]|to/i).map((s) => s.trim().toLowerCase()).filter(Boolean)
    if (parts.length >= 2) {
      routeEndpoints.set(r.route, { origin: parts[0], dest: parts[1], rate: r })
    }
  }

  const endpoints = [...routeEndpoints.values()]

  for (let a = 0; a < endpoints.length; a++) {
    for (let b = 0; b < endpoints.length; b++) {
      if (a === b) continue
      // Check if A's destination matches B's origin
      if (endpoints[a].dest !== endpoints[b].origin) continue

      for (let c = 0; c < endpoints.length; c++) {
        if (c === a || c === b) continue
        // Check if B's destination matches C's origin and C's destination matches A's origin
        if (endpoints[b].dest !== endpoints[c].origin) continue
        if (endpoints[c].dest !== endpoints[a].origin) continue

        // We found a triangle: A -> B -> C -> A
        const triRate = endpoints[a].rate.rate + endpoints[b].rate.rate + endpoints[c].rate.rate
        const triDuration = (endpoints[a].rate.durationDays ?? 30)
          + (endpoints[b].rate.durationDays ?? 30)
          + (endpoints[c].rate.durationDays ?? 30)

        // Compare triangle revenue per day vs best single route rate
        const triRevenuePerDay = triDuration > 0 ? triRate / triDuration : 0
        const bestSingleRate = Math.max(
          endpoints[a].rate.rate,
          endpoints[b].rate.rate,
          endpoints[c].rate.rate,
        )
        const bestSingleDuration = Math.max(
          endpoints[a].rate.durationDays ?? 30,
          endpoints[b].rate.durationDays ?? 30,
          endpoints[c].rate.durationDays ?? 30,
        )
        const singleRevenuePerDay = bestSingleDuration > 0 ? bestSingleRate / bestSingleDuration : 0

        if (triRevenuePerDay > singleRevenuePerDay * 1.1) {
          const differential = round(triRevenuePerDay - singleRevenuePerDay)
          opportunities.push({
            description: `Triangulation: ${endpoints[a].rate.route} -> ${endpoints[b].rate.route} -> ${endpoints[c].rate.route} yields ${round(triRevenuePerDay)}/day vs ${round(singleRevenuePerDay)}/day single route`,
            routes: [
              endpoints[a].rate.route,
              endpoints[b].rate.route,
              endpoints[c].rate.route,
            ],
            differential,
            estimatedProfit: round(differential * triDuration),
            riskLevel: 'medium',
          })
        }
      }
    }
  }

  // --- 3. Ballast bonus opportunities ---
  // Identify routes with rates significantly above the mean for their vessel type
  for (const [vesselType, typeRates] of byVesselType) {
    if (typeRates.length < 3) continue

    const avgRate = mean(typeRates.map((r) => r.rate))
    const sd = stddev(typeRates.map((r) => r.rate))

    for (const r of typeRates) {
      // Route rate is more than 1.5 standard deviations above the mean
      if (sd > 0 && r.rate > avgRate + 1.5 * sd) {
        const premium = round(r.rate - avgRate)
        const premiumPct = round((premium / avgRate) * 100)
        const estimatedBallastCost = round(avgRate * 0.3)  // rough estimate: 30% of avg rate
        const netProfit = round(premium - estimatedBallastCost)

        if (netProfit > 0) {
          opportunities.push({
            description: `Ballast bonus opportunity: ${r.route} (${vesselType}) at ${round(r.rate)} — ${premiumPct}% above market avg (${round(avgRate)}). Net after estimated ballast: ${netProfit}`,
            routes: [r.route],
            differential: premium,
            estimatedProfit: netProfit * (r.durationDays ?? 30),
            riskLevel: premiumPct > 40 ? 'low' : premiumPct > 25 ? 'medium' : 'high',
          })
        }
      }
    }
  }

  // Sort opportunities by estimated profit descending
  opportunities.sort((a, b) => b.estimatedProfit - a.estimatedProfit)

  return { opportunities }
}
