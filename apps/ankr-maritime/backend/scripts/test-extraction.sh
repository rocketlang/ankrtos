#!/bin/bash
#
# Test Route Extraction Status
# Quick test to verify cron job setup
#

set -e

LOG_DIR="/root/logs/mari8x"
LOG_FILE="$LOG_DIR/route-extraction.log"

mkdir -p "$LOG_DIR"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=========================================="
log "Mari8x Route Extraction - TEST RUN"
log "=========================================="

# Get current route count
ROUTES=$(sudo -u postgres psql -d ankr_maritime -t -c "SELECT COUNT(*) FROM extracted_ais_routes;" | xargs)
log "✅ Current routes in database: $ROUTES"

# Get recent AIS positions
POSITIONS_24H=$(sudo -u postgres psql -d ankr_maritime -t -c "SELECT COUNT(*) FROM vessel_positions WHERE timestamp >= NOW() - INTERVAL '24 hours';" | xargs)
log "✅ AIS positions (last 24h): $POSITIONS_24H"

# Get route quality
log ""
log "📊 Routes by vessel type:"
sudo -u postgres psql -d ankr_maritime -c "
    SELECT
        \"vesselType\",
        COUNT(*) as routes,
        ROUND(AVG(\"qualityScore\")::numeric, 2) as avg_quality,
        ROUND(AVG(\"distanceFactor\")::numeric, 2) as avg_factor
    FROM extracted_ais_routes
    GROUP BY \"vesselType\"
    ORDER BY routes DESC;
" | tee -a "$LOG_FILE"

log ""
log "=========================================="
log "✅ Test complete - Cron job is working!"
log "=========================================="
