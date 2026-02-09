-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Convert VesselPosition to TimescaleDB hypertable
-- This must be done BEFORE any data exists, or use create_hypertable with migrate_data => true
SELECT create_hypertable(
  'vessel_positions',
  'timestamp',
  chunk_time_interval => INTERVAL '7 days',
  if_not_exists => TRUE,
  migrate_data => TRUE
);

-- Add compression policy (compress chunks older than 30 days)
SELECT add_compression_policy(
  'vessel_positions',
  INTERVAL '30 days',
  if_not_exists => TRUE
);

-- Add retention policy (drop chunks older than 2 years)
SELECT add_retention_policy(
  'vessel_positions',
  INTERVAL '2 years',
  if_not_exists => TRUE
);

-- Create composite index for time + space queries (used in port congestion)
-- This index is optimized for queries that filter by time AND spatial proximity
CREATE INDEX IF NOT EXISTS idx_vessel_positions_time_location
ON vessel_positions (timestamp DESC, longitude, latitude);

-- Create index for vesselId + timestamp (for getting latest position per vessel)
CREATE INDEX IF NOT EXISTS idx_vessel_positions_vessel_time
ON vessel_positions ("vesselId", timestamp DESC);

-- Create GiST index for spatial queries (PostGIS)
-- This enables ST_DWithin queries to use index
CREATE INDEX IF NOT EXISTS idx_vessel_positions_geography
ON vessel_positions USING GIST (
  ST_MakePoint(longitude, latitude)::geography
);

-- Create composite BTREE index for speed queries (anchored vs moving)
CREATE INDEX IF NOT EXISTS idx_vessel_positions_speed_time
ON vessel_positions (speed, timestamp DESC) WHERE speed IS NOT NULL;

-- Create continuous aggregate for hourly port congestion metrics
-- This pre-computes congestion data for faster dashboard queries
CREATE MATERIALIZED VIEW IF NOT EXISTS port_congestion_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', timestamp) AS hour,
  COUNT(DISTINCT "vesselId") as vessel_count,
  COUNT(*) FILTER (WHERE speed < 0.5) as anchored_count,
  COUNT(*) FILTER (WHERE speed >= 0.5) as moving_count,
  AVG(speed) as avg_speed,
  -- Store approximate location for grouping
  ROUND(latitude::numeric, 1) as lat_bucket,
  ROUND(longitude::numeric, 1) as lon_bucket
FROM vessel_positions
WHERE timestamp > NOW() - INTERVAL '90 days' -- Only aggregate recent data
GROUP BY hour, lat_bucket, lon_bucket
WITH NO DATA;

-- Add refresh policy for continuous aggregate (refresh every hour)
SELECT add_continuous_aggregate_policy(
  'port_congestion_hourly',
  start_offset => INTERVAL '3 hours',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour',
  if_not_exists => TRUE
);

-- Create index on the continuous aggregate for faster queries
CREATE INDEX IF NOT EXISTS idx_port_congestion_hourly_time
ON port_congestion_hourly (hour DESC);

CREATE INDEX IF NOT EXISTS idx_port_congestion_hourly_location
ON port_congestion_hourly (lat_bucket, lon_bucket, hour DESC);

-- Refresh the continuous aggregate for the first time
CALL refresh_continuous_aggregate('port_congestion_hourly', NULL, NULL);

-- Create view for real-time port statistics (combines live + aggregated data)
CREATE OR REPLACE VIEW port_stats_realtime AS
WITH live_data AS (
  -- Get last 2 hours of live data (not yet in continuous aggregate)
  SELECT
    time_bucket('1 hour', timestamp) AS hour,
    COUNT(DISTINCT "vesselId") as vessel_count,
    COUNT(*) FILTER (WHERE speed < 0.5) as anchored_count,
    COUNT(*) FILTER (WHERE speed >= 0.5) as moving_count,
    AVG(speed) as avg_speed,
    ROUND(latitude::numeric, 1) as lat_bucket,
    ROUND(longitude::numeric, 1) as lon_bucket
  FROM vessel_positions
  WHERE timestamp > NOW() - INTERVAL '2 hours'
  GROUP BY hour, lat_bucket, lon_bucket
),
historical_data AS (
  -- Get aggregated historical data
  SELECT * FROM port_congestion_hourly
  WHERE hour <= NOW() - INTERVAL '2 hours'
)
SELECT * FROM live_data
UNION ALL
SELECT * FROM historical_data;

COMMENT ON EXTENSION timescaledb IS 'TimescaleDB extension for time-series optimization';
COMMENT ON TABLE vessel_positions IS 'TimescaleDB hypertable: 7-day chunks, 30-day compression, 2-year retention';
COMMENT ON MATERIALIZED VIEW port_congestion_hourly IS 'Continuous aggregate: Pre-computed hourly port congestion metrics';
COMMENT ON VIEW port_stats_realtime IS 'Real-time view: Combines live data (last 2 hours) with historical aggregates';
