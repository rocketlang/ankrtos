/**
 * Global Fishing Watch API Integration - FIXED
 *
 * What GFW Provides:
 * - Vessel identity & registry (MMSI, IMO, flag, type)
 * - Fishing events (loitering, fishing, port visits)
 * - Aggregated vessel presence (hourly heatmaps)
 *
 * What GFW DOESN'T Provide:
 * - Real-time vessel positions (use AISstream.io for that)
 * - Continuous vessel tracks
 *
 * Best Use Cases:
 * - Vessel identification (MMSI → Name, Flag, Type)
 * - Fishing activity analysis
 * - Historical presence patterns
 * - Vessel registry enrichment
 */

import { prisma } from '../lib/prisma.js';

export interface GFWVessel {
  vesselId: string;
  ssvid: string; // MMSI
  shipname: string | null;
  flag: string | null;
  imo: string | null;
  callsign: string | null;
  geartypes: string[];
  shiptypes: string[];
  transmissionDateFrom: string;
  transmissionDateTo: string;
}

export interface GFWEvent {
  id: string;
  type: string; // 'fishing', 'loitering', 'port_visit', 'encounter'
  start: string;
  end: string;
  position: {
    lat: number;
    lon: number;
  };
  vessel: {
    ssvid: string;
    name: string | null;
    flag: string | null;
  };
}

/**
 * Global Fishing Watch API Client
 * Focus: Vessel Identity & Fishing Events
 */
export class GlobalFishingWatchClient {
  private baseUrl = 'https://gateway.api.globalfishingwatch.org/v3';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GFW_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('GFW_API_KEY is required');
    }
  }

  /**
   * Search for vessels by MMSI, IMO, or name
   * Use this to enrich vessel data in our database
   */
  async searchVessel(query: string): Promise<GFWVessel | null> {
    const url = `${this.baseUrl}/vessels/search?query=${query}&datasets[0]=public-global-vessel-identity:latest`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`GFW vessel search failed: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (!data.entries || data.entries.length === 0) {
        return null;
      }

      const entry = data.entries[0];
      const selfReported = entry.selfReportedInfo?.[0];
      const combined = entry.combinedSourcesInfo?.[0];

      if (!selfReported) {
        return null;
      }

      return {
        vesselId: selfReported.id,
        ssvid: selfReported.ssvid,
        shipname: selfReported.shipname,
        flag: selfReported.flag,
        imo: selfReported.imo,
        callsign: selfReported.callsign,
        geartypes: combined?.geartypes?.map((g: any) => g.name) || [],
        shiptypes: combined?.shiptypes?.map((s: any) => s.name) || [],
        transmissionDateFrom: selfReported.transmissionDateFrom,
        transmissionDateTo: selfReported.transmissionDateTo,
      };
    } catch (error) {
      console.error('GFW vessel search error:', error);
      return null;
    }
  }

  /**
   * Get events for a specific dataset and time period
   * Returns events with positions (fishing, port visits, loitering, etc.)
   */
  async getEvents(params: {
    dataset: string;
    startDate: Date;
    endDate: Date;
    limit?: number;
    offset?: number;
  }): Promise<GFWEvent[]> {
    const { dataset, startDate, endDate, limit = 100, offset = 0 } = params;

    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];

    const url = `${this.baseUrl}/events?` +
      `datasets[0]=${dataset}&` +
      `start-date=${start}&` +
      `end-date=${end}&` +
      `limit=${limit}&` +
      `offset=${offset}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`GFW events API failed: ${response.status}`);
        return [];
      }

      const data = await response.json();

      return data.entries?.map((event: any) => ({
        id: event.id,
        type: event.type,
        start: event.start,
        end: event.end,
        position: event.position,
        vessel: {
          ssvid: event.vessel?.ssvid,
          name: event.vessel?.name,
          flag: event.vessel?.flag,
        },
      })) || [];
    } catch (error) {
      console.error('GFW events API error:', error);
      return [];
    }
  }

  /**
   * Get fishing events for a specific region and time period
   * Returns events with positions (useful for fishing activity analysis)
   */
  async getFishingEvents(params: {
    startDate: Date;
    endDate: Date;
    limit?: number;
    offset?: number;
  }): Promise<GFWEvent[]> {
    return this.getEvents({
      dataset: 'public-global-fishing-events:latest',
      ...params,
    });
  }

  /**
   * Get port visit events
   */
  async getPortVisits(params: {
    startDate: Date;
    endDate: Date;
    limit?: number;
    offset?: number;
  }): Promise<GFWEvent[]> {
    return this.getEvents({
      dataset: 'public-global-port-visits-c2-events:latest',
      ...params,
    });
  }

  /**
   * Get loitering events
   */
  async getLoiteringEvents(params: {
    startDate: Date;
    endDate: Date;
    limit?: number;
    offset?: number;
  }): Promise<GFWEvent[]> {
    return this.getEvents({
      dataset: 'public-global-loitering-events:latest',
      ...params,
    });
  }

  /**
   * Enrich vessel data in our database with GFW registry info
   * Use this to fill in missing vessel details (name, flag, type)
   */
  async enrichVesselByMMSI(mmsi: string): Promise<boolean> {
    try {
      const gfwVessel = await this.searchVessel(mmsi);

      if (!gfwVessel) {
        console.log(`No GFW data found for MMSI ${mmsi}`);
        return false;
      }

      // Find vessel in our database
      const vessel = await prisma.vessel.findFirst({
        where: { mmsi },
      });

      if (!vessel) {
        console.log(`Vessel ${mmsi} not in our database`);
        return false;
      }

      // Update with GFW data
      await prisma.vessel.update({
        where: { id: vessel.id },
        data: {
          name: gfwVessel.shipname || vessel.name,
          flag: gfwVessel.flag || vessel.flag,
          imo: gfwVessel.imo || vessel.imo,
          callsign: gfwVessel.callsign || vessel.callsign,
          // Type mapping (GFW types to our types)
          type: this.mapVesselType(gfwVessel.shiptypes[0]) || vessel.type,
        },
      });

      console.log(`✅ Enriched vessel ${mmsi} with GFW data`);
      return true;
    } catch (error) {
      console.error(`Error enriching vessel ${mmsi}:`, error);
      return false;
    }
  }

  /**
   * Map GFW ship types to our vessel types
   */
  private mapVesselType(gfwType: string): string {
    const mapping: Record<string, string> = {
      'CARGO': 'Cargo',
      'TANKER': 'Tanker',
      'CONTAINER': 'Container',
      'PASSENGER': 'Passenger',
      'FISHING': 'Fishing',
      'TUG': 'Tug',
      'OTHER': 'Other',
    };

    return mapping[gfwType] || 'Other';
  }
}

/**
 * Example: Enrich all vessels in database with GFW data
 */
export async function enrichAllVessels(limit: number = 100): Promise<{
  total: number;
  enriched: number;
  failed: number;
}> {
  const client = new GlobalFishingWatchClient();

  const vessels = await prisma.vessel.findMany({
    where: {
      mmsi: { not: null },
    },
    take: limit,
  });

  let enriched = 0;
  let failed = 0;

  for (const vessel of vessels) {
    if (!vessel.mmsi) continue;

    const success = await client.enrichVesselByMMSI(vessel.mmsi);
    if (success) {
      enriched++;
    } else {
      failed++;
    }

    // Rate limiting: wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n📊 Enrichment Summary:`);
  console.log(`Total vessels: ${vessels.length}`);
  console.log(`Enriched: ${enriched}`);
  console.log(`Failed: ${failed}`);

  return {
    total: vessels.length,
    enriched,
    failed,
  };
}
