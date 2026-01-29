// Analytics Engine for ankrICD
// Real-time KPIs, dashboard data, reports across all engines

import type { UUID, OperationResult } from '../types/common';
import { getContainerEngine } from '../containers';
import { getRailEngine } from '../rail';
import { getRoadEngine } from '../road';
import { getWaterfrontEngine } from '../waterfront';
import { getEquipmentEngine } from '../equipment';
import { getBillingEngine } from '../billing';
import { getCustomsEngine } from '../customs';

// ============================================================================
// ANALYTICS ENGINE
// ============================================================================

export class AnalyticsEngine {
  private static instance: AnalyticsEngine | null = null;

  // KPI snapshot history
  private kpiHistory: Map<string, KPISnapshot[]> = new Map();
  private alertThresholds: Map<string, AlertThreshold> = new Map();

  private constructor() {}

  static getInstance(): AnalyticsEngine {
    if (!AnalyticsEngine.instance) {
      AnalyticsEngine.instance = new AnalyticsEngine();
    }
    return AnalyticsEngine.instance;
  }

  static resetInstance(): void {
    AnalyticsEngine.instance = null;
  }

  // ============================================================================
  // REAL-TIME KPIs
  // ============================================================================

  /**
   * Get comprehensive terminal KPIs
   * Uses facilityId to pull stats from each engine
   */
  getTerminalKPIs(tenantId: string, facilityId: UUID): TerminalKPIs {
    const containerStats = getContainerEngine().getContainerStats(facilityId);
    const railStats = getRailEngine().getTerminalStats(tenantId);
    const roadStats = getRoadEngine().getStats(tenantId);
    const waterfrontStats = getWaterfrontEngine().getWaterfrontStats(tenantId);
    const equipmentStats = getEquipmentEngine().getFleetStats(tenantId);
    const billingStats = getBillingEngine().getBillingStats(tenantId);
    const customsStats = getCustomsEngine().getCustomsStats(tenantId);

    const kpis: TerminalKPIs = {
      timestamp: new Date(),
      tenantId,
      facilityId,

      // Container KPIs
      containers: {
        totalOnTerminal: containerStats.total,
        totalTEU: containerStats.totalTEU,
        reefer: containerStats.reeferCount,
        reeferPluggedIn: containerStats.reeferPluggedIn,
        hazmat: containerStats.hazmatCount,
        onHold: containerStats.onHoldCount,
        overdue: containerStats.overdueCount,
        byStatus: containerStats.byStatus,
        bySize: containerStats.bySize,
      },

      // Yard KPIs
      yard: {
        occupancyPercent: containerStats.total > 0 ? Math.min(100, containerStats.total) : 0,
        reeferPlugged: containerStats.reeferPluggedIn,
      },

      // Gate KPIs
      gate: {
        appointmentsToday: roadStats.totalAppointments,
        appointmentsCompleted: roadStats.completed,
        appointmentsPending: roadStats.pending,
        noShows: roadStats.noShows,
        onTimePercent: roadStats.onTimePercent,
      },

      // Rail KPIs
      rail: {
        totalTracks: railStats.totalTracks,
        availableTracks: railStats.availableTracks,
        occupiedTracks: railStats.occupiedTracks,
        activeRakes: railStats.activeRakes,
        rakesUnloading: railStats.rakesUnloading,
        rakesLoading: railStats.rakesLoading,
        todayExpectedArrivals: railStats.todayExpectedArrivals,
        todayDepartures: railStats.todayDepartures,
      },

      // Waterfront KPIs
      waterfront: {
        vesselsAlongside: waterfrontStats.vesselsAlongside,
        vesselsAtAnchorage: waterfrontStats.vesselsAtAnchorage,
        totalBerths: waterfrontStats.totalBerths,
        occupiedBerths: waterfrontStats.occupiedBerths,
        cranesWorking: waterfrontStats.workingCranes,
        movesToday: waterfrontStats.totalMovesToday,
      },

      // Equipment KPIs
      equipment: {
        totalFleet: equipmentStats.totalEquipment,
        available: equipmentStats.available,
        inUse: equipmentStats.inUse,
        maintenance: equipmentStats.maintenance,
        breakdown: equipmentStats.breakdown,
        utilizationPercent: equipmentStats.totalEquipment > 0
          ? (equipmentStats.inUse / equipmentStats.totalEquipment) * 100
          : 0,
      },

      // Billing KPIs
      billing: {
        totalOutstanding: billingStats.totalOutstanding,
        totalOverdue: billingStats.totalOverdue,
        invoicesPending: billingStats.pendingInvoices,
        collectionRate: billingStats.collectionRate,
        blockedCustomers: billingStats.blockedCustomers,
      },

      // Customs KPIs
      customs: {
        pendingBOEs: customsStats.pendingBOEs,
        pendingSBs: customsStats.pendingSBs,
        pendingExaminations: customsStats.pendingExaminations,
        clearedBOEs: customsStats.clearedBOEs,
        totalDutyCollected: customsStats.totalDutyCollected,
      },
    };

    // Store snapshot
    this._storeKPISnapshot(tenantId, kpis);

    return kpis;
  }

  /**
   * Get throughput metrics
   */
  getThroughputMetrics(tenantId: string, facilityId: UUID): ThroughputMetrics {
    const railStats = getRailEngine().getTerminalStats(tenantId);
    const roadStats = getRoadEngine().getStats(tenantId);
    const waterfrontStats = getWaterfrontEngine().getWaterfrontStats(tenantId);

    return {
      tenantId,
      facilityId,
      timestamp: new Date(),
      gateAppointmentsCompleted: roadStats.completed,
      gatePickups: roadStats.pickupAppointments,
      gateDeliveries: roadStats.deliveryAppointments,
      railArrivals: railStats.todayExpectedArrivals,
      railDepartures: railStats.todayDepartures,
      activeRakes: railStats.activeRakes,
      vesselMovesToday: waterfrontStats.totalMovesToday,
      vesselsWorking: waterfrontStats.vesselsWorking,
    };
  }

  /**
   * Get dwell time analytics
   */
  getDwellTimeAnalytics(facilityId: UUID): DwellTimeAnalytics {
    const containers = getContainerEngine().getContainersByFacility(facilityId);
    const now = new Date();

    const dwellDays: number[] = [];
    const dwellBuckets = {
      within3: 0,
      within7: 0,
      within14: 0,
      within30: 0,
      over30: 0,
    };

    for (const container of containers) {
      const dwell = Math.ceil(
        (now.getTime() - container.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      dwellDays.push(dwell);

      if (dwell <= 3) dwellBuckets.within3++;
      else if (dwell <= 7) dwellBuckets.within7++;
      else if (dwell <= 14) dwellBuckets.within14++;
      else if (dwell <= 30) dwellBuckets.within30++;
      else dwellBuckets.over30++;
    }

    const avgDwell = dwellDays.length > 0
      ? dwellDays.reduce((a, b) => a + b, 0) / dwellDays.length
      : 0;
    const maxDwell = dwellDays.length > 0 ? Math.max(...dwellDays) : 0;
    const sorted = [...dwellDays].sort((a, b) => a - b);
    const medianDwell = sorted.length > 0 ? (sorted[Math.floor(sorted.length / 2)] ?? 0) : 0;

    return {
      facilityId,
      timestamp: new Date(),
      totalContainers: containers.length,
      averageDwellDays: Math.round(avgDwell * 10) / 10,
      medianDwellDays: medianDwell,
      maxDwellDays: maxDwell,
      distribution: dwellBuckets,
    };
  }

  // ============================================================================
  // DASHBOARD DATA
  // ============================================================================

  /**
   * Get operations dashboard data
   */
  getOperationsDashboard(tenantId: string, facilityId: UUID): OperationsDashboard {
    const kpis = this.getTerminalKPIs(tenantId, facilityId);
    const throughput = this.getThroughputMetrics(tenantId, facilityId);
    const dwellTime = this.getDwellTimeAnalytics(facilityId);

    return {
      kpis,
      throughput,
      dwellTime,
      timestamp: new Date(),
    };
  }

  /**
   * Get module-specific dashboard data
   */
  getModuleDashboard(tenantId: string, facilityId: UUID, module: DashboardModule): ModuleDashboardData {
    const timestamp = new Date();

    switch (module) {
      case 'containers':
        return {
          module,
          timestamp,
          data: getContainerEngine().getContainerStats(facilityId),
        };
      case 'rail':
        return {
          module,
          timestamp,
          data: getRailEngine().getTerminalStats(tenantId),
        };
      case 'road':
        return {
          module,
          timestamp,
          data: getRoadEngine().getStats(tenantId),
        };
      case 'waterfront':
        return {
          module,
          timestamp,
          data: getWaterfrontEngine().getWaterfrontStats(tenantId),
        };
      case 'equipment':
        return {
          module,
          timestamp,
          data: getEquipmentEngine().getFleetStats(tenantId),
        };
      case 'billing':
        return {
          module,
          timestamp,
          data: getBillingEngine().getBillingStats(tenantId),
        };
      case 'customs':
        return {
          module,
          timestamp,
          data: getCustomsEngine().getCustomsStats(tenantId),
        };
      default:
        return { module, timestamp, data: {} };
    }
  }

  // ============================================================================
  // ALERT THRESHOLDS
  // ============================================================================

  /**
   * Configure alert thresholds
   */
  setAlertThreshold(input: SetAlertThresholdInput): OperationResult<AlertThreshold> {
    const threshold: AlertThreshold = {
      id: input.id ?? `${input.tenantId}-${input.metric}`,
      tenantId: input.tenantId,
      metric: input.metric,
      warningValue: input.warningValue,
      criticalValue: input.criticalValue,
      comparison: input.comparison,
      enabled: input.enabled ?? true,
    };

    this.alertThresholds.set(threshold.id, threshold);
    return { success: true, data: threshold };
  }

  /**
   * Check all alert thresholds against current KPIs
   */
  checkAlerts(tenantId: string, facilityId: UUID): AnalyticsAlert[] {
    const kpis = this.getTerminalKPIs(tenantId, facilityId);
    const alerts: AnalyticsAlert[] = [];

    const thresholds = Array.from(this.alertThresholds.values()).filter(
      t => t.tenantId === tenantId && t.enabled
    );

    for (const threshold of thresholds) {
      const value = this._getMetricValue(kpis, threshold.metric);
      if (value === undefined) continue;

      let isWarning = false;
      let isCritical = false;

      if (threshold.comparison === 'above') {
        isWarning = value >= threshold.warningValue;
        isCritical = value >= threshold.criticalValue;
      } else {
        isWarning = value <= threshold.warningValue;
        isCritical = value <= threshold.criticalValue;
      }

      if (isCritical) {
        alerts.push({
          metric: threshold.metric,
          severity: 'critical',
          currentValue: value,
          threshold: threshold.criticalValue,
          message: `${threshold.metric} is ${threshold.comparison === 'above' ? 'above' : 'below'} critical threshold: ${value} (limit: ${threshold.criticalValue})`,
        });
      } else if (isWarning) {
        alerts.push({
          metric: threshold.metric,
          severity: 'warning',
          currentValue: value,
          threshold: threshold.warningValue,
          message: `${threshold.metric} is ${threshold.comparison === 'above' ? 'above' : 'below'} warning threshold: ${value} (limit: ${threshold.warningValue})`,
        });
      }
    }

    return alerts;
  }

  // ============================================================================
  // KPI HISTORY & TRENDS
  // ============================================================================

  /**
   * Get KPI trend over time
   */
  getKPITrend(tenantId: string, metric: string, points?: number): KPITrendPoint[] {
    const history = this.kpiHistory.get(tenantId) ?? [];
    const limited = points ? history.slice(-points) : history;

    return limited.map(snapshot => ({
      timestamp: snapshot.timestamp,
      value: this._getMetricValue(snapshot.kpis, metric) ?? 0,
    }));
  }

  private _storeKPISnapshot(tenantId: string, kpis: TerminalKPIs): void {
    if (!this.kpiHistory.has(tenantId)) {
      this.kpiHistory.set(tenantId, []);
    }

    const history = this.kpiHistory.get(tenantId)!;
    history.push({ timestamp: new Date(), kpis });

    // Keep max 1000 snapshots per tenant
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }
  }

  private _getMetricValue(kpis: TerminalKPIs, metric: string): number | undefined {
    const parts = metric.split('.');
    let current: any = kpis;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return typeof current === 'number' ? current : undefined;
  }

  // ============================================================================
  // REPORTS
  // ============================================================================

  /**
   * Generate daily operations summary
   */
  generateDailyReport(tenantId: string, facilityId: UUID, date?: Date): DailyOperationsReport {
    const reportDate = date ?? new Date();
    const kpis = this.getTerminalKPIs(tenantId, facilityId);
    const throughput = this.getThroughputMetrics(tenantId, facilityId);
    const dwellTime = this.getDwellTimeAnalytics(facilityId);

    return {
      reportDate,
      tenantId,
      facilityId,
      generatedAt: new Date(),
      summary: {
        containersOnTerminal: kpis.containers.totalOnTerminal,
        containersTEU: kpis.containers.totalTEU,
        gateAppointments: throughput.gateAppointmentsCompleted,
        railRakes: kpis.rail.activeRakes,
        vesselMoves: throughput.vesselMovesToday,
        averageDwellDays: dwellTime.averageDwellDays,
        equipmentUtilization: kpis.equipment.utilizationPercent,
      },
      containerSnapshot: kpis.containers,
      yardSnapshot: kpis.yard,
      gateSnapshot: kpis.gate,
      railSnapshot: kpis.rail,
      waterfrontSnapshot: kpis.waterfront,
      equipmentSnapshot: kpis.equipment,
      billingSnapshot: kpis.billing,
      customsSnapshot: kpis.customs,
    };
  }

  /**
   * Generate performance scorecard
   */
  generateScorecard(tenantId: string, facilityId: UUID): PerformanceScorecard {
    const kpis = this.getTerminalKPIs(tenantId, facilityId);

    // Score each dimension (0-100)
    const yardScore = Math.max(0, 100 - kpis.yard.occupancyPercent);
    const gateScore = Math.min(100, kpis.gate.onTimePercent);
    const equipmentScore = kpis.equipment.utilizationPercent;
    const billingScore = kpis.billing.collectionRate;
    const customsScore = kpis.customs.pendingBOEs + kpis.customs.pendingSBs > 0
      ? Math.max(0, 100 - (kpis.customs.pendingExaminations * 10))
      : 100;

    const overall = (yardScore + gateScore + equipmentScore + billingScore + customsScore) / 5;

    return {
      tenantId,
      facilityId,
      timestamp: new Date(),
      overallScore: Math.round(overall),
      dimensions: {
        yardEfficiency: Math.round(yardScore),
        gateTurnaround: Math.round(gateScore),
        equipmentUtilization: Math.round(equipmentScore),
        billingCollection: Math.round(billingScore),
        customsClearance: Math.round(customsScore),
      },
      grade: overall >= 90 ? 'A' : overall >= 80 ? 'B' : overall >= 70 ? 'C' : overall >= 60 ? 'D' : 'F',
    };
  }
}

// ============================================================================
// SINGLETON ACCESS
// ============================================================================

let analyticsEngineInstance: AnalyticsEngine | null = null;

export function getAnalyticsEngine(): AnalyticsEngine {
  if (!analyticsEngineInstance) {
    analyticsEngineInstance = AnalyticsEngine.getInstance();
  }
  return analyticsEngineInstance;
}

export function setAnalyticsEngine(engine: AnalyticsEngine): void {
  analyticsEngineInstance = engine;
}

// ============================================================================
// TYPES
// ============================================================================

export interface TerminalKPIs {
  timestamp: Date;
  tenantId: string;
  facilityId: UUID;

  containers: {
    totalOnTerminal: number;
    totalTEU: number;
    reefer: number;
    reeferPluggedIn: number;
    hazmat: number;
    onHold: number;
    overdue: number;
    byStatus: Record<string, number>;
    bySize: Record<string, number>;
  };

  yard: {
    occupancyPercent: number;
    reeferPlugged: number;
  };

  gate: {
    appointmentsToday: number;
    appointmentsCompleted: number;
    appointmentsPending: number;
    noShows: number;
    onTimePercent: number;
  };

  rail: {
    totalTracks: number;
    availableTracks: number;
    occupiedTracks: number;
    activeRakes: number;
    rakesUnloading: number;
    rakesLoading: number;
    todayExpectedArrivals: number;
    todayDepartures: number;
  };

  waterfront: {
    vesselsAlongside: number;
    vesselsAtAnchorage: number;
    totalBerths: number;
    occupiedBerths: number;
    cranesWorking: number;
    movesToday: number;
  };

  equipment: {
    totalFleet: number;
    available: number;
    inUse: number;
    maintenance: number;
    breakdown: number;
    utilizationPercent: number;
  };

  billing: {
    totalOutstanding: number;
    totalOverdue: number;
    invoicesPending: number;
    collectionRate: number;
    blockedCustomers: number;
  };

  customs: {
    pendingBOEs: number;
    pendingSBs: number;
    pendingExaminations: number;
    clearedBOEs: number;
    totalDutyCollected: number;
  };
}

export interface ThroughputMetrics {
  tenantId: string;
  facilityId: UUID;
  timestamp: Date;
  gateAppointmentsCompleted: number;
  gatePickups: number;
  gateDeliveries: number;
  railArrivals: number;
  railDepartures: number;
  activeRakes: number;
  vesselMovesToday: number;
  vesselsWorking: number;
}

export interface DwellTimeAnalytics {
  facilityId: UUID;
  timestamp: Date;
  totalContainers: number;
  averageDwellDays: number;
  medianDwellDays: number;
  maxDwellDays: number;
  distribution: {
    within3: number;
    within7: number;
    within14: number;
    within30: number;
    over30: number;
  };
}

export interface OperationsDashboard {
  kpis: TerminalKPIs;
  throughput: ThroughputMetrics;
  dwellTime: DwellTimeAnalytics;
  timestamp: Date;
}

export type DashboardModule = 'containers' | 'rail' | 'road' | 'waterfront' | 'equipment' | 'billing' | 'customs';

export interface ModuleDashboardData {
  module: DashboardModule;
  timestamp: Date;
  data: Record<string, any>;
}

export interface AlertThreshold {
  id: string;
  tenantId: string;
  metric: string;
  warningValue: number;
  criticalValue: number;
  comparison: 'above' | 'below';
  enabled: boolean;
}

export interface SetAlertThresholdInput {
  id?: string;
  tenantId: string;
  metric: string;
  warningValue: number;
  criticalValue: number;
  comparison: 'above' | 'below';
  enabled?: boolean;
}

export interface AnalyticsAlert {
  metric: string;
  severity: 'warning' | 'critical';
  currentValue: number;
  threshold: number;
  message: string;
}

export interface KPISnapshot {
  timestamp: Date;
  kpis: TerminalKPIs;
}

export interface KPITrendPoint {
  timestamp: Date;
  value: number;
}

export interface DailyOperationsReport {
  reportDate: Date;
  tenantId: string;
  facilityId: UUID;
  generatedAt: Date;
  summary: {
    containersOnTerminal: number;
    containersTEU: number;
    gateAppointments: number;
    railRakes: number;
    vesselMoves: number;
    averageDwellDays: number;
    equipmentUtilization: number;
  };
  containerSnapshot: TerminalKPIs['containers'];
  yardSnapshot: TerminalKPIs['yard'];
  gateSnapshot: TerminalKPIs['gate'];
  railSnapshot: TerminalKPIs['rail'];
  waterfrontSnapshot: TerminalKPIs['waterfront'];
  equipmentSnapshot: TerminalKPIs['equipment'];
  billingSnapshot: TerminalKPIs['billing'];
  customsSnapshot: TerminalKPIs['customs'];
}

export interface PerformanceScorecard {
  tenantId: string;
  facilityId: UUID;
  timestamp: Date;
  overallScore: number;
  dimensions: {
    yardEfficiency: number;
    gateTurnaround: number;
    equipmentUtilization: number;
    billingCollection: number;
    customsClearance: number;
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}
