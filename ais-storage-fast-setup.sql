-- ============================================================================
-- AIS Intelligent Storage - FAST SETUP (No immediate data processing)
-- ============================================================================
-- This creates the structure and policies without populating aggregates
-- TimescaleDB will populate them gradually in the background
-- ============================================================================

-- Clean up if exists
DROP MATERIALIZED VIEW IF EXISTS vessel_positions_hourly CASCADE;
DROP MATERIALIZED VIEW IF EXISTS vessel_positions_daily CASCADE;

-- ============================================================================
-- PART 1: CREATE CONTINUOUS AGGREGATES (WITHOUT INITIAL DATA)
-- ============================================================================

-- Hourly aggregates (creates structure only, no data yet)
CREATE MATERIALIZED VIEW vessel_positions_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', timestamp) AS hour,
  "vesselId",
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latitude) AS lat,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY longitude) AS lon,
  AVG(speed) AS avg_speed,
  MAX(speed) AS max_speed,
  AVG(course) AS avg_course,
  AVG(heading) AS avg_heading,
  MIN(latitude) AS min_lat,
  MAX(latitude) AS max_lat,
  MIN(longitude) AS min_lon,
  MAX(longitude) AS max_lon,
  COUNT(*) AS position_count,
  FIRST(source, timestamp) AS source
FROM vessel_positions
GROUP BY hour, "vesselId"
WITH NO DATA;  -- Don't populate yet!

-- Daily aggregates (creates structure only, no data yet)
CREATE MATERIALIZED VIEW vessel_positions_daily
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', timestamp) AS day,
  "vesselId",
  COUNT(*) AS total_positions,
  AVG(speed) AS avg_speed,
  MAX(speed) AS max_speed,
  FIRST(latitude, timestamp) AS start_lat,
  FIRST(longitude, timestamp) AS start_lon,
  LAST(latitude, timestamp) AS end_lat,
  LAST(longitude, timestamp) AS end_lon,
  MIN(latitude) AS min_lat,
  MAX(latitude) AS max_lat,
  MIN(longitude) AS min_lon,
  MAX(longitude) AS max_lon,
  SUM(CASE WHEN speed < 1 THEN 1 ELSE 0 END) AS stationary_count,
  FIRST(source, timestamp) AS source
FROM vessel_positions
GROUP BY day, "vesselId"
WITH NO DATA;  -- Don't populate yet!

-- ============================================================================
-- PART 2: ADD REFRESH POLICIES (Background population)
-- ============================================================================

-- Hourly: Refresh every 30 minutes for last 7 days
SELECT add_continuous_aggregate_policy('vessel_positions_hourly',
  start_offset => INTERVAL '7 days',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '30 minutes');

-- Daily: Refresh once per day for last 90 days
SELECT add_continuous_aggregate_policy('vessel_positions_daily',
  start_offset => INTERVAL '90 days',
  end_offset => INTERVAL '1 day',
  schedule_interval => INTERVAL '1 day');

-- ============================================================================
-- PART 3: DATA RETENTION POLICIES (Automatic cleanup)
-- ============================================================================

-- Remove existing retention policies if any
SELECT remove_retention_policy('vessel_positions', if_exists => true);
SELECT remove_retention_policy('vessel_positions_hourly', if_exists => true);
SELECT remove_retention_policy('vessel_positions_daily', if_exists => true);

-- Drop raw positions older than 30 days (keep hourly aggregates)
SELECT add_retention_policy('vessel_positions', INTERVAL '30 days');

-- Drop hourly aggregates older than 1 year (keep daily aggregates)
SELECT add_retention_policy('vessel_positions_hourly', INTERVAL '365 days');

-- Keep daily aggregates for 5 years
SELECT add_retention_policy('vessel_positions_daily', INTERVAL '1825 days');

-- ============================================================================
-- PART 4: FORCE IMMEDIATE REFRESH FOR RECENT DATA (Last 7 days only)
-- ============================================================================

-- Refresh just the last 7 days (much faster than all 6 months)
CALL refresh_continuous_aggregate('vessel_positions_hourly',
  NOW() - INTERVAL '7 days',
  NOW());

CALL refresh_continuous_aggregate('vessel_positions_daily',
  NOW() - INTERVAL '7 days',
  NOW());

-- ============================================================================
-- SUMMARY VIEW
-- ============================================================================

CREATE OR REPLACE VIEW vessel_storage_summary AS
SELECT
  'Total chunks' AS metric,
  COUNT(*)::TEXT AS value
FROM timescaledb_information.chunks
WHERE hypertable_name = 'vessel_positions'

UNION ALL

SELECT
  'Compressed chunks',
  COUNT(CASE WHEN is_compressed THEN 1 END)::TEXT
FROM timescaledb_information.chunks
WHERE hypertable_name = 'vessel_positions'

UNION ALL

SELECT
  'Total size',
  pg_size_pretty(SUM(pg_total_relation_size(format('%I.%I', chunk_schema, chunk_name))))
FROM timescaledb_information.chunks
WHERE hypertable_name = 'vessel_positions'

UNION ALL

SELECT
  'Oldest data',
  MIN(range_start)::TEXT
FROM timescaledb_information.chunks
WHERE hypertable_name = 'vessel_positions'

UNION ALL

SELECT
  'Newest data',
  MAX(range_end)::TEXT
FROM timescaledb_information.chunks
WHERE hypertable_name = 'vessel_positions';

-- Show summary
SELECT * FROM vessel_storage_summary;

-- ============================================================================
-- DONE!
-- ============================================================================
-- The aggregates will populate gradually in the background
-- The retention policy will start deleting data older than 30 days
-- Expected space savings: 80-90% over next 30 days
-- ============================================================================
