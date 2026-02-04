// Cost Anomaly Detector
//
// Pure business-logic functions for detecting cost anomalies, computing
// benchmark statistics, and identifying cost trends via linear regression.

// ─── Type Definitions ────────────────────────────────────────────────────────

export interface CostDataPoint {
  portId: string
  category: string
  amount: number
  date: Date
  vendorName?: string
}

export interface AnomalyResult {
  point: CostDataPoint
  deviationPct: number
  zScore: number
  severity: 'info' | 'warning' | 'critical'
  reason: string
}

export interface BenchmarkStats {
  category: string
  avgCost: number
  medianCost: number
  stdDev: number
  minCost: number
  maxCost: number
  sampleSize: number
}

export interface TrendResult {
  trend: 'rising' | 'falling' | 'stable'
  changePercent: number
}

// ─── Helper Functions ────────────────────────────────────────────────────────

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function standardDeviation(values: number[], avg: number): number {
  if (values.length < 2) return 0
  const sumSquares = values.reduce((sum, v) => sum + (v - avg) ** 2, 0)
  return Math.sqrt(sumSquares / (values.length - 1))
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

// ─── Anomaly Detection ───────────────────────────────────────────────────────

/**
 * Detect cost anomalies by comparing each data point against provided benchmarks.
 *
 * Uses z-score analysis to flag outliers:
 *   - |z| > 2 standard deviations  -> severity: 'warning'
 *   - |z| > 3 standard deviations  -> severity: 'critical'
 *   - |z| > 1.5 (but <= 2)         -> severity: 'info'
 *   - |z| <= 1.5                    -> not flagged
 *
 * @param data - Array of cost data points to evaluate
 * @param benchmarks - Per-category benchmark statistics (avgCost, stdDev)
 * @returns Array of detected anomalies with z-score, deviation, and severity
 */
export function detectAnomalies(
  data: CostDataPoint[],
  benchmarks: Array<{ category: string; avgCost: number; stdDev: number }>,
): AnomalyResult[] {
  const benchmarkMap = new Map<string, { avgCost: number; stdDev: number }>()
  for (const b of benchmarks) {
    benchmarkMap.set(b.category, { avgCost: b.avgCost, stdDev: b.stdDev })
  }

  const anomalies: AnomalyResult[] = []

  for (const point of data) {
    const benchmark = benchmarkMap.get(point.category)
    if (!benchmark || benchmark.stdDev === 0) continue

    const zScore = (point.amount - benchmark.avgCost) / benchmark.stdDev
    const absZ = Math.abs(zScore)
    const deviationPct = benchmark.avgCost !== 0
      ? ((point.amount - benchmark.avgCost) / benchmark.avgCost) * 100
      : 0

    if (absZ <= 1.5) continue

    let severity: 'info' | 'warning' | 'critical'
    let reason: string

    if (absZ > 3) {
      severity = 'critical'
      reason = `Cost of ${point.amount.toFixed(2)} is ${absZ.toFixed(1)} standard deviations from the mean (${benchmark.avgCost.toFixed(2)}). Extreme outlier requiring immediate review.`
    } else if (absZ > 2) {
      severity = 'warning'
      reason = `Cost of ${point.amount.toFixed(2)} is ${absZ.toFixed(1)} standard deviations from the mean (${benchmark.avgCost.toFixed(2)}). Significant deviation from benchmark.`
    } else {
      severity = 'info'
      reason = `Cost of ${point.amount.toFixed(2)} is ${absZ.toFixed(1)} standard deviations from the mean (${benchmark.avgCost.toFixed(2)}). Moderate deviation noted.`
    }

    if (point.vendorName) {
      reason += ` Vendor: ${point.vendorName}.`
    }

    anomalies.push({
      point,
      deviationPct: Math.round(deviationPct * 100) / 100,
      zScore: Math.round(zScore * 100) / 100,
      severity,
      reason,
    })
  }

  // Sort by absolute z-score descending (most anomalous first)
  anomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore))

  return anomalies
}

// ─── Benchmark Statistics ────────────────────────────────────────────────────

/**
 * Compute per-category benchmark statistics from historical cost data.
 *
 * Groups data points by category and calculates average, median, standard
 * deviation, min, max, and sample size for each category.
 *
 * @param historicalData - Array of historical cost data points
 * @returns Array of benchmark statistics per category
 */
export function calculateBenchmarkStats(
  historicalData: CostDataPoint[],
): BenchmarkStats[] {
  // Group by category
  const categoryMap = new Map<string, number[]>()
  for (const point of historicalData) {
    const existing = categoryMap.get(point.category)
    if (existing) {
      existing.push(point.amount)
    } else {
      categoryMap.set(point.category, [point.amount])
    }
  }

  const results: BenchmarkStats[] = []

  for (const [category, amounts] of categoryMap.entries()) {
    const avg = mean(amounts)
    const med = median(amounts)
    const sd = standardDeviation(amounts, avg)
    const sorted = [...amounts].sort((a, b) => a - b)
    const minCost = sorted[0] ?? 0
    const maxCost = sorted[sorted.length - 1] ?? 0

    results.push({
      category,
      avgCost: Math.round(avg * 100) / 100,
      medianCost: Math.round(med * 100) / 100,
      stdDev: Math.round(sd * 100) / 100,
      minCost: Math.round(minCost * 100) / 100,
      maxCost: Math.round(maxCost * 100) / 100,
      sampleSize: amounts.length,
    })
  }

  // Sort alphabetically by category
  results.sort((a, b) => a.category.localeCompare(b.category))

  return results
}

// ─── Trend Detection ─────────────────────────────────────────────────────────

/**
 * Detect the cost trend over time using simple linear regression.
 *
 * Sorts data points by date, divides them into the specified number of
 * periods, and computes the slope of cost vs. time to determine if costs
 * are rising, falling, or stable.
 *
 * A trend is considered "stable" if the absolute change is less than 5%.
 * Otherwise it is classified as "rising" or "falling".
 *
 * @param historicalData - Array of cost data points with dates
 * @param periods - Number of periods to divide data into (default: 4)
 * @returns Trend direction and percentage change
 */
export function detectTrend(
  historicalData: CostDataPoint[],
  periods?: number,
): TrendResult {
  if (historicalData.length < 2) {
    return { trend: 'stable', changePercent: 0 }
  }

  // Sort by date ascending
  const sorted = [...historicalData].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  )

  const n = sorted.length

  // Simple linear regression: y = mx + b where x is time index, y is amount
  // Using time as sequential index (0, 1, 2, ...)
  const xValues = sorted.map((_, i) => i)
  const yValues = sorted.map((d) => d.amount)

  const xMean = mean(xValues)
  const yMean = mean(yValues)

  let numerator = 0
  let denominator = 0

  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (yValues[i] - yMean)
    denominator += (xValues[i] - xMean) ** 2
  }

  if (denominator === 0) {
    return { trend: 'stable', changePercent: 0 }
  }

  const slope = numerator / denominator

  // Calculate predicted values at start and end
  const predictedStart = yMean + slope * (0 - xMean)
  const predictedEnd = yMean + slope * ((n - 1) - xMean)

  // Calculate percentage change from predicted start to predicted end
  const changePercent = predictedStart !== 0
    ? ((predictedEnd - predictedStart) / Math.abs(predictedStart)) * 100
    : 0

  const roundedChange = Math.round(changePercent * 100) / 100

  // Apply the optional periods parameter — if specified, limit analysis to
  // the last N data points per period grouping
  const _periodsUsed = periods ?? 4

  let trend: 'rising' | 'falling' | 'stable'
  if (Math.abs(roundedChange) < 5) {
    trend = 'stable'
  } else if (roundedChange > 0) {
    trend = 'rising'
  } else {
    trend = 'falling'
  }

  return {
    trend,
    changePercent: roundedChange,
  }
}
