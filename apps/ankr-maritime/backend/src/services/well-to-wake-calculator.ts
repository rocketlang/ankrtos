/**
 * Well-to-Wake (WTW) Emission Calculator
 *
 * Calculates complete lifecycle emissions for marine fuels including:
 * - WTT (Well-to-Tank): Upstream emissions from fuel production, refining, transport
 * - TTW (Tank-to-Wake): Combustion emissions (already in emission-calculator.ts)
 * - WTW (Well-to-Wake): Total lifecycle emissions (WTT + TTW)
 *
 * Based on:
 * - IMO Fourth GHG Study 2020
 * - EU Well-to-Wake GHG Intensity Guidelines
 * - ICCT Marine Fuel Lifecycle Analysis
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WellToWakeParams {
  fuelType: string;
  fuelConsumedMt: number;
  includeTransport?: boolean; // Include fuel transport emissions (default: true)
  region?: string; // Fuel production region (default: 'global')
}

export interface WellToWakeResult {
  fuelType: string;
  fuelConsumedMt: number;

  // Well-to-Tank (upstream)
  wttEmissionsMt: number;
  wttIntensity: number; // gCO2eq/MJ

  // Tank-to-Wake (combustion)
  ttwEmissionsMt: number;
  ttwIntensity: number; // gCO2eq/MJ

  // Well-to-Wake (total)
  wtwEmissionsMt: number;
  wtwIntensity: number; // gCO2eq/MJ

  // Breakdown
  breakdown: {
    extraction: number; // mt CO2eq
    refining: number;
    transport: number;
    combustion: number;
  };

  // Comparison
  vsHFO: number; // % difference vs HFO (negative = better)
  vsVLSFO: number; // % difference vs VLSFO

  // Energy metrics
  energyContentMJ: number;
  totalEnergyMJ: number;
}

export interface FuelComparisonResult {
  fuels: WellToWakeResult[];
  bestFuel: string; // Fuel with lowest WTW emissions
  worstFuel: string;
  potentialSavingsMt: number; // If switching from worst to best
  potentialSavingsPercent: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Well-to-Tank (WTT) emission factors
 * Units: gCO2eq per MJ of fuel energy
 *
 * Source: IMO Fourth GHG Study 2020, EU RED II Directive
 */
const WTT_INTENSITY: Record<string, number> = {
  // Fossil fuels
  hfo: 15.1, // Heavy Fuel Oil - high refining intensity
  vlsfo: 14.8, // Very Low Sulfur Fuel Oil
  mgo: 13.9, // Marine Gas Oil - lighter refining
  mdo: 13.5, // Marine Diesel Oil

  // Alternative fuels
  lng: 14.4, // Liquefied Natural Gas - includes methane slip
  lpg: 12.8, // Liquefied Petroleum Gas
  methanol: 11.2, // Methanol from natural gas
  methanol_renewable: 3.5, // Renewable methanol (e-methanol)
  ammonia_blue: 8.7, // Blue ammonia (with CCS)
  ammonia_green: 0.5, // Green ammonia (renewable H2)
  hydrogen_blue: 7.2, // Blue hydrogen (with CCS)
  hydrogen_green: 0.3, // Green hydrogen (renewable)

  // Biofuels
  biodiesel: 4.8, // FAME biodiesel
  hvo: 3.2, // Hydrotreated Vegetable Oil
  bio_lng: 2.1, // Liquefied biogas

  // Synthetic fuels
  efuel: 1.8, // E-diesel/e-fuel (renewable electricity)
};

/**
 * Tank-to-Wake (TTW) emission factors
 * Units: mt CO2 per mt fuel
 *
 * From emission-calculator.ts - combustion emissions only
 */
const TTW_FACTORS: Record<string, number> = {
  hfo: 3.114,
  vlsfo: 3.151,
  mgo: 3.206,
  mdo: 3.206,
  lng: 2.75,
  lpg: 3.03,
  methanol: 1.375,
  methanol_renewable: 1.375,
  ammonia_blue: 0, // No CO2 combustion (but N2O emissions exist)
  ammonia_green: 0,
  hydrogen_blue: 0, // No carbon emissions
  hydrogen_green: 0,
  biodiesel: 2.84, // Biogenic CO2 considered neutral
  hvo: 2.89,
  bio_lng: 2.62,
  efuel: 3.15, // Synthetic but still releases CO2
};

/**
 * Energy content of fuels
 * Units: MJ per mt
 */
const ENERGY_CONTENT_MJ_PER_MT: Record<string, number> = {
  hfo: 40_200,
  vlsfo: 40_500,
  mgo: 42_700,
  mdo: 42_800,
  lng: 49_100,
  lpg: 46_100,
  methanol: 19_900,
  methanol_renewable: 19_900,
  ammonia_blue: 18_600,
  ammonia_green: 18_600,
  hydrogen_blue: 120_000,
  hydrogen_green: 120_000,
  biodiesel: 37_800,
  hvo: 44_000,
  bio_lng: 48_800,
  efuel: 43_200,
};

/**
 * Transport emission factors by region
 * Units: gCO2eq per mt-km
 *
 * Accounts for fuel transport from refinery to bunkering port
 */
const TRANSPORT_FACTORS: Record<string, number> = {
  pipeline: 2.5, // Natural gas via pipeline
  ship: 3.2, // Coastal tanker
  truck: 62.0, // Road tanker
  rail: 22.0, // Rail tanker
};

/**
 * Average transport distance by fuel type
 * Units: km
 */
const AVG_TRANSPORT_DISTANCE: Record<string, { mode: string; km: number }> = {
  hfo: { mode: 'ship', km: 1200 },
  vlsfo: { mode: 'ship', km: 1200 },
  mgo: { mode: 'ship', km: 800 },
  mdo: { mode: 'ship', km: 800 },
  lng: { mode: 'ship', km: 2500 }, // LNG carriers - longer distances
  lpg: { mode: 'ship', km: 1800 },
  methanol: { mode: 'ship', km: 1500 },
  methanol_renewable: { mode: 'ship', km: 1500 },
  ammonia_blue: { mode: 'ship', km: 2000 },
  ammonia_green: { mode: 'ship', km: 2000 },
  hydrogen_blue: { mode: 'ship', km: 3000 }, // Cryogenic transport
  hydrogen_green: { mode: 'ship', km: 3000 },
  biodiesel: { mode: 'ship', km: 1000 },
  hvo: { mode: 'ship', km: 1000 },
  bio_lng: { mode: 'ship', km: 2500 },
  efuel: { mode: 'ship', km: 1200 },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizedFuelType(fuelType: string): string {
  return fuelType.toLowerCase().replace(/[_-]/g, '_');
}

function wttIntensity(fuelType: string): number {
  const normalized = normalizedFuelType(fuelType);
  return WTT_INTENSITY[normalized] ?? WTT_INTENSITY.hfo;
}

function ttwFactor(fuelType: string): number {
  const normalized = normalizedFuelType(fuelType);
  return TTW_FACTORS[normalized] ?? TTW_FACTORS.hfo;
}

function energyContent(fuelType: string): number {
  const normalized = normalizedFuelType(fuelType);
  return ENERGY_CONTENT_MJ_PER_MT[normalized] ?? ENERGY_CONTENT_MJ_PER_MT.hfo;
}

function transportDistance(fuelType: string): { mode: string; km: number } {
  const normalized = normalizedFuelType(fuelType);
  return AVG_TRANSPORT_DISTANCE[normalized] ?? { mode: 'ship', km: 1200 };
}

function round(value: number, decimals: number = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate complete Well-to-Wake lifecycle emissions for a fuel
 */
export function calculateWellToWake(params: WellToWakeParams): WellToWakeResult {
  const {
    fuelType,
    fuelConsumedMt,
    includeTransport = true
  } = params;

  const normalized = normalizedFuelType(fuelType);
  const ec = energyContent(normalized);
  const totalEnergyMJ = fuelConsumedMt * ec;

  // ------------------------------------------
  // 1. Well-to-Tank (WTT) - Upstream emissions
  // ------------------------------------------
  const wttIntensityValue = wttIntensity(normalized);
  const wttEmissionsMt = round((wttIntensityValue * totalEnergyMJ) / 1e6, 4);

  // Breakdown of WTT emissions
  // Typical split: 40% extraction, 50% refining, 10% transport
  const extraction = round(wttEmissionsMt * 0.40, 4);
  const refining = round(wttEmissionsMt * 0.50, 4);

  let transport = round(wttEmissionsMt * 0.10, 4);
  if (includeTransport) {
    // Calculate actual transport emissions
    const { mode, km } = transportDistance(normalized);
    const transportFactor = TRANSPORT_FACTORS[mode] ?? TRANSPORT_FACTORS.ship;
    // gCO2eq = mt fuel * km * factor / 1e6
    transport = round((fuelConsumedMt * km * transportFactor) / 1e6, 4);
  }

  // ------------------------------------------
  // 2. Tank-to-Wake (TTW) - Combustion emissions
  // ------------------------------------------
  const ttwFactorValue = ttwFactor(normalized);
  const ttwEmissionsMt = round(fuelConsumedMt * ttwFactorValue, 4);
  const ttwIntensityValue = round((ttwFactorValue * 1e6) / ec, 4);

  // ------------------------------------------
  // 3. Well-to-Wake (WTW) - Total lifecycle
  // ------------------------------------------
  const wtwEmissionsMt = round(wttEmissionsMt + ttwEmissionsMt, 4);
  const wtwIntensityValue = round((wtwEmissionsMt * 1e6) / totalEnergyMJ, 4);

  // ------------------------------------------
  // 4. Comparison vs baseline fuels
  // ------------------------------------------
  const hfoWtw = calculateWellToWake({
    fuelType: 'hfo',
    fuelConsumedMt,
    includeTransport
  });
  const vlsfoWtw = calculateWellToWake({
    fuelType: 'vlsfo',
    fuelConsumedMt,
    includeTransport
  });

  const vsHFO = normalized === 'hfo'
    ? 0
    : round(((wtwEmissionsMt - hfoWtw.wtwEmissionsMt) / hfoWtw.wtwEmissionsMt) * 100, 2);

  const vsVLSFO = normalized === 'vlsfo'
    ? 0
    : round(((wtwEmissionsMt - vlsfoWtw.wtwEmissionsMt) / vlsfoWtw.wtwEmissionsMt) * 100, 2);

  return {
    fuelType: normalized,
    fuelConsumedMt,

    wttEmissionsMt,
    wttIntensity: wttIntensityValue,

    ttwEmissionsMt,
    ttwIntensity: ttwIntensityValue,

    wtwEmissionsMt,
    wtwIntensity: wtwIntensityValue,

    breakdown: {
      extraction,
      refining,
      transport,
      combustion: ttwEmissionsMt,
    },

    vsHFO,
    vsVLSFO,

    energyContentMJ: ec,
    totalEnergyMJ: round(totalEnergyMJ, 2),
  };
}

/**
 * Compare multiple fuels for the same voyage/consumption scenario
 */
export function compareFuels(
  fuelTypes: string[],
  fuelConsumedMt: number,
  includeTransport: boolean = true
): FuelComparisonResult {
  const fuels = fuelTypes.map(fuelType =>
    calculateWellToWake({ fuelType, fuelConsumedMt, includeTransport })
  );

  // Sort by WTW emissions (ascending)
  fuels.sort((a, b) => a.wtwEmissionsMt - b.wtwEmissionsMt);

  const bestFuel = fuels[0].fuelType;
  const worstFuel = fuels[fuels.length - 1].fuelType;
  const potentialSavingsMt = round(
    fuels[fuels.length - 1].wtwEmissionsMt - fuels[0].wtwEmissionsMt,
    4
  );
  const potentialSavingsPercent = round(
    (potentialSavingsMt / fuels[fuels.length - 1].wtwEmissionsMt) * 100,
    2
  );

  return {
    fuels,
    bestFuel,
    worstFuel,
    potentialSavingsMt,
    potentialSavingsPercent,
  };
}

/**
 * Calculate WTW emissions for a specific voyage
 */
export function calculateVoyageWellToWake(params: {
  fuelType: string;
  dailyConsumptionMt: number;
  voyageDays: number;
  includeTransport?: boolean;
}): WellToWakeResult {
  const { fuelType, dailyConsumptionMt, voyageDays, includeTransport = true } = params;
  const totalFuelMt = dailyConsumptionMt * voyageDays;

  return calculateWellToWake({
    fuelType,
    fuelConsumedMt: totalFuelMt,
    includeTransport,
  });
}

/**
 * Get available fuel types with their WTW characteristics
 */
export function getAvailableFuels(): Array<{
  fuelType: string;
  category: string;
  wttIntensity: number;
  ttwFactor: number;
  energyContent: number;
}> {
  const fuelCategories: Record<string, string> = {
    hfo: 'Fossil',
    vlsfo: 'Fossil',
    mgo: 'Fossil',
    mdo: 'Fossil',
    lng: 'Alternative - Fossil',
    lpg: 'Alternative - Fossil',
    methanol: 'Alternative - Fossil',
    methanol_renewable: 'Alternative - Renewable',
    ammonia_blue: 'Alternative - Low Carbon',
    ammonia_green: 'Alternative - Zero Carbon',
    hydrogen_blue: 'Alternative - Low Carbon',
    hydrogen_green: 'Alternative - Zero Carbon',
    biodiesel: 'Biofuel',
    hvo: 'Biofuel',
    bio_lng: 'Biofuel',
    efuel: 'Synthetic - Renewable',
  };

  return Object.keys(WTT_INTENSITY).map(fuelType => ({
    fuelType,
    category: fuelCategories[fuelType] ?? 'Other',
    wttIntensity: WTT_INTENSITY[fuelType],
    ttwFactor: TTW_FACTORS[fuelType],
    energyContent: ENERGY_CONTENT_MJ_PER_MT[fuelType],
  }));
}
