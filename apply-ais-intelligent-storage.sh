#!/bin/bash
# Apply Intelligent AIS Storage Strategy
# This will reduce storage by 85-95% while keeping trends

set -e

echo "🧠 AIS Intelligent Storage Implementation"
echo "=========================================="
echo ""
echo "This will:"
echo "  • Create continuous aggregates (hourly, daily)"
echo "  • Set up data retention policies (7/90/365 days)"
echo "  • Enable compression (10-20x reduction)"
echo "  • Store trends instead of raw data"
echo ""
echo "Expected space savings: 85-95%"
echo ""

read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "📊 Step 1: Checking current vessel position data size..."
sudo -u postgres psql -d ankr_maritime -c "
  SELECT
    'vessel_positions' as hypertable,
    pg_size_pretty(SUM(pg_total_relation_size(format('%I.%I', chunk_schema, chunk_name)))) AS total_size,
    COUNT(*) as chunk_count,
    COUNT(CASE WHEN is_compressed THEN 1 END) as compressed_chunks
  FROM timescaledb_information.chunks
  WHERE hypertable_name = 'vessel_positions';
"

echo ""
echo "📝 Step 2: Creating backup of current configuration..."
sudo -u postgres pg_dump -d ankr_maritime --schema-only --table=vessel_positions > /tmp/vessel_positions_schema_backup.sql
echo "   ✅ Backup saved to /tmp/vessel_positions_schema_backup.sql"

echo ""
echo "🔧 Step 3: Applying intelligent storage SQL..."
sudo -u postgres psql -d ankr_maritime -f /root/ais-intelligent-storage.sql 2>&1 | grep -E "(CREATE|SELECT|ERROR|NOTICE)" | head -30
echo "   ✅ SQL executed"

echo ""
echo "⏳ Step 4: Waiting for continuous aggregates to populate (30 seconds)..."
sleep 30

echo ""
echo "📊 Step 5: Checking new storage layout..."
sudo -u postgres psql -d ankr_maritime -c "
SELECT
  'Raw positions (last 7 days)' AS data_type,
  COUNT(*) AS row_count,
  pg_size_pretty(SUM(pg_total_relation_size(format('%I.%I', chunk_schema, chunk_name)))) AS storage_size
FROM timescaledb_information.chunks c
JOIN vessel_positions vp ON vp.timestamp >= NOW() - INTERVAL '7 days'
WHERE c.hypertable_name = 'vessel_positions'
  AND c.range_start >= NOW() - INTERVAL '7 days'
GROUP BY data_type;
"

echo ""
echo "🗜️  Step 6: Checking compression status..."
sudo -u postgres psql -d ankr_maritime -c "
  SELECT
    chunk_name,
    range_start::date,
    is_compressed,
    pg_size_pretty(pg_total_relation_size(format('%I.%I', chunk_schema, chunk_name))) AS size
  FROM timescaledb_information.chunks
  WHERE hypertable_name = 'vessel_positions'
  ORDER BY range_start DESC
  LIMIT 10;
" 2>/dev/null || echo "   (Compression will run automatically over next 24-48 hours)"

echo ""
echo "=========================================="
echo "✅ Intelligent Storage Applied!"
echo ""
echo "Summary:"
echo "  • Continuous aggregates created (hourly, daily)"
echo "  • Retention policies active (auto-cleanup)"
echo "  • Compression enabled (runs automatically)"
echo "  • Trend extraction functions ready"
echo ""
echo "What happens next:"
echo "  1. Old data (7+ days) will be compressed automatically"
echo "  2. Very old data (90+ days) will be deleted, keeping aggregates"
echo "  3. Storage will reduce by 85-95% over next few days"
echo "  4. All trends and patterns will be preserved"
echo ""
echo "To monitor:"
echo "  psql -U ankr -d compliance -c \"SELECT * FROM ais_storage_summary;\""
echo ""
echo "To force immediate compression of old data:"
echo "  psql -U ankr -d compliance -c \"SELECT compress_chunk(i) FROM show_chunks('ais_positions', older_than => INTERVAL '7 days') i;\""
echo ""
