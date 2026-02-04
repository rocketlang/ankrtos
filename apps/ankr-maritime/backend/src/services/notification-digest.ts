// notification-digest.ts
// Notification digest builder — aggregates, prioritises, and formats
// maritime notification events into daily/weekly digest reports.
// Pure functions — no DB or Prisma dependency.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NotificationEvent {
  type: string
  title: string
  entityType: string
  entityId: string
  priority: string
  createdAt: Date
}

export interface DailyDigest {
  totalEvents: number
  categories: Record<string, number>
  highlights: {
    title: string
    type: string
    entityId: string
    priority: string
  }[]
  textContent: string
}

export interface WeeklyDigestInput {
  period: string
  totalEvents: number
  categories: Record<string, number>
}

export interface WeeklyDigest {
  totalEvents: number
  dailyAverage: number
  categories: Record<string, number>
  dailyBreakdown: { period: string; totalEvents: number }[]
  trends: {
    category: string
    thisWeek: number
    lastPeriod: number
    change: number
    direction: 'up' | 'down' | 'stable'
  }[]
  textContent: string
}

export interface DigestHighlight {
  title: string
  type: string
  priority: string
}

export interface DigestForHtml {
  totalEvents: number
  categories: Record<string, number>
  highlights: DigestHighlight[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Priority rank (lower = more important). */
const PRIORITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

/** Maximum highlights included in a daily digest. */
const MAX_HIGHLIGHTS = 10

/** Human-friendly labels for common notification types. */
const TYPE_LABELS: Record<string, string> = {
  voyage_update: 'Voyage Update',
  fixture_update: 'Fixture Update',
  charter_update: 'Charter Update',
  vessel_alert: 'Vessel Alert',
  cargo_alert: 'Cargo Alert',
  compliance_alert: 'Compliance Alert',
  payment_alert: 'Payment Alert',
  crew_alert: 'Crew Alert',
  document_expiry: 'Document Expiry',
  port_update: 'Port Update',
  market_update: 'Market Update',
  bunker_alert: 'Bunker Alert',
  laytime_alert: 'Laytime Alert',
  claim_update: 'Claim Update',
  da_update: 'DA Update',
  approval_required: 'Approval Required',
  system_alert: 'System Alert',
}

/** Priority badge colours for the HTML template. */
const PRIORITY_COLOURS: Record<string, { bg: string; text: string }> = {
  critical: { bg: '#DC2626', text: '#FFFFFF' },
  high: { bg: '#F59E0B', text: '#1F2937' },
  medium: { bg: '#3B82F6', text: '#FFFFFF' },
  low: { bg: '#6B7280', text: '#FFFFFF' },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return the numeric rank for a priority string (unknown priorities rank last). */
function priorityRank(priority: string): number {
  return PRIORITY_RANK[priority.toLowerCase()] ?? 99
}

/** Human-readable label for a notification type. */
function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Format a number with commas (e.g. 1,234). */
function fmtNum(n: number): string {
  return n.toLocaleString('en-US')
}

/** Escape HTML entities for safe embedding. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ---------------------------------------------------------------------------
// 1. Build Daily Digest
// ---------------------------------------------------------------------------

/**
 * Aggregate an array of notification events into a structured daily digest.
 *
 * Groups events by their `type` field into categories, selects the top 10
 * highlights (sorted by priority, then recency), and generates a plain-text
 * summary suitable for email or in-app display.
 *
 * @param notifications - Array of notification events for the day
 * @returns Structured daily digest
 */
export function buildDailyDigest(notifications: NotificationEvent[]): DailyDigest {
  if (notifications.length === 0) {
    return {
      totalEvents: 0,
      categories: {},
      highlights: [],
      textContent: 'No events to report for today.',
    }
  }

  // --- Group by category ---
  const categories: Record<string, number> = {}
  for (const n of notifications) {
    const cat = n.type
    categories[cat] = (categories[cat] || 0) + 1
  }

  // --- Pick highlights ---
  // Sort by priority (critical first), then by recency (newest first)
  const sorted = [...notifications].sort((a, b) => {
    const prDiff = priorityRank(a.priority) - priorityRank(b.priority)
    if (prDiff !== 0) return prDiff
    return b.createdAt.getTime() - a.createdAt.getTime()
  })

  const highlights = sorted.slice(0, MAX_HIGHLIGHTS).map((n) => ({
    title: n.title,
    type: n.type,
    entityId: n.entityId,
    priority: n.priority,
  }))

  // --- Generate text content ---
  const lines: string[] = []
  lines.push(`DAILY DIGEST - ${fmtNum(notifications.length)} event(s)`)
  lines.push('='.repeat(48))
  lines.push('')

  // Category summary
  lines.push('SUMMARY BY CATEGORY')
  lines.push('-'.repeat(32))
  const sortedCategories = Object.entries(categories).sort((a, b) => b[1] - a[1])
  for (const [cat, count] of sortedCategories) {
    lines.push(`  ${typeLabel(cat)}: ${count}`)
  }
  lines.push('')

  // Highlights
  if (highlights.length > 0) {
    lines.push('TOP HIGHLIGHTS')
    lines.push('-'.repeat(32))
    for (let i = 0; i < highlights.length; i++) {
      const h = highlights[i]
      const badge = h.priority.toUpperCase()
      lines.push(`  ${i + 1}. [${badge}] ${h.title}`)
      lines.push(`     Type: ${typeLabel(h.type)} | Entity: ${h.entityId}`)
    }
  }

  const textContent = lines.join('\n')

  return {
    totalEvents: notifications.length,
    categories,
    highlights,
    textContent,
  }
}

// ---------------------------------------------------------------------------
// 2. Build Weekly Digest
// ---------------------------------------------------------------------------

/**
 * Aggregate multiple daily digests into a weekly digest with trend analysis.
 *
 * Splits the input in half: the first half is treated as "last period" and the
 * second half as "this week" for trend comparison. This allows the function to
 * work with any number of daily inputs (not strictly 7).
 *
 * @param dailyDigests - Array of daily digest summaries (ordered chronologically)
 * @returns Weekly digest with trend comparisons
 */
export function buildWeeklyDigest(dailyDigests: WeeklyDigestInput[]): WeeklyDigest {
  if (dailyDigests.length === 0) {
    return {
      totalEvents: 0,
      dailyAverage: 0,
      categories: {},
      dailyBreakdown: [],
      trends: [],
      textContent: 'No events to report for this week.',
    }
  }

  // Aggregate totals
  const totalEvents = dailyDigests.reduce((sum, d) => sum + d.totalEvents, 0)
  const dailyAverage = Math.round((totalEvents / dailyDigests.length) * 10) / 10

  // Aggregate categories
  const categories: Record<string, number> = {}
  for (const digest of dailyDigests) {
    for (const [cat, count] of Object.entries(digest.categories)) {
      categories[cat] = (categories[cat] || 0) + count
    }
  }

  // Daily breakdown
  const dailyBreakdown = dailyDigests.map((d) => ({
    period: d.period,
    totalEvents: d.totalEvents,
  }))

  // --- Trend comparison ---
  // Split into two halves for comparison
  const midpoint = Math.floor(dailyDigests.length / 2)
  const lastPeriodDigests = dailyDigests.slice(0, midpoint)
  const thisWeekDigests = dailyDigests.slice(midpoint)

  const lastPeriodCats: Record<string, number> = {}
  for (const d of lastPeriodDigests) {
    for (const [cat, count] of Object.entries(d.categories)) {
      lastPeriodCats[cat] = (lastPeriodCats[cat] || 0) + count
    }
  }

  const thisWeekCats: Record<string, number> = {}
  for (const d of thisWeekDigests) {
    for (const [cat, count] of Object.entries(d.categories)) {
      thisWeekCats[cat] = (thisWeekCats[cat] || 0) + count
    }
  }

  // Merge all category keys
  const allCats = new Set([...Object.keys(lastPeriodCats), ...Object.keys(thisWeekCats)])

  const trends: WeeklyDigest['trends'] = []
  for (const cat of allCats) {
    const thisWeek = thisWeekCats[cat] || 0
    const lastPeriod = lastPeriodCats[cat] || 0
    const change = lastPeriod === 0
      ? (thisWeek > 0 ? 100 : 0)
      : Math.round(((thisWeek - lastPeriod) / lastPeriod) * 100)
    const direction: 'up' | 'down' | 'stable' =
      change > 5 ? 'up' : change < -5 ? 'down' : 'stable'
    trends.push({ category: cat, thisWeek, lastPeriod, change, direction })
  }

  // Sort trends: categories with the biggest absolute change first
  trends.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))

  // --- Text content ---
  const lines: string[] = []
  lines.push(`WEEKLY DIGEST - ${fmtNum(totalEvents)} total event(s)`)
  lines.push('='.repeat(48))
  lines.push(`Daily average: ${dailyAverage} events/day`)
  lines.push(`Period: ${dailyDigests[0].period} to ${dailyDigests[dailyDigests.length - 1].period}`)
  lines.push('')

  lines.push('CATEGORY TOTALS')
  lines.push('-'.repeat(32))
  const sortedCats = Object.entries(categories).sort((a, b) => b[1] - a[1])
  for (const [cat, count] of sortedCats) {
    lines.push(`  ${typeLabel(cat)}: ${fmtNum(count)}`)
  }
  lines.push('')

  if (trends.length > 0) {
    lines.push('TRENDS (vs prior period)')
    lines.push('-'.repeat(32))
    for (const t of trends) {
      const arrow = t.direction === 'up' ? '+' : t.direction === 'down' ? '-' : '='
      lines.push(
        `  ${typeLabel(t.category)}: ${t.thisWeek} (${arrow}${Math.abs(t.change)}%)`,
      )
    }
    lines.push('')
  }

  lines.push('DAILY BREAKDOWN')
  lines.push('-'.repeat(32))
  for (const d of dailyBreakdown) {
    lines.push(`  ${d.period}: ${fmtNum(d.totalEvents)} events`)
  }

  const textContent = lines.join('\n')

  return {
    totalEvents,
    dailyAverage,
    categories,
    dailyBreakdown,
    trends,
    textContent,
  }
}

// ---------------------------------------------------------------------------
// 3. Prioritise Notifications
// ---------------------------------------------------------------------------

/**
 * Sort notification events by priority and recency.
 *
 * Priority order: critical > high > medium > low (unknown priorities sort last).
 * Within the same priority level, events are sorted by recency (newest first).
 *
 * @param events - Array of events to sort
 * @returns New sorted array (the input is not mutated)
 */
export function prioritizeNotifications<
  T extends { type: string; priority: string; createdAt: Date },
>(events: T[]): T[] {
  return [...events].sort((a, b) => {
    const prDiff = priorityRank(a.priority) - priorityRank(b.priority)
    if (prDiff !== 0) return prDiff
    return b.createdAt.getTime() - a.createdAt.getTime()
  })
}

// ---------------------------------------------------------------------------
// 4. Generate Digest HTML
// ---------------------------------------------------------------------------

/**
 * Generate an HTML email for a notification digest.
 *
 * Produces a self-contained, inline-styled HTML document using a maritime-themed
 * dark template. The layout includes:
 * - Header with total event count
 * - Category summary cards
 * - Highlights table with priority badges
 * - Footer with branding
 *
 * @param digest - Digest data to render
 * @returns Complete HTML string
 */
export function generateDigestHtml(digest: DigestForHtml): string {
  const { totalEvents, categories, highlights } = digest

  // --- Category cards ---
  const sortedCats = Object.entries(categories).sort((a, b) => b[1] - a[1])
  const categoryCards = sortedCats
    .map(
      ([cat, count]) => `
        <td style="padding: 8px 12px; text-align: center; background-color: #1E293B; border-radius: 6px; border: 1px solid #334155;">
          <div style="font-size: 24px; font-weight: 700; color: #38BDF8;">${fmtNum(count)}</div>
          <div style="font-size: 11px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px;">${escapeHtml(typeLabel(cat))}</div>
        </td>`,
    )
    .join('\n        <td style="width: 8px;"></td>')

  // --- Highlight rows ---
  const highlightRows = highlights
    .map((h) => {
      const colours = PRIORITY_COLOURS[h.priority.toLowerCase()] || PRIORITY_COLOURS.low
      return `
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #1E293B;">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background-color: ${colours.bg}; color: ${colours.text};">${escapeHtml(h.priority)}</span>
            </td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #1E293B; color: #E2E8F0; font-size: 14px;">
              ${escapeHtml(h.title)}
            </td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #1E293B; color: #94A3B8; font-size: 12px;">
              ${escapeHtml(typeLabel(h.type))}
            </td>
          </tr>`
    })
    .join('\n')

  // --- Full HTML ---
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Maritime Operations Digest</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0F172A;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0C4A6E 0%, #164E63 100%); border-radius: 8px 8px 0 0; padding: 32px 24px; text-align: center;">
              <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: #38BDF8; margin-bottom: 8px;">Mari8X Maritime Platform</div>
              <div style="font-size: 28px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px;">Operations Digest</div>
              <div style="font-size: 14px; color: #94A3B8; margin-top: 12px;">
                <span style="font-size: 36px; font-weight: 700; color: #38BDF8;">${fmtNum(totalEvents)}</span>
                <span style="display: block; margin-top: 4px;">events recorded</span>
              </div>
            </td>
          </tr>

          <!-- Category Summary -->
          <tr>
            <td style="background-color: #0F172A; padding: 24px;">
              <div style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #64748B; margin-bottom: 12px;">Category Breakdown</div>
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  ${categoryCards}
                </tr>
              </table>
            </td>
          </tr>

          <!-- Highlights -->
          ${highlights.length > 0 ? `
          <tr>
            <td style="background-color: #0F172A; padding: 0 24px 24px;">
              <div style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #64748B; margin-bottom: 12px;">Highlights</div>
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #1E293B; border-radius: 6px; border: 1px solid #334155;">
                <tr style="background-color: #0F172A;">
                  <th style="padding: 8px 12px; text-align: left; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748B; border-bottom: 1px solid #334155;">Priority</th>
                  <th style="padding: 8px 12px; text-align: left; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748B; border-bottom: 1px solid #334155;">Event</th>
                  <th style="padding: 8px 12px; text-align: left; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748B; border-bottom: 1px solid #334155;">Type</th>
                </tr>
                ${highlightRows}
              </table>
            </td>
          </tr>` : ''}

          <!-- Footer -->
          <tr>
            <td style="background-color: #1E293B; border-radius: 0 0 8px 8px; padding: 20px 24px; text-align: center; border-top: 1px solid #334155;">
              <div style="font-size: 11px; color: #64748B; line-height: 1.6;">
                Mari8X Maritime Operations Platform<br>
                This is an automated digest. Do not reply directly to this email.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// 5. Should Send Digest
// ---------------------------------------------------------------------------

/**
 * Determine whether a digest email should be dispatched.
 *
 * Rules:
 * - Always send if any event has "critical" priority (regardless of digest type).
 * - Daily digest: send if there is at least one event.
 * - Weekly digest: always send (even if zero events, as a confirmation).
 *
 * @param events     - Array of events in the digest period
 * @param digestType - 'daily' or 'weekly'
 * @returns true if the digest should be sent
 */
export function shouldSendDigest(
  events: { type: string; priority: string }[],
  digestType: string,
): boolean {
  // Critical events always warrant immediate notification
  const hasCritical = events.some(
    (e) => e.priority.toLowerCase() === 'critical',
  )
  if (hasCritical) return true

  const normalised = digestType.toLowerCase()

  if (normalised === 'daily') {
    return events.length > 0
  }

  if (normalised === 'weekly') {
    return true
  }

  // Unknown digest type — only send if events exist
  return events.length > 0
}
