#!/bin/bash
# Quick Health Check - Fast version for rapid diagnostics

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "\n${BOLD}⚡ Quick Health Check${NC} - $(date '+%H:%M:%S')\n"

# CPU & Memory
CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
MEM=$(free | awk '/^Mem:/ {printf "%.1f", $3/$2 * 100}')
echo -e "CPU: ${CPU}% | Memory: ${MEM}%"

# Disk - show warning volumes only
DISK_ROOT=$(df -h / | awk 'NR==2 {print $5}')
DISK_ROOT_NUM=$(echo $DISK_ROOT | sed 's/%//')
DISK_STORAGE=$(df -h /mnt/storage 2>/dev/null | awk 'NR==2 {print $5}' || echo "N/A")
DISK_STORAGE_NUM=$(echo $DISK_STORAGE | sed 's/%//')

# Only show volumes > 75%
DISK_WARN=""
[ "$DISK_ROOT_NUM" -gt 75 ] 2>/dev/null && DISK_WARN="${DISK_WARN}Root:$DISK_ROOT "
[ "$DISK_STORAGE_NUM" -gt 75 ] 2>/dev/null && DISK_WARN="${DISK_WARN}Storage:$DISK_STORAGE "

if [ -n "$DISK_WARN" ]; then
    echo -e "Disks: ${YELLOW}⚠${NC} $DISK_WARN"
else
    echo -e "Disks: ${GREEN}✓${NC} All < 75%"
fi

# PM2 Status
PM2_ONLINE=$(pm2 jlist 2>/dev/null | jq -r '[.[] | select(.pm2_env.status == "online")] | length')
PM2_TOTAL=$(pm2 jlist 2>/dev/null | jq 'length')
PM2_ERRORS=$(pm2 jlist 2>/dev/null | jq -r '[.[] | select(.pm2_env.status != "online" and .pm2_env.status != "stopped")] | length')

if [ "$PM2_ERRORS" -gt 0 ]; then
    echo -e "PM2: ${RED}${PM2_ONLINE}/${PM2_TOTAL} online (${PM2_ERRORS} errors)${NC}"
else
    echo -e "PM2: ${GREEN}${PM2_ONLINE}/${PM2_TOTAL} online${NC}"
fi

# Key Ports
for port in 4444 5432 6379; do
    if lsof -i :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "Port $port: ${GREEN}✓${NC}"
    else
        echo -e "Port $port: ${RED}✗${NC}"
    fi
done

# Database
if pg_isready -q 2>/dev/null; then
    echo -e "PostgreSQL: ${GREEN}✓${NC}"
else
    echo -e "PostgreSQL: ${RED}✗${NC}"
fi

echo ""
