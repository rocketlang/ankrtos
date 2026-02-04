/**
 * Arrival Intelligence Service (Main Orchestrator)
 *
 * This is the main service that orchestrates all arrival intelligence generation.
 * It combines:
 * - Proximity Detection (when vessel enters 200 NM)
 * - Document Requirements (what docs are needed)
 * - DA Cost Forecasting (coming in Phase 1.3)
 * - Port Congestion Analysis (coming in Phase 1.4)
 *
 * This service is triggered when a new VesselArrival is created.
 */

import { PrismaClient } from '@prisma/client';
import { DocumentCheckerService } from './document-checker.service';
import { DAForecastService } from './da-forecast.service';
import { PortCongestionAnalyzerService } from './port-congestion-analyzer.service';

export class ArrivalIntelligenceService {
  private documentChecker: DocumentCheckerService;
  private daForecaster: DAForecastService;
  private congestionAnalyzer: PortCongestionAnalyzerService;

  constructor(private prisma: PrismaClient) {
    this.documentChecker = new DocumentCheckerService(prisma);
    this.daForecaster = new DAForecastService(prisma);
    this.congestionAnalyzer = new PortCongestionAnalyzerService(prisma);
  }

  /**
   * Generate complete arrival intelligence for a new arrival
   * This is the main entry point called when vessel enters 200 NM
   */
  async generateIntelligence(arrivalId: string): Promise<void> {
    console.log(`[ArrivalIntelligence] Generating intelligence for arrival ${arrivalId}`);

    const arrival = await this.prisma.vesselArrival.findUnique({
      where: { id: arrivalId },
      include: {
        vessel: true,
        port: true
      }
    });

    if (!arrival) {
      throw new Error(`Arrival ${arrivalId} not found`);
    }

    try {
      // Phase 1.2: Generate document requirements
      console.log('[ArrivalIntelligence] Step 1/4: Generating document requirements...');
      await this.documentChecker.generateDocumentRequirements(arrivalId);

      // Phase 1.3: Generate DA cost forecast
      console.log('[ArrivalIntelligence] Step 2/4: Generating DA cost forecast...');
      await this.daForecaster.generateForecast(arrivalId);

      // Phase 1.4: Analyze port congestion
      console.log('[ArrivalIntelligence] Step 3/4: Analyzing port congestion...');
      await this.congestionAnalyzer.analyzeCongestion(arrivalId);

      // Phase 3: Trigger master alert (TODO)
      console.log('[ArrivalIntelligence] Step 4/4: Master alerts (coming in Phase 3)');
      // await this.masterAlertService.sendArrivalAlert(arrivalId);

      console.log(`[ArrivalIntelligence] ✓ Intelligence generation complete for ${arrival.vessel.name} → ${arrival.port.name}`);

      // Log completion event
      await this.prisma.arrivalTimelineEvent.create({
        data: {
          arrivalId,
          eventType: 'INTELLIGENCE_GENERATED',
          actor: 'SYSTEM',
          action: 'Complete arrival intelligence generated',
          impact: 'IMPORTANT',
          metadata: {
            vessel: arrival.vessel.name,
            port: arrival.port.name,
            distance: arrival.distance,
            eta: arrival.etaMostLikely
          }
        }
      });
    } catch (error) {
      console.error(`[ArrivalIntelligence] Error generating intelligence for arrival ${arrivalId}:`, error);
      throw error;
    }
  }

  /**
   * Update intelligence when arrival details change
   * (e.g., ETA changes, documents submitted)
   */
  async updateIntelligence(arrivalId: string): Promise<void> {
    console.log(`[ArrivalIntelligence] Updating intelligence for arrival ${arrivalId}`);

    // Recalculate document compliance
    const documentMetrics = await this.documentChecker.calculateComplianceMetrics(arrivalId);

    // Update ArrivalIntelligence
    await this.prisma.arrivalIntelligence.update({
      where: { arrivalId },
      data: {
        documentsRequired: documentMetrics.documentsRequired,
        documentsMissing: documentMetrics.documentsMissing,
        documentsSubmitted: documentMetrics.documentsSubmitted,
        documentsApproved: documentMetrics.documentsApproved,
        complianceScore: documentMetrics.complianceScore,
        criticalDocsMissing: documentMetrics.criticalDocsMissing,
        nextDocumentDeadline: documentMetrics.nextDeadline
      }
    });

    console.log(`[ArrivalIntelligence] ✓ Intelligence updated`);
  }

  /**
   * Get complete intelligence summary for agent dashboard
   */
  async getIntelligenceSummary(arrivalId: string) {
    const arrival = await this.prisma.vesselArrival.findUnique({
      where: { id: arrivalId },
      include: {
        vessel: true,
        port: true,
        intelligence: true,
        documentStatuses: {
          where: {
            status: {
              in: ['NOT_STARTED', 'IN_PROGRESS', 'OVERDUE']
            }
          },
          orderBy: { deadline: 'asc' }
        }
      }
    });

    if (!arrival || !arrival.intelligence) {
      return null;
    }

    const now = new Date();
    const hoursToETA = (arrival.etaMostLikely.getTime() - now.getTime()) / (1000 * 60 * 60);

    return {
      // Basic Info
      vessel: {
        id: arrival.vessel.id,
        name: arrival.vessel.name,
        imo: arrival.vessel.imo,
        type: arrival.vessel.type
      },
      port: {
        id: arrival.port.id,
        name: arrival.port.name,
        unlocode: arrival.port.unlocode
      },

      // ETA Info
      distance: arrival.currentDistance || arrival.distance,
      eta: {
        bestCase: arrival.etaBestCase,
        mostLikely: arrival.etaMostLikely,
        worstCase: arrival.etaWorstCase,
        confidence: arrival.etaConfidence,
        hoursRemaining: hoursToETA
      },

      // Document Intelligence
      documents: {
        required: arrival.intelligence.documentsRequired,
        missing: arrival.intelligence.documentsMissing,
        submitted: arrival.intelligence.documentsSubmitted,
        approved: arrival.intelligence.documentsApproved,
        complianceScore: arrival.intelligence.complianceScore,
        criticalMissing: arrival.intelligence.criticalDocsMissing,
        nextDeadline: arrival.intelligence.nextDocumentDeadline,
        urgentDocuments: arrival.documentStatuses.filter(
          d => d.hoursRemaining !== null && d.hoursRemaining < 12
        )
      },

      // DA Forecast (Phase 1.3)
      daForecast: {
        min: arrival.intelligence.daEstimateMin,
        max: arrival.intelligence.daEstimateMax,
        mostLikely: arrival.intelligence.daEstimateMostLikely,
        confidence: arrival.intelligence.daConfidence,
        breakdown: arrival.intelligence.daBreakdown
      },

      // Congestion (Phase 1.4)
      congestion: {
        status: arrival.intelligence.congestionStatus,
        waitTimeMin: arrival.intelligence.expectedWaitTimeMin,
        waitTimeMax: arrival.intelligence.expectedWaitTimeMax,
        vesselsInPort: arrival.intelligence.vesselsInPort,
        vesselsAtAnchorage: arrival.intelligence.vesselsAtAnchorage
      },

      // Port Readiness
      portReadiness: {
        score: arrival.intelligence.portReadinessScore,
        berthAvailability: arrival.intelligence.berthAvailability,
        pilotAvailability: arrival.intelligence.pilotAvailability
      },

      // Recommendations
      recommendations: arrival.intelligence.recommendations,

      // Status
      status: arrival.status,
      lastUpdated: arrival.updatedAt
    };
  }

  /**
   * Get all active arrivals for agent dashboard
   */
  async getActiveArrivals(filters?: {
    status?: string[];
    portId?: string;
    hoursToETA?: number; // Show arrivals within X hours
  }) {
    const where: any = {
      status: {
        in: filters?.status || ['APPROACHING', 'IN_ANCHORAGE', 'BERTHING']
      }
    };

    if (filters?.portId) {
      where.portId = filters.portId;
    }

    if (filters?.hoursToETA) {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() + filters.hoursToETA);
      where.etaMostLikely = {
        lte: cutoffDate
      };
    }

    const arrivals = await this.prisma.vesselArrival.findMany({
      where,
      include: {
        vessel: true,
        port: true,
        intelligence: true,
        documentStatuses: {
          where: {
            status: {
              in: ['NOT_STARTED', 'IN_PROGRESS', 'OVERDUE']
            }
          }
        }
      },
      orderBy: {
        etaMostLikely: 'asc'
      }
    });

    return arrivals.map(arrival => ({
      arrivalId: arrival.id,
      vessel: {
        id: arrival.vessel.id,
        name: arrival.vessel.name,
        imo: arrival.vessel.imo
      },
      port: {
        id: arrival.port.id,
        name: arrival.port.name,
        unlocode: arrival.port.unlocode
      },
      distance: arrival.currentDistance || arrival.distance,
      eta: arrival.etaMostLikely,
      etaConfidence: arrival.etaConfidence,
      status: arrival.status,
      intelligence: arrival.intelligence
        ? {
            complianceScore: arrival.intelligence.complianceScore,
            documentsMissing: arrival.intelligence.documentsMissing,
            criticalDocsMissing: arrival.intelligence.criticalDocsMissing,
            congestionStatus: arrival.intelligence.congestionStatus,
            daEstimate: arrival.intelligence.daEstimateMostLikely
          }
        : null,
      urgentActions: arrival.documentStatuses.filter(
        d => d.hoursRemaining !== null && d.hoursRemaining < 12
      ).length
    }));
  }
}
