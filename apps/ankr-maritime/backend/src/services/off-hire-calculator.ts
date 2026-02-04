// off-hire-calculator.ts
// Off-hire calculations: duration, deduction amounts, and statement generation.
// Pure functions — no DB or Prisma dependency.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OffHireDuration {
  hours: number
  days: number
}

export interface OffHireDeduction {
  deduction: number
  adjustmentFactor: number
  notes: string
}

export interface OffHireStatementEvent {
  type: string
  start: Date
  end: Date
  deduction: number
  description: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Adjustment factors by off-hire type.
 * Some types receive partial deduction rather than full hire rate deduction:
 * - bunkering: 50% — operational necessity, shared responsibility
 * - crew_change: 50% — necessary operational maintenance
 * - weather: 0% by default — depends on charter party terms (often not off-hire)
 * - All others: 100% full deduction
 */
const ADJUSTMENT_FACTORS: Record<string, { factor: number; notes: string }> = {
  breakdown: { factor: 1.0, notes: 'Full deduction — mechanical breakdown' },
  drydock: { factor: 1.0, notes: 'Full deduction — scheduled or emergency drydocking' },
  deviation: { factor: 1.0, notes: 'Full deduction — vessel deviation from voyage orders' },
  bunkering: { factor: 0.5, notes: 'Partial deduction (50%) — bunkering is operational necessity' },
  crew_change: { factor: 0.5, notes: 'Partial deduction (50%) — necessary crew rotation' },
  port_state_detention: { factor: 1.0, notes: 'Full deduction — port state control detention' },
  strike: { factor: 1.0, notes: 'Full deduction — strike or labor dispute' },
  weather: { factor: 0.0, notes: 'No deduction — weather events typically excluded per CP terms' },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 16).replace('T', ' ')
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate precise off-hire duration accounting for fractional days.
 *
 * Returns both hours and days (as a decimal) for precise billing.
 */
export function calculateOffHireDuration(start: Date, end: Date): OffHireDuration {
  const diffMs = end.getTime() - start.getTime()
  if (diffMs <= 0) {
    return { hours: 0, days: 0 }
  }

  const hours = round(diffMs / (1000 * 60 * 60), 4)
  const days = round(hours / 24, 4)

  return { hours, days }
}

/**
 * Calculate off-hire deduction amount.
 *
 * Some off-hire types receive partial deduction:
 * - bunkering: 50% of daily rate
 * - crew_change: 50% of daily rate
 * - weather: 0% (depends on CP terms, default is no deduction)
 * - All others (breakdown, drydock, deviation, etc.): 100%
 *
 * deduction = durationDays * dailyRate * adjustmentFactor
 */
export function calculateOffHireDeduction(
  durationDays: number,
  dailyRate: number,
  offHireType: string,
): OffHireDeduction {
  const typeKey = offHireType.toLowerCase()
  const config = ADJUSTMENT_FACTORS[typeKey] ?? { factor: 1.0, notes: `Full deduction — ${offHireType}` }

  const deduction = round(durationDays * dailyRate * config.factor)

  return {
    deduction,
    adjustmentFactor: config.factor,
    notes: config.notes,
  }
}

/**
 * Generate a formatted text off-hire statement from a list of events.
 *
 * Produces a human-readable multi-line statement suitable for
 * inclusion in hire payment documentation or CP correspondence.
 */
export function generateOffHireStatement(
  events: Array<OffHireStatementEvent>,
): string {
  if (events.length === 0) {
    return 'OFF-HIRE STATEMENT\n\nNo off-hire events recorded for this period.'
  }

  const lines: string[] = []

  lines.push('=' .repeat(72))
  lines.push('OFF-HIRE STATEMENT')
  lines.push('='.repeat(72))
  lines.push('')
  lines.push(`Date generated: ${formatDate(new Date())} UTC`)
  lines.push(`Total events: ${events.length}`)
  lines.push('')
  lines.push('-'.repeat(72))

  let totalDeduction = 0

  for (let i = 0; i < events.length; i++) {
    const e = events[i]
    const durationMs = e.end.getTime() - e.start.getTime()
    const durationHours = round(durationMs / (1000 * 60 * 60), 2)
    const durationDays = round(durationHours / 24, 4)

    lines.push('')
    lines.push(`Event #${i + 1}: ${e.type.toUpperCase().replace(/_/g, ' ')}`)
    lines.push(`  From:        ${formatDate(e.start)} UTC`)
    lines.push(`  To:          ${formatDate(e.end)} UTC`)
    lines.push(`  Duration:    ${durationDays} days (${durationHours} hours)`)
    lines.push(`  Description: ${e.description}`)
    lines.push(`  Deduction:   USD ${formatCurrency(e.deduction)}`)
    lines.push('-'.repeat(72))

    totalDeduction += e.deduction
  }

  lines.push('')
  lines.push('='.repeat(72))
  lines.push(`TOTAL OFF-HIRE DEDUCTION: USD ${formatCurrency(round(totalDeduction))}`)
  lines.push('='.repeat(72))
  lines.push('')
  lines.push('This statement is subject to the terms and conditions of the Charter Party.')

  return lines.join('\n')
}
