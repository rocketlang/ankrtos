#!/bin/bash
##
# AIS Daily Summary Generation (Build Mode)
#
# Philosophy: Create aggregates WITHOUT deleting raw data
# Run: Daily via cron at 3 AM
# Cron: 0 3 * * * /root/apps/ankr-maritime/backend/src/scripts/daily-ais-summary-build-mode.sh
#
# What it does:
# 1. Generates yesterday's daily summaries
# 2. Tags any new positions with zones
# 3. Removes exact duplicates
# 4. Does NOT delete any raw position data (build mode)
##

set -e

LOG_FILE="/var/log/mari8x-ais-summary.log"
DB_NAME="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/mari8x}"

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "=========================================="
log "AIS Daily Summary (Build Mode) - Starting"
log "=========================================="

# Step 1: Tag any untagged zones
log "Step 1: Tagging new positions with zones..."
psql "$DB_NAME" <<SQL 2>&1 | tee -a "$LOG_FILE"
  -- Tag port zones
  UPDATE vessel_positions vp
  SET zone_type = 'port'
  WHERE zone_type IS NULL
    AND EXISTS (
      SELECT 1 FROM ports p
      WHERE p.latitude IS NOT NULL
        AND p.longitude IS NOT NULL
        AND (
          POWER(p.latitude - vp.latitude, 2) +
          POWER(p.longitude - vp.longitude, 2)
        ) < 0.03
    );

  -- Tag open sea
  UPDATE vessel_positions
  SET zone_type = 'open_sea'
  WHERE zone_type IS NULL;
SQL

log "✅ Zone tagging complete"

# Step 2: Remove exact duplicates (safe - no information loss)
log "Step 2: Removing exact duplicates..."
DUPLICATES=$(psql "$DB_NAME" -t -c "
  DELETE FROM vessel_positions a
  USING vessel_positions b
  WHERE a.id > b.id
    AND a.\"vesselId\" = b.\"vesselId\"
    AND a.timestamp = b.timestamp
    AND a.latitude = b.latitude
    AND a.longitude = b.longitude
    AND COALESCE(a.speed, -1) = COALESCE(b.speed, -1);
  SELECT COUNT(*);
" | xargs)

log "✅ Removed $DUPLICATES duplicate positions"

# Step 3: Generate yesterday's daily summaries
log "Step 3: Generating daily summaries for yesterday..."
psql "$DB_NAME" <<SQL 2>&1 | tee -a "$LOG_FILE"
  INSERT INTO ais_daily_summaries (
    "vesselId", date, zone_type,
    position_count, avg_lat, avg_lng,
    avg_speed, min_speed, max_speed
  )
  SELECT
    "vesselId",
    DATE(timestamp) as date,
    zone_type,
    COUNT(*) as position_count,
    AVG(latitude) as avg_lat,
    AVG(longitude) as avg_lng,
    AVG(speed) as avg_speed,
    MIN(speed) as min_speed,
    MAX(speed) as max_speed
  FROM vessel_positions
  WHERE DATE(timestamp) = CURRENT_DATE - 1
    AND zone_type IS NOT NULL
  GROUP BY "vesselId", DATE(timestamp), zone_type
  ON CONFLICT ("vesselId", date, zone_type) DO UPDATE SET
    position_count = EXCLUDED.position_count,
    avg_lat = EXCLUDED.avg_lat,
    avg_lng = EXCLUDED.avg_lng,
    avg_speed = EXCLUDED.avg_speed,
    min_speed = EXCLUDED.min_speed,
    max_speed = EXCLUDED.max_speed,
    updated_at = NOW();
SQL

log "✅ Daily summaries generated"

# Step 4: Storage check (warn if approaching 100GB)
log "Step 4: Checking storage status..."
POSITION_COUNT=$(psql "$DB_NAME" -t -c "SELECT COUNT(*) FROM vessel_positions;" | xargs)
STORAGE_GB=$(echo "scale=2; $POSITION_COUNT * 200 / 1024 / 1024 / 1024" | bc)

log "📊 Storage Status:"
log "  Total positions: $(printf "%'d" $POSITION_COUNT)"
log "  Estimated storage: ${STORAGE_GB} GB"

# Warn if approaching 100GB
if (( $(echo "$STORAGE_GB > 80" | bc -l) )); then
  log "⚠️  WARNING: Approaching 100GB threshold!"
  log "⚠️  Consider transitioning to aggressive retention soon"
elif (( $(echo "$STORAGE_GB > 100" | bc -l) )); then
  log "🚨 CRITICAL: Storage exceeded 100GB!"
  log "🚨 Time to transition to Phase 1 (aggressive retention)"
fi

# Step 5: Summary statistics
log "Step 5: Daily summary statistics..."
psql "$DB_NAME" -c "
  SELECT
    zone_type,
    COUNT(*) as summary_records,
    SUM(position_count) as total_positions,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
  FROM ais_daily_summaries
  GROUP BY zone_type
  ORDER BY zone_type;
" 2>&1 | tee -a "$LOG_FILE"

log "=========================================="
log "AIS Daily Summary (Build Mode) - Complete"
log "=========================================="
log ""
log "NOTE: This is BUILD MODE - no raw data deleted"
log "Raw positions are kept for algorithm development"
log "Transition to aggressive retention when storage > 100GB"
log ""
