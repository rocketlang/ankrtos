-- AIS Stream Optimization: Create Minute Aggregates
-- This reduces storage and I/O by 95%+

-- Step 1: Create continuous aggregate for 1-minute intervals
CREATE MATERIALIZED VIEW IF NOT EXISTS vessel_positions_minute
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 minute', timestamp) AS minute,
    vesselId,
    -- Use last value for each minute (most recent position)
    LAST(latitude, timestamp) AS latitude,
    LAST(longitude, timestamp) AS longitude,
    LAST(speed, timestamp) AS speed,
    LAST(heading, timestamp) AS heading,
    LAST(course, timestamp) AS course,
    LAST(status, timestamp) AS status,
    LAST(destination, timestamp) AS destination,
    LAST(source, timestamp) AS source,
    -- Keep stats
    COUNT(*) AS tick_count,
    AVG(speed) AS avg_speed,
    MAX(speed) AS max_speed
FROM vessel_positions
GROUP BY minute, vesselId;

-- Step 2: Add retention policy (keep 7 days)
SELECT add_retention_policy('vessel_positions_minute', INTERVAL '7 days', if_not_exists => true);

-- Step 3: Refresh policy (update every 5 minutes)
SELECT add_continuous_aggregate_policy('vessel_positions_minute',
    start_offset => INTERVAL '10 minutes',
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '5 minutes',
    if_not_exists => true);

-- Step 4: Create indexes for fast queries
CREATE INDEX IF NOT EXISTS vessel_positions_minute_vessel_idx
ON vessel_positions_minute (vesselId, minute DESC);

CREATE INDEX IF NOT EXISTS vessel_positions_minute_time_idx
ON vessel_positions_minute (minute DESC);

-- Step 5: Enable compression on minute aggregates
ALTER MATERIALIZED VIEW vessel_positions_minute SET (
  timescaledb.compress = true,
  timescaledb.compress_segmentby = 'vesselId'
);

SELECT add_compression_policy('vessel_positions_minute', INTERVAL '1 day', if_not_exists => true);

\echo 'Minute aggregates created successfully!'
\echo 'Run the cleanup script next to drop old raw data'
