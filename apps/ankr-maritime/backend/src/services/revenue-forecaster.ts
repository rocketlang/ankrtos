// revenue-forecaster.ts
// Revenue forecasting, variance analysis, cash flow projection, and breakeven calculation.
// Analytics & BI service for financial planning and performance measurement.
// Pure functions — no DB or Prisma dependency.

// ---------------------------------------------------------------------------
// Types — Inputs
// ---------------------------------------------------------------------------

export interface HistoricalRevenueEntry {
  period: string      // ISO date or YYYY-MM format
  category: string
  amount: number
}

export interface VarianceEntry {
  projected: number
  actual: number
  category: string
  period: string      // ISO date or YYYY-MM format
}

export interface CashFlowEntry {
  date: string        // ISO date
  type: 'inflow' | 'outflow'
  category: string
  amount: number      // always positive; type determines sign
}

export interface VoyageMetrics {
  avgDurationDays: number
  avgFreightRevenue: number
  avgBunkerCost: number
  avgPortCost: number
  commissionPct: number
  currentTce: number
}

// ---------------------------------------------------------------------------
// Types — Outputs
// ---------------------------------------------------------------------------

export interface ForecastEntry {
  year: number
  month: number
  category: string
  projectedAmount: number
  confidence: number           // 0-1 scale
  methodology: string
}

export interface ForecastResult {
  forecasts: ForecastEntry[]
}

export interface CategoryVariance {
  category: string
  totalProjected: number
  totalActual: number
  variance: number
  variancePct: number
  trend: 'improving' | 'declining' | 'stable'
}

export interface VarianceAnalysisResult {
  totalVariance: number
  variancePct: number
  mape: number
  byCategory: CategoryVariance[]
  largestOverperformance: CategoryVariance | null
  largestUnderperformance: CategoryVariance | null
}

export interface CashFlowProjectionEntry {
  date: string
  type: 'inflow' | 'outflow'
  category: string
  amount: number
  isRecurring: boolean
}

export interface CumulativeBalanceEntry {
  month: string       // YYYY-MM format
  balance: number
}

export interface CashFlowProjectionResult {
  projections: CashFlowProjectionEntry[]
  cumulativeBalance: CumulativeBalanceEntry[]
}

export interface BreakevenResult {
  breakevenTce: number
  breakevenFreight: number
  safetyMargin10: number
  safetyMargin20: number
  currentTce: number
  cushion: number              // percentage above breakeven
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
 * Accepts YYYY-MM or ISO date strings.
 */
function parsePeriod(period: string): { year: number; month: number } {
  const d = new Date(period)
  if (!isNaN(d.getTime())) {
    return { year: d.getFullYear(), month: d.getMonth() + 1 }
  }
  // Fallback: try YYYY-MM
  const parts = period.split('-')
  return {
    year: parseInt(parts[0], 10) || 2025,
    month: parseInt(parts[1], 10) || 1,
  }
}

/**
 * Advance a { year, month } by N months.
 */
function advanceMonth(year: number, month: number, n: number): { year: number; month: number } {
  const totalMonths = (year * 12 + (month - 1)) + n
  return {
    year: Math.floor(totalMonths / 12),
    month: (totalMonths % 12) + 1,
  }
}

/**
 * Format { year, month } as YYYY-MM.
 */
function formatYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

/**
 * Group historical entries by category, then by month (1-12).
 * Returns a map: category -> month -> amount[].
 */
function groupByCategoryAndMonth(
  data: HistoricalRevenueEntry[],
): Map<string, Map<number, number[]>> {
  const result = new Map<string, Map<number, number[]>>()

  for (const entry of data) {
    const { month } = parsePeriod(entry.period)
    if (!result.has(entry.category)) {
      result.set(entry.category, new Map())
    }
    const monthMap = result.get(entry.category)!
    if (!monthMap.has(month)) {
      monthMap.set(month, [])
    }
    monthMap.get(month)!.push(entry.amount)
  }

  return result
}

/**
 * Sort entries chronologically and return amounts in order.
 */
function sortedAmountsByPeriod(data: HistoricalRevenueEntry[]): number[] {
  const sorted = [...data].sort((a, b) => {
    const pa = parsePeriod(a.period)
    const pb = parsePeriod(b.period)
    const ka = pa.year * 100 + pa.month
    const kb = pb.year * 100 + pb.month
    return ka - kb
  })
  return sorted.map((e) => e.amount)
}

/**
 * Calculate simple moving average over the last `window` values.
 */
function simpleMovingAverage(values: number[], window: number): number {
  if (values.length === 0) return 0
  const slice = values.slice(-Math.min(window, values.length))
  return slice.reduce((sum, v) => sum + v, 0) / slice.length
}

/**
 * Calculate seasonal adjustment ratios for each month (1-12).
 * Ratio = average for that month / overall average.
 * A ratio of 1.2 means that month is typically 20% above average.
 */
function seasonalRatios(monthMap: Map<number, number[]>): Map<number, number> {
  const allValues: number[] = []
  for (const amounts of monthMap.values()) {
    allValues.push(...amounts)
  }
  const overallAvg = mean(allValues)
  if (overallAvg === 0) {
    const result = new Map<number, number>()
    for (let m = 1; m <= 12; m++) result.set(m, 1)
    return result
  }

  const ratios = new Map<number, number>()
  for (let m = 1; m <= 12; m++) {
    const monthAmounts = monthMap.get(m) ?? []
    if (monthAmounts.length === 0) {
      ratios.set(m, 1)
    } else {
      ratios.set(m, mean(monthAmounts) / overallAvg)
    }
  }
  return ratios
}

/**
 * Calculate confidence based on historical variance.
 * Lower variance relative to the mean yields higher confidence.
 * Returns a value between 0.1 and 0.95.
 */
function calculateConfidence(values: number[]): number {
  if (values.length < 2) return 0.5
  const avg = mean(values)
  if (avg === 0) return 0.5
  const cv = stddev(values) / Math.abs(avg)  // coefficient of variation
  // Map CV to confidence: CV=0 -> 0.95, CV>=2 -> 0.1
  const confidence = Math.max(0.1, Math.min(0.95, 1 - (cv * 0.425)))
  return round(confidence, 3)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Forecast revenue for the next N months using historical data.
 *
 * Methodology:
 * 1. Group historical data by category.
 * 2. For each category, compute a 3-month simple moving average (SMA) as the base forecast.
 * 3. Apply seasonal adjustment ratios derived from month-over-month historical patterns.
 * 4. Calculate confidence intervals based on historical variance within each category.
 *
 * The forecast for each future month:
 *   projectedAmount = SMA(last 3 months) * seasonalRatio(target month)
 *
 * Confidence is derived from the coefficient of variation of the category's historical data.
 * Lower historical variance produces higher confidence.
 */
export function forecastRevenue(
  historicalData: HistoricalRevenueEntry[],
  months: number,
): ForecastResult {
  if (historicalData.length === 0 || months <= 0) {
    return { forecasts: [] }
  }

  const forecasts: ForecastEntry[] = []

  // Determine the latest period across all categories to anchor the forecast start
  let latestYear = 0
  let latestMonth = 0
  for (const entry of historicalData) {
    const { year, month } = parsePeriod(entry.period)
    const key = year * 100 + month
    if (key > latestYear * 100 + latestMonth) {
      latestYear = year
      latestMonth = month
    }
  }

  // Get unique categories
  const categories = [...new Set(historicalData.map((e) => e.category))]

  // Group by category and month for seasonal analysis
  const categoryMonthMap = groupByCategoryAndMonth(historicalData)

  for (const category of categories) {
    const categoryData = historicalData.filter((e) => e.category === category)
    const amounts = sortedAmountsByPeriod(categoryData)

    // Base forecast: 3-month SMA of the most recent values
    const sma = simpleMovingAverage(amounts, 3)

    // Seasonal ratios for this category
    const monthMap = categoryMonthMap.get(category) ?? new Map()
    const ratios = seasonalRatios(monthMap)

    // Confidence from historical variance
    const confidence = calculateConfidence(amounts)

    // Generate forecasts for N months ahead
    for (let i = 1; i <= months; i++) {
      const { year, month } = advanceMonth(latestYear, latestMonth, i)
      const ratio = ratios.get(month) ?? 1
      const projectedAmount = round(sma * ratio)

      forecasts.push({
        year,
        month,
        category,
        projectedAmount,
        confidence,
        methodology: `SMA(3) with seasonal adjustment (ratio=${round(ratio, 3)})`,
      })
    }
  }

  // Sort by year, month, then category for a clean output
  forecasts.sort((a, b) => {
    const keyA = a.year * 100 + a.month
    const keyB = b.year * 100 + b.month
    if (keyA !== keyB) return keyA - keyB
    return a.category.localeCompare(b.category)
  })

  return { forecasts }
}

/**
 * Perform variance analysis comparing projected vs actual figures.
 *
 * Computes:
 * - Total variance (absolute and percentage)
 * - MAPE (Mean Absolute Percentage Error) for forecast accuracy assessment
 * - Per-category breakdown with trend detection
 * - Identification of largest over- and under-performers
 *
 * Trend detection (per category, when multiple periods exist):
 * - Compares variance of the most recent half of entries to the earlier half.
 * - "improving": recent absolute variance is lower (forecasts are getting better).
 * - "declining": recent absolute variance is higher (forecasts are getting worse).
 * - "stable": no significant change (within 5% tolerance).
 *
 * MAPE = (1/n) * SUM(|actual - projected| / |actual|) * 100
 * Entries where actual is zero are excluded from MAPE to avoid division by zero.
 */
export function calculateVarianceAnalysis(
  forecasts: VarianceEntry[],
): VarianceAnalysisResult {
  if (forecasts.length === 0) {
    return {
      totalVariance: 0,
      variancePct: 0,
      mape: 0,
      byCategory: [],
      largestOverperformance: null,
      largestUnderperformance: null,
    }
  }

  // --- Totals ---
  let totalProjected = 0
  let totalActual = 0

  for (const f of forecasts) {
    totalProjected += f.projected
    totalActual += f.actual
  }

  const totalVariance = round(totalActual - totalProjected)
  const variancePct = totalProjected !== 0
    ? round((totalVariance / Math.abs(totalProjected)) * 100)
    : 0

  // --- MAPE ---
  const apeValues: number[] = []
  for (const f of forecasts) {
    if (f.actual !== 0) {
      apeValues.push(Math.abs(f.actual - f.projected) / Math.abs(f.actual))
    }
  }
  const mape = apeValues.length > 0 ? round(mean(apeValues) * 100) : 0

  // --- By category ---
  const categoryMap = new Map<string, VarianceEntry[]>()
  for (const f of forecasts) {
    if (!categoryMap.has(f.category)) {
      categoryMap.set(f.category, [])
    }
    categoryMap.get(f.category)!.push(f)
  }

  const byCategory: CategoryVariance[] = []

  for (const [category, entries] of categoryMap) {
    const catProjected = entries.reduce((sum, e) => sum + e.projected, 0)
    const catActual = entries.reduce((sum, e) => sum + e.actual, 0)
    const catVariance = round(catActual - catProjected)
    const catVariancePct = catProjected !== 0
      ? round((catVariance / Math.abs(catProjected)) * 100)
      : 0

    // Trend detection: compare absolute variance of recent vs earlier periods
    let trend: 'improving' | 'declining' | 'stable' = 'stable'
    if (entries.length >= 4) {
      // Sort chronologically
      const sorted = [...entries].sort((a, b) => {
        const pa = parsePeriod(a.period)
        const pb = parsePeriod(b.period)
        return (pa.year * 100 + pa.month) - (pb.year * 100 + pb.month)
      })

      const midpoint = Math.floor(sorted.length / 2)
      const earlier = sorted.slice(0, midpoint)
      const recent = sorted.slice(midpoint)

      const earlierAbsVariance = mean(earlier.map((e) => Math.abs(e.actual - e.projected)))
      const recentAbsVariance = mean(recent.map((e) => Math.abs(e.actual - e.projected)))

      if (earlierAbsVariance > 0) {
        const change = (recentAbsVariance - earlierAbsVariance) / earlierAbsVariance
        if (change < -0.05) {
          trend = 'improving'
        } else if (change > 0.05) {
          trend = 'declining'
        }
      }
    }

    byCategory.push({
      category,
      totalProjected: round(catProjected),
      totalActual: round(catActual),
      variance: catVariance,
      variancePct: catVariancePct,
      trend,
    })
  }

  // Sort by variance descending (largest overperformance first)
  byCategory.sort((a, b) => b.variance - a.variance)

  // Largest over/under performers
  const largestOverperformance = byCategory.length > 0 && byCategory[0].variance > 0
    ? byCategory[0]
    : null

  const largestUnderperformance = byCategory.length > 0 && byCategory[byCategory.length - 1].variance < 0
    ? byCategory[byCategory.length - 1]
    : null

  return {
    totalVariance,
    variancePct,
    mape,
    byCategory,
    largestOverperformance,
    largestUnderperformance,
  }
}

/**
 * Project future cash flows based on historical entries.
 *
 * Methodology:
 * 1. Identify recurring items: categories that appear in 3+ distinct months are
 *    considered recurring. Their projected amount is the average of historical values.
 * 2. One-time items (fewer than 3 months) are excluded from projections.
 * 3. Seasonal patterns are applied:
 *    - Q4 (Oct-Dec): hire payments scaled up by 15% (seasonal crew bonuses, etc.)
 *    - Q1 (Jan-Mar): ETS/emission payments added as an outflow
 *    - Q2/Q3: standard baseline
 * 4. Cumulative balance is calculated month by month starting from the sum of
 *    all historical entries (treated as the opening balance).
 *
 * Seasonal adjustments are domain-specific to maritime operations:
 * - Q4 hire premiums reflect winter crew retention and holiday bonuses
 * - Q1 ETS payments align with EU Emissions Trading System annual settlement
 */
export function projectCashFlow(
  entries: CashFlowEntry[],
  months: number,
): CashFlowProjectionResult {
  if (entries.length === 0 || months <= 0) {
    return { projections: [], cumulativeBalance: [] }
  }

  // --- Determine which categories are recurring ---
  // A category is recurring if it appears in 3+ distinct months
  const categoryMonthSets = new Map<string, Set<string>>()
  const categoryTypeMap = new Map<string, 'inflow' | 'outflow'>()
  const categoryAmounts = new Map<string, number[]>()

  for (const entry of entries) {
    const { year, month } = parsePeriod(entry.date)
    const monthKey = formatYearMonth(year, month)

    if (!categoryMonthSets.has(entry.category)) {
      categoryMonthSets.set(entry.category, new Set())
      categoryTypeMap.set(entry.category, entry.type)
      categoryAmounts.set(entry.category, [])
    }
    categoryMonthSets.get(entry.category)!.add(monthKey)
    categoryAmounts.get(entry.category)!.push(entry.amount)
  }

  const recurringCategories = new Set<string>()
  for (const [category, monthSet] of categoryMonthSets) {
    if (monthSet.size >= 3) {
      recurringCategories.add(category)
    }
  }

  // --- Determine the latest month in the data ---
  let latestYear = 0
  let latestMonth = 0
  for (const entry of entries) {
    const { year, month } = parsePeriod(entry.date)
    if (year * 100 + month > latestYear * 100 + latestMonth) {
      latestYear = year
      latestMonth = month
    }
  }

  // --- Calculate opening balance from historical entries ---
  let openingBalance = 0
  for (const entry of entries) {
    openingBalance += entry.type === 'inflow' ? entry.amount : -entry.amount
  }

  // --- Generate projections ---
  const projections: CashFlowProjectionEntry[] = []
  const cumulativeBalance: CumulativeBalanceEntry[] = []
  let runningBalance = round(openingBalance)

  for (let i = 1; i <= months; i++) {
    const { year, month } = advanceMonth(latestYear, latestMonth, i)
    const dateStr = `${formatYearMonth(year, month)}-15` // mid-month placeholder
    let monthNet = 0

    for (const category of recurringCategories) {
      const amounts = categoryAmounts.get(category) ?? []
      const type = categoryTypeMap.get(category) ?? 'outflow'
      let baseAmount = round(mean(amounts))

      // Apply seasonal adjustments
      // Q4 (Oct, Nov, Dec): hire-related categories get a 15% uplift
      if (month >= 10 && month <= 12) {
        const lowerCat = category.toLowerCase()
        if (lowerCat.includes('hire') || lowerCat.includes('crew') || lowerCat.includes('salary')) {
          baseAmount = round(baseAmount * 1.15)
        }
      }

      // Q1 (Jan, Feb, Mar): add ETS / emission surcharge for outflows
      if (month >= 1 && month <= 3) {
        const lowerCat = category.toLowerCase()
        if (lowerCat.includes('ets') || lowerCat.includes('emission') || lowerCat.includes('carbon')) {
          baseAmount = round(baseAmount * 1.25)
        }
      }

      projections.push({
        date: dateStr,
        type,
        category,
        amount: baseAmount,
        isRecurring: true,
      })

      monthNet += type === 'inflow' ? baseAmount : -baseAmount
    }

    runningBalance = round(runningBalance + monthNet)
    cumulativeBalance.push({
      month: formatYearMonth(year, month),
      balance: runningBalance,
    })
  }

  return { projections, cumulativeBalance }
}

/**
 * Calculate breakeven metrics for vessel operations.
 *
 * The breakeven TCE (Time Charter Equivalent) is the minimum daily rate a vessel
 * must earn to cover its fixed operating costs after accounting for commission.
 *
 * Calculations:
 * - breakevenTce = fixedCosts / (1 - commissionPct/100)
 *   This is the gross daily hire that, after paying commissions, just covers fixed costs.
 *
 * - breakevenFreight = breakevenTce * avgDurationDays + avgBunkerCost + avgPortCost
 *   The minimum gross freight revenue per voyage to break even.
 *
 * - safetyMargin10 / safetyMargin20: breakeven TCE scaled up by 10% and 20%
 *   respectively, providing buffers for cost overruns or market dips.
 *
 * - cushion: how far the current TCE sits above breakeven, as a percentage.
 *   cushion = ((currentTce - breakevenTce) / breakevenTce) * 100
 *   A negative cushion means the vessel is operating below breakeven.
 */
export function calculateBreakeven(
  fixedCosts: number,
  voyageData: VoyageMetrics,
): BreakevenResult {
  const {
    avgDurationDays,
    avgBunkerCost,
    avgPortCost,
    commissionPct,
    currentTce,
  } = voyageData

  // Prevent division by zero on commission
  const commissionFactor = 1 - Math.min(commissionPct, 99) / 100

  // Breakeven TCE: the daily rate needed after commission to cover fixed costs
  const breakevenTce = commissionFactor > 0
    ? round(fixedCosts / commissionFactor)
    : round(fixedCosts)

  // Breakeven freight: total voyage revenue needed
  const breakevenFreight = round(
    breakevenTce * Math.max(avgDurationDays, 1) + avgBunkerCost + avgPortCost,
  )

  // Safety margins
  const safetyMargin10 = round(breakevenTce * 1.10)
  const safetyMargin20 = round(breakevenTce * 1.20)

  // Cushion: how far current performance is above breakeven
  const cushion = breakevenTce > 0
    ? round(((currentTce - breakevenTce) / breakevenTce) * 100)
    : 0

  return {
    breakevenTce,
    breakevenFreight,
    safetyMargin10,
    safetyMargin20,
    currentTce: round(currentTce),
    cushion,
  }
}
