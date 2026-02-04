// carbon-accounting.ts
// Carbon & Sustainability module — carbon accounting service.
// EU ETS liability, CII rating, FuelEU Maritime penalty, emission trajectory projection.
// Pure functions — no DB or Prisma dependency.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FuelType = 'HFO' | 'MDO' | 'MGO' | 'LNG' | 'Methanol' | 'VLSFO';

/** Single voyage input for ETS liability calculation. */
export interface EtsVoyageInput {
  voyageRef: string;
  distance: number;            // nautical miles
  fuelConsumed: number;        // metric tonnes
  fuelType: FuelType | string;
  departurePort: string;
  arrivalPort: string;
  portCountries: {
    departure: string;         // ISO 3166-1 alpha-2 (e.g. "DE", "US")
    arrival: string;
  };
}

/** Per-voyage result within the ETS calculation. */
export interface EtsVoyageResult {
  voyageRef: string;
  co2: number;                 // total voyage CO2 in tonnes
  etsScope: number;            // 0 | 0.5 | 1 — fraction of CO2 subject to EU ETS
  etsCo2: number;              // CO2 tonnes subject to EU ETS
  etsCost: number;             // estimated cost in EUR
}

/** Aggregated ETS liability result for a set of voyages. */
export interface EtsLiabilityResult {
  voyages: EtsVoyageResult[];
  totalCo2: number;
  totalEtsCo2: number;
  totalEtsCost: number;
}

/** Configuration options for the ETS calculation. */
export interface EtsConfig {
  /** EU ETS allowance price in EUR per tonne CO2. Default: 80. */
  pricePerTonne?: number;
}

// ---- CII types ----

export interface CiiFuelConsumption {
  fuelType: FuelType | string;
  tonnes: number;
}

export interface CiiInput {
  dwt: number;
  distanceTravelled: number;   // nautical miles
  fuelConsumption: CiiFuelConsumption[];
  year: number;
}

export interface CiiRatingBoundaries {
  a: { upper: number };
  b: { lower: number; upper: number };
  c: { lower: number; upper: number };
  d: { lower: number; upper: number };
  e: { lower: number };
}

export interface CiiRatingResult {
  attainedCii: number;
  requiredCii: number;
  referenceCii: number;
  rating: 'A' | 'B' | 'C' | 'D' | 'E';
  ratingBoundaries: CiiRatingBoundaries;
  /** Percentage improvement needed to reach C rating; 0 if already C or better. */
  improvementNeeded: number;
}

// ---- FuelEU types ----

export interface FuelEuInput {
  ghgIntensity: number;        // gCO2eq/MJ — actual well-to-wake GHG intensity
  targetIntensity: number;     // gCO2eq/MJ — regulatory target
  energyUsed: number;          // MJ — total energy consumed
}

export interface FuelEuResult {
  ghgIntensity: number;
  targetIntensity: number;
  complianceBalance: number;   // positive = surplus, negative = deficit
  isCompliant: boolean;
  penalty: number;             // EUR — 0 if compliant
  surplusBankable: number;     // surplus that can be banked (25% cap)
}

// ---- Trajectory types ----

export interface HistoricalEmissionPoint {
  year: number;
  co2: number;                 // total CO2 in tonnes
  distance: number;            // total distance in nautical miles
  dwt: number;
}

export interface TrajectoryProjection {
  year: number;
  projectedCo2: number;       // projected CO2 per DWT-mile (gCO2 / dwt-nm)
  targetCo2: number;          // IMO target CO2 per DWT-mile
  gap: number;                // projectedCo2 - targetCo2 (positive = above target)
}

export interface TrajectoryResult {
  projections: TrajectoryProjection[];
  onTrack: boolean;
  /** Year by which projected emissions meet the target, or null if never within range. */
  yearOfCompliance: number | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * CO2 emission factors — tonnes CO2 emitted per tonne of fuel burned.
 * Based on IMO Fourth GHG Study and MEPC guidelines.
 */
const CO2_EMISSION_FACTORS: Record<string, number> = {
  HFO:      3.114,
  VLSFO:    3.151,
  MDO:      3.206,
  MGO:      3.206,
  LNG:      2.750,
  Methanol: 1.375,
};

/** EU member state ISO 3166-1 alpha-2 codes (plus EEA: Norway, Iceland). */
const EU_COUNTRIES: Set<string> = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  // EEA countries included in EU ETS for maritime
  'NO', 'IS',
]);

/** IMO CII annual reduction factors relative to the 2019 reference line. */
const CII_REDUCTION_FACTORS: Record<number, number> = {
  2023: 0.05,
  2024: 0.07,
  2025: 0.09,
  2026: 0.11,
};

/**
 * CII reference line parameters for bulk carrier (generic).
 * Reference CII = a * DWT^(-c).
 * IMO MEPC.354(78) Annex 1.
 */
const CII_REF_A = 4745;
const CII_REF_C = 0.622;

/**
 * CII rating boundary d-vectors as multipliers of the required CII.
 * Vessels are rated A through E based on where their attained CII falls
 * relative to these boundaries.
 */
const CII_D_VECTORS = {
  d1: 0.86,
  d2: 0.94,
  d3: 1.06,
  d4: 1.18,
};

/** FuelEU Maritime penalty rate: EUR per tonne of CO2eq non-compliance deficit. */
const FUELEU_PENALTY_RATE_EUR = 2400;

/** FuelEU Maritime maximum surplus that can be banked as a fraction. */
const FUELEU_BANKING_CAP = 0.25;

/** IMO 2008 baseline CO2 intensity (gCO2 per dwt-nm) — approximate fleet average. */
const IMO_2008_BASELINE_INTENSITY = 15.0;

/** IMO 2030 reduction target relative to 2008 baseline (40%). */
const IMO_2030_REDUCTION = 0.40;

/** IMO 2050 reduction target relative to 2008 baseline (70%). */
const IMO_2050_REDUCTION = 0.70;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the CO2 emission factor for a given fuel type string.
 * Falls back to HFO if the fuel type is unrecognised.
 */
function getEmissionFactor(fuelType: string): number {
  // Try exact match first, then case-insensitive
  if (CO2_EMISSION_FACTORS[fuelType] !== undefined) {
    return CO2_EMISSION_FACTORS[fuelType];
  }
  const upper = fuelType.toUpperCase();
  for (const [key, value] of Object.entries(CO2_EMISSION_FACTORS)) {
    if (key.toUpperCase() === upper) {
      return value;
    }
  }
  return CO2_EMISSION_FACTORS.HFO;
}

/** Determine whether a country code belongs to an EU/EEA member state. */
function isEuCountry(countryCode: string): boolean {
  return EU_COUNTRIES.has(countryCode.toUpperCase());
}

/**
 * Determine the EU ETS scope fraction for a voyage.
 * - Both ports EU: 100% (1.0)
 * - One port EU, one non-EU: 50% (0.5)
 * - Neither port EU: 0% (0.0)
 */
function determineEtsScope(departureCountry: string, arrivalCountry: string): number {
  const depIsEu = isEuCountry(departureCountry);
  const arrIsEu = isEuCountry(arrivalCountry);

  if (depIsEu && arrIsEu) {
    return 1.0;
  }
  if (depIsEu || arrIsEu) {
    return 0.5;
  }
  return 0.0;
}

/**
 * Get the CII reduction factor for a given year.
 * If the year is beyond 2026, extrapolate at +2% per year.
 * If before 2023, return 0.
 */
function getCiiReductionFactor(year: number): number {
  if (CII_REDUCTION_FACTORS[year] !== undefined) {
    return CII_REDUCTION_FACTORS[year];
  }
  if (year > 2026) {
    return 0.11 + (year - 2026) * 0.02;
  }
  return 0;
}

/**
 * Calculate the CII reference line value for a given DWT.
 * Uses the generic bulk carrier formula: a * DWT^(-c).
 */
function calculateReferenceCii(dwt: number): number {
  if (dwt <= 0) return 0;
  return CII_REF_A * Math.pow(dwt, -CII_REF_C);
}

/**
 * Round a number to a specified number of decimal places.
 */
function round(value: number, decimals: number = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Simple linear regression on (x, y) data.
 * Returns { slope, intercept } for the line y = slope * x + intercept.
 */
function linearRegression(
  points: { x: number; y: number }[],
): { slope: number; intercept: number } {
  const n = points.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  if (n === 1) return { slope: 0, intercept: points[0].y };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) {
    return { slope: 0, intercept: sumY / n };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

/**
 * Compute the IMO target CO2 intensity (gCO2 per dwt-nm) for a given year.
 * Linear interpolation between the 2008 baseline, 2030 target (-40%), and
 * 2050 target (-70%).
 */
function imoTargetIntensity(year: number): number {
  const baseline = IMO_2008_BASELINE_INTENSITY;

  if (year <= 2008) {
    return baseline;
  }

  if (year <= 2030) {
    // Linear interpolation from 2008 (0% reduction) to 2030 (40% reduction)
    const progress = (year - 2008) / (2030 - 2008);
    const reductionFraction = progress * IMO_2030_REDUCTION;
    return baseline * (1 - reductionFraction);
  }

  if (year <= 2050) {
    // Linear interpolation from 2030 (40% reduction) to 2050 (70% reduction)
    const intensity2030 = baseline * (1 - IMO_2030_REDUCTION);
    const intensity2050 = baseline * (1 - IMO_2050_REDUCTION);
    const progress = (year - 2030) / (2050 - 2030);
    return intensity2030 + (intensity2050 - intensity2030) * progress;
  }

  // Beyond 2050, hold at the 2050 target
  return baseline * (1 - IMO_2050_REDUCTION);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate EU ETS liability for a set of voyages.
 *
 * For each voyage:
 *   1. Compute CO2 = fuelConsumed * emissionFactor(fuelType).
 *   2. Determine ETS scope: 100% intra-EU, 50% EU<->non-EU, 0% non-EU.
 *   3. ETS CO2 = CO2 * scope.
 *   4. ETS cost = ETS CO2 * pricePerTonne.
 *
 * @param voyages - Array of voyage data with fuel and port information
 * @param config  - Optional configuration (e.g. carbon price)
 * @returns Aggregated ETS liability breakdown
 */
export function calculateEtsLiability(
  voyages: EtsVoyageInput[],
  config: EtsConfig = {},
): EtsLiabilityResult {
  const pricePerTonne = config.pricePerTonne ?? 80;

  let totalCo2 = 0;
  let totalEtsCo2 = 0;
  let totalEtsCost = 0;

  const voyageResults: EtsVoyageResult[] = voyages.map((v) => {
    const emissionFactor = getEmissionFactor(v.fuelType);
    const co2 = round(v.fuelConsumed * emissionFactor, 4);

    const etsScope = determineEtsScope(
      v.portCountries.departure,
      v.portCountries.arrival,
    );

    const etsCo2 = round(co2 * etsScope, 4);
    const etsCost = round(etsCo2 * pricePerTonne, 2);

    totalCo2 += co2;
    totalEtsCo2 += etsCo2;
    totalEtsCost += etsCost;

    return {
      voyageRef: v.voyageRef,
      co2,
      etsScope,
      etsCo2,
      etsCost,
    };
  });

  return {
    voyages: voyageResults,
    totalCo2: round(totalCo2, 4),
    totalEtsCo2: round(totalEtsCo2, 4),
    totalEtsCost: round(totalEtsCost, 2),
  };
}

/**
 * Calculate the Carbon Intensity Indicator (CII) rating for a vessel-year.
 *
 * Steps:
 *   1. Compute total CO2 from all fuel types.
 *   2. attainedCII = (totalCO2 * 1,000,000) / (dwt * distance).
 *   3. referenceCII from the IMO reference line: a * DWT^(-c).
 *   4. requiredCII = referenceCII * (1 - reductionFactor(year)).
 *   5. Determine rating from d-vector boundaries.
 *
 * @param data - Vessel operational data for the year
 * @returns CII rating result with boundaries and improvement guidance
 */
export function calculateCiiRating(data: CiiInput): CiiRatingResult {
  const { dwt, distanceTravelled, fuelConsumption, year } = data;

  // Step 1: Total CO2 emissions from all fuel types
  let totalCo2Tonnes = 0;
  for (const fc of fuelConsumption) {
    const factor = getEmissionFactor(fc.fuelType);
    totalCo2Tonnes += fc.tonnes * factor;
  }

  // Step 2: Attained CII (gCO2 per dwt-nm)
  // attainedCII = (totalCO2 in grams) / (dwt * distance in nm)
  //             = (totalCO2_tonnes * 1,000,000) / (dwt * distance)
  const transportWork = dwt * distanceTravelled;
  const attainedCii = transportWork > 0
    ? round((totalCo2Tonnes * 1_000_000) / transportWork, 4)
    : 0;

  // Step 3: Reference CII from the IMO reference line
  const referenceCii = round(calculateReferenceCii(dwt), 4);

  // Step 4: Required CII applying the year's reduction factor
  const reductionFactor = getCiiReductionFactor(year);
  const requiredCii = round(referenceCii * (1 - reductionFactor), 4);

  // Step 5: Rating boundaries using d-vectors applied to requiredCii
  const d1 = round(requiredCii * CII_D_VECTORS.d1, 4);
  const d2 = round(requiredCii * CII_D_VECTORS.d2, 4);
  const d3 = round(requiredCii * CII_D_VECTORS.d3, 4);
  const d4 = round(requiredCii * CII_D_VECTORS.d4, 4);

  const ratingBoundaries: CiiRatingBoundaries = {
    a: { upper: d1 },
    b: { lower: d1, upper: d2 },
    c: { lower: d2, upper: d3 },
    d: { lower: d3, upper: d4 },
    e: { lower: d4 },
  };

  // Determine rating
  let rating: 'A' | 'B' | 'C' | 'D' | 'E';
  if (attainedCii <= d1) {
    rating = 'A';
  } else if (attainedCii <= d2) {
    rating = 'B';
  } else if (attainedCii <= d3) {
    rating = 'C';
  } else if (attainedCii <= d4) {
    rating = 'D';
  } else {
    rating = 'E';
  }

  // Improvement needed: percentage reduction to reach the upper bound of C
  let improvementNeeded = 0;
  if (attainedCii > d3 && attainedCii > 0) {
    // Need to reduce attainedCii to d3 to achieve C rating
    improvementNeeded = round(((attainedCii - d3) / attainedCii) * 100, 2);
  }

  return {
    attainedCii,
    requiredCii,
    referenceCii,
    rating,
    ratingBoundaries,
    improvementNeeded,
  };
}

/**
 * Calculate FuelEU Maritime compliance and penalty.
 *
 * Steps:
 *   1. Compliance balance = (targetIntensity - ghgIntensity) * energyUsed.
 *      Positive balance means a surplus (compliant); negative means a deficit.
 *   2. If non-compliant: penalty = |complianceBalance| * EUR 2400 per tonne.
 *   3. If compliant: surplus can be banked up to 25% of the compliance balance.
 *
 * @param data - GHG intensity and energy consumption data
 * @returns Compliance status, penalty, and bankable surplus
 */
export function calculateFuelEuPenalty(data: FuelEuInput): FuelEuResult {
  const { ghgIntensity, targetIntensity, energyUsed } = data;

  // Compliance balance in gCO2eq units (intensity * energy)
  // Positive = surplus, negative = deficit
  const complianceBalance = round(
    (targetIntensity - ghgIntensity) * energyUsed,
    4,
  );

  const isCompliant = complianceBalance >= 0;

  // Penalty calculation
  // The penalty applies to the deficit expressed in tonnes of CO2eq.
  // complianceBalance is in gCO2eq (intensity in gCO2eq/MJ * energy in MJ).
  // Convert grams to tonnes: / 1,000,000.
  let penalty = 0;
  if (!isCompliant) {
    const deficitTonnes = Math.abs(complianceBalance) / 1_000_000;
    penalty = round(deficitTonnes * FUELEU_PENALTY_RATE_EUR, 2);
  }

  // Surplus banking: up to 25% of the compliance balance can be banked
  // for use in the following compliance period
  let surplusBankable = 0;
  if (isCompliant && complianceBalance > 0) {
    surplusBankable = round(complianceBalance * FUELEU_BANKING_CAP, 4);
  }

  return {
    ghgIntensity,
    targetIntensity,
    complianceBalance,
    isCompliant,
    penalty,
    surplusBankable,
  };
}

/**
 * Project emission trajectory and compare against IMO targets.
 *
 * Steps:
 *   1. Compute historical CO2 intensity per dwt-nm for each data point.
 *   2. Run linear regression to determine the trend.
 *   3. Project year-by-year from the last historical year to targetYear.
 *   4. Compare projected intensity to IMO target trajectory
 *      (40% reduction by 2030, 70% by 2050 relative to 2008 baseline).
 *   5. Determine whether the fleet is on track and the year of compliance.
 *
 * @param historicalData - Array of annual emission data points
 * @param targetYear     - The year to project forward to
 * @returns Trajectory projections and on-track assessment
 */
export function projectEmissionTrajectory(
  historicalData: HistoricalEmissionPoint[],
  targetYear: number,
): TrajectoryResult {
  if (historicalData.length === 0) {
    return {
      projections: [],
      onTrack: false,
      yearOfCompliance: null,
    };
  }

  // Sort by year ascending
  const sorted = [...historicalData].sort((a, b) => a.year - b.year);

  // Compute CO2 intensity per dwt-nm for each year (in gCO2 per dwt-nm)
  const intensityPoints: { x: number; y: number }[] = sorted.map((d) => {
    const transportWork = d.dwt * d.distance;
    const intensity = transportWork > 0
      ? (d.co2 * 1_000_000) / transportWork
      : 0;
    return { x: d.year, y: intensity };
  });

  // Linear regression on intensity trend
  const regression = linearRegression(intensityPoints);

  // Project from the year after the last data point to the target year
  const lastYear = sorted[sorted.length - 1].year;
  const startYear = lastYear + 1;

  const projections: TrajectoryProjection[] = [];
  let yearOfCompliance: number | null = null;
  let onTrack = false;

  for (let year = startYear; year <= targetYear; year++) {
    const projectedIntensity = round(
      Math.max(0, regression.slope * year + regression.intercept),
      4,
    );
    const targetIntensity = round(imoTargetIntensity(year), 4);
    const gap = round(projectedIntensity - targetIntensity, 4);

    projections.push({
      year,
      projectedCo2: projectedIntensity,
      targetCo2: targetIntensity,
      gap,
    });

    // Track the first year where projected meets or beats the target
    if (yearOfCompliance === null && projectedIntensity <= targetIntensity) {
      yearOfCompliance = year;
    }
  }

  // Also check the last historical year to see if already compliant
  if (intensityPoints.length > 0) {
    const lastIntensity = intensityPoints[intensityPoints.length - 1].y;
    const lastTarget = imoTargetIntensity(lastYear);
    if (lastIntensity <= lastTarget) {
      yearOfCompliance = lastYear;
    }
  }

  // Determine on-track status: projections for the target year meet the target
  if (projections.length > 0) {
    const finalProjection = projections[projections.length - 1];
    onTrack = finalProjection.projectedCo2 <= finalProjection.targetCo2;
  }

  return {
    projections,
    onTrack,
    yearOfCompliance,
  };
}
