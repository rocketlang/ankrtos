// ─── Maritime Analytics Engine ─────────────────────────────────────────────────
// Pure functions: no DB access, no Prisma imports.
// Takes input data arrays and returns computed analytics results.

// ─── Input Types (simple objects mimicking DB rows) ───────────────────────────

export interface EnquiryInput {
  id: string;
  status: string; // open, working, fixed, failed, withdrawn
  createdAt: string;
  fixedAt?: string;
  estimatedValue?: number;
}

export interface FixtureInput {
  id: string;
  status: string;
  freightRate: number;
  cargoQuantity: number;
  currency: string;
  commission?: number;
  fixedDate?: string;
}

export interface VoyageInput {
  id: string;
  status: string;
  revenue?: number;
}

export interface RatingInput {
  companyId: string;
  companyName: string;
  portId?: string;
  category: string;
  score: number;
  ratedAt: string;
}

// ─── Output Types ─────────────────────────────────────────────────────────────

export interface PipelineStage {
  stage: string;
  count: number;
  value: number;
  conversionRate: number;
}

export interface PipelineAnalysis {
  stages: PipelineStage[];
  totalEnquiries: number;
  totalFixtures: number;
  totalRevenue: number;
  overallConversion: number;
  avgDaysToFix: number;
}

export interface CommissionEntry {
  charterId: string;
  charterNumber?: string;
  freightRate: number;
  cargoQuantity: number;
  commissionPercent: number;
  commissionAmount: number;
  currency: string;
}

export interface CommissionSummary {
  entries: CommissionEntry[];
  totalCommission: number;
  avgCommissionPercent: number;
  currency: string;
}

export interface PortTimeEntry {
  voyageId: string;
  portName: string;
  purpose: string; // loading, discharging
  waitingDays: number;
  operatingDays: number;
  totalDays: number;
}

export interface PortTimeAnalysis {
  entries: PortTimeEntry[];
  avgWaitingDays: number;
  avgOperatingDays: number;
  avgTotalDays: number;
  worstPort: string;
  bestPort: string;
}

export interface VendorBenchmark {
  companyId: string;
  companyName: string;
  avgScore: number;
  totalRatings: number;
  recentTrend: string; // improving, declining, stable
  categoryScores: Record<string, number>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  if (isNaN(a) || isNaN(b)) return 0;
  return Math.abs(b - a) / (1000 * 60 * 60 * 24);
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ─── calculatePipelineAnalysis ────────────────────────────────────────────────

export function calculatePipelineAnalysis(
  enquiries: EnquiryInput[],
  fixtures: FixtureInput[],
  voyages: VoyageInput[],
): PipelineAnalysis {
  // Stage counts
  const allEnquiries = enquiries.length;
  const workingEnquiries = enquiries.filter(
    (e) => e.status === 'working',
  );
  const fixedEnquiries = enquiries.filter((e) => e.status === 'fixed');
  const executingVoyages = voyages.filter(
    (v) => v.status === 'in_progress',
  );
  const completedVoyages = voyages.filter(
    (v) => v.status === 'completed',
  );

  // Values per stage
  const enquiryValue = enquiries.reduce(
    (sum, e) => sum + (e.estimatedValue ?? 0),
    0,
  );
  const workingValue = workingEnquiries.reduce(
    (sum, e) => sum + (e.estimatedValue ?? 0),
    0,
  );
  const fixedValue = fixtures.reduce(
    (sum, f) => sum + f.freightRate * f.cargoQuantity,
    0,
  );
  const executingRevenue = executingVoyages.reduce(
    (sum, v) => sum + (v.revenue ?? 0),
    0,
  );
  const completedRevenue = completedVoyages.reduce(
    (sum, v) => sum + (v.revenue ?? 0),
    0,
  );

  // Conversion rates (percentage of the previous stage)
  const workingConversion =
    allEnquiries > 0
      ? round2((workingEnquiries.length / allEnquiries) * 100)
      : 0;

  const fixedConversion =
    workingEnquiries.length > 0
      ? round2((fixedEnquiries.length / workingEnquiries.length) * 100)
      : allEnquiries > 0
        ? round2((fixedEnquiries.length / allEnquiries) * 100)
        : 0;

  const executingConversion =
    fixedEnquiries.length > 0
      ? round2((executingVoyages.length / fixedEnquiries.length) * 100)
      : 0;

  const completedConversion =
    executingVoyages.length > 0
      ? round2((completedVoyages.length / executingVoyages.length) * 100)
      : 0;

  const stages: PipelineStage[] = [
    {
      stage: 'enquiry',
      count: allEnquiries,
      value: round2(enquiryValue),
      conversionRate: 100, // base stage
    },
    {
      stage: 'working',
      count: workingEnquiries.length,
      value: round2(workingValue),
      conversionRate: workingConversion,
    },
    {
      stage: 'fixed',
      count: fixedEnquiries.length,
      value: round2(fixedValue),
      conversionRate: fixedConversion,
    },
    {
      stage: 'executing',
      count: executingVoyages.length,
      value: round2(executingRevenue),
      conversionRate: executingConversion,
    },
    {
      stage: 'completed',
      count: completedVoyages.length,
      value: round2(completedRevenue),
      conversionRate: completedConversion,
    },
  ];

  // Total revenue from all fixtures
  const totalRevenue = round2(fixedValue);

  // Overall conversion: enquiry -> fixed
  const overallConversion =
    allEnquiries > 0
      ? round2((fixedEnquiries.length / allEnquiries) * 100)
      : 0;

  // Average days to fix (only enquiries that reached fixed status)
  const fixedWithDates = enquiries.filter(
    (e) => e.status === 'fixed' && e.createdAt && e.fixedAt,
  );
  const daysToFixValues = fixedWithDates.map((e) =>
    daysBetween(e.createdAt, e.fixedAt!),
  );
  const avgDaysToFix = round2(avg(daysToFixValues));

  return {
    stages,
    totalEnquiries: allEnquiries,
    totalFixtures: fixtures.length,
    totalRevenue,
    overallConversion,
    avgDaysToFix,
  };
}

// ─── calculateCommissionIncome ────────────────────────────────────────────────

export function calculateCommissionIncome(
  charters: FixtureInput[],
): CommissionSummary {
  const entries: CommissionEntry[] = [];
  let totalCommission = 0;
  const commissionPercents: number[] = [];

  // Determine dominant currency (most frequent)
  const currencyCounts: Record<string, number> = {};
  for (const c of charters) {
    currencyCounts[c.currency] = (currencyCounts[c.currency] ?? 0) + 1;
  }
  const dominantCurrency =
    Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    'USD';

  for (const charter of charters) {
    const pct = charter.commission ?? 0;
    if (pct <= 0) continue;

    const amount = round2(
      charter.freightRate * charter.cargoQuantity * (pct / 100),
    );

    entries.push({
      charterId: charter.id,
      charterNumber: undefined,
      freightRate: charter.freightRate,
      cargoQuantity: charter.cargoQuantity,
      commissionPercent: pct,
      commissionAmount: amount,
      currency: charter.currency,
    });

    totalCommission += amount;
    commissionPercents.push(pct);
  }

  return {
    entries,
    totalCommission: round2(totalCommission),
    avgCommissionPercent: round2(avg(commissionPercents)),
    currency: dominantCurrency,
  };
}

// ─── calculatePortTimeAnalysis ────────────────────────────────────────────────

export function calculatePortTimeAnalysis(
  portTimes: PortTimeEntry[],
): PortTimeAnalysis {
  if (portTimes.length === 0) {
    return {
      entries: [],
      avgWaitingDays: 0,
      avgOperatingDays: 0,
      avgTotalDays: 0,
      worstPort: 'N/A',
      bestPort: 'N/A',
    };
  }

  const avgWaitingDays = round2(avg(portTimes.map((p) => p.waitingDays)));
  const avgOperatingDays = round2(
    avg(portTimes.map((p) => p.operatingDays)),
  );
  const avgTotalDays = round2(avg(portTimes.map((p) => p.totalDays)));

  // Aggregate total days per port name
  const portTotals: Record<string, { totalDays: number; count: number }> =
    {};
  for (const pt of portTimes) {
    if (!portTotals[pt.portName]) {
      portTotals[pt.portName] = { totalDays: 0, count: 0 };
    }
    portTotals[pt.portName].totalDays += pt.totalDays;
    portTotals[pt.portName].count += 1;
  }

  // Average total days per port
  const portAvgs = Object.entries(portTotals).map(([name, data]) => ({
    name,
    avg: data.totalDays / data.count,
  }));

  portAvgs.sort((a, b) => a.avg - b.avg);

  const bestPort = portAvgs[0]?.name ?? 'N/A';
  const worstPort = portAvgs[portAvgs.length - 1]?.name ?? 'N/A';

  return {
    entries: portTimes,
    avgWaitingDays,
    avgOperatingDays,
    avgTotalDays,
    worstPort,
    bestPort,
  };
}

// ─── calculateVendorBenchmark ─────────────────────────────────────────────────

export function calculateVendorBenchmark(
  ratings: RatingInput[],
): VendorBenchmark[] {
  if (ratings.length === 0) return [];

  // Group by companyId
  const grouped: Record<
    string,
    { companyName: string; ratings: RatingInput[] }
  > = {};

  for (const r of ratings) {
    if (!grouped[r.companyId]) {
      grouped[r.companyId] = { companyName: r.companyName, ratings: [] };
    }
    grouped[r.companyId].ratings.push(r);
  }

  const benchmarks: VendorBenchmark[] = [];

  for (const [companyId, data] of Object.entries(grouped)) {
    const companyRatings = data.ratings;
    const totalRatings = companyRatings.length;
    const avgScore = round2(avg(companyRatings.map((r) => r.score)));

    // Category breakdown: average score per category
    const catGroups: Record<string, number[]> = {};
    for (const r of companyRatings) {
      if (!catGroups[r.category]) {
        catGroups[r.category] = [];
      }
      catGroups[r.category].push(r.score);
    }
    const categoryScores: Record<string, number> = {};
    for (const [cat, scores] of Object.entries(catGroups)) {
      categoryScores[cat] = round2(avg(scores));
    }

    // Recent trend: compare last 3 ratings vs previous 3
    const sorted = [...companyRatings].sort(
      (a, b) =>
        new Date(a.ratedAt).getTime() - new Date(b.ratedAt).getTime(),
    );

    let recentTrend: string;
    if (sorted.length < 4) {
      // Not enough data to determine trend
      recentTrend = 'stable';
    } else {
      const recentSlice = sorted.slice(-3);
      const previousSlice = sorted.slice(-6, -3);

      if (previousSlice.length === 0) {
        recentTrend = 'stable';
      } else {
        const recentAvg = avg(recentSlice.map((r) => r.score));
        const previousAvg = avg(previousSlice.map((r) => r.score));
        const diff = recentAvg - previousAvg;

        if (diff > 0.25) {
          recentTrend = 'improving';
        } else if (diff < -0.25) {
          recentTrend = 'declining';
        } else {
          recentTrend = 'stable';
        }
      }
    }

    benchmarks.push({
      companyId,
      companyName: data.companyName,
      avgScore,
      totalRatings,
      recentTrend,
      categoryScores,
    });
  }

  // Sort by avgScore descending
  benchmarks.sort((a, b) => b.avgScore - a.avgScore);

  return benchmarks;
}
