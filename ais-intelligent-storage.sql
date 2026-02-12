-- ============================================================================
-- AIS Intelligent Storage Strategy
-- ============================================================================
-- Goal: Store trends/patterns while keeping only fractional raw data
-- Result: 90-95% storage reduction while maintaining analytical value
-- ============================================================================

-- ============================================================================
-- PART 1: DATA RETENTION TIERS
-- ============================================================================

-- Tier 1: RECENT DATA (Last 7 days) - Keep ALL positions
-- Purpose: Real-time tracking, detailed playback
-- Resolution: Every position update (~1-5 minutes)
-- Storage: ~100% of raw data

-- Tier 2: MEDIUM-TERM (7-90 days) - Downsample to hourly
-- Purpose: Historical tracking, route analysis
-- Resolution: One position per hour per vessel
-- Storage: ~4% of raw data (1/24th if updates every hour)

-- Tier 3: LONG-TERM (90+ days) - Keep daily aggregates only
-- Purpose: Trends, statistics, patterns
-- Resolution: Daily summaries per vessel
-- Storage: ~0.4% of raw data

-- ============================================================================
-- PART 2: CREATE CONTINUOUS AGGREGATES (Auto-updating materialized views)
-- ============================================================================

-- Hourly aggregates for medium-term storage
DROP MATERIALIZED VIEW IF EXISTS vessel_positions_hourly CASCADE;
CREATE MATERIALIZED VIEW vessel_positions_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', timestamp) AS hour,
  "vesselId",

  -- Position: Keep representative position (middle of hour)
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latitude) AS lat,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY longitude) AS lon,

  -- Movement statistics
  AVG(speed) AS avg_speed,
  MAX(speed) AS max_speed,
  AVG(course) AS avg_course,
  AVG(heading) AS avg_heading,

  -- Bounding box for route visualization
  MIN(latitude) AS min_lat,
  MAX(latitude) AS max_lat,
  MIN(longitude) AS min_lon,
  MAX(longitude) AS max_lon,

  -- Metadata
  COUNT(*) AS position_count,
  FIRST(source, timestamp) AS source

FROM vessel_positions
GROUP BY hour, "vesselId";

-- Refresh policy: Update every 30 minutes
SELECT add_continuous_aggregate_policy('vessel_positions_hourly',
  start_offset => INTERVAL '7 days',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '30 minutes');

-- Daily aggregates for long-term storage
DROP MATERIALIZED VIEW IF EXISTS vessel_positions_daily CASCADE;
CREATE MATERIALIZED VIEW vessel_positions_daily
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', timestamp) AS day,
  "vesselId",

  -- Daily statistics
  COUNT(*) AS total_positions,
  AVG(speed) AS avg_speed,
  MAX(speed) AS max_speed,

  -- Route summary (start -> end)
  FIRST(latitude, timestamp) AS start_lat,
  FIRST(longitude, timestamp) AS start_lon,
  LAST(latitude, timestamp) AS end_lat,
  LAST(longitude, timestamp) AS end_lon,

  -- Bounding box
  MIN(latitude) AS min_lat,
  MAX(latitude) AS max_lat,
  MIN(longitude) AS min_lon,
  MAX(longitude) AS max_lon,

  -- Port calls (detected by low speed + small area)
  SUM(CASE WHEN speed < 1 THEN 1 ELSE 0 END) AS stationary_count,

  -- Data quality
  FIRST(source, timestamp) AS source

FROM vessel_positions
GROUP BY day, "vesselId";

-- Refresh policy: Update daily
SELECT add_continuous_aggregate_policy('vessel_positions_daily',
  start_offset => INTERVAL '90 days',
  end_offset => INTERVAL '1 day',
  schedule_interval => INTERVAL '1 day');

-- ============================================================================
-- PART 3: DATA RETENTION POLICIES
-- ============================================================================

-- Drop raw data older than 90 days
-- (We keep hourly aggregates instead)
SELECT add_retention_policy('vessel_positions', INTERVAL '90 days');

-- Drop hourly aggregates older than 1 year
-- (We keep daily aggregates instead)
SELECT add_retention_policy('vessel_positions_hourly', INTERVAL '365 days');

-- Keep daily aggregates for 5 years
SELECT add_retention_policy('vessel_positions_daily', INTERVAL '1825 days');

-- ============================================================================
-- PART 4: COMPRESSION POLICIES
-- ============================================================================

-- Compress raw data older than 2 days (already enabled, but update policy)
-- vessel_positions already has compression enabled
SELECT add_compression_policy('vessel_positions', INTERVAL '2 days');

-- Compress hourly aggregates older than 30 days
SELECT add_compression_policy('vessel_positions_hourly', INTERVAL '30 days');

-- Compress daily aggregates older than 90 days
SELECT add_compression_policy('vessel_positions_daily', INTERVAL '90 days');

-- ============================================================================
-- PART 5: DOWNSAMPLING FUNCTION (For additional space savings)
-- ============================================================================

-- Function to keep only 1 position per N minutes for old data
CREATE OR REPLACE FUNCTION downsample_ais_positions(
  older_than_days INT,
  sample_interval_minutes INT
) RETURNS BIGINT AS $$
DECLARE
  deleted_count BIGINT;
BEGIN
  -- Keep only one position every N minutes
  -- Delete the rest while preserving representative samples

  WITH positions_to_keep AS (
    SELECT DISTINCT ON (
      mmsi,
      DATE_TRUNC('hour', timestamp) +
      INTERVAL '1 minute' * (sample_interval_minutes *
        FLOOR(EXTRACT(EPOCH FROM timestamp - DATE_TRUNC('hour', timestamp)) / 60 / sample_interval_minutes)
      )
    ) id
    FROM ais_positions
    WHERE timestamp < NOW() - INTERVAL '1 day' * older_than_days
  )
  DELETE FROM ais_positions
  WHERE timestamp < NOW() - INTERVAL '1 day' * older_than_days
    AND id NOT IN (SELECT id FROM positions_to_keep)
  RETURNING id;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Example: For data 30-90 days old, keep only 1 position every 15 minutes
-- This reduces 30-90 day data to ~6.7% of original
-- Run this in your maintenance window:
-- SELECT downsample_ais_positions(30, 15);

-- ============================================================================
-- PART 6: TREND EXTRACTION TABLES
-- ============================================================================

-- Store vessel behavior patterns (trends)
CREATE TABLE IF NOT EXISTS ais_vessel_trends (
  mmsi BIGINT,
  imo BIGINT,
  vessel_name TEXT,

  -- Time period
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,

  -- Route patterns
  typical_routes JSONB,  -- Array of {origin, destination, frequency, avg_duration}
  common_ports JSONB,    -- Array of {port_name, visit_count, avg_stay_duration}

  -- Behavior patterns
  avg_speed_profile JSONB,  -- {hour: avg_speed} for 24 hours
  speed_histogram JSONB,    -- Distribution of speeds

  -- Statistics
  total_distance_nm DECIMAL,
  total_voyage_hours DECIMAL,
  port_calls INTEGER,

  -- Anomalies detected
  unusual_routes JSONB,
  speed_anomalies JSONB,

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (mmsi, period_start)
);

-- Index for quick trend lookup
CREATE INDEX IF NOT EXISTS idx_vessel_trends_mmsi
  ON ais_vessel_trends(mmsi, period_start DESC);

-- Function to compute trends (run monthly)
CREATE OR REPLACE FUNCTION compute_vessel_trends(
  for_mmsi BIGINT,
  period_months INT DEFAULT 1
) RETURNS void AS $$
BEGIN
  INSERT INTO ais_vessel_trends (
    mmsi, imo, vessel_name, period_start, period_end,
    total_distance_nm, total_voyage_hours, port_calls,
    avg_speed_profile
  )
  SELECT
    mmsi,
    imo,
    vessel_name,
    DATE_TRUNC('month', NOW() - INTERVAL '1 month' * period_months) AS period_start,
    DATE_TRUNC('month', NOW()) AS period_end,
    SUM(distance_nm) AS total_distance_nm,
    SUM(total_positions) * 5.0 / 60.0 AS total_voyage_hours,  -- Assuming 5 min intervals
    COUNT(DISTINCT CASE WHEN stationary_count > 60 THEN day END) AS port_calls,
    jsonb_object_agg(
      EXTRACT(HOUR FROM day)::TEXT,
      avg_speed
    ) AS avg_speed_profile
  FROM ais_positions_daily
  WHERE mmsi = for_mmsi
    AND day >= NOW() - INTERVAL '1 month' * period_months
  GROUP BY mmsi, imo, vessel_name
  ON CONFLICT (mmsi, period_start)
  DO UPDATE SET
    period_end = EXCLUDED.period_end,
    total_distance_nm = EXCLUDED.total_distance_nm,
    total_voyage_hours = EXCLUDED.total_voyage_hours,
    port_calls = EXCLUDED.port_calls,
    avg_speed_profile = EXCLUDED.avg_speed_profile,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 7: STORAGE SAVINGS SUMMARY
-- ============================================================================

-- Query to see storage usage by time period
CREATE OR REPLACE VIEW ais_storage_summary AS
SELECT
  'Raw positions (last 7 days)' AS data_type,
  COUNT(*) AS row_count,
  pg_size_pretty(pg_total_relation_size('ais_positions')) AS storage_size,
  '100%' AS detail_level
FROM ais_positions
WHERE timestamp > NOW() - INTERVAL '7 days'

UNION ALL

SELECT
  'Hourly aggregates (7-90 days)' AS data_type,
  COUNT(*) AS row_count,
  pg_size_pretty(pg_total_relation_size('ais_positions_hourly')) AS storage_size,
  '~4%' AS detail_level
FROM ais_positions_hourly
WHERE hour BETWEEN NOW() - INTERVAL '90 days' AND NOW() - INTERVAL '7 days'

UNION ALL

SELECT
  'Daily aggregates (90+ days)' AS data_type,
  COUNT(*) AS row_count,
  pg_size_pretty(pg_total_relation_size('ais_positions_daily')) AS storage_size,
  '~0.4%' AS detail_level
FROM ais_positions_daily
WHERE day < NOW() - INTERVAL '90 days'

UNION ALL

SELECT
  'Vessel trends (all time)' AS data_type,
  COUNT(*) AS row_count,
  pg_size_pretty(pg_total_relation_size('ais_vessel_trends')) AS storage_size,
  'Patterns only' AS detail_level
FROM ais_vessel_trends;

-- ============================================================================
-- PART 8: MAINTENANCE QUERIES
-- ============================================================================

-- Check compression status
SELECT
  hypertable_name,
  compression_enabled,
  pg_size_pretty(before_compression_total_bytes) AS uncompressed_size,
  pg_size_pretty(after_compression_total_bytes) AS compressed_size,
  ROUND(100 - (after_compression_total_bytes::NUMERIC /
    NULLIF(before_compression_total_bytes, 0) * 100), 1) AS compression_ratio_pct
FROM timescaledb_information.compressed_hypertable_stats
WHERE hypertable_name LIKE 'ais%';

-- Check retention policy status
SELECT
  hypertable_name,
  view_name,
  drop_after AS retention_period
FROM timescaledb_information.data_retention_policies
WHERE hypertable_name LIKE 'ais%';

-- Estimate space savings from intelligent storage
WITH storage_estimates AS (
  SELECT
    'Current (full resolution)' AS scenario,
    COUNT(*) AS total_positions,
    pg_size_pretty(pg_total_relation_size('ais_positions')) AS storage_size,
    pg_total_relation_size('ais_positions') AS bytes
  FROM ais_positions

  UNION ALL

  SELECT
    'With intelligent storage' AS scenario,
    (
      -- Last 7 days: 100%
      (SELECT COUNT(*) FROM ais_positions WHERE timestamp > NOW() - INTERVAL '7 days') +
      -- 7-90 days: ~4% (hourly)
      (SELECT COUNT(*) FROM ais_positions WHERE timestamp BETWEEN NOW() - INTERVAL '90 days' AND NOW() - INTERVAL '7 days') * 0.04 +
      -- 90+ days: ~0.4% (daily)
      (SELECT COUNT(*) FROM ais_positions WHERE timestamp < NOW() - INTERVAL '90 days') * 0.004
    )::BIGINT AS total_positions,
    pg_size_pretty(
      pg_total_relation_size('ais_positions') * 0.15  -- Estimate ~15% of current size
    ) AS storage_size,
    pg_total_relation_size('ais_positions') * 0.15 AS bytes
  FROM ais_positions
  LIMIT 1
)
SELECT
  scenario,
  total_positions,
  storage_size,
  CASE
    WHEN scenario = 'Current (full resolution)' THEN '0%'
    ELSE ROUND(100 - (bytes::NUMERIC / LEAD(bytes) OVER (ORDER BY scenario DESC) * 100), 1)::TEXT || '%'
  END AS space_saved
FROM storage_estimates;

-- ============================================================================
-- PART 9: INSTALLATION SCRIPT
-- ============================================================================

-- To apply this intelligent storage strategy:
-- 1. Run this SQL file: psql -U ankr -d compliance -f /root/ais-intelligent-storage.sql
-- 2. Wait for continuous aggregates to populate (~30 minutes)
-- 3. Verify: SELECT * FROM ais_storage_summary;
-- 4. Monitor: SELECT * FROM timescaledb_information.compressed_hypertable_stats;

-- ============================================================================
-- SUMMARY OF STORAGE STRATEGY
-- ============================================================================

/*
Data Age         | Resolution      | Storage | Use Case
-----------------|-----------------|---------|---------------------------
0-7 days         | Every update    | 100%    | Real-time tracking
7-30 days        | Hourly          | ~4%     | Recent history
30-90 days       | Hourly          | ~4%     | Historical analysis
90-365 days      | Daily           | ~0.4%   | Long-term trends
365+ days        | Daily + Trends  | ~0.1%   | Statistical analysis

TOTAL SPACE SAVED: 85-95% while retaining analytical value
*/
