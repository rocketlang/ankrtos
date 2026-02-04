import axios from 'axios';
import { prisma } from '../schema/context.js';
import pino from 'pino';

const logger = pino({ name: 'norwegian-maritime-api' });

const NORWEGIAN_API_BASE = 'https://www.sdir.no/api';

export interface NorwegianVesselData {
  imo: string;
  mmsi?: string;
  name?: string;
  callSign?: string;
  flag?: string;
  shipType?: string;
  grossTonnage?: number;
  deadweight?: number;
  lengthOverall?: number;
  breadth?: number;
  yearBuilt?: number;

  // Ownership data
  registeredOwner?: string;
  ownerAddress?: string;
  ownerCountry?: string;
  technicalManager?: string;
  operator?: string;

  // Norwegian-specific
  norwegianRegNumber?: string;
  homePort?: string;
  classificationSociety?: string;

  // Raw data for debugging
  raw?: any;
}

export class NorwegianMaritimeAPI {
  private cache: Map<string, { data: NorwegianVesselData; timestamp: number }> = new Map();
  private cacheTTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Fetch vessel data from Norwegian Maritime Authority
   * @param imo IMO number (7 digits)
   */
  async fetchVesselData(imo: string): Promise<NorwegianVesselData | null> {
    try {
      // Validate IMO format
      const cleanIMO = imo.replace(/^IMO[- ]?/i, '').replace(/^AIS-/, '');
      if (!/^\d{7}$/.test(cleanIMO)) {
        logger.warn(`Invalid IMO format: ${imo}`);
        return null;
      }

      // Check cache first
      const cached = this.cache.get(cleanIMO);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        logger.info(`Using cached data for IMO ${cleanIMO}`);
        return cached.data;
      }

      // Fetch from Norwegian API
      const url = `${NORWEGIAN_API_BASE}/vessel/${cleanIMO}`;
      logger.info(`Fetching Norwegian vessel data: ${url}`);

      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mari8X-Platform/1.0',
          'Accept': 'application/json',
        },
      });

      if (!response.data) {
        logger.warn(`No data returned for IMO ${cleanIMO}`);
        return null;
      }

      // Parse response (adjust field mapping based on actual API response)
      const vesselData: NorwegianVesselData = {
        imo: cleanIMO,
        mmsi: response.data.mmsi || response.data.MMSI,
        name: response.data.name || response.data.shipName || response.data.ShipName,
        callSign: response.data.callSign || response.data.CallSign,
        flag: response.data.flag || response.data.Flag || 'NO',
        shipType: response.data.shipType || response.data.type,
        grossTonnage: response.data.grossTonnage || response.data.GT,
        deadweight: response.data.deadweight || response.data.DWT,
        lengthOverall: response.data.length || response.data.LOA,
        breadth: response.data.breadth || response.data.Beam,
        yearBuilt: response.data.yearBuilt || response.data.builtYear,

        // Ownership
        registeredOwner: response.data.owner || response.data.registeredOwner || response.data.Owner,
        ownerAddress: response.data.ownerAddress,
        ownerCountry: response.data.ownerCountry || 'NO',
        technicalManager: response.data.technicalManager || response.data.manager,
        operator: response.data.operator,

        // Norwegian-specific
        norwegianRegNumber: response.data.registrationNumber || response.data.regNumber,
        homePort: response.data.homePort || response.data.port,
        classificationSociety: response.data.classificationSociety || response.data.class,

        raw: response.data,
      };

      // Cache the result
      this.cache.set(cleanIMO, { data: vesselData, timestamp: Date.now() });

      logger.info(`✅ Norwegian data fetched for ${vesselData.name} (IMO: ${cleanIMO})`);
      return vesselData;

    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.warn(`Vessel not found in Norwegian registry: ${imo}`);
        return null;
      }

      logger.error(`Error fetching Norwegian vessel data for ${imo}:`, error.message);
      throw new Error(`Norwegian API error: ${error.message}`);
    }
  }

  /**
   * Update vessel in database with Norwegian data
   */
  async enrichVessel(vesselId: string): Promise<boolean> {
    try {
      const vessel = await prisma.vessel.findUnique({
        where: { id: vesselId },
        select: { id: true, imo: true, name: true },
      });

      if (!vessel) {
        throw new Error(`Vessel not found: ${vesselId}`);
      }

      const norwegianData = await this.fetchVesselData(vessel.imo);
      if (!norwegianData) {
        logger.warn(`No Norwegian data available for ${vessel.name} (${vessel.imo})`);
        return false;
      }

      // Update vessel with Norwegian data
      await prisma.vessel.update({
        where: { id: vesselId },
        data: {
          mmsi: norwegianData.mmsi || vessel.imo, // Keep existing if not in Norwegian data
          name: norwegianData.name || undefined,
          flag: norwegianData.flag || undefined,
          type: norwegianData.shipType || undefined,
          grt: norwegianData.grossTonnage || undefined,
          dwt: norwegianData.deadweight || undefined,
          loa: norwegianData.lengthOverall || undefined,
          beam: norwegianData.breadth || undefined,
          yearBuilt: norwegianData.yearBuilt || undefined,

          // Ownership data
          registeredOwner: norwegianData.registeredOwner || undefined,
          shipManager: norwegianData.technicalManager || undefined,
          operator: norwegianData.operator || undefined,
          ownershipUpdatedAt: new Date(),

          classificationSociety: norwegianData.classificationSociety || undefined,
        },
      });

      logger.info(`✅ Vessel enriched with Norwegian data: ${vessel.name} (${vessel.imo})`);
      return true;

    } catch (error: any) {
      logger.error(`Error enriching vessel ${vesselId}:`, error.message);
      throw error;
    }
  }

  /**
   * Bulk enrich vessels (for cron job)
   */
  async enrichVesselsWithNorwegianData(limit: number = 50): Promise<{
    total: number;
    enriched: number;
    failed: number;
    skipped: number;
  }> {
    try {
      // Find vessels without ownership data or with outdated data
      const vessels = await prisma.vessel.findMany({
        where: {
          OR: [
            { registeredOwner: null },
            { ownershipUpdatedAt: null },
            {
              ownershipUpdatedAt: {
                lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Older than 30 days
              },
            },
          ],
          imo: {
            not: {
              startsWith: 'AIS-', // Skip AIS-placeholder vessels
            },
          },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      let enriched = 0;
      let failed = 0;
      let skipped = 0;

      logger.info(`Processing ${vessels.length} vessels for Norwegian enrichment`);

      for (const vessel of vessels) {
        try {
          const success = await this.enrichVessel(vessel.id);
          if (success) {
            enriched++;
          } else {
            skipped++;
          }

          // Rate limiting: wait 1 second between requests
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error: any) {
          logger.error(`Failed to enrich vessel ${vessel.name}:`, error.message);
          failed++;
        }
      }

      const result = {
        total: vessels.length,
        enriched,
        failed,
        skipped,
      };

      logger.info(`Norwegian enrichment complete:`, result);
      return result;

    } catch (error: any) {
      logger.error('Error in bulk vessel enrichment:', error.message);
      throw error;
    }
  }

  /**
   * Clear cache (for testing)
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Norwegian API cache cleared');
  }
}

export const norwegianMaritimeAPI = new NorwegianMaritimeAPI();
