-- Phase 2 Completion Migration
-- 1. GiST index on VesselPosition for geospatial queries
-- 2. TimescaleDB hypertables for time-series data
-- 3. Soft delete pattern preparation

-- ============================================================================
-- TASK 1: GiST Geospatial Index on VesselPosition
-- ============================================================================

-- Create PostGIS extension if not exists (required for geospatial operations)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geography column for efficient geospatial queries
-- Geography type uses earth's spheroid for accurate distance calculations
ALTER TABLE vessel_positions
  ADD COLUMN IF NOT EXISTS location geography(POINT, 4326);

-- Update existing records to populate location from lat/lon
UPDATE vessel_positions
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE location IS NULL;

-- Create GiST index for fast geospatial queries (nearest vessel, within radius, etc.)
CREATE INDEX IF NOT EXISTS idx_vessel_positions_location
  ON vessel_positions USING GIST (location);

-- Create additional composite indexes for common geospatial query patterns
CREATE INDEX IF NOT EXISTS idx_vessel_positions_location_timestamp
  ON vessel_positions USING GIST (location, timestamp);

-- ============================================================================
-- TASK 2: TimescaleDB Hypertables
-- ============================================================================

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert VesselPosition to hypertable (if not already)
-- Chunk by 7 days (weekly chunks for efficient data retention & performance)
SELECT create_hypertable(
  'vessel_positions',
  'timestamp',
  chunk_time_interval => INTERVAL '7 days',
  if_not_exists => TRUE
);

-- Add compression policy (compress data older than 30 days)
SELECT add_compression_policy('vessel_positions', INTERVAL '30 days', if_not_exists => TRUE);

-- Add retention policy (keep data for 2 years, then auto-delete)
SELECT add_retention_policy('vessel_positions', INTERVAL '2 years', if_not_exists => TRUE);

-- Convert PortCongestion to hypertable
SELECT create_hypertable(
  'port_congestion',
  'timestamp',
  chunk_time_interval => INTERVAL '7 days',
  if_not_exists => TRUE
);

-- Add compression policy for PortCongestion
SELECT add_compression_policy('port_congestion', INTERVAL '30 days', if_not_exists => TRUE);

-- Add retention policy for PortCongestion (keep 1 year)
SELECT add_retention_policy('port_congestion', INTERVAL '1 year', if_not_exists => TRUE);

-- Convert MarketRate to hypertable
SELECT create_hypertable(
  'market_rates',
  'effective_date',
  chunk_time_interval => INTERVAL '30 days',
  if_not_exists => TRUE
);

-- Add compression policy for MarketRate
SELECT add_compression_policy('market_rates', INTERVAL '90 days', if_not_exists => TRUE);

-- Add retention policy for MarketRate (keep 5 years of historical rates)
SELECT add_retention_policy('market_rates', INTERVAL '5 years', if_not_exists => TRUE);

-- ============================================================================
-- Performance Optimization: Continuous Aggregates
-- ============================================================================

-- Create materialized view for hourly vessel position aggregates
CREATE MATERIALIZED VIEW IF NOT EXISTS vessel_positions_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', timestamp) AS hour,
  vessel_id,
  AVG(speed) as avg_speed,
  MAX(speed) as max_speed,
  MIN(speed) as min_speed,
  COUNT(*) as position_count,
  ST_SetSRID(ST_MakePoint(AVG(longitude), AVG(latitude)), 4326)::geography as avg_location
FROM vessel_positions
GROUP BY hour, vessel_id
WITH NO DATA;

-- Add refresh policy (refresh every hour)
SELECT add_continuous_aggregate_policy('vessel_positions_hourly',
  start_offset => INTERVAL '3 hours',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour',
  if_not_exists => TRUE
);

-- Create materialized view for daily port congestion averages
CREATE MATERIALIZED VIEW IF NOT EXISTS port_congestion_daily
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', timestamp) AS day,
  port_id,
  AVG(vessels_waiting) as avg_vessels_waiting,
  MAX(vessels_waiting) as max_vessels_waiting,
  AVG(vessels_at_berth) as avg_vessels_at_berth,
  AVG(avg_wait_hours) as avg_wait_hours,
  AVG(berth_utilization) as avg_berth_utilization,
  COUNT(*) as reading_count
FROM port_congestion
GROUP BY day, port_id
WITH NO DATA;

-- Add refresh policy (refresh daily at midnight)
SELECT add_continuous_aggregate_policy('port_congestion_daily',
  start_offset => INTERVAL '3 days',
  end_offset => INTERVAL '1 day',
  schedule_interval => INTERVAL '1 day',
  if_not_exists => TRUE
);

-- ============================================================================
-- Additional Geospatial Helper Functions
-- ============================================================================

-- Function to find vessels within radius of a point
CREATE OR REPLACE FUNCTION vessels_within_radius(
  center_lat DOUBLE PRECISION,
  center_lon DOUBLE PRECISION,
  radius_nm DOUBLE PRECISION
) RETURNS TABLE (
  vessel_id TEXT,
  distance_nm DOUBLE PRECISION,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  timestamp TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vp.vessel_id,
    ST_Distance(
      vp.location,
      ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326)::geography
    ) / 1852.0 as distance_nm, -- Convert meters to nautical miles
    vp.latitude,
    vp.longitude,
    vp.speed,
    vp.timestamp
  FROM vessel_positions vp
  WHERE vp.timestamp = (
    SELECT MAX(timestamp)
    FROM vessel_positions
    WHERE vessel_id = vp.vessel_id
  )
  AND ST_DWithin(
    vp.location,
    ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326)::geography,
    radius_nm * 1852.0 -- Convert nautical miles to meters
  )
  ORDER BY distance_nm;
END;
$$ LANGUAGE plpgsql;

-- Function to get vessel track history
CREATE OR REPLACE FUNCTION vessel_track_history(
  p_vessel_id TEXT,
  since TIMESTAMPTZ DEFAULT NOW() - INTERVAL '24 hours'
) RETURNS TABLE (
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  timestamp TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vp.latitude,
    vp.longitude,
    vp.speed,
    vp.heading,
    vp.timestamp
  FROM vessel_positions vp
  WHERE vp.vessel_id = p_vessel_id
    AND vp.timestamp >= since
  ORDER BY vp.timestamp ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TASK 3: Soft Delete Pattern (Preparation)
-- ============================================================================

-- Note: Adding deletedAt columns to all models will be done via Prisma schema update
-- This migration prepares helper functions for soft delete operations

-- Function to soft delete with automatic cascade
CREATE OR REPLACE FUNCTION soft_delete_cascade(
  table_name TEXT,
  record_id TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  query TEXT;
BEGIN
  query := format(
    'UPDATE %I SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL',
    table_name
  );
  EXECUTE query USING record_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to restore soft-deleted record
CREATE OR REPLACE FUNCTION restore_deleted(
  table_name TEXT,
  record_id TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  query TEXT;
BEGIN
  query := format(
    'UPDATE %I SET deleted_at = NULL WHERE id = $1',
    table_name
  );
  EXECUTE query USING record_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to permanently delete soft-deleted records older than retention period
CREATE OR REPLACE FUNCTION purge_deleted_records(
  table_name TEXT,
  retention_days INTEGER DEFAULT 90
) RETURNS INTEGER AS $$
DECLARE
  query TEXT;
  deleted_count INTEGER;
BEGIN
  query := format(
    'DELETE FROM %I WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL ''%s days'' RETURNING id',
    table_name,
    retention_days
  );
  EXECUTE query;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Verification Queries (for testing)
-- ============================================================================

-- Verify GiST index exists
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'vessel_positions' AND indexname LIKE '%location%';

-- Verify hypertables
-- SELECT hypertable_schema, hypertable_name, num_chunks
-- FROM timescaledb_information.hypertables
-- WHERE hypertable_name IN ('vessel_positions', 'port_congestion', 'market_rates');

-- Verify compression policies
-- SELECT hypertable_name, compress_after
-- FROM timescaledb_information.compression_settings;

-- Verify retention policies
-- SELECT hypertable_name, drop_after
-- FROM timescaledb_information.job_stats
-- WHERE job_type = 'retention_policy';

-- Test geospatial query (find vessels within 50nm of Singapore)
-- SELECT * FROM vessels_within_radius(1.29, 103.85, 50);

-- Test vessel track history
-- SELECT * FROM vessel_track_history('vessel-id-here', NOW() - INTERVAL '7 days');

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Phase 2 completion migration executed successfully';
  RAISE NOTICE '1. GiST geospatial index created on vessel_positions';
  RAISE NOTICE '2. TimescaleDB hypertables created for vessel_positions, port_congestion, market_rates';
  RAISE NOTICE '3. Soft delete helper functions created';
  RAISE NOTICE '4. Continuous aggregates created for performance optimization';
  RAISE NOTICE '5. Helper functions created for geospatial queries';
END$$;
