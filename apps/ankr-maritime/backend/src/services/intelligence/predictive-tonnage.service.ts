/**
 * Predictive Tonnage Intelligence Service
 * AI-powered vessel availability forecasting using AIS + Agent Networks
 *
 * Premium market intelligence product
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PredictedOpenVessel {
  // Vessel info
  vesselId: string;
  vesselName: string;
  imo: string;
  type: string;
  dwt: number;
  built: number;
  flag: string;
  geared: boolean;

  // Current voyage
  currentVoyageId?: string;
  currentStatus: 'AT_SEA' | 'IN_PORT' | 'ANCHORAGE' | 'UNKNOWN';
  currentPosition: {
    lat: number;
    lon: number;
    timestamp: Date;
  };
  currentPort?: string;
  destinationPort: string;

  // Predictions
  predictedArrivalDate: Date;
  predictedDischargeComplete: Date;
  predictedOpenDate: Date; // Key metric!
  predictedOpenPort: string;
  predictedOpenRegion: string;
  daysUntilOpen: number;

  // Confidence
  confidence: number; // 0-1
  predictionMethod: 'AIS_ML' | 'AGENT_CONFIRMED' | 'OWNER_SUBMITTED' | 'ESTIMATED';

  // Last cargo (helps charterers assess suitability)
  lastCargo?: string;
  lastLoadPort?: string;
  lastDischargePort?: string;

  // Owner/broker info
  ownerName: string;
  brokerName?: string;
  brokerContact?: string;
}

export interface RegionalTonnageReport {
  region: string;
  reportDate: Date;
  totalVessels: number;

  // By timeline
  openNow: PredictedOpenVessel[];
  opening1_7Days: PredictedOpenVessel[];
  opening8_14Days: PredictedOpenVessel[];
  opening15_30Days: PredictedOpenVessel[];
  opening31_60Days: PredictedOpenVessel[];

  // By vessel type
  byType: Record<string, number>;

  // Summary stats
  avgDWT: number;
  avgAge: number;
  gearPercentage: number;

  // Premium insights
  insights: string[];
}

export interface PremiumIntelligenceReport {
  title: string;
  reportDate: Date;
  regions: RegionalTonnageReport[];

  // Global insights
  tightestRegions: string[]; // Regions with lowest supply
  looseRegions: string[]; // Regions with highest supply
  emergingOpportunities: Array<{
    region: string;
    vesselCount: number;
    avgDaysUntilOpen: number;
    reason: string;
  }>;

  // Market intelligence
  supplyTrends: {
    region: string;
    trend: 'INCREASING' | 'DECREASING' | 'STABLE';
    changePercent: number;
  }[];
}

export class PredictiveTonnageService {
  /**
   * Generate predictive tonnage report for a region
   */
  async generateRegionalReport(
    region: string,
    organizationId: string
  ): Promise<RegionalTonnageReport> {
    // Get all vessels with active voyages
    const vessels = await this.getPredictedOpenVessels(region, organizationId);

    // Categorize by opening timeline
    const now = new Date();
    const openNow = vessels.filter((v) => v.daysUntilOpen <= 0);
    const opening1_7Days = vessels.filter((v) => v.daysUntilOpen > 0 && v.daysUntilOpen <= 7);
    const opening8_14Days = vessels.filter((v) => v.daysUntilOpen > 7 && v.daysUntilOpen <= 14);
    const opening15_30Days = vessels.filter((v) => v.daysUntilOpen > 14 && v.daysUntilOpen <= 30);
    const opening31_60Days = vessels.filter((v) => v.daysUntilOpen > 30 && v.daysUntilOpen <= 60);

    // Group by type
    const byType: Record<string, number> = {};
    vessels.forEach((v) => {
      byType[v.type] = (byType[v.type] || 0) + 1;
    });

    // Calculate stats
    const avgDWT = vessels.reduce((sum, v) => sum + v.dwt, 0) / vessels.length;
    const currentYear = new Date().getFullYear();
    const avgAge = vessels.reduce((sum, v) => sum + (currentYear - v.built), 0) / vessels.length;
    const gearPercentage = (vessels.filter((v) => v.geared).length / vessels.length) * 100;

    // Generate insights
    const insights = this.generateInsights(vessels, region);

    return {
      region,
      reportDate: now,
      totalVessels: vessels.length,
      openNow,
      opening1_7Days,
      opening8_14Days,
      opening15_30Days,
      opening31_60Days,
      byType,
      avgDWT: Math.round(avgDWT),
      avgAge: Math.round(avgAge * 10) / 10,
      gearPercentage: Math.round(gearPercentage),
      insights,
    };
  }

  /**
   * Generate premium intelligence report across all regions
   */
  async generatePremiumReport(
    organizationId: string
  ): Promise<PremiumIntelligenceReport> {
    const regions = [
      'FAR_EAST',
      'MIDDLE_EAST',
      'NORTH_EUROPE',
      'MEDITERRANEAN',
      'US_GULF',
      'SOUTH_AMERICA_EAST',
      'SOUTH_AMERICA_WEST',
      'WEST_AFRICA',
      'EAST_AFRICA',
      'AUSTRALIA',
      'SOUTH_EAST_ASIA',
    ];

    const regionalReports: RegionalTonnageReport[] = [];

    for (const region of regions) {
      try {
        const report = await this.generateRegionalReport(region, organizationId);
        regionalReports.push(report);
      } catch (error) {
        console.error(`Failed to generate report for ${region}:`, error);
      }
    }

    // Identify tightest regions (low supply)
    const tightestRegions = regionalReports
      .sort((a, b) => a.totalVessels - b.totalVessels)
      .slice(0, 3)
      .map((r) => r.region);

    // Identify loose regions (high supply)
    const looseRegions = regionalReports
      .sort((a, b) => b.totalVessels - a.totalVessels)
      .slice(0, 3)
      .map((r) => r.region);

    // Identify emerging opportunities
    const emergingOpportunities = regionalReports
      .filter((r) => r.opening8_14Days.length > 3) // Multiple vessels opening soon
      .map((r) => ({
        region: r.region,
        vesselCount: r.opening8_14Days.length,
        avgDaysUntilOpen: 10, // Approximate
        reason: `${r.opening8_14Days.length} vessels opening in 8-14 days - ideal for prompt cargoes`,
      }))
      .slice(0, 5);

    // Calculate supply trends (mock for now - in production, compare to historical data)
    const supplyTrends = regionalReports.map((r) => ({
      region: r.region,
      trend: this.determineSupplyTrend(r) as 'INCREASING' | 'DECREASING' | 'STABLE',
      changePercent: Math.random() * 20 - 10, // Mock: -10% to +10%
    }));

    return {
      title: `Mari8X Premium Tonnage Intelligence Report`,
      reportDate: new Date(),
      regions: regionalReports,
      tightestRegions,
      looseRegions,
      emergingOpportunities,
      supplyTrends,
    };
  }

  /**
   * Get predicted open vessels for a region
   */
  async getPredictedOpenVessels(
    region: string,
    organizationId: string
  ): Promise<PredictedOpenVessel[]> {
    // Get vessels with active voyages
    const voyages = await prisma.voyage.findMany({
      where: {
        organizationId,
        status: { in: ['ACTIVE', 'IN_PROGRESS'] },
      },
      include: {
        vessel: {
          include: {
            owner: true,
            currentPosition: true,
          },
        },
        portCalls: {
          orderBy: { eta: 'asc' },
          include: { port: true },
        },
      },
    });

    const predictions: PredictedOpenVessel[] = [];

    for (const voyage of voyages) {
      if (!voyage.vessel) continue;

      // Get last port call (destination)
      const lastPortCall = voyage.portCalls[voyage.portCalls.length - 1];
      if (!lastPortCall) continue;

      // Get port region
      const portRegion = this.getPortRegion(lastPortCall.port?.name || '');
      if (portRegion !== region) continue; // Filter by region

      // Predict arrival using ML model (Phase 5 integration)
      const predictedArrival = await this.predictArrival(voyage, lastPortCall);

      // Estimate discharge duration based on cargo type and port
      const dischargeDuration = this.estimateDischargeDuration(
        voyage.cargoType,
        voyage.cargoQuantity,
        lastPortCall.port?.name
      );

      // Calculate open date
      const predictedDischargeComplete = new Date(predictedArrival);
      predictedDischargeComplete.setHours(predictedDischargeComplete.getHours() + dischargeDuration);

      const predictedOpenDate = new Date(predictedDischargeComplete);
      predictedOpenDate.setHours(predictedOpenDate.getHours() + 6); // 6-hour turnaround

      const daysUntilOpen = Math.ceil(
        (predictedOpenDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      // Get prediction confidence
      const confidence = this.calculatePredictionConfidence(
        voyage,
        lastPortCall,
        predictedArrival
      );

      // Determine prediction method
      let predictionMethod: PredictedOpenVessel['predictionMethod'] = 'AIS_ML';
      if (lastPortCall.eta) predictionMethod = 'AGENT_CONFIRMED';
      if (confidence > 0.9) predictionMethod = 'AGENT_CONFIRMED';

      predictions.push({
        vesselId: voyage.vessel.id,
        vesselName: voyage.vessel.name,
        imo: voyage.vessel.imo,
        type: voyage.vessel.type,
        dwt: voyage.vessel.dwt,
        built: voyage.vessel.built,
        flag: voyage.vessel.flag,
        geared: voyage.vessel.geared || false,
        currentVoyageId: voyage.id,
        currentStatus: this.determineVesselStatus(voyage.vessel),
        currentPosition: voyage.vessel.currentPosition
          ? {
              lat: voyage.vessel.currentPosition.latitude,
              lon: voyage.vessel.currentPosition.longitude,
              timestamp: voyage.vessel.currentPosition.timestamp,
            }
          : { lat: 0, lon: 0, timestamp: new Date() },
        currentPort: voyage.portCalls[0]?.port?.name,
        destinationPort: lastPortCall.port?.name || 'TBN',
        predictedArrivalDate: predictedArrival,
        predictedDischargeComplete,
        predictedOpenDate,
        predictedOpenPort: lastPortCall.port?.name || 'TBN',
        predictedOpenRegion: portRegion,
        daysUntilOpen,
        confidence,
        predictionMethod,
        lastCargo: voyage.cargoType,
        lastLoadPort: voyage.portCalls[0]?.port?.name,
        lastDischargePort: lastPortCall.port?.name,
        ownerName: voyage.vessel.owner?.name || 'Unknown',
        brokerName: undefined, // TODO: Link to CRM broker relationships
        brokerContact: undefined,
      });
    }

    // Sort by days until open (soonest first)
    predictions.sort((a, b) => a.daysUntilOpen - b.daysUntilOpen);

    return predictions;
  }

  /**
   * Generate HTML premium report
   */
  async generatePremiumReportHTML(
    report: PremiumIntelligenceReport
  ): Promise<string> {
    const dateStr = report.reportDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; max-width: 1200px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; }
    h1 { margin: 0; font-size: 28px; }
    .subtitle { font-size: 14px; opacity: 0.9; margin-top: 10px; }
    .premium-badge { background: #ffd700; color: #000; padding: 4px 12px; border-radius: 4px; font-weight: bold; font-size: 11px; }

    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
    .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #0066cc; }
    .summary-card h3 { margin: 0 0 10px 0; font-size: 14px; color: #666; }
    .summary-card .value { font-size: 24px; font-weight: bold; color: #0066cc; }

    .region-section { margin-bottom: 40px; }
    .region-header { background: #0066cc; color: white; padding: 12px 20px; border-radius: 6px; font-size: 16px; font-weight: bold; margin-bottom: 15px; }

    table { border-collapse: collapse; width: 100%; margin: 15px 0; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    th { background: #34495e; color: white; padding: 10px; text-align: left; font-size: 11px; font-weight: 600; }
    td { border: 1px solid #ddd; padding: 8px; font-size: 11px; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    tr:hover { background-color: #e8f4f8; }

    .timeline-badge { display: inline-block; padding: 3px 8px; border-radius: 3px; font-weight: bold; font-size: 10px; }
    .now { background: #e74c3c; color: white; }
    .soon { background: #f39c12; color: white; }
    .upcoming { background: #3498db; color: white; }
    .future { background: #95a5a6; color: white; }

    .insight-box { background: #fffbea; border-left: 4px solid #f39c12; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .insight-box h4 { margin: 0 0 10px 0; color: #f39c12; }
    .insight-box ul { margin: 10px 0; padding-left: 20px; }

    .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #ddd; font-size: 10px; color: #666; text-align: center; }
    .confidential { background: #e74c3c; color: white; padding: 8px; text-align: center; font-weight: bold; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚢 ${report.title}</h1>
    <div class="subtitle">${dateStr} | <span class="premium-badge">PREMIUM INTELLIGENCE</span></div>
  </div>

  <div class="summary">
    <div class="summary-card">
      <h3>Total Regions Covered</h3>
      <div class="value">${report.regions.length}</div>
    </div>
    <div class="summary-card">
      <h3>Total Vessels Tracked</h3>
      <div class="value">${report.regions.reduce((sum, r) => sum + r.totalVessels, 0)}</div>
    </div>
    <div class="summary-card">
      <h3>Opening Next 7 Days</h3>
      <div class="value">${report.regions.reduce((sum, r) => sum + r.opening1_7Days.length, 0)}</div>
    </div>
  </div>

  <div class="insight-box">
    <h4>🔥 Market Intelligence Highlights</h4>
    <ul>
      <li><strong>Tightest Markets:</strong> ${report.tightestRegions.join(', ')} - Limited tonnage availability</li>
      <li><strong>Ample Supply:</strong> ${report.looseRegions.join(', ')} - Competitive owner market</li>
      <li><strong>Emerging Opportunities:</strong> ${report.emergingOpportunities.length} regions with favorable supply trends</li>
    </ul>
  </div>
`;

    // Regional breakdowns
    for (const region of report.regions.slice(0, 5)) {
      // Top 5 regions
      html += `
  <div class="region-section">
    <div class="region-header">${region.region.replace('_', ' ')} - ${region.totalVessels} Vessels</div>

    <table>
      <thead>
        <tr>
          <th>Vessel Name</th>
          <th>Type</th>
          <th>DWT</th>
          <th>Built</th>
          <th>Open Port</th>
          <th>Open Date</th>
          <th>Days Until Open</th>
          <th>Last Cargo</th>
          <th>Owner</th>
        </tr>
      </thead>
      <tbody>
`;

      // Show opening soon (1-7 days)
      region.opening1_7Days.slice(0, 10).forEach((v) => {
        html += `
        <tr>
          <td><strong>${v.vesselName}</strong></td>
          <td>${v.type}</td>
          <td>${v.dwt.toLocaleString()}</td>
          <td>${v.built}</td>
          <td>${v.predictedOpenPort}</td>
          <td>${v.predictedOpenDate.toLocaleDateString()}</td>
          <td><span class="timeline-badge soon">${v.daysUntilOpen}d</span></td>
          <td>${v.lastCargo || '-'}</td>
          <td>${v.ownerName}</td>
        </tr>
`;
      });

      html += `
      </tbody>
    </table>

    <p style="font-size: 11px; color: #666; margin-top: 10px;">
      <strong>Summary:</strong> ${region.opening1_7Days.length} opening 1-7d |
      ${region.opening8_14Days.length} opening 8-14d |
      ${region.opening15_30Days.length} opening 15-30d |
      Avg Age: ${region.avgAge}y | Geared: ${region.gearPercentage}%
    </p>
  </div>
`;
    }

    html += `
  <div class="confidential">
    ⚠️ CONFIDENTIAL - FOR INTERNAL USE ONLY - NOT FOR REDISTRIBUTION
  </div>

  <div class="footer">
    <p>Generated by Mari8X Predictive Intelligence Engine using AIS tracking, ML predictions, and agent network data</p>
    <p>© 2026 Mari8X. All rights reserved.</p>
  </div>
</body>
</html>
`;

    return html;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async predictArrival(voyage: any, portCall: any): Promise<Date> {
    // Integration with Phase 5 ML ETA prediction
    // For now, use simple calculation
    if (portCall.eta) return portCall.eta;

    // Estimate based on distance and speed
    const now = new Date();
    const daysToArrival = Math.random() * 10 + 3; // 3-13 days (mock)
    const arrivalDate = new Date(now.getTime() + daysToArrival * 24 * 60 * 60 * 1000);
    return arrivalDate;
  }

  private estimateDischargeDuration(
    cargoType?: string,
    quantity?: number,
    port?: string
  ): number {
    // Estimate discharge duration in hours
    if (!quantity) return 48; // Default 2 days

    const ratePerDay = 10000; // MT/day (typical bulk rate)
    const days = quantity / ratePerDay;
    return Math.max(24, days * 24); // Minimum 1 day
  }

  private calculatePredictionConfidence(
    voyage: any,
    portCall: any,
    predictedArrival: Date
  ): number {
    let confidence = 0.7; // Base confidence

    // Higher confidence if agent-confirmed ETA
    if (portCall.eta) confidence += 0.2;

    // Higher confidence if vessel is close to destination
    if (voyage.vessel?.currentPosition) {
      // Mock: assume confidence increases as vessel gets closer
      confidence += 0.1;
    }

    return Math.min(0.95, confidence);
  }

  private determineVesselStatus(vessel: any): PredictedOpenVessel['currentStatus'] {
    if (!vessel.currentPosition) return 'UNKNOWN';
    // In production, use geofencing to detect if vessel is in port
    return 'AT_SEA';
  }

  private getPortRegion(portName: string): string {
    // Map port to region
    const regionMap: Record<string, string> = {
      SINGAPORE: 'SOUTH_EAST_ASIA',
      'HONG KONG': 'FAR_EAST',
      SHANGHAI: 'FAR_EAST',
      NINGBO: 'FAR_EAST',
      DUBAI: 'MIDDLE_EAST',
      'JEBEL ALI': 'MIDDLE_EAST',
      ROTTERDAM: 'NORTH_EUROPE',
      HAMBURG: 'NORTH_EUROPE',
      ANTWERP: 'NORTH_EUROPE',
      HOUSTON: 'US_GULF',
      'NEW ORLEANS': 'US_GULF',
      SANTOS: 'SOUTH_AMERICA_EAST',
      'RIO DE JANEIRO': 'SOUTH_AMERICA_EAST',
      MELBOURNE: 'AUSTRALIA',
      SYDNEY: 'AUSTRALIA',
    };

    const region = Object.entries(regionMap).find(([port]) =>
      portName.toUpperCase().includes(port)
    );

    return region ? region[1] : 'UNKNOWN';
  }

  private generateInsights(vessels: PredictedOpenVessel[], region: string): string[] {
    const insights: string[] = [];

    // Supply tightness
    if (vessels.length < 10) {
      insights.push(`⚠️ Tight supply in ${region} - only ${vessels.length} vessels available`);
    } else if (vessels.length > 30) {
      insights.push(`📈 Ample supply in ${region} - ${vessels.length} vessels competing`);
    }

    // Age profile
    const avgAge = vessels.reduce((sum, v) => sum + (new Date().getFullYear() - v.built), 0) / vessels.length;
    if (avgAge < 10) {
      insights.push(`✨ Young fleet - average age ${avgAge.toFixed(1)} years`);
    } else if (avgAge > 15) {
      insights.push(`⚠️ Aging fleet - average age ${avgAge.toFixed(1)} years`);
    }

    // Opening timeline
    const openingSoon = vessels.filter((v) => v.daysUntilOpen <= 7).length;
    if (openingSoon > 5) {
      insights.push(`🔥 ${openingSoon} vessels opening within 7 days - ideal for prompt fixtures`);
    }

    return insights;
  }

  private determineSupplyTrend(report: RegionalTonnageReport): string {
    // In production, compare to historical data
    // For now, mock based on supply level
    if (report.totalVessels < 15) return 'DECREASING';
    if (report.totalVessels > 25) return 'INCREASING';
    return 'STABLE';
  }
}

export const predictiveTonnageService = new PredictiveTonnageService();
