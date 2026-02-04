// pipeline-analytics.ts
// CRM pipeline analytics: metrics, conversion funnels, revenue forecasting,
// lead scoring, and at-risk identification.
// Pure functions — no DB or Prisma dependency.

// ---------------------------------------------------------------------------
// Types — Input
// ---------------------------------------------------------------------------

export interface PipelineLead {
  id: string
  stage: PipelineStage
  estimatedValue: number
  probability: number           // 0-100
  createdAt: Date
  actualClose?: Date            // set when won or lost
  expectedClose?: Date
  company?: string
  contactName?: string
  vesselType?: string
  route?: string
  source?: LeadSource
  lastStageChangeAt?: Date
}

export type PipelineStage =
  | 'prospect'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'

export type LeadSource =
  | 'referral'
  | 'broker'
  | 'conference'
  | 'email'
  | 'website'
  | 'other'

export interface LeadActivity {
  leadId: string
  activityDate: Date
  activityType: string
}

// ---------------------------------------------------------------------------
// Types — Output
// ---------------------------------------------------------------------------

export interface PipelineMetrics {
  totalLeads: number
  totalValue: number
  weightedValue: number
  byStage: StageMetrics[]
  velocity: number             // avg days from prospect to won
  conversionRate: number       // won / (won + lost) as percentage
  avgDealSize: number          // totalValue of won / wonCount
}

export interface StageMetrics {
  stage: PipelineStage
  count: number
  value: number
  weightedValue: number
  avgDaysInStage: number
}

export interface FunnelStep {
  fromStage: PipelineStage
  toStage: PipelineStage
  conversionRate: number       // percentage
  avgDaysToConvert: number
  droppedCount: number
}

export interface RevenueForecast {
  month: string                // YYYY-MM
  projectedRevenue: number
  confidence: number           // 0-1
}

export interface LeadScoreResult {
  score: number                // 0-100
  breakdown: ScoreBreakdownItem[]
}

export interface ScoreBreakdownItem {
  category: string
  points: number
  maxPoints: number
}

export interface AtRiskLead {
  leadId: string
  riskFactors: string[]
  recommendedAction: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Stage-based probability multipliers for weighted pipeline value. */
const STAGE_PROBABILITY: Record<PipelineStage, number> = {
  prospect: 0.10,
  qualified: 0.25,
  proposal: 0.50,
  negotiation: 0.75,
  won: 1.00,
  lost: 0.00,
}

/** Ordered pipeline stages (excluding terminal states for funnel). */
const FUNNEL_STAGES: PipelineStage[] = [
  'prospect',
  'qualified',
  'proposal',
  'negotiation',
  'won',
]

/** Lead source quality scores. */
const SOURCE_SCORES: Record<LeadSource, number> = {
  referral: 20,
  broker: 15,
  conference: 10,
  email: 5,
  website: 5,
  other: 0,
}

/** Thresholds for at-risk identification. */
const RISK_NO_ACTIVITY_DAYS = 14
const RISK_STALE_STAGE_DAYS = 30

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86_400_000
  return Math.abs(new Date(b).getTime() - new Date(a).getTime()) / msPerDay
}

function daysSince(date: Date, now: Date = new Date()): number {
  return daysBetween(date, now)
}

/**
 * Return the furthest stage index a lead has reached. A "won" lead has
 * traversed every funnel stage. A "lost" lead is counted up to whatever
 * stage it was in at the time it was lost (we approximate with the stage
 * recorded on the lead).
 */
function stageIndex(stage: PipelineStage): number {
  return FUNNEL_STAGES.indexOf(stage === 'lost' ? 'prospect' : stage)
}

/**
 * Format a Date into "YYYY-MM" string.
 */
function formatMonth(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

// ---------------------------------------------------------------------------
// 1. Pipeline Metrics
// ---------------------------------------------------------------------------

/**
 * Calculate aggregate pipeline metrics from a list of leads.
 *
 * - totalLeads / totalValue / weightedValue across all leads
 * - Per-stage breakdown with count, value, weighted value, avg days in stage
 * - Velocity: average days from creation to close for won leads
 * - Conversion rate: won / (won + lost) as a percentage
 * - Average deal size among won leads
 */
export function calculatePipelineMetrics(leads: PipelineLead[]): PipelineMetrics {
  const totalLeads = leads.length
  const totalValue = round(leads.reduce((s, l) => s + l.estimatedValue, 0))
  const weightedValue = round(
    leads.reduce((s, l) => s + l.estimatedValue * STAGE_PROBABILITY[l.stage], 0),
  )

  // --- Per-stage ---
  const stageMap = new Map<PipelineStage, PipelineLead[]>()
  for (const lead of leads) {
    const arr = stageMap.get(lead.stage) ?? []
    arr.push(lead)
    stageMap.set(lead.stage, arr)
  }

  const now = new Date()
  const allStages: PipelineStage[] = [
    'prospect', 'qualified', 'proposal', 'negotiation', 'won', 'lost',
  ]

  const byStage: StageMetrics[] = allStages.map((stage) => {
    const group = stageMap.get(stage) ?? []
    const count = group.length
    const value = round(group.reduce((s, l) => s + l.estimatedValue, 0))
    const wv = round(group.reduce((s, l) => s + l.estimatedValue * STAGE_PROBABILITY[l.stage], 0))

    // Average days in current stage
    let avgDaysInStage = 0
    if (count > 0) {
      const totalDays = group.reduce((s, l) => {
        const refDate = l.lastStageChangeAt ?? l.createdAt
        const endDate = (stage === 'won' || stage === 'lost') ? (l.actualClose ?? now) : now
        return s + daysBetween(new Date(refDate), endDate)
      }, 0)
      avgDaysInStage = round(totalDays / count, 1)
    }

    return { stage, count, value, weightedValue: wv, avgDaysInStage }
  })

  // --- Velocity (avg days prospect -> won) ---
  const wonLeads = leads.filter((l) => l.stage === 'won' && l.actualClose)
  let velocity = 0
  if (wonLeads.length > 0) {
    const totalDays = wonLeads.reduce(
      (s, l) => s + daysBetween(new Date(l.createdAt), new Date(l.actualClose!)),
      0,
    )
    velocity = round(totalDays / wonLeads.length, 1)
  }

  // --- Conversion rate ---
  const wonCount = leads.filter((l) => l.stage === 'won').length
  const lostCount = leads.filter((l) => l.stage === 'lost').length
  const conversionRate = (wonCount + lostCount) > 0
    ? round((wonCount / (wonCount + lostCount)) * 100, 1)
    : 0

  // --- Average deal size ---
  const wonValue = wonLeads.reduce((s, l) => s + l.estimatedValue, 0)
  const avgDealSize = wonCount > 0 ? round(wonValue / wonCount) : 0

  return {
    totalLeads,
    totalValue,
    weightedValue,
    byStage,
    velocity,
    conversionRate,
    avgDealSize,
  }
}

// ---------------------------------------------------------------------------
// 2. Conversion Funnel
// ---------------------------------------------------------------------------

/**
 * Calculate conversion rates between consecutive pipeline stages.
 *
 * For each stage transition (prospect -> qualified -> proposal -> negotiation -> won),
 * returns:
 * - conversionRate: % of leads that reached fromStage and also reached toStage
 * - avgDaysToConvert: average time between entering fromStage and toStage
 * - droppedCount: leads that reached fromStage but did not progress further
 */
export function calculateConversionFunnel(leads: PipelineLead[]): FunnelStep[] {
  const steps: FunnelStep[] = []

  for (let i = 0; i < FUNNEL_STAGES.length - 1; i++) {
    const fromStage = FUNNEL_STAGES[i]
    const toStage = FUNNEL_STAGES[i + 1]
    const fromIdx = i
    const toIdx = i + 1

    // Leads that reached at least fromStage
    const reachedFrom = leads.filter((l) => {
      const idx = stageIndex(l.stage)
      // For lost leads, figure out their furthest stage.
      // If lost at 'negotiation' level, stageIndex returns 0 due to our mapping.
      // We need a better heuristic: use lastStageChangeAt presence or
      // simply check if the lead was beyond fromStage before being lost.
      if (l.stage === 'lost') {
        // Lost leads: consider them as having reached the stage they were in.
        // Since we don't have explicit stage history, approximate by checking
        // if the lead has markers of progression (expectedClose, probability).
        // For a robust funnel, leads should carry a maxStageReached field.
        // Fallback: assume lost leads at least reached prospect.
        return fromIdx === 0
      }
      return idx >= fromIdx
    })

    // Leads that reached at least toStage
    const reachedTo = leads.filter((l) => {
      if (l.stage === 'lost') return false
      return stageIndex(l.stage) >= toIdx
    })

    const fromCount = reachedFrom.length
    const toCount = reachedTo.length
    const droppedCount = fromCount - toCount

    const conversionRate = fromCount > 0
      ? round((toCount / fromCount) * 100, 1)
      : 0

    // Average days between stages — estimate from creation date spread
    // across stages. Without explicit stage transition timestamps, we
    // approximate using lead creation + stage position.
    let avgDaysToConvert = 0
    const convertedLeads = reachedTo.filter((l) => stageIndex(l.stage) >= toIdx)
    if (convertedLeads.length > 0) {
      // Rough estimate: total days / number of stage hops from creation to current
      const totalDays = convertedLeads.reduce((s, l) => {
        const totalLeadDays = l.actualClose
          ? daysBetween(new Date(l.createdAt), new Date(l.actualClose))
          : daysBetween(new Date(l.createdAt), new Date())
        const currentIdx = stageIndex(l.stage)
        // Evenly distribute time across stages traversed
        const perStageDays = currentIdx > 0 ? totalLeadDays / currentIdx : totalLeadDays
        return s + perStageDays
      }, 0)
      avgDaysToConvert = round(totalDays / convertedLeads.length, 1)
    }

    steps.push({
      fromStage,
      toStage,
      conversionRate,
      avgDaysToConvert,
      droppedCount: Math.max(0, droppedCount),
    })
  }

  return steps
}

// ---------------------------------------------------------------------------
// 3. Revenue Forecast
// ---------------------------------------------------------------------------

/**
 * Project revenue for the next N months based on the current pipeline.
 *
 * Methodology:
 * 1. Weighted pipeline: each open lead contributes estimatedValue * stage probability.
 *    Distributed evenly across the forecast window unless expectedClose falls in a
 *    specific month.
 * 2. Historical win rate is applied as a confidence discount.
 *
 * @param leads  Current pipeline leads (including won/lost for historical rates)
 * @param months Number of months to forecast (1-24)
 */
export function forecastRevenue(
  leads: PipelineLead[],
  months: number,
): RevenueForecast[] {
  const clampedMonths = clamp(months, 1, 24)
  const now = new Date()

  // --- Historical win rate ---
  const wonCount = leads.filter((l) => l.stage === 'won').length
  const lostCount = leads.filter((l) => l.stage === 'lost').length
  const historicalWinRate = (wonCount + lostCount) > 0
    ? wonCount / (wonCount + lostCount)
    : 0.5 // default to 50% when no history

  // --- Open leads only ---
  const openLeads = leads.filter(
    (l) => l.stage !== 'won' && l.stage !== 'lost',
  )

  // --- Build month buckets ---
  const forecasts: RevenueForecast[] = []
  for (let m = 0; m < clampedMonths; m++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() + m + 1, 1)
    const monthKey = formatMonth(monthDate)
    forecasts.push({ month: monthKey, projectedRevenue: 0, confidence: 0 })
  }

  // --- Distribute open leads ---
  for (const lead of openLeads) {
    const weightedValue = lead.estimatedValue * STAGE_PROBABILITY[lead.stage]
    const adjustedValue = weightedValue * historicalWinRate

    if (lead.expectedClose) {
      // Place in the matching forecast month, or first month if already past
      const closeMonth = formatMonth(new Date(lead.expectedClose))
      const bucket = forecasts.find((f) => f.month === closeMonth)
      if (bucket) {
        bucket.projectedRevenue += adjustedValue
      } else {
        // Expected close is outside forecast window — place in last month
        forecasts[forecasts.length - 1].projectedRevenue += adjustedValue
      }
    } else {
      // No expected close — distribute evenly
      const perMonth = adjustedValue / clampedMonths
      for (const bucket of forecasts) {
        bucket.projectedRevenue += perMonth
      }
    }
  }

  // --- Confidence: declines further into the future ---
  for (let i = 0; i < forecasts.length; i++) {
    // Confidence starts at historicalWinRate and decays 5% each month
    const decay = 1 - (i * 0.05)
    forecasts[i].confidence = round(clamp(historicalWinRate * decay, 0.05, 1.0), 2)
    forecasts[i].projectedRevenue = round(forecasts[i].projectedRevenue)
  }

  return forecasts
}

// ---------------------------------------------------------------------------
// 4. Lead Scoring
// ---------------------------------------------------------------------------

/**
 * Assign a score (0-100) to a lead based on completeness, quality, and timing.
 *
 * Scoring matrix:
 *   Company present        10
 *   Contact present        10
 *   Vessel type present    10
 *   Route present          10
 *   Estimated value > 0    15
 *   Probability > 50%      10
 *   Close within 30 days   15
 *   Source quality          up to 20
 *   Total                  100
 */
export function scoreLead(lead: PipelineLead): LeadScoreResult {
  const breakdown: ScoreBreakdownItem[] = []
  let total = 0

  // --- Company ---
  const companyPoints = lead.company ? 10 : 0
  breakdown.push({ category: 'Company', points: companyPoints, maxPoints: 10 })
  total += companyPoints

  // --- Contact ---
  const contactPoints = lead.contactName ? 10 : 0
  breakdown.push({ category: 'Contact', points: contactPoints, maxPoints: 10 })
  total += contactPoints

  // --- Vessel type ---
  const vesselPoints = lead.vesselType ? 10 : 0
  breakdown.push({ category: 'Vessel Type', points: vesselPoints, maxPoints: 10 })
  total += vesselPoints

  // --- Route ---
  const routePoints = lead.route ? 10 : 0
  breakdown.push({ category: 'Route', points: routePoints, maxPoints: 10 })
  total += routePoints

  // --- Estimated value ---
  const valuePoints = lead.estimatedValue > 0 ? 15 : 0
  breakdown.push({ category: 'Estimated Value', points: valuePoints, maxPoints: 15 })
  total += valuePoints

  // --- Probability ---
  const probPoints = lead.probability > 50 ? 10 : 0
  breakdown.push({ category: 'Probability', points: probPoints, maxPoints: 10 })
  total += probPoints

  // --- Expected close within 30 days ---
  let closePoints = 0
  if (lead.expectedClose) {
    const daysToClose = daysSince(new Date(lead.expectedClose), new Date())
    const isFuture = new Date(lead.expectedClose).getTime() > Date.now()
    if (isFuture && daysToClose <= 30) {
      closePoints = 15
    }
  }
  breakdown.push({ category: 'Close Timing', points: closePoints, maxPoints: 15 })
  total += closePoints

  // --- Source quality ---
  const sourcePoints = lead.source ? (SOURCE_SCORES[lead.source] ?? 0) : 0
  breakdown.push({ category: 'Source Quality', points: sourcePoints, maxPoints: 20 })
  total += sourcePoints

  return {
    score: clamp(total, 0, 100),
    breakdown,
  }
}

// ---------------------------------------------------------------------------
// 5. At-Risk Lead Identification
// ---------------------------------------------------------------------------

/**
 * Identify leads that may be stalling and need attention.
 *
 * Risk factors:
 *   - No activity in the last 14 days
 *   - In the same stage for more than 30 days
 *   - Past the expected close date
 *
 * Each at-risk lead gets a recommended action based on its risk profile.
 */
export function identifyAtRiskLeads(
  leads: PipelineLead[],
  activities: LeadActivity[],
): AtRiskLead[] {
  const now = new Date()
  const results: AtRiskLead[] = []

  // Build a map of leadId -> most recent activity date
  const lastActivityMap = new Map<string, Date>()
  for (const activity of activities) {
    const current = lastActivityMap.get(activity.leadId)
    const actDate = new Date(activity.activityDate)
    if (!current || actDate.getTime() > current.getTime()) {
      lastActivityMap.set(activity.leadId, actDate)
    }
  }

  // Only consider open leads
  const openLeads = leads.filter(
    (l) => l.stage !== 'won' && l.stage !== 'lost',
  )

  for (const lead of openLeads) {
    const riskFactors: string[] = []

    // --- No recent activity ---
    const lastActivity = lastActivityMap.get(lead.id)
    if (!lastActivity) {
      riskFactors.push('No recorded activity')
    } else {
      const daysSinceActivity = daysSince(lastActivity, now)
      if (daysSinceActivity > RISK_NO_ACTIVITY_DAYS) {
        riskFactors.push(
          `No activity in ${Math.round(daysSinceActivity)} days (threshold: ${RISK_NO_ACTIVITY_DAYS})`,
        )
      }
    }

    // --- Stuck in same stage ---
    const stageRef = lead.lastStageChangeAt ?? lead.createdAt
    const daysInStage = daysSince(new Date(stageRef), now)
    if (daysInStage > RISK_STALE_STAGE_DAYS) {
      riskFactors.push(
        `In '${lead.stage}' stage for ${Math.round(daysInStage)} days (threshold: ${RISK_STALE_STAGE_DAYS})`,
      )
    }

    // --- Past expected close ---
    if (lead.expectedClose) {
      const expectedDate = new Date(lead.expectedClose)
      if (expectedDate.getTime() < now.getTime()) {
        const daysOverdue = daysSince(expectedDate, now)
        riskFactors.push(
          `Past expected close date by ${Math.round(daysOverdue)} days`,
        )
      }
    }

    if (riskFactors.length > 0) {
      results.push({
        leadId: lead.id,
        riskFactors,
        recommendedAction: buildRecommendedAction(lead, riskFactors),
      })
    }
  }

  // Sort by number of risk factors descending (most at-risk first)
  results.sort((a, b) => b.riskFactors.length - a.riskFactors.length)

  return results
}

// ---------------------------------------------------------------------------
// Internal — Recommendation Builder
// ---------------------------------------------------------------------------

/**
 * Generate a recommended action string based on the lead's current state
 * and its identified risk factors.
 */
function buildRecommendedAction(
  lead: PipelineLead,
  riskFactors: string[],
): string {
  const hasStaleness = riskFactors.some((r) => r.includes('No activity') || r.includes('No recorded'))
  const hasStuckStage = riskFactors.some((r) => r.includes('stage for'))
  const hasPastClose = riskFactors.some((r) => r.includes('Past expected close'))

  // Multiple risk factors — escalate
  if (riskFactors.length >= 3) {
    return 'Escalate: schedule urgent review with team lead. Consider re-qualifying or closing.'
  }

  // Past close + stuck in stage
  if (hasPastClose && hasStuckStage) {
    return 'Re-qualify the opportunity. Update expected close date or consider moving to lost.'
  }

  // Past expected close only
  if (hasPastClose) {
    return 'Contact the customer to confirm timeline. Update expected close date.'
  }

  // Stuck in stage
  if (hasStuckStage) {
    switch (lead.stage) {
      case 'prospect':
        return 'Attempt qualification: schedule discovery call or send introductory proposal.'
      case 'qualified':
        return 'Advance to proposal: prepare and send a formal offer.'
      case 'proposal':
        return 'Follow up on proposal. Address any objections or outstanding questions.'
      case 'negotiation':
        return 'Push for close: escalate to senior management or offer concessions.'
      default:
        return 'Review and advance or close the lead.'
    }
  }

  // No activity
  if (hasStaleness) {
    return 'Re-engage: send a follow-up email or schedule a call.'
  }

  return 'Review lead status and take appropriate action.'
}
