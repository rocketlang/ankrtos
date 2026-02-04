/**
 * Maritime Sanctions Screening & Risk Assessment
 *
 * Screens entities (vessels, companies, individuals, cargo) against
 * sanctions lists, assesses flag-state risk, calculates counterparty
 * risk scores, and detects dark-activity / STS-transfer patterns.
 *
 * Pure business logic — no database or Prisma dependency.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScreeningInput {
  entityType: 'vessel' | 'company' | 'individual' | 'cargo';
  entityName: string;
  imoNumber?: string;
  flagState?: string;
  nationality?: string;
}

export interface SanctionMatch {
  listName: string;
  matchType: 'exact' | 'fuzzy' | 'alias';
  matchedName: string;
  matchConfidence: number;
  details: string;
}

export interface ScreeningResult {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  matchScore: number;
  matches: SanctionMatch[];
  pepMatch: boolean;
  adverseMedia: boolean;
  flagRisk: string;
  recommendation: string;
}

export interface VesselRiskProfile {
  flagRisk: 'low' | 'medium' | 'high' | 'critical';
  ownershipComplexity: string;
  ageRisk: string;
  classRisk: string;
  overallRisk: string;
  factors: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HIGH_RISK_COUNTRIES: string[] = [
  'north korea',
  'iran',
  'syria',
  'cuba',
  'crimea',
  'russia',
  'venezuela',
  'myanmar',
];

/**
 * Sanctioned entity name patterns.
 * Each entry contains a regex-compatible pattern and the list it belongs to.
 */
const SANCTIONED_PATTERNS: Array<{
  pattern: RegExp;
  listName: string;
  details: string;
}> = [
  {
    pattern: /\bIRISL\b/i,
    listName: 'OFAC SDN List',
    details: 'Islamic Republic of Iran Shipping Lines — US/EU sanctioned entity',
  },
  {
    pattern: /\bNITC\b/i,
    listName: 'OFAC SDN List',
    details: 'National Iranian Tanker Company — US sanctioned entity',
  },
  {
    pattern: /\bDPRK\b/i,
    listName: 'UN Security Council',
    details: 'Democratic Peoples Republic of Korea — UN sanctioned',
  },
  {
    pattern: /\bCOSCO\s*DALIAN\b/i,
    listName: 'OFAC SDN List',
    details: 'COSCO Shipping Tanker (Dalian) — US designated entity',
  },
  {
    pattern: /\bKTMM\b/i,
    listName: 'OFAC SDN List',
    details: 'Korea Tanker Management — DPRK-linked entity',
  },
  {
    pattern: /\bSAMHO\b/i,
    listName: 'OFAC SDN List',
    details: 'Samho Shipping — DPRK-linked shipping entity',
  },
  {
    pattern: /\bHTK\b/i,
    listName: 'EU Sanctions List',
    details: 'Hyok Trading Corp — DPRK proliferation network',
  },
  {
    pattern: /\bNOSCO\b/i,
    listName: 'OFAC SDN List',
    details: 'National Oil Service Company — Syria sanctioned',
  },
  {
    pattern: /\bPDVSA\b/i,
    listName: 'OFAC SDN List',
    details: 'Petroleos de Venezuela S.A. — US sanctioned entity',
  },
  {
    pattern: /\bROSNEFT\b/i,
    listName: 'EU Sanctions List',
    details: 'Rosneft — Russian state oil company under EU/UK sanctions',
  },
  {
    pattern: /\bSOVCOMFLOT\b/i,
    listName: 'OFAC SDN List',
    details: 'Sovcomflot — Russian state shipping company, US/UK/EU sanctioned',
  },
  {
    pattern: /\bMEES\b/i,
    listName: 'OFAC SDN List',
    details: 'Middle East Energy Services — Iran-linked',
  },
  {
    pattern: /\bSYRIA\s*TRADING\b/i,
    listName: 'EU Sanctions List',
    details: 'Syria Trading — Syrian government-linked trading entity',
  },
  {
    pattern: /\bWAGNER\b/i,
    listName: 'EU Sanctions List',
    details: 'Wagner Group — designated entity',
  },
];

/**
 * PEP title keywords — if an individual entity name contains any of these
 * tokens we flag a Politically Exposed Person (PEP) match.
 */
const PEP_TITLE_PATTERNS: RegExp[] = [
  /\bminister\b/i,
  /\bpresident\b/i,
  /\bgeneral\b/i,
  /\bambassador\b/i,
  /\bgovernor\b/i,
  /\bsenator\b/i,
  /\bcommander\b/i,
  /\badmiral\b/i,
  /\bchairman\b/i,
  /\bdirector\s*general\b/i,
  /\bsecretary\b/i,
  /\bcolonel\b/i,
  /\bbrigadier\b/i,
  /\bparliament\b/i,
  /\bconsul\b/i,
  /\bmarshal\b/i,
  /\bchief\s*of\s*staff\b/i,
];

// ---------------------------------------------------------------------------
// Flag-state risk mapping
// ---------------------------------------------------------------------------

const FLAG_RISK_CRITICAL: Set<string> = new Set([
  'north korea',
  'iran',
  'syria',
]);

const FLAG_RISK_HIGH: Set<string> = new Set([
  'russia',
  'venezuela',
  'myanmar',
  'cuba',
  'comoros',
  'tanzania',
  'palau',
  'togo',
  'cameroon',
]);

const FLAG_RISK_MEDIUM: Set<string> = new Set([
  'panama',
  'liberia',
  'marshall islands',
  'honduras',
  'belize',
  'bolivia',
  'mongolia',
  'cambodia',
  'sierra leone',
  'moldova',
  'antigua and barbuda',
  'barbados',
  'saint kitts and nevis',
  'saint vincent',
  'vanuatu',
  'cook islands',
  'tuvalu',
  'kiribati',
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Lightweight fuzzy-match — checks whether targetName contains a high-risk
 * country name or its common variations.
 */
function containsHighRiskCountry(name: string): string | null {
  const normalised = name.toLowerCase();
  for (const country of HIGH_RISK_COUNTRIES) {
    if (normalised.includes(country)) {
      return country;
    }
  }
  return null;
}

/**
 * Simple Levenshtein-inspired similarity ratio (0-1).
 * Used for fuzzy matching when exact match fails.
 */
function similarityRatio(a: string, b: string): number {
  const la = a.toLowerCase();
  const lb = b.toLowerCase();
  if (la === lb) return 1;

  const longer = la.length >= lb.length ? la : lb;
  const shorter = la.length < lb.length ? la : lb;

  if (longer.length === 0) return 1;

  // Sliding-window bigram overlap approach (fast approximation)
  const bigramsA = new Set<string>();
  for (let i = 0; i < longer.length - 1; i++) {
    bigramsA.add(longer.substring(i, i + 2));
  }

  let matches = 0;
  for (let i = 0; i < shorter.length - 1; i++) {
    if (bigramsA.has(shorter.substring(i, i + 2))) {
      matches++;
    }
  }

  const totalBigrams = longer.length - 1 + shorter.length - 1;
  if (totalBigrams === 0) return 0;
  return (2 * matches) / totalBigrams;
}

// ---------------------------------------------------------------------------
// Main functions
// ---------------------------------------------------------------------------

/**
 * Assess flag-state risk for a given country / flag.
 *
 * @param flagState - Country name (case-insensitive)
 * @returns Risk level: critical, high, medium, or low
 */
export function assessFlagRisk(
  flagState: string,
): 'low' | 'medium' | 'high' | 'critical' {
  const normalised = flagState.toLowerCase().trim();

  if (FLAG_RISK_CRITICAL.has(normalised)) return 'critical';
  if (FLAG_RISK_HIGH.has(normalised)) return 'high';
  if (FLAG_RISK_MEDIUM.has(normalised)) return 'medium';
  return 'low';
}

/**
 * Screen an entity (vessel, company, individual, cargo) against built-in
 * high-risk patterns, sanctioned entity lists, and PEP indicators.
 *
 * @param input - Entity details to screen
 * @returns Screening result with risk level, matches, and recommendation
 */
export function screenEntity(input: ScreeningInput): ScreeningResult {
  const matches: SanctionMatch[] = [];
  let pepMatch = false;
  let adverseMedia = false;

  const nameUpper = input.entityName.toUpperCase();
  const nameLower = input.entityName.toLowerCase();

  // ---- 1. Check sanctioned entity patterns --------------------------------
  for (const entry of SANCTIONED_PATTERNS) {
    if (entry.pattern.test(input.entityName)) {
      matches.push({
        listName: entry.listName,
        matchType: 'exact',
        matchedName: input.entityName,
        matchConfidence: 95,
        details: entry.details,
      });
    } else {
      // Fuzzy check: compare against the pattern's core keyword
      const keyword = entry.pattern.source
        .replace(/\\b/g, '')
        .replace(/\\s\*/g, ' ')
        .replace(/[()]/g, '');
      const sim = similarityRatio(nameLower, keyword.toLowerCase());
      if (sim >= 0.75) {
        matches.push({
          listName: entry.listName,
          matchType: 'fuzzy',
          matchedName: keyword,
          matchConfidence: Math.round(sim * 100),
          details: `Fuzzy match (${Math.round(sim * 100)}% similarity) — ${entry.details}`,
        });
      }
    }
  }

  // ---- 2. High-risk country in entity name --------------------------------
  const countryHit = containsHighRiskCountry(input.entityName);
  if (countryHit) {
    matches.push({
      listName: 'Country Risk List',
      matchType: 'fuzzy',
      matchedName: countryHit,
      matchConfidence: 80,
      details: `Entity name contains high-risk country reference: ${countryHit}`,
    });
    adverseMedia = true;
  }

  // ---- 3. Nationality check -----------------------------------------------
  if (input.nationality) {
    const natHit = containsHighRiskCountry(input.nationality);
    if (natHit) {
      matches.push({
        listName: 'Country Risk List',
        matchType: 'exact',
        matchedName: natHit,
        matchConfidence: 90,
        details: `Nationality is a high-risk jurisdiction: ${natHit}`,
      });
    }
  }

  // ---- 4. IMO number pattern check ----------------------------------------
  if (input.imoNumber) {
    // Fictitious or invalid IMO check (must be 7 digits)
    const imoClean = input.imoNumber.replace(/\D/g, '');
    if (imoClean.length !== 7) {
      matches.push({
        listName: 'IMO Validation',
        matchType: 'fuzzy',
        matchedName: input.imoNumber,
        matchConfidence: 60,
        details: 'IMO number format invalid — potential evasion indicator',
      });
    }
  }

  // ---- 5. Flag-state risk -------------------------------------------------
  const flagRisk = input.flagState ? assessFlagRisk(input.flagState) : 'low';
  if (flagRisk === 'critical' || flagRisk === 'high') {
    matches.push({
      listName: 'Flag State Risk',
      matchType: 'exact',
      matchedName: input.flagState ?? '',
      matchConfidence: flagRisk === 'critical' ? 95 : 80,
      details: `Flag state assessed as ${flagRisk} risk: ${input.flagState}`,
    });
  }

  // ---- 6. PEP check (individuals) -----------------------------------------
  if (input.entityType === 'individual') {
    for (const pepPattern of PEP_TITLE_PATTERNS) {
      if (pepPattern.test(input.entityName)) {
        pepMatch = true;
        break;
      }
    }
  }

  // ---- 7. Calculate match score (0-100) -----------------------------------
  let matchScore = 0;
  if (matches.length > 0) {
    // Take the highest confidence match as the base
    const maxConfidence = Math.max(...matches.map((m) => m.matchConfidence));
    // Add a small bonus for multiple matches (up to 15 extra points)
    const multiMatchBonus = Math.min((matches.length - 1) * 5, 15);
    matchScore = clamp(maxConfidence + multiMatchBonus, 0, 100);
  }

  // PEP adds to score
  if (pepMatch) {
    matchScore = clamp(matchScore + 10, 0, 100);
  }

  // ---- 8. Determine risk level --------------------------------------------
  let riskLevel: ScreeningResult['riskLevel'];
  if (matchScore >= 85) {
    riskLevel = 'critical';
  } else if (matchScore >= 65) {
    riskLevel = 'high';
  } else if (matchScore >= 40) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  // Elevate risk if flag state alone is critical
  if (flagRisk === 'critical' && riskLevel === 'low') {
    riskLevel = 'medium';
  }

  // ---- 9. Generate recommendation -----------------------------------------
  let recommendation: string;
  if (matchScore === 0 && !pepMatch) {
    recommendation = 'Clear \u2014 no matches found';
  } else if (matchScore < 50) {
    recommendation = 'Review required \u2014 possible match';
  } else if (matchScore < 80) {
    recommendation = 'Block \u2014 sanctions match detected';
  } else {
    recommendation = 'Escalate \u2014 high confidence match';
  }

  if (pepMatch) {
    recommendation += '. PEP match detected \u2014 enhanced due diligence required';
  }

  return {
    riskLevel,
    matchScore,
    matches,
    pepMatch,
    adverseMedia,
    flagRisk,
    recommendation,
  };
}

/**
 * Calculate a weighted counterparty risk score from multiple factors.
 *
 * Individual sub-scores default to 50 (neutral) when not provided.
 * The overall score is inverted so that higher = riskier, then penalties
 * are layered on for sanctions, PEP, country risk, and payment history.
 *
 * @returns Overall score 0-100 (higher = riskier), category, breakdown, and adjustments
 */
export function calculateCounterpartyRiskScore(factors: {
  financialScore?: number;
  complianceScore?: number;
  operationalScore?: number;
  reputationScore?: number;
  sanctionRisk: boolean;
  pepExposure: boolean;
  countryRisk?: string;
  paymentHistory?: string;
}): {
  overallScore: number;
  riskCategory: string;
  breakdown: {
    category: string;
    score: number;
    weight: number;
    weighted: number;
  }[];
  adjustments: string[];
} {
  // Default missing sub-scores to 50 (neutral)
  const financial = factors.financialScore ?? 50;
  const compliance = factors.complianceScore ?? 50;
  const operational = factors.operationalScore ?? 50;
  const reputation = factors.reputationScore ?? 50;

  // Weights: compliance 30%, financial 25%, reputation 25%, operational 20%
  const weights = {
    financial: 0.25,
    compliance: 0.30,
    operational: 0.20,
    reputation: 0.25,
  } as const;

  // Weighted average of sub-scores (higher sub-score = better, so we invert)
  const weightedFinancial = financial * weights.financial;
  const weightedCompliance = compliance * weights.compliance;
  const weightedOperational = operational * weights.operational;
  const weightedReputation = reputation * weights.reputation;

  // Base score: invert so that higher = riskier
  let baseScore =
    100 - (weightedFinancial + weightedCompliance + weightedOperational + weightedReputation);

  const adjustments: string[] = [];

  // Apply penalties
  if (factors.sanctionRisk) {
    baseScore += 25;
    adjustments.push('Sanction risk: +25 points');
  }
  if (factors.pepExposure) {
    baseScore += 15;
    adjustments.push('PEP exposure: +15 points');
  }
  if (factors.countryRisk && ['high', 'critical'].includes(factors.countryRisk.toLowerCase())) {
    baseScore += 10;
    adjustments.push(`High country risk (${factors.countryRisk}): +10 points`);
  }
  if (
    factors.paymentHistory &&
    ['poor', 'delinquent', 'defaulted'].includes(factors.paymentHistory.toLowerCase())
  ) {
    baseScore += 10;
    adjustments.push(`Poor payment history (${factors.paymentHistory}): +10 points`);
  }

  const overallScore = clamp(Math.round(baseScore), 0, 100);

  // Risk category
  let riskCategory: string;
  if (overallScore <= 25) {
    riskCategory = 'low';
  } else if (overallScore <= 45) {
    riskCategory = 'medium';
  } else if (overallScore <= 65) {
    riskCategory = 'high';
  } else {
    riskCategory = 'critical';
  }

  const breakdown = [
    {
      category: 'Financial',
      score: financial,
      weight: weights.financial,
      weighted: Math.round(weightedFinancial * 100) / 100,
    },
    {
      category: 'Compliance',
      score: compliance,
      weight: weights.compliance,
      weighted: Math.round(weightedCompliance * 100) / 100,
    },
    {
      category: 'Operational',
      score: operational,
      weight: weights.operational,
      weighted: Math.round(weightedOperational * 100) / 100,
    },
    {
      category: 'Reputation',
      score: reputation,
      weight: weights.reputation,
      weighted: Math.round(weightedReputation * 100) / 100,
    },
  ];

  return {
    overallScore,
    riskCategory,
    breakdown,
    adjustments,
  };
}

/**
 * Assess "dark activity" — gaps in AIS position reporting that may indicate
 * intentional transponder shut-off, a common sanctions-evasion technique.
 *
 * Positions must be sorted chronologically (oldest first).
 *
 * @param positions   - Chronological AIS positions
 * @param maxGapHours - Minimum gap duration (in hours) to flag. Default: 12
 * @returns Detected gaps, a risk score (0-100), and a boolean flag
 */
export function assessDarkActivity(
  positions: Array<{
    timestamp: Date;
    lat: number;
    lon: number;
  }>,
  maxGapHours: number = 12,
): {
  gaps: Array<{
    startTime: Date;
    endTime: Date;
    gapHours: number;
    lastKnownLat: number;
    lastKnownLon: number;
  }>;
  riskScore: number;
  hasSignificantGaps: boolean;
} {
  const gaps: Array<{
    startTime: Date;
    endTime: Date;
    gapHours: number;
    lastKnownLat: number;
    lastKnownLon: number;
  }> = [];

  if (positions.length < 2) {
    return { gaps: [], riskScore: 0, hasSignificantGaps: false };
  }

  // Sort by timestamp ascending (defensive copy)
  const sorted = [...positions].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  for (let i = 1; i < sorted.length; i++) {
    const prevTime = new Date(sorted[i - 1].timestamp).getTime();
    const currTime = new Date(sorted[i].timestamp).getTime();
    const diffHours = (currTime - prevTime) / (1000 * 60 * 60);

    if (diffHours >= maxGapHours) {
      gaps.push({
        startTime: new Date(prevTime),
        endTime: new Date(currTime),
        gapHours: Math.round(diffHours * 100) / 100,
        lastKnownLat: sorted[i - 1].lat,
        lastKnownLon: sorted[i - 1].lon,
      });
    }
  }

  // Risk scoring
  // - Each gap adds base 10 points
  // - Gaps > 24h add an extra 10, > 48h add another 10, > 72h another 10
  let riskScore = 0;
  for (const gap of gaps) {
    riskScore += 10;
    if (gap.gapHours > 24) riskScore += 10;
    if (gap.gapHours > 48) riskScore += 10;
    if (gap.gapHours > 72) riskScore += 10;
  }
  riskScore = clamp(riskScore, 0, 100);

  const hasSignificantGaps = gaps.some((g) => g.gapHours > 24);

  return { gaps, riskScore, hasSignificantGaps };
}

/**
 * Assess STS (Ship-to-Ship) transfer risk by detecting loitering periods
 * where a vessel's speed drops below the threshold, which may indicate
 * an unregistered ship-to-ship cargo transfer.
 *
 * @param vesselPositions        - Chronological position + speed data
 * @param proximityThresholdNm   - Grouping threshold in nautical miles (default 5)
 * @returns Detected encounters and overall risk score
 */
export function assessSTSRisk(
  vesselPositions: Array<{
    timestamp: Date;
    lat: number;
    lon: number;
    speed: number;
  }>,
  proximityThresholdNm: number = 5,
): {
  encounters: Array<{
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
    avgSpeed: number;
    location: { lat: number; lon: number };
  }>;
  riskScore: number;
} {
  const LOITER_SPEED_THRESHOLD = 3; // knots
  const encounters: Array<{
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
    avgSpeed: number;
    location: { lat: number; lon: number };
  }> = [];

  if (vesselPositions.length < 2) {
    return { encounters: [], riskScore: 0 };
  }

  // Sort chronologically
  const sorted = [...vesselPositions].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  // Group consecutive low-speed positions
  let groupStart: number | null = null;
  let groupSpeedSum = 0;
  let groupCount = 0;
  let groupLatSum = 0;
  let groupLonSum = 0;

  for (let i = 0; i < sorted.length; i++) {
    const pos = sorted[i];
    const isLoitering = pos.speed < LOITER_SPEED_THRESHOLD;

    if (isLoitering) {
      if (groupStart === null) {
        groupStart = i;
        groupSpeedSum = 0;
        groupCount = 0;
        groupLatSum = 0;
        groupLonSum = 0;
      }

      // Check proximity to group centroid if we have previous positions in this group
      if (groupCount > 0) {
        const centroidLat = groupLatSum / groupCount;
        const centroidLon = groupLonSum / groupCount;
        const distNm = haversineDistanceNm(pos.lat, pos.lon, centroidLat, centroidLon);

        if (distNm > proximityThresholdNm) {
          // Too far from group centroid — close current group and start new one
          finaliseEncounter(sorted, groupStart, i - 1, groupSpeedSum, groupCount, groupLatSum, groupLonSum, encounters);
          groupStart = i;
          groupSpeedSum = 0;
          groupCount = 0;
          groupLatSum = 0;
          groupLonSum = 0;
        }
      }

      groupSpeedSum += pos.speed;
      groupCount++;
      groupLatSum += pos.lat;
      groupLonSum += pos.lon;
    } else {
      // Speed above threshold — close any open group
      if (groupStart !== null && groupCount >= 2) {
        finaliseEncounter(sorted, groupStart, i - 1, groupSpeedSum, groupCount, groupLatSum, groupLonSum, encounters);
      }
      groupStart = null;
      groupSpeedSum = 0;
      groupCount = 0;
      groupLatSum = 0;
      groupLonSum = 0;
    }
  }

  // Close trailing group
  if (groupStart !== null && groupCount >= 2) {
    finaliseEncounter(sorted, groupStart, sorted.length - 1, groupSpeedSum, groupCount, groupLatSum, groupLonSum, encounters);
  }

  // Risk scoring
  // - Each encounter adds 15 base points
  // - Duration > 60 min adds 10, > 120 min adds 10 more
  let riskScore = 0;
  for (const enc of encounters) {
    riskScore += 15;
    if (enc.durationMinutes > 60) riskScore += 10;
    if (enc.durationMinutes > 120) riskScore += 10;
  }
  riskScore = clamp(riskScore, 0, 100);

  return { encounters, riskScore };
}

// ---------------------------------------------------------------------------
// STS helper
// ---------------------------------------------------------------------------

/**
 * Haversine distance in nautical miles (duplicated from geofence-engine
 * to keep this module self-contained with no internal imports).
 */
function haversineDistanceNm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const EARTH_RADIUS_NM = 3440.065;
  const toRad = (deg: number) => deg * (Math.PI / 180);

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_NM * c;
}

/**
 * Convert a run of low-speed positions into an STS encounter record.
 */
function finaliseEncounter(
  sorted: Array<{ timestamp: Date; lat: number; lon: number; speed: number }>,
  startIdx: number,
  endIdx: number,
  speedSum: number,
  count: number,
  latSum: number,
  lonSum: number,
  encounters: Array<{
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
    avgSpeed: number;
    location: { lat: number; lon: number };
  }>,
): void {
  const startTime = new Date(sorted[startIdx].timestamp);
  const endTime = new Date(sorted[endIdx].timestamp);
  const durationMinutes = Math.round(
    (endTime.getTime() - startTime.getTime()) / (1000 * 60),
  );

  if (durationMinutes < 1) return;

  encounters.push({
    startTime,
    endTime,
    durationMinutes,
    avgSpeed: Math.round((speedSum / count) * 100) / 100,
    location: {
      lat: Math.round((latSum / count) * 10000) / 10000,
      lon: Math.round((lonSum / count) * 10000) / 10000,
    },
  });
}
