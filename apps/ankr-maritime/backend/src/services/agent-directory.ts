/**
 * Port Agent Search & Ranking Service
 *
 * Pure functions for scoring, ranking, and recommending port agents
 * based on weighted criteria. No database access.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentSearchParams {
  portId?: string;
  country?: string;
  city?: string;
  serviceTypes?: string[];
  minRating?: number;
  maxResponseHrs?: number;
  isVerified?: boolean;
}

export interface AgentRanking {
  agentId: string;
  companyName: string;
  score: number;
  breakdown: {
    ratingScore: number;
    experienceScore: number;
    responseScore: number;
    verificationBonus: number;
  };
}

export interface AgentInput {
  id: string;
  companyName: string;
  rating: number;
  totalJobs: number;
  avgResponseHrs: number;
  isVerified: boolean;
}

export interface RankingWeights {
  rating?: number;
  experience?: number;
  response?: number;
  verification?: number;
}

export interface AppointmentRecord {
  performanceRating: number | null;
  actualCost: number | null;
  estimatedCost: number | null;
  startDate: Date | null;
  endDate: Date | null;
}

export interface AgentPerformanceMetrics {
  avgRating: number;
  costAccuracy: number;
  onTimeRate: number;
  totalCompleted: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_WEIGHTS: Required<RankingWeights> = {
  rating: 0.4,
  experience: 0.25,
  response: 0.25,
  verification: 0.1,
};

/** Maximum response hours used as the upper bound for normalization. */
const MAX_RESPONSE_HRS = 72;

/**
 * Experience tiers — the number of total jobs mapped to a 0-100 score.
 * Uses a logarithmic curve so early jobs count more.
 */
const EXPERIENCE_CAP = 500;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Normalize a rating (assumed 0-5 scale) to 0-100.
 */
function normalizeRating(rating: number): number {
  return clamp((rating / 5) * 100, 0, 100);
}

/**
 * Normalize total jobs to a 0-100 experience score using a log curve.
 */
function normalizeExperience(totalJobs: number): number {
  if (totalJobs <= 0) return 0;
  const capped = Math.min(totalJobs, EXPERIENCE_CAP);
  // log(1) = 0, log(501) ≈ 6.22 → scale to 0-100
  const raw = Math.log(capped + 1) / Math.log(EXPERIENCE_CAP + 1);
  return clamp(raw * 100, 0, 100);
}

/**
 * Normalize average response hours to a 0-100 score (lower is better).
 */
function normalizeResponseTime(avgHrs: number): number {
  if (avgHrs <= 0) return 100;
  if (avgHrs >= MAX_RESPONSE_HRS) return 0;
  return clamp(((MAX_RESPONSE_HRS - avgHrs) / MAX_RESPONSE_HRS) * 100, 0, 100);
}

/**
 * Verification bonus: 100 if verified, 0 otherwise.
 */
function verificationScore(isVerified: boolean): number {
  return isVerified ? 100 : 0;
}

function resolveWeights(custom?: RankingWeights): Required<RankingWeights> {
  if (!custom) return { ...DEFAULT_WEIGHTS };

  const merged = {
    rating: custom.rating ?? DEFAULT_WEIGHTS.rating,
    experience: custom.experience ?? DEFAULT_WEIGHTS.experience,
    response: custom.response ?? DEFAULT_WEIGHTS.response,
    verification: custom.verification ?? DEFAULT_WEIGHTS.verification,
  };

  // Normalize so weights sum to 1
  const total = merged.rating + merged.experience + merged.response + merged.verification;
  if (total === 0) return { ...DEFAULT_WEIGHTS };

  return {
    rating: merged.rating / total,
    experience: merged.experience / total,
    response: merged.response / total,
    verification: merged.verification / total,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Rank a list of agents using weighted scoring.
 *
 * Default weights: rating 40%, experience 25%, response time 25%, verification 10%.
 * All component scores are normalized to a 0-100 scale before weighting.
 */
export function rankAgents(
  agents: AgentInput[],
  weights?: RankingWeights,
): AgentRanking[] {
  const w = resolveWeights(weights);

  const rankings: AgentRanking[] = agents.map((agent) => {
    const ratingScore = normalizeRating(agent.rating);
    const experienceScore = normalizeExperience(agent.totalJobs);
    const responseScore = normalizeResponseTime(agent.avgResponseHrs);
    const verificationBonus = verificationScore(agent.isVerified);

    const score =
      ratingScore * w.rating +
      experienceScore * w.experience +
      responseScore * w.response +
      verificationBonus * w.verification;

    return {
      agentId: agent.id,
      companyName: agent.companyName,
      score: Math.round(score * 100) / 100,
      breakdown: {
        ratingScore: Math.round(ratingScore * 100) / 100,
        experienceScore: Math.round(experienceScore * 100) / 100,
        responseScore: Math.round(responseScore * 100) / 100,
        verificationBonus: Math.round(verificationBonus * 100) / 100,
      },
    };
  });

  // Sort descending by score, then alphabetically by company name for ties
  rankings.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.companyName.localeCompare(b.companyName);
  });

  return rankings;
}

/**
 * Calculate aggregate performance metrics from a list of appointment records.
 */
export function calculateAgentPerformance(
  appointments: AppointmentRecord[],
): AgentPerformanceMetrics {
  if (appointments.length === 0) {
    return {
      avgRating: 0,
      costAccuracy: 0,
      onTimeRate: 0,
      totalCompleted: 0,
    };
  }

  // Filter completed appointments (those with at least a rating)
  const completed = appointments.filter((a) => a.performanceRating !== null);
  const totalCompleted = completed.length;

  if (totalCompleted === 0) {
    return {
      avgRating: 0,
      costAccuracy: 0,
      onTimeRate: 0,
      totalCompleted: 0,
    };
  }

  // Average rating
  const ratingSum = completed.reduce((sum, a) => sum + (a.performanceRating ?? 0), 0);
  const avgRating = Math.round((ratingSum / totalCompleted) * 100) / 100;

  // Cost accuracy — percentage of appointments where actual cost was within
  // 10% of estimated cost. Only count those with both values present.
  const withCosts = completed.filter(
    (a) => a.actualCost !== null && a.estimatedCost !== null && a.estimatedCost! > 0,
  );
  let costAccuracy = 0;
  if (withCosts.length > 0) {
    const accurateCount = withCosts.filter((a) => {
      const deviation = Math.abs(a.actualCost! - a.estimatedCost!) / a.estimatedCost!;
      return deviation <= 0.1;
    }).length;
    costAccuracy = Math.round((accurateCount / withCosts.length) * 10000) / 100;
  }

  // On-time rate — percentage of appointments where endDate is not null
  // (i.e., the work was actually completed). A more sophisticated check
  // would compare against a deadline, but we use completion as a proxy.
  const withDates = completed.filter(
    (a) => a.startDate !== null,
  );
  let onTimeRate = 0;
  if (withDates.length > 0) {
    const onTimeCount = withDates.filter((a) => a.endDate !== null).length;
    onTimeRate = Math.round((onTimeCount / withDates.length) * 10000) / 100;
  }

  return {
    avgRating,
    costAccuracy,
    onTimeRate,
    totalCompleted,
  };
}

/**
 * Return the top N agents from a ranked list, sorted by score descending.
 * Defaults to top 5.
 */
export function recommendAgents(
  agents: AgentRanking[],
  topN: number = 5,
): AgentRanking[] {
  const n = Math.max(1, topN);
  // Ensure the input is sorted (it should be from rankAgents, but be safe)
  const sorted = [...agents].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.companyName.localeCompare(b.companyName);
  });
  return sorted.slice(0, n);
}
