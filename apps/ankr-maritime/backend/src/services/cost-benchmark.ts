/**
 * Cost Benchmarking Engine
 *
 * Pure business-logic module for statistical analysis and benchmarking of
 * voyage costs, port costs, and operating expenses. Provides quartile
 * calculations, outlier detection, cost indexing against baselines,
 * and narrative report generation with recommendations.
 */

export interface VoyageCost {
  voyageId: string
  vesselName: string
  route: string
  durationDays: number
  portCosts: number
  bunkerCosts: number
  crewCosts: number
  insuranceCosts: number
  chartererCommission: number
  totalCost: number
  tcePerDay: number
  revenueUsd: number
}

function median(sorted: number[]): number {
  const n = sorted.length
  if (n === 0) return 0
  const mid = Math.floor(n / 2)
  return n % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function stdDev(values: number[], avg: number): number {
  if (values.length < 2) return 0
  const sumSquares = values.reduce((sum, v) => sum + (v - avg) ** 2, 0)
  return Math.sqrt(sumSquares / (values.length - 1))
}

function quartiles(sorted: number[]): { q1: number; q2: number; q3: number } {
  const n = sorted.length
  if (n === 0) return { q1: 0, q2: 0, q3: 0 }

  const q2 = median(sorted)

  const lowerHalf = sorted.slice(0, Math.floor(n / 2))
  const upperHalf = n % 2 !== 0 ? sorted.slice(Math.floor(n / 2) + 1) : sorted.slice(Math.floor(n / 2))

  const q1 = median(lowerHalf)
  const q3 = median(upperHalf)

  return { q1, q2, q3 }
}

/**
 * Perform a full statistical benchmark analysis across a set of voyages.
 *
 * Computes average and median TCE, identifies the best and worst voyages by TCE,
 * breaks down costs by category as a percentage of total, and calculates TCE quartiles.
 *
 * @param voyages - Array of voyage cost records to benchmark
 * @returns Comprehensive benchmark result including statistics, cost breakdown, and quartiles
 */
export function benchmarkVoyageCosts(voyages: VoyageCost[]): {
  avgTce: number
  medianTce: number
  bestVoyage: VoyageCost
  worstVoyage: VoyageCost
  costBreakdown: { category: string; avgAmount: number; percentOfTotal: number }[]
  quartiles: { q1: number; q2: number; q3: number }
} {
  if (voyages.length === 0) {
    const empty: VoyageCost = {
      voyageId: '',
      vesselName: '',
      route: '',
      durationDays: 0,
      portCosts: 0,
      bunkerCosts: 0,
      crewCosts: 0,
      insuranceCosts: 0,
      chartererCommission: 0,
      totalCost: 0,
      tcePerDay: 0,
      revenueUsd: 0
    }
    return {
      avgTce: 0,
      medianTce: 0,
      bestVoyage: empty,
      worstVoyage: empty,
      costBreakdown: [],
      quartiles: { q1: 0, q2: 0, q3: 0 }
    }
  }

  const tceValues = voyages.map((v) => v.tcePerDay)
  const sortedTce = [...tceValues].sort((a, b) => a - b)
  const avgTce = mean(tceValues)
  const medianTce = median(sortedTce)

  const sorted = [...voyages].sort((a, b) => b.tcePerDay - a.tcePerDay)
  const bestVoyage = sorted[0]
  const worstVoyage = sorted[sorted.length - 1]

  const avgPortCosts = mean(voyages.map((v) => v.portCosts))
  const avgBunkerCosts = mean(voyages.map((v) => v.bunkerCosts))
  const avgCrewCosts = mean(voyages.map((v) => v.crewCosts))
  const avgInsuranceCosts = mean(voyages.map((v) => v.insuranceCosts))
  const avgCommission = mean(voyages.map((v) => v.chartererCommission))
  const avgTotalCost = mean(voyages.map((v) => v.totalCost))

  const costCategories: { category: string; avgAmount: number }[] = [
    { category: 'Port Costs', avgAmount: avgPortCosts },
    { category: 'Bunker Costs', avgAmount: avgBunkerCosts },
    { category: 'Crew Costs', avgAmount: avgCrewCosts },
    { category: 'Insurance Costs', avgAmount: avgInsuranceCosts },
    { category: 'Charterer Commission', avgAmount: avgCommission }
  ]

  const costBreakdown = costCategories.map((cat) => ({
    category: cat.category,
    avgAmount: Math.round(cat.avgAmount * 100) / 100,
    percentOfTotal:
      avgTotalCost > 0
        ? Math.round((cat.avgAmount / avgTotalCost) * 10000) / 100
        : 0
  }))

  const q = quartiles(sortedTce)

  return {
    avgTce: Math.round(avgTce * 100) / 100,
    medianTce: Math.round(medianTce * 100) / 100,
    bestVoyage,
    worstVoyage,
    costBreakdown,
    quartiles: {
      q1: Math.round(q.q1 * 100) / 100,
      q2: Math.round(q.q2 * 100) / 100,
      q3: Math.round(q.q3 * 100) / 100
    }
  }
}

/**
 * Benchmark port costs across multiple ports.
 *
 * Computes the average cost per day for each port, ranks them from cheapest to
 * most expensive, and assigns a cost index relative to the global average
 * (100 = average, higher = more expensive).
 *
 * @param portData - Array of port statistics (name, number of calls, avg cost, avg days)
 * @returns Ranked array of port benchmarks with cost index
 */
export function benchmarkPortCosts(
  portData: Array<{
    portName: string
    calls: number
    avgCost: number
    avgDays: number
  }>
): Array<{
  portName: string
  calls: number
  avgCostPerDay: number
  rank: number
  costIndex: number
}> {
  if (portData.length === 0) return []

  const enriched = portData.map((port) => ({
    portName: port.portName,
    calls: port.calls,
    avgCostPerDay: port.avgDays > 0 ? port.avgCost / port.avgDays : 0
  }))

  const globalAvgCostPerDay = mean(enriched.map((p) => p.avgCostPerDay))

  const sorted = [...enriched].sort((a, b) => a.avgCostPerDay - b.avgCostPerDay)

  return sorted.map((port, index) => ({
    portName: port.portName,
    calls: port.calls,
    avgCostPerDay: Math.round(port.avgCostPerDay * 100) / 100,
    rank: index + 1,
    costIndex:
      globalAvgCostPerDay > 0
        ? Math.round((port.avgCostPerDay / globalAvgCostPerDay) * 10000) / 100
        : 0
  }))
}

/**
 * Calculate an operating cost index comparing current costs against a baseline.
 *
 * Each cost category is indexed individually (100 = baseline). The overall index
 * is the weighted average based on baseline proportions. A positive variance
 * means costs have increased relative to the baseline.
 *
 * @param costs - Current operating costs by category
 * @param baseline - Baseline costs by category (100 = this level)
 * @returns Overall index and per-category indices with variance percentages
 */
export function calculateOperatingCostIndex(
  costs: {
    bunker: number
    port: number
    crew: number
    insurance: number
    maintenance: number
  },
  baseline: {
    bunker: number
    port: number
    crew: number
    insurance: number
    maintenance: number
  }
): {
  overallIndex: number
  categoryIndices: { category: string; index: number; variance: number }[]
} {
  const categories: Array<{ key: keyof typeof costs; label: string }> = [
    { key: 'bunker', label: 'Bunker' },
    { key: 'port', label: 'Port' },
    { key: 'crew', label: 'Crew' },
    { key: 'insurance', label: 'Insurance' },
    { key: 'maintenance', label: 'Maintenance' }
  ]

  const baselineTotal = Object.values(baseline).reduce((sum, v) => sum + v, 0)

  const categoryIndices = categories.map((cat) => {
    const baseVal = baseline[cat.key]
    const curVal = costs[cat.key]
    const index = baseVal > 0 ? (curVal / baseVal) * 100 : 0
    const variance = index - 100

    return {
      category: cat.label,
      index: Math.round(index * 100) / 100,
      variance: Math.round(variance * 100) / 100
    }
  })

  // Weighted average: each category's index is weighted by its share of the baseline total
  let overallIndex = 0
  if (baselineTotal > 0) {
    for (const cat of categories) {
      const weight = baseline[cat.key] / baselineTotal
      const index = baseline[cat.key] > 0 ? (costs[cat.key] / baseline[cat.key]) * 100 : 0
      overallIndex += weight * index
    }
  }

  return {
    overallIndex: Math.round(overallIndex * 100) / 100,
    categoryIndices
  }
}

/**
 * Identify statistical outliers in a set of numeric values using standard deviation.
 *
 * A value is flagged as an outlier if it falls more than `threshold` standard
 * deviations from the mean (default: 2.0).
 *
 * @param values - Array of numeric values to analyze
 * @param threshold - Number of standard deviations from the mean to flag (default 2.0)
 * @returns Object containing outlier values, mean, stdDev, and the threshold used
 */
export function identifyCostOutliers(
  values: number[],
  threshold: number = 2.0
): {
  outliers: number[]
  mean: number
  stdDev: number
  threshold: number
} {
  if (values.length < 2) {
    return {
      outliers: [],
      mean: values.length === 1 ? values[0] : 0,
      stdDev: 0,
      threshold
    }
  }

  const avg = mean(values)
  const sd = stdDev(values, avg)

  const outliers = values.filter(
    (v) => Math.abs(v - avg) > threshold * sd
  )

  return {
    outliers,
    mean: Math.round(avg * 100) / 100,
    stdDev: Math.round(sd * 100) / 100,
    threshold
  }
}

/**
 * Generate a narrative cost report with summary text and actionable recommendations.
 *
 * Analyzes voyage cost data to produce a human-readable summary describing fleet
 * performance, and generates cost-saving recommendations based on detected patterns
 * such as bunker-heavy cost profiles, high port costs, or underperforming voyages.
 *
 * @param voyages - Array of voyage cost records to analyze
 * @returns Object containing a summary paragraph and an array of recommendation strings
 */
export function generateCostReport(voyages: VoyageCost[]): {
  summary: string
  recommendations: string[]
} {
  if (voyages.length === 0) {
    return {
      summary: 'No voyage data available for analysis.',
      recommendations: ['Collect voyage cost data to enable benchmarking and analysis.']
    }
  }

  const benchmark = benchmarkVoyageCosts(voyages)
  const recommendations: string[] = []

  // Compute aggregate cost proportions
  const totalPortCosts = voyages.reduce((s, v) => s + v.portCosts, 0)
  const totalBunkerCosts = voyages.reduce((s, v) => s + v.bunkerCosts, 0)
  const totalCrewCosts = voyages.reduce((s, v) => s + v.crewCosts, 0)
  const totalAllCosts = voyages.reduce((s, v) => s + v.totalCost, 0)
  const totalRevenue = voyages.reduce((s, v) => s + v.revenueUsd, 0)
  const avgDuration = mean(voyages.map((v) => v.durationDays))

  const bunkerPct = totalAllCosts > 0 ? (totalBunkerCosts / totalAllCosts) * 100 : 0
  const portPct = totalAllCosts > 0 ? (totalPortCosts / totalAllCosts) * 100 : 0
  const crewPct = totalAllCosts > 0 ? (totalCrewCosts / totalAllCosts) * 100 : 0
  const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalAllCosts) / totalRevenue) * 100 : 0

  // Bunker cost analysis
  if (bunkerPct > 50) {
    recommendations.push(
      `Bunker costs represent ${bunkerPct.toFixed(1)}% of total costs. Consider slow-steaming strategies, optimized weather routing, or hedging bunker procurement to reduce fuel expenditure.`
    )
  } else if (bunkerPct > 35) {
    recommendations.push(
      `Bunker costs at ${bunkerPct.toFixed(1)}% are within normal range but could be optimized through voyage speed adjustments and bulk fuel procurement agreements.`
    )
  }

  // Port cost analysis
  if (portPct > 25) {
    recommendations.push(
      `Port costs are elevated at ${portPct.toFixed(1)}% of total. Review port call sequences, negotiate preferred berthing terms, and evaluate alternative discharge ports where feasible.`
    )
  }

  // Crew cost analysis
  if (crewPct > 20) {
    recommendations.push(
      `Crew costs at ${crewPct.toFixed(1)}% of total are above typical benchmarks. Review manning levels, crew rotation schedules, and consider flag state alternatives for more competitive wage structures.`
    )
  }

  // TCE spread analysis
  const tceSpread = benchmark.bestVoyage.tcePerDay - benchmark.worstVoyage.tcePerDay
  if (tceSpread > benchmark.avgTce * 0.5 && voyages.length > 1) {
    recommendations.push(
      `Wide TCE spread detected (${tceSpread.toFixed(0)} USD/day between best and worst). Investigate underperforming voyages for route optimization, cargo selection improvement, or operational inefficiencies.`
    )
  }

  // Outlier detection on total costs
  const costOutliers = identifyCostOutliers(voyages.map((v) => v.totalCost))
  if (costOutliers.outliers.length > 0) {
    recommendations.push(
      `${costOutliers.outliers.length} voyage(s) identified as cost outliers (exceeding ${costOutliers.threshold} standard deviations from mean). Review these voyages individually for exceptional cost drivers.`
    )
  }

  // Profitability recommendation
  if (profitMargin < 5 && totalRevenue > 0) {
    recommendations.push(
      `Overall profit margin is thin at ${profitMargin.toFixed(1)}%. Prioritize higher-yield cargoes and negotiate improved charter rates to improve returns.`
    )
  }

  // Duration optimization
  if (avgDuration > 30) {
    recommendations.push(
      `Average voyage duration is ${avgDuration.toFixed(1)} days. Evaluate whether shorter route alternatives or faster port turnarounds could improve vessel utilization and TCE.`
    )
  }

  // Fallback recommendation
  if (recommendations.length === 0) {
    recommendations.push(
      'Cost structure appears well-balanced. Continue monitoring for seasonal trends and market-driven cost fluctuations.'
    )
  }

  const summary = `Fleet Cost Benchmark Report – ${voyages.length} Voyage(s) Analyzed

Average TCE: $${benchmark.avgTce.toLocaleString()}/day | Median TCE: $${benchmark.medianTce.toLocaleString()}/day
Best Performing: ${benchmark.bestVoyage.vesselName} (${benchmark.bestVoyage.route}) at $${benchmark.bestVoyage.tcePerDay.toLocaleString()}/day
Worst Performing: ${benchmark.worstVoyage.vesselName} (${benchmark.worstVoyage.route}) at $${benchmark.worstVoyage.tcePerDay.toLocaleString()}/day
TCE Quartiles: Q1=$${benchmark.quartiles.q1.toLocaleString()} | Q2=$${benchmark.quartiles.q2.toLocaleString()} | Q3=$${benchmark.quartiles.q3.toLocaleString()}

Cost Breakdown:
${benchmark.costBreakdown.map((c) => `  ${c.category}: $${c.avgAmount.toLocaleString()} avg (${c.percentOfTotal}%)`).join('\n')}

Total Revenue: $${totalRevenue.toLocaleString()} | Total Costs: $${totalAllCosts.toLocaleString()} | Margin: ${profitMargin.toFixed(1)}%`

  return { summary, recommendations }
}
