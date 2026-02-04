/**
 * Tariff Change Alerts Service
 * Phase 6: DA Desk & Port Agency
 *
 * Features:
 * - Real-time tariff change notifications
 * - Price increase/decrease alerts
 * - Impact analysis on active voyages
 * - Cost trend monitoring
 * - Configurable alert thresholds
 */

import { prisma } from '../lib/prisma.js';

export interface TariffChangeAlert {
  id: string;
  portId: string;
  portName: string;
  serviceType: string;
  changeType: 'price_increase' | 'price_decrease' | 'new_service' | 'service_removed';
  oldAmount?: number;
  newAmount: number;
  changePercent: number;
  changeAmount: number;
  currency: string;
  effectiveDate: Date;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  affectedVoyages: number;
  estimatedImpact: number;
  notificationsSent: number;
  createdAt: Date;
}

export interface ImpactAnalysis {
  totalVoyagesAffected: number;
  totalCostImpact: number;
  byVoyage: {
    voyageId: string;
    vesselName: string;
    estimatedCostChange: number;
    percentChange: number;
  }[];
  byServiceType: {
    serviceType: string;
    voyagesAffected: number;
    totalImpact: number;
  }[];
}

export interface AlertSubscription {
  userId: string;
  portIds: string[];
  serviceTypes: string[];
  minChangePercent: number;
  notifyOnIncrease: boolean;
  notifyOnDecrease: boolean;
  notifyOnNewServices: boolean;
}

class TariffChangeAlertsService {
  /**
   * Detect and create alerts for tariff changes
   */
  async detectChanges(
    portId: string,
    oldTariffs: any[],
    newTariffs: any[]
  ): Promise<TariffChangeAlert[]> {
    const alerts: TariffChangeAlert[] = [];

    // Create maps for quick lookup
    const oldMap = new Map(oldTariffs.map((t) => [t.serviceType, t]));
    const newMap = new Map(newTariffs.map((t) => [t.serviceType, t]));

    // Detect price changes
    for (const [serviceType, newTariff] of newMap.entries()) {
      const oldTariff = oldMap.get(serviceType);

      if (!oldTariff) {
        // New service added
        const alert = await this.createAlert({
          portId,
          portName: 'Port Name', // Would fetch from DB
          serviceType,
          changeType: 'new_service',
          newAmount: newTariff.amount,
          changePercent: 0,
          changeAmount: 0,
          currency: newTariff.currency,
          effectiveDate: newTariff.effectiveDate,
        });
        alerts.push(alert);
      } else if (oldTariff.amount !== newTariff.amount) {
        // Price changed
        const changeAmount = newTariff.amount - oldTariff.amount;
        const changePercent = ((changeAmount / oldTariff.amount) * 100);

        const alert = await this.createAlert({
          portId,
          portName: 'Port Name',
          serviceType,
          changeType: changeAmount > 0 ? 'price_increase' : 'price_decrease',
          oldAmount: oldTariff.amount,
          newAmount: newTariff.amount,
          changePercent: Math.abs(changePercent),
          changeAmount: Math.abs(changeAmount),
          currency: newTariff.currency,
          effectiveDate: newTariff.effectiveDate,
        });
        alerts.push(alert);
      }
    }

    // Detect removed services
    for (const [serviceType, oldTariff] of oldMap.entries()) {
      if (!newMap.has(serviceType)) {
        const alert = await this.createAlert({
          portId,
          portName: 'Port Name',
          serviceType,
          changeType: 'service_removed',
          oldAmount: oldTariff.amount,
          newAmount: 0,
          changePercent: 100,
          changeAmount: oldTariff.amount,
          currency: oldTariff.currency,
          effectiveDate: new Date(),
        });
        alerts.push(alert);
      }
    }

    return alerts;
  }

  /**
   * Create tariff change alert
   */
  private async createAlert(data: {
    portId: string;
    portName: string;
    serviceType: string;
    changeType: string;
    oldAmount?: number;
    newAmount: number;
    changePercent: number;
    changeAmount: number;
    currency: string;
    effectiveDate: Date;
  }): Promise<TariffChangeAlert> {
    // Calculate severity
    const severity = this.calculateSeverity(data.changePercent, data.changeType);

    // Analyze impact on active voyages
    const impact = await this.analyzeImpact(data.portId, data.serviceType, data.changeAmount);

    const alert: TariffChangeAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      portId: data.portId,
      portName: data.portName,
      serviceType: data.serviceType,
      changeType: data.changeType as any,
      oldAmount: data.oldAmount,
      newAmount: data.newAmount,
      changePercent: data.changePercent,
      changeAmount: data.changeAmount,
      currency: data.currency,
      effectiveDate: data.effectiveDate,
      severity,
      affectedVoyages: impact.totalVoyagesAffected,
      estimatedImpact: impact.totalCostImpact,
      notificationsSent: 0,
      createdAt: new Date(),
    };

    // In production: Store in database
    // await prisma.tariffChangeAlert.create({ data: alert });

    // Send notifications if severity is high
    if (severity === 'high' || severity === 'critical') {
      await this.sendAlertNotifications(alert);
      alert.notificationsSent++;
    }

    return alert;
  }

  /**
   * Calculate alert severity based on change percent and type
   */
  private calculateSeverity(
    changePercent: number,
    changeType: string
  ): 'info' | 'low' | 'medium' | 'high' | 'critical' {
    if (changeType === 'service_removed') return 'high';
    if (changeType === 'new_service') return 'info';

    // For price changes
    if (changePercent >= 50) return 'critical';
    if (changePercent >= 25) return 'high';
    if (changePercent >= 10) return 'medium';
    if (changePercent >= 5) return 'low';
    return 'info';
  }

  /**
   * Analyze impact on active/planned voyages
   */
  async analyzeImpact(
    portId: string,
    serviceType: string,
    changeAmount: number
  ): Promise<ImpactAnalysis> {
    // In production: Query active voyages calling this port
    // const voyages = await prisma.voyage.findMany({
    //   where: {
    //     portCalls: { some: { portId } },
    //     status: { in: ['planned', 'in_progress'] },
    //   },
    //   include: { vessel: true },
    // });

    // Simulated impact analysis
    const byVoyage = [
      {
        voyageId: 'voyage-123',
        vesselName: 'MV Example',
        estimatedCostChange: changeAmount,
        percentChange: 15.5,
      },
      {
        voyageId: 'voyage-456',
        vesselName: 'MV Another',
        estimatedCostChange: changeAmount,
        percentChange: 15.5,
      },
    ];

    return {
      totalVoyagesAffected: byVoyage.length,
      totalCostImpact: byVoyage.reduce((sum, v) => sum + v.estimatedCostChange, 0),
      byVoyage,
      byServiceType: [
        {
          serviceType,
          voyagesAffected: byVoyage.length,
          totalImpact: changeAmount * byVoyage.length,
        },
      ],
    };
  }

  /**
   * Send alert notifications to subscribers
   */
  private async sendAlertNotifications(alert: TariffChangeAlert): Promise<void> {
    // Get subscribers for this port/service type
    // In production: Query from database
    // const subscribers = await prisma.alertSubscription.findMany({
    //   where: {
    //     portIds: { has: alert.portId },
    //     serviceTypes: { has: alert.serviceType },
    //   },
    //   include: { user: true },
    // });

    const message = this.formatAlertMessage(alert);

    // In production: Send actual notifications (email, Slack, etc.)
    console.log('Alert notification:', message);
  }

  /**
   * Format alert message
   */
  private formatAlertMessage(alert: TariffChangeAlert): string {
    let message = `🚨 Tariff Change Alert - ${alert.portName}\n\n`;

    switch (alert.changeType) {
      case 'price_increase':
        message += `📈 Price Increase: ${alert.serviceType}\n`;
        message += `Old: ${alert.currency} ${alert.oldAmount?.toFixed(2)}\n`;
        message += `New: ${alert.currency} ${alert.newAmount.toFixed(2)}\n`;
        message += `Change: +${alert.changePercent.toFixed(1)}% (+${alert.currency} ${alert.changeAmount.toFixed(2)})\n`;
        break;

      case 'price_decrease':
        message += `📉 Price Decrease: ${alert.serviceType}\n`;
        message += `Old: ${alert.currency} ${alert.oldAmount?.toFixed(2)}\n`;
        message += `New: ${alert.currency} ${alert.newAmount.toFixed(2)}\n`;
        message += `Change: -${alert.changePercent.toFixed(1)}% (-${alert.currency} ${alert.changeAmount.toFixed(2)})\n`;
        break;

      case 'new_service':
        message += `✨ New Service: ${alert.serviceType}\n`;
        message += `Price: ${alert.currency} ${alert.newAmount.toFixed(2)}\n`;
        break;

      case 'service_removed':
        message += `⛔ Service Removed: ${alert.serviceType}\n`;
        message += `Previous Price: ${alert.currency} ${alert.oldAmount?.toFixed(2)}\n`;
        break;
    }

    message += `\nEffective: ${alert.effectiveDate.toDateString()}\n`;
    message += `Severity: ${alert.severity.toUpperCase()}\n`;
    message += `\nImpact Analysis:\n`;
    message += `- Affected Voyages: ${alert.affectedVoyages}\n`;
    message += `- Estimated Impact: ${alert.currency} ${alert.estimatedImpact.toFixed(2)}\n`;

    return message;
  }

  /**
   * Get alerts for organization
   */
  async getAlerts(
    organizationId: string,
    filters?: {
      portIds?: string[];
      severity?: string[];
      changeType?: string[];
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): Promise<TariffChangeAlert[]> {
    // In production: Query from database with filters
    // return await prisma.tariffChangeAlert.findMany({
    //   where: {
    //     organizationId,
    //     portId: filters?.portIds ? { in: filters.portIds } : undefined,
    //     severity: filters?.severity ? { in: filters.severity } : undefined,
    //     changeType: filters?.changeType ? { in: filters.changeType } : undefined,
    //     createdAt: {
    //       gte: filters?.dateFrom,
    //       lte: filters?.dateTo,
    //     },
    //   },
    //   orderBy: { createdAt: 'desc' },
    // });

    // Simulated alerts
    return [
      {
        id: 'alert-1',
        portId: 'port-singapore',
        portName: 'Port of Singapore',
        serviceType: 'pilotage',
        changeType: 'price_increase',
        oldAmount: 1500,
        newAmount: 1800,
        changePercent: 20,
        changeAmount: 300,
        currency: 'USD',
        effectiveDate: new Date('2026-02-01'),
        severity: 'high',
        affectedVoyages: 5,
        estimatedImpact: 1500,
        notificationsSent: 1,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'alert-2',
        portId: 'port-rotterdam',
        portName: 'Port of Rotterdam',
        serviceType: 'towage',
        changeType: 'price_decrease',
        oldAmount: 2500,
        newAmount: 2200,
        changePercent: 12,
        changeAmount: 300,
        currency: 'EUR',
        effectiveDate: new Date('2026-01-15'),
        severity: 'medium',
        affectedVoyages: 3,
        estimatedImpact: -900,
        notificationsSent: 1,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ];
  }

  /**
   * Subscribe to alerts
   */
  async subscribe(subscription: AlertSubscription): Promise<AlertSubscription> {
    // In production: Store in database
    // await prisma.alertSubscription.create({ data: subscription });

    return subscription;
  }

  /**
   * Unsubscribe from alerts
   */
  async unsubscribe(userId: string, portId: string): Promise<void> {
    // In production: Delete from database
    // await prisma.alertSubscription.deleteMany({
    //   where: { userId, portIds: { has: portId } },
    // });

    console.log(`User ${userId} unsubscribed from port ${portId} alerts`);
  }

  /**
   * Get cost trend for port/service
   */
  async getCostTrend(
    portId: string,
    serviceType: string,
    months: number = 12
  ): Promise<{
    data: { date: Date; amount: number }[];
    trend: 'increasing' | 'decreasing' | 'stable';
    averageChange: number;
  }> {
    // In production: Query historical tariff data
    // const history = await prisma.portTariff.findMany({
    //   where: {
    //     portId,
    //     serviceType,
    //     effectiveDate: { gte: new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000) },
    //   },
    //   orderBy: { effectiveDate: 'asc' },
    // });

    // Simulated trend data
    const data = [
      { date: new Date('2025-01-01'), amount: 1500 },
      { date: new Date('2025-04-01'), amount: 1550 },
      { date: new Date('2025-07-01'), amount: 1600 },
      { date: new Date('2025-10-01'), amount: 1700 },
      { date: new Date('2026-01-01'), amount: 1800 },
    ];

    // Calculate trend
    const firstAmount = data[0].amount;
    const lastAmount = data[data.length - 1].amount;
    const averageChange = ((lastAmount - firstAmount) / firstAmount) * 100;

    let trend: 'increasing' | 'decreasing' | 'stable';
    if (averageChange > 5) trend = 'increasing';
    else if (averageChange < -5) trend = 'decreasing';
    else trend = 'stable';

    return { data, trend, averageChange };
  }
}

export const tariffChangeAlertsService = new TariffChangeAlertsService();
