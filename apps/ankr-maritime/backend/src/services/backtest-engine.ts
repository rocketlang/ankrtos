// backtest-engine.ts
// Strategy backtesting engine for FFA (Forward Freight Agreement) trading strategies.
// Signal generation (moving average crossover, mean reversion, seasonal), backtest execution,
// performance metrics, and benchmark comparison.
// Pure functions — no DB or Prisma dependency.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PriceBar {
  date: Date
  price: number
  volume?: number
}

export interface Signal {
  date: Date
  action: 'buy' | 'sell' | 'hold'
  price: number
  reason?: string
}

export interface BacktestTrade {
  entryDate: Date
  exitDate: Date
  direction: 'long' | 'short'
  entryPrice: number
  exitPrice: number
  quantity: number
  pnl: number
  returnPct: number
  holdingDays: number
}

export interface BacktestMetrics {
  trades: number
  winRate: number
  avgReturn: number
  totalReturn: number
  maxDrawdown: number
  sharpeRatio: number
  sortinoRatio: number
  profitFactor: number
  avgHoldingDays: number
  maxConsecutiveWins: number
  maxConsecutiveLosses: number
}

export interface BacktestResult {
  trades: BacktestTrade[]
  metrics: BacktestMetrics
  equityCurve: Array<{ date: Date; equity: number }>
}

export interface BenchmarkComparison {
  alpha: number
  beta: number
  correlation: number
  trackingError: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round(value: number, decimals: number = 4): number {
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
 * Compute the Simple Moving Average (SMA) for the last `window` elements
 * ending at index `endIndex` (inclusive) within the given price array.
 * Returns null if there are insufficient data points.
 */
function smaAt(prices: number[], endIndex: number, window: number): number | null {
  if (endIndex < window - 1) return null
  let sum = 0
  for (let i = endIndex - window + 1; i <= endIndex; i++) {
    sum += prices[i]
  }
  return sum / window
}

/**
 * Compute the rolling standard deviation for the last `window` elements
 * ending at index `endIndex` (inclusive).
 */
function rollingStddev(prices: number[], endIndex: number, window: number): number {
  if (endIndex < window - 1) return 0
  const slice: number[] = []
  for (let i = endIndex - window + 1; i <= endIndex; i++) {
    slice.push(prices[i])
  }
  return stddev(slice)
}

/**
 * Calculate the number of calendar days between two dates.
 */
function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.round(Math.abs(b.getTime() - a.getTime()) / msPerDay)
}

/**
 * Compute daily returns from an equity curve or price series.
 * Returns an array one element shorter than the input.
 */
function dailyReturns(values: number[]): number[] {
  const returns: number[] = []
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] !== 0) {
      returns.push((values[i] - values[i - 1]) / values[i - 1])
    } else {
      returns.push(0)
    }
  }
  return returns
}

// ---------------------------------------------------------------------------
// Signal Generators
// ---------------------------------------------------------------------------

/**
 * Generate trading signals using a Moving Average Crossover strategy.
 *
 * A **buy** signal is emitted when the short-period SMA crosses above the
 * long-period SMA (golden cross). A **sell** signal is emitted when the
 * short-period SMA crosses below the long-period SMA (death cross).
 * All other bars produce **hold** signals.
 *
 * Prices must be sorted by date ascending.
 *
 * @param prices     - Time series of price bars, date ascending
 * @param shortWindow - Period for the fast moving average (e.g. 5, 10)
 * @param longWindow  - Period for the slow moving average (e.g. 20, 50)
 */
export function generateMovingAverageCrossSignals(
  prices: PriceBar[],
  shortWindow: number,
  longWindow: number,
): Signal[] {
  if (prices.length === 0) return []

  // Ensure ascending date order
  const sorted = [...prices].sort((a, b) => a.date.getTime() - b.date.getTime())
  const priceValues = sorted.map((p) => p.price)
  const signals: Signal[] = []

  let prevShortMA: number | null = null
  let prevLongMA: number | null = null

  for (let i = 0; i < sorted.length; i++) {
    const shortMA = smaAt(priceValues, i, shortWindow)
    const longMA = smaAt(priceValues, i, longWindow)

    if (shortMA === null || longMA === null) {
      // Not enough data for both MAs
      signals.push({
        date: sorted[i].date,
        action: 'hold',
        price: sorted[i].price,
        reason: 'Insufficient data for moving averages',
      })
      prevShortMA = shortMA
      prevLongMA = longMA
      continue
    }

    // Detect crossover
    if (prevShortMA !== null && prevLongMA !== null) {
      const wasBelowOrEqual = prevShortMA <= prevLongMA
      const isAbove = shortMA > longMA
      const wasAboveOrEqual = prevShortMA >= prevLongMA
      const isBelow = shortMA < longMA

      if (wasBelowOrEqual && isAbove) {
        signals.push({
          date: sorted[i].date,
          action: 'buy',
          price: sorted[i].price,
          reason: `Golden cross: SMA(${shortWindow})=${round(shortMA, 2)} crossed above SMA(${longWindow})=${round(longMA, 2)}`,
        })
      } else if (wasAboveOrEqual && isBelow) {
        signals.push({
          date: sorted[i].date,
          action: 'sell',
          price: sorted[i].price,
          reason: `Death cross: SMA(${shortWindow})=${round(shortMA, 2)} crossed below SMA(${longWindow})=${round(longMA, 2)}`,
        })
      } else {
        signals.push({
          date: sorted[i].date,
          action: 'hold',
          price: sorted[i].price,
        })
      }
    } else {
      signals.push({
        date: sorted[i].date,
        action: 'hold',
        price: sorted[i].price,
      })
    }

    prevShortMA = shortMA
    prevLongMA = longMA
  }

  return signals
}

/**
 * Generate trading signals using a Mean Reversion strategy.
 *
 * The z-score of the current price relative to its rolling SMA and
 * standard deviation is computed. Signals:
 * - **Buy** when z-score < -zThreshold (price is abnormally low)
 * - **Sell** when z-score > +zThreshold (price is abnormally high)
 * - **Hold** otherwise
 *
 * @param prices     - Time series of price bars, date ascending
 * @param window     - Lookback period for SMA and standard deviation
 * @param zThreshold - Absolute z-score threshold to trigger a signal (e.g. 2.0)
 */
export function generateMeanReversionSignals(
  prices: PriceBar[],
  window: number,
  zThreshold: number,
): Signal[] {
  if (prices.length === 0) return []

  const sorted = [...prices].sort((a, b) => a.date.getTime() - b.date.getTime())
  const priceValues = sorted.map((p) => p.price)
  const signals: Signal[] = []

  for (let i = 0; i < sorted.length; i++) {
    const sma = smaAt(priceValues, i, window)
    const sd = rollingStddev(priceValues, i, window)

    if (sma === null || sd === 0) {
      signals.push({
        date: sorted[i].date,
        action: 'hold',
        price: sorted[i].price,
        reason: 'Insufficient data or zero volatility',
      })
      continue
    }

    const zScore = (sorted[i].price - sma) / sd

    if (zScore < -zThreshold) {
      signals.push({
        date: sorted[i].date,
        action: 'buy',
        price: sorted[i].price,
        reason: `Mean reversion buy: z-score=${round(zScore, 2)} below -${zThreshold}`,
      })
    } else if (zScore > zThreshold) {
      signals.push({
        date: sorted[i].date,
        action: 'sell',
        price: sorted[i].price,
        reason: `Mean reversion sell: z-score=${round(zScore, 2)} above +${zThreshold}`,
      })
    } else {
      signals.push({
        date: sorted[i].date,
        action: 'hold',
        price: sorted[i].price,
      })
    }
  }

  return signals
}

/**
 * Generate trading signals using a Seasonal strategy.
 *
 * Buys at the start of `buyMonth` and sells at the start of `sellMonth`
 * each year. This is useful for capturing well-known seasonal patterns
 * in freight markets (e.g. pre-winter demand spikes).
 *
 * Months are 1-indexed (1 = January, 12 = December).
 *
 * @param prices    - Time series of price bars, date ascending
 * @param buyMonth  - Month number (1-12) to enter a long position
 * @param sellMonth - Month number (1-12) to exit the position
 */
export function generateSeasonalSignals(
  prices: PriceBar[],
  buyMonth: number,
  sellMonth: number,
): Signal[] {
  if (prices.length === 0) return []

  const sorted = [...prices].sort((a, b) => a.date.getTime() - b.date.getTime())
  const signals: Signal[] = []

  // Track which months we have already signalled in to avoid duplicate signals
  // within the same month of the same year.
  const signalledBuy = new Set<string>()
  const signalledSell = new Set<string>()

  for (const bar of sorted) {
    const month = bar.date.getMonth() + 1 // getMonth() is 0-indexed
    const year = bar.date.getFullYear()
    const yearMonthKey = `${year}-${month}`

    if (month === buyMonth && !signalledBuy.has(yearMonthKey)) {
      signalledBuy.add(yearMonthKey)
      signals.push({
        date: bar.date,
        action: 'buy',
        price: bar.price,
        reason: `Seasonal buy: month ${buyMonth} of ${year}`,
      })
    } else if (month === sellMonth && !signalledSell.has(yearMonthKey)) {
      signalledSell.add(yearMonthKey)
      signals.push({
        date: bar.date,
        action: 'sell',
        price: bar.price,
        reason: `Seasonal sell: month ${sellMonth} of ${year}`,
      })
    } else {
      signals.push({
        date: bar.date,
        action: 'hold',
        price: bar.price,
      })
    }
  }

  return signals
}

// ---------------------------------------------------------------------------
// Backtest Execution
// ---------------------------------------------------------------------------

/**
 * Execute a backtest given a series of signals.
 *
 * Rules:
 * - One position at a time (no pyramiding).
 * - A **buy** signal opens a long position if flat, or closes a short position.
 * - A **sell** signal opens a short position if flat, or closes a long position.
 * - **hold** signals are ignored.
 * - If a position is open at the end of the series, it is force-closed at the last price.
 *
 * The equity curve tracks cumulative P&L starting from `initialCapital`.
 * All BacktestMetrics are calculated from the completed trade list.
 *
 * @param signals        - Ordered array of signals (date ascending)
 * @param lotSize        - Lot size in USD per price point (e.g. 1000 mt per lot)
 * @param initialCapital - Starting equity in USD
 */
export function runBacktest(
  signals: Signal[],
  lotSize: number,
  initialCapital: number,
): BacktestResult {
  const trades: BacktestTrade[] = []
  const equityCurve: Array<{ date: Date; equity: number }> = []
  let equity = initialCapital

  // Current open position tracking
  let inPosition = false
  let positionDirection: 'long' | 'short' = 'long'
  let positionEntryDate: Date = new Date()
  let positionEntryPrice = 0
  const quantity = 1 // One lot per trade

  // Process each signal
  for (const signal of signals) {
    if (signal.action === 'hold') {
      equityCurve.push({ date: signal.date, equity })
      continue
    }

    if (signal.action === 'buy') {
      if (inPosition && positionDirection === 'short') {
        // Close short position
        const pnl = (positionEntryPrice - signal.price) * quantity * lotSize
        const returnPct = positionEntryPrice !== 0
          ? round(((positionEntryPrice - signal.price) / positionEntryPrice) * 100, 4)
          : 0
        const holdingDays = daysBetween(positionEntryDate, signal.date)
        equity += pnl

        trades.push({
          entryDate: positionEntryDate,
          exitDate: signal.date,
          direction: 'short',
          entryPrice: positionEntryPrice,
          exitPrice: signal.price,
          quantity,
          pnl: round(pnl, 2),
          returnPct,
          holdingDays,
        })
        inPosition = false
      }

      if (!inPosition) {
        // Open long position
        inPosition = true
        positionDirection = 'long'
        positionEntryDate = signal.date
        positionEntryPrice = signal.price
      }
    } else if (signal.action === 'sell') {
      if (inPosition && positionDirection === 'long') {
        // Close long position
        const pnl = (signal.price - positionEntryPrice) * quantity * lotSize
        const returnPct = positionEntryPrice !== 0
          ? round(((signal.price - positionEntryPrice) / positionEntryPrice) * 100, 4)
          : 0
        const holdingDays = daysBetween(positionEntryDate, signal.date)
        equity += pnl

        trades.push({
          entryDate: positionEntryDate,
          exitDate: signal.date,
          direction: 'long',
          entryPrice: positionEntryPrice,
          exitPrice: signal.price,
          quantity,
          pnl: round(pnl, 2),
          returnPct,
          holdingDays,
        })
        inPosition = false
      }

      if (!inPosition) {
        // Open short position
        inPosition = true
        positionDirection = 'short'
        positionEntryDate = signal.date
        positionEntryPrice = signal.price
      }
    }

    equityCurve.push({ date: signal.date, equity: round(equity, 2) })
  }

  // Force-close any open position at the last signal price
  if (inPosition && signals.length > 0) {
    const lastSignal = signals[signals.length - 1]
    let pnl: number
    let returnPct: number

    if (positionDirection === 'long') {
      pnl = (lastSignal.price - positionEntryPrice) * quantity * lotSize
      returnPct = positionEntryPrice !== 0
        ? round(((lastSignal.price - positionEntryPrice) / positionEntryPrice) * 100, 4)
        : 0
    } else {
      pnl = (positionEntryPrice - lastSignal.price) * quantity * lotSize
      returnPct = positionEntryPrice !== 0
        ? round(((positionEntryPrice - lastSignal.price) / positionEntryPrice) * 100, 4)
        : 0
    }

    const holdingDays = daysBetween(positionEntryDate, lastSignal.date)
    equity += pnl

    trades.push({
      entryDate: positionEntryDate,
      exitDate: lastSignal.date,
      direction: positionDirection,
      entryPrice: positionEntryPrice,
      exitPrice: lastSignal.price,
      quantity,
      pnl: round(pnl, 2),
      returnPct,
      holdingDays,
    })

    equityCurve.push({ date: lastSignal.date, equity: round(equity, 2) })
  }

  // --- Calculate metrics ---
  const metrics = calculateMetrics(trades, equityCurve)

  return { trades, metrics, equityCurve }
}

/**
 * Internal: compute all BacktestMetrics from a completed trade list and equity curve.
 */
function calculateMetrics(
  trades: BacktestTrade[],
  equityCurve: Array<{ date: Date; equity: number }>,
): BacktestMetrics {
  if (trades.length === 0) {
    return {
      trades: 0,
      winRate: 0,
      avgReturn: 0,
      totalReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      profitFactor: 0,
      avgHoldingDays: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
    }
  }

  const totalTrades = trades.length
  const wins = trades.filter((t) => t.pnl > 0)
  const losses = trades.filter((t) => t.pnl <= 0)
  const winRate = round((wins.length / totalTrades) * 100, 2)

  const returnPcts = trades.map((t) => t.returnPct)
  const avgReturn = round(mean(returnPcts), 4)
  const totalReturn = round(trades.reduce((sum, t) => sum + t.pnl, 0), 2)

  // --- Max drawdown from equity curve ---
  let peak = -Infinity
  let maxDrawdown = 0
  for (const point of equityCurve) {
    if (point.equity > peak) {
      peak = point.equity
    }
    const drawdown = peak > 0 ? ((peak - point.equity) / peak) * 100 : 0
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
    }
  }
  maxDrawdown = round(maxDrawdown, 2)

  // --- Sharpe Ratio (annualised) ---
  // Use per-trade returns as the return series
  const meanReturn = mean(returnPcts)
  const stdReturn = stddev(returnPcts)
  const sharpeRatio = stdReturn > 0
    ? round((meanReturn / stdReturn) * Math.sqrt(252), 4)
    : 0

  // --- Sortino Ratio (annualised, using only negative returns for downside deviation) ---
  const negativeReturns = returnPcts.filter((r) => r < 0)
  const downsideStd = negativeReturns.length > 0 ? stddev(negativeReturns) : 0
  const sortinoRatio = downsideStd > 0
    ? round((meanReturn / downsideStd) * Math.sqrt(252), 4)
    : 0

  // --- Profit Factor ---
  const grossWins = wins.reduce((sum, t) => sum + t.pnl, 0)
  const grossLosses = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0))
  const profitFactor = grossLosses > 0 ? round(grossWins / grossLosses, 4) : grossWins > 0 ? Infinity : 0

  // --- Average holding days ---
  const avgHoldingDays = round(mean(trades.map((t) => t.holdingDays)), 1)

  // --- Max consecutive wins / losses ---
  let currentWinStreak = 0
  let currentLossStreak = 0
  let maxConsecutiveWins = 0
  let maxConsecutiveLosses = 0

  for (const trade of trades) {
    if (trade.pnl > 0) {
      currentWinStreak++
      currentLossStreak = 0
      if (currentWinStreak > maxConsecutiveWins) {
        maxConsecutiveWins = currentWinStreak
      }
    } else {
      currentLossStreak++
      currentWinStreak = 0
      if (currentLossStreak > maxConsecutiveLosses) {
        maxConsecutiveLosses = currentLossStreak
      }
    }
  }

  return {
    trades: totalTrades,
    winRate,
    avgReturn,
    totalReturn,
    maxDrawdown,
    sharpeRatio,
    sortinoRatio,
    profitFactor,
    avgHoldingDays,
    maxConsecutiveWins,
    maxConsecutiveLosses,
  }
}

// ---------------------------------------------------------------------------
// Benchmark Comparison
// ---------------------------------------------------------------------------

/**
 * Compare a strategy's equity curve against a benchmark price series.
 *
 * Computes:
 * - **Alpha**: Annualised excess return of the strategy over the benchmark
 *   after adjusting for beta (Jensen's alpha from linear regression).
 * - **Beta**: Sensitivity of strategy returns to benchmark returns
 *   (slope of the regression line).
 * - **Correlation**: Pearson correlation coefficient between strategy and
 *   benchmark daily returns.
 * - **Tracking Error**: Annualised standard deviation of the return
 *   differences (strategy - benchmark).
 *
 * Both inputs should cover the same date range. If lengths differ,
 * the shorter series determines the comparison window.
 *
 * @param strategyEquity  - Strategy equity curve
 * @param benchmarkPrices - Benchmark price bars
 * @param initialCapital  - Initial capital used to normalise benchmark returns
 */
export function compareBenchmark(
  strategyEquity: Array<{ date: Date; equity: number }>,
  benchmarkPrices: PriceBar[],
  initialCapital: number,
): BenchmarkComparison {
  if (strategyEquity.length < 2 || benchmarkPrices.length < 2) {
    return { alpha: 0, beta: 0, correlation: 0, trackingError: 0 }
  }

  // Sort both series by date ascending
  const sortedEquity = [...strategyEquity].sort((a, b) => a.date.getTime() - b.date.getTime())
  const sortedBenchmark = [...benchmarkPrices].sort((a, b) => a.date.getTime() - b.date.getTime())

  // Extract value arrays
  const equityValues = sortedEquity.map((e) => e.equity)
  const benchmarkValues = sortedBenchmark.map((b) => b.price)

  // Compute daily returns
  const stratReturns = dailyReturns(equityValues)
  const benchReturns = dailyReturns(benchmarkValues)

  // Use the shorter length
  const n = Math.min(stratReturns.length, benchReturns.length)
  if (n < 2) {
    return { alpha: 0, beta: 0, correlation: 0, trackingError: 0 }
  }

  const sReturns = stratReturns.slice(0, n)
  const bReturns = benchReturns.slice(0, n)

  // --- Linear regression: strategy = alpha + beta * benchmark ---
  const sMean = mean(sReturns)
  const bMean = mean(bReturns)

  let covariance = 0
  let benchVariance = 0
  for (let i = 0; i < n; i++) {
    const sDiff = sReturns[i] - sMean
    const bDiff = bReturns[i] - bMean
    covariance += sDiff * bDiff
    benchVariance += bDiff * bDiff
  }
  covariance /= n
  benchVariance /= n

  const beta = benchVariance > 0 ? covariance / benchVariance : 0
  // Daily alpha, then annualise (* 252)
  const dailyAlpha = sMean - beta * bMean
  const alpha = round(dailyAlpha * 252 * 100, 4) // expressed as annualised %

  // --- Pearson correlation ---
  const sStd = stddev(sReturns)
  const bStd = stddev(bReturns)
  const correlation = sStd > 0 && bStd > 0
    ? round(covariance / (sStd * bStd), 4)
    : 0

  // --- Tracking error: annualised stddev of return differences ---
  const returnDiffs = sReturns.map((s, i) => s - bReturns[i])
  const trackingError = round(stddev(returnDiffs) * Math.sqrt(252) * 100, 4) // annualised %

  return {
    alpha,
    beta: round(beta, 4),
    correlation,
    trackingError,
  }
}
