#!/bin/bash

# Emergency Cleanup - Handles massive log files
# Run this when disk space is critically low

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "\n${BOLD}${RED}🚨 EMERGENCY DISK CLEANUP${NC}\n"

# Function to show disk usage
show_disk() {
    df -h | grep -E '/dev/vd[abc]' | awk '{printf "  %-20s %6s / %-6s (%s)\n", $6, $3, $2, $5}'
}

echo -e "${BOLD}Before:${NC}"
show_disk

SPACE_BEFORE=$(df -k / | awk 'NR==2 {print $3}')

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 1: PostgreSQL Log (18GB!)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

PGLOG="/var/log/postgresql/postgresql-16-main.log"
if [ -f "$PGLOG" ]; then
    SIZE=$(du -sh "$PGLOG" | awk '{print $1}')
    echo -e "Current size: ${RED}$SIZE${NC}"

    echo "Truncating PostgreSQL log (keeping last 1000 lines)..."
    # Keep last 1000 lines, truncate the rest
    tail -1000 "$PGLOG" > /tmp/pg-recent.log
    sudo mv /tmp/pg-recent.log "$PGLOG"
    sudo chown postgres:postgres "$PGLOG"

    NEW_SIZE=$(du -sh "$PGLOG" | awk '{print $1}')
    echo -e "${GREEN}✓ Reduced from $SIZE to $NEW_SIZE${NC}"
else
    echo "PostgreSQL log not found (already cleaned?)"
fi

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 2: Configure PostgreSQL Log Rotation${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Check if log rotation is configured
if ! grep -q "log_rotation_age" /etc/postgresql/16/main/postgresql.conf 2>/dev/null; then
    echo "Configuring PostgreSQL log rotation..."
    echo "
# Log rotation settings
log_rotation_age = 1d
log_rotation_size = 100MB
log_truncate_on_rotation = on
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
" | sudo tee -a /etc/postgresql/16/main/postgresql.conf > /dev/null

    echo "Restarting PostgreSQL to apply changes..."
    sudo systemctl restart postgresql
    echo -e "${GREEN}✓ PostgreSQL log rotation configured${NC}"
else
    echo "Log rotation already configured"
fi

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 3: Old PostgreSQL Logs${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo "Removing PostgreSQL logs older than 7 days..."
find /var/log/postgresql -type f -name "*.log" -mtime +7 -delete 2>/dev/null || true
find /var/log/postgresql -type f -name "*.log.*" -mtime +7 -delete 2>/dev/null || true
echo -e "${GREEN}✓ Old PostgreSQL logs removed${NC}"

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 4: System Logs${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo "Cleaning large syslog files..."
sudo truncate -s 0 /var/log/syslog.1 2>/dev/null || true
echo -e "${GREEN}✓ Syslog cleaned${NC}"

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 5: Old Journal Logs${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo "Vacuuming journal logs (keeping 3 days)..."
sudo journalctl --vacuum-time=3d
echo -e "${GREEN}✓ Journal vacuumed${NC}"

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 6: Bitninja Logs${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ -d "/var/log/bitninja" ]; then
    BITNINJA_SIZE=$(du -sh /var/log/bitninja | awk '{print $1}')
    echo -e "Current bitninja log size: ${YELLOW}$BITNINJA_SIZE${NC}"

    echo "Cleaning bitninja logs older than 7 days..."
    find /var/log/bitninja -type f -mtime +7 -delete 2>/dev/null || true
    find /var/log/bitninja-dispatcher -type f -mtime +7 -delete 2>/dev/null || true
    echo -e "${GREEN}✓ Bitninja logs cleaned${NC}"
fi

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}🎉 CLEANUP COMPLETE${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${BOLD}After:${NC}"
show_disk

SPACE_AFTER=$(df -k / | awk 'NR==2 {print $3}')
FREED_KB=$((SPACE_BEFORE - SPACE_AFTER))
FREED_GB=$(echo "scale=2; $FREED_KB / 1024 / 1024" | bc)

echo -e "\n${GREEN}${BOLD}✓ Successfully freed: ${FREED_GB}GB${NC}\n"

# Create a cron job for regular cleanup
echo -e "${BOLD}Setting up automatic cleanup...${NC}"
CRON_JOB="0 2 * * 0 /root/disk-cleanup.sh > /var/log/weekly-cleanup.log 2>&1"

if ! crontab -l 2>/dev/null | grep -q "disk-cleanup.sh"; then
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo -e "${GREEN}✓ Weekly cleanup scheduled (Sundays at 2 AM)${NC}\n"
else
    echo -e "${YELLOW}Automatic cleanup already scheduled${NC}\n"
fi
