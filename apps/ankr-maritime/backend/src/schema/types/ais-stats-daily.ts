/**
 * Daily AIS Stats - Lightning Fast ⚡
 *
 * Serves pre-computed stats from JSON file (instant access)
 * Updates once per day via cron job
 */

import { builder } from '../builder.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createChildLogger } from '../../utils/logger.js';

const logger = createChildLogger({ module: 'ais-stats-daily' });

// Type: Trend Data Point
const TrendDataPoint = builder.objectRef<{
  date: string;
  count: number;
}>('TrendDataPoint').implement({
  fields: (t) => ({
    date: t.exposeString('date'),
    count: t.exposeInt('count'),
  }),
});

// Type: Daily AIS Stats
const DailyAISStats = builder.objectRef<{
  totalPositions: number;
  uniqueVessels: number;
  avgPositionsPerShip: number;
  earliestDate: string;
  latestDate: string;
  durationDays: number;
  shipsMovingNow: number;
  shipsAtAnchor: number;
  shipsOnEquator: number;
  shipsAtSuez: number;
  coverageLatSpan: number;
  coverageLonSpan: number;
  coveragePercent: number;
  last7DaysTrend: Array<{ date: string; count: number }>;
  lastUpdated: string;
  computedIn: number;
}>('DailyAISStats').implement({
  fields: (t) => ({
    totalPositions: t.exposeInt('totalPositions'),
    uniqueVessels: t.exposeInt('uniqueVessels'),
    avgPositionsPerShip: t.exposeInt('avgPositionsPerShip'),
    earliestDate: t.exposeString('earliestDate'),
    latestDate: t.exposeString('latestDate'),
    durationDays: t.exposeInt('durationDays'),
    shipsMovingNow: t.exposeInt('shipsMovingNow'),
    shipsAtAnchor: t.exposeInt('shipsAtAnchor'),
    shipsOnEquator: t.exposeInt('shipsOnEquator'),
    shipsAtSuez: t.exposeInt('shipsAtSuez'),
    coverageLatSpan: t.exposeFloat('coverageLatSpan'),
    coverageLonSpan: t.exposeFloat('coverageLonSpan'),
    coveragePercent: t.exposeFloat('coveragePercent'),
    last7DaysTrend: t.field({
      type: [TrendDataPoint],
      resolve: (parent) => parent.last7DaysTrend,
    }),
    lastUpdated: t.exposeString('lastUpdated'),
    computedIn: t.exposeInt('computedIn'),
  }),
});

// Cache the file contents (reload every 5 minutes in case file updates)
let cachedStats: any = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function loadDailyStats() {
  const now = Date.now();

  // Return cached if fresh
  if (cachedStats && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedStats;
  }

  try {
    const filePath = join(process.cwd(), 'public', 'ais-stats-daily.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    cachedStats = JSON.parse(fileContent);
    cacheTimestamp = now;
    logger.info('📊 Loaded daily AIS stats from file');
    return cachedStats;
  } catch (error: any) {
    logger.warn('⚠️ Daily stats file not found, returning default values');
    // Return default values if file doesn't exist yet
    return {
      totalPositions: 0,
      uniqueVessels: 0,
      avgPositionsPerShip: 0,
      earliestDate: new Date().toISOString(),
      latestDate: new Date().toISOString(),
      durationDays: 0,
      shipsMovingNow: 0,
      shipsAtAnchor: 0,
      shipsOnEquator: 0,
      shipsAtSuez: 0,
      coverageLatSpan: 0,
      coverageLonSpan: 0,
      coveragePercent: 0,
      last7DaysTrend: [],
      lastUpdated: new Date().toISOString(),
      computedIn: 0,
    };
  }
}

// Query: dailyAISStats (⚡ INSTANT - reads from JSON file)
builder.queryField('dailyAISStats', (t) =>
  t.field({
    type: DailyAISStats,
    resolve: () => {
      const stats = loadDailyStats();
      logger.info(`✅ Served daily AIS stats in <1ms (last updated: ${stats.lastUpdated})`);
      return stats;
    },
  })
);
