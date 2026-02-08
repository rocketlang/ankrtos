-- TimescaleDB Continuous Aggregates for Mari8X AIS Analytics
-- These auto-update materialized views provide fast time-series analytics

-- 1. Hourly AIS Position Aggregates
-- Provides hourly stats: position count, unique vessels, avg speed
CREATE MATERIALIZED VIEW IF NOT EXISTS ais_hourly_stats
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', "timestamp") AS hour,
  COUNT(*) as position_count,
  COUNT(DISTINCT "vesselId") as unique_vessels,
  AVG(speed) as avg_speed,
  MAX(speed) as max_speed,
  MIN(speed) as min_speed,
  COUNT(*) FILTER (WHERE "navStatus" = 0) as underway_count,
  COUNT(*) FILTER (WHERE "navStatus" = 1) as anchored_count,
  COUNT(*) FILTER (WHERE "navStatus" = 5) as moored_count
FROM vessel_positions
WHERE "timestamp" > NOW() - INTERVAL '30 days'
GROUP BY hour
WITH NO DATA;

-- Create refresh policy - update every 15 minutes
SELECT add_continuous_aggregate_policy('ais_hourly_stats',
  start_offset => INTERVAL '3 hours',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '15 minutes');

-- 2. Daily AIS Summary Aggregates
-- Provides daily rollup: total positions, vessels, geographic coverage
CREATE MATERIALIZED VIEW IF NOT EXISTS ais_daily_stats
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', "timestamp") AS day,
  COUNT(*) as total_positions,
  COUNT(DISTINCT "vesselId") as unique_vessels,
  AVG(speed) as avg_speed,
  MAX(latitude) - MIN(latitude) as lat_span,
  MAX(longitude) - MIN(longitude) as lon_span,
  COUNT(DISTINCT "vesselType") as vessel_types,
  COUNT(*) FILTER (WHERE speed > 0) as moving_vessels,
  COUNT(*) FILTER (WHERE speed = 0) as stationary_vessels
FROM vessel_positions
WHERE "timestamp" > NOW() - INTERVAL '90 days'
GROUP BY day
WITH NO DATA;

-- Create refresh policy - update daily at 2 AM
SELECT add_continuous_aggregate_policy('ais_daily_stats',
  start_offset => INTERVAL '7 days',
  end_offset => INTERVAL '1 day',
  schedule_interval => INTERVAL '1 day');

-- 3. Vessel Activity Summary (by vessel)
-- Tracks individual vessel activity patterns
CREATE MATERIALIZED VIEW IF NOT EXISTS vessel_activity_summary
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', "timestamp") AS day,
  "vesselId",
  COUNT(*) as position_count,
  AVG(speed) as avg_speed,
  MAX(speed) as max_speed,
  MAX(latitude) as max_lat,
  MIN(latitude) as min_lat,
  MAX(longitude) as max_lon,
  MIN(longitude) as min_lon,
  (MAX(latitude) - MIN(latitude)) + (MAX(longitude) - MIN(longitude)) as travel_range
FROM vessel_positions
WHERE "timestamp" > NOW() - INTERVAL '30 days'
GROUP BY day, "vesselId"
WITH NO DATA;

-- Create refresh policy
SELECT add_continuous_aggregate_policy('vessel_activity_summary',
  start_offset => INTERVAL '7 days',
  end_offset => INTERVAL '1 day',
  schedule_interval => INTERVAL '1 day');

-- 4. Live Fun Facts Aggregates (real-time)
-- Updated every 5 minutes for landing page fun facts
CREATE MATERIALIZED VIEW IF NOT EXISTS ais_live_fun_facts
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('5 minutes', "timestamp") AS period,
  COUNT(*) as total_positions,
  COUNT(DISTINCT "vesselId") as unique_vessels,
  MAX(speed) as fastest_speed,
  MIN(latitude) as southernmost_lat,
  MAX(latitude) as northernmost_lat,
  COUNT(*) FILTER (WHERE latitude BETWEEN -1 AND 1) as ships_on_equator,
  COUNT(*) FILTER (WHERE longitude BETWEEN 32 AND 33 AND latitude BETWEEN 29 AND 31) as ships_at_suez,
  COUNT(*) FILTER (WHERE speed > 0) as ships_moving,
  COUNT(*) FILTER (WHERE "navStatus" = 1) as ships_at_anchor
FROM vessel_positions
WHERE "timestamp" > NOW() - INTERVAL '1 hour'
GROUP BY period
WITH NO DATA;

-- Create refresh policy - update every 5 minutes
SELECT add_continuous_aggregate_policy('ais_live_fun_facts',
  start_offset => INTERVAL '1 hour',
  end_offset => INTERVAL '5 minutes',
  schedule_interval => INTERVAL '5 minutes');

-- Refresh all aggregates immediately
CALL refresh_continuous_aggregate('ais_hourly_stats', NOW() - INTERVAL '7 days', NOW());
CALL refresh_continuous_aggregate('ais_daily_stats', NOW() - INTERVAL '30 days', NOW());
CALL refresh_continuous_aggregate('vessel_activity_summary', NOW() - INTERVAL '7 days', NOW());
CALL refresh_continuous_aggregate('ais_live_fun_facts', NOW() - INTERVAL '1 hour', NOW());

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_ais_hourly_stats_hour ON ais_hourly_stats(hour DESC);
CREATE INDEX IF NOT EXISTS idx_ais_daily_stats_day ON ais_daily_stats(day DESC);
CREATE INDEX IF NOT EXISTS idx_vessel_activity_vessel ON vessel_activity_summary("vesselId", day DESC);
CREATE INDEX IF NOT EXISTS idx_ais_live_fun_facts_period ON ais_live_fun_facts(period DESC);

COMMENT ON MATERIALIZED VIEW ais_hourly_stats IS 'Hourly AIS statistics - auto-updated every 15 min';
COMMENT ON MATERIALIZED VIEW ais_daily_stats IS 'Daily AIS rollup - auto-updated daily at 2 AM';
COMMENT ON MATERIALIZED VIEW vessel_activity_summary IS 'Per-vessel activity tracking - auto-updated daily';
COMMENT ON MATERIALIZED VIEW ais_live_fun_facts IS 'Live fun facts for landing page - auto-updated every 5 min';
