-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Convert VesselPosition to TimescaleDB hypertable
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
CREATE INDEX IF NOT EXISTS idx_vessel_positions_time_location
ON vessel_positions (timestamp DESC, longitude, latitude);

-- Create index for vesselId + timestamp (for getting latest position per vessel)
CREATE INDEX IF NOT EXISTS idx_vessel_positions_vessel_time
ON vessel_positions ("vesselId", timestamp DESC);

-- Create GiST index for spatial queries (PostGIS)
CREATE INDEX IF NOT EXISTS idx_vessel_positions_geography
ON vessel_positions USING GIST (
  ST_MakePoint(longitude, latitude)::geography
);

-- Create composite BTREE index for speed queries (anchored vs moving)
CREATE INDEX IF NOT EXISTS idx_vessel_positions_speed_time
ON vessel_positions (speed, timestamp DESC) WHERE speed IS NOT NULL;

-- Create continuous aggregate for hourly port congestion metrics
-- Note: We'll refresh this later to avoid blocking the migration
CREATE MATERIALIZED VIEW IF NOT EXISTS port_congestion_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', timestamp) AS hour,
  COUNT(DISTINCT "vesselId") as vessel_count,
  COUNT(*) FILTER (WHERE speed < 0.5) as anchored_count,
  COUNT(*) FILTER (WHERE speed >= 0.5) as moving_count,
  AVG(speed) as avg_speed,
  ROUND(latitude::numeric, 1) as lat_bucket,
  ROUND(longitude::numeric, 1) as lon_bucket
FROM vessel_positions
WHERE timestamp > NOW() - INTERVAL '90 days'
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

-- Create indexes on the continuous aggregate
CREATE INDEX IF NOT EXISTS idx_port_congestion_hourly_time
ON port_congestion_hourly (hour DESC);

CREATE INDEX IF NOT EXISTS idx_port_congestion_hourly_location
ON port_congestion_hourly (lat_bucket, lon_bucket, hour DESC);

COMMENT ON EXTENSION timescaledb IS 'TimescaleDB extension for time-series optimization';
COMMENT ON TABLE vessel_positions IS 'TimescaleDB hypertable: 7-day chunks, 30-day compression, 2-year retention';
COMMENT ON MATERIALIZED VIEW port_congestion_hourly IS 'Continuous aggregate: Pre-computed hourly port congestion metrics';
