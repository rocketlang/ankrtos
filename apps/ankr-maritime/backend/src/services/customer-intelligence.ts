// customer-intelligence.ts
// CRM customer intelligence: relationship scoring, segmentation,
// lifetime value analysis, and insight generation.
// Pure functions — no DB or Prisma dependency.

// ---------------------------------------------------------------------------
// Types — Input
// ---------------------------------------------------------------------------

export interface RelationshipData {
  totalFixtures: number
  totalRevenue: number
  avgPaymentDays: number
  lastFixtureDate: Date
  lastContactDate: Date
  disputeCount: number
  claimCount: number
  /** Date the customer first became active (for CLV calculations). */
  customerSince?: Date
}

export interface CustomerProfile {
  customerId: string
  companyName: string
  totalFixtures: number
  totalRevenue: number
  avgPaymentDays: number
  lastFixtureDate: Date
  lastContactDate: Date
  disputeCount: number
  claimCount: number
  customerSince: Date
  /** Cargo types this customer has shipped. */
  cargoTypes?: string[]
  /** Routes this customer has used. */
  routes?: string[]
  /** Vessel types this customer has chartered. */
  vesselTypes?: string[]
}

export interface Fixture {
  fixtureId: string
  customerId: string
  fixtureDate: Date
  revenue: number
  cargoType: string
  route: string
  vesselType: string
}

export interface Communication {
  communicationId: string
  customerId: string
  date: Date
  channel: string           // email, phone, meeting, etc.
  sentiment?: SentimentTag  // positive, neutral, negative
  summary?: string
}

export type SentimentTag = 'positive' | 'neutral' | 'negative'

// ---------------------------------------------------------------------------
// Types — Output
// ---------------------------------------------------------------------------

export interface RelationshipScoreResult {
  score: number                    // 0-100
  category: RelationshipCategory
  breakdown: RelationshipBreakdownItem[]
}

export type RelationshipCategory = 'platinum' | 'gold' | 'silver' | 'bronze'

export interface RelationshipBreakdownItem {
  dimension: string
  score: number
  weight: number
  weightedScore: number
  detail: string
}

export interface CustomerSegment {
  segment: string
  count: number
  totalRevenue: number
  avgFixtures: number
  customers: SegmentedCustomer[]
}

export interface SegmentedCustomer {
  customerId: string
  companyName: string
  revenueTier: RevenueTier
  engagement: EngagementLevel
}

export type RevenueTier = 'A' | 'B' | 'C' | 'D'
export type EngagementLevel = 'active' | 'dormant' | 'churned'

export interface CLVResult {
  annualRevenue: number
  projectedYears: number
  estimatedCLV: number
  confidence: number             // 0-1
}

export interface CustomerInsight {
  type: InsightType
  title: string
  description: string
  confidence: number             // 0-1
}

export type InsightType =
  | 'preferred_cargo'
  | 'preferred_route'
  | 'communication_frequency'
  | 'sentiment_trend'
  | 'cross_sell'

export interface CustomerInsightsResult {
  insights: CustomerInsight[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Relationship score dimension weights (must sum to 1.0). */
const RELATIONSHIP_WEIGHTS = {
  frequency: 0.30,
  revenue: 0.25,
  payment: 0.20,
  recency: 0.15,
  trust: 0.10,
} as const

/** Industry average payment days for benchmarking. */
const INDUSTRY_AVG_PAYMENT_DAYS = 30

/** Default annual churn rate for CLV projection. */
const DEFAULT_CHURN_RATE = 0.15

/** Default operating margin for CLV. */
const DEFAULT_MARGIN = 0.08

/** Months thresholds for engagement classification. */
const ENGAGEMENT_ACTIVE_MONTHS = 6
const ENGAGEMENT_DORMANT_MONTHS = 12

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

function monthsBetween(a: Date, b: Date): number {
  const msPerMonth = 30.44 * 86_400_000 // average month
  return Math.abs(new Date(b).getTime() - new Date(a).getTime()) / msPerMonth
}

function yearsBetween(a: Date, b: Date): number {
  return monthsBetween(a, b) / 12
}

// ---------------------------------------------------------------------------
// 1. Relationship Score
// ---------------------------------------------------------------------------

/**
 * Calculate a 0-100 relationship score for a customer.
 *
 * Dimensions:
 *   Frequency (30%) — fixtures per year, normalized to 0-100
 *   Revenue   (25%) — normalized against a fleet average (param or default)
 *   Payment   (20%) — how close to industry avg of 30 days
 *   Recency   (15%) — months since last fixture (lower is better)
 *   Trust     (10%) — penalty for disputes and claims
 *
 * @param data            Customer relationship data
 * @param fleetAvgRevenue Average annual revenue across the fleet for normalization.
 *                        Defaults to 1_000_000 if not provided.
 */
export function calculateRelationshipScore(
  data: RelationshipData,
  fleetAvgRevenue: number = 1_000_000,
): RelationshipScoreResult {
  const now = new Date()
  const breakdown: RelationshipBreakdownItem[] = []

  // --- Frequency (30%) ---
  // Fixtures per year. Benchmark: 4+ fixtures/year = perfect score.
  const customerYears = data.customerSince
    ? Math.max(yearsBetween(data.customerSince, now), 0.5)
    : 1
  const fixturesPerYear = data.totalFixtures / customerYears
  const frequencyRaw = clamp((fixturesPerYear / 4) * 100, 0, 100)
  const frequencyScore = round(frequencyRaw)
  breakdown.push({
    dimension: 'Frequency',
    score: frequencyScore,
    weight: RELATIONSHIP_WEIGHTS.frequency,
    weightedScore: round(frequencyScore * RELATIONSHIP_WEIGHTS.frequency),
    detail: `${round(fixturesPerYear, 1)} fixtures/year (benchmark: 4/year)`,
  })

  // --- Revenue (25%) ---
  // Customer's annual revenue vs fleet average.
  const annualRevenue = data.totalRevenue / Math.max(customerYears, 0.5)
  const revenueRatio = fleetAvgRevenue > 0
    ? annualRevenue / fleetAvgRevenue
    : 0
  const revenueRaw = clamp(revenueRatio * 100, 0, 100)
  const revenueScore = round(revenueRaw)
  breakdown.push({
    dimension: 'Revenue',
    score: revenueScore,
    weight: RELATIONSHIP_WEIGHTS.revenue,
    weightedScore: round(revenueScore * RELATIONSHIP_WEIGHTS.revenue),
    detail: `Annual revenue ${round(annualRevenue)} vs fleet avg ${round(fleetAvgRevenue)}`,
  })

  // --- Payment (20%) ---
  // Lower payment days = better. At industry avg (30 days) = 70 points.
  // At 0 days = 100. Each day above 30 costs 2 points.
  let paymentScore: number
  if (data.avgPaymentDays <= INDUSTRY_AVG_PAYMENT_DAYS) {
    // Good payer: linear scale from 70 (at 30 days) to 100 (at 0 days)
    paymentScore = 70 + ((INDUSTRY_AVG_PAYMENT_DAYS - data.avgPaymentDays) / INDUSTRY_AVG_PAYMENT_DAYS) * 30
  } else {
    // Late payer: deduct 2 points per day above industry avg
    paymentScore = 70 - (data.avgPaymentDays - INDUSTRY_AVG_PAYMENT_DAYS) * 2
  }
  paymentScore = round(clamp(paymentScore, 0, 100))
  breakdown.push({
    dimension: 'Payment',
    score: paymentScore,
    weight: RELATIONSHIP_WEIGHTS.payment,
    weightedScore: round(paymentScore * RELATIONSHIP_WEIGHTS.payment),
    detail: `${data.avgPaymentDays} days avg payment (industry avg: ${INDUSTRY_AVG_PAYMENT_DAYS})`,
  })

  // --- Recency (15%) ---
  // Months since last fixture. 0 months = 100, 12+ months = 0.
  const monthsSinceFixture = monthsBetween(new Date(data.lastFixtureDate), now)
  const recencyRaw = clamp(100 - (monthsSinceFixture / 12) * 100, 0, 100)
  const recencyScore = round(recencyRaw)
  breakdown.push({
    dimension: 'Recency',
    score: recencyScore,
    weight: RELATIONSHIP_WEIGHTS.recency,
    weightedScore: round(recencyScore * RELATIONSHIP_WEIGHTS.recency),
    detail: `${round(monthsSinceFixture, 1)} months since last fixture`,
  })

  // --- Trust (10%) ---
  // Penalty: each dispute costs 15 points, each claim costs 10 points.
  const trustPenalty = (data.disputeCount * 15) + (data.claimCount * 10)
  const trustScore = round(clamp(100 - trustPenalty, 0, 100))
  breakdown.push({
    dimension: 'Trust',
    score: trustScore,
    weight: RELATIONSHIP_WEIGHTS.trust,
    weightedScore: round(trustScore * RELATIONSHIP_WEIGHTS.trust),
    detail: `${data.disputeCount} disputes, ${data.claimCount} claims`,
  })

  // --- Overall ---
  const overallScore = round(
    breakdown.reduce((s, b) => s + b.weightedScore, 0),
  )
  const clampedScore = clamp(Math.round(overallScore), 0, 100)
  const category = categorizeRelationship(clampedScore)

  return { score: clampedScore, category, breakdown }
}

function categorizeRelationship(score: number): RelationshipCategory {
  if (score >= 80) return 'platinum'
  if (score >= 60) return 'gold'
  if (score >= 40) return 'silver'
  return 'bronze'
}

// ---------------------------------------------------------------------------
// 2. Customer Segmentation
// ---------------------------------------------------------------------------

/**
 * Segment customers by revenue tier and engagement level.
 *
 * Revenue tiers:
 *   A — top 20% by total revenue
 *   B — next 30%
 *   C — next 30%
 *   D — bottom 20%
 *
 * Engagement levels:
 *   active  — fixture in last 6 months
 *   dormant — fixture 6-12 months ago
 *   churned — no fixture in 12+ months
 *
 * Returns segments keyed by "tier-engagement" (e.g. "A-active").
 */
export function segmentCustomers(profiles: CustomerProfile[]): CustomerSegment[] {
  if (profiles.length === 0) return []

  const now = new Date()

  // --- Determine revenue tier thresholds ---
  const sorted = [...profiles].sort((a, b) => b.totalRevenue - a.totalRevenue)
  const n = sorted.length

  const tierAThreshold = Math.max(Math.ceil(n * 0.20), 1)
  const tierBThreshold = tierAThreshold + Math.max(Math.ceil(n * 0.30), 1)
  const tierCThreshold = tierBThreshold + Math.max(Math.ceil(n * 0.30), 1)

  // Assign tier based on position in sorted array
  const revenueRanks = new Map<string, RevenueTier>()
  for (let i = 0; i < sorted.length; i++) {
    let tier: RevenueTier
    if (i < tierAThreshold) tier = 'A'
    else if (i < tierBThreshold) tier = 'B'
    else if (i < tierCThreshold) tier = 'C'
    else tier = 'D'
    revenueRanks.set(sorted[i].customerId, tier)
  }

  // --- Assign engagement level ---
  function getEngagement(profile: CustomerProfile): EngagementLevel {
    const months = monthsBetween(new Date(profile.lastFixtureDate), now)
    if (months <= ENGAGEMENT_ACTIVE_MONTHS) return 'active'
    if (months <= ENGAGEMENT_DORMANT_MONTHS) return 'dormant'
    return 'churned'
  }

  // --- Build segments ---
  const segmentMap = new Map<string, {
    customers: SegmentedCustomer[]
    totalRevenue: number
    totalFixtures: number
  }>()

  for (const profile of profiles) {
    const tier = revenueRanks.get(profile.customerId)!
    const engagement = getEngagement(profile)
    const segmentKey = `${tier}-${engagement}`

    const entry = segmentMap.get(segmentKey) ?? {
      customers: [],
      totalRevenue: 0,
      totalFixtures: 0,
    }

    entry.customers.push({
      customerId: profile.customerId,
      companyName: profile.companyName,
      revenueTier: tier,
      engagement,
    })
    entry.totalRevenue += profile.totalRevenue
    entry.totalFixtures += profile.totalFixtures

    segmentMap.set(segmentKey, entry)
  }

  // --- Convert to result array ---
  const segments: CustomerSegment[] = []
  for (const [segment, data] of segmentMap.entries()) {
    segments.push({
      segment,
      count: data.customers.length,
      totalRevenue: round(data.totalRevenue),
      avgFixtures: data.customers.length > 0
        ? round(data.totalFixtures / data.customers.length, 1)
        : 0,
      customers: data.customers,
    })
  }

  // Sort by segment key for deterministic output
  segments.sort((a, b) => a.segment.localeCompare(b.segment))

  return segments
}

// ---------------------------------------------------------------------------
// 3. Customer Lifetime Value
// ---------------------------------------------------------------------------

/**
 * Calculate estimated Customer Lifetime Value (CLV).
 *
 * Formula:
 *   Annual revenue = total revenue / years as customer
 *   Projected years = 1 / churn rate (geometric distribution mean)
 *   CLV = annual revenue * projected years * margin
 *
 * @param profile  Customer profile
 * @param fixtures Customer's fixture history (used for more precise revenue calc)
 * @param churnRate Annual churn rate (default 15%)
 * @param margin   Operating margin (default 8%)
 */
export function analyzeCustomerLifetimeValue(
  profile: CustomerProfile,
  fixtures: Fixture[],
  churnRate: number = DEFAULT_CHURN_RATE,
  margin: number = DEFAULT_MARGIN,
): CLVResult {
  const now = new Date()
  const yearsAsCustomer = Math.max(
    yearsBetween(new Date(profile.customerSince), now),
    0.5,
  )

  // Use fixture-derived revenue if available, otherwise profile total
  const totalRevenue = fixtures.length > 0
    ? fixtures.reduce((s, f) => s + f.revenue, 0)
    : profile.totalRevenue

  const annualRevenue = round(totalRevenue / yearsAsCustomer)

  // Projected remaining years = 1 / churnRate (mean of geometric distribution)
  const effectiveChurn = clamp(churnRate, 0.01, 0.99)
  const projectedYears = round(1 / effectiveChurn, 1)

  const estimatedCLV = round(annualRevenue * projectedYears * margin)

  // Confidence based on data quality
  const fixtureCount = fixtures.length > 0 ? fixtures.length : profile.totalFixtures
  let confidence = 0.3 // base confidence
  if (fixtureCount >= 3) confidence += 0.2
  if (fixtureCount >= 10) confidence += 0.2
  if (yearsAsCustomer >= 2) confidence += 0.15
  if (yearsAsCustomer >= 5) confidence += 0.15

  return {
    annualRevenue,
    projectedYears,
    estimatedCLV,
    confidence: round(clamp(confidence, 0, 1)),
  }
}

// ---------------------------------------------------------------------------
// 4. Customer Insights
// ---------------------------------------------------------------------------

/**
 * Generate actionable insights for a customer based on their fixture
 * history, communication patterns, and comparisons with similar customers.
 *
 * Insight types:
 *   - preferred_cargo: most frequently shipped cargo types
 *   - preferred_route: most frequently used routes
 *   - communication_frequency: communications per month
 *   - sentiment_trend: trend in communication sentiment
 *   - cross_sell: opportunities based on gaps in the customer's history
 *
 * @param profile        Customer profile
 * @param communications Communication history
 * @param fixtures       Fixture history
 * @param allCargoTypes  All cargo types available in the platform (for cross-sell)
 * @param allRoutes      All routes available in the platform (for cross-sell)
 */
export function generateCustomerInsights(
  profile: CustomerProfile,
  communications: Communication[],
  fixtures: Fixture[],
  allCargoTypes: string[] = [],
  allRoutes: string[] = [],
): CustomerInsightsResult {
  const insights: CustomerInsight[] = []

  // --- Preferred cargo types ---
  const cargoInsights = analyzePreferredCargo(fixtures)
  if (cargoInsights.length > 0) {
    insights.push(...cargoInsights)
  }

  // --- Preferred routes ---
  const routeInsights = analyzePreferredRoutes(fixtures)
  if (routeInsights.length > 0) {
    insights.push(...routeInsights)
  }

  // --- Communication frequency ---
  const commFrequency = analyzeCommunicationFrequency(communications)
  if (commFrequency) {
    insights.push(commFrequency)
  }

  // --- Sentiment trend ---
  const sentimentTrend = analyzeSentimentTrend(communications)
  if (sentimentTrend) {
    insights.push(sentimentTrend)
  }

  // --- Cross-sell opportunities ---
  const crossSell = identifyCrossSellOpportunities(
    fixtures,
    allCargoTypes,
    allRoutes,
  )
  if (crossSell.length > 0) {
    insights.push(...crossSell)
  }

  return { insights }
}

// ---------------------------------------------------------------------------
// Internal — Insight Generators
// ---------------------------------------------------------------------------

/**
 * Identify the customer's most frequently shipped cargo types.
 */
function analyzePreferredCargo(fixtures: Fixture[]): CustomerInsight[] {
  if (fixtures.length === 0) return []

  const counts = new Map<string, number>()
  for (const f of fixtures) {
    counts.set(f.cargoType, (counts.get(f.cargoType) ?? 0) + 1)
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
  const total = fixtures.length

  // Top cargo type
  const [topCargo, topCount] = sorted[0]
  const share = round((topCount / total) * 100, 1)

  const insights: CustomerInsight[] = [
    {
      type: 'preferred_cargo',
      title: `Primary cargo: ${topCargo}`,
      description: `${topCargo} accounts for ${share}% of fixtures (${topCount} of ${total}).`,
      confidence: share > 50 ? 0.9 : share > 30 ? 0.7 : 0.5,
    },
  ]

  // Secondary cargo if significant
  if (sorted.length > 1) {
    const [secondCargo, secondCount] = sorted[1]
    const secondShare = round((secondCount / total) * 100, 1)
    if (secondShare >= 15) {
      insights.push({
        type: 'preferred_cargo',
        title: `Secondary cargo: ${secondCargo}`,
        description: `${secondCargo} accounts for ${secondShare}% of fixtures (${secondCount} of ${total}).`,
        confidence: secondShare > 30 ? 0.7 : 0.5,
      })
    }
  }

  return insights
}

/**
 * Identify the customer's most frequently used routes.
 */
function analyzePreferredRoutes(fixtures: Fixture[]): CustomerInsight[] {
  if (fixtures.length === 0) return []

  const counts = new Map<string, number>()
  for (const f of fixtures) {
    counts.set(f.route, (counts.get(f.route) ?? 0) + 1)
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
  const total = fixtures.length

  const insights: CustomerInsight[] = []
  // Report up to top 3 routes
  const topRoutes = sorted.slice(0, 3)
  for (const [route, count] of topRoutes) {
    const share = round((count / total) * 100, 1)
    if (share >= 10) {
      insights.push({
        type: 'preferred_route',
        title: `Preferred route: ${route}`,
        description: `${route} used in ${share}% of fixtures (${count} of ${total}).`,
        confidence: share > 40 ? 0.85 : share > 20 ? 0.65 : 0.45,
      })
    }
  }

  return insights
}

/**
 * Calculate communication frequency (messages per month).
 */
function analyzeCommunicationFrequency(
  communications: Communication[],
): CustomerInsight | null {
  if (communications.length === 0) return null

  const dates = communications.map((c) => new Date(c.date))
  const earliest = new Date(Math.min(...dates.map((d) => d.getTime())))
  const latest = new Date(Math.max(...dates.map((d) => d.getTime())))

  const months = Math.max(monthsBetween(earliest, latest), 1)
  const perMonth = round(communications.length / months, 1)

  let description: string
  if (perMonth >= 8) {
    description = `High engagement: ${perMonth} communications/month. Strong relationship.`
  } else if (perMonth >= 3) {
    description = `Moderate engagement: ${perMonth} communications/month. Healthy cadence.`
  } else if (perMonth >= 1) {
    description = `Low engagement: ${perMonth} communications/month. Consider increasing touchpoints.`
  } else {
    description = `Very low engagement: ${perMonth} communications/month. Risk of disengagement.`
  }

  return {
    type: 'communication_frequency',
    title: `Communication frequency: ${perMonth}/month`,
    description,
    confidence: communications.length >= 10 ? 0.85 : 0.55,
  }
}

/**
 * Analyze sentiment trend from recent communications.
 * Compares the sentiment distribution of the most recent 50% of
 * communications against the earlier 50%.
 */
function analyzeSentimentTrend(
  communications: Communication[],
): CustomerInsight | null {
  const withSentiment = communications.filter((c) => c.sentiment != null)
  if (withSentiment.length < 4) return null

  // Sort by date ascending
  const sorted = [...withSentiment].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  const midpoint = Math.floor(sorted.length / 2)
  const earlier = sorted.slice(0, midpoint)
  const recent = sorted.slice(midpoint)

  const sentimentValue = (s: SentimentTag): number => {
    switch (s) {
      case 'positive': return 1
      case 'neutral': return 0
      case 'negative': return -1
    }
  }

  const avgSentiment = (comms: Communication[]): number => {
    if (comms.length === 0) return 0
    const sum = comms.reduce((s, c) => s + sentimentValue(c.sentiment!), 0)
    return sum / comms.length
  }

  const earlierAvg = avgSentiment(earlier)
  const recentAvg = avgSentiment(recent)
  const delta = round(recentAvg - earlierAvg, 2)

  let trend: string
  let description: string
  if (delta > 0.2) {
    trend = 'improving'
    description = `Sentiment is improving (delta: +${delta}). Recent communications are more positive.`
  } else if (delta < -0.2) {
    trend = 'declining'
    description = `Sentiment is declining (delta: ${delta}). Recent communications show more negative tone. Consider proactive outreach.`
  } else {
    trend = 'stable'
    description = `Sentiment is stable (delta: ${delta}). No significant change in communication tone.`
  }

  return {
    type: 'sentiment_trend',
    title: `Sentiment trend: ${trend}`,
    description,
    confidence: withSentiment.length >= 10 ? 0.8 : 0.5,
  }
}

/**
 * Identify cross-sell opportunities by finding cargo types and routes
 * that the customer has not used but are available on the platform.
 */
function identifyCrossSellOpportunities(
  fixtures: Fixture[],
  allCargoTypes: string[],
  allRoutes: string[],
): CustomerInsight[] {
  const insights: CustomerInsight[] = []

  // Customer's existing cargo types and routes
  const customerCargo = new Set(fixtures.map((f) => f.cargoType))
  const customerRoutes = new Set(fixtures.map((f) => f.route))

  // Cargo types the customer has NOT tried
  const newCargo = allCargoTypes.filter((ct) => !customerCargo.has(ct))
  if (newCargo.length > 0 && newCargo.length <= allCargoTypes.length * 0.8) {
    // Only suggest if the customer has tried at least some cargo types
    const suggestions = newCargo.slice(0, 3).join(', ')
    insights.push({
      type: 'cross_sell',
      title: 'Cargo diversification opportunity',
      description: `Customer has not shipped: ${suggestions}. Consider presenting these options based on their fleet profile.`,
      confidence: 0.5,
    })
  }

  // Routes the customer has NOT tried
  const newRoutes = allRoutes.filter((r) => !customerRoutes.has(r))
  if (newRoutes.length > 0 && newRoutes.length <= allRoutes.length * 0.8) {
    const suggestions = newRoutes.slice(0, 3).join(', ')
    insights.push({
      type: 'cross_sell',
      title: 'Route expansion opportunity',
      description: `Customer has not used routes: ${suggestions}. These may align with their cargo profile.`,
      confidence: 0.45,
    })
  }

  return insights
}
