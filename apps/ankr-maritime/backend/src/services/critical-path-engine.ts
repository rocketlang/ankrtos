// critical-path-engine.ts
// Voyage critical path analysis using the Critical Path Method (CPM).
// Pure functions for forward/backward pass scheduling, slack computation,
// milestone templates, and delay estimation.
// No DB or Prisma dependency.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PathItem {
  id: string;
  name: string;
  /** Duration in hours. */
  duration: number;
  /** Actual duration in hours (if completed or in progress). */
  actualDuration?: number;
  /** IDs of items that must complete before this one can start. */
  dependsOn: string[];
  plannedStart?: Date;
  plannedEnd?: Date;
  actualStart?: Date;
  actualEnd?: Date;
  /** Status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'skipped' */
  status: string;
}

export interface CriticalPathItem extends PathItem {
  /** Slack (float) in hours. Zero slack = critical. */
  slack: number;
  isCritical: boolean;
  /** Earliest possible start (hours from project start). */
  earlyStart: number;
  /** Earliest possible finish (hours from project start). */
  earlyFinish: number;
  /** Latest allowable start without delaying the project. */
  lateStart: number;
  /** Latest allowable finish without delaying the project. */
  lateFinish: number;
}

export interface CriticalPathResult {
  items: CriticalPathItem[];
  /** Ordered list of item IDs forming the critical path. */
  criticalPath: string[];
  /** Total project duration in hours. */
  totalDuration: number;
  /** Estimated delay in hours based on actual vs. planned for critical items. */
  estimatedDelay: number;
  /** Overall completion percentage (0-100). */
  completionPercent: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build an adjacency map from item IDs to the items that depend on them
 * (i.e. successors), and a reverse map from item IDs to their predecessors.
 */
function buildMaps(items: PathItem[]): {
  itemMap: Map<string, PathItem>;
  successors: Map<string, string[]>;
} {
  const itemMap = new Map<string, PathItem>();
  const successors = new Map<string, string[]>();

  for (const item of items) {
    itemMap.set(item.id, item);
    if (!successors.has(item.id)) {
      successors.set(item.id, []);
    }
  }

  for (const item of items) {
    for (const depId of item.dependsOn) {
      const list = successors.get(depId);
      if (list) {
        list.push(item.id);
      }
    }
  }

  return { itemMap, successors };
}

/**
 * Topological sort of items based on dependency order.
 * Returns an ordered array of item IDs from no-dependencies to most-dependent.
 */
function topologicalSort(items: PathItem[]): string[] {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const item of items) {
    inDegree.set(item.id, item.dependsOn.length);
    if (!adjacency.has(item.id)) {
      adjacency.set(item.id, []);
    }
  }

  for (const item of items) {
    for (const depId of item.dependsOn) {
      const list = adjacency.get(depId);
      if (list) {
        list.push(item.id);
      }
    }
  }

  // Start with items that have no dependencies
  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) {
      queue.push(id);
    }
  }

  const sorted: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);

    const neighbours = adjacency.get(current) ?? [];
    for (const neighbour of neighbours) {
      const newDeg = (inDegree.get(neighbour) ?? 1) - 1;
      inDegree.set(neighbour, newDeg);
      if (newDeg === 0) {
        queue.push(neighbour);
      }
    }
  }

  // If sorted length < items length, there is a cycle — return what we have
  return sorted;
}

function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate the critical path for a set of voyage milestone items using
 * the Critical Path Method (CPM).
 *
 * Algorithm:
 *   1. Topological sort of items by dependency order
 *   2. Forward pass: compute Early Start (ES) and Early Finish (EF)
 *   3. Backward pass: compute Late Start (LS) and Late Finish (LF)
 *   4. Slack = LS - ES; critical items have slack = 0
 *   5. Estimated delay = max(actual deviation) on critical items
 *   6. Completion percentage based on completed item durations
 *
 * @param items - Array of path items with durations and dependencies
 * @returns Full critical path analysis result
 */
export function calculateCriticalPath(items: PathItem[]): CriticalPathResult {
  if (items.length === 0) {
    return {
      items: [],
      criticalPath: [],
      totalDuration: 0,
      estimatedDelay: 0,
      completionPercent: 0,
    };
  }

  const { itemMap } = buildMaps(items);
  const sortedIds = topologicalSort(items);

  // ── Forward Pass ────────────────────────────────────────────────────────
  // ES = max(EF of all predecessors), or 0 if no predecessors
  // EF = ES + duration

  const earlyStart = new Map<string, number>();
  const earlyFinish = new Map<string, number>();

  for (const id of sortedIds) {
    const item = itemMap.get(id)!;
    const effectiveDuration = item.actualDuration ?? item.duration;

    let es = 0;
    for (const depId of item.dependsOn) {
      const depEf = earlyFinish.get(depId) ?? 0;
      if (depEf > es) {
        es = depEf;
      }
    }

    earlyStart.set(id, es);
    earlyFinish.set(id, es + effectiveDuration);
  }

  // Total project duration = max EF across all items
  let totalDuration = 0;
  for (const ef of earlyFinish.values()) {
    if (ef > totalDuration) {
      totalDuration = ef;
    }
  }

  // ── Backward Pass ───────────────────────────────────────────────────────
  // LF = min(LS of all successors), or totalDuration if no successors
  // LS = LF - duration

  const lateStart = new Map<string, number>();
  const lateFinish = new Map<string, number>();

  // Build successor map for backward traversal
  const successorMap = new Map<string, string[]>();
  for (const item of items) {
    successorMap.set(item.id, []);
  }
  for (const item of items) {
    for (const depId of item.dependsOn) {
      successorMap.get(depId)?.push(item.id);
    }
  }

  // Process in reverse topological order
  const reverseSorted = [...sortedIds].reverse();

  for (const id of reverseSorted) {
    const item = itemMap.get(id)!;
    const effectiveDuration = item.actualDuration ?? item.duration;
    const succs = successorMap.get(id) ?? [];

    let lf = totalDuration;
    for (const succId of succs) {
      const succLs = lateStart.get(succId) ?? totalDuration;
      if (succLs < lf) {
        lf = succLs;
      }
    }

    lateFinish.set(id, lf);
    lateStart.set(id, lf - effectiveDuration);
  }

  // ── Slack & Critical Path ───────────────────────────────────────────────

  const resultItems: CriticalPathItem[] = [];
  const criticalPath: string[] = [];
  let estimatedDelay = 0;
  let totalPlannedDuration = 0;
  let completedDuration = 0;

  for (const id of sortedIds) {
    const item = itemMap.get(id)!;
    const es = earlyStart.get(id) ?? 0;
    const ef = earlyFinish.get(id) ?? 0;
    const ls = lateStart.get(id) ?? 0;
    const lf = lateFinish.get(id) ?? 0;
    const slack = round(ls - es);
    const isCritical = Math.abs(slack) < 0.001; // floating point tolerance

    if (isCritical) {
      criticalPath.push(id);
    }

    // Track delay for completed critical items
    if (isCritical && item.status === 'completed' && item.actualEnd && item.plannedEnd) {
      const actualEndMs = item.actualEnd.getTime();
      const plannedEndMs = item.plannedEnd.getTime();
      const delayHours = (actualEndMs - plannedEndMs) / (1000 * 3600);
      if (delayHours > estimatedDelay) {
        estimatedDelay = delayHours;
      }
    }

    // Track completion
    totalPlannedDuration += item.duration;
    if (item.status === 'completed') {
      completedDuration += item.duration;
    } else if (item.status === 'in_progress' && item.actualDuration) {
      // Partial credit for in-progress items
      completedDuration += Math.min(item.actualDuration, item.duration);
    }

    resultItems.push({
      ...item,
      slack,
      isCritical,
      earlyStart: round(es),
      earlyFinish: round(ef),
      lateStart: round(ls),
      lateFinish: round(lf),
    });
  }

  const completionPercent =
    totalPlannedDuration > 0
      ? round((completedDuration / totalPlannedDuration) * 100)
      : 0;

  return {
    items: resultItems,
    criticalPath,
    totalDuration: round(totalDuration),
    estimatedDelay: round(Math.max(0, estimatedDelay)),
    completionPercent,
  };
}

// ---------------------------------------------------------------------------
// Voyage Milestone Templates
// ---------------------------------------------------------------------------

/**
 * Return a standard set of voyage milestone items for the given voyage type.
 * Durations are in hours and represent typical values; actual durations will
 * vary by vessel, cargo, and port.
 *
 * Supported voyage types:
 *   - 'laden':     Full loading voyage including sea passage
 *   - 'ballast':   Ballast voyage to the load port
 *   - 'discharge': Discharge operation at destination port
 *
 * @param voyageType - One of 'laden', 'ballast', 'discharge'
 * @returns Array of PathItem milestone templates
 */
export function getVoyageMilestoneTemplate(voyageType: string): PathItem[] {
  const type = voyageType.toLowerCase().trim();

  if (type === 'laden') {
    return [
      {
        id: 'arrival_pilot_load',
        name: 'Arrival Pilot Station (Load Port)',
        duration: 2,
        dependsOn: [],
        status: 'pending',
      },
      {
        id: 'nor_tendered_load',
        name: 'NOR Tendered (Load Port)',
        duration: 1,
        dependsOn: ['arrival_pilot_load'],
        status: 'pending',
      },
      {
        id: 'nor_accepted_load',
        name: 'NOR Accepted (Load Port)',
        duration: 4,
        dependsOn: ['nor_tendered_load'],
        status: 'pending',
      },
      {
        id: 'berth_alongside_load',
        name: 'Berth Alongside (Load Port)',
        duration: 6,
        dependsOn: ['nor_accepted_load'],
        status: 'pending',
      },
      {
        id: 'hoses_connected',
        name: 'Hoses Connected / Gear Ready',
        duration: 2,
        dependsOn: ['berth_alongside_load'],
        status: 'pending',
      },
      {
        id: 'loading_commenced',
        name: 'Loading Commenced',
        duration: 1,
        dependsOn: ['hoses_connected'],
        status: 'pending',
      },
      {
        id: 'loading_completed',
        name: 'Loading Completed',
        duration: 36,
        dependsOn: ['loading_commenced'],
        status: 'pending',
      },
      {
        id: 'hoses_disconnected',
        name: 'Hoses Disconnected / Gear Secured',
        duration: 2,
        dependsOn: ['loading_completed'],
        status: 'pending',
      },
      {
        id: 'docs_received',
        name: 'Documents on Board',
        duration: 4,
        dependsOn: ['loading_completed'],
        status: 'pending',
      },
      {
        id: 'departure_pilot_load',
        name: 'Departure Pilot Station (Load Port)',
        duration: 2,
        dependsOn: ['hoses_disconnected', 'docs_received'],
        status: 'pending',
      },
      {
        id: 'sea_passage_laden',
        name: 'Sea Passage (Laden)',
        duration: 240,
        dependsOn: ['departure_pilot_load'],
        status: 'pending',
      },
      {
        id: 'arrival_pilot_discharge',
        name: 'Arrival Pilot Station (Discharge Port)',
        duration: 2,
        dependsOn: ['sea_passage_laden'],
        status: 'pending',
      },
    ];
  }

  if (type === 'ballast') {
    return [
      {
        id: 'departure_pilot_ballast',
        name: 'Departure Pilot Station (Previous Port)',
        duration: 2,
        dependsOn: [],
        status: 'pending',
      },
      {
        id: 'sea_passage_ballast',
        name: 'Sea Passage (Ballast)',
        duration: 192,
        dependsOn: ['departure_pilot_ballast'],
        status: 'pending',
      },
      {
        id: 'arrival_pilot_load',
        name: 'Arrival Pilot Station (Load Port)',
        duration: 2,
        dependsOn: ['sea_passage_ballast'],
        status: 'pending',
      },
      {
        id: 'nor_tendered_load',
        name: 'NOR Tendered (Load Port)',
        duration: 1,
        dependsOn: ['arrival_pilot_load'],
        status: 'pending',
      },
      {
        id: 'nor_accepted_load',
        name: 'NOR Accepted (Load Port)',
        duration: 4,
        dependsOn: ['nor_tendered_load'],
        status: 'pending',
      },
      {
        id: 'anchorage_waiting',
        name: 'Anchorage / Waiting for Berth',
        duration: 12,
        dependsOn: ['nor_accepted_load'],
        status: 'pending',
      },
      {
        id: 'berth_alongside_load',
        name: 'Berth Alongside (Load Port)',
        duration: 3,
        dependsOn: ['anchorage_waiting'],
        status: 'pending',
      },
    ];
  }

  if (type === 'discharge') {
    return [
      {
        id: 'arrival_pilot_discharge',
        name: 'Arrival Pilot Station (Discharge Port)',
        duration: 2,
        dependsOn: [],
        status: 'pending',
      },
      {
        id: 'nor_tendered_discharge',
        name: 'NOR Tendered (Discharge Port)',
        duration: 1,
        dependsOn: ['arrival_pilot_discharge'],
        status: 'pending',
      },
      {
        id: 'nor_accepted_discharge',
        name: 'NOR Accepted (Discharge Port)',
        duration: 4,
        dependsOn: ['nor_tendered_discharge'],
        status: 'pending',
      },
      {
        id: 'berth_alongside_discharge',
        name: 'Berth Alongside (Discharge Port)',
        duration: 6,
        dependsOn: ['nor_accepted_discharge'],
        status: 'pending',
      },
      {
        id: 'hoses_connected_discharge',
        name: 'Hoses Connected / Gear Ready',
        duration: 2,
        dependsOn: ['berth_alongside_discharge'],
        status: 'pending',
      },
      {
        id: 'discharge_commenced',
        name: 'Discharge Commenced',
        duration: 1,
        dependsOn: ['hoses_connected_discharge'],
        status: 'pending',
      },
      {
        id: 'discharge_completed',
        name: 'Discharge Completed',
        duration: 30,
        dependsOn: ['discharge_commenced'],
        status: 'pending',
      },
      {
        id: 'hoses_disconnected_discharge',
        name: 'Hoses Disconnected / Gear Secured',
        duration: 2,
        dependsOn: ['discharge_completed'],
        status: 'pending',
      },
      {
        id: 'tank_inspection',
        name: 'Tank Inspection / Survey',
        duration: 4,
        dependsOn: ['discharge_completed'],
        status: 'pending',
      },
      {
        id: 'departure_pilot_discharge',
        name: 'Departure Pilot Station (Discharge Port)',
        duration: 2,
        dependsOn: ['hoses_disconnected_discharge', 'tank_inspection'],
        status: 'pending',
      },
    ];
  }

  // Unknown type — return an empty template
  return [];
}
