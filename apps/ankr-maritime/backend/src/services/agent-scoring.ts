/**
 * Port Agent Performance Scoring
 *
 * Calculates performance scores for port agents based on historical
 * disbursement account (DA) and service data. Used to rank agents
 * and guide appointment decisions.
 *
 * Pure business logic — no database access.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentPerformanceInput {
  agentId: string;
  agentName: string;
  totalDAs: number;             // total disbursement accounts handled
  onTimeDAs: number;            // DAs submitted within deadline
  avgVariancePercent: number;   // average PDA-to-FDA variance percentage
  avgResponseTimeHours: number; // average time to respond to queries
  disputeCount: number;         // number of disputed DAs
  creditNoteCount: number;      // credit notes issued (overcharges)
  completedVoyages: number;     // voyages serviced
  lastActivityDate: Date;
}

export interface AgentScore {
  agentId: string;
  agentName: string;
  overallScore: number;         // 0-100
  reliabilityScore: number;     // 0-100 based on on-time submission
  accuracyScore: number;        // 0-100 based on variance
  responsivenessScore: number;  // 0-100 based on response time
  disputeScore: number;         // 0-100 (fewer disputes = higher)
  volumeScore: number;          // 0-100 based on volume handled
  tier: 'gold' | 'silver' | 'bronze' | 'unrated';
  recommendation: string;
}

// ---------------------------------------------------------------------------
// Scoring weights
// ---------------------------------------------------------------------------

const WEIGHTS = {
  reliability: 0.25,
  accuracy: 0.30,
  responsiveness: 0.20,
  dispute: 0.15,
  volume: 0.10,
} as const;

// ---------------------------------------------------------------------------
// Individual score calculators
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Reliability: ratio of on-time DA submissions.
 * (onTimeDAs / totalDAs) * 100, capped at [0, 100].
 */
function computeReliabilityScore(input: AgentPerformanceInput): number {
  if (input.totalDAs === 0) return 0;
  const ratio = input.onTimeDAs / input.totalDAs;
  return clamp(Math.round(ratio * 100), 0, 100);
}

/**
 * Accuracy: penalise variance between PDA and FDA.
 * Each percent of variance costs 5 points from a perfect 100.
 */
function computeAccuracyScore(input: AgentPerformanceInput): number {
  const score = 100 - input.avgVariancePercent * 5;
  return clamp(Math.round(score), 0, 100);
}

/**
 * Responsiveness: step function based on average response time.
 *   <= 2 h  -> 100
 *   <= 6 h  ->  85
 *   <= 12 h ->  70
 *   <= 24 h ->  50
 *   <= 48 h ->  30
 *   > 48 h  ->  10
 */
function computeResponsivenessScore(input: AgentPerformanceInput): number {
  const hours = input.avgResponseTimeHours;
  if (hours <= 2) return 100;
  if (hours <= 6) return 85;
  if (hours <= 12) return 70;
  if (hours <= 24) return 50;
  if (hours <= 48) return 30;
  return 10;
}

/**
 * Dispute: penalise disputed DAs relative to total volume.
 * Each dispute as a % of total DAs costs 500 basis points (× 5).
 * Formula: max(0, 100 - (disputeCount / totalDAs) * 500)
 */
function computeDisputeScore(input: AgentPerformanceInput): number {
  if (input.totalDAs === 0) return 0;
  const ratio = input.disputeCount / input.totalDAs;
  const score = 100 - ratio * 500;
  return clamp(Math.round(score), 0, 100);
}

/**
 * Volume: rewards experience. 5 points per completed voyage, capping at 100
 * (i.e., 20+ voyages = max score).
 */
function computeVolumeScore(input: AgentPerformanceInput): number {
  const score = input.completedVoyages * 5;
  return clamp(score, 0, 100);
}

// ---------------------------------------------------------------------------
// Tier & recommendation
// ---------------------------------------------------------------------------

function determineTier(overallScore: number): AgentScore['tier'] {
  if (overallScore >= 80) return 'gold';
  if (overallScore >= 60) return 'silver';
  if (overallScore >= 40) return 'bronze';
  return 'unrated';
}

function buildRecommendation(tier: AgentScore['tier']): string {
  switch (tier) {
    case 'gold':
      return 'Preferred agent. Consistent performance.';
    case 'silver':
      return 'Reliable agent. Room for improvement in accuracy.';
    case 'bronze':
      return 'Below expectations. Review recommended.';
    case 'unrated':
      return 'Insufficient data or poor performance. Not recommended.';
  }
}

// ---------------------------------------------------------------------------
// Main functions
// ---------------------------------------------------------------------------

/**
 * Calculate a comprehensive performance score for a single port agent.
 */
export function calculateAgentScore(input: AgentPerformanceInput): AgentScore {
  const reliabilityScore = computeReliabilityScore(input);
  const accuracyScore = computeAccuracyScore(input);
  const responsivenessScore = computeResponsivenessScore(input);
  const disputeScore = computeDisputeScore(input);
  const volumeScore = computeVolumeScore(input);

  const overallScore = Math.round(
    reliabilityScore * WEIGHTS.reliability +
    accuracyScore * WEIGHTS.accuracy +
    responsivenessScore * WEIGHTS.responsiveness +
    disputeScore * WEIGHTS.dispute +
    volumeScore * WEIGHTS.volume,
  );

  const tier = determineTier(overallScore);
  const recommendation = buildRecommendation(tier);

  return {
    agentId: input.agentId,
    agentName: input.agentName,
    overallScore,
    reliabilityScore,
    accuracyScore,
    responsivenessScore,
    disputeScore,
    volumeScore,
    tier,
    recommendation,
  };
}

/**
 * Score and rank a list of agents by overall score (descending).
 */
export function rankAgents(agents: AgentPerformanceInput[]): AgentScore[] {
  return agents
    .map(calculateAgentScore)
    .sort((a, b) => b.overallScore - a.overallScore);
}
