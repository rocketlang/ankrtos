/**
 * AIS Live Stats - Fast count from ais_live_count table
 * Updated every 15 minutes via cron for <10ms query time
 * Shows near-real-time data including today's new millions
 */

import { builder } from '../builder.js';
import { prisma } from '../../lib/prisma.js';

const AISLiveStatsType = builder.objectRef<{
  totalPositions: number;
  uniqueVessels: number;
  lastUpdated: Date;
}>('AISLiveStats');

AISLiveStatsType.implement({
  fields: (t) => ({
    totalPositions: t.exposeInt('totalPositions'),
    uniqueVessels: t.exposeInt('uniqueVessels'),
    lastUpdated: t.expose('lastUpdated', { type: 'DateTime' }),
  }),
});

builder.queryFields((t) => ({
  aisLiveStats: t.field({
    type: AISLiveStatsType,
    description: 'Near-real-time AIS statistics (updated every 15 min) - includes today\'s new data',
    resolve: async () => {
      const startTime = Date.now();

      // Query from fast counter table (updated every 15 min by cron)
      // This gives us <10ms queries instead of 37s full table counts
      const [stats] = await prisma.$queryRaw<Array<{
        total_positions: bigint;
        unique_vessels: bigint;
        last_updated: Date;
      }>>`
        SELECT
          total_positions,
          unique_vessels,
          last_updated
        FROM ais_live_count
        ORDER BY last_updated DESC
        LIMIT 1
      `;

      const queryTime = Date.now() - startTime;
      console.log(`[AIS Live Stats] Fast counter query completed in ${queryTime}ms`);

      // If no data in table yet, return zeros
      if (!stats) {
        return {
          totalPositions: 0,
          uniqueVessels: 0,
          lastUpdated: new Date(),
        };
      }

      return {
        totalPositions: Number(stats.total_positions),
        uniqueVessels: Number(stats.unique_vessels),
        lastUpdated: stats.last_updated,
      };
    },
  }),
}));
