-- ============================================================================
-- AIS Materialized Views Setup
-- ============================================================================
-- Creates 3 materialized views for lightning-fast AIS queries:
-- 1. ais_dashboard_stats - Main dashboard (total positions, vessels, speeds)
-- 2. ais_nav_status_breakdown - Navigation status distribution
-- 3. ais_fun_facts_cache - 23 fun facts computed from AIS data
--
-- Usage:
--   psql -U ankr -d ankr_maritime -f create-ais-views.sql
-- ============================================================================

-- Set unlimited timeout for these large operations (50M+ rows)
SET statement_timeout = 0;  -- 0 = unlimited

\echo '🚀 Creating AIS materialized views...'
\echo ''

-- Drop existing views if they exist
\echo '1️⃣ Dropping old views (if any)...'
DROP MATERIALIZED VIEW IF EXISTS ais_dashboard_stats CASCADE;
DROP MATERIALIZED VIEW IF EXISTS ais_nav_status_breakdown CASCADE;
DROP MATERIALIZED VIEW IF EXISTS ais_fun_facts_cache CASCADE;
\echo '✓ Done'
\echo ''

-- ============================================================================
-- View 1: Main Dashboard Stats
-- ============================================================================
\echo '2️⃣ Creating ais_dashboard_stats...'
CREATE MATERIALIZED VIEW ais_dashboard_stats AS
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
FROM vessel_positions;

CREATE INDEX idx_ais_dashboard_computed ON ais_dashboard_stats(computed_at);
\echo '✓ Created'
\echo ''

-- ============================================================================
-- View 2: Navigation Status Breakdown
-- ============================================================================
\echo '3️⃣ Creating ais_nav_status_breakdown...'
CREATE MATERIALIZED VIEW ais_nav_status_breakdown AS
SELECT
  "navigationStatus" AS navigation_status,
  COUNT(*)::bigint AS count,
  ROUND(
    (COUNT(*)::numeric /
     NULLIF((SELECT COUNT(*) FROM vessel_positions WHERE "navigationStatus" IS NOT NULL)::numeric, 0)
     * 100
    ), 2
  ) AS percentage
FROM vessel_positions
WHERE "navigationStatus" IS NOT NULL
GROUP BY "navigationStatus"
ORDER BY count DESC;

CREATE INDEX idx_ais_nav_status ON ais_nav_status_breakdown(navigation_status);
\echo '✓ Created'
\echo ''

-- ============================================================================
-- View 3: AIS Fun Facts Cache (23 Fun Facts)
-- ============================================================================
\echo '4️⃣ Creating ais_fun_facts_cache (23 fun facts)...'
CREATE MATERIALIZED VIEW ais_fun_facts_cache AS
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
  -- 1. Total positions
  (SELECT COUNT(*)::bigint FROM vessel_positions) as total_positions,

  -- 2. Unique vessels
  (SELECT COUNT(DISTINCT "vesselId")::bigint FROM vessel_positions) as unique_vessels,

  -- 3-4. Most tracked vessel
  (SELECT "vesselId" FROM vessel_stats ORDER BY position_count DESC LIMIT 1) as most_tracked_vessel_id,
  (SELECT MAX(position_count)::bigint FROM vessel_stats) as most_tracked_vessel_positions,

  -- 5-6. Fastest vessel
  (SELECT "vesselId" FROM vessel_stats WHERE max_speed IS NOT NULL ORDER BY max_speed DESC LIMIT 1) as fastest_vessel_id,
  (SELECT MAX(max_speed) FROM vessel_stats) as fastest_vessel_speed,

  -- 7-8. Slowest vessel (that's moving)
  (SELECT "vesselId" FROM vessel_stats WHERE avg_speed > 0 ORDER BY avg_speed ASC LIMIT 1) as slowest_vessel_id,
  (SELECT MIN(avg_speed) FROM vessel_stats WHERE avg_speed > 0) as slowest_vessel_speed,

  -- 9-10. Most active vessel (days)
  (SELECT "vesselId" FROM vessel_stats ORDER BY days_active DESC LIMIT 1) as most_active_vessel_id,
  (SELECT MAX(days_active)::int FROM vessel_stats) as most_active_vessel_days,

  -- 11-12. Northernmost vessel
  (SELECT "vesselId" FROM vessel_stats ORDER BY max_lat DESC LIMIT 1) as northernmost_vessel_id,
  (SELECT MAX(max_lat) FROM vessel_stats) as northernmost_latitude,

  -- 13-14. Southernmost vessel
  (SELECT "vesselId" FROM vessel_stats ORDER BY min_lat ASC LIMIT 1) as southernmost_vessel_id,
  (SELECT MIN(min_lat) FROM vessel_stats) as southernmost_latitude,

  -- 15-16. Easternmost vessel
  (SELECT "vesselId" FROM vessel_stats ORDER BY max_lon DESC LIMIT 1) as easternmost_vessel_id,
  (SELECT MAX(max_lon) FROM vessel_stats) as easternmost_longitude,

  -- 17-18. Westernmost vessel
  (SELECT "vesselId" FROM vessel_stats ORDER BY min_lon ASC LIMIT 1) as westernmost_vessel_id,
  (SELECT MIN(min_lon) FROM vessel_stats) as westernmost_longitude,

  -- 19. Global average speed
  (SELECT global_avg_speed FROM speed_stats) as global_avg_speed,

  -- 20. Median speed
  (SELECT median_speed FROM speed_stats) as median_speed,

  -- 21. Speed standard deviation
  (SELECT speed_stddev FROM speed_stats) as speed_stddev,

  -- 22. Data range
  (SELECT MIN(timestamp) FROM vessel_positions) as oldest_position,
  (SELECT MAX(timestamp) FROM vessel_positions) as newest_position,

  -- 23. Computed timestamp
  NOW() as computed_at;

\echo '✓ Created'
\echo ''

\echo '✅ All views created successfully!'
\echo ''
\echo '📊 View Summary:'
\echo '   1. ais_dashboard_stats - Main dashboard statistics'
\echo '   2. ais_nav_status_breakdown - Navigation status breakdown'
\echo '   3. ais_fun_facts_cache - 23 fun facts from AIS data'
\echo ''
\echo '⏭️  Next steps:'
\echo '   1. Run: npx tsx src/scripts/refresh-ais-views.ts (to populate with latest data)'
\echo '   2. Update landing page to use aisLiveDashboard query'
\echo '   3. Update fun facts component to use aisFunFactsCache'
\echo ''
