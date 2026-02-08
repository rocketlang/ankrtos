/**
 * HYBRID AIS COVERAGE - Terrestrial + Satellite
 * Combines database AIS (AISstream) with GFW satellite coverage
 * Fills gaps in Arabian Sea, Indian Ocean, and remote areas
 */

import { builder } from '../builder.js';
import { prisma } from '../../lib/prisma.js';
import { GlobalFishingWatchClient } from '../../services/global-fishing-watch-ais.js';

// Enhanced vessel position with data source tracking
const HybridVesselPosition = builder.objectRef<{
  vesselId: string;
  mmsi: string;
  vesselName: string | null;
  vesselType: string | null;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  course: number | null;
  timestamp: Date;
  source: 'terrestrial' | 'satellite';
  quality: number; // 1.0 = terrestrial, 0.85 = satellite
}>('HybridVesselPosition').implement({
  fields: (t) => ({
    vesselId: t.exposeString('vesselId'),
    mmsi: t.exposeString('mmsi'),
    vesselName: t.exposeString('vesselName', { nullable: true }),
    vesselType: t.exposeString('vesselType', { nullable: true }),
    latitude: t.exposeFloat('latitude'),
    longitude: t.exposeFloat('longitude'),
    speed: t.exposeFloat('speed', { nullable: true }),
    heading: t.exposeFloat('heading', { nullable: true }),
    course: t.exposeFloat('course', { nullable: true }),
    timestamp: t.expose('timestamp', { type: 'DateTime' }),
    source: t.exposeString('source'),
    quality: t.exposeFloat('quality'),
  }),
});

// Coverage statistics
const HybridCoverageStats = builder.objectRef<{
  totalVessels: number;
  terrestrialVessels: number;
  satelliteVessels: number;
  coverageImprovement: number; // percentage increase from satellite
  lastUpdated: Date;
}>('HybridCoverageStats').implement({
  fields: (t) => ({
    totalVessels: t.exposeInt('totalVessels'),
    terrestrialVessels: t.exposeInt('terrestrialVessels'),
    satelliteVessels: t.exposeInt('satelliteVessels'),
    coverageImprovement: t.exposeFloat('coverageImprovement'),
    lastUpdated: t.expose('lastUpdated', { type: 'DateTime' }),
  }),
});

// Main hybrid response type
const HybridAISResponse = builder.objectRef<{
  vessels: Array<{
    vesselId: string;
    mmsi: string;
    vesselName: string | null;
    vesselType: string | null;
    latitude: number;
    longitude: number;
    speed: number | null;
    heading: number | null;
    course: number | null;
    timestamp: Date;
    source: 'terrestrial' | 'satellite';
    quality: number;
  }>;
  stats: {
    totalVessels: number;
    terrestrialVessels: number;
    satelliteVessels: number;
    coverageImprovement: number;
    lastUpdated: Date;
  };
}>('HybridAISResponse').implement({
  fields: (t) => ({
    vessels: t.field({
      type: [HybridVesselPosition],
      resolve: (parent) => parent.vessels,
    }),
    stats: t.field({
      type: HybridCoverageStats,
      resolve: (parent) => parent.stats,
    }),
  }),
});

/**
 * Get hybrid AIS coverage for a region
 * Combines terrestrial (database) + satellite (GFW) sources
 */
builder.queryField('hybridVesselPositions', (t) =>
  t.field({
    type: HybridAISResponse,
    description: 'Hybrid AIS coverage combining terrestrial and satellite sources',
    args: {
      minLat: t.arg.float({ required: true }),
      maxLat: t.arg.float({ required: true }),
      minLng: t.arg.float({ required: true }),
      maxLng: t.arg.float({ required: true }),
      limit: t.arg.int({ required: false, defaultValue: 1000 }),
      includeSatellite: t.arg.boolean({ required: false, defaultValue: true }),
    },
    resolve: async (_root, args) => {
      const { minLat, maxLat, minLng, maxLng, limit, includeSatellite } = args;
      const startTime = Date.now();

      const vesselsMap = new Map<string, any>();

      // Step 1: Get terrestrial AIS from database (last 6 hours)
      console.log('[Hybrid AIS] Fetching terrestrial data...');

      const terrestrialPositions = await prisma.vesselPosition.findMany({
        where: {
          latitude: { gte: minLat, lte: maxLat },
          longitude: { gte: minLng, lte: maxLng },
          timestamp: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) }, // 6 hours
        },
        include: {
          vessel: true,
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });

      // Add terrestrial vessels to map (keep latest position per vessel)
      terrestrialPositions.forEach(pos => {
        const mmsi = pos.vessel.mmsi || pos.vesselId;
        if (!vesselsMap.has(mmsi)) {
          vesselsMap.set(mmsi, {
            vesselId: pos.vesselId,
            mmsi,
            vesselName: pos.vessel.name,
            vesselType: pos.vessel.type,
            latitude: Number(pos.latitude),
            longitude: Number(pos.longitude),
            speed: pos.speed ? Number(pos.speed) : null,
            heading: pos.heading ? Number(pos.heading) : null,
            course: pos.course ? Number(pos.course) : null,
            timestamp: pos.timestamp,
            source: 'terrestrial' as const,
            quality: 1.0,
          });
        }
      });

      const terrestrialCount = vesselsMap.size;
      console.log(`[Hybrid AIS] Terrestrial: ${terrestrialCount} vessels`);

      // Step 2: Fill gaps with GFW satellite data (if enabled)
      let satelliteCount = 0;

      if (includeSatellite && process.env.GFW_API_KEY) {
        console.log('[Hybrid AIS] Fetching satellite data from GFW...');

        try {
          const gfwClient = new GlobalFishingWatchClient(process.env.GFW_API_KEY);

          const bounds = {
            north: maxLat,
            south: minLat,
            east: maxLng,
            west: minLng,
          };

          const gfwVessels = await gfwClient.getVesselsInArea(bounds, {
            startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
            endDate: new Date(),
          });

          // Add satellite vessels (only if not already in terrestrial data)
          gfwVessels.forEach(gfwVessel => {
            if (!vesselsMap.has(gfwVessel.mmsi)) {
              vesselsMap.set(gfwVessel.mmsi, {
                vesselId: gfwVessel.id,
                mmsi: gfwVessel.mmsi,
                vesselName: gfwVessel.shipname,
                vesselType: null, // GFW doesn't provide vessel type in basic API
                latitude: gfwVessel.lat,
                longitude: gfwVessel.lon,
                speed: gfwVessel.speed,
                heading: null,
                course: gfwVessel.course,
                timestamp: new Date(gfwVessel.timestamp),
                source: 'satellite' as const,
                quality: 0.85, // Satellite slightly less frequent
              });
              satelliteCount++;
            }
          });

          console.log(`[Hybrid AIS] Satellite: +${satelliteCount} new vessels from GFW`);
        } catch (error) {
          console.error('[Hybrid AIS] GFW fetch failed:', error);
          // Continue with terrestrial data only
        }
      }

      const allVessels = Array.from(vesselsMap.values());
      const totalCount = allVessels.length;
      const improvement = terrestrialCount > 0
        ? ((satelliteCount / terrestrialCount) * 100)
        : (satelliteCount > 0 ? 100 : 0);

      const queryTime = Date.now() - startTime;
      console.log(`[Hybrid AIS] Complete in ${queryTime}ms: ${totalCount} total (${terrestrialCount} terrestrial + ${satelliteCount} satellite)`);

      return {
        vessels: allVessels.slice(0, limit), // Respect limit
        stats: {
          totalVessels: totalCount,
          terrestrialVessels: terrestrialCount,
          satelliteVessels: satelliteCount,
          coverageImprovement: improvement,
          lastUpdated: new Date(),
        },
      };
    },
  })
);

/**
 * Arabian Sea Coverage (quick preset)
 */
builder.queryField('arabianSeaVessels', (t) =>
  t.field({
    type: HybridAISResponse,
    description: 'Hybrid AIS coverage for Arabian Sea region',
    args: {
      includeSatellite: t.arg.boolean({ required: false, defaultValue: true }),
    },
    resolve: async (_root, args) => {
      // Arabian Sea bounding box
      const arabianSea = {
        minLat: 5,    // Lakshadweep
        maxLat: 25,   // Pakistan coast
        minLng: 50,   // Oman coast
        maxLng: 75,   // Indian coast
      };

      // Reuse hybrid query
      const context = {} as any;
      return builder.getResolverField('Query', 'hybridVesselPositions')
        .resolve(null, { ...arabianSea, limit: 2000, ...args }, context, {} as any);
    },
  })
);
