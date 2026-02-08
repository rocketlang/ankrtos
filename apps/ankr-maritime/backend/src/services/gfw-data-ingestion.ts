/**
 * GFW SATELLITE AIS DATA INGESTION
 * Fetches satellite AIS from Global Fishing Watch and persists to TimescaleDB
 */

import { prisma } from '../lib/prisma.js';
import { GlobalFishingWatchClient } from './global-fishing-watch-ais.js';

export interface IngestionRegion {
  name: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

// Predefined coverage regions
export const COVERAGE_REGIONS: IngestionRegion[] = [
  {
    name: 'Arabian Sea',
    bounds: { north: 25, south: 5, east: 75, west: 50 },
  },
  {
    name: 'Bay of Bengal',
    bounds: { north: 22, south: 5, east: 95, west: 80 },
  },
  {
    name: 'Indian Ocean Central',
    bounds: { north: 5, south: -10, east: 80, west: 50 },
  },
  {
    name: 'Mediterranean',
    bounds: { north: 45, south: 30, east: 36, west: -6 },
  },
  {
    name: 'Persian Gulf',
    bounds: { north: 30, south: 23, east: 57, west: 48 },
  },
];

export class GFWDataIngestionService {
  private gfwClient: GlobalFishingWatchClient;

  constructor() {
    const apiKey = process.env.GFW_API_KEY;
    if (!apiKey) {
      throw new Error('GFW_API_KEY not configured');
    }
    this.gfwClient = new GlobalFishingWatchClient(apiKey);
  }

  /**
   * Ingest satellite AIS data for a specific region
   */
  async ingestRegion(region: IngestionRegion, hoursBack: number = 24): Promise<{
    region: string;
    vesselsFound: number;
    newVesselsCreated: number;
    positionsIngested: number;
    errors: number;
  }> {
    console.log(`[GFW Ingestion] Starting ingestion for ${region.name}...`);
    const startTime = Date.now();

    let vesselsFound = 0;
    let newVesselsCreated = 0;
    let positionsIngested = 0;
    let errors = 0;

    try {
      // Fetch satellite AIS from GFW
      const gfwVessels = await this.gfwClient.getVesselsInArea(region.bounds, {
        startDate: new Date(Date.now() - hoursBack * 60 * 60 * 1000),
        endDate: new Date(),
      });

      vesselsFound = gfwVessels.length;
      console.log(`[GFW Ingestion] Found ${vesselsFound} vessels from satellite`);

      // Process each vessel
      for (const gfwVessel of gfwVessels) {
        try {
          // Check if vessel exists in database by MMSI
          let vessel = await prisma.vessel.findFirst({
            where: { mmsi: gfwVessel.mmsi },
          });

          // Create vessel if it doesn't exist
          if (!vessel) {
            vessel = await prisma.vessel.create({
              data: {
                mmsi: gfwVessel.mmsi,
                name: gfwVessel.shipname || `Unknown ${gfwVessel.mmsi}`,
                type: 'Unknown', // GFW basic API doesn't provide vessel type
                flag: gfwVessel.flag || 'Unknown',
                // We'll need organization ID - use a default or skip for now
                organizationId: await this.getOrCreateDefaultOrganization(),
              },
            });
            newVesselsCreated++;
            console.log(`[GFW Ingestion] Created new vessel: ${vessel.name} (${vessel.mmsi})`);
          }

          // Check if position already exists (avoid duplicates)
          const existingPosition = await prisma.vesselPosition.findFirst({
            where: {
              vesselId: vessel.id,
              timestamp: new Date(gfwVessel.timestamp),
              source: 'ais_satellite',
            },
          });

          if (!existingPosition) {
            // Create vessel position
            await prisma.vesselPosition.create({
              data: {
                vesselId: vessel.id,
                latitude: gfwVessel.lat,
                longitude: gfwVessel.lon,
                speed: gfwVessel.speed || null,
                course: gfwVessel.course || null,
                heading: null, // GFW doesn't provide heading in basic API
                source: 'ais_satellite', // Mark as satellite source
                timestamp: new Date(gfwVessel.timestamp),
              },
            });
            positionsIngested++;
          }
        } catch (error) {
          console.error(`[GFW Ingestion] Error processing vessel ${gfwVessel.mmsi}:`, error);
          errors++;
        }
      }

      const duration = Date.now() - startTime;
      console.log(`[GFW Ingestion] ${region.name} complete in ${duration}ms`);
      console.log(`  - Vessels found: ${vesselsFound}`);
      console.log(`  - New vessels created: ${newVesselsCreated}`);
      console.log(`  - Positions ingested: ${positionsIngested}`);
      console.log(`  - Errors: ${errors}`);

      return {
        region: region.name,
        vesselsFound,
        newVesselsCreated,
        positionsIngested,
        errors,
      };
    } catch (error) {
      console.error(`[GFW Ingestion] Failed for ${region.name}:`, error);
      return {
        region: region.name,
        vesselsFound: 0,
        newVesselsCreated: 0,
        positionsIngested: 0,
        errors: 1,
      };
    }
  }

  /**
   * Ingest all predefined regions
   */
  async ingestAllRegions(hoursBack: number = 24): Promise<{
    totalVessels: number;
    totalNewVessels: number;
    totalPositions: number;
    totalErrors: number;
    regions: Array<{
      region: string;
      vesselsFound: number;
      newVesselsCreated: number;
      positionsIngested: number;
      errors: number;
    }>;
  }> {
    console.log(`[GFW Ingestion] Starting full ingestion (last ${hoursBack} hours)...`);
    const results = [];

    for (const region of COVERAGE_REGIONS) {
      const result = await this.ingestRegion(region, hoursBack);
      results.push(result);

      // Add delay between regions to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const summary = {
      totalVessels: results.reduce((sum, r) => sum + r.vesselsFound, 0),
      totalNewVessels: results.reduce((sum, r) => sum + r.newVesselsCreated, 0),
      totalPositions: results.reduce((sum, r) => sum + r.positionsIngested, 0),
      totalErrors: results.reduce((sum, r) => sum + r.errors, 0),
      regions: results,
    };

    console.log('\n[GFW Ingestion] SUMMARY:');
    console.log('━'.repeat(60));
    console.log(`Total vessels found: ${summary.totalVessels}`);
    console.log(`New vessels created: ${summary.totalNewVessels}`);
    console.log(`Positions ingested: ${summary.totalPositions}`);
    console.log(`Errors: ${summary.totalErrors}`);
    console.log('━'.repeat(60));

    return summary;
  }

  /**
   * Get or create default organization for satellite-sourced vessels
   */
  private async getOrCreateDefaultOrganization(): Promise<string> {
    const defaultOrg = await prisma.organization.findFirst({
      where: { code: 'SATELLITE_AIS' },
    });

    if (defaultOrg) {
      return defaultOrg.id;
    }

    // Create default org
    const newOrg = await prisma.organization.create({
      data: {
        name: 'Satellite AIS (GFW)',
        code: 'SATELLITE_AIS',
        type: 'system',
        country: 'GLOBAL',
      },
    });

    return newOrg.id;
  }

  /**
   * Clean up old satellite positions (optional - for storage management)
   */
  async cleanupOldSatellitePositions(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const result = await prisma.vesselPosition.deleteMany({
      where: {
        source: 'ais_satellite',
        timestamp: { lt: cutoffDate },
      },
    });

    console.log(`[GFW Cleanup] Deleted ${result.count} old satellite positions (older than ${daysToKeep} days)`);
    return result.count;
  }
}

/**
 * Standalone script to run ingestion
 */
export async function runGFWIngestion() {
  const service = new GFWDataIngestionService();
  const results = await service.ingestAllRegions(24); // Last 24 hours
  return results;
}
