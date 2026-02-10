#!/bin/bash

echo "=== COMPRESSION REALITY CHECK ==="
echo ""

# 1. Check if compression actually worked
echo "1. Compression Status:"
psql -U postgres -d ankr_maritime -t -c "SELECT COUNT(*) FROM timescaledb_information.chunks WHERE hypertable_name='vessel_positions' AND is_compressed=true;" 2>/dev/null | xargs | awk '{print "   Compressed chunks: " $1}'

# 2. Check table vs indexes
echo ""
echo "2. Database Breakdown:"
psql -U postgres -d ankr_maritime -t -c "SELECT 
    pg_size_pretty(pg_relation_size('vessel_positions')) as table_only,
    pg_size_pretty(pg_indexes_size('vessel_positions')) as indexes_only,
    pg_size_pretty(pg_total_relation_size('vessel_positions')) as total
FROM vessel_positions LIMIT 1;" 2>/dev/null

# 3. Check chunk storage in internal schema
echo ""
echo "3. Internal Chunk Storage:"
psql -U postgres -d ankr_maritime -t -c "SELECT pg_size_pretty(SUM(pg_total_relation_size('_timescaledb_internal.' || chunk_name))) as chunk_storage FROM timescaledb_information.chunks WHERE hypertable_name='vessel_positions';" 2>/dev/null

# 4. Total database components
echo ""
echo "4. Database Size Components:"
psql -U postgres -d ankr_maritime -t -c "SELECT pg_size_pretty(pg_database_size('ankr_maritime'));" 2>/dev/null | xargs | awk '{print "   Total DB: " $1}'

# 5. Disk reality
echo ""
echo "5. Actual Disk Usage:"
du -sh /mnt/ais-storage/postgresql 2>/dev/null | awk '{print "   PostgreSQL data: " $1}'
df -h /mnt/ais-storage | awk 'NR==2 {print "   Volume used: " $3 " / " $2 " (" $5 ")"}'

echo ""
echo "=== CONCLUSION ==="
echo "If chunks are compressed but disk usage hasn't changed much:"
echo "  • Indexes are not compressed (they take significant space)"
echo "  • WAL files, temp files add overhead"
echo "  • Compression may not be as effective on this data type"
echo "  • Some chunks may have been already efficiently stored"
