/**
 * DA Anomaly Detection Service
 * AI-powered detection of unusual port charges
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

export interface AnomalyAlert {
  id: string;
  fdaId: string;
  lineItemId: string;
  category: string;
  
  // Anomaly details
  actualAmount: number;
  expectedAmount: number;
  variance: number;
  variancePercent: number;
  
  // Detection
  anomalyType: 'OVERCHARGE' | 'UNDERCHARGE' | 'UNUSUAL_ITEM' | 'DUPLICATE';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number; // 0-1
  
  // Context
  portName: string;
  vesselDWT: number;
  historicalAverage: number;
  historicalCount: number;
  
  // Recommendation
  recommendation: string;
  potentialSavings?: number;
  
  createdAt: Date;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
}

export class AnomalyDetectionService {
  /**
   * Detect anomalies in FDA
   */
  async detectAnomalies(
    fdaId: string,
    organizationId: string
  ): Promise<AnomalyAlert[]> {
    const fda = await prisma.disbursementAccount.findFirst({
      where: {
        id: fdaId,
        organizationId,
        type: 'FDA',
      },
      include: {
        lineItems: true,
        portCall: {
          include: {
            port: true,
            vessel: true,
          },
        },
      },
    });

    if (!fda) throw new Error('FDA not found');

    const anomalies: AnomalyAlert[] = [];

    // Check each line item
    for (const item of fda.lineItems) {
      const historical = await this.getHistoricalData(
        item.category,
        fda.portCall.portId,
        fda.portCall.vessel.dwt,
        organizationId
      );

      if (historical.count >= 3) {
        // Enough data for comparison
        const variance = item.amount - historical.average;
        const variancePercent = (variance / historical.average) * 100;

        // Flag if variance > 20% or > $5000
        if (Math.abs(variancePercent) > 20 || Math.abs(variance) > 5000) {
          const anomaly = await this.createAnomaly(
            fda,
            item,
            historical,
            variance,
            variancePercent
          );
          anomalies.push(anomaly);
        }
      }
    }

    // Check for duplicate line items
    const duplicates = this.findDuplicates(fda.lineItems);
    for (const dup of duplicates) {
      anomalies.push({
        id: `dup-${dup.id}`,
        fdaId: fda.id,
        lineItemId: dup.id,
        category: dup.category,
        actualAmount: dup.amount,
        expectedAmount: dup.amount,
        variance: dup.amount,
        variancePercent: 100,
        anomalyType: 'DUPLICATE',
        severity: 'HIGH',
        confidence: 0.95,
        portName: fda.portCall.port.name,
        vesselDWT: fda.portCall.vessel.dwt,
        historicalAverage: 0,
        historicalCount: 0,
        recommendation: 'Possible duplicate charge - verify with agent',
        potentialSavings: dup.amount,
        createdAt: new Date(),
        status: 'OPEN',
      });
    }

    return anomalies;
  }

  /**
   * Get anomaly statistics
   */
  async getAnomalyStats(
    organizationId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    totalAnomalies: number;
    potentialSavings: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    topPorts: Array<{ port: string; count: number }>;
  }> {
    // In production: query anomaly alerts table
    return {
      totalAnomalies: 0,
      potentialSavings: 0,
      byType: {},
      bySeverity: {},
      topPorts: [],
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async getHistoricalData(
    category: string,
    portId: string,
    vesselDWT: number,
    organizationId: string
  ): Promise<{
    average: number;
    count: number;
    stdDev: number;
  }> {
    // Get historical charges for same category/port/size
    const historical = await prisma.fDALineItem.findMany({
      where: {
        category,
        disbursementAccount: {
          organizationId,
          type: 'FDA',
          portCall: {
            portId,
            vessel: {
              dwt: {
                gte: vesselDWT * 0.8,
                lte: vesselDWT * 1.2,
              },
            },
          },
        },
      },
      select: { amount: true },
      take: 50,
    });

    if (historical.length === 0) {
      return { average: 0, count: 0, stdDev: 0 };
    }

    const amounts = historical.map((h) => h.amount);
    const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    return {
      average,
      count: amounts.length,
      stdDev,
    };
  }

  private async createAnomaly(
    fda: any,
    item: any,
    historical: any,
    variance: number,
    variancePercent: number
  ): Promise<AnomalyAlert> {
    const isOvercharge = variance > 0;
    const severity = Math.abs(variancePercent) > 50 ? 'HIGH' : Math.abs(variancePercent) > 30 ? 'MEDIUM' : 'LOW';

    // Calculate confidence based on historical data consistency
    const confidence = Math.min(0.95, 0.5 + (historical.count / 100));

    let recommendation = '';
    if (isOvercharge) {
      recommendation = `Charge is ${Math.abs(variancePercent).toFixed(0)}% higher than historical average. Review with agent.`;
    } else {
      recommendation = `Charge is ${Math.abs(variancePercent).toFixed(0)}% lower than expected. Verify completeness.`;
    }

    // Save alert
    const alert = await prisma.anomalyAlert.create({
      data: {
        fdaId: fda.id,
        lineItemId: item.id,
        category: item.category,
        actualAmount: item.amount,
        expectedAmount: historical.average,
        variance,
        variancePercent,
        anomalyType: isOvercharge ? 'OVERCHARGE' : 'UNDERCHARGE',
        severity,
        confidence,
        recommendation,
        potentialSavings: isOvercharge ? Math.abs(variance) : undefined,
        organizationId: fda.organizationId,
        status: 'OPEN',
      },
    });

    return {
      id: alert.id,
      fdaId: fda.id,
      lineItemId: item.id,
      category: item.category,
      actualAmount: item.amount,
      expectedAmount: historical.average,
      variance,
      variancePercent,
      anomalyType: isOvercharge ? 'OVERCHARGE' : 'UNDERCHARGE',
      severity,
      confidence,
      portName: fda.portCall.port.name,
      vesselDWT: fda.portCall.vessel.dwt,
      historicalAverage: historical.average,
      historicalCount: historical.count,
      recommendation,
      potentialSavings: isOvercharge ? Math.abs(variance) : undefined,
      createdAt: alert.createdAt,
      status: 'OPEN',
    };
  }

  private findDuplicates(lineItems: any[]): any[] {
    const seen = new Map<string, any>();
    const duplicates = [];

    for (const item of lineItems) {
      const key = `${item.category}-${item.amount}`;
      if (seen.has(key)) {
        duplicates.push(item);
      } else {
        seen.set(key, item);
      }
    }

    return duplicates;
  }
}

export const anomalyDetectionService = new AnomalyDetectionService();
