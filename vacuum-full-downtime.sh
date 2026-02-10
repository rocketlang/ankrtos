#!/bin/bash

# VACUUM FULL - Complete Downtime Version
# Stops ALL services to ensure no lock conflicts

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "\n${BOLD}${RED}⚠️  FULL DATABASE VACUUM - DOWNTIME MODE${NC}"
echo -e "${YELLOW}This will stop ALL PM2 services and PostgreSQL${NC}\n"

read -p "Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

SPACE_BEFORE=$(df -h /mnt/ais-storage | awk 'NR==2 {print $3}')
DB_SIZE_BEFORE=$(psql -U postgres -d ankr_maritime -t -c "SELECT pg_size_pretty(pg_database_size('ankr_maritime'));" 2>/dev/null | xargs)

echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 1: Stop ALL Services${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo "Stopping all PM2 services..."
pm2 stop all >/dev/null 2>&1

echo "Waiting for connections to close..."
sleep 5

echo "Terminating all database connections..."
psql -U postgres <<SQL
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'ankr_maritime'
  AND pid <> pg_backend_pid();
SQL

echo "Stopping PostgreSQL..."
sudo systemctl stop postgresql

sleep 3
echo -e "${GREEN}✓ All services stopped${NC}\n"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 2: Start PostgreSQL (Clean State)${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

sudo systemctl start postgresql

until pg_isready -q 2>/dev/null; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

echo -e "${GREEN}✓ PostgreSQL started${NC}\n"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 3: VACUUM FULL (This may take 30-60 minutes)${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${YELLOW}Starting at: $(date '+%H:%M:%S')${NC}"
echo -e "Before: Volume=${SPACE_BEFORE}, Database=${DB_SIZE_BEFORE}\n"

echo "Running VACUUM FULL on vessel_positions..."

START_TIME=$(date +%s)

psql -U postgres -d ankr_maritime -c "VACUUM (FULL, VERBOSE, ANALYZE) vessel_positions;" 2>&1 | tail -20

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo -e "\n${GREEN}✓ VACUUM FULL completed in ${MINUTES}m ${SECONDS}s${NC}\n"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 4: Checkpoint & Analyze${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

psql -U postgres -c "CHECKPOINT;" >/dev/null 2>&1
psql -U postgres -d ankr_maritime -c "ANALYZE vessel_positions;" >/dev/null 2>&1

echo -e "${GREEN}✓ Checkpoint and analyze complete${NC}\n"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 5: Restart All Services${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo "Restarting PM2 services..."
pm2 restart all >/dev/null 2>&1

sleep 3

ONLINE=$(pm2 jlist 2>/dev/null | jq -r '[.[] | select(.pm2_env.status == "online")] | length')
TOTAL=$(pm2 jlist 2>/dev/null | jq 'length')

echo -e "${GREEN}✓ Services restarted: $ONLINE/$TOTAL online${NC}\n"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}📊 FINAL RESULTS${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

SPACE_AFTER=$(df -h /mnt/ais-storage | awk 'NR==2 {print $3}')
SPACE_PERCENT=$(df -h /mnt/ais-storage | awk 'NR==2 {print $5}')
DB_SIZE_AFTER=$(psql -U postgres -d ankr_maritime -t -c "SELECT pg_size_pretty(pg_database_size('ankr_maritime'));" 2>/dev/null | xargs)

echo -e "Volume (/mnt/ais-storage):"
echo -e "  Before: ${RED}$SPACE_BEFORE${NC} (50%)"
echo -e "  After:  ${GREEN}$SPACE_AFTER${NC} ($SPACE_PERCENT)"

echo -e "\nDatabase (ankr_maritime):"
echo -e "  Before: ${RED}$DB_SIZE_BEFORE${NC}"
echo -e "  After:  ${GREEN}$DB_SIZE_AFTER${NC}"

# Calculate savings
BEFORE_GB=$(echo $SPACE_BEFORE | sed 's/G//')
AFTER_GB=$(echo $SPACE_AFTER | sed 's/G//')
SAVED=$(echo "$BEFORE_GB - $AFTER_GB" | bc)

if (( $(echo "$SAVED > 0" | bc -l) )); then
    echo -e "\n${GREEN}${BOLD}✓ Freed: ${SAVED}GB${NC}"
else
    echo -e "\n${YELLOW}Note: Space reclaimed may show gradually${NC}"
fi

echo -e "\n${YELLOW}Completed at: $(date '+%H:%M:%S')${NC}\n"

echo -e "${GREEN}${BOLD}✓ VACUUM FULL complete! All services restored.${NC}\n"
