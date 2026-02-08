/**
 * AIS Fun Facts GraphQL Types & Queries
 *
 * Real-time insights from 56M+ AIS positions for landing page showcase
 */

import { builder } from '../builder.js';
import { prisma } from '../context.js';
import { createChildLogger } from '../../utils/logger.js';

const logger = createChildLogger({ module: 'ais-fun-facts' });

// ⚡ PERFORMANCE OPTIMIZATION: Cache for 5 minutes to avoid heavy queries
let cachedFunFacts: any = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Type: AIS Data Scale
const AISDataScale = builder.objectRef<{
  totalPositions: number;
  uniqueVessels: number;
  avgPositionsPerShip: number;
  trackingCapacity: string;
}>('AISDataScale').implement({
  fields: (t) => ({
    totalPositions: t.exposeInt('totalPositions'),
    uniqueVessels: t.exposeInt('uniqueVessels'),
    avgPositionsPerShip: t.exposeInt('avgPositionsPerShip'),
    trackingCapacity: t.exposeString('trackingCapacity'),
  }),
});

// Type: AIS Time Coverage
const AISTimeCoverage = builder.objectRef<{
  earliestDate: string;
  latestDate: string;
  durationDays: number;
  durationHours: number;
  positionsPerHour: number;
  positionsPerMinute: number;
}>('AISTimeCoverage').implement({
  fields: (t) => ({
    earliestDate: t.exposeString('earliestDate'),
    latestDate: t.exposeString('latestDate'),
    durationDays: t.exposeInt('durationDays'),
    durationHours: t.exposeInt('durationHours'),
    positionsPerHour: t.exposeInt('positionsPerHour'),
    positionsPerMinute: t.exposeInt('positionsPerMinute'),
  }),
});

// Type: Speed Record
const SpeedRecord = builder.objectRef<{
  vesselId: string;
  vesselName: string;
  vesselType: string;
  maxSpeed: number;
  maxSpeedKmh: number;
  timestamp: string;
}>('SpeedRecord').implement({
  fields: (t) => ({
    vesselId: t.exposeString('vesselId'),
    vesselName: t.exposeString('vesselName'),
    vesselType: t.exposeString('vesselType'),
    maxSpeed: t.exposeFloat('maxSpeed'),
    maxSpeedKmh: t.exposeFloat('maxSpeedKmh'),
    timestamp: t.exposeString('timestamp'),
  }),
});

// Type: Active Ship
const ActiveShip = builder.objectRef<{
  vesselId: string;
  vesselName: string;
  vesselType: string;
  totalPositions: number;
  activeDays: number;
  positionsPerDay: number;
  updateFrequency: string;
}>('ActiveShip').implement({
  fields: (t) => ({
    vesselId: t.exposeString('vesselId'),
    vesselName: t.exposeString('vesselName'),
    vesselType: t.exposeString('vesselType'),
    totalPositions: t.exposeInt('totalPositions'),
    activeDays: t.exposeFloat('activeDays'),
    positionsPerDay: t.exposeInt('positionsPerDay'),
    updateFrequency: t.exposeString('updateFrequency'),
  }),
});

// Type: Geo Coverage
const GeoCoverage = builder.objectRef<{
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
  latitudeSpan: number;
  longitudeSpan: number;
  coveragePercent: number;
  description: string;
}>('GeoCoverage').implement({
  fields: (t) => ({
    minLatitude: t.exposeFloat('minLatitude'),
    maxLatitude: t.exposeFloat('maxLatitude'),
    minLongitude: t.exposeFloat('minLongitude'),
    maxLongitude: t.exposeFloat('maxLongitude'),
    latitudeSpan: t.exposeFloat('latitudeSpan'),
    longitudeSpan: t.exposeFloat('longitudeSpan'),
    coveragePercent: t.exposeFloat('coveragePercent'),
    description: t.exposeString('description'),
  }),
});

// Type: AIS Trend Data
const AISTrendData = builder.objectRef<{
  date: string;
  count: number;
}>('AISTrendData').implement({
  fields: (t) => ({
    date: t.exposeString('date'),
    count: t.exposeInt('count'),
  }),
});

// Type: Mari8XOSRM Intelligence
const Mari8XOSRMIntelligence = builder.objectRef<{
  routesLearned: number;
  avgDistanceFactor: number;
  compressionRatio: number;
  intelligenceExtracted: string;
  insight: string;
}>('Mari8XOSRMIntelligence').implement({
  fields: (t) => ({
    routesLearned: t.exposeInt('routesLearned'),
    avgDistanceFactor: t.exposeFloat('avgDistanceFactor'),
    compressionRatio: t.exposeInt('compressionRatio'),
    intelligenceExtracted: t.exposeString('intelligenceExtracted'),
    insight: t.exposeString('insight'),
  }),
});

// Type: Nearest Ship
const NearestShip = builder.objectRef<{
  vesselId: string;
  vesselName: string;
  vesselType: string;
  latitude: number;
  longitude: number;
  distanceNm: number;
  distanceKm: number;
  timestamp: string;
}>('NearestShip').implement({
  fields: (t) => ({
    vesselId: t.exposeString('vesselId'),
    vesselName: t.exposeString('vesselName'),
    vesselType: t.exposeString('vesselType'),
    latitude: t.exposeFloat('latitude'),
    longitude: t.exposeFloat('longitude'),
    distanceNm: t.exposeFloat('distanceNm'),
    distanceKm: t.exposeFloat('distanceKm'),
    timestamp: t.exposeString('timestamp'),
  }),
});

// Type: Real-Time Stats
const RealTimeStats = builder.objectRef<{
  shipsMovingNow: number;
  shipsAtAnchor: number;
  shipsOnEquator: number;
  shipsAtSuez: number;
  shipsAtCapeOfGoodHope: number;
  coverageSqMiles: number;
  coverageSqKm: number;
}>('RealTimeStats').implement({
  fields: (t) => ({
    shipsMovingNow: t.exposeInt('shipsMovingNow'),
    shipsAtAnchor: t.exposeInt('shipsAtAnchor'),
    shipsOnEquator: t.exposeInt('shipsOnEquator'),
    shipsAtSuez: t.exposeInt('shipsAtSuez'),
    shipsAtCapeOfGoodHope: t.exposeInt('shipsAtCapeOfGoodHope'),
    coverageSqMiles: t.exposeInt('coverageSqMiles'),
    coverageSqKm: t.exposeInt('coverageSqKm'),
  }),
});

// Type: Superlative Ship (biggest/fastest)
const SuperlativeShip = builder.objectRef<{
  vesselId: string;
  vesselName: string;
  vesselType: string;
  imo: string | null;
  dwt: number | null;
  grossTonnage: number | null;
  length: number | null;
  currentSpeed: number | null;
  latitude: number;
  longitude: number;
  timestamp: string;
  metric: string;
  value: string;
}>('SuperlativeShip').implement({
  fields: (t) => ({
    vesselId: t.exposeString('vesselId'),
    vesselName: t.exposeString('vesselName'),
    vesselType: t.exposeString('vesselType'),
    imo: t.exposeString('imo', { nullable: true }),
    dwt: t.exposeFloat('dwt', { nullable: true }),
    grossTonnage: t.exposeFloat('grossTonnage', { nullable: true }),
    length: t.exposeFloat('length', { nullable: true }),
    currentSpeed: t.exposeFloat('currentSpeed', { nullable: true }),
    latitude: t.exposeFloat('latitude'),
    longitude: t.exposeFloat('longitude'),
    timestamp: t.exposeString('timestamp'),
    metric: t.exposeString('metric'),
    value: t.exposeString('value'),
  }),
});

// Type: AIS Fun Facts (Main)
const AISFunFacts = builder.objectRef<{
  dataScale: typeof AISDataScale.$inferType;
  timeCoverage: typeof AISTimeCoverage.$inferType;
  topSpeedRecords: Array<typeof SpeedRecord.$inferType>;
  mostActiveShips: Array<typeof ActiveShip.$inferType>;
  geoCoverage: typeof GeoCoverage.$inferType;
  last7DaysTrend: Array<typeof AISTrendData.$inferType>;
  mari8xosrmIntelligence: typeof Mari8XOSRMIntelligence.$inferType;
  nearestToNorthPole: typeof NearestShip.$inferType | null;
  nearestToSouthPole: typeof NearestShip.$inferType | null;
  realTimeStats: typeof RealTimeStats.$inferType;
  biggestTanker: typeof SuperlativeShip.$inferType | null;
  biggestBulker: typeof SuperlativeShip.$inferType | null;
  biggestContainer: typeof SuperlativeShip.$inferType | null;
  fastestShipNow: typeof SuperlativeShip.$inferType | null;
  fastestContainer: typeof SuperlativeShip.$inferType | null;
  lastUpdated: string;
}>('AISFunFacts').implement({
  fields: (t) => ({
    dataScale: t.field({
      type: AISDataScale,
      resolve: (parent) => parent.dataScale,
    }),
    timeCoverage: t.field({
      type: AISTimeCoverage,
      resolve: (parent) => parent.timeCoverage,
    }),
    topSpeedRecords: t.field({
      type: [SpeedRecord],
      resolve: (parent) => parent.topSpeedRecords,
    }),
    mostActiveShips: t.field({
      type: [ActiveShip],
      resolve: (parent) => parent.mostActiveShips,
    }),
    geoCoverage: t.field({
      type: GeoCoverage,
      resolve: (parent) => parent.geoCoverage,
    }),
    last7DaysTrend: t.field({
      type: [AISTrendData],
      resolve: (parent) => parent.last7DaysTrend,
    }),
    mari8xosrmIntelligence: t.field({
      type: Mari8XOSRMIntelligence,
      resolve: (parent) => parent.mari8xosrmIntelligence,
    }),
    nearestToNorthPole: t.field({
      type: NearestShip,
      nullable: true,
      resolve: (parent) => parent.nearestToNorthPole,
    }),
    nearestToSouthPole: t.field({
      type: NearestShip,
      nullable: true,
      resolve: (parent) => parent.nearestToSouthPole,
    }),
    realTimeStats: t.field({
      type: RealTimeStats,
      resolve: (parent) => parent.realTimeStats,
    }),
    biggestTanker: t.field({
      type: SuperlativeShip,
      nullable: true,
      resolve: (parent) => parent.biggestTanker,
    }),
    biggestBulker: t.field({
      type: SuperlativeShip,
      nullable: true,
      resolve: (parent) => parent.biggestBulker,
    }),
    biggestContainer: t.field({
      type: SuperlativeShip,
      nullable: true,
      resolve: (parent) => parent.biggestContainer,
    }),
    fastestShipNow: t.field({
      type: SuperlativeShip,
      nullable: true,
      resolve: (parent) => parent.fastestShipNow,
    }),
    fastestContainer: t.field({
      type: SuperlativeShip,
      nullable: true,
      resolve: (parent) => parent.fastestContainer,
    }),
    lastUpdated: t.exposeString('lastUpdated'),
  }),
});

// Query: aisFunFacts
builder.queryField('aisFunFacts', (t) =>
  t.field({
    type: AISFunFacts,
    resolve: async () => {
      const now = Date.now();

      // ⚡ Return cached data if fresh (5 min TTL)
      if (cachedFunFacts && (now - cacheTimestamp) < CACHE_TTL) {
        logger.info(`✅ Returning cached AIS Fun Facts (age: ${Math.round((now - cacheTimestamp) / 1000)}s)`);
        return cachedFunFacts;
      }

      logger.info('🔄 Computing fresh AIS Fun Facts (this takes ~10-15 seconds)...');
      const startTime = Date.now();

      try {
        // Fun Fact #1: Data Scale - ⚡⚡⚡ INSTANT: Use pg_class + vessels table
        const [totalPositionsQuery, totalVesselsQuery] = await Promise.all([
          prisma.$queryRaw<Array<{ count: bigint }>>`
            SELECT reltuples::bigint as count
            FROM pg_class
            WHERE relname = 'vessel_positions'
          `,
          prisma.$queryRaw<Array<{ count: number }>>`
            SELECT COUNT(*)::int as count
            FROM vessels
          `,
        ]);
        const totalPositions = Number(totalPositionsQuery[0]?.count || 0);
        const vesselsCount = totalVesselsQuery[0]?.count || 0;

        const dataScale = {
          totalPositions,
          uniqueVessels: vesselsCount,
          avgPositionsPerShip: vesselsCount > 0 ? Math.floor(totalPositions / vesselsCount) : 0,
          trackingCapacity: `${Math.floor(totalPositions / 1000000)}+ million AIS messages processed`,
        };

        // Fun Fact #2: Time Coverage - ⚡⚡⚡ FAST: Use index scan instead of full table
        const dateRange = await prisma.$queryRaw<Array<{ earliest: Date; latest: Date }>>`
          SELECT
            (SELECT timestamp FROM vessel_positions ORDER BY timestamp ASC LIMIT 1) as earliest,
            (SELECT timestamp FROM vessel_positions ORDER BY timestamp DESC LIMIT 1) as latest
        `;

        const earliest = dateRange[0]?.earliest ? new Date(dateRange[0].earliest) : new Date();
        const latest = dateRange[0]?.latest ? new Date(dateRange[0].latest) : new Date();
        const durationMs = latest.getTime() - earliest.getTime();
        const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));
        const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
        const positionsPerHour = durationHours > 0 ? Math.floor(totalPositions / durationHours) : 0;
        const positionsPerMinute = durationHours > 0 ? Math.floor(totalPositions / (durationHours * 60)) : 0;

        const timeCoverage = {
          earliestDate: earliest.toISOString(),
          latestDate: latest.toISOString(),
          durationDays,
          durationHours,
          positionsPerHour,
          positionsPerMinute,
        };

        // Fun Fact #3: Speed Records - ⚡⚡⚡ FAST: Last 7 days only
        const speedRecords = await prisma.$queryRaw<Array<{
          vesselId: string;
          vesselName: string;
          vesselType: string;
          maxSpeed: number;
          timestamp: Date;
        }>>`
          SELECT
            vp."vesselId",
            COALESCE(v.name, 'Unknown') as "vesselName",
            COALESCE(v.type, 'unknown') as "vesselType",
            MAX(vp.speed)::float as "maxSpeed",
            MAX(vp.timestamp) as timestamp
          FROM vessel_positions vp
          LEFT JOIN vessels v ON v.id = vp."vesselId"
          WHERE vp.timestamp >= NOW() - INTERVAL '7 days'
            AND vp.speed IS NOT NULL
            AND vp.speed > 0
          GROUP BY vp."vesselId", v.name, v.type
          ORDER BY "maxSpeed" DESC
          LIMIT 5
        `;

        const topSpeedRecords = speedRecords.map((record) => ({
          vesselId: record.vesselId,
          vesselName: record.vesselName,
          vesselType: record.vesselType,
          maxSpeed: record.maxSpeed,
          maxSpeedKmh: record.maxSpeed * 1.852,
          timestamp: record.timestamp.toISOString(),
        }));

        // Fun Fact #4: Most Active Ships - ⚡⚡⚡ FAST: Last 7 days only
        const mostActive = await prisma.$queryRaw<Array<{
          vesselId: string;
          vesselName: string;
          vesselType: string;
          positions: number;
          days: number;
        }>>`
          SELECT
            vp."vesselId",
            COALESCE(v.name, 'Unknown') as "vesselName",
            COALESCE(v.type, 'unknown') as "vesselType",
            COUNT(*)::int as positions,
            EXTRACT(EPOCH FROM (MAX(vp.timestamp) - MIN(vp.timestamp))) / 86400 as days
          FROM vessel_positions vp
          LEFT JOIN vessels v ON v.id = vp."vesselId"
          WHERE vp.timestamp >= NOW() - INTERVAL '7 days'
          GROUP BY vp."vesselId", v.name, v.type
          HAVING COUNT(*) > 50
          ORDER BY positions DESC
          LIMIT 5
        `;

        const mostActiveShips = mostActive.map((ship) => {
          const positionsPerDay = ship.days > 0 ? Math.floor(ship.positions / ship.days) : 0;
          const avgIntervalSeconds = ship.days > 0 ? Math.floor((ship.days * 86400) / ship.positions) : 0;

          return {
            vesselId: ship.vesselId,
            vesselName: ship.vesselName || 'Unknown',
            vesselType: ship.vesselType || 'unknown',
            totalPositions: ship.positions,
            activeDays: ship.days,
            positionsPerDay,
            updateFrequency: avgIntervalSeconds > 0
              ? `Every ${avgIntervalSeconds} seconds`
              : 'Real-time',
          };
        });

        // Fun Fact #5: Geographic Coverage - ⚡⚡⚡ FAST: Sample recent data
        const geoCoverageData = await prisma.$queryRaw<Array<{
          minLat: number;
          maxLat: number;
          minLon: number;
          maxLon: number;
        }>>`
          SELECT
            MIN(latitude)::float as "minLat",
            MAX(latitude)::float as "maxLat",
            MIN(longitude)::float as "minLon",
            MAX(longitude)::float as "maxLon"
          FROM vessel_positions
          WHERE timestamp >= NOW() - INTERVAL '7 days'
        `;

        const geo = geoCoverageData[0];
        const latSpan = geo ? geo.maxLat - geo.minLat : 0;
        const lonSpan = geo ? geo.maxLon - geo.minLon : 0;
        const coveragePercent = geo ? (latSpan / 180) * 100 : 0;

        const geoCoverage = {
          minLatitude: geo?.minLat || 0,
          maxLatitude: geo?.maxLat || 0,
          minLongitude: geo?.minLon || 0,
          maxLongitude: geo?.maxLon || 0,
          latitudeSpan: latSpan,
          longitudeSpan: lonSpan,
          coveragePercent,
          description: latSpan > 100
            ? 'Tracking ships across multiple continents'
            : 'Regional maritime coverage',
        };

        // Bonus: Last 7 days trend
        const last7Days = await prisma.$queryRaw<Array<{
          date: string;
          count: number;
        }>>`
          SELECT
            DATE(timestamp)::text as date,
            COUNT(*)::int as count
          FROM vessel_positions
          WHERE timestamp >= NOW() - INTERVAL '7 days'
          GROUP BY DATE(timestamp)
          ORDER BY date ASC
          LIMIT 7
        `;

        // Fun Fact #11: Mari8XOSRM Intelligence
        const extractedRoutes = await prisma.extractedAISRoute.count();
        const avgFactor = await prisma.extractedAISRoute.aggregate({
          _avg: { distanceFactor: true },
        });
        const compressionRatio = totalPositions > 0 && extractedRoutes > 0
          ? Math.floor(totalPositions / extractedRoutes)
          : 0;

        // ⚡ PERFORMANCE: Skip polar calculations for now (requires materialized view)
        // These queries iterate through 41K+ vessels - too slow for real-time
        // TODO: Create daily materialized view for polar ships
        const nearestToNorthPole = null;
        const nearestToSouthPole = null;

        // Fun Fact #14: Ships within 2nm of equator - ⚡⚡⚡ FAST: Recent data only
        const shipsOnEquator = await prisma.$queryRaw<Array<{ count: number }>>`
          SELECT COUNT(DISTINCT "vesselId")::int as count
          FROM (
            SELECT DISTINCT ON ("vesselId") "vesselId", latitude
            FROM vessel_positions
            WHERE timestamp >= NOW() - INTERVAL '1 day'
            ORDER BY "vesselId", timestamp DESC
          ) latest
          WHERE latitude BETWEEN -0.033 AND 0.033
        `;

        // Fun Fact #15: Ships currently moving - ⚡⚡⚡ FAST: Recent data only
        const shipsMoving = await prisma.$queryRaw<Array<{ count: number }>>`
          SELECT COUNT(DISTINCT "vesselId")::int as count
          FROM (
            SELECT DISTINCT ON ("vesselId") "vesselId", speed
            FROM vessel_positions
            WHERE speed IS NOT NULL
              AND timestamp >= NOW() - INTERVAL '1 day'
            ORDER BY "vesselId", timestamp DESC
          ) latest
          WHERE speed > 0.5
        `;

        // Fun Fact #16: Ships at Suez Canal - ⚡⚡⚡ FAST: Recent data only
        const shipsAtSuez = await prisma.$queryRaw<Array<{ count: number }>>`
          SELECT COUNT(DISTINCT "vesselId")::int as count
          FROM (
            SELECT DISTINCT ON ("vesselId") "vesselId", latitude, longitude
            FROM vessel_positions
            WHERE timestamp >= NOW() - INTERVAL '1 day'
            ORDER BY "vesselId", timestamp DESC
          ) latest
          WHERE latitude BETWEEN 29.8 AND 31.2
            AND longitude BETWEEN 32.0 AND 32.6
        `;

        // Fun Fact #17: Ships at Cape of Good Hope - ⚡⚡⚡ FAST: Recent data only
        const shipsAtCape = await prisma.$queryRaw<Array<{ count: number }>>`
          SELECT COUNT(DISTINCT "vesselId")::int as count
          FROM (
            SELECT DISTINCT ON ("vesselId") "vesselId", latitude, longitude
            FROM vessel_positions
            WHERE timestamp >= NOW() - INTERVAL '1 day'
            ORDER BY "vesselId", timestamp DESC
          ) latest
          WHERE latitude BETWEEN -35.0 AND -33.8
            AND longitude BETWEEN 18.0 AND 19.0
        `;

        // Fun Fact #18: Total coverage area in square miles
        const latSpanDegrees = geo ? geo.maxLat - geo.minLat : 0;
        const lonSpanDegrees = geo ? geo.maxLon - geo.minLon : 0;
        // Approximate: 1 degree latitude = 69 miles, 1 degree longitude varies by latitude
        // Use average latitude for longitude calculation
        const avgLat = geo ? (geo.maxLat + geo.minLat) / 2 : 0;
        const milesPerDegreeLon = 69 * Math.cos(avgLat * Math.PI / 180);
        const coverageWidthMiles = lonSpanDegrees * milesPerDegreeLon;
        const coverageHeightMiles = latSpanDegrees * 69;
        const coverageSqMiles = Math.floor(coverageWidthMiles * coverageHeightMiles);
        const coverageSqKm = Math.floor(coverageSqMiles * 2.59);

        const realTimeStats = {
          shipsMovingNow: shipsMoving[0]?.count || 0,
          shipsAtAnchor: vesselsCount - (shipsMoving[0]?.count || 0),
          shipsOnEquator: shipsOnEquator[0]?.count || 0,
          shipsAtSuez: shipsAtSuez[0]?.count || 0,
          shipsAtCapeOfGoodHope: shipsAtCape[0]?.count || 0,
          coverageSqMiles,
          coverageSqKm,
        };

        // ⚡ PERFORMANCE: Skip superlative ship queries for now (can add to materialized view)
        // These queries are moderate cost but can be pre-computed daily
        // TODO: Create daily materialized view for biggest/fastest ships
        const biggestTanker = null;
        const biggestBulker = null;
        const biggestContainer = null;
        const fastestShipNow = null;
        const fastestContainer = null;

        const mari8xosrmIntelligence = {
          routesLearned: extractedRoutes,
          avgDistanceFactor: avgFactor._avg.distanceFactor || 0,
          compressionRatio,
          intelligenceExtracted: `From ${totalPositions.toLocaleString()} positions → ${extractedRoutes} smart routes`,
          insight: compressionRatio > 0
            ? `Mari8XOSRM compresses ${compressionRatio.toLocaleString()}:1 - ${extractedRoutes} routes capture the essence of 56M positions!`
            : 'Building maritime intelligence from AIS data...',
        };

        const result = {
          dataScale,
          timeCoverage,
          topSpeedRecords,
          mostActiveShips,
          geoCoverage,
          last7DaysTrend: last7Days,
          mari8xosrmIntelligence,
          nearestToNorthPole,
          nearestToSouthPole,
          realTimeStats,
          biggestTanker,
          biggestBulker,
          biggestContainer,
          fastestShipNow,
          fastestContainer,
          lastUpdated: new Date().toISOString(),
        };

        const duration = Date.now() - startTime;
        logger.info(`✅ AIS Fun Facts computed in ${duration}ms - caching for ${CACHE_TTL / 1000}s`);

        // Update cache
        cachedFunFacts = result;
        cacheTimestamp = now;

        return result;
      } catch (error: any) {
        logger.error('Failed to fetch AIS fun facts:', error);
        throw new Error(`Failed to fetch fun facts: ${error.message}`);
      }
    },
  })
);
