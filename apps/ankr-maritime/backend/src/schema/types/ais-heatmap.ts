/**
 * AIS Global Heatmap Data
 *
 * Provides aggregated position data for heatmap visualization
 * Pre-computed daily to avoid scanning 52M+ rows on every request
 */

import { builder } from '../builder.js';
import { prisma } from '../../lib/prisma.js';

// Heatmap Point Type
const HeatmapPointRef = builder.objectRef<{
  lat: number;
  lng: number;
  intensity: number;
}>('HeatmapPoint');

HeatmapPointRef.implement({
  fields: (t) => ({
    lat: t.exposeFloat('lat'),
    lng: t.exposeFloat('lng'),
    intensity: t.exposeInt('intensity'),
  }),
});

// Heatmap Data Type
const AISHeatmapDataRef = builder.objectRef<{
  points: Array<{ lat: number; lng: number; intensity: number }>;
  totalPoints: number;
  lastUpdated: Date;
}>('AISHeatmapData');

AISHeatmapDataRef.implement({
  fields: (t) => ({
    points: t.field({
      type: [HeatmapPointRef],
      resolve: (parent) => parent.points,
    }),
    totalPoints: t.exposeInt('totalPoints'),
    lastUpdated: t.expose('lastUpdated', { type: 'DateTime' }),
  }),
});

// Cache for heatmap data (refresh every 1 hour)
let cachedHeatmapData: {
  points: Array<{ lat: number; lng: number; intensity: number }>;
  totalPoints: number;
  lastUpdated: Date;
} | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 1 * 60 * 60 * 1000; // 1 hour

async function getAISHeatmapData() {
  const now = Date.now();

  // Return cached data if valid
  if (cachedHeatmapData && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedHeatmapData;
  }

  console.log('[AIS Heatmap] Computing heatmap data...');

  try {
    // Aggregate positions into 1-degree grid cells
    // This reduces 52M positions to ~64K grid cells (180x360)
    const gridData = await prisma.$queryRaw<Array<{
      lat_bucket: number;
      lng_bucket: number;
      count: bigint;
    }>>`
      SELECT
        FLOOR(latitude) as lat_bucket,
        FLOOR(longitude) as lng_bucket,
        COUNT(*) as count
      FROM vessel_positions
      WHERE timestamp > NOW() - INTERVAL '7 days'
      GROUP BY FLOOR(latitude), FLOOR(longitude)
      HAVING COUNT(*) > 5
      ORDER BY count DESC
      LIMIT 10000
    `;

    const points = gridData.map(row => ({
      lat: Number(row.lat_bucket),
      lng: Number(row.lng_bucket),
      intensity: Number(row.count),
    }));

    const totalPoints = points.reduce((sum, p) => sum + p.intensity, 0);

    cachedHeatmapData = {
      points,
      totalPoints,
      lastUpdated: new Date(),
    };
    cacheTimestamp = now;

    console.log(`[AIS Heatmap] Generated ${points.length} heatmap points from ${totalPoints} positions`);

    return cachedHeatmapData;
  } catch (error) {
    console.error('[AIS Heatmap] Error generating heatmap:', error);

    // Return empty data on error
    return {
      points: [],
      totalPoints: 0,
      lastUpdated: new Date(),
    };
  }
}

// Query
builder.queryField('aisHeatmapData', (t) =>
  t.field({
    type: AISHeatmapDataRef,
    description: 'Global AIS heatmap data (aggregated into grid cells, cached for 1 hour)',
    resolve: async () => {
      return await getAISHeatmapData();
    },
  })
);
