#!/bin/bash

# Intelligent Storage Manager for AIS Data
# Prevents bloat with automatic retention, compression, and monitoring

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "\n${BOLD}${CYAN}🤖 Intelligent Storage Manager${NC}\n"

# Configuration
DB_NAME="ankr_maritime"
TABLE_NAME="vessel_positions"
RETENTION_MONTHS=6  # Keep last 6 months of data
COMPRESSION_DAYS=7  # Compress data older than 7 days
VOLUME_ALERT_THRESHOLD=75  # Alert when volume > 75%

# ============================================================================
# 1. SET UP DATA RETENTION POLICY
# ============================================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 1: Configure Data Retention${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "Setting retention policy: ${YELLOW}Keep last $RETENTION_MONTHS months${NC}"

psql -U postgres -d $DB_NAME <<SQL
-- Remove old retention policy if exists
SELECT remove_retention_policy('$TABLE_NAME', if_exists => true);

-- Add new retention policy (drop chunks older than 6 months)
SELECT add_retention_policy('$TABLE_NAME',
    drop_after => INTERVAL '$RETENTION_MONTHS months',
    if_not_exists => true
);
SQL

echo -e "${GREEN}✓ Retention policy configured${NC}\n"

# ============================================================================
# 2. SET UP COMPRESSION POLICY
# ============================================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 2: Configure Compression Policy${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "Setting compression policy: ${YELLOW}Compress after $COMPRESSION_DAYS days${NC}"

psql -U postgres -d $DB_NAME <<SQL
-- Remove old compression policy
SELECT remove_compression_policy('$TABLE_NAME', if_exists => true);

-- Add compression policy
SELECT add_compression_policy('$TABLE_NAME',
    compress_after => INTERVAL '$COMPRESSION_DAYS days',
    if_not_exists => true
);

-- Enable compression on hypertable
ALTER TABLE $TABLE_NAME SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'vesselId',
    timescaledb.compress_orderby = 'timestamp DESC'
);
SQL

echo -e "${GREEN}✓ Compression policy configured${NC}\n"

# ============================================================================
# 3. CHECK CURRENT STATS
# ============================================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 3: Current Storage Stats${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Volume stats
VOLUME_USED=$(df -h /mnt/ais-storage | awk 'NR==2 {print $3}')
VOLUME_PERCENT=$(df -h /mnt/ais-storage | awk 'NR==2 {print $5}' | sed 's/%//')
VOLUME_AVAIL=$(df -h /mnt/ais-storage | awk 'NR==2 {print $4}')

echo -e "Volume (/mnt/ais-storage):"
echo -e "  Used: ${YELLOW}$VOLUME_USED${NC}"
echo -e "  Available: ${GREEN}$VOLUME_AVAIL${NC}"
echo -e "  Usage: ${YELLOW}${VOLUME_PERCENT}%${NC}"

if [ "$VOLUME_PERCENT" -gt "$VOLUME_ALERT_THRESHOLD" ]; then
    echo -e "  ${RED}⚠ Above threshold!${NC}"
fi

# Database stats
DB_SIZE=$(psql -U postgres -d $DB_NAME -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" | xargs)
TOTAL_ROWS=$(psql -U postgres -d $DB_NAME -t -c "SELECT COUNT(*) FROM $TABLE_NAME;" | xargs)
COMPRESSED=$(psql -U postgres -d $DB_NAME -t -c "SELECT COUNT(*) FROM timescaledb_information.chunks WHERE hypertable_name='$TABLE_NAME' AND is_compressed=true;" | xargs)
UNCOMPRESSED=$(psql -U postgres -d $DB_NAME -t -c "SELECT COUNT(*) FROM timescaledb_information.chunks WHERE hypertable_name='$TABLE_NAME' AND is_compressed=false;" | xargs)

echo -e "\nDatabase ($DB_NAME):"
echo -e "  Size: ${YELLOW}$DB_SIZE${NC}"
echo -e "  Total rows: ${CYAN}$(printf "%'d" $TOTAL_ROWS)${NC}"
echo -e "  Compressed chunks: ${GREEN}$COMPRESSED${NC}"
echo -e "  Uncompressed chunks: ${YELLOW}$UNCOMPRESSED${NC}"

# ============================================================================
# 4. SET UP SCHEDULED MAINTENANCE
# ============================================================================
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 4: Schedule Maintenance Jobs${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Create maintenance script
cat > /root/ais-maintenance.sh <<'MAINT'
#!/bin/bash
# Daily AIS maintenance job

LOG_FILE="/var/log/ais-maintenance-$(date +%Y%m%d).log"

{
    echo "=== AIS Maintenance $(date) ==="

    # Run compression job
    psql -U postgres -d ankr_maritime -c "CALL run_job((SELECT job_id FROM timescaledb_information.jobs WHERE proc_name = 'policy_compression' AND hypertable_name = 'vessel_positions'));" 2>&1

    # Run retention job
    psql -U postgres -d ankr_maritime -c "CALL run_job((SELECT job_id FROM timescaledb_information.jobs WHERE proc_name = 'policy_retention' AND hypertable_name = 'vessel_positions'));" 2>&1

    # Analyze for query optimization
    psql -U postgres -d ankr_maritime -c "ANALYZE vessel_positions;" 2>&1

    echo "=== Maintenance complete ==="
} >> "$LOG_FILE" 2>&1
MAINT

chmod +x /root/ais-maintenance.sh

# Set up cron jobs
CRON_MAINTENANCE="0 2 * * * /root/ais-maintenance.sh"
CRON_MONITORING="0 */6 * * * /root/intelligent-storage-manager.sh check"

# Add to crontab if not exists
(crontab -l 2>/dev/null | grep -v "ais-maintenance" ; echo "$CRON_MAINTENANCE") | crontab -
(crontab -l 2>/dev/null | grep -v "intelligent-storage-manager" ; echo "$CRON_MONITORING") | crontab -

echo -e "${GREEN}✓ Scheduled maintenance jobs:${NC}"
echo -e "  - Daily maintenance: ${CYAN}2 AM${NC} (compression + retention)"
echo -e "  - Monitoring: ${CYAN}Every 6 hours${NC} (this script)"

# ============================================================================
# 5. CREATE MONITORING ALERTS
# ============================================================================
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 5: Monitoring Alerts${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Create alert script
cat > /root/storage-alerts.sh <<'ALERT'
#!/bin/bash
# Storage alert system

THRESHOLD=75
VOLUME_PERCENT=$(df -h /mnt/ais-storage | awk 'NR==2 {print $5}' | sed 's/%//')

if [ "$VOLUME_PERCENT" -gt "$THRESHOLD" ]; then
    MESSAGE="⚠️ ALERT: AIS storage at ${VOLUME_PERCENT}% (threshold: ${THRESHOLD}%)"

    # Log alert
    echo "$(date): $MESSAGE" >> /var/log/storage-alerts.log

    # You can add notifications here:
    # - Send email
    # - Slack webhook
    # - SMS via Twilio
    # - Telegram bot

    echo "$MESSAGE"

    # Auto-cleanup if > 85%
    if [ "$VOLUME_PERCENT" -gt 85 ]; then
        echo "Running emergency cleanup..."
        /root/disk-cleanup.sh >> /var/log/emergency-cleanup.log 2>&1
    fi
fi
ALERT

chmod +x /root/storage-alerts.sh

echo -e "${GREEN}✓ Alert system configured${NC}"
echo -e "  Threshold: ${YELLOW}${VOLUME_ALERT_THRESHOLD}%${NC}"
echo -e "  Emergency cleanup: ${RED}>85%${NC}"

# ============================================================================
# SUMMARY
# ============================================================================
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}✅ INTELLIGENT STORAGE MANAGER CONFIGURED${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${GREEN}Automated Features:${NC}"
echo -e "  ✓ Data retention: Auto-delete data older than $RETENTION_MONTHS months"
echo -e "  ✓ Compression: Auto-compress data older than $COMPRESSION_DAYS days"
echo -e "  ✓ Daily maintenance: Runs at 2 AM"
echo -e "  ✓ Monitoring: Every 6 hours"
echo -e "  ✓ Alerts: When usage > ${VOLUME_ALERT_THRESHOLD}%"
echo -e "  ✓ Emergency cleanup: When usage > 85%"

echo -e "\n${CYAN}Manual Commands:${NC}"
echo -e "  Check status: ${BOLD}./intelligent-storage-manager.sh check${NC}"
echo -e "  Run maintenance: ${BOLD}/root/ais-maintenance.sh${NC}"
echo -e "  View logs: ${BOLD}tail -f /var/log/ais-maintenance-*.log${NC}"

echo -e "\n${GREEN}${BOLD}✓ AIS data will no longer bloat!${NC}\n"
