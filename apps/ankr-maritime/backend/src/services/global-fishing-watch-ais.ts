/**
 * Global Fishing Watch FREE Satellite AIS Integration
 * Fills coverage gaps in Arabian Sea, Indian Ocean, remote areas
 *
 * Website: https://globalfishingwatch.org/our-apis/
 * Docs: https://globalfishingwatch.org/our-apis/documentation
 *
 * FREE for non-commercial use!
 * Coverage: Global satellite + terrestrial AIS
 * Data: 110M messages/day, historical from 2012
 */

import { prisma } from '../lib/prisma.js';

export interface GFWVessel {
  id: string;
  mmsi: string;
  shipname: string;
  flag: string;
  timestamp: string;
  lat: number;
  lon: number;
  speed?: number;
  course?: number;
}

export interface GFWSearchParams {
  datasets?: string[];
  bbox?: string; // "min_lon,min_lat,max_lon,max_lat"
  startDate?: string; // ISO format
  endDate?: string;
  mmsi?: string;
}

/**
 * Global Fishing Watch API Client
 * FREE satellite AIS data - perfect for Arabian Sea coverage!
 */
export class GlobalFishingWatchClient {
  private baseUrl = 'https://gateway.api.globalfishingwatch.org/v3';
  private apiKey: string;

  constructor(apiKey?: string) {
    // API key optional for public data, required for advanced features
    this.apiKey = apiKey || process.env.GFW_API_KEY || '';
  }

  /**
   * Get vessels in bounding box
   * PERFECT for Arabian Sea: bbox = "50,-5,80,30"
   */
  async getVesselsInArea(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }, options?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<GFWVessel[]> {
    const bbox = `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`;

    // Use events API to get vessel positions
    const params = new URLSearchParams({
      datasets: 'public-global-all-vessels:latest', // All vessels dataset
      'start-date': options?.startDate?.toISOString() || new Date(Date.now() - 86400000).toISOString(), // Last 24h
      'end-date': options?.endDate?.toISOString() || new Date().toISOString(),
      bbox
    });

    const url = `${this.baseUrl}/events?${params}`;

    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(url, { headers });

      if (!response.ok) {
        console.error(`GFW API error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();

      // Transform GFW format to our standard format
      return this.transformGFWData(data);
    } catch (error) {
      console.error('GFW API request failed:', error);
      return [];
    }
  }

  /**
   * Get vessel positions via 4Wings API (tile-based)
   * More efficient for large areas like entire Arabian Sea
   */
  async getVesselTiles(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }, zoom: number = 3): Promise<any> {
    // 4Wings API provides aggregated vessel activity tiles
    const url = `${this.baseUrl}/4wings/tile/heatmap`;

    const params = new URLSearchParams({
      datasets: 'public-global-all-vessels:latest',
      'temporal-aggregation': 'true',
      'spatial-resolution': 'low', // low/medium/high
      date: new Date().toISOString().split('T')[0],
      format: 'json'
    });

    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(`${url}?${params}`, { headers });
      return response.json();
    } catch (error) {
      console.error('GFW 4Wings API failed:', error);
      return null;
    }
  }

  /**
   * Search for specific vessel by MMSI
   */
  async searchVessel(mmsi: string): Promise<GFWVessel | null> {
    const url = `${this.baseUrl}/vessels/search?query=${mmsi}&datasets=public-global-all-vessels:latest`;

    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(url, { headers });
      const data = await response.json();

      if (data.entries && data.entries.length > 0) {
        return this.transformGFWVessel(data.entries[0]);
      }

      return null;
    } catch (error) {
      console.error('GFW vessel search failed:', error);
      return null;
    }
  }

  /**
   * Get historical vessel track
   * Great for backfilling data in Arabian Sea
   */
  async getVesselTrack(
    mmsi: string,
    startDate: Date,
    endDate: Date
  ): Promise<GFWVessel[]> {
    const url = `${this.baseUrl}/vessels/${mmsi}/tracks`;

    const params = new URLSearchParams({
      datasets: 'public-global-all-vessels:latest',
      'start-date': startDate.toISOString(),
      'end-date': endDate.toISOString()
    });

    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(`${url}?${params}`, { headers });
      const data = await response.json();
      return this.transformGFWData(data);
    } catch (error) {
      console.error('GFW vessel track failed:', error);
      return [];
    }
  }

  /**
   * Transform GFW data format to our standard vessel format
   */
  private transformGFWData(data: any): GFWVessel[] {
    if (!data.entries) return [];

    return data.entries.map((entry: any) => ({
      id: entry.id,
      mmsi: entry.mmsi || entry.vessel?.mmsi,
      shipname: entry.shipname || entry.vessel?.shipname || `Unknown ${entry.mmsi}`,
      flag: entry.flag || entry.vessel?.flag || 'Unknown',
      timestamp: entry.start || entry.timestamp,
      lat: entry.position?.lat || entry.lat,
      lon: entry.position?.lon || entry.lon,
      speed: entry.speed,
      course: entry.course
    })).filter((v: GFWVessel) => v.lat && v.lon);
  }

  private transformGFWVessel(vessel: any): GFWVessel {
    return {
      id: vessel.id,
      mmsi: vessel.mmsi,
      shipname: vessel.shipname || `Unknown ${vessel.mmsi}`,
      flag: vessel.flag || 'Unknown',
      timestamp: vessel.lastTransmissionDate || new Date().toISOString(),
      lat: 0, // Need to fetch positions separately
      lon: 0,
      speed: 0,
      course: 0
    };
  }
}

/**
 * Hybrid Coverage: AISStream (terrestrial) + GFW (satellite)
 * Perfect for filling Arabian Sea gaps!
 */
export class HybridAISWithSatellite {
  private gfwClient: GlobalFishingWatchClient;

  constructor(gfwApiKey?: string) {
    this.gfwClient = new GlobalFishingWatchClient(gfwApiKey);
  }

  /**
   * Get comprehensive coverage combining terrestrial + satellite
   * Use this for Arabian Sea to fill gaps!
   */
  async getComprehensiveCoverage(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) {
    const vesselsMap = new Map<string, any>();

    // 1. Get terrestrial AIS from your database (AISStream data)
    const terrestrialVessels = await prisma.vesselPosition.findMany({
      where: {
        latitude: { gte: bounds.south, lte: bounds.north },
        longitude: { gte: bounds.west, lte: bounds.east },
        timestamp: { gte: new Date(Date.now() - 3600000) } // Last hour
      },
      include: {
        vessel: true
      },
      orderBy: { timestamp: 'desc' },
      distinct: ['vesselId']
    });

    // Add terrestrial vessels
    terrestrialVessels.forEach(pos => {
      vesselsMap.set(pos.vessel.mmsi, {
        mmsi: pos.vessel.mmsi,
        name: pos.vessel.name,
        lat: pos.latitude,
        lon: pos.longitude,
        speed: pos.speed,
        course: pos.course,
        timestamp: pos.timestamp,
        source: 'terrestrial',
        quality: 1.0
      });
    });

    console.log(`Terrestrial AIS: ${terrestrialVessels.length} vessels`);

    // 2. Fill gaps with satellite AIS from Global Fishing Watch
    try {
      const satelliteVessels = await this.gfwClient.getVesselsInArea(bounds, {
        startDate: new Date(Date.now() - 86400000), // Last 24h
        endDate: new Date()
      });

      let newVesselsCount = 0;

      satelliteVessels.forEach(gfwVessel => {
        if (!vesselsMap.has(gfwVessel.mmsi)) {
          vesselsMap.set(gfwVessel.mmsi, {
            mmsi: gfwVessel.mmsi,
            name: gfwVessel.shipname,
            lat: gfwVessel.lat,
            lon: gfwVessel.lon,
            speed: gfwVessel.speed,
            course: gfwVessel.course,
            timestamp: new Date(gfwVessel.timestamp),
            source: 'satellite',
            quality: 0.85 // Satellite slightly less frequent updates
          });
          newVesselsCount++;
        }
      });

      console.log(`Satellite AIS: +${newVesselsCount} new vessels from GFW`);
    } catch (error) {
      console.error('GFW satellite data fetch failed:', error);
    }

    const allVessels = Array.from(vesselsMap.values());

    return {
      vessels: allVessels,
      stats: {
        total: allVessels.length,
        terrestrial: allVessels.filter(v => v.source === 'terrestrial').length,
        satellite: allVessels.filter(v => v.source === 'satellite').length,
        improvement: terrestrialVessels.length > 0
          ? Math.round(((allVessels.length - terrestrialVessels.length) / terrestrialVessels.length) * 100)
          : 100
      }
    };
  }
}

/**
 * Example usage for Arabian Sea
 */
export async function testArabianSeaCoverage() {
  const hybrid = new HybridAISWithSatellite();

  // Arabian Sea bounding box
  const arabianSea = {
    north: 25,    // Pakistan coast
    south: 5,     // Lakshadweep
    east: 75,     // Indian coast
    west: 50      // Oman coast
  };

  console.log('🌊 Testing Arabian Sea coverage...');

  const result = await hybrid.getComprehensiveCoverage(arabianSea);

  console.log(`
📊 Arabian Sea Coverage Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total vessels: ${result.stats.total}
Terrestrial:   ${result.stats.terrestrial}
Satellite:     ${result.stats.satellite}
Improvement:   +${result.stats.improvement}%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  return result;
}
