/**
 * COA Performance KPI Service
 * Track Contract of Affreightment performance metrics
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface COAPerformanceReport {
  coaId: string;
  contractPeriod: { start: Date; end: Date };

  // Volume metrics
  volumeContracted: number;
  volumeDelivered: number;
  volumeRemaining: number;
  volumeCompliancePercent: number; // % of contracted volume delivered

  // Timing metrics
  totalShipments: number;
  onTimeShipments: number;
  lateShipments: number;
  onTimePercent: number;
  avgDelayDays: number;

  // Cost metrics
  contractRate: number;
  avgActualRate: number;
  costVariance: number;
  costPerTon: number;

  // Quality metrics
  qualityComplaint: number;
  claimsCount: number;
  claimsAmount: number;

  // Overall score
  complianceScore: number; // 0-100
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendations: string[];
}

export interface ShipmentPerformance {
  shipmentId: string;
  vesselName: string;
  loadDate: Date;
  dischargeDate: Date;
  quantity: number;
  onTime: boolean;
  delayDays: number;
  freightRate: number;
  issues: string[];
}

export class COAPerformanceService {
  /**
   * Generate comprehensive performance report for a COA
   */
  async generatePerformanceReport(
    coaId: string,
    organizationId: string
  ): Promise<COAPerformanceReport> {
    const coa = await prisma.contractOfAffreightment.findFirst({
      where: {
        id: coaId,
        organizationId,
      },
      include: {
        shipments: {
          include: {
            vessel: true,
            cargo: true,
          },
        },
      },
    });

    if (!coa) {
      throw new Error('COA not found');
    }

    // Calculate volume metrics
    const volumeMetrics = this.calculateVolumeMetrics(coa);

    // Calculate timing metrics
    const timingMetrics = this.calculateTimingMetrics(coa);

    // Calculate cost metrics
    const costMetrics = this.calculateCostMetrics(coa);

    // Calculate quality metrics
    const qualityMetrics = await this.calculateQualityMetrics(coa);

    // Calculate overall compliance score
    const complianceScore = this.calculateComplianceScore({
      ...volumeMetrics,
      ...timingMetrics,
      ...costMetrics,
      ...qualityMetrics,
    });

    // Determine performance grade
    const performanceGrade = this.gradePerformance(complianceScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      ...volumeMetrics,
      ...timingMetrics,
      ...costMetrics,
      ...qualityMetrics,
      complianceScore,
    });

    return {
      coaId,
      contractPeriod: {
        start: coa.startDate,
        end: coa.endDate,
      },
      ...volumeMetrics,
      ...timingMetrics,
      ...costMetrics,
      ...qualityMetrics,
      complianceScore,
      performanceGrade,
      recommendations,
    };
  }

  /**
   * Get shipment-level performance details
   */
  async getShipmentPerformance(
    coaId: string,
    organizationId: string
  ): Promise<ShipmentPerformance[]> {
    const shipments = await prisma.coaShipment.findMany({
      where: {
        coaId,
        coa: {
          organizationId,
        },
      },
      include: {
        vessel: true,
        cargo: true,
      },
      orderBy: {
        nominatedDate: 'asc',
      },
    });

    return shipments.map((shipment) => {
      const expectedDate = new Date(shipment.nominatedDate);
      const actualDate = shipment.actualLoadDate || new Date();
      const delayDays = Math.max(
        0,
        Math.floor((actualDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24))
      );
      const onTime = delayDays <= 2; // 2-day tolerance

      return {
        shipmentId: shipment.id,
        vesselName: shipment.vessel.name,
        loadDate: shipment.actualLoadDate || shipment.nominatedDate,
        dischargeDate: shipment.actualDischargeDate || new Date(),
        quantity: shipment.quantity,
        onTime,
        delayDays,
        freightRate: shipment.freightRate,
        issues: shipment.issues || [],
      };
    });
  }

  /**
   * Compare multiple COAs
   */
  async compareCOAs(
    coaIds: string[],
    organizationId: string
  ): Promise<{ coaId: string; coaName: string; performance: COAPerformanceReport }[]> {
    const comparisons = [];

    for (const coaId of coaIds) {
      const coa = await prisma.contractOfAffreightment.findFirst({
        where: { id: coaId, organizationId },
      });

      if (coa) {
        const performance = await this.generatePerformanceReport(coaId, organizationId);
        comparisons.push({
          coaId,
          coaName: coa.name || `COA-${coa.id.slice(0, 8)}`,
          performance,
        });
      }
    }

    return comparisons;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private calculateVolumeMetrics(coa: any) {
    const volumeContracted = coa.totalQuantity;
    const volumeDelivered = coa.shipments.reduce(
      (sum: number, s: any) => sum + (s.quantity || 0),
      0
    );
    const volumeRemaining = Math.max(0, volumeContracted - volumeDelivered);
    const volumeCompliancePercent = (volumeDelivered / volumeContracted) * 100;

    return {
      volumeContracted,
      volumeDelivered,
      volumeRemaining,
      volumeCompliancePercent,
    };
  }

  private calculateTimingMetrics(coa: any) {
    const shipments = coa.shipments;
    const totalShipments = shipments.length;

    let onTimeShipments = 0;
    let totalDelayDays = 0;

    shipments.forEach((shipment: any) => {
      if (shipment.nominatedDate && shipment.actualLoadDate) {
        const expected = new Date(shipment.nominatedDate);
        const actual = new Date(shipment.actualLoadDate);
        const delayDays = Math.max(
          0,
          Math.floor((actual.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24))
        );

        totalDelayDays += delayDays;
        if (delayDays <= 2) onTimeShipments++;
      }
    });

    const lateShipments = totalShipments - onTimeShipments;
    const onTimePercent = totalShipments > 0 ? (onTimeShipments / totalShipments) * 100 : 0;
    const avgDelayDays = totalShipments > 0 ? totalDelayDays / totalShipments : 0;

    return {
      totalShipments,
      onTimeShipments,
      lateShipments,
      onTimePercent,
      avgDelayDays,
    };
  }

  private calculateCostMetrics(coa: any) {
    const contractRate = coa.contractRate || 0;

    const shipments = coa.shipments.filter((s: any) => s.freightRate);
    const avgActualRate =
      shipments.length > 0
        ? shipments.reduce((sum: number, s: any) => sum + s.freightRate, 0) / shipments.length
        : contractRate;

    const costVariance = avgActualRate - contractRate;

    const totalQuantity = coa.shipments.reduce(
      (sum: number, s: any) => sum + (s.quantity || 0),
      0
    );
    const totalCost = totalQuantity * avgActualRate;
    const costPerTon = totalQuantity > 0 ? totalCost / totalQuantity : avgActualRate;

    return {
      contractRate,
      avgActualRate,
      costVariance,
      costPerTon,
    };
  }

  private async calculateQualityMetrics(coa: any) {
    // Count quality complaints and claims
    const claims = await prisma.claim.findMany({
      where: {
        coaId: coa.id,
      },
    });

    const qualityComplaints = claims.filter(
      (c) => c.type === 'QUALITY' || c.type === 'SHORTAGE'
    );

    return {
      qualityComplaint: qualityComplaints.length,
      claimsCount: claims.length,
      claimsAmount: claims.reduce((sum, c) => sum + (c.amount || 0), 0),
    };
  }

  private calculateComplianceScore(metrics: any): number {
    let score = 100;

    // Volume compliance (30% weight)
    const volumePenalty = Math.max(0, 100 - metrics.volumeCompliancePercent);
    score -= volumePenalty * 0.3;

    // On-time performance (30% weight)
    const timingPenalty = Math.max(0, 100 - metrics.onTimePercent);
    score -= timingPenalty * 0.3;

    // Cost control (20% weight)
    if (metrics.costVariance > 0) {
      const costOverrunPercent = (metrics.costVariance / metrics.contractRate) * 100;
      score -= Math.min(20, costOverrunPercent * 0.2);
    }

    // Quality (20% weight)
    if (metrics.qualityComplaint > 0) {
      score -= Math.min(20, metrics.qualityComplaint * 5);
    }

    return Math.max(0, Math.round(score));
  }

  private gradePerformance(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private generateRecommendations(metrics: any): string[] {
    const recs: string[] = [];

    if (metrics.volumeCompliancePercent < 90) {
      recs.push('Volume shortfall detected - accelerate remaining nominations');
    }

    if (metrics.onTimePercent < 80) {
      recs.push('Late shipments impacting performance - review vessel scheduling');
    }

    if (metrics.avgDelayDays > 5) {
      recs.push(`Average delay of ${metrics.avgDelayDays.toFixed(1)} days - improve coordination`);
    }

    if (metrics.costVariance > 0) {
      const overrunPercent = ((metrics.costVariance / metrics.contractRate) * 100).toFixed(1);
      recs.push(`Cost overrun of ${overrunPercent}% - review pricing structure`);
    }

    if (metrics.qualityComplaint > 2) {
      recs.push('Multiple quality complaints - tighten QC procedures');
    }

    if (metrics.complianceScore >= 90) {
      recs.push('Excellent performance - maintain current standards');
    }

    return recs;
  }
}

export const coaPerformanceService = new COAPerformanceService();
