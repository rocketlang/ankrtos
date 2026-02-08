/**
 * Hybrid AIS Coverage Strategy
 * Supplement existing AIS with AISStream.io to fill gaps
 */

import { AISStreamClient } from './free-ais-sources';

export interface AISVessel {
  mmsi: string;
  lat: number;
  lon: number;
  speed?: number;
  course?: number;
  heading?: number;
  name?: string;
  timestamp: Date;
  source: 'primary' | 'aisstream' | 'norwegian' | 'merged';
  quality?: number; // 0-1 confidence score
}

export interface CoverageGap {
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  lastUpdate?: Date;
  vesselCount?: number;
}

/**
 * Intelligent AIS Coverage Manager
 * Uses your existing AIS as primary, fills gaps with AISStream.io
 */
export class HybridAISCoverage {
  private aisstreamClient: AISStreamClient;
  private primarySource: any; // Your existing AIS source
  private coverageCache: Map<string, Date> = new Map();
  private vesselCache: Map<string, AISVessel> = new Map();

  constructor(
    aisstreamApiKey: string,
    primaryAISSource: any
  ) {
    this.aisstreamClient = new AISStreamClient(aisstreamApiKey);
    this.primarySource = primaryAISSource;
  }

  /**
   * Get vessels with intelligent fallback
   * Strategy: Try primary first, fill gaps with AISStream
   */
  async getVesselsWithFallback(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): Promise<AISVessel[]> {
    const results: AISVessel[] = [];
    const vesselsMap = new Map<string, AISVessel>();

    // 1. Get data from your primary AIS source
    try {
      const primaryVessels = await this.getPrimaryVessels(bounds);
      primaryVessels.forEach(v => {
        vesselsMap.set(v.mmsi, { ...v, source: 'primary', quality: 1.0 });
      });

      console.log(`Primary AIS: ${primaryVessels.length} vessels`);
    } catch (error) {
      console.warn('Primary AIS failed, using AISStream only:', error);
    }

    // 2. Detect coverage gaps
    const gaps = this.detectCoverageGaps(bounds, Array.from(vesselsMap.values()));

    if (gaps.length > 0) {
      console.log(`Coverage gaps detected: ${gaps.length} regions`);

      // 3. Fill gaps with AISStream.io
      for (const gap of gaps) {
        try {
          const supplementalVessels = await this.aisstreamClient.getVesselsInArea(gap.bounds, 3000);

          supplementalVessels.forEach((v: any) => {
            if (!vesselsMap.has(v.mmsi)) {
              vesselsMap.set(v.mmsi, { ...v, source: 'aisstream', quality: 0.9 });
            }
          });

          console.log(`Gap filled: ${supplementalVessels.length} vessels from AISStream`);
        } catch (error) {
          console.error('AISStream gap fill failed:', error);
        }
      }
    }

    // 4. Also get full AISStream coverage for comparison/merging
    try {
      const aisstreamAll = await this.aisstreamClient.getVesselsInArea(bounds, 5000);

      aisstreamAll.forEach((v: any) => {
        const existing = vesselsMap.get(v.mmsi);
        if (!existing) {
          // New vessel not in primary
          vesselsMap.set(v.mmsi, { ...v, source: 'aisstream', quality: 0.9 });
        } else if (this.isMoreRecent(v, existing)) {
          // AISStream has newer data - merge
          vesselsMap.set(v.mmsi, this.mergeVesselData(existing, v));
        }
      });

      console.log(`AISStream total: ${aisstreamAll.length} vessels`);
    } catch (error) {
      console.warn('AISStream full coverage failed:', error);
    }

    return Array.from(vesselsMap.values());
  }

  /**
   * Detect geographic areas with poor coverage
   * Uses grid-based analysis to find sparse regions
   */
  private detectCoverageGaps(
    bounds: { north: number; south: number; east: number; west: number },
    vessels: AISVessel[]
  ): CoverageGap[] {
    const gaps: CoverageGap[] = [];

    // Divide area into grid cells
    const gridSize = 4; // 4x4 grid
    const latStep = (bounds.north - bounds.south) / gridSize;
    const lonStep = (bounds.east - bounds.west) / gridSize;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const cellBounds = {
          south: bounds.south + i * latStep,
          north: bounds.south + (i + 1) * latStep,
          west: bounds.west + j * lonStep,
          east: bounds.west + (j + 1) * lonStep
        };

        // Count vessels in this cell
        const cellVessels = vessels.filter(v =>
          v.lat >= cellBounds.south &&
          v.lat <= cellBounds.north &&
          v.lon >= cellBounds.west &&
          v.lon <= cellBounds.east
        );

        // If cell has very few vessels (or none), it's a gap
        // Adjust threshold based on your needs
        const expectedDensity = this.getExpectedVesselDensity(cellBounds);

        if (cellVessels.length < expectedDensity * 0.3) {
          gaps.push({
            bounds: cellBounds,
            vesselCount: cellVessels.length
          });
        }
      }
    }

    return gaps;
  }

  /**
   * Estimate expected vessel density for a region
   * Higher near shipping lanes, ports, coastlines
   */
  private getExpectedVesselDensity(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): number {
    // Simple heuristic: more vessels near equator and major shipping lanes
    // In production, use historical data or shipping lane databases

    const latMid = (bounds.north + bounds.south) / 2;
    const lonMid = (bounds.east + bounds.west) / 2;

    // Major shipping lanes (rough approximations)
    const isSuezRegion = latMid > 20 && latMid < 35 && lonMid > 30 && lonMid < 50;
    const isPanamaRegion = latMid > 5 && latMid < 15 && lonMid > -85 && lonMid < -75;
    const isMalaccaRegion = latMid > -5 && latMid < 10 && lonMid > 95 && lonMid < 110;

    if (isSuezRegion || isPanamaRegion || isMalaccaRegion) {
      return 50; // High traffic
    } else if (Math.abs(latMid) < 30) {
      return 20; // Medium traffic (trade routes)
    } else {
      return 5; // Low traffic (polar/remote regions)
    }
  }

  /**
   * Merge vessel data from multiple sources
   * Prefers more recent, higher quality data
   */
  private mergeVesselData(primary: AISVessel, supplemental: any): AISVessel {
    return {
      mmsi: primary.mmsi,
      lat: supplemental.lat ?? primary.lat,
      lon: supplemental.lon ?? primary.lon,
      speed: supplemental.speed ?? primary.speed,
      course: supplemental.course ?? primary.course,
      heading: supplemental.heading ?? primary.heading,
      name: primary.name || supplemental.name,
      timestamp: new Date(Math.max(
        primary.timestamp.getTime(),
        new Date(supplemental.timestamp).getTime()
      )),
      source: 'merged',
      quality: (primary.quality! + 0.9) / 2 // Average quality
    };
  }

  /**
   * Check if vessel data is more recent
   */
  private isMoreRecent(vessel: any, existing: AISVessel): boolean {
    const vesselTime = new Date(vessel.timestamp).getTime();
    const existingTime = existing.timestamp.getTime();
    return vesselTime > existingTime + 60000; // 1 minute threshold
  }

  /**
   * Get vessels from your existing primary AIS source
   * CUSTOMIZE THIS to match your current AIS API
   */
  private async getPrimaryVessels(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): Promise<AISVessel[]> {
    // TODO: Replace with your actual AIS source API call
    // Examples:

    // If using PostgreSQL/Prisma:
    // const vessels = await prisma.aISPosition.findMany({
    //   where: {
    //     latitude: { gte: bounds.south, lte: bounds.north },
    //     longitude: { gte: bounds.west, lte: bounds.east },
    //     timestamp: { gte: new Date(Date.now() - 3600000) } // Last hour
    //   }
    // });

    // If using HTTP API:
    // const response = await fetch(`${this.primarySource.url}/vessels?bbox=${bounds.west},${bounds.south},${bounds.east},${bounds.north}`);
    // const vessels = await response.json();

    // If using WebSocket cache:
    // const vessels = Array.from(this.vesselCache.values()).filter(v =>
    //   v.lat >= bounds.south && v.lat <= bounds.north &&
    //   v.lon >= bounds.west && v.lon <= bounds.east
    // );

    // Placeholder - replace with your actual implementation
    return this.primarySource.getVessels(bounds);
  }

  /**
   * Real-time hybrid streaming
   * Combines your primary AIS stream with AISStream.io
   */
  createHybridStream(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) {
    // Start AISStream.io WebSocket
    const aisstreamWs = this.aisstreamClient.createStream({
      bbox: [[bounds.west, bounds.south], [bounds.east, bounds.north]]
    });

    aisstreamWs.on('message', (data: string) => {
      try {
        const message = JSON.parse(data);
        const mmsi = message.MetaData?.MMSI;

        if (mmsi && message.Message?.PositionReport) {
          const vessel: AISVessel = {
            mmsi,
            lat: message.Message.PositionReport.Latitude,
            lon: message.Message.PositionReport.Longitude,
            speed: message.Message.PositionReport.Sog,
            course: message.Message.PositionReport.Cog,
            heading: message.Message.PositionReport.TrueHeading,
            name: message.MetaData.ShipName,
            timestamp: new Date(message.MetaData.time_utc),
            source: 'aisstream',
            quality: 0.9
          };

          // Only update if we don't have this vessel from primary source
          // or if AISStream data is newer
          const existing = this.vesselCache.get(mmsi);
          if (!existing || this.isMoreRecent(vessel, existing)) {
            this.vesselCache.set(mmsi, vessel);

            // Emit update event
            this.emitVesselUpdate(vessel);
          }
        }
      } catch (error) {
        console.error('Failed to process AISStream message:', error);
      }
    });

    // TODO: Also connect to your primary AIS stream
    // this.primarySource.createStream(bounds).on('message', (vessel) => {
    //   this.vesselCache.set(vessel.mmsi, { ...vessel, source: 'primary', quality: 1.0 });
    //   this.emitVesselUpdate(vessel);
    // });

    return aisstreamWs;
  }

  /**
   * Emit vessel update to subscribers
   * Integrate with your existing event system
   */
  private emitVesselUpdate(vessel: AISVessel) {
    // TODO: Integrate with your GraphQL subscriptions or WebSocket server
    // Example:
    // pubsub.publish('VESSEL_UPDATE', { vesselUpdate: vessel });
    console.log(`Vessel update: ${vessel.mmsi} from ${vessel.source}`);
  }

  /**
   * Get coverage statistics
   */
  async getCoverageStats(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) {
    const vessels = await this.getVesselsWithFallback(bounds);

    const stats = {
      total: vessels.length,
      bySource: {
        primary: vessels.filter(v => v.source === 'primary').length,
        aisstream: vessels.filter(v => v.source === 'aisstream').length,
        merged: vessels.filter(v => v.source === 'merged').length
      },
      coverageImprovement: 0,
      gaps: [] as CoverageGap[]
    };

    const primaryOnly = stats.bySource.primary;
    const improvement = ((stats.total - primaryOnly) / primaryOnly) * 100;
    stats.coverageImprovement = Math.round(improvement);

    return stats;
  }
}

/**
 * Example Usage for Mari8x
 */
export async function setupHybridCoverage() {
  // Your existing AIS source (customize this!)
  const primaryAIS = {
    async getVessels(bounds: any) {
      // Replace with your actual AIS API
      // Could be: Prisma query, HTTP API, WebSocket cache, etc.
      return [];
    }
  };

  // Create hybrid coverage manager
  const coverage = new HybridAISCoverage(
    process.env.AISSTREAM_API_KEY!,
    primaryAIS
  );

  // Get vessels with automatic gap filling
  const bounds = {
    north: 25,
    south: -10,
    east: 80,
    west: 40
  };

  const vessels = await coverage.getVesselsWithFallback(bounds);
  console.log(`Total vessels: ${vessels.length}`);

  // Get coverage statistics
  const stats = await coverage.getCoverageStats(bounds);
  console.log('Coverage improvement:', stats.coverageImprovement + '%');
  console.log('By source:', stats.bySource);

  // Start real-time hybrid stream
  const stream = coverage.createHybridStream(bounds);

  return { coverage, vessels, stats, stream };
}
