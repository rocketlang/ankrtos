// weather-warranty-checker.ts
// Charter Party weather warranty compliance analysis.
// Pure functions for evaluating vessel performance against CP warranty terms,
// filtering good/bad weather days, computing speed/consumption claims, and
// Beaufort scale conversions.
// No DB or Prisma dependency.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WarrantyTerms {
  /** Warranted speed in knots (vessel must achieve >= this in good weather). */
  speed: number;
  /** Warranted fuel consumption in MT/day (vessel must not exceed this in good weather). */
  consumption: number;
  /** Maximum Beaufort scale value considered "good weather". */
  beaufortLimit: number;
  /** Optional maximum sea state descriptor (e.g., 'moderate', 'rough'). */
  seaStateLimit?: string;
}

export interface WeatherEntry {
  date: Date;
  /** Observed Beaufort scale (0-12). */
  beaufortScale: number;
  /** Wind speed in knots (optional, for additional detail). */
  windSpeed?: number;
  /** Significant wave height in metres (optional). */
  waveHeight?: number;
  /** Actual vessel speed achieved on this day in knots. */
  actualSpeed: number;
  /** Actual fuel consumption on this day in MT. */
  actualConsumption: number;
}

export interface WarrantyDayDetail {
  date: Date;
  goodWeather: boolean;
  speedOk: boolean;
  consumptionOk: boolean;
}

export interface WarrantyResult {
  /** Total number of days in the assessment period. */
  totalDays: number;
  /** Number of days classified as good weather. */
  goodWeatherDays: number;
  /** Number of days classified as bad weather (excluded from warranty check). */
  badWeatherDays: number;
  /** Whether the vessel meets warranty on good weather days overall. */
  warrantyCompliant: boolean;
  /** Average speed on good weather days (knots). */
  avgSpeedGoodWeather: number;
  /** Average consumption on good weather days (MT/day). */
  avgConsumptionGoodWeather: number;
  /** Speed claim in knots: warranty speed - avg achieved speed (positive = under-performance). */
  speedClaim: number;
  /** Consumption claim in MT/day: avg consumption - warranty (positive = over-consumption). */
  consumptionClaim: number;
  /** Per-day breakdown. */
  details: WarrantyDayDetail[];
}

// ---------------------------------------------------------------------------
// Beaufort Scale Reference Data
// ---------------------------------------------------------------------------

/**
 * Beaufort scale descriptions (WMO standard).
 * Index corresponds to the Beaufort number (0-12).
 */
const BEAUFORT_DESCRIPTIONS: string[] = [
  'Calm (glassy)',                // 0
  'Light air',                    // 1
  'Light breeze',                 // 2
  'Gentle breeze',                // 3
  'Moderate breeze',              // 4
  'Fresh breeze',                 // 5
  'Strong breeze',                // 6
  'Near gale (moderate gale)',    // 7
  'Gale (fresh gale)',            // 8
  'Strong gale',                  // 9
  'Storm (whole gale)',           // 10
  'Violent storm',                // 11
  'Hurricane force',              // 12
];

/**
 * Mapping from Beaufort number to Douglas Sea State description.
 * The sea state does not map 1:1 with Beaufort, but this provides the
 * commonly accepted correspondence used in charterparty practice.
 */
const BEAUFORT_TO_SEA_STATE: string[] = [
  'Calm (glassy)',       // 0 — sea state 0
  'Calm (rippled)',      // 1 — sea state 1
  'Smooth',              // 2 — sea state 2
  'Slight',              // 3 — sea state 3
  'Moderate',            // 4 — sea state 3-4
  'Moderate',            // 5 — sea state 4
  'Rough',               // 6 — sea state 5
  'Rough',               // 7 — sea state 5-6
  'Very rough',          // 8 — sea state 6
  'High',                // 9 — sea state 6-7
  'Very high',           // 10 — sea state 7-8
  'Very high',           // 11 — sea state 8
  'Phenomenal',          // 12 — sea state 9
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Determine whether an entry qualifies as good weather based on the
 * Beaufort limit in the warranty terms and optional sea state limit.
 */
function isGoodWeather(entry: WeatherEntry, warranty: WarrantyTerms): boolean {
  // Primary check: Beaufort scale
  if (entry.beaufortScale > warranty.beaufortLimit) {
    return false;
  }

  // Optional secondary check: sea state descriptor
  if (warranty.seaStateLimit) {
    const actualSeaState = beaufortToSeaState(entry.beaufortScale);
    const seaStateRank = seaStateRanking(actualSeaState);
    const limitRank = seaStateRanking(warranty.seaStateLimit);

    if (seaStateRank > limitRank) {
      return false;
    }
  }

  return true;
}

/**
 * Assign a numeric rank to sea state descriptors for comparison.
 * Lower rank = calmer conditions.
 */
function seaStateRanking(descriptor: string): number {
  const normalised = descriptor.toLowerCase().trim();

  const rankings: Record<string, number> = {
    'calm (glassy)': 0,
    'calm (rippled)': 1,
    'smooth': 2,
    'slight': 3,
    'moderate': 4,
    'rough': 5,
    'very rough': 6,
    'high': 7,
    'very high': 8,
    'phenomenal': 9,
  };

  return rankings[normalised] ?? 5; // default to 'rough' if unrecognised
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Evaluate weather warranty compliance for a set of daily weather/performance
 * entries against the charter party warranty terms.
 *
 * Good weather days are those where Beaufort <= warranty limit. On those days
 * the vessel's speed must be >= warranted speed and consumption must be <=
 * warranted consumption. Bad weather days are excluded from the assessment.
 *
 * @param entries - Array of daily weather and performance records
 * @param warranty - The CP warranty terms
 * @returns Detailed warranty compliance result
 */
export function checkWarrantyCompliance(
  entries: WeatherEntry[],
  warranty: WarrantyTerms,
): WarrantyResult {
  if (entries.length === 0) {
    return {
      totalDays: 0,
      goodWeatherDays: 0,
      badWeatherDays: 0,
      warrantyCompliant: true,
      avgSpeedGoodWeather: 0,
      avgConsumptionGoodWeather: 0,
      speedClaim: 0,
      consumptionClaim: 0,
      details: [],
    };
  }

  const details: WarrantyDayDetail[] = [];
  let goodWeatherCount = 0;
  let badWeatherCount = 0;
  let totalSpeedGoodWeather = 0;
  let totalConsumptionGoodWeather = 0;

  for (const entry of entries) {
    const goodWeather = isGoodWeather(entry, warranty);

    const speedOk = goodWeather ? entry.actualSpeed >= warranty.speed : true;
    const consumptionOk = goodWeather
      ? entry.actualConsumption <= warranty.consumption
      : true;

    if (goodWeather) {
      goodWeatherCount++;
      totalSpeedGoodWeather += entry.actualSpeed;
      totalConsumptionGoodWeather += entry.actualConsumption;
    } else {
      badWeatherCount++;
    }

    details.push({
      date: entry.date,
      goodWeather,
      speedOk,
      consumptionOk,
    });
  }

  const avgSpeedGoodWeather =
    goodWeatherCount > 0
      ? round(totalSpeedGoodWeather / goodWeatherCount)
      : 0;

  const avgConsumptionGoodWeather =
    goodWeatherCount > 0
      ? round(totalConsumptionGoodWeather / goodWeatherCount)
      : 0;

  // Speed claim: positive means vessel was slower than warranty
  const speedClaim =
    goodWeatherCount > 0
      ? round(Math.max(0, warranty.speed - avgSpeedGoodWeather))
      : 0;

  // Consumption claim: positive means vessel consumed more than warranty
  const consumptionClaim =
    goodWeatherCount > 0
      ? round(Math.max(0, avgConsumptionGoodWeather - warranty.consumption))
      : 0;

  const warrantyCompliant = speedClaim === 0 && consumptionClaim === 0;

  return {
    totalDays: entries.length,
    goodWeatherDays: goodWeatherCount,
    badWeatherDays: badWeatherCount,
    warrantyCompliant,
    avgSpeedGoodWeather,
    avgConsumptionGoodWeather,
    speedClaim,
    consumptionClaim,
    details,
  };
}

/**
 * Calculate the financial impact of under-performance against the warranty.
 *
 * Speed claim logic:
 *   - Extra days at sea = (distance / actual speed - distance / warranty speed)
 *   - But since we may not have distance, we estimate from the good weather days:
 *     extra_days = goodWeatherDays * (warranty.speed - avgSpeed) / warranty.speed
 *   - Financial impact = extra_days * hireRate (daily hire rate in USD)
 *
 * Consumption claim logic:
 *   - Extra fuel per day = avgConsumption - warranty.consumption
 *   - Total extra fuel = extra fuel per day * goodWeatherDays
 *   - This is returned as a separate component and not converted to USD
 *     because bunker price is not included in the warranty terms.
 *
 * @param warranty - The CP warranty terms
 * @param result - The warranty compliance result from checkWarrantyCompliance
 * @param hireRate - Daily hire rate in USD
 * @returns Total estimated speed claim amount in USD
 */
export function calculateSpeedClaim(
  warranty: WarrantyTerms,
  result: WarrantyResult,
  hireRate: number,
): number {
  if (result.speedClaim <= 0 || result.goodWeatherDays === 0) {
    return 0;
  }

  // The speed claim represents lost time. If the vessel is slower than
  // warranty by X knots over N good weather days, the extra time is:
  //   extra_hours_per_day = 24 * (1 - avgSpeed / warrantySpeed)
  //   (because at lower speed the same distance takes proportionally longer)
  //
  // Simplified: extra days = N * (1 - avgSpeed / warrantySpeed)

  const speedRatio = result.avgSpeedGoodWeather / warranty.speed;
  if (speedRatio >= 1) {
    return 0; // no under-performance
  }

  // Time lost factor: (1/actual_speed - 1/warranty_speed) / (1/warranty_speed)
  // = warranty_speed / actual_speed - 1
  const timeLostFactor = (warranty.speed / result.avgSpeedGoodWeather) - 1;
  const extraDays = result.goodWeatherDays * timeLostFactor;
  const claimAmount = round(extraDays * hireRate);

  return Math.max(0, claimAmount);
}

/**
 * Convert a Beaufort scale number to the corresponding Douglas Sea State
 * description.
 *
 * @param beaufort - Beaufort scale number (0-12)
 * @returns Sea state description string
 */
export function beaufortToSeaState(beaufort: number): string {
  const clamped = Math.max(0, Math.min(12, Math.round(beaufort)));
  return BEAUFORT_TO_SEA_STATE[clamped];
}

/**
 * Convert a Beaufort scale number to its standard wind description.
 *
 * @param beaufort - Beaufort scale number (0-12)
 * @returns Wind description string (e.g., 'Calm (glassy)', 'Strong breeze')
 */
export function beaufortToDescription(beaufort: number): string {
  const clamped = Math.max(0, Math.min(12, Math.round(beaufort)));
  return BEAUFORT_DESCRIPTIONS[clamped];
}
