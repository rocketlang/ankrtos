// payment-tracker.ts
// Trade finance payment tracking: aging analysis, cash flow projection,
// DSO calculation, and overdue payment identification.
// Pure functions — no DB or Prisma dependency.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaymentAgingSummary {
  current: { count: number; amount: number }
  days30: { count: number; amount: number }
  days60: { count: number; amount: number }
  days90: { count: number; amount: number }
  days90plus: { count: number; amount: number }
  totalOutstanding: number
}

export interface CashFlowProjection {
  period: string // "2026-W05", "2026-02", etc.
  inflows: number
  outflows: number
  net: number
  cumulative: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Aging bucket boundaries in days overdue. */
const AGING_BUCKET_30 = 30
const AGING_BUCKET_60 = 60
const AGING_BUCKET_90 = 90

/** Milliseconds in one calendar day. */
const MS_PER_DAY = 1000 * 60 * 60 * 24

/** Payment statuses that are considered unpaid / outstanding. */
const UNPAID_STATUSES = ['pending', 'approved', 'overdue', 'partially_paid', 'submitted']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

/**
 * Calculate the number of calendar days between two dates.
 * A positive result means `target` is in the past relative to `from`.
 */
function daysOverdue(dueDate: Date, referenceDate: Date): number {
  const diffMs = referenceDate.getTime() - dueDate.getTime()
  return Math.floor(diffMs / MS_PER_DAY)
}

/**
 * Get the ISO week number for a date (ISO 8601: Monday-based weeks).
 */
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / MS_PER_DAY + 1) / 7)
}

/**
 * Get the ISO week-year for a date (the year associated with the ISO week).
 */
function getISOWeekYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  return d.getUTCFullYear()
}

/**
 * Format a date into a period key.
 *   weekly  -> "2026-W05" (ISO week)
 *   monthly -> "2026-02"
 */
function periodKey(date: Date, periodType: 'weekly' | 'monthly'): string {
  if (periodType === 'weekly') {
    const weekYear = getISOWeekYear(date)
    const week = getISOWeek(date)
    return `${weekYear}-W${String(week).padStart(2, '0')}`
  }
  // monthly
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Generate an ordered list of period keys starting from a reference date.
 */
function generatePeriodKeys(
  startDate: Date,
  periodType: 'weekly' | 'monthly',
  count: number,
): string[] {
  const keys: string[] = []
  const cursor = new Date(startDate)

  for (let i = 0; i < count; i++) {
    const key = periodKey(cursor, periodType)
    if (!keys.includes(key)) {
      keys.push(key)
    }
    // Advance cursor
    if (periodType === 'weekly') {
      cursor.setDate(cursor.getDate() + 7)
    } else {
      cursor.setMonth(cursor.getMonth() + 1)
    }
    // If we got a duplicate (edge case around period boundaries), keep going
    // until we have enough unique keys
    if (keys.length < i + 1) {
      // Period boundary caused duplicate — add the next one
      const nextKey = periodKey(cursor, periodType)
      if (!keys.includes(nextKey)) {
        keys.push(nextKey)
      }
    }
  }

  return keys.slice(0, count)
}

// ---------------------------------------------------------------------------
// 1. Payment Aging Analysis
// ---------------------------------------------------------------------------

/**
 * Categorize outstanding (unpaid) payments into aging buckets based on how
 * many days past their due date they are.
 *
 * Buckets:
 *   - current:   not yet due (dueDate is in the future)
 *   - days30:    1–30 days overdue
 *   - days60:    31–60 days overdue
 *   - days90:    61–90 days overdue
 *   - days90plus: more than 90 days overdue
 *
 * Payments that have already been paid (status not in UNPAID_STATUSES) are
 * excluded from the analysis.
 *
 * @param payments - Array of payment records with amount, dueDate, status
 */
export function calculatePaymentAging(
  payments: Array<{
    amount: number
    dueDate: Date
    status: string
    paidDate?: Date
  }>,
): PaymentAgingSummary {
  const summary: PaymentAgingSummary = {
    current: { count: 0, amount: 0 },
    days30: { count: 0, amount: 0 },
    days60: { count: 0, amount: 0 },
    days90: { count: 0, amount: 0 },
    days90plus: { count: 0, amount: 0 },
    totalOutstanding: 0,
  }

  const now = new Date()

  for (const payment of payments) {
    // Skip paid or cancelled payments
    if (!UNPAID_STATUSES.includes(payment.status.toLowerCase())) {
      continue
    }

    const overdueDays = daysOverdue(new Date(payment.dueDate), now)
    const amount = payment.amount

    if (overdueDays <= 0) {
      // Not yet due
      summary.current.count++
      summary.current.amount = round(summary.current.amount + amount)
    } else if (overdueDays <= AGING_BUCKET_30) {
      summary.days30.count++
      summary.days30.amount = round(summary.days30.amount + amount)
    } else if (overdueDays <= AGING_BUCKET_60) {
      summary.days60.count++
      summary.days60.amount = round(summary.days60.amount + amount)
    } else if (overdueDays <= AGING_BUCKET_90) {
      summary.days90.count++
      summary.days90.amount = round(summary.days90.amount + amount)
    } else {
      summary.days90plus.count++
      summary.days90plus.amount = round(summary.days90plus.amount + amount)
    }

    summary.totalOutstanding = round(summary.totalOutstanding + amount)
  }

  return summary
}

// ---------------------------------------------------------------------------
// 2. Cash Flow Projection
// ---------------------------------------------------------------------------

/**
 * Project cash flow by grouping receivables (inflows) and payables (outflows)
 * into calendar periods and computing a running cumulative total.
 *
 * Period formats:
 *   - weekly:  "2026-W05"
 *   - monthly: "2026-02"
 *
 * Only items denominated in any currency are included (multi-currency amounts
 * are summed directly — the caller should pre-convert to a base currency if
 * needed).
 *
 * @param receivables - Expected incoming payments
 * @param payables    - Expected outgoing payments
 * @param periodType  - "weekly" or "monthly"
 * @param periods     - Number of future periods to project
 */
export function projectCashFlow(
  receivables: Array<{ amount: number; dueDate: Date; currency: string }>,
  payables: Array<{ amount: number; dueDate: Date; currency: string }>,
  periodType: 'weekly' | 'monthly',
  periods: number,
): CashFlowProjection[] {
  const now = new Date()
  const periodKeys = generatePeriodKeys(now, periodType, periods)

  // Initialize period map
  const periodMap: Record<string, { inflows: number; outflows: number }> = {}
  for (const key of periodKeys) {
    periodMap[key] = { inflows: 0, outflows: 0 }
  }

  // Bin receivables into periods
  for (const r of receivables) {
    const key = periodKey(new Date(r.dueDate), periodType)
    if (periodMap[key] !== undefined) {
      periodMap[key].inflows = round(periodMap[key].inflows + r.amount)
    }
  }

  // Bin payables into periods
  for (const p of payables) {
    const key = periodKey(new Date(p.dueDate), periodType)
    if (periodMap[key] !== undefined) {
      periodMap[key].outflows = round(periodMap[key].outflows + p.amount)
    }
  }

  // Build projection with cumulative running total
  const projections: CashFlowProjection[] = []
  let cumulative = 0

  for (const key of periodKeys) {
    const { inflows, outflows } = periodMap[key]
    const net = round(inflows - outflows)
    cumulative = round(cumulative + net)

    projections.push({
      period: key,
      inflows,
      outflows,
      net,
      cumulative,
    })
  }

  return projections
}

// ---------------------------------------------------------------------------
// 3. Days Sales Outstanding (DSO)
// ---------------------------------------------------------------------------

/**
 * Calculate Days Sales Outstanding — a standard trade finance metric measuring
 * the average number of days it takes to collect payment after a sale.
 *
 *   DSO = (totalReceivables / totalRevenue) * periodDays
 *
 * A lower DSO indicates faster collection; a higher DSO suggests collection
 * inefficiency or extended credit terms.
 *
 * @param totalReceivables - Total outstanding receivables at period end
 * @param totalRevenue     - Total revenue (credit sales) during the period
 * @param periodDays       - Number of days in the measurement period (e.g. 90)
 * @returns DSO rounded to 1 decimal place, or 0 if revenue is zero
 */
export function calculateDSO(
  totalReceivables: number,
  totalRevenue: number,
  periodDays: number,
): number {
  if (totalRevenue <= 0) {
    return 0
  }
  return round((totalReceivables / totalRevenue) * periodDays, 1)
}

// ---------------------------------------------------------------------------
// 4. Overdue Payment Identification
// ---------------------------------------------------------------------------

/**
 * Identify payments that are past their due date and still unpaid.
 *
 * Filters to payments whose status is pending, approved, or submitted
 * and whose due date has already passed. Returns them sorted by days
 * overdue in descending order (most overdue first).
 *
 * @param payments - Full list of payment records
 * @param today    - Reference date for overdue calculation (defaults to now)
 */
export function identifyOverduePayments(
  payments: Array<{
    id: string
    reference: string
    payer: string
    payee: string
    amount: number
    currency: string
    dueDate: Date
    status: string
  }>,
  today?: Date,
): Array<{
  id: string
  reference: string
  payer: string
  payee: string
  amount: number
  currency: string
  daysOverdue: number
}> {
  const referenceDate = today ?? new Date()

  const overdue = payments
    .filter((p) => {
      const statusLower = p.status.toLowerCase()
      if (!UNPAID_STATUSES.includes(statusLower)) {
        return false
      }
      const due = new Date(p.dueDate)
      return due.getTime() < referenceDate.getTime()
    })
    .map((p) => ({
      id: p.id,
      reference: p.reference,
      payer: p.payer,
      payee: p.payee,
      amount: p.amount,
      currency: p.currency,
      daysOverdue: daysOverdue(new Date(p.dueDate), referenceDate),
    }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue)

  return overdue
}
