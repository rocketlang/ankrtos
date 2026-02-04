/**
 * Statement of Facts (SOF) Auto-Populator Service
 * Phase 5: TIER 2 - Voyage Automation
 *
 * Features:
 * - Extract arrival/departure times from AIS
 * - Auto-populate SOF template
 * - Weather data from noon reports
 * - Generate draft SOF for master review
 * - Reduce manual SOF creation by 70%
 */

import { prisma } from '../../lib/prisma.js';
import { aisIntegrationService } from '../ais-integration.js';

export interface SOFData {
  portCallId: string;
  voyageId: string;
  portId: string;
  portName: string;

  // Arrival section
  pilotOnboard?: Date;
  norTendered?: Date;
  freePatique?: Date;
  arrival?: Date;
  anchorage?: Date;
  allFastBerth?: Date;
  berthingCompleted?: Date;

  // Cargo operations
  cargoOperationsCommenced?: Date;
  cargoOperationsCompleted?: Date;
  holdsCleaned?: Date;
  holdsInspected?: Date;

  // Departure section
  noticeOfReadiness?: Date;
  pilotOffboard?: Date;
  departure?: Date;

  // Weather summary
  weatherSummary?: {
    arrivalWeather: string;
    berthingWeather: string;
    cargoWeather: string;
    departureWeather: string;
  };

  // Delays
  delays?: {
    type: string;
    from: Date;
    to: Date;
    duration: number; // hours
    reason: string;
  }[];

  // Auto-generated metadata
  generatedAt: Date;
  dataSource: 'ais' | 'manual' | 'mixed';
  confidence: number; // 0-1
  requiresReview: boolean;
}

export interface SOFTemplate {
  portCallId: string;
  vesselName: string;
  imo: string;
  voyage: string;
  portName: string;
  events: SOFEvent[];
  weatherLog: WeatherLogEntry[];
  delays: DelayEntry[];
  draft: boolean;
  generatedAt: Date;
  notes: string[];
}

export interface SOFEvent {
  timestamp: Date;
  event: string;
  source: 'ais' | 'noon_report' | 'manual';
  confidence: number;
}

export interface WeatherLogEntry {
  date: Date;
  windDirection: string;
  windForce: number;
  seaState: string;
  visibility: string;
  temperature: number;
}

export interface DelayEntry {
  from: Date;
  to: Date;
  type: string;
  reason: string;
  duration: number;
}

class SOFAutoPopulator {
  /**
   * Generate SOF from AIS data and noon reports
   */
  async generateSOF(voyageId: string, portCallId: string): Promise<SOFTemplate> {
    console.log(`🤖 Auto-generating SOF for port call ${portCallId}...`);

    // Get port call details
    const portCall = await prisma.portCall.findUnique({
      where: { id: portCallId },
      include: {
        port: true,
        voyage: {
          include: {
            vessel: true,
          },
        },
      },
    });

    if (!portCall) {
      throw new Error('Port call not found');
    }

    // Extract times from AIS data
    const aisEvents = await this.extractAISEvents(
      portCall.voyage.vessel.id,
      portCall.portId,
      portCall.eta || new Date(),
      portCall.etd || new Date()
    );

    // Extract weather from noon reports
    const weatherLog = await this.extractWeatherFromNoonReports(
      voyageId,
      portCall.eta || new Date(),
      portCall.etd || new Date()
    );

    // Extract delays
    const delays = await this.extractDelays(voyageId, portCallId);

    // Combine all data
    const events = this.combineEvents(aisEvents, portCall);

    // Generate notes for master review
    const notes = this.generateReviewNotes(events, aisEvents);

    const sofTemplate: SOFTemplate = {
      portCallId,
      vesselName: portCall.voyage.vessel.name,
      imo: portCall.voyage.vessel.imo,
      voyage: portCall.voyage.voyageNumber || voyageId,
      portName: portCall.port.name,
      events,
      weatherLog,
      delays,
      draft: true,
      generatedAt: new Date(),
      notes,
    };

    console.log(`✅ SOF generated with ${events.length} events and ${weatherLog.length} weather entries`);

    return sofTemplate;
  }

  /**
   * Extract key events from AIS data
   */
  private async extractAISEvents(
    vesselId: string,
    portId: string,
    etaDate: Date,
    etdDate: Date
  ): Promise<SOFEvent[]> {
    const events: SOFEvent[] = [];

    // Get port coordinates
    const port = await prisma.port.findUnique({
      where: { id: portId },
    });

    if (!port || !port.latitude || !port.longitude) {
      console.log('⚠️  Port coordinates not available, cannot extract AIS events');
      return events;
    }

    const portLat = parseFloat(port.latitude);
    const portLon = parseFloat(port.longitude);

    // Query AIS positions around ETA/ETD times
    const startDate = new Date(etaDate.getTime() - 24 * 60 * 60 * 1000); // 24h before ETA
    const endDate = new Date(etdDate.getTime() + 24 * 60 * 60 * 1000); // 24h after ETD

    const positions = await prisma.vesselPosition.findMany({
      where: {
        vesselId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    if (positions.length === 0) {
      console.log('⚠️  No AIS positions found for date range');
      return events;
    }

    // Analyze positions to detect key events
    let wasMoving = false;
    let wasNearPort = false;

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const distance = this.calculateDistance(pos.latitude, pos.longitude, portLat, portLon);
      const speed = pos.speed || 0;

      // Detect arrival at anchorage (vessel near port, speed drops)
      if (!wasNearPort && distance < 10 && speed < 5) {
        events.push({
          timestamp: pos.timestamp,
          event: 'Vessel arrived at anchorage',
          source: 'ais',
          confidence: 0.8,
        });
        wasNearPort = true;
      }

      // Detect berthing (vessel very close, speed near zero)
      if (wasNearPort && distance < 1 && speed < 1) {
        events.push({
          timestamp: pos.timestamp,
          event: 'All fast / Berthing completed',
          source: 'ais',
          confidence: 0.85,
        });
      }

      // Detect unberthing (speed increase from stationary)
      if (wasNearPort && !wasMoving && speed > 3) {
        events.push({
          timestamp: pos.timestamp,
          event: 'Let go all fast / Departure commenced',
          source: 'ais',
          confidence: 0.8,
        });
        wasMoving = true;
      }

      // Detect departure from port area
      if (wasNearPort && distance > 15 && speed > 8) {
        events.push({
          timestamp: pos.timestamp,
          event: 'Vessel departed port area',
          source: 'ais',
          confidence: 0.85,
        });
        wasNearPort = false;
      }
    }

    return events;
  }

  /**
   * Extract weather data from noon reports
   */
  private async extractWeatherFromNoonReports(
    voyageId: string,
    startDate: Date,
    endDate: Date
  ): Promise<WeatherLogEntry[]> {
    const noonReports = await prisma.noonReport.findMany({
      where: {
        voyageId,
        reportDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { reportDate: 'asc' },
    });

    return noonReports.map((report) => ({
      date: report.reportDate,
      windDirection: report.windDirection || 'N/A',
      windForce: report.windForce || 0,
      seaState: report.seaState || 'N/A',
      visibility: report.visibility || 'N/A',
      temperature: report.airTemperature || 0,
    }));
  }

  /**
   * Extract delays from delay alerts
   */
  private async extractDelays(voyageId: string, portCallId: string): Promise<DelayEntry[]> {
    const delayAlerts = await prisma.delayAlert.findMany({
      where: {
        voyageId,
        // Filter for delays related to this port call
        detectedAt: {
          // Get delays within reasonable time of port call
          // This is a simplified filter - could be enhanced
        },
      },
    });

    return delayAlerts.map((alert) => ({
      from: alert.detectedAt,
      to: alert.resolvedAt || new Date(),
      type: alert.delayType,
      reason: alert.reason || 'Unknown',
      duration: alert.impact || 0,
    }));
  }

  /**
   * Combine AIS events with manual port call data
   */
  private combineEvents(aisEvents: SOFEvent[], portCall: any): SOFEvent[] {
    const events: SOFEvent[] = [...aisEvents];

    // Add manual events from port call
    if (portCall.norTendered) {
      events.push({
        timestamp: portCall.norTendered,
        event: 'Notice of Readiness (NOR) tendered',
        source: 'manual',
        confidence: 1.0,
      });
    }

    if (portCall.ata) {
      events.push({
        timestamp: portCall.ata,
        event: 'Actual Time of Arrival (ATA)',
        source: 'manual',
        confidence: 1.0,
      });
    }

    if (portCall.berthingCompleted) {
      events.push({
        timestamp: portCall.berthingCompleted,
        event: 'Berthing completed',
        source: 'manual',
        confidence: 1.0,
      });
    }

    if (portCall.atd) {
      events.push({
        timestamp: portCall.atd,
        event: 'Actual Time of Departure (ATD)',
        source: 'manual',
        confidence: 1.0,
      });
    }

    // Sort by timestamp
    events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return events;
  }

  /**
   * Generate review notes for master
   */
  private generateReviewNotes(events: SOFEvent[], aisEvents: SOFEvent[]): string[] {
    const notes: string[] = [];

    notes.push('📋 This SOF was auto-generated from AIS data and voyage records.');

    const autoEvents = events.filter((e) => e.source === 'ais').length;
    const manualEvents = events.filter((e) => e.source === 'manual').length;

    if (autoEvents > 0) {
      notes.push(
        `🤖 ${autoEvents} events detected automatically from AIS (confidence ${this.averageConfidence(aisEvents).toFixed(0)}%)`
      );
    }

    if (manualEvents > 0) {
      notes.push(`✍️  ${manualEvents} events recorded manually`);
    }

    if (autoEvents === 0 && manualEvents === 0) {
      notes.push('⚠️  No events found - please review and add events manually');
    }

    notes.push('');
    notes.push('⚠️  IMPORTANT: Please review all auto-detected events for accuracy');
    notes.push('⚠️  Verify timestamps match actual events');
    notes.push('⚠️  Add missing events (pilot on/off, cargo ops, inspections)');
    notes.push('⚠️  Add weather conditions if not captured in noon reports');

    return notes;
  }

  /**
   * Calculate average confidence of events
   */
  private averageConfidence(events: SOFEvent[]): number {
    if (events.length === 0) return 0;
    const sum = events.reduce((acc, e) => acc + e.confidence, 0);
    return (sum / events.length) * 100;
  }

  /**
   * Calculate distance between coordinates (Haversine)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3440.065; // Earth radius in nautical miles
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Format SOF as text for printing/export
   */
  formatSOFAsText(sof: SOFTemplate): string {
    const lines: string[] = [];

    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('                   STATEMENT OF FACTS (DRAFT)');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('');
    lines.push(`Vessel: ${sof.vesselName}`);
    lines.push(`IMO: ${sof.imo}`);
    lines.push(`Voyage: ${sof.voyage}`);
    lines.push(`Port: ${sof.portName}`);
    lines.push(`Generated: ${sof.generatedAt.toISOString()}`);
    lines.push('');
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push('EVENTS TIMELINE');
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push('');

    sof.events.forEach((event) => {
      const source = event.source === 'ais' ? '🤖 AUTO' : '✍️  MANUAL';
      const confidence = event.source === 'ais' ? ` (${(event.confidence * 100).toFixed(0)}%)` : '';
      lines.push(
        `${event.timestamp.toISOString().replace('T', ' ').substring(0, 19)} | ${source}${confidence}`
      );
      lines.push(`  ${event.event}`);
      lines.push('');
    });

    if (sof.weatherLog.length > 0) {
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push('WEATHER LOG');
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push('');
      lines.push('Date       | Wind Dir | Force | Sea State | Visibility | Temp');
      lines.push('-----------|----------|-------|-----------|------------|-----');

      sof.weatherLog.forEach((weather) => {
        const date = weather.date.toISOString().substring(0, 10);
        lines.push(
          `${date} | ${weather.windDirection.padEnd(8)} | ${weather.windForce.toString().padStart(5)} | ${weather.seaState.padEnd(9)} | ${weather.visibility.padEnd(10)} | ${weather.temperature}°C`
        );
      });
      lines.push('');
    }

    if (sof.delays.length > 0) {
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push('DELAYS & INTERRUPTIONS');
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push('');

      sof.delays.forEach((delay) => {
        lines.push(`Type: ${delay.type}`);
        lines.push(`From: ${delay.from.toISOString().replace('T', ' ').substring(0, 19)}`);
        lines.push(`To: ${delay.to.toISOString().replace('T', ' ').substring(0, 19)}`);
        lines.push(`Duration: ${delay.duration.toFixed(2)} hours`);
        lines.push(`Reason: ${delay.reason}`);
        lines.push('');
      });
    }

    if (sof.notes.length > 0) {
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push('REVIEW NOTES');
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push('');
      sof.notes.forEach((note) => lines.push(note));
      lines.push('');
    }

    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('                         END OF SOF DRAFT');
    lines.push('═══════════════════════════════════════════════════════════════');

    return lines.join('\n');
  }

  /**
   * Save SOF to database as a document
   */
  async saveSOFDraft(sof: SOFTemplate, organizationId: string): Promise<string> {
    const textContent = this.formatSOFAsText(sof);

    const doc = await prisma.document.create({
      data: {
        title: `SOF Draft - ${sof.portName} - ${sof.vesselName}`,
        type: 'sof',
        content: textContent,
        metadata: JSON.stringify(sof),
        organizationId,
        status: 'draft',
        tags: ['sof', 'auto-generated', 'draft'],
      },
    });

    console.log(`✅ SOF draft saved as document ${doc.id}`);

    return doc.id;
  }
}

export const sofAutoPopulator = new SOFAutoPopulator();
