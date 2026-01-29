import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsEngine } from '../analytics/analytics-engine';
import { uuid, TENANT_ID, FACILITY_ID } from './test-utils';

// Mock all dependent engines
vi.mock('../containers', () => ({
  getContainerEngine: () => ({
    getContainerStats: () => ({
      total: 150, totalTEU: 220, reeferCount: 25, reeferPluggedIn: 20,
      hazmatCount: 5, onHoldCount: 8, overdueCount: 3,
      byStatus: { grounded: 100, gated_in: 30, gated_out: 20 },
      bySize: { '20': 50, '40': 80, '45': 20 },
    }),
    getContainersByFacility: () => [
      { id: 'c1', createdAt: new Date(Date.now() - 2 * 86400000), status: 'grounded' },
      { id: 'c2', createdAt: new Date(Date.now() - 10 * 86400000), status: 'grounded' },
    ],
  }),
}));

vi.mock('../rail', () => ({
  getRailEngine: () => ({
    getTerminalStats: () => ({
      announcedRakes: 2, arrivedRakes: 1, tracksOccupied: 3, totalTracks: 8,
      pendingLoad: 50, pendingUnload: 30,
    }),
  }),
}));

vi.mock('../road', () => ({
  getRoadEngine: () => ({
    getStats: () => ({
      totalAppointments: 40, arrivedToday: 25, pendingToday: 15,
      averageTurnaround: 45,
    }),
  }),
}));

vi.mock('../waterfront', () => ({
  getWaterfrontEngine: () => ({
    getWaterfrontStats: () => ({
      vesselsAtBerth: 2, vesselsAnnounced: 1,
      totalDischarge: 500, totalLoad: 400,
      dischargeDone: 300, loadDone: 250,
      craneMoves: 550,
    }),
  }),
}));

vi.mock('../equipment', () => ({
  getEquipmentEngine: () => ({
    getFleetStats: () => ({
      total: 30, available: 20, inUse: 8, maintenance: 2,
      byType: { rtg_crane: 10, reach_stacker: 8, forklift: 12 },
    }),
  }),
}));

vi.mock('../billing', () => ({
  getBillingEngine: () => ({
    getBillingStats: () => ({
      totalInvoices: 200, pendingPayment: 50, totalRevenue: 5000000,
      outstandingAmount: 1200000,
    }),
  }),
}));

vi.mock('../customs', () => ({
  getCustomsEngine: () => ({
    getCustomsStats: () => ({
      pendingBOE: 10, pendingShippingBills: 5,
      examinationsOrdered: 3, clearanceRate: 95,
    }),
  }),
}));

describe('AnalyticsEngine', () => {
  let engine: AnalyticsEngine;

  beforeEach(() => {
    AnalyticsEngine.resetInstance();
    engine = AnalyticsEngine.getInstance();
  });

  // =========================================================================
  // SINGLETON
  // =========================================================================

  describe('Singleton pattern', () => {
    it('returns same instance on multiple calls', () => {
      const a = AnalyticsEngine.getInstance();
      const b = AnalyticsEngine.getInstance();
      expect(a).toBe(b);
    });

    it('creates new instance after reset', () => {
      const a = AnalyticsEngine.getInstance();
      AnalyticsEngine.resetInstance();
      const b = AnalyticsEngine.getInstance();
      expect(a).not.toBe(b);
    });
  });

  // =========================================================================
  // TERMINAL KPIs
  // =========================================================================

  describe('Terminal KPIs', () => {
    it('returns comprehensive KPIs', () => {
      const kpis = engine.getTerminalKPIs(TENANT_ID, FACILITY_ID);
      expect(kpis).toBeDefined();
      expect(kpis.tenantId).toBe(TENANT_ID);
      expect(kpis.facilityId).toBe(FACILITY_ID);
      expect(kpis.timestamp).toBeDefined();
    });

    it('includes container KPIs', () => {
      const kpis = engine.getTerminalKPIs(TENANT_ID, FACILITY_ID);
      expect(kpis.containers.totalOnTerminal).toBe(150);
      expect(kpis.containers.totalTEU).toBe(220);
      expect(kpis.containers.reefer).toBe(25);
    });

    it('includes gate KPIs from road stats', () => {
      const kpis = engine.getTerminalKPIs(TENANT_ID, FACILITY_ID);
      expect(kpis.gate).toBeDefined();
      expect(kpis.gate.appointmentsToday).toBe(40);
    });
  });

  // =========================================================================
  // THROUGHPUT METRICS
  // =========================================================================

  describe('Throughput metrics', () => {
    it('returns throughput data', () => {
      const metrics = engine.getThroughputMetrics(TENANT_ID, FACILITY_ID);
      expect(metrics).toBeDefined();
    });
  });

  // =========================================================================
  // DWELL TIME ANALYTICS
  // =========================================================================

  describe('Dwell time analytics', () => {
    it('returns dwell time data', () => {
      const dwell = engine.getDwellTimeAnalytics(FACILITY_ID);
      expect(dwell).toBeDefined();
    });
  });

  // =========================================================================
  // OPERATIONS DASHBOARD
  // =========================================================================

  describe('Operations dashboard', () => {
    it('returns dashboard data', () => {
      const dashboard = engine.getOperationsDashboard(TENANT_ID, FACILITY_ID);
      expect(dashboard).toBeDefined();
    });
  });

  // =========================================================================
  // MODULE DASHBOARD
  // =========================================================================

  describe('Module dashboard', () => {
    it('returns container module data', () => {
      const data = engine.getModuleDashboard(TENANT_ID, FACILITY_ID, 'containers');
      expect(data).toBeDefined();
    });

    it('returns rail module data', () => {
      const data = engine.getModuleDashboard(TENANT_ID, FACILITY_ID, 'rail');
      expect(data).toBeDefined();
    });

    it('returns road module data', () => {
      const data = engine.getModuleDashboard(TENANT_ID, FACILITY_ID, 'road');
      expect(data).toBeDefined();
    });

    it('returns waterfront module data', () => {
      const data = engine.getModuleDashboard(TENANT_ID, FACILITY_ID, 'waterfront');
      expect(data).toBeDefined();
    });

    it('returns equipment module data', () => {
      const data = engine.getModuleDashboard(TENANT_ID, FACILITY_ID, 'equipment');
      expect(data).toBeDefined();
    });

    it('returns billing module data', () => {
      const data = engine.getModuleDashboard(TENANT_ID, FACILITY_ID, 'billing');
      expect(data).toBeDefined();
    });

    it('returns customs module data', () => {
      const data = engine.getModuleDashboard(TENANT_ID, FACILITY_ID, 'customs');
      expect(data).toBeDefined();
    });
  });

  // =========================================================================
  // ALERT THRESHOLDS
  // =========================================================================

  describe('Alert thresholds', () => {
    it('sets an alert threshold', () => {
      const res = engine.setAlertThreshold({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        metric: 'yard_occupancy',
        warningThreshold: 80,
        criticalThreshold: 95,
      });
      expect(res.success).toBe(true);
      expect(res.data!.metric).toBe('yard_occupancy');
    });

    it('checks alerts against thresholds', () => {
      engine.setAlertThreshold({
        tenantId: TENANT_ID,
        facilityId: FACILITY_ID,
        metric: 'yard_occupancy',
        warningThreshold: 80,
        criticalThreshold: 95,
      });
      const alerts = engine.checkAlerts(TENANT_ID, FACILITY_ID);
      expect(Array.isArray(alerts)).toBe(true);
    });
  });

  // =========================================================================
  // KPI TRENDS
  // =========================================================================

  describe('KPI trends', () => {
    it('returns trend data points', () => {
      const trend = engine.getKPITrend(TENANT_ID, 'container_count', 10);
      expect(Array.isArray(trend)).toBe(true);
    });
  });

  // =========================================================================
  // REPORTS
  // =========================================================================

  describe('Reports', () => {
    it('generates a daily operations report', () => {
      const report = engine.generateDailyReport(TENANT_ID, FACILITY_ID);
      expect(report).toBeDefined();
    });

    it('generates a performance scorecard', () => {
      const scorecard = engine.generateScorecard(TENANT_ID, FACILITY_ID);
      expect(scorecard).toBeDefined();
    });
  });
});
