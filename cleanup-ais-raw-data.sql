-- AIS Stream Cleanup: Drop old raw data
-- WARNING: This will delete data older than 24 hours
-- Make sure minute aggregates are created first!

-- Step 1: Show current database size
SELECT pg_size_pretty(pg_database_size('ankr_maritime')) AS current_size;

-- Step 2: Show current chunks
SELECT
  format('%I.%I', chunk_schema, chunk_name)::regclass as chunk,
  pg_size_pretty(pg_total_relation_size(format('%I.%I', chunk_schema, chunk_name)::regclass)) as size,
  range_start,
  range_end
FROM timescaledb_information.chunks
WHERE hypertable_name = 'vessel_positions'
ORDER BY range_start DESC
LIMIT 20;

-- Step 3: Drop old chunks (keep only 24 hours)
SELECT drop_chunks('vessel_positions', INTERVAL '24 hours');

-- Step 4: Update retention policy (24 hours)
SELECT remove_retention_policy('vessel_positions', if_exists => true);
SELECT add_retention_policy('vessel_positions', INTERVAL '24 hours');

-- Step 5: Enable compression on raw data (compress after 2 hours)
ALTER TABLE vessel_positions SET (
  timescaledb.compress = true,
  timescaledb.compress_segmentby = 'vesselId',
  timescaledb.compress_orderby = 'timestamp DESC'
);

SELECT add_compression_policy('vessel_positions', INTERVAL '2 hours', if_not_exists => true);

-- Step 6: Compress existing chunks
SELECT compress_chunk(chunk)
FROM timescaledb_information.chunks
WHERE hypertable_name = 'vessel_positions'
AND NOT is_compressed;

-- Step 7: Vacuum to reclaim space
VACUUM FULL vessel_positions;

-- Step 8: Show new database size
SELECT pg_size_pretty(pg_database_size('ankr_maritime')) AS new_size;

\echo 'Cleanup complete! Check database size reduction above.'
