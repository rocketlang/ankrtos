-- Simple TimescaleDB Continuous Aggregate for Live Fun Facts
-- Auto-updates every 15 minutes

-- Drop if exists (for clean recreation)
DROP MATERIALIZED VIEW IF EXISTS ais_live_fun_facts CASCADE;

-- Create continuous aggregate for live stats (last 24 hours)
CREATE MATERIALIZED VIEW ais_live_fun_facts
WITH (timescaledb.continuous) AS
SELECT
  time_bucket(INTERVAL '15 minutes', "timestamp") AS bucket,
  COUNT(*) as total_positions,
  COUNT(DISTINCT "vesselId") as unique_vessels,
  MAX(speed) as fastest_speed,
  MIN(latitude) as southernmost_lat,
  MAX(latitude) as northernmost_lat,
  COUNT(*) FILTER (WHERE latitude BETWEEN -1 AND 1) as ships_on_equator,
  COUNT(*) FILTER (WHERE longitude BETWEEN 32 AND 33 AND latitude BETWEEN 29 AND 31) as ships_at_suez,
  COUNT(*) FILTER (WHERE speed > 0) as ships_moving,
  COUNT(*) FILTER (WHERE "navigationStatus" = 1) as ships_at_anchor
FROM vessel_positions
GROUP BY bucket
WITH NO DATA;

-- Add refresh policy - updates every 15 minutes
SELECT add_continuous_aggregate_policy('ais_live_fun_facts',
  start_offset => INTERVAL '24 hours',
  end_offset => INTERVAL '15 minutes',
  schedule_interval => INTERVAL '15 minutes');

-- Do initial refresh (last 24 hours)
CALL refresh_continuous_aggregate('ais_live_fun_facts',
  NOW() - INTERVAL '24 hours',
  NOW());

-- Create index for fast lookups
CREATE INDEX idx_ais_live_fun_facts_bucket ON ais_live_fun_facts(bucket DESC);

COMMENT ON MATERIALIZED VIEW ais_live_fun_facts IS 'Live AIS fun facts - auto-updated every 15 min via TimescaleDB';

-- Show result
SELECT
  bucket,
  total_positions,
  unique_vessels,
  ships_moving,
  ships_at_anchor
FROM ais_live_fun_facts
ORDER BY bucket DESC
LIMIT 5;
