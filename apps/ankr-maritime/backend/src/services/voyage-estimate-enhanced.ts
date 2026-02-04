// ---------------------------------------------------------------------------
// Enhanced Voyage Estimate Calculations
// Pure functions -- no database access.  All data arrives via parameters.
// ---------------------------------------------------------------------------

// ========================== Type Definitions ==========================

export interface CanalTransitParams {
  canal: 'suez' | 'panama' | 'kiel';
  vesselGrt: number;
  vesselNrt: number;
  vesselType: string;
  cargoQuantity?: number;
  laden: boolean;
}

export interface CanalTransitResult {
  cost: number;
  transitTimeHours: number;
  details: string;
}

export interface TimeBreakdownParams {
  seaDistanceNm: number;
  speedKnots: number;
  loadDays: number;
  dischargeDays: number;
  canalTransits?: { canal: string; transitTimeHours: number }[];
  waitingDays?: number;
}

export interface TimeBreakdownResult {
  seaDays: number;
  portDays: number;
  canalDays: number;
  waitingDays: number;
  totalDays: number;
}

export interface TceBackwardParams {
  targetTce: number;
  totalDays: number;
  totalCosts: number;
  brokerCommPct: number;
  addressCommPct: number;
  cargoQuantity: number;
  freightUnit: string;
}

export interface TceBackwardResult {
  requiredFreightRate: number;
  requiredGrossRevenue: number;
}

export interface VoyageEstimateBaseInput {
  vesselDwt: number;
  cargoQuantity: number;
  freightRate: number;
  freightUnit: string; // 'per_mt' | 'lumpsum'
  seaDistanceNm: number;
  speedKnots: number;
  bunkerPriceIfo: number;
  bunkerPriceMgo: number;
  consumptionSeaIfo: number;
  consumptionPortIfo: number;
  consumptionMgo: number;
  loadPortDa: number;
  dischargePortDa: number;
  loadDays: number;
  dischargeDays: number;
  brokerCommPct: number;
  addressCommPct: number;
  canalDues: number;
  insurance: number;
  miscCosts: number;
}

export interface SensitivityScenario {
  label: string;
  tce: number;
  netResult: number;
  totalDays: number;
}

export interface SensitivityResult {
  baseTce: number;
  scenarios: SensitivityScenario[];
}

export interface SensitivityVariations {
  bunkerPriceVariation: number;
  speedVariation: number;
  portTimeVariation: number;
}

// ========================== Helpers ==================================

/** Round to two decimal places (monetary). */
function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Round to one decimal place (days / hours). */
function r1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ========================== 1. Canal Transit Cost ====================

export function calculateCanalTransitCost(
  params: CanalTransitParams,
): CanalTransitResult {
  const { canal, vesselGrt, vesselNrt, vesselType, laden } = params;

  switch (canal) {
    case 'suez':
      return calculateSuezCost(vesselNrt, vesselType, laden);
    case 'panama':
      return calculatePanamaCost(vesselGrt, vesselNrt);
    case 'kiel':
      return calculateKielCost(vesselGrt);
    default: {
      // Exhaustiveness check -- the type system prevents this but guard at
      // runtime for safety.
      const _exhaustive: never = canal;
      throw new Error(`Unknown canal: ${_exhaustive}`);
    }
  }
}

function calculateSuezCost(
  nrt: number,
  vesselType: string,
  laden: boolean,
): CanalTransitResult {
  // Suez Canal Net Tonnage (SCNT) based fee schedule
  // Laden base: NRT * 7.88 SDR  +  5 000 SDR surcharge
  // Ballast: 85 % of laden base
  // Tanker laden surcharge: +10 %
  const sdrRate = 7.88;
  const surcharge = 5000;
  let baseFee = nrt * sdrRate + surcharge;

  if (!laden) {
    baseFee = baseFee * 0.85;
  }

  const isTanker =
    vesselType.toLowerCase().includes('tanker') ||
    vesselType.toLowerCase().includes('vlcc') ||
    vesselType.toLowerCase().includes('ulcc') ||
    vesselType.toLowerCase().includes('aframax') ||
    vesselType.toLowerCase().includes('suezmax');

  if (isTanker && laden) {
    baseFee = baseFee * 1.1;
  }

  // Transit time: 12-16 hours.  We use the midpoint for estimation and
  // expose the range in details.
  const transitTimeHours = 14;

  const details = [
    `Suez Canal transit (${laden ? 'laden' : 'ballast'})`,
    `NRT: ${nrt.toLocaleString()} | SDR rate: ${sdrRate}/NRT + ${surcharge.toLocaleString()} surcharge`,
    laden ? '' : 'Ballast discount: 15%',
    isTanker && laden ? 'Tanker laden surcharge: +10%' : '',
    `Estimated transit time: ${transitTimeHours}h (range 12-16h)`,
  ]
    .filter(Boolean)
    .join('. ');

  return {
    cost: r2(baseFee),
    transitTimeHours,
    details,
  };
}

function calculatePanamaCost(
  grt: number,
  nrt: number,
): CanalTransitResult {
  // Panama Canal tolls are based on PC/UMS tonnage.
  // We use NRT as the basis (standard for commercial vessels).
  //
  // Tiered rate (Panamax and under):
  //   First  10 000 tons: $5.25 / ton
  //   Next   10 000 tons: $5.14 / ton
  //   Remainder:          $5.01 / ton
  //
  // Post-Panamax (GRT > 52 000): +15 % surcharge on total.

  const tier1Limit = 10_000;
  const tier2Limit = 20_000;
  const tier1Rate = 5.25;
  const tier2Rate = 5.14;
  const tier3Rate = 5.01;

  let fee = 0;

  if (nrt <= tier1Limit) {
    fee = nrt * tier1Rate;
  } else if (nrt <= tier2Limit) {
    fee = tier1Limit * tier1Rate + (nrt - tier1Limit) * tier2Rate;
  } else {
    fee =
      tier1Limit * tier1Rate +
      (tier2Limit - tier1Limit) * tier2Rate +
      (nrt - tier2Limit) * tier3Rate;
  }

  // Post-Panamax surcharge
  const isPostPanamax = grt > 52_000;
  if (isPostPanamax) {
    fee = fee * 1.15;
  }

  // Transit time: 8-10 hours.  We use midpoint.
  const transitTimeHours = 9;

  const details = [
    `Panama Canal transit`,
    `NRT: ${nrt.toLocaleString()} | Tiered toll ($${tier1Rate}/${tier2Rate}/${tier3Rate} per ton)`,
    isPostPanamax
      ? `Post-Panamax surcharge: +15% (GRT ${grt.toLocaleString()} > 52,000)`
      : `Panamax class (GRT ${grt.toLocaleString()})`,
    `Estimated transit time: ${transitTimeHours}h (range 8-10h)`,
  ].join('. ');

  return {
    cost: r2(fee),
    transitTimeHours,
    details,
  };
}

function calculateKielCost(grt: number): CanalTransitResult {
  // Kiel Canal: flat $0.45 / GRT
  const rate = 0.45;
  const fee = grt * rate;

  // Transit time: 7-8 hours.  We use midpoint 7.5h.
  const transitTimeHours = 7.5;

  const details = [
    `Kiel Canal transit`,
    `GRT: ${grt.toLocaleString()} | Rate: $${rate}/GRT`,
    `Estimated transit time: ${transitTimeHours}h (range 7-8h)`,
  ].join('. ');

  return {
    cost: r2(fee),
    transitTimeHours,
    details,
  };
}

// ========================== 2. Time Breakdown ========================

export function calculateTimeBreakdown(
  params: TimeBreakdownParams,
): TimeBreakdownResult {
  const {
    seaDistanceNm,
    speedKnots,
    loadDays,
    dischargeDays,
    canalTransits,
    waitingDays: waitingDaysInput,
  } = params;

  // Sea days = distance / (speed * 24 h/day)
  const seaDays = seaDistanceNm / (speedKnots * 24);

  // Port days = loading + discharging
  const portDays = loadDays + dischargeDays;

  // Canal days = sum of all canal transit hours / 24
  let canalHours = 0;
  if (canalTransits && canalTransits.length > 0) {
    for (const transit of canalTransits) {
      canalHours += transit.transitTimeHours;
    }
  }
  const canalDays = canalHours / 24;

  const waitingDays = waitingDaysInput ?? 0;

  const totalDays = seaDays + portDays + canalDays + waitingDays;

  return {
    seaDays: r1(seaDays),
    portDays: r1(portDays),
    canalDays: r1(canalDays),
    waitingDays: r1(waitingDays),
    totalDays: r1(totalDays),
  };
}

// ========================== 3. TCE Backward ==========================

export function calculateTceBackward(
  params: TceBackwardParams,
): TceBackwardResult {
  const {
    targetTce,
    totalDays,
    totalCosts,
    brokerCommPct,
    addressCommPct,
    cargoQuantity,
    freightUnit,
  } = params;

  // Work backwards from a target TCE ($/day) to find the required freight rate.
  //
  //   netResult = targetTce * totalDays
  //   netRevenue = netResult + totalCosts
  //   grossRevenue = netRevenue / (1 - commissionFraction)
  //   requiredFreightRate = grossRevenue / cargoQuantity   (per_mt)
  //                       = grossRevenue                    (lumpsum)

  const netResult = targetTce * totalDays;
  const netRevenue = netResult + totalCosts;

  const commissionFraction = (brokerCommPct + addressCommPct) / 100;

  // Guard against 100 % commission which would cause division by zero.
  if (commissionFraction >= 1) {
    throw new Error(
      `Total commission percentage (${brokerCommPct + addressCommPct}%) must be less than 100%`,
    );
  }

  const requiredGrossRevenue = netRevenue / (1 - commissionFraction);

  let requiredFreightRate: number;
  if (freightUnit === 'lumpsum') {
    requiredFreightRate = requiredGrossRevenue;
  } else {
    // per_mt or any per-unit basis
    if (cargoQuantity <= 0) {
      throw new Error('cargoQuantity must be greater than 0 for per-unit freight');
    }
    requiredFreightRate = requiredGrossRevenue / cargoQuantity;
  }

  return {
    requiredFreightRate: r2(requiredFreightRate),
    requiredGrossRevenue: r2(requiredGrossRevenue),
  };
}

// ========================== 4. Sensitivity Analysis ===================

/**
 * Compute a single voyage's TCE from base input overrides.
 * This is a pure helper that mirrors the calculation in the GraphQL resolver
 * so sensitivity scenarios stay consistent.
 */
function computeTce(input: VoyageEstimateBaseInput): {
  tce: number;
  netResult: number;
  totalDays: number;
} {
  // Revenue
  const grossRevenue =
    input.freightUnit === 'lumpsum'
      ? input.freightRate
      : input.freightRate * input.cargoQuantity;

  const brokerComm = grossRevenue * input.brokerCommPct / 100;
  const addressComm = grossRevenue * input.addressCommPct / 100;
  const netRevenue = grossRevenue - brokerComm - addressComm;

  // Time
  const seaDays = input.seaDistanceNm / (input.speedKnots * 24);
  const portDays = input.loadDays + input.dischargeDays;
  const totalDays = seaDays + portDays;

  // Bunker
  const bunkerIfoSea = seaDays * input.consumptionSeaIfo * input.bunkerPriceIfo;
  const bunkerIfoPort = portDays * input.consumptionPortIfo * input.bunkerPriceIfo;
  const bunkerMgo = totalDays * input.consumptionMgo * input.bunkerPriceMgo;
  const totalBunkerCost = bunkerIfoSea + bunkerIfoPort + bunkerMgo;

  // Port + other costs
  const totalPortCost = input.loadPortDa + input.dischargePortDa;
  const totalCosts =
    totalBunkerCost +
    totalPortCost +
    input.canalDues +
    input.insurance +
    input.miscCosts;

  const netResult = netRevenue - totalCosts;
  const tce = totalDays > 0 ? netResult / totalDays : 0;

  return {
    tce: Math.round(tce),
    netResult: Math.round(netResult),
    totalDays: r1(totalDays),
  };
}

export function calculateSensitivityAnalysis(params: {
  baseInput: VoyageEstimateBaseInput;
  variations: SensitivityVariations;
}): SensitivityResult {
  const { baseInput, variations } = params;

  const base = computeTce(baseInput);

  const scenarios: SensitivityScenario[] = [];

  // Helper to build a scenario from partial overrides.
  function scenario(
    label: string,
    overrides: Partial<VoyageEstimateBaseInput>,
  ): SensitivityScenario {
    const modified = { ...baseInput, ...overrides };
    const result = computeTce(modified);
    return { label, ...result };
  }

  const bVar = variations.bunkerPriceVariation;
  const sVar = variations.speedVariation;
  const pVar = variations.portTimeVariation;

  // --- Bunker price scenarios ---
  scenarios.push(
    scenario(`Bunker IFO +$${bVar}/MT`, {
      bunkerPriceIfo: baseInput.bunkerPriceIfo + bVar,
      bunkerPriceMgo: baseInput.bunkerPriceMgo + bVar,
    }),
  );
  scenarios.push(
    scenario(`Bunker IFO -$${bVar}/MT`, {
      bunkerPriceIfo: baseInput.bunkerPriceIfo - bVar,
      bunkerPriceMgo: baseInput.bunkerPriceMgo - bVar,
    }),
  );

  // --- Speed scenarios ---
  scenarios.push(
    scenario(`Speed +${sVar} kn`, {
      speedKnots: baseInput.speedKnots + sVar,
    }),
  );
  scenarios.push(
    scenario(`Speed -${sVar} kn`, {
      speedKnots: baseInput.speedKnots - sVar,
    }),
  );

  // --- Port time scenarios ---
  scenarios.push(
    scenario(`Port time +${pVar} day(s)`, {
      loadDays: baseInput.loadDays + pVar / 2,
      dischargeDays: baseInput.dischargeDays + pVar / 2,
    }),
  );
  scenarios.push(
    scenario(`Port time -${pVar} day(s)`, {
      loadDays: Math.max(0, baseInput.loadDays - pVar / 2),
      dischargeDays: Math.max(0, baseInput.dischargeDays - pVar / 2),
    }),
  );

  // --- Best case: low bunker, high speed, low port time ---
  scenarios.push(
    scenario('Best case', {
      bunkerPriceIfo: baseInput.bunkerPriceIfo - bVar,
      bunkerPriceMgo: baseInput.bunkerPriceMgo - bVar,
      speedKnots: baseInput.speedKnots + sVar,
      loadDays: Math.max(0, baseInput.loadDays - pVar / 2),
      dischargeDays: Math.max(0, baseInput.dischargeDays - pVar / 2),
    }),
  );

  // --- Worst case: high bunker, low speed, high port time ---
  scenarios.push(
    scenario('Worst case', {
      bunkerPriceIfo: baseInput.bunkerPriceIfo + bVar,
      bunkerPriceMgo: baseInput.bunkerPriceMgo + bVar,
      speedKnots: baseInput.speedKnots - sVar,
      loadDays: baseInput.loadDays + pVar / 2,
      dischargeDays: baseInput.dischargeDays + pVar / 2,
    }),
  );

  return {
    baseTce: base.tce,
    scenarios,
  };
}
