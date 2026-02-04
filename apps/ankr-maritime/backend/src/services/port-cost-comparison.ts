// port-cost-comparison.ts
// Port cost comparison and rotation optimization for maritime operations.
// Pure functions — no DB or Prisma dependency.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PortCostInput {
  portName: string;
  portDues: number;
  pilotage: number;
  towage: number;
  berthHire: number;
  agencyFee: number;
  cargoHandling: number;
  sundries: number;
  canalDues: number;
  totalDa: number;
  currency: string;
  estimatedDays: number;
}

export interface PortComparisonParams {
  ports: PortCostInput[];
  vesselDailyHire?: number; // for TC, to include time cost
}

export interface PortComparisonResult {
  cheapest: string;
  mostExpensive: string;
  savings: number; // cheapest vs most expensive
  comparison: PortCostComparison[];
}

export interface PortCostComparison {
  portName: string;
  daCost: number;
  timeCost: number; // days * dailyHire
  totalCost: number;
  vsAverage: number; // % above/below average
  rank: number;
}

export interface RotationStop {
  portName: string;
  purpose: string; // loading, discharging, bunkering
  estimatedDays: number;
  daCost: number;
  distanceFromPrev: number; // nm (0 for the first stop)
}

export interface RotationParams {
  stops: RotationStop[];
  vesselSpeedKnots: number;
  dailyBunkerCostUsd: number;
  vesselDailyHire?: number;
}

export interface RotationResult {
  totalDistance: number;
  totalDays: number;
  totalSeaDays: number;
  totalPortDays: number;
  totalDaCost: number;
  totalBunkerCost: number;
  totalTimeCost: number;
  grandTotal: number;
  legs: RotationLeg[];
}

export interface RotationLeg {
  from: string;
  to: string;
  distanceNm: number;
  seaDays: number;
  portDays: number;
  seaCost: number;
  portCost: number;
  legTotal: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compare port costs across multiple ports.
 *
 * For each port the total cost is:
 *   totalCost = totalDa + (estimatedDays * vesselDailyHire)
 *
 * The result includes a sorted comparison with each port's cost relative to
 * the average (vsAverage as a percentage: positive = above average,
 * negative = below average).
 */
export function comparePortCosts(params: PortComparisonParams): PortComparisonResult {
  const { ports, vesselDailyHire = 0 } = params;

  if (ports.length === 0) {
    return {
      cheapest: "",
      mostExpensive: "",
      savings: 0,
      comparison: [],
    };
  }

  // Build cost entries
  const entries: PortCostComparison[] = ports.map((port) => {
    const daCost = port.totalDa;
    const timeCost = round(port.estimatedDays * vesselDailyHire, 2);
    const totalCost = round(daCost + timeCost, 2);
    return {
      portName: port.portName,
      daCost,
      timeCost,
      totalCost,
      vsAverage: 0, // computed below
      rank: 0, // assigned below
    };
  });

  // Average total cost
  const totalSum = entries.reduce((sum, e) => sum + e.totalCost, 0);
  const average = totalSum / entries.length;

  // Compute vsAverage percentage for each entry
  for (const entry of entries) {
    if (average === 0) {
      entry.vsAverage = 0;
    } else {
      entry.vsAverage = round(((entry.totalCost - average) / average) * 100, 2);
    }
  }

  // Sort by totalCost ascending and assign ranks
  entries.sort((a, b) => a.totalCost - b.totalCost);
  for (let i = 0; i < entries.length; i++) {
    entries[i].rank = i + 1;
  }

  const cheapest = entries[0];
  const mostExpensive = entries[entries.length - 1];
  const savings = round(mostExpensive.totalCost - cheapest.totalCost, 2);

  return {
    cheapest: cheapest.portName,
    mostExpensive: mostExpensive.portName,
    savings,
    comparison: entries,
  };
}

/**
 * Compute the full cost of a port rotation (sequence of stops).
 *
 * For each consecutive pair of stops the calculation is:
 *   seaDays  = distanceFromPrev / (speedKnots * 24)
 *   seaCost  = seaDays * dailyBunkerCostUsd + seaDays * vesselDailyHire
 *   portCost = daCost + estimatedDays * vesselDailyHire
 *   legTotal = seaCost + portCost
 *
 * The first stop has distanceFromPrev = 0 (or whatever the caller provides),
 * so its sea leg will be zero if the vessel is already at the first port.
 */
export function optimizePortRotation(params: RotationParams): RotationResult {
  const { stops, vesselSpeedKnots, dailyBunkerCostUsd, vesselDailyHire = 0 } = params;

  const legs: RotationLeg[] = [];
  let totalDistance = 0;
  let totalSeaDays = 0;
  let totalPortDays = 0;
  let totalDaCost = 0;
  let totalBunkerCost = 0;
  let totalTimeCost = 0;

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const fromName = i === 0 ? "Departure" : stops[i - 1].portName;
    const toName = stop.portName;

    // Sea leg
    const distanceNm = stop.distanceFromPrev;
    const seaDays =
      vesselSpeedKnots > 0 && distanceNm > 0
        ? round(distanceNm / (vesselSpeedKnots * 24), 4)
        : 0;

    const bunkerCostLeg = round(seaDays * dailyBunkerCostUsd, 2);
    const seaHireCost = round(seaDays * vesselDailyHire, 2);
    const seaCost = round(bunkerCostLeg + seaHireCost, 2);

    // Port stay
    const portDays = stop.estimatedDays;
    const daCost = stop.daCost;
    const portHireCost = round(portDays * vesselDailyHire, 2);
    const portCost = round(daCost + portHireCost, 2);

    const legTotal = round(seaCost + portCost, 2);

    legs.push({
      from: fromName,
      to: toName,
      distanceNm,
      seaDays,
      portDays,
      seaCost,
      portCost,
      legTotal,
    });

    totalDistance += distanceNm;
    totalSeaDays += seaDays;
    totalPortDays += portDays;
    totalDaCost += daCost;
    totalBunkerCost += bunkerCostLeg;
    totalTimeCost += seaHireCost + portHireCost;
  }

  const totalDays = round(totalSeaDays + totalPortDays, 4);
  const grandTotal = round(totalDaCost + totalBunkerCost + totalTimeCost, 2);

  return {
    totalDistance: round(totalDistance, 2),
    totalDays,
    totalSeaDays: round(totalSeaDays, 4),
    totalPortDays: round(totalPortDays, 2),
    totalDaCost: round(totalDaCost, 2),
    totalBunkerCost: round(totalBunkerCost, 2),
    totalTimeCost: round(totalTimeCost, 2),
    grandTotal,
    legs,
  };
}
