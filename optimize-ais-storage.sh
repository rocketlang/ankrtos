#!/bin/bash
# AIS Storage Optimization Script
# Reduces update frequency and compresses old data

echo "🔧 AIS Storage Optimization"
echo "=========================="
echo ""

# Step 1: Update cron to save every 30 minutes instead of 15
echo "1. Updating AIS live count from every 15 min → every 30 min..."
crontab -l > /tmp/crontab.backup
crontab -l | sed 's|*/15 \* \* \* \* cd /root/apps/ankr-maritime.*update-ais-live-count|*/30 * * * * cd /root/apps/ankr-maritime/backend \&\& /usr/bin/npx tsx src/scripts/update-ais-live-count.ts >> /var/log/ankr-maritime/ais-live-count.log 2>\&1|' | crontab -
echo "   ✅ Updated to every 30 minutes"

# Step 2: Compress old AIS logs
echo ""
echo "2. Compressing old AIS logs..."
find /var/log/ankr-maritime -name "*.log" -type f -mtime +7 -size +10M -exec gzip {} \; 2>/dev/null
find /root/logs/mari8x -name "*.log" -type f -mtime +7 -size +10M -exec gzip {} \; 2>/dev/null
echo "   ✅ Compressed logs older than 7 days"

# Step 3: Archive old AIS position data (older than 90 days)
echo ""
echo "3. Creating archive for old AIS data..."
mkdir -p /mnt/storage/ais-archive

# Check if TimescaleDB compression is enabled
echo "   Checking TimescaleDB compression..."
psql -U ankr -d compliance -c "SELECT hypertable_name, compression_enabled FROM timescaledb_information.hypertables WHERE hypertable_name LIKE '%ais%';" 2>/dev/null || echo "   (TimescaleDB check skipped)"

echo ""
echo "4. Suggested: Enable TimescaleDB compression for old data"
echo "   Run this manually if not already enabled:"
echo "   psql -U ankr -d compliance -c \"SELECT compress_chunk(i) FROM show_chunks('ais_positions', older_than => INTERVAL '30 days') i;\""

echo ""
echo "=========================="
echo "✅ AIS Optimization Complete"
echo ""
echo "Summary of changes:"
echo "  • Live count updates: 15 min → 30 min (50% reduction)"
echo "  • Old logs compressed (7+ days)"
echo "  • Archive directory created"
echo ""
echo "To verify:"
echo "  crontab -l | grep ais"
