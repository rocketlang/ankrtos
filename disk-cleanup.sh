#!/bin/bash

# ANKR Disk Cleanup & Optimization Script
# Safely cleans up disk space across all volumes

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "\n${BOLD}${CYAN}🧹 ANKR Disk Cleanup & Optimization${NC}\n"
echo -e "${YELLOW}Starting cleanup at $(date '+%Y-%m-%d %H:%M:%S')${NC}\n"

# Function to show space before/after
show_space() {
    echo -e "\n${BOLD}${BLUE}📊 Current Disk Usage:${NC}"
    df -h | grep -E '/dev/vd[abc]' | awk '{printf "  %-10s %6s / %-6s (%s)\n", $6, $3, $2, $5}'
}

get_freed_space() {
    BEFORE=$1
    AFTER=$2
    FREED=$(echo "$BEFORE - $AFTER" | bc)
    echo "$FREED"
}

show_space

TOTAL_BEFORE=$(df -k | grep -E '/dev/vd[abc]' | awk '{sum+=$3} END {print sum}')

echo -e "\n${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${CYAN}Step 1: PM2 Logs Cleanup${NC}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

PM2_LOG_SIZE=$(du -sh ~/.pm2/logs 2>/dev/null | awk '{print $1}' || echo "0")
echo -e "Current PM2 log size: ${YELLOW}$PM2_LOG_SIZE${NC}"

if command -v pm2 &> /dev/null; then
    echo "Flushing PM2 logs..."
    pm2 flush
    echo -e "${GREEN}✓ PM2 logs flushed${NC}"
else
    echo -e "${YELLOW}⚠ PM2 not installed${NC}"
fi

echo -e "\n${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${CYAN}Step 2: Docker Cleanup${NC}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if command -v docker &> /dev/null; then
    echo "Current Docker disk usage:"
    docker system df
    echo ""

    echo "Removing unused Docker images..."
    docker image prune -f

    echo "Removing stopped containers..."
    docker container prune -f

    echo "Removing unused volumes..."
    docker volume prune -f

    echo "Removing build cache..."
    docker builder prune -f

    echo -e "\n${GREEN}✓ Docker cleanup complete${NC}"
    echo "New Docker disk usage:"
    docker system df
else
    echo -e "${YELLOW}⚠ Docker not installed${NC}"
fi

echo -e "\n${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${CYAN}Step 3: System Logs Cleanup${NC}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if command -v journalctl &> /dev/null; then
    JOURNAL_SIZE=$(journalctl --disk-usage | grep -oP '\d+\.\d+G|\d+\.\d+M' | head -1)
    echo -e "Current journal size: ${YELLOW}$JOURNAL_SIZE${NC}"

    echo "Vacuuming journal logs (keeping last 7 days)..."
    sudo journalctl --vacuum-time=7d

    echo -e "${GREEN}✓ Journal logs cleaned${NC}"
else
    echo -e "${YELLOW}⚠ journalctl not available${NC}"
fi

echo -e "\n${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${CYAN}Step 4: APT Package Cache${NC}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if command -v apt-get &> /dev/null; then
    APT_SIZE=$(du -sh /var/cache/apt/archives 2>/dev/null | awk '{print $1}' || echo "0")
    echo -e "Current APT cache size: ${YELLOW}$APT_SIZE${NC}"

    echo "Cleaning APT cache..."
    sudo apt-get clean -y
    sudo apt-get autoclean -y
    sudo apt-get autoremove -y

    echo -e "${GREEN}✓ APT cache cleaned${NC}"
else
    echo -e "${YELLOW}⚠ APT not available${NC}"
fi

echo -e "\n${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${CYAN}Step 5: Temporary Files${NC}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

TEMP_SIZE=$(du -sh /tmp 2>/dev/null | awk '{print $1}' || echo "0")
echo -e "Current /tmp size: ${YELLOW}$TEMP_SIZE${NC}"

echo "Cleaning temporary files older than 7 days..."
find /tmp -type f -atime +7 -delete 2>/dev/null || true
find /var/tmp -type f -atime +7 -delete 2>/dev/null || true

echo -e "${GREEN}✓ Temporary files cleaned${NC}"

echo -e "\n${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${CYAN}Step 6: NPM/Node Cache${NC}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if command -v npm &> /dev/null; then
    NPM_SIZE=$(du -sh ~/.npm 2>/dev/null | awk '{print $1}' || echo "0")
    echo -e "Current NPM cache size: ${YELLOW}$NPM_SIZE${NC}"

    echo "Cleaning NPM cache..."
    npm cache clean --force 2>/dev/null || true

    echo -e "${GREEN}✓ NPM cache cleaned${NC}"
else
    echo -e "${YELLOW}⚠ NPM not installed${NC}"
fi

echo -e "\n${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${CYAN}Step 7: Old Log Files${NC}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo "Removing old .log files (30+ days)..."
find /var/log -type f -name "*.log" -mtime +30 -delete 2>/dev/null || true
find /var/log -type f -name "*.gz" -mtime +30 -delete 2>/dev/null || true

# Clean old rotated logs
find /var/log -type f -name "*.1" -mtime +7 -delete 2>/dev/null || true
find /var/log -type f -name "*.old" -mtime +7 -delete 2>/dev/null || true

echo -e "${GREEN}✓ Old log files removed${NC}"

echo -e "\n${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${CYAN}Step 8: Optimize Databases${NC}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if command -v psql &> /dev/null; then
    if pg_isready -q 2>/dev/null; then
        echo "Running PostgreSQL VACUUM..."
        psql -U postgres -c "VACUUM ANALYZE;" 2>/dev/null || echo "Note: Some databases may require explicit vacuum"
        echo -e "${GREEN}✓ PostgreSQL optimized${NC}"
    else
        echo -e "${YELLOW}⚠ PostgreSQL not running${NC}"
    fi
else
    echo -e "${YELLOW}⚠ PostgreSQL not installed${NC}"
fi

if command -v redis-cli &> /dev/null; then
    if redis-cli ping 2>/dev/null | grep -q PONG; then
        echo "Redis is running - memory managed automatically"
        echo -e "${GREEN}✓ Redis checked${NC}"
    else
        echo -e "${YELLOW}⚠ Redis not running${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Redis not installed${NC}"
fi

echo -e "\n${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${CYAN}🎉 CLEANUP SUMMARY${NC}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

show_space

TOTAL_AFTER=$(df -k | grep -E '/dev/vd[abc]' | awk '{sum+=$3} END {print sum}')
FREED_KB=$((TOTAL_BEFORE - TOTAL_AFTER))
FREED_GB=$(echo "scale=2; $FREED_KB / 1024 / 1024" | bc)

if (( $(echo "$FREED_GB > 0" | bc -l) )); then
    echo -e "\n${GREEN}${BOLD}✓ Successfully freed: ${FREED_GB}GB${NC}"
else
    echo -e "\n${BLUE}${BOLD}ℹ Space usage optimized${NC}"
fi

echo -e "\n${YELLOW}Completed at $(date '+%Y-%m-%d %H:%M:%S')${NC}\n"

# Save cleanup log
CLEANUP_LOG="/var/log/ankr-cleanup-$(date +%Y%m%d-%H%M%S).log"
echo "Cleanup completed at $(date)" > "$CLEANUP_LOG"
echo "Space freed: ${FREED_GB}GB" >> "$CLEANUP_LOG"
echo -e "${BLUE}Log saved to: $CLEANUP_LOG${NC}\n"
