#!/bin/bash
#
# Daily Route Extraction for Mari8x OSRM
# Extracts vessel routes from AIS position data
#
# Schedule: 4:00 AM daily (after GFW sync at 3:00 AM)
# Expected duration: 5-15 minutes
# Expected output: New routes added to extracted_ais_routes table
#

set -e  # Exit on error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="/root/logs/mari8x"
LOG_FILE="$LOG_DIR/route-extraction.log"
LOCK_FILE="/tmp/route-extraction.lock"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Function to log with timestamp
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to cleanup on exit
cleanup() {
    rm -f "$LOCK_FILE"
}
trap cleanup EXIT

# Check if another extraction is running
if [ -f "$LOCK_FILE" ]; then
    log "ERROR: Another extraction process is running (lock file exists)"
    exit 1
fi

# Create lock file
touch "$LOCK_FILE"

log "=========================================="
log "Mari8x OSRM - Daily Route Extraction"
log "=========================================="

# Change to backend directory
cd "$BACKEND_DIR"

# Get pre-extraction count
ROUTES_BEFORE=$(sudo -u postgres psql -d ankr_maritime -t -c "SELECT COUNT(*) FROM extracted_ais_routes;" | xargs)
log "Routes before extraction: $ROUTES_BEFORE"

# Run extraction (Method 1 only - trajectory analysis)
log "Starting route extraction..."
START_TIME=$(date +%s)

# Run the extraction script (using fixed simple version)
npx tsx src/scripts/extract-routes-simple.ts >> "$LOG_FILE" 2>&1
EXTRACTION_STATUS=$?

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

if [ $EXTRACTION_STATUS -eq 0 ]; then
    log "✅ Extraction completed successfully in ${DURATION}s"

    # Get post-extraction count
    ROUTES_AFTER=$(sudo -u postgres psql -d ankr_maritime -t -c "SELECT COUNT(*) FROM extracted_ais_routes;" | xargs)
    NEW_ROUTES=$((ROUTES_AFTER - ROUTES_BEFORE))

    log "Routes after extraction: $ROUTES_AFTER"
    log "New routes extracted: $NEW_ROUTES"

    # Get statistics by vessel type
    log ""
    log "Routes by vessel type:"
    sudo -u postgres psql -d ankr_maritime -c "
        SELECT
            \"vesselType\",
            COUNT(*) as routes,
            ROUND(AVG(\"qualityScore\")::numeric, 2) as avg_quality
        FROM extracted_ais_routes
        GROUP BY \"vesselType\"
        ORDER BY routes DESC;
    " | tee -a "$LOG_FILE"

    # If enough new routes, trigger OSRM re-export
    if [ $NEW_ROUTES -ge 50 ]; then
        log ""
        log "🔄 50+ new routes detected, triggering OSRM re-export..."
        npx tsx src/scripts/osrm-json-to-osm.ts >> "$LOG_FILE" 2>&1

        if [ $? -eq 0 ]; then
            log "✅ OSM export completed"
            log "⚠️  Manual OSRM reprocessing required (extract → partition → customize → restart)"
        else
            log "❌ OSM export failed"
        fi
    fi

else
    log "❌ Extraction failed with status $EXTRACTION_STATUS"
    log "Check log file for details: $LOG_FILE"
fi

log "=========================================="
log "Daily extraction complete"
log "=========================================="
log ""

exit $EXTRACTION_STATUS
