// emission-calculator.ts
// Maritime emission calculations: CII rating, EU ETS cost, FuelEU Maritime compliance, voyage emissions.
// Pure functions — no DB or Prisma dependency.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CiiParams {
  vesselType: string; // bulk_carrier, tanker, container, general_cargo
  dwt: number;
  distanceNm: number;
  fuelConsumedMt: number;
  fuelType: string; // hfo, vlsfo, mgo, lng, methanol
  year: number;
}

export interface CiiResult {
  attainedCII: number; // gCO2/(dwt*nm)
  requiredCII: number;
  rating: string; // A, B, C, D, E
  reductionFactorPercent: number;
  correctionFactor: number;
  yearsToD: number | null; // years until D rating at current trajectory
}

export interface EuEtsParams {
  co2EmissionsMt: number;
  voyageType: string; // intra_eu, incoming, outgoing
  year: number;
}

export interface EuEtsResult {
  applicableCo2Mt: number; // 100% intra-EU, 50% incoming/outgoing
  allowancesNeeded: number;
  pricePerAllowance: number; // EUR
  totalCostEur: number;
  phase: string; // description of phase-in percentage
}

export interface FuelEuParams {
  fuelType: string;
  fuelConsumedMt: number;
  distanceNm: number;
  year: number;
}

export interface FuelEuResult {
  ghgIntensity: number; // gCO2eq/MJ
  targetIntensity: number;
  compliant: boolean;
  complianceBalance: number; // positive = surplus, negative = deficit
  penaltyEur: number;
}

export interface VoyageEmissionParams {
  vesselType: string;
  dwt: number;
  distanceNm: number;
  speedKnots: number;
  fuelType: string;
  dailyConsumptionMt: number;
  voyageDays: number;
  voyageType: string; // intra_eu, incoming, outgoing, non_eu
}

export interface VoyageEmissionResult {
  totalFuelMt: number;
  co2EmissionsMt: number;
  cii: CiiResult;
  euEts: EuEtsResult | null; // null when non_eu
  fuelEu: FuelEuResult;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** CO2 emission factor — mt CO2 emitted per mt of fuel burned. */
const CO2_FACTORS: Record<string, number> = {
  hfo: 3.114,
  vlsfo: 3.151,
  mgo: 3.206,
  lng: 2.75,
  methanol: 1.375,
};

/** Energy content of fuels — MJ per mt. */
const ENERGY_CONTENT_MJ_PER_MT: Record<string, number> = {
  hfo: 40_200,
  vlsfo: 40_500,
  mgo: 42_700,
  lng: 49_100,
  methanol: 19_900,
};

/**
 * CII 2023 reference lines (gCO2 / (dwt * nm)).
 * Each vessel type has an ordered array of { maxDwt, ref } entries.
 * The last entry in each array acts as the catch-all for larger vessels.
 */
const CII_REFERENCE_2023: Record<string, { maxDwt: number; ref: number }[]> = {
  bulk_carrier: [
    { maxDwt: 10_000, ref: 11.41 },
    { maxDwt: 25_000, ref: 7.3 },
    { maxDwt: 50_000, ref: 5.78 },
    { maxDwt: Infinity, ref: 4.74 },
  ],
  tanker: [
    { maxDwt: 10_000, ref: 11.0 },
    { maxDwt: 25_000, ref: 7.1 },
    { maxDwt: 50_000, ref: 5.6 },
    { maxDwt: Infinity, ref: 4.5 },
  ],
  container: [
    { maxDwt: 10_000, ref: 13.0 },
    { maxDwt: 25_000, ref: 9.5 },
    { maxDwt: 50_000, ref: 7.2 },
    { maxDwt: Infinity, ref: 5.8 },
  ],
  general_cargo: [
    { maxDwt: 10_000, ref: 12.5 },
    { maxDwt: 25_000, ref: 8.8 },
    { maxDwt: 50_000, ref: 6.9 },
    { maxDwt: Infinity, ref: 5.5 },
  ],
};

/** Annual CII reduction factor (percentage) relative to the 2019 baseline. */
const CII_REDUCTION_FACTOR: Record<number, number> = {
  2023: 5,
  2024: 7,
  2025: 9,
  2026: 11,
};

/**
 * CII rating boundaries expressed as a fraction of the required CII.
 * A vessel whose attained / required ratio falls in [lower, upper) gets that rating.
 */
const CII_RATING_BANDS: { rating: string; upper: number }[] = [
  { rating: "A", upper: 0.65 },
  { rating: "B", upper: 0.85 },
  { rating: "C", upper: 1.15 },
  { rating: "D", upper: 1.35 },
  // E is anything >= 1.35
];

/** EU ETS estimated price per allowance in EUR. */
const EU_ETS_PRICE_EUR = 80;

/** EU ETS phase-in percentages by year. */
const EU_ETS_PHASE_IN: Record<number, { pct: number; label: string }> = {
  2024: { pct: 0.4, label: "2024: 40%" },
  2025: { pct: 0.7, label: "2025: 70%" },
};
// 2026 and onwards default to 100% — handled in code.

/** FuelEU Maritime GHG intensity targets (gCO2eq / MJ) by year bracket. */
const FUELEU_TARGETS: { fromYear: number; target: number }[] = [
  { fromYear: 2035, target: 67.04 },
  { fromYear: 2030, target: 80.45 },
  { fromYear: 2025, target: 89.34 },
  // Anything before 2025 uses the 2025 target as a fallback.
];

/** FuelEU penalty rate — EUR per gCO2eq/MJ of deficit per MJ of energy used. */
const FUELEU_PENALTY_RATE_EUR = 2400; // EUR per unit of excess intensity * energy

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function co2Factor(fuelType: string): number {
  return CO2_FACTORS[fuelType.toLowerCase()] ?? CO2_FACTORS.hfo;
}

function energyContentMj(fuelType: string): number {
  return ENERGY_CONTENT_MJ_PER_MT[fuelType.toLowerCase()] ?? ENERGY_CONTENT_MJ_PER_MT.hfo;
}

function ciiReference2023(vesselType: string, dwt: number): number {
  const bands = CII_REFERENCE_2023[vesselType.toLowerCase()] ?? CII_REFERENCE_2023.bulk_carrier;
  for (const band of bands) {
    if (dwt <= band.maxDwt) {
      return band.ref;
    }
  }
  return bands[bands.length - 1].ref;
}

function ciiReductionPercent(year: number): number {
  if (year in CII_REDUCTION_FACTOR) {
    return CII_REDUCTION_FACTOR[year];
  }
  // Extrapolate: after 2026, add 2% per year beyond 2026
  if (year > 2026) {
    return 11 + (year - 2026) * 2;
  }
  // Before 2023, assume 0
  return 0;
}

function ciiRating(ratio: number): string {
  for (const band of CII_RATING_BANDS) {
    if (ratio < band.upper) {
      return band.rating;
    }
  }
  return "E";
}

function fuelEuTarget(year: number): number {
  for (const entry of FUELEU_TARGETS) {
    if (year >= entry.fromYear) {
      return entry.target;
    }
  }
  // Default to the most lenient target
  return FUELEU_TARGETS[FUELEU_TARGETS.length - 1].target;
}

function round(value: number, decimals: number = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate the Carbon Intensity Indicator (CII) for a vessel-year.
 *
 * attainedCII = (fuel * CO2 factor * 1e6) / (dwt * distance)
 * requiredCII = reference2023 * (1 - reductionFactor)
 * rating = band lookup on attained / required ratio
 */
export function calculateCII(params: CiiParams): CiiResult {
  const { vesselType, dwt, distanceNm, fuelConsumedMt, fuelType, year } = params;

  const cf = co2Factor(fuelType);
  // CO2 in grams: fuelConsumedMt * cf gives mt CO2; multiply by 1e6 to get grams.
  const co2Grams = fuelConsumedMt * cf * 1e6;
  const attainedCII = round(co2Grams / (dwt * distanceNm), 4);

  const ref2023 = ciiReference2023(vesselType, dwt);
  const reductionPct = ciiReductionPercent(year);
  const correctionFactor = 1 - reductionPct / 100;
  const requiredCII = round(ref2023 * correctionFactor, 4);

  const ratio = attainedCII / requiredCII;
  const rating = ciiRating(ratio);

  // Estimate years until the vessel would hit a D rating if CII tightens each year.
  // We project forward assuming the attained CII stays constant and the required CII
  // keeps dropping by ~2% per year from the current level.
  let yearsToD: number | null = null;
  if (rating !== "D" && rating !== "E") {
    // D boundary: ratio >= 1.15
    // requiredCII drops each year → ratio rises. Solve for year where ratio >= 1.15.
    for (let y = 1; y <= 30; y++) {
      const futureReduction = ciiReductionPercent(year + y);
      const futureCorrectionFactor = 1 - futureReduction / 100;
      const futureRequired = ref2023 * futureCorrectionFactor;
      if (futureRequired <= 0) break;
      const futureRatio = attainedCII / futureRequired;
      if (futureRatio >= 1.15) {
        yearsToD = y;
        break;
      }
    }
  } else if (rating === "D" || rating === "E") {
    yearsToD = 0;
  }

  return {
    attainedCII,
    requiredCII,
    rating,
    reductionFactorPercent: reductionPct,
    correctionFactor: round(correctionFactor, 4),
    yearsToD,
  };
}

/**
 * Calculate EU ETS obligation for a voyage.
 *
 * Intra-EU voyages: 100% of CO2 is covered.
 * Incoming / outgoing voyages: 50%.
 * Phase-in: 2024 → 40%, 2025 → 70%, 2026+ → 100% of the applicable CO2.
 * Allowances are 1 per mt CO2.
 */
export function calculateEuEts(params: EuEtsParams): EuEtsResult {
  const { co2EmissionsMt, voyageType, year } = params;

  // Geographic applicability
  const geoFactor = voyageType.toLowerCase() === "intra_eu" ? 1.0 : 0.5;
  const applicableCo2BeforePhase = co2EmissionsMt * geoFactor;

  // Phase-in percentage
  const phaseEntry = EU_ETS_PHASE_IN[year];
  const phasePct = phaseEntry ? phaseEntry.pct : year >= 2026 ? 1.0 : 0;
  const phaseLabel = phaseEntry ? phaseEntry.label : year >= 2026 ? `${year}: 100%` : `${year}: 0% (not yet in force)`;

  const applicableCo2Mt = round(applicableCo2BeforePhase * phasePct, 4);
  // 1 allowance = 1 mt CO2
  const allowancesNeeded = Math.ceil(applicableCo2Mt);

  return {
    applicableCo2Mt,
    allowancesNeeded,
    pricePerAllowance: EU_ETS_PRICE_EUR,
    totalCostEur: round(allowancesNeeded * EU_ETS_PRICE_EUR, 2),
    phase: phaseLabel,
  };
}

/**
 * Check FuelEU Maritime compliance for a voyage.
 *
 * GHG intensity = (fuel * CO2 factor * 1e6) / (fuel * energyContent)
 *               = CO2 factor * 1e6 / energyContent   (gCO2eq/MJ)
 * Compliance balance = target - actual (positive is good).
 * Penalty = deficit * energyUsedMJ * penaltyRate / 1e6 (simplified).
 */
export function checkFuelEuCompliance(params: FuelEuParams): FuelEuResult {
  const { fuelType, fuelConsumedMt, year } = params;

  const cf = co2Factor(fuelType);
  const ec = energyContentMj(fuelType);

  // gCO2eq per MJ — well-to-wake simplified to tank-to-wake here.
  const ghgIntensity = round((cf * 1e6) / ec, 4);
  const targetIntensity = fuelEuTarget(year);

  const compliant = ghgIntensity <= targetIntensity;
  const complianceBalance = round(targetIntensity - ghgIntensity, 4);

  // Penalty calculation (simplified): if non-compliant, penalty proportional to
  // the deficit and total energy consumed.
  let penaltyEur = 0;
  if (!compliant) {
    const energyUsedMj = fuelConsumedMt * ec;
    // deficit in gCO2eq/MJ * total MJ = total excess gCO2eq
    const excessGrams = Math.abs(complianceBalance) * energyUsedMj;
    // Convert excess grams to mt (/ 1e6) and multiply by penalty rate per mt
    penaltyEur = round((excessGrams / 1e6) * FUELEU_PENALTY_RATE_EUR, 2);
  }

  return {
    ghgIntensity,
    targetIntensity,
    compliant,
    complianceBalance,
    penaltyEur,
  };
}

/**
 * Full voyage emission calculation combining CII, EU ETS, and FuelEU.
 */
export function calculateVoyageEmissions(params: VoyageEmissionParams): VoyageEmissionResult {
  const {
    vesselType,
    dwt,
    distanceNm,
    speedKnots,
    fuelType,
    dailyConsumptionMt,
    voyageDays,
    voyageType,
  } = params;

  const totalFuelMt = round(dailyConsumptionMt * voyageDays, 4);
  const cf = co2Factor(fuelType);
  const co2EmissionsMt = round(totalFuelMt * cf, 4);

  // Derive the year from current date for regulatory calculations.
  const year = new Date().getFullYear();

  const cii = calculateCII({
    vesselType,
    dwt,
    distanceNm,
    fuelConsumedMt: totalFuelMt,
    fuelType,
    year,
  });

  const isEuVoyage = voyageType.toLowerCase() !== "non_eu";
  const euEts = isEuVoyage
    ? calculateEuEts({
        co2EmissionsMt,
        voyageType,
        year,
      })
    : null;

  const fuelEu = checkFuelEuCompliance({
    fuelType,
    fuelConsumedMt: totalFuelMt,
    distanceNm,
    year,
  });

  return {
    totalFuelMt,
    co2EmissionsMt,
    cii,
    euEts,
    fuelEu,
  };
}
