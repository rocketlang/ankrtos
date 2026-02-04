// esg-calculator.ts
// Carbon & Sustainability module — ESG scoring and alignment service.
// Scope 1/2 emissions, Poseidon Principles, Sea Cargo Charter, ESG scorecard.
// Pure functions — no DB or Prisma dependency.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FuelType = 'HFO' | 'MDO' | 'MGO' | 'LNG' | 'Methanol' | 'VLSFO';

// ---- Scope 1 types ----

export interface Scope1FuelInput {
  fuelType: FuelType | string;
  tonnesConsumed: number;
}

export interface Scope1FuelResult {
  fuelType: string;
  co2: number;           // tonnes CO2
  ch4: number;           // tonnes CH4
  n2o: number;           // tonnes N2O
  co2e: number;          // tonnes CO2-equivalent
}

export interface Scope1Result {
  byFuel: Scope1FuelResult[];
  totalCo2e: number;
}

// ---- Scope 2 types ----

export interface Scope2EnergyInput {
  country: string;       // country name or ISO code
  kwhConsumed: number;
}

export interface Scope2CountryResult {
  country: string;
  kwh: number;
  co2e: number;          // tonnes CO2e
}

export interface Scope2Result {
  byCountry: Scope2CountryResult[];
  totalCo2e: number;
}

// ---- Poseidon Principles types ----

export interface PoseidonVesselInput {
  vesselType: string;    // bulk_carrier, tanker, container, general_cargo, lng_carrier
  dwt: number;
  distance: number;      // nautical miles
  co2: number;           // tonnes CO2
}

export interface PoseidonVesselResult {
  vesselType: string;
  /** Delta vs the Poseidon Principles trajectory. Negative = below trajectory (good). */
  climateAlignment: number;
}

export interface PoseidonResult {
  vessels: PoseidonVesselResult[];
  /** Fleet-weighted average alignment score. Negative = below trajectory (good). */
  fleetScore: number;
  isAligned: boolean;
}

// ---- Sea Cargo Charter types ----

export interface SeaCargoCharterVoyageInput {
  cargoType: string;     // dry_bulk, wet_bulk, container, general
  cargoTonnes: number;
  distance: number;      // nautical miles
  co2: number;           // tonnes CO2
}

export interface SeaCargoCharterVoyageResult {
  cargoType: string;
  /** Actual gCO2 per tonne-mile. */
  intensity: number;
  /** IMO trajectory benchmark gCO2 per tonne-mile. */
  benchmark: number;
  /** Alignment delta: actual - benchmark. Negative = better than benchmark. */
  alignment: number;
}

export interface SeaCargoCharterResult {
  voyages: SeaCargoCharterVoyageResult[];
  /** Portfolio-level weighted average alignment. */
  portfolioAlignment: number;
}

// ---- ESG Scorecard types ----

export interface EsgEnvironmentalInput {
  totalCo2e: number;              // total Scope 1+2 CO2e in tonnes
  ciiRating: 'A' | 'B' | 'C' | 'D' | 'E';
  etsLiabilityEur: number;       // EU ETS total cost
  renewableEnergyPct: number;    // percentage of energy from renewables (0-100)
}

export interface EsgSocialInput {
  lostTimeInjuryRate: number;    // LTIR per million man-hours
  trainingHoursPerCrew: number;  // average hours per crew member per year
  diversityPct: number;          // percentage of diverse workforce (0-100)
}

export interface EsgGovernanceInput {
  complianceScore: number;       // 0-100, audited compliance score
  reportingScore: number;        // 0-100, transparency & reporting quality
}

export interface EsgScorecardInput {
  environmental: EsgEnvironmentalInput;
  social: EsgSocialInput;
  governance: EsgGovernanceInput;
}

export interface EsgScorecardResult {
  total: number;
  environmental: number;
  social: number;
  governance: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  highlights: string[];
  improvements: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * CO2 emission factors — tonnes CO2 per tonne of fuel burned.
 * Aligned with IMO Fourth GHG Study.
 */
const CO2_FACTORS: Record<string, number> = {
  HFO:      3.114,
  VLSFO:    3.151,
  MDO:      3.206,
  MGO:      3.206,
  LNG:      2.750,
  Methanol: 1.375,
};

/**
 * CH4 (methane) emission factors — kg CH4 per tonne of fuel burned.
 * LNG has significantly higher methane slip.
 */
const CH4_FACTORS_KG: Record<string, number> = {
  HFO:      0.006,
  VLSFO:    0.006,
  MDO:      0.006,
  MGO:      0.006,
  LNG:      3.100,    // methane slip from dual-fuel engines
  Methanol: 0.005,
};

/**
 * N2O (nitrous oxide) emission factors — kg N2O per tonne of fuel burned.
 */
const N2O_FACTORS_KG: Record<string, number> = {
  HFO:      0.160,
  VLSFO:    0.160,
  MDO:      0.160,
  MGO:      0.160,
  LNG:      0.110,
  Methanol: 0.120,
};

/** Global Warming Potentials (GWP) — IPCC AR5 100-year values. */
const GWP_CH4 = 28;
const GWP_N2O = 265;

/**
 * Grid emission factors — kg CO2 per kWh for shore power / office electricity.
 * Representative national averages from IEA data.
 */
const GRID_EMISSION_FACTORS_KG_PER_KWH: Record<string, number> = {
  // Country name variants and ISO codes
  India:     0.82,
  IN:        0.82,
  US:        0.42,
  USA:       0.42,
  UK:        0.23,
  GB:        0.23,
  Singapore: 0.41,
  SG:        0.41,
  Norway:    0.01,
  NO:        0.01,
  Germany:   0.35,
  DE:        0.35,
  China:     0.58,
  CN:        0.58,
  Japan:     0.47,
  JP:        0.47,
  Australia: 0.68,
  AU:        0.68,
  France:    0.06,
  FR:        0.06,
  Brazil:    0.08,
  BR:        0.08,
  Canada:    0.13,
  CA:        0.13,
  Netherlands: 0.33,
  NL:        0.33,
  UAE:       0.42,
  AE:        0.42,
  SouthKorea: 0.46,
  KR:        0.46,
};

/** Default grid emission factor for unlisted countries (kg CO2/kWh). */
const DEFAULT_GRID_FACTOR = 0.50;

/**
 * Poseidon Principles IMO-aligned trajectory — reference intensity
 * (gCO2 per dwt-nm) by vessel type for year 2008 (baseline).
 * Values decrease linearly toward IMO targets.
 */
const POSEIDON_2008_BASELINE: Record<string, number> = {
  bulk_carrier:   5.60,
  tanker:         5.20,
  container:      9.30,
  general_cargo:  12.10,
  lng_carrier:    9.80,
};

/**
 * Sea Cargo Charter trajectory benchmarks — gCO2 per tonne-mile
 * by cargo type for the 2008 baseline.
 */
const SCC_2008_BASELINE: Record<string, number> = {
  dry_bulk:  8.30,
  wet_bulk:  5.60,
  container: 11.50,
  general:   14.20,
};

/** IMO trajectory reduction fractions for key years. */
const IMO_TRAJECTORY: { year: number; reductionFromBaseline: number }[] = [
  { year: 2008, reductionFromBaseline: 0.00 },
  { year: 2020, reductionFromBaseline: 0.20 },
  { year: 2030, reductionFromBaseline: 0.40 },
  { year: 2040, reductionFromBaseline: 0.55 },
  { year: 2050, reductionFromBaseline: 0.70 },
];

// ---- CII-to-score mapping for ESG scoring ----
const CII_ESG_SCORES: Record<string, number> = {
  A: 100,
  B: 80,
  C: 60,
  D: 35,
  E: 10,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round(value: number, decimals: number = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Resolve the CO2 emission factor for a given fuel type string.
 * Falls back to HFO if the fuel type is unrecognised.
 */
function getCo2Factor(fuelType: string): number {
  if (CO2_FACTORS[fuelType] !== undefined) return CO2_FACTORS[fuelType];
  const upper = fuelType.toUpperCase();
  for (const [key, value] of Object.entries(CO2_FACTORS)) {
    if (key.toUpperCase() === upper) return value;
  }
  return CO2_FACTORS.HFO;
}

/** Resolve CH4 emission factor (kg per tonne fuel). */
function getCh4FactorKg(fuelType: string): number {
  if (CH4_FACTORS_KG[fuelType] !== undefined) return CH4_FACTORS_KG[fuelType];
  const upper = fuelType.toUpperCase();
  for (const [key, value] of Object.entries(CH4_FACTORS_KG)) {
    if (key.toUpperCase() === upper) return value;
  }
  return CH4_FACTORS_KG.HFO;
}

/** Resolve N2O emission factor (kg per tonne fuel). */
function getN2oFactorKg(fuelType: string): number {
  if (N2O_FACTORS_KG[fuelType] !== undefined) return N2O_FACTORS_KG[fuelType];
  const upper = fuelType.toUpperCase();
  for (const [key, value] of Object.entries(N2O_FACTORS_KG)) {
    if (key.toUpperCase() === upper) return value;
  }
  return N2O_FACTORS_KG.HFO;
}

/**
 * Resolve grid emission factor for a country.
 * Looks up both full country name and ISO code.
 */
function getGridFactor(country: string): number {
  if (GRID_EMISSION_FACTORS_KG_PER_KWH[country] !== undefined) {
    return GRID_EMISSION_FACTORS_KG_PER_KWH[country];
  }
  // Try case-insensitive search
  const lower = country.toLowerCase();
  for (const [key, value] of Object.entries(GRID_EMISSION_FACTORS_KG_PER_KWH)) {
    if (key.toLowerCase() === lower) return value;
  }
  return DEFAULT_GRID_FACTOR;
}

/**
 * Get the IMO trajectory reduction fraction for a given year.
 * Linear interpolation between the defined anchor points.
 */
function getImoReduction(year: number): number {
  const trajectory = IMO_TRAJECTORY;

  if (year <= trajectory[0].year) return trajectory[0].reductionFromBaseline;
  if (year >= trajectory[trajectory.length - 1].year) {
    return trajectory[trajectory.length - 1].reductionFromBaseline;
  }

  // Find the two surrounding anchor points and interpolate
  for (let i = 0; i < trajectory.length - 1; i++) {
    const current = trajectory[i];
    const next = trajectory[i + 1];
    if (year >= current.year && year <= next.year) {
      const progress = (year - current.year) / (next.year - current.year);
      return current.reductionFromBaseline +
        (next.reductionFromBaseline - current.reductionFromBaseline) * progress;
    }
  }

  return 0;
}

/**
 * Compute the Poseidon Principles benchmark intensity for a vessel type
 * in a given year, applying the IMO trajectory reduction.
 */
function poseidonBenchmark(vesselType: string, year: number): number {
  const baseline = POSEIDON_2008_BASELINE[vesselType.toLowerCase()]
    ?? POSEIDON_2008_BASELINE.bulk_carrier;
  const reduction = getImoReduction(year);
  return baseline * (1 - reduction);
}

/**
 * Compute the Sea Cargo Charter benchmark intensity for a cargo type
 * in a given year, applying the IMO trajectory reduction.
 */
function sccBenchmark(cargoType: string, year: number): number {
  const baseline = SCC_2008_BASELINE[cargoType.toLowerCase()]
    ?? SCC_2008_BASELINE.general;
  const reduction = getImoReduction(year);
  return baseline * (1 - reduction);
}

/**
 * Normalise a value to a 0-100 score with a linear mapping.
 * Values at or below `best` score 100; at or above `worst` score 0.
 */
function normalise(value: number, best: number, worst: number): number {
  if (worst === best) return 50;
  const raw = ((worst - value) / (worst - best)) * 100;
  return Math.max(0, Math.min(100, round(raw, 2)));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate Scope 1 (direct) emissions from fuel combustion.
 *
 * For each fuel type:
 *   - CO2 = tonnes consumed * CO2 factor
 *   - CH4 = tonnes consumed * CH4 factor (kg) / 1000 -> tonnes
 *   - N2O = tonnes consumed * N2O factor (kg) / 1000 -> tonnes
 *   - CO2e = CO2 + (CH4 * GWP_CH4) + (N2O * GWP_N2O)
 *
 * @param fuelData - Array of fuel consumption entries
 * @returns Breakdown by fuel and total CO2e
 */
export function calculateScope1Emissions(
  fuelData: Scope1FuelInput[],
): Scope1Result {
  let totalCo2e = 0;

  const byFuel: Scope1FuelResult[] = fuelData.map((entry) => {
    const co2 = round(entry.tonnesConsumed * getCo2Factor(entry.fuelType), 4);

    // CH4 and N2O factors are in kg per tonne of fuel; convert to tonnes
    const ch4Tonnes = round(
      (entry.tonnesConsumed * getCh4FactorKg(entry.fuelType)) / 1000,
      6,
    );
    const n2oTonnes = round(
      (entry.tonnesConsumed * getN2oFactorKg(entry.fuelType)) / 1000,
      6,
    );

    // CO2-equivalent using GWP values
    const co2e = round(co2 + ch4Tonnes * GWP_CH4 + n2oTonnes * GWP_N2O, 4);

    totalCo2e += co2e;

    return {
      fuelType: entry.fuelType,
      co2,
      ch4: ch4Tonnes,
      n2o: n2oTonnes,
      co2e,
    };
  });

  return {
    byFuel,
    totalCo2e: round(totalCo2e, 4),
  };
}

/**
 * Calculate Scope 2 (indirect) emissions from purchased electricity.
 *
 * For each country:
 *   CO2e = kWh consumed * grid emission factor (kg CO2/kWh) / 1000 -> tonnes
 *
 * @param energyData - Array of electricity consumption entries by country
 * @returns Breakdown by country and total CO2e in tonnes
 */
export function calculateScope2Emissions(
  energyData: Scope2EnergyInput[],
): Scope2Result {
  let totalCo2e = 0;

  const byCountry: Scope2CountryResult[] = energyData.map((entry) => {
    const factor = getGridFactor(entry.country);
    // factor is kg CO2/kWh; convert to tonnes: / 1000
    const co2e = round((entry.kwhConsumed * factor) / 1000, 4);

    totalCo2e += co2e;

    return {
      country: entry.country,
      kwh: entry.kwhConsumed,
      co2e,
    };
  });

  return {
    byCountry,
    totalCo2e: round(totalCo2e, 4),
  };
}

/**
 * Calculate Poseidon Principles climate alignment for a fleet.
 *
 * For each vessel:
 *   1. Compute actual intensity = (CO2 * 1,000,000) / (dwt * distance) — gCO2/dwt-nm.
 *   2. Look up the Poseidon trajectory benchmark for the vessel type.
 *   3. climateAlignment = ((actual - benchmark) / benchmark) * 100.
 *      Negative = below trajectory (climate-aligned).
 *
 * Fleet score is transport-work-weighted average of per-vessel alignments.
 *
 * @param fleet - Array of vessel operational data
 * @param year  - The reporting year (default: current year)
 * @returns Per-vessel alignment and fleet-level score
 */
export function calculatePoseidonAlignment(
  fleet: PoseidonVesselInput[],
  year: number = new Date().getFullYear(),
): PoseidonResult {
  if (fleet.length === 0) {
    return { vessels: [], fleetScore: 0, isAligned: true };
  }

  let weightedAlignmentSum = 0;
  let totalTransportWork = 0;

  const vessels: PoseidonVesselResult[] = fleet.map((v) => {
    const transportWork = v.dwt * v.distance;
    const actualIntensity = transportWork > 0
      ? (v.co2 * 1_000_000) / transportWork
      : 0;

    const benchmark = poseidonBenchmark(v.vesselType, year);
    const climateAlignment = benchmark > 0
      ? round(((actualIntensity - benchmark) / benchmark) * 100, 2)
      : 0;

    weightedAlignmentSum += climateAlignment * transportWork;
    totalTransportWork += transportWork;

    return {
      vesselType: v.vesselType,
      climateAlignment,
    };
  });

  const fleetScore = totalTransportWork > 0
    ? round(weightedAlignmentSum / totalTransportWork, 2)
    : 0;

  return {
    vessels,
    fleetScore,
    isAligned: fleetScore <= 0,
  };
}

/**
 * Calculate Sea Cargo Charter alignment for a set of voyages.
 *
 * For each voyage:
 *   1. Demand-based intensity = (CO2 * 1,000,000) / (cargoTonnes * distance) — gCO2/tonne-mile.
 *   2. Look up the SCC benchmark for the cargo type.
 *   3. alignment = ((actual - benchmark) / benchmark) * 100.
 *
 * Portfolio alignment is cargo-transport-work-weighted.
 *
 * @param voyages - Array of cargo voyage data
 * @param year    - The reporting year (default: current year)
 * @returns Per-voyage alignment and portfolio-level score
 */
export function calculateSeaCargoCharterAlignment(
  voyages: SeaCargoCharterVoyageInput[],
  year: number = new Date().getFullYear(),
): SeaCargoCharterResult {
  if (voyages.length === 0) {
    return { voyages: [], portfolioAlignment: 0 };
  }

  let weightedAlignmentSum = 0;
  let totalCargoTransportWork = 0;

  const results: SeaCargoCharterVoyageResult[] = voyages.map((v) => {
    const cargoTransportWork = v.cargoTonnes * v.distance;
    const intensity = cargoTransportWork > 0
      ? round((v.co2 * 1_000_000) / cargoTransportWork, 4)
      : 0;

    const benchmark = round(sccBenchmark(v.cargoType, year), 4);
    const alignment = benchmark > 0
      ? round(((intensity - benchmark) / benchmark) * 100, 2)
      : 0;

    weightedAlignmentSum += alignment * cargoTransportWork;
    totalCargoTransportWork += cargoTransportWork;

    return {
      cargoType: v.cargoType,
      intensity,
      benchmark,
      alignment,
    };
  });

  const portfolioAlignment = totalCargoTransportWork > 0
    ? round(weightedAlignmentSum / totalCargoTransportWork, 2)
    : 0;

  return {
    voyages: results,
    portfolioAlignment,
  };
}

/**
 * Generate a comprehensive ESG scorecard.
 *
 * Weighting:
 *   - Environmental (50%): CO2e normalised, CII rating, ETS liability, renewables
 *   - Social (30%): LTIR, training hours, diversity
 *   - Governance (20%): compliance audit score, reporting quality
 *
 * Each sub-dimension is scored 0-100, then weighted into the pillar score.
 * The total score determines the grade: A (>=85), B (>=70), C (>=55), D (>=40), F (<40).
 *
 * @param data - All ESG metric inputs
 * @returns Scorecard with pillar scores, total, grade, highlights, and improvements
 */
export function generateEsgScorecard(data: EsgScorecardInput): EsgScorecardResult {
  const { environmental: env, social: soc, governance: gov } = data;

  // ---------------------
  // Environmental (50%)
  // ---------------------

  // CO2e score: lower is better. Normalise against a "good" (5000t) / "bad" (100000t) range.
  const co2eScore = normalise(env.totalCo2e, 5000, 100000);

  // CII rating score: direct mapping
  const ciiScore = CII_ESG_SCORES[env.ciiRating] ?? 50;

  // ETS liability score: lower cost is better. Normalise against 0 / 2,000,000 EUR range.
  const etsScore = normalise(env.etsLiabilityEur, 0, 2_000_000);

  // Renewable energy score: percentage directly maps to 0-100
  const renewableScore = Math.max(0, Math.min(100, env.renewableEnergyPct));

  // Environmental pillar: weighted average of sub-dimensions
  const environmentalScore = round(
    co2eScore * 0.35 + ciiScore * 0.30 + etsScore * 0.15 + renewableScore * 0.20,
    2,
  );

  // ---------------------
  // Social (30%)
  // ---------------------

  // LTIR score: lower is better. Best = 0, worst = 10.
  const ltirScore = normalise(soc.lostTimeInjuryRate, 0, 10);

  // Training hours: higher is better. 0 hours = 0, 80+ hours = 100.
  const trainingScore = normalise(80 - soc.trainingHoursPerCrew, 0, 80);

  // Diversity: percentage directly maps (with 0% = 0, 50%+ = 100)
  const diversityScore = normalise(50 - soc.diversityPct, 0, 50);

  // Social pillar: weighted average
  const socialScore = round(
    ltirScore * 0.45 + trainingScore * 0.30 + diversityScore * 0.25,
    2,
  );

  // ---------------------
  // Governance (20%)
  // ---------------------

  // Compliance and reporting scores are already 0-100
  const complianceScore = Math.max(0, Math.min(100, gov.complianceScore));
  const reportingScore = Math.max(0, Math.min(100, gov.reportingScore));

  const governanceScore = round(
    complianceScore * 0.55 + reportingScore * 0.45,
    2,
  );

  // ---------------------
  // Total & Grade
  // ---------------------

  const totalScore = round(
    environmentalScore * 0.50 + socialScore * 0.30 + governanceScore * 0.20,
    2,
  );

  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (totalScore >= 85) grade = 'A';
  else if (totalScore >= 70) grade = 'B';
  else if (totalScore >= 55) grade = 'C';
  else if (totalScore >= 40) grade = 'D';
  else grade = 'F';

  // ---------------------
  // Highlights & Improvements
  // ---------------------

  const highlights: string[] = [];
  const improvements: string[] = [];

  // Environmental highlights / improvements
  if (env.ciiRating === 'A' || env.ciiRating === 'B') {
    highlights.push(`Strong CII performance: rated ${env.ciiRating}`);
  }
  if (env.ciiRating === 'D' || env.ciiRating === 'E') {
    improvements.push(
      `CII rating ${env.ciiRating} requires urgent improvement — corrective action plan needed`,
    );
  }

  if (env.renewableEnergyPct >= 30) {
    highlights.push(
      `${env.renewableEnergyPct}% renewable energy usage demonstrates transition commitment`,
    );
  } else if (env.renewableEnergyPct < 10) {
    improvements.push(
      'Renewable energy adoption below 10% — consider shore power and biofuels',
    );
  }

  if (env.etsLiabilityEur === 0) {
    highlights.push('Zero EU ETS liability — efficient trade route planning');
  } else if (env.etsLiabilityEur > 500_000) {
    improvements.push(
      `EU ETS liability of EUR ${env.etsLiabilityEur.toLocaleString()} — evaluate route optimisation and fuel switching`,
    );
  }

  // Social highlights / improvements
  if (soc.lostTimeInjuryRate <= 0.5) {
    highlights.push('Excellent safety record with LTIR at or below 0.5');
  } else if (soc.lostTimeInjuryRate > 3) {
    improvements.push(
      `LTIR of ${soc.lostTimeInjuryRate} is above industry benchmark — enhance safety management system`,
    );
  }

  if (soc.trainingHoursPerCrew >= 60) {
    highlights.push(
      `${soc.trainingHoursPerCrew} training hours per crew exceeds industry average`,
    );
  } else if (soc.trainingHoursPerCrew < 20) {
    improvements.push(
      'Training hours per crew below 20 — invest in workforce development programmes',
    );
  }

  if (soc.diversityPct >= 30) {
    highlights.push('Diversity exceeds 30% threshold');
  } else if (soc.diversityPct < 10) {
    improvements.push(
      'Workforce diversity below 10% — review hiring and inclusion policies',
    );
  }

  // Governance highlights / improvements
  if (gov.complianceScore >= 90) {
    highlights.push('Compliance audit score above 90 — strong regulatory adherence');
  } else if (gov.complianceScore < 60) {
    improvements.push(
      'Compliance score below 60 — immediate audit remediation required',
    );
  }

  if (gov.reportingScore >= 85) {
    highlights.push('High transparency and reporting quality');
  } else if (gov.reportingScore < 50) {
    improvements.push(
      'Reporting score below 50 — adopt TCFD/GRI-aligned disclosure framework',
    );
  }

  return {
    total: totalScore,
    environmental: environmentalScore,
    social: socialScore,
    governance: governanceScore,
    grade,
    highlights,
    improvements,
  };
}
