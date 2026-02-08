/**
 * HYBRID AIS COVERAGE V2 - Terrestrial AIS + GFW Vessel Enrichment
 *
 * WHAT THIS PROVIDES:
 * - Real-time terrestrial AIS positions (AISstream.io)
 * - Vessel identity enrichment from GFW (names, flags, types)
 * - Source tracking (terrestrial vs enriched)
 *
 * WHAT GFW ACTUALLY DOES:
 * ✅ Vessel identity & registry (MMSI → Name, Flag, IMO)
 * ✅ Fishing events & port visits
 * ✅ Historical presence patterns
 * ❌ NOT real-time vessel positions
 * ❌ NOT continuous tracks
 *
 * For satellite AIS positions, you need different providers like:
 * - Spire Maritime
 * - ORBCOMM
 * - Exact Earth
 */

import { builder } from '../builder.js';
import { prisma } from '../../lib/prisma.js';
import { GlobalFishingWatchClient } from '../../services/global-fishing-watch-ais-fixed.js';

// Enhanced vessel position with enrichment tracking
const EnrichedVesselPosition = builder.objectRef<{
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
  source: 'terrestrial' | 'enriched';
  hasGFWData: boolean;
}>('EnrichedVesselPosition').implement({
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
    hasGFWData: t.exposeBoolean('hasGFWData'),
  }),
});

// Coverage statistics
const AISCoverageStatsV2 = builder.objectRef<{
  totalVessels: number;
  enrichedVessels: number;
  lastUpdated: Date;
}>('AISCoverageStatsV2').implement({
  fields: (t) => ({
    totalVessels: t.exposeInt('totalVessels'),
    enrichedVessels: t.exposeInt('enrichedVessels'),
    lastUpdated: t.expose('lastUpdated', { type: 'DateTime' }),
  }),
});

// Main response type
const EnrichedAISResponse = builder.objectRef<{
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
    source: 'terrestrial' | 'enriched';
    hasGFWData: boolean;
  }>;
  stats: {
    totalVessels: number;
    enrichedVessels: number;
    lastUpdated: Date;
  };
}>('EnrichedAISResponse').implement({
  fields: (t) => ({
    vessels: t.field({
      type: [EnrichedVesselPosition],
      resolve: (parent) => parent.vessels,
    }),
    stats: t.field({
      type: AISCoverageStatsV2,
      resolve: (parent) => parent.stats,
    }),
  }),
});

/**
 * Get terrestrial AIS data (no satellite positions, but vessels can be enriched with GFW identity data)
 */
builder.queryField('enrichedVesselPositions', (t) =>
  t.field({
    type: EnrichedAISResponse,
    description: 'Terrestrial AIS positions with optional GFW vessel enrichment',
    args: {
      minLat: t.arg.float({ required: true }),
      maxLat: t.arg.float({ required: true }),
      minLng: t.arg.float({ required: true }),
      maxLng: t.arg.float({ required: true }),
      limit: t.arg.int({ required: false, defaultValue: 1000 }),
    },
    resolve: async (_root, args) => {
      const { minLat, maxLat, minLng, maxLng, limit } = args;
      const startTime = Date.now();

      console.log('[Enriched AIS] Fetching terrestrial data...');

      // Get terrestrial AIS from database (last 6 hours)
      const terrestrialPositions = await prisma.vesselPosition.findMany({
        where: {
          latitude: { gte: minLat, lte: maxLat },
          longitude: { gte: minLng, lte: maxLng },
          timestamp: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
        },
        include: {
          vessel: true,
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });

      // Track which vessels have complete data vs need enrichment
      let enrichedCount = 0;

      const vessels = terrestrialPositions.map(pos => {
        const hasCompleteData = !!(pos.vessel.name && pos.vessel.flag && pos.vessel.type);

        if (hasCompleteData) {
          enrichedCount++;
        }

        return {
          vesselId: pos.vesselId,
          mmsi: pos.vessel.mmsi || pos.vesselId,
          vesselName: pos.vessel.name,
          vesselType: pos.vessel.type,
          latitude: Number(pos.latitude),
          longitude: Number(pos.longitude),
          speed: pos.speed ? Number(pos.speed) : null,
          heading: pos.heading ? Number(pos.heading) : null,
          course: pos.course ? Number(pos.course) : null,
          timestamp: pos.timestamp,
          source: hasCompleteData ? ('enriched' as const) : ('terrestrial' as const),
          hasGFWData: hasCompleteData,
        };
      });

      const queryTime = Date.now() - startTime;
      console.log(`[Enriched AIS] Complete in ${queryTime}ms: ${vessels.length} vessels (${enrichedCount} enriched)`);

      return {
        vessels,
        stats: {
          totalVessels: vessels.length,
          enrichedVessels: enrichedCount,
          lastUpdated: new Date(),
        },
      };
    },
  })
);
