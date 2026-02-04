/**
 * Alert Trigger Service
 *
 * Monitors arrival intelligence data and triggers master alerts when specific conditions are met.
 *
 * Trigger Conditions:
 * - Vessel enters 200 NM radius (ARRIVAL_200NM)
 * - Critical documents missing within 24h of ETA (DOCUMENT_MISSING)
 * - Document deadline approaching (24h, 12h, 6h warnings) (DEADLINE_APPROACHING)
 * - Port congestion status changes to RED (CONGESTION_HIGH)
 * - DA cost significantly above average (>25%) (DA_COST_HIGH)
 * - ETA changes by more than 6 hours (ETA_CHANGED)
 * - Port readiness changes to RED (PORT_READINESS_RED)
 *
 * Deduplication: Prevents sending duplicate alerts within 6-hour window
 */

import { PrismaClient } from '@prisma/client';
import type {
  VesselArrival,
  DocumentStatus,
  PortCongestionSnapshot,
  MasterAlert
} from '@prisma/client';

const prisma = new PrismaClient();

export interface TriggerCondition {
  type: AlertType;
  arrivalId: string;
  vesselId: string;
  priority: AlertPriority;
  metadata: Record<string, any>;
}

export enum AlertType {
  ARRIVAL_200NM = 'ARRIVAL_200NM',
  DOCUMENT_MISSING = 'DOCUMENT_MISSING',
  DEADLINE_APPROACHING = 'DEADLINE_APPROACHING',
  CONGESTION_HIGH = 'CONGESTION_HIGH',
  DA_COST_HIGH = 'DA_COST_HIGH',
  ETA_CHANGED = 'ETA_CHANGED',
  PORT_READINESS_RED = 'PORT_READINESS_RED',
  ACTION_REQUIRED = 'ACTION_REQUIRED'
}

export enum AlertPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export class AlertTriggerService {
  /**
   * Monitor for vessels entering 200 NM proximity
   * Triggers when VesselArrival record is first created
   */
  async monitorProximityTriggers(): Promise<TriggerCondition[]> {
    const triggers: TriggerCondition[] = [];

    // Find arrivals created in the last 5 minutes that haven't triggered an alert yet
    const recentArrivals = await prisma.vesselArrival.findMany({
      where: {
        triggeredAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        },
        status: 'APPROACHING',
        // Check if we haven't already sent a 200NM alert
        NOT: {
          masterAlerts: {
            some: {
              alertType: AlertType.ARRIVAL_200NM,
              sentAt: {
                not: null
              }
            }
          }
        }
      },
      include: {
        vessel: true,
        port: true
      }
    });

    for (const arrival of recentArrivals) {
      triggers.push({
        type: AlertType.ARRIVAL_200NM,
        arrivalId: arrival.id,
        vesselId: arrival.vesselId,
        priority: AlertPriority.HIGH,
        metadata: {
          distance: arrival.distance,
          eta: arrival.etaMostLikely,
          port: arrival.port?.name,
          vessel: arrival.vessel?.name
        }
      });
    }

    return triggers;
  }

  /**
   * Monitor for missing critical documents within 24h of ETA
   */
  async monitorDocumentDeadlines(): Promise<TriggerCondition[]> {
    const triggers: TriggerCondition[] = [];

    // Find arrivals within 48h that have missing critical documents
    const upcomingArrivals = await prisma.vesselArrival.findMany({
      where: {
        etaMostLikely: {
          gte: new Date(),
          lte: new Date(Date.now() + 48 * 60 * 60 * 1000) // Next 48 hours
        },
        status: {
          in: ['APPROACHING', 'IN_ANCHORAGE']
        }
      },
      include: {
        vessel: true,
        port: true,
        documentStatuses: {
          where: {
            status: {
              in: ['NOT_STARTED', 'IN_PROGRESS']
            }
          }
        }
      }
    });

    for (const arrival of upcomingArrivals) {
      const criticalMissing = arrival.documentStatuses.filter(
        doc => doc.priority === 'CRITICAL' && doc.mandatory
      );

      if (criticalMissing.length > 0) {
        // Check if we haven't sent this alert in the last 6 hours
        const recentAlert = await prisma.masterAlert.findFirst({
          where: {
            arrivalId: arrival.id,
            alertType: AlertType.DOCUMENT_MISSING,
            sentAt: {
              gte: new Date(Date.now() - 6 * 60 * 60 * 1000)
            }
          }
        });

        if (!recentAlert) {
          triggers.push({
            type: AlertType.DOCUMENT_MISSING,
            arrivalId: arrival.id,
            vesselId: arrival.vesselId,
            priority: AlertPriority.CRITICAL,
            metadata: {
              missingCount: criticalMissing.length,
              documents: criticalMissing.map(d => d.documentType),
              eta: arrival.etaMostLikely,
              hoursToETA: Math.round(
                (arrival.etaMostLikely.getTime() - Date.now()) / (60 * 60 * 1000)
              )
            }
          });
        }
      }

      // Check for approaching deadlines (24h, 12h, 6h thresholds)
      for (const doc of arrival.documentStatuses) {
        if (!doc.deadline || doc.status !== 'NOT_STARTED') continue;

        const hoursToDeadline = Math.round(
          (doc.deadline.getTime() - Date.now()) / (60 * 60 * 1000)
        );

        // Trigger at 24h, 12h, and 6h before deadline
        const thresholds = [24, 12, 6];
        for (const threshold of thresholds) {
          if (hoursToDeadline <= threshold && hoursToDeadline > threshold - 1) {
            // Check if we already sent this specific deadline alert
            const recentDeadlineAlert = await prisma.masterAlert.findFirst({
              where: {
                arrivalId: arrival.id,
                alertType: AlertType.DEADLINE_APPROACHING,
                sentAt: {
                  gte: new Date(Date.now() - 1 * 60 * 60 * 1000) // Last hour
                },
                title: {
                  contains: doc.documentType
                }
              }
            });

            if (!recentDeadlineAlert) {
              triggers.push({
                type: AlertType.DEADLINE_APPROACHING,
                arrivalId: arrival.id,
                vesselId: arrival.vesselId,
                priority: hoursToDeadline <= 6 ? AlertPriority.CRITICAL : AlertPriority.HIGH,
                metadata: {
                  documentType: doc.documentType,
                  deadline: doc.deadline,
                  hoursRemaining: hoursToDeadline,
                  threshold: threshold
                }
              });
            }
          }
        }
      }
    }

    return triggers;
  }

  /**
   * Monitor for port congestion status changes
   */
  async monitorPortCongestion(): Promise<TriggerCondition[]> {
    const triggers: TriggerCondition[] = [];

    // Find arrivals approaching ports with HIGH congestion
    const arrivalsWithCongestion = await prisma.vesselArrival.findMany({
      where: {
        status: 'APPROACHING',
        etaMostLikely: {
          gte: new Date(),
          lte: new Date(Date.now() + 72 * 60 * 60 * 1000) // Next 72 hours
        }
      },
      include: {
        vessel: true,
        port: {
          include: {
            congestionSnapshots: {
              orderBy: {
                timestamp: 'desc'
              },
              take: 1
            }
          }
        }
      }
    });

    for (const arrival of arrivalsWithCongestion) {
      const latestCongestion = arrival.port?.congestionSnapshots[0];

      if (latestCongestion && latestCongestion.readinessScore === 'red') {
        // Check if we haven't sent congestion alert in last 12 hours
        const recentAlert = await prisma.masterAlert.findFirst({
          where: {
            arrivalId: arrival.id,
            alertType: AlertType.CONGESTION_HIGH,
            sentAt: {
              gte: new Date(Date.now() - 12 * 60 * 60 * 1000)
            }
          }
        });

        if (!recentAlert) {
          triggers.push({
            type: AlertType.CONGESTION_HIGH,
            arrivalId: arrival.id,
            vesselId: arrival.vesselId,
            priority: AlertPriority.HIGH,
            metadata: {
              port: arrival.port?.name,
              vesselsWaiting: latestCongestion.vesselsAtAnchorage,
              averageWait: latestCongestion.averageWaitTime,
              readinessScore: latestCongestion.readinessScore
            }
          });
        }
      }
    }

    return triggers;
  }

  /**
   * Monitor for significant ETA changes (>6 hours)
   */
  async monitorETAChanges(): Promise<TriggerCondition[]> {
    const triggers: TriggerCondition[] = [];

    // Find arrivals with recent ETA updates
    const arrivalsWithETAChanges = await prisma.vesselArrival.findMany({
      where: {
        status: {
          in: ['APPROACHING', 'IN_ANCHORAGE']
        },
        updatedAt: {
          gte: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
        }
      },
      include: {
        vessel: true,
        port: true,
        masterAlerts: {
          where: {
            alertType: AlertType.ETA_CHANGED
          },
          orderBy: {
            sentAt: 'desc'
          },
          take: 1
        }
      }
    });

    for (const arrival of arrivalsWithETAChanges) {
      // Compare current ETA with the one sent in the last alert
      const lastETAAlert = arrival.masterAlerts[0];

      if (lastETAAlert && lastETAAlert.metadata) {
        const previousETA = new Date((lastETAAlert.metadata as any).eta);
        const currentETA = arrival.etaMostLikely;
        const hoursDifference = Math.abs(
          (currentETA.getTime() - previousETA.getTime()) / (60 * 60 * 1000)
        );

        // Trigger if ETA changed by more than 6 hours
        if (hoursDifference > 6) {
          triggers.push({
            type: AlertType.ETA_CHANGED,
            arrivalId: arrival.id,
            vesselId: arrival.vesselId,
            priority: AlertPriority.HIGH,
            metadata: {
              previousETA: previousETA,
              currentETA: currentETA,
              hoursDifference: Math.round(hoursDifference),
              direction: currentETA > previousETA ? 'delayed' : 'advanced'
            }
          });
        }
      }
    }

    return triggers;
  }

  /**
   * Monitor for DA cost anomalies (>25% above average)
   */
  async monitorDAAnomaly(): Promise<TriggerCondition[]> {
    const triggers: TriggerCondition[] = [];

    // Find arrivals with unusually high DA forecasts
    const arrivals = await prisma.vesselArrival.findMany({
      where: {
        status: 'APPROACHING',
        daEstimateMostLikely: {
          not: null
        },
        etaMostLikely: {
          gte: new Date(),
          lte: new Date(Date.now() + 48 * 60 * 60 * 1000)
        }
      },
      include: {
        vessel: true,
        port: true
      }
    });

    for (const arrival of arrivals) {
      if (!arrival.daEstimateMostLikely) continue;

      // Get historical average for this port
      const historicalArrivals = await prisma.vesselArrival.findMany({
        where: {
          portId: arrival.portId,
          daEstimateMostLikely: {
            not: null
          },
          status: 'DEPARTED',
          updatedAt: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
          }
        },
        select: {
          daEstimateMostLikely: true
        }
      });

      if (historicalArrivals.length > 5) {
        const average =
          historicalArrivals.reduce((sum, a) => sum + (a.daEstimateMostLikely || 0), 0) /
          historicalArrivals.length;

        const percentageAbove = ((arrival.daEstimateMostLikely - average) / average) * 100;

        // Trigger if >25% above average
        if (percentageAbove > 25) {
          // Check if we haven't sent this alert in last 24 hours
          const recentAlert = await prisma.masterAlert.findFirst({
            where: {
              arrivalId: arrival.id,
              alertType: AlertType.DA_COST_HIGH,
              sentAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
              }
            }
          });

          if (!recentAlert) {
            triggers.push({
              type: AlertType.DA_COST_HIGH,
              arrivalId: arrival.id,
              vesselId: arrival.vesselId,
              priority: AlertPriority.MEDIUM,
              metadata: {
                forecast: arrival.daEstimateMostLikely,
                average: Math.round(average),
                percentageAbove: Math.round(percentageAbove)
              }
            });
          }
        }
      }
    }

    return triggers;
  }

  /**
   * Run all monitors and return all triggered conditions
   */
  async runAllMonitors(): Promise<TriggerCondition[]> {
    const [
      proximityTriggers,
      documentTriggers,
      congestionTriggers,
      etaTriggers,
      daTriggers
    ] = await Promise.all([
      this.monitorProximityTriggers(),
      this.monitorDocumentDeadlines(),
      this.monitorPortCongestion(),
      this.monitorETAChanges(),
      this.monitorDAAnomaly()
    ]);

    return [
      ...proximityTriggers,
      ...documentTriggers,
      ...congestionTriggers,
      ...etaTriggers,
      ...daTriggers
    ];
  }

  /**
   * Check if a similar alert was recently sent (deduplication)
   */
  async isDuplicate(
    arrivalId: string,
    alertType: AlertType,
    windowHours: number = 6
  ): Promise<boolean> {
    const recentAlert = await prisma.masterAlert.findFirst({
      where: {
        arrivalId,
        alertType,
        sentAt: {
          gte: new Date(Date.now() - windowHours * 60 * 60 * 1000)
        }
      }
    });

    return !!recentAlert;
  }
}

export const alertTriggerService = new AlertTriggerService();
