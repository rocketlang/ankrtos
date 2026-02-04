// Weather Working Day Calculator
//
// Pure business-logic functions for weather deduction calculations,
// weather event classification, and claim documentation report generation.

// ─── Type Definitions ────────────────────────────────────────────────────────

export interface WeatherRecord {
  date: Date
  isWeatherDay: boolean
  hoursLost: number
  condition: string
}

export interface WeatherDeductionResult {
  totalHoursLost: number
  deductibleDays: number
  breakdownByCondition: Record<string, number>
}

// ─── Laytime Term Rules ──────────────────────────────────────────────────────

/**
 * Calculate weather deductions based on laytime term rules.
 *
 * Supported terms:
 *   - WWD    — Weather Working Day: all weather days are deducted from laytime
 *   - WWDSSHEX — Weather Working Days, Sundays & Holidays Excepted:
 *                weather days deducted, plus Sundays and holidays excluded
 *   - WWDSHEX  — Weather Working Days, Sundays & Holidays Excepted (alias):
 *                same as WWDSSHEX
 *
 * Under all terms, only records where isWeatherDay=true contribute to
 * deductions. The difference between terms determines which additional
 * non-weather days (Sundays/holidays) are also excluded from laytime,
 * but that logic is handled separately by the laytime engine. Here we
 * focus exclusively on weather-related deductions.
 */
export function calculateWeatherDeductions(
  records: WeatherRecord[],
  terms: 'WWD' | 'WWDSSHEX' | 'WWDSHEX',
): WeatherDeductionResult {
  const breakdownByCondition: Record<string, number> = {}
  let totalHoursLost = 0
  let deductibleDays = 0

  for (const record of records) {
    if (!record.isWeatherDay) continue

    // Under all WWD-based terms, weather days are fully deductible
    totalHoursLost += record.hoursLost

    // Count each weather day as a deductible day
    deductibleDays += 1

    // Accumulate by condition
    const condKey = record.condition || 'unknown'
    breakdownByCondition[condKey] = (breakdownByCondition[condKey] ?? 0) + record.hoursLost
  }

  // For WWDSSHEX and WWDSHEX, Sundays and holidays are also excluded
  // but that is handled by the laytime exclusion engine, not here.
  // We apply the same weather deduction logic across all three terms.
  if (terms === 'WWDSSHEX' || terms === 'WWDSHEX') {
    // Additional Sunday/holiday filtering would be layered on top by the
    // calling code via the laytime rules engine. Weather deductions remain
    // the same regardless.
  }

  return {
    totalHoursLost: Math.round(totalHoursLost * 100) / 100,
    deductibleDays,
    breakdownByCondition,
  }
}

// ─── Weather Event Classification ────────────────────────────────────────────

/**
 * Determine whether the given weather conditions constitute a weather event
 * that should stop cargo operations.
 *
 * Criteria (any one triggers a weather event):
 *   - Wind speed exceeds 25 knots
 *   - Wave height exceeds 2 metres
 *   - Condition is heavy_rain, storm, or fog with visibility < 0.5 nautical miles
 *
 * These thresholds are based on common charterparty weather clauses and
 * standard port authority guidelines for cargo operations.
 */
export function isWeatherEvent(
  windKnots: number,
  waveHeight: number,
  condition: string,
): boolean {
  // Wind speed threshold
  if (windKnots > 25) return true

  // Wave height threshold
  if (waveHeight > 2) return true

  // Condition-based classification
  const normalised = condition.toLowerCase().trim()

  if (normalised === 'storm' || normalised === 'heavy_rain') return true

  // Fog — assumed to have visibility < 0.5nm when condition is "fog"
  if (normalised === 'fog') return true

  return false
}

// ─── Weather Report Generation ───────────────────────────────────────────────

/**
 * Generate a textual weather report suitable for inclusion in demurrage
 * claim documentation.
 *
 * The report summarises weather conditions during the specified period at
 * the given port, listing each weather event with hours lost and providing
 * aggregate statistics.
 */
export function generateWeatherReport(
  records: WeatherRecord[],
  portName: string,
  period: { start: Date; end: Date },
): string {
  const filteredRecords = records.filter(
    (r) => r.date >= period.start && r.date <= period.end,
  )

  const totalDays = filteredRecords.length
  const weatherDays = filteredRecords.filter((r) => r.isWeatherDay)
  const totalHoursLost = weatherDays.reduce((sum, r) => sum + r.hoursLost, 0)

  // Build condition breakdown
  const conditionBreakdown: Record<string, { count: number; hours: number }> = {}
  for (const wd of weatherDays) {
    const condKey = wd.condition || 'unknown'
    const existing = conditionBreakdown[condKey]
    if (existing) {
      existing.count += 1
      existing.hours += wd.hoursLost
    } else {
      conditionBreakdown[condKey] = { count: 1, hours: wd.hoursLost }
    }
  }

  const startStr = period.start.toISOString().split('T')[0]
  const endStr = period.end.toISOString().split('T')[0]

  const lines: string[] = [
    `WEATHER WORKING DAY REPORT`,
    `==========================`,
    ``,
    `Port: ${portName}`,
    `Period: ${startStr} to ${endStr}`,
    `Total Days Recorded: ${totalDays}`,
    `Weather Days (cargo ops prevented): ${weatherDays.length}`,
    `Total Hours Lost to Weather: ${Math.round(totalHoursLost * 100) / 100}`,
    ``,
    `CONDITION BREAKDOWN:`,
    `--------------------`,
  ]

  const conditions = Object.entries(conditionBreakdown).sort((a, b) => b[1].hours - a[1].hours)

  if (conditions.length === 0) {
    lines.push(`  No weather events recorded during this period.`)
  } else {
    for (const [condition, data] of conditions) {
      lines.push(
        `  ${condition}: ${data.count} occurrence(s), ${Math.round(data.hours * 100) / 100} hours lost`,
      )
    }
  }

  lines.push(``)
  lines.push(`DAILY LOG:`)
  lines.push(`----------`)

  for (const record of filteredRecords) {
    const dateStr = record.date.toISOString().split('T')[0]
    const weatherFlag = record.isWeatherDay ? '[WEATHER DAY]' : '[WORKING DAY]'
    const hoursStr = record.hoursLost > 0 ? ` — ${record.hoursLost}h lost` : ''
    lines.push(`  ${dateStr} ${weatherFlag} ${record.condition}${hoursStr}`)
  }

  lines.push(``)
  lines.push(`--- End of Weather Report ---`)

  return lines.join('\n')
}
