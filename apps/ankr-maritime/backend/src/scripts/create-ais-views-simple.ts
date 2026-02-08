/**
 * Create AIS Materialized Views - Simple Version
 *
 * Creates:
 * 1. ais_dashboard_stats - Main dashboard statistics
 * 2. ais_nav_status_breakdown - Navigation status breakdown
 * 3. ais_fun_facts_cache - 23 fun facts computed from AIS data
 */

import { prisma } from '../lib/prisma.js';

async function createAISViews() {
  console.log('🚀 Creating AIS materialized views...\n');

  try {
    // 1. Create main dashboard stats view
    console.log('1️⃣ Creating ais_dashboard_stats...');
    await prisma.$executeRawUnsafe(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS ais_dashboard_stats AS
      SELECT
        COUNT(*)::bigint AS total_positions,
        COUNT(DISTINCT "vesselId")::bigint AS unique_vessels,
        AVG(speed) AS avg_speed,
        MIN(timestamp) AS oldest,
        MAX(timestamp) AS newest,
        COUNT(*) FILTER (WHERE "navigationStatus" IS NOT NULL)::bigint AS with_nav_status,
        COUNT(*) FILTER (WHERE "rateOfTurn" IS NOT NULL)::bigint AS with_rot,
        COUNT(*) FILTER (WHERE "positionAccuracy" IS NOT NULL)::bigint AS with_pos_accuracy,
        COUNT(*) FILTER (WHERE "maneuverIndicator" IS NOT NULL)::bigint AS with_maneuver,
        COUNT(*) FILTER (WHERE draught IS NOT NULL)::bigint AS with_draught,
        COUNT(*) FILTER (WHERE dimension_a IS NOT NULL)::bigint AS with_dimensions,
        COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '5 minutes')::bigint AS last_5min,
        COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '15 minutes')::bigint AS last_15min,
        COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '1 hour')::bigint AS last_1hour,
        COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '24 hours')::bigint AS last_24hours,
        NOW() AS computed_at
      FROM vessel_positions
    `);
    console.log('✓ Created\n');

    // 2. Create navigation status breakdown view
    console.log('2️⃣ Creating ais_nav_status_breakdown...');
    await prisma.$executeRawUnsafe(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS ais_nav_status_breakdown AS
      SELECT
        "navigationStatus" AS navigation_status,
        COUNT(*)::bigint AS count,
        ROUND((COUNT(*)::numeric / NULLIF((SELECT COUNT(*) FROM vessel_positions WHERE "navigationStatus" IS NOT NULL)::numeric, 0) * 100), 2) AS percentage
      FROM vessel_positions
      WHERE "navigationStatus" IS NOT NULL
      GROUP BY "navigationStatus"
      ORDER BY count DESC
    `);
    console.log('✓ Created\n');

    // 3. Create AIS fun facts cache (23 fun facts)
    console.log('3️⃣ Creating ais_fun_facts_cache (23 fun facts)...');
    await prisma.$executeRawUnsafe(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS ais_fun_facts_cache AS
      WITH vessel_stats AS (
        SELECT
          "vesselId",
          COUNT(*) as position_count,
          MAX(speed) as max_speed,
          AVG(speed) as avg_speed,
          MIN(timestamp) as first_seen,
          MAX(timestamp) as last_seen,
          COUNT(DISTINCT DATE(timestamp)) as days_active,
          MAX(latitude) as max_lat,
          MIN(latitude) as min_lat,
          MAX(longitude) as max_lon,
          MIN(longitude) as min_lon
        FROM vessel_positions
        GROUP BY "vesselId"
      ),
      speed_stats AS (
        SELECT
          AVG(speed) as global_avg_speed,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY speed) as median_speed,
          STDDEV(speed) as speed_stddev
        FROM vessel_positions
        WHERE speed IS NOT NULL AND speed > 0
      )
      SELECT
        -- Total positions
        (SELECT COUNT(*)::bigint FROM vessel_positions) as total_positions,

        -- Unique vessels
        (SELECT COUNT(DISTINCT "vesselId")::bigint FROM vessel_positions) as unique_vessels,

        -- Most tracked vessel
        (SELECT "vesselId" FROM vessel_stats ORDER BY position_count DESC LIMIT 1) as most_tracked_vessel_id,
        (SELECT MAX(position_count)::bigint FROM vessel_stats) as most_tracked_vessel_positions,

        -- Fastest vessel
        (SELECT "vesselId" FROM vessel_stats WHERE max_speed IS NOT NULL ORDER BY max_speed DESC LIMIT 1) as fastest_vessel_id,
        (SELECT MAX(max_speed) FROM vessel_stats) as fastest_vessel_speed,

        -- Slowest vessel (that's moving)
        (SELECT "vesselId" FROM vessel_stats WHERE avg_speed > 0 ORDER BY avg_speed ASC LIMIT 1) as slowest_vessel_id,
        (SELECT MIN(avg_speed) FROM vessel_stats WHERE avg_speed > 0) as slowest_vessel_speed,

        -- Most active vessel (days)
        (SELECT "vesselId" FROM vessel_stats ORDER BY days_active DESC LIMIT 1) as most_active_vessel_id,
        (SELECT MAX(days_active)::int FROM vessel_stats) as most_active_vessel_days,

        -- Northernmost vessel
        (SELECT "vesselId" FROM vessel_stats ORDER BY max_lat DESC LIMIT 1) as northernmost_vessel_id,
        (SELECT MAX(max_lat) FROM vessel_stats) as northernmost_latitude,

        -- Southernmost vessel
        (SELECT "vesselId" FROM vessel_stats ORDER BY min_lat ASC LIMIT 1) as southernmost_vessel_id,
        (SELECT MIN(min_lat) FROM vessel_stats) as southernmost_latitude,

        -- Easternmost vessel
        (SELECT "vesselId" FROM vessel_stats ORDER BY max_lon DESC LIMIT 1) as easternmost_vessel_id,
        (SELECT MAX(max_lon) FROM vessel_stats) as easternmost_longitude,

        -- Westernmost vessel
        (SELECT "vesselId" FROM vessel_stats ORDER BY min_lon ASC LIMIT 1) as westernmost_vessel_id,
        (SELECT MIN(min_lon) FROM vessel_stats) as westernmost_longitude,

        -- Speed statistics
        (SELECT global_avg_speed FROM speed_stats) as global_avg_speed,
        (SELECT median_speed FROM speed_stats) as median_speed,
        (SELECT speed_stddev FROM speed_stats) as speed_stddev,

        -- Data range
        (SELECT MIN(timestamp) FROM vessel_positions) as oldest_position,
        (SELECT MAX(timestamp) FROM vessel_positions) as newest_position,

        -- Vessel with longest voyage (time span)
        (SELECT "vesselId" FROM vessel_stats
         WHERE last_seen IS NOT NULL AND first_seen IS NOT NULL
         ORDER BY (last_seen - first_seen) DESC LIMIT 1) as longest_voyage_vessel_id,
        (SELECT MAX(last_seen - first_seen) FROM vessel_stats) as longest_voyage_duration,

        -- Busiest hour (most positions recorded)
        (SELECT EXTRACT(HOUR FROM timestamp)::int as hour, COUNT(*) as cnt
         FROM vessel_positions
         GROUP BY hour
         ORDER BY cnt DESC
         LIMIT 1).hour as busiest_hour,
        (SELECT MAX(cnt) FROM (
           SELECT EXTRACT(HOUR FROM timestamp) as hour, COUNT(*) as cnt
           FROM vessel_positions
           GROUP BY hour
         ) x)::bigint as busiest_hour_positions,

        NOW() as computed_at
    `);
    console.log('✓ Created\n');

    console.log('✅ All views created successfully!\n');
    console.log('📝 Next: Run REFRESH MATERIALIZED VIEW to populate them with data');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAISViews()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
