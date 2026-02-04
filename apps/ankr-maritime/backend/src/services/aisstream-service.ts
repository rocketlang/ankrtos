/**
 * AISstream.io WebSocket Integration
 * FREE real-time AIS vessel tracking
 *
 * Documentation: https://aisstream.io/documentation
 */

import WebSocket from 'ws';
import { prisma } from '../lib/prisma.js';
import { publishVesselPosition } from '../schema/subscriptions.js';
import { portCongestionDetector } from './port-congestion-detector.js';

interface AISStreamSubscription {
  APIKey: string;
  BoundingBoxes: number[][][]; // [[[lat1, lon1], [lat2, lon2]]]
  FiltersShipMMSI?: string[];
  FilterMessageTypes?: string[];
}

interface AISPosition {
  MessageType: string;
  MetaData: {
    MMSI: number;
    ShipName?: string;
    latitude: number;
    longitude: number;
    time_utc: string;
  };
  Message: {
    PositionReport?: {
      Latitude: number;
      Longitude: number;
      Sog: number; // Speed over ground
      Cog: number; // Course over ground
      TrueHeading: number;
      NavigationalStatus: number;
      Timestamp: number;
      RateOfTurn?: number; // Priority 1: Rate of turn
      PositionAccuracy?: boolean; // Priority 1: GPS accuracy
      SpecialManoeuvreIndicator?: number; // Priority 1: Special maneuver (correct field name!)
      Raim?: boolean; // Priority 1: RAIM flag
    };
    ShipStaticData?: {
      Name: string;
      CallSign: string;
      ImoNumber: number;
      Type: number;
      Destination: string;
      MaximumStaticDraught?: number; // Priority 1: Current draught in meters (correct field name!)
      Dimension?: {
        A?: number; // Distance to bow
        B?: number; // Distance to stern
        C?: number; // Distance to port
        D?: number; // Distance to starboard
      };
    };
  };
}

export class AISStreamService {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnected = false;
  private messageCount = 0;
  private lastMessageTime: Date | null = null;

  /**
   * Connect to AISstream WebSocket
   */
  async connect(options?: {
    boundingBoxes?: number[][][];
    mmsiFilter?: string[];
    messageTypes?: string[];
  }): Promise<void> {
    const apiKey = process.env.AISSTREAM_API_KEY;
    if (!apiKey) {
      throw new Error('AISSTREAM_API_KEY not configured');
    }

    // Default: Global coverage
    const boundingBoxes = options?.boundingBoxes || [
      [[-90, -180], [90, 180]] // Entire world
    ];

    // Default: Position reports only
    const messageTypes = options?.messageTypes || ['PositionReport', 'ShipStaticData'];

    console.log('🌊 Connecting to AISstream.io...');

    this.ws = new WebSocket('wss://stream.aisstream.io/v0/stream');

    this.ws.on('open', () => {
      console.log('✅ AISstream connected!');

      // Send subscription message (must be within 3 seconds)
      const subscription: AISStreamSubscription = {
        APIKey: apiKey,
        BoundingBoxes: boundingBoxes,
        FilterMessageTypes: messageTypes,
      };

      if (options?.mmsiFilter) {
        subscription.FiltersShipMMSI = options.mmsiFilter;
      }

      this.ws!.send(JSON.stringify(subscription));
      console.log('📡 Subscription sent:', {
        boundingBoxes: boundingBoxes.length,
        messageTypes,
        mmsiFilter: options?.mmsiFilter?.length || 'all'
      });

      this.isConnected = true;
    });

    this.ws.on('message', async (data: WebSocket.Data) => {
      this.messageCount++;
      this.lastMessageTime = new Date();

      try {
        const message: AISPosition = JSON.parse(data.toString());
        await this.processAISMessage(message);
      } catch (error) {
        console.error('❌ Error processing AIS message:', error);
      }

      // Log stats every 100 messages
      if (this.messageCount % 100 === 0) {
        console.log(`📊 AIS Stats: ${this.messageCount} messages processed`);
      }
    });

    this.ws.on('error', (error) => {
      console.error('❌ AISstream error:', error.message);
    });

    this.ws.on('close', () => {
      console.log('🔌 AISstream disconnected');
      this.isConnected = false;

      // Auto-reconnect after 5 seconds
      console.log('🔄 Reconnecting in 5 seconds...');
      this.reconnectTimer = setTimeout(() => {
        this.connect(options);
      }, 5000);
    });
  }

  /**
   * Process incoming AIS message
   */
  private async processAISMessage(message: AISPosition): Promise<void> {
    const { MessageType, MetaData, Message } = message;

    if (MessageType === 'PositionReport' && Message.PositionReport) {
      await this.handlePositionReport(MetaData, Message.PositionReport);
    } else if (MessageType === 'ShipStaticData' && Message.ShipStaticData) {
      await this.handleShipStaticData(MetaData, Message.ShipStaticData);
    }
  }

  /**
   * Handle position report
   */
  private async handlePositionReport(
    metadata: AISPosition['MetaData'],
    position: NonNullable<AISPosition['Message']['PositionReport']>
  ): Promise<void> {
    const mmsi = metadata.MMSI.toString();

    // Check if vessel exists
    let vessel = await prisma.vessel.findFirst({
      where: { mmsi }
    });

    // Create vessel if not exists
    if (!vessel) {
      vessel = await prisma.vessel.create({
        data: {
          mmsi,
          name: metadata.ShipName || `Vessel ${mmsi}`,
          imo: `AIS-${mmsi}`, // Unique placeholder until IMO is available from ShipStaticData
          type: 'general_cargo', // Default type
          flag: 'Unknown',
          vesselType: 'Unknown',
          organizationId: 'system', // System organization
        }
      });
      console.log(`🆕 New vessel: ${vessel.name} (${mmsi})`);
    }

    // Store position in database (7-day rolling window)
    try {
      const savedPosition = await prisma.vesselPosition.create({
        data: {
          vesselId: vessel.id,
          latitude: metadata.latitude,
          longitude: metadata.longitude,
          speed: position.Sog,
          course: position.Cog,
          heading: position.TrueHeading,
          status: this.getNavStatus(position.NavigationalStatus),
          source: 'ais_terrestrial',
          timestamp: new Date(metadata.time_utc),
          // Priority 1 fields
          rateOfTurn: position.RateOfTurn !== undefined ? position.RateOfTurn : null,
          navigationStatus: position.NavigationalStatus,
          positionAccuracy: position.PositionAccuracy !== undefined ? position.PositionAccuracy : null,
          maneuverIndicator: position.SpecialManoeuvreIndicator !== undefined ? position.SpecialManoeuvreIndicator : null,
          raimFlag: position.Raim !== undefined ? position.Raim : null,
          timestampSeconds: position.Timestamp,
        },
      });

      // Publish to real-time WebSocket subscribers
      publishVesselPosition({
        ...savedPosition,
        vesselName: vessel.name,
        imo: vessel.imo,
        vesselType: vessel.type,
        organizationId: vessel.organizationId,
      });

      // Port congestion detection
      const navStatus = this.getNavStatus(position.NavigationalStatus);
      await portCongestionDetector.processVesselPosition(
        vessel.id,
        { lat: metadata.latitude, lng: metadata.longitude },
        navStatus,
        new Date(metadata.time_utc)
      );

      // Check if vessel is moving (SOG > 3 knots) - mark as departed
      if (position.Sog > 3) {
        await portCongestionDetector.processVesselDeparture(
          vessel.id,
          new Date(metadata.time_utc)
        );
      }

      console.log(`📍 ${vessel.name}: ${metadata.latitude.toFixed(4)}, ${metadata.longitude.toFixed(4)} | Speed: ${position.Sog} knots`);
    } catch (error: any) {
      // Silently fail if position storage fails (don't crash AIS stream)
      if (this.messageCount % 100 === 0) {
        console.error(`⚠️  Position storage error: ${error.message}`);
      }
    }
  }

  /**
   * Handle ship static data
   */
  private async handleShipStaticData(
    metadata: AISPosition['MetaData'],
    staticData: NonNullable<AISPosition['Message']['ShipStaticData']>
  ): Promise<void> {
    const mmsi = metadata.MMSI.toString();

    // Calculate LOA and Beam from AIS dimensions
    let loa: number | undefined;
    let beam: number | undefined;
    let draft: number | undefined;

    if (staticData.Dimension) {
      // LOA = Distance to bow + Distance to stern
      if (staticData.Dimension.A !== undefined && staticData.Dimension.B !== undefined) {
        loa = staticData.Dimension.A + staticData.Dimension.B;
      }
      // Beam = Distance to port + Distance to starboard
      if (staticData.Dimension.C !== undefined && staticData.Dimension.D !== undefined) {
        beam = staticData.Dimension.C + staticData.Dimension.D;
      }
    }

    // Draught/Draft (already in meters from AISstream)
    if (staticData.MaximumStaticDraught !== undefined && staticData.MaximumStaticDraught > 0) {
      draft = staticData.MaximumStaticDraught;
    }

    // Update vessel with static data
    const mappedType = this.getVesselType(staticData.Type);
    const vessel = await prisma.vessel.upsert({
      where: { mmsi },
      create: {
        mmsi,
        name: staticData.Name,
        imo: staticData.ImoNumber?.toString() || '0',
        type: this.mapToStandardType(mappedType),
        flag: 'Unknown', // Can be derived from MMSI
        vesselType: mappedType,
        organizationId: 'system',
        // Add vessel dimensions from AIS Message Type 5
        loa: loa,
        beam: beam,
        draft: draft,
      },
      update: {
        name: staticData.Name,
        imo: staticData.ImoNumber?.toString() || '0',
        type: this.mapToStandardType(mappedType),
        vesselType: mappedType,
        // Update dimensions if we have new data
        ...(loa !== undefined && { loa }),
        ...(beam !== undefined && { beam }),
        ...(draft !== undefined && { draft }),
      }
    });

    // Store vessel characteristics (draught and dimensions) in position record
    // These change over time (cargo loading/unloading, ballast adjustment)
    if (staticData.Draught || staticData.Dimension) {
      try {
        await prisma.vesselPosition.create({
          data: {
            vesselId: vessel.id,
            latitude: metadata.latitude,
            longitude: metadata.longitude,
            source: 'ais_terrestrial',
            timestamp: new Date(metadata.time_utc),
            // Priority 1: Vessel characteristics from Type 5
            draught: staticData.MaximumStaticDraught !== undefined ? staticData.MaximumStaticDraught : null, // Already in meters
            dimensionToBow: staticData.Dimension?.A || null,
            dimensionToStern: staticData.Dimension?.B || null,
            dimensionToPort: staticData.Dimension?.C || null,
            dimensionToStarboard: staticData.Dimension?.D || null,
          },
        });
        console.log(`📐 Position dimensions for ${staticData.Name}: draught=${staticData.MaximumStaticDraught || 'N/A'}m`);
      } catch (error: any) {
        // Silently fail if position storage fails
        console.error(`⚠️  Dimension storage error: ${error.message}`);
      }
    }

    // Log vessel update with dimensions
    const dims = [];
    if (loa) dims.push(`LOA=${loa.toFixed(1)}m`);
    if (beam) dims.push(`Beam=${beam.toFixed(1)}m`);
    if (draft) dims.push(`Draft=${draft.toFixed(1)}m`);
    const dimStr = dims.length > 0 ? ` [${dims.join(', ')}]` : '';
    console.log(`🚢 Updated vessel: ${staticData.Name} (IMO: ${staticData.ImoNumber})${dimStr}`);
  }

  /**
   * Convert AIS vessel type code to string
   */
  private getVesselType(code: number): string {
    const types: Record<number, string> = {
      70: 'Cargo',
      71: 'Cargo - Hazardous',
      72: 'Cargo - Hazardous',
      73: 'Cargo - Hazardous',
      74: 'Cargo - Hazardous',
      79: 'Cargo',
      80: 'Tanker',
      81: 'Tanker - Hazardous',
      82: 'Tanker - Hazardous',
      83: 'Tanker - Hazardous',
      84: 'Tanker - Hazardous',
      89: 'Tanker',
      // Add more types as needed
    };
    return types[code] || 'Other';
  }

  /**
   * Map AIS vessel type to standard vessel type
   */
  private mapToStandardType(aisType: string): string {
    if (aisType.includes('Tanker')) return 'tanker';
    if (aisType.includes('Cargo')) return 'general_cargo';
    if (aisType.includes('Container')) return 'container';
    if (aisType.includes('Bulk')) return 'bulk_carrier';
    return 'general_cargo'; // Default
  }

  /**
   * Convert AIS navigation status code to string
   */
  private getNavStatus(code: number): string {
    const statuses: Record<number, string> = {
      0: 'underway',
      1: 'at_anchor',
      2: 'not_under_command',
      3: 'restricted_maneuverability',
      4: 'constrained_by_draught',
      5: 'moored',
      6: 'aground',
      7: 'fishing',
      8: 'underway_sailing',
      15: 'undefined',
    };
    return statuses[code] || 'unknown';
  }

  /**
   * Update subscription (change bounding boxes or filters)
   */
  async updateSubscription(options: {
    boundingBoxes?: number[][][];
    mmsiFilter?: string[];
    messageTypes?: string[];
  }): Promise<void> {
    if (!this.ws || !this.isConnected) {
      throw new Error('Not connected to AISstream');
    }

    const apiKey = process.env.AISSTREAM_API_KEY!;
    const subscription: AISStreamSubscription = {
      APIKey: apiKey,
      BoundingBoxes: options.boundingBoxes || [[[-90, -180], [90, 180]]],
      FilterMessageTypes: options.messageTypes || ['PositionReport', 'ShipStaticData'],
    };

    if (options.mmsiFilter) {
      subscription.FiltersShipMMSI = options.mmsiFilter;
    }

    this.ws.send(JSON.stringify(subscription));
    console.log('📡 Subscription updated');
  }

  /**
   * Disconnect from AISstream
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    console.log('🔌 AISstream disconnected');
  }

  /**
   * Get connection stats
   */
  getStats() {
    return {
      connected: this.isConnected,
      messageCount: this.messageCount,
      lastMessageTime: this.lastMessageTime,
      messagesPerMinute: this.lastMessageTime
        ? Math.round(this.messageCount / ((Date.now() - this.lastMessageTime.getTime()) / 60000))
        : 0
    };
  }
}

// Singleton instance
export const aisStreamService = new AISStreamService();
