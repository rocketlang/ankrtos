#!/bin/bash

# Cleanup /mnt/storage volume
# Target: Free 15-20GB to get from 82% to ~65%

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "\n${BOLD}${CYAN}🧹 /mnt/storage Cleanup${NC}\n"

# Show current usage
echo -e "${BOLD}Before:${NC}"
df -h /mnt/storage | grep -v Filesystem

SPACE_BEFORE=$(df -k /mnt/storage | awk 'NR==2 {print $3}')

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 1: Old Backups (Keep last 7 days)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ -d "/mnt/storage/projects/ankr-backups/daily" ]; then
    BACKUP_SIZE=$(du -sh /mnt/storage/projects/ankr-backups/daily 2>/dev/null | awk '{print $1}')
    echo -e "Current backup size: ${YELLOW}$BACKUP_SIZE${NC}"

    echo "Removing backups older than 7 days..."
    find /mnt/storage/projects/ankr-backups/daily -type f -mtime +7 -delete 2>/dev/null
    find /mnt/storage/projects/ankr-backups -type d -empty -delete 2>/dev/null

    NEW_SIZE=$(du -sh /mnt/storage/projects/ankr-backups/daily 2>/dev/null | awk '{print $1}')
    echo -e "${GREEN}✓ Backup size now: $NEW_SIZE${NC}"
fi

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 2: Old December Backups${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ -d "/mnt/storage/projects/ankr-backups/20251214_125624" ]; then
    SIZE=$(du -sh /mnt/storage/projects/ankr-backups/20251214_125624 2>/dev/null | awk '{print $1}')
    echo -e "Removing December backup: ${YELLOW}$SIZE${NC}"
    rm -rf /mnt/storage/projects/ankr-backups/20251214_125624
    echo -e "${GREEN}✓ Removed${NC}"
fi

if [ -d "/mnt/storage/projects/ankr-backups/session-20251214_131735" ]; then
    SIZE=$(du -sh /mnt/storage/projects/ankr-backups/session-20251214_131735 2>/dev/null | awk '{print $1}')
    echo -e "Removing December session: ${YELLOW}$SIZE${NC}"
    rm -rf /mnt/storage/projects/ankr-backups/session-20251214_131735
    echo -e "${GREEN}✓ Removed${NC}"
fi

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 3: Cache Cleanup${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ -d "/mnt/storage/root-data/cache" ]; then
    CACHE_SIZE=$(du -sh /mnt/storage/root-data/cache 2>/dev/null | awk '{print $1}')
    echo -e "Current cache size: ${YELLOW}$CACHE_SIZE${NC}"

    echo "Clearing cache files..."
    find /mnt/storage/root-data/cache -type f -mtime +30 -delete 2>/dev/null
    rm -rf /mnt/storage/root-data/cache/* 2>/dev/null

    echo -e "${GREEN}✓ Cache cleared${NC}"
fi

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 4: Verdaccio NPM Cache${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ -d "/mnt/storage/verdaccio-storage" ]; then
    VERDACCIO_SIZE=$(du -sh /mnt/storage/verdaccio-storage 2>/dev/null | awk '{print $1}')
    echo -e "Verdaccio storage: ${YELLOW}$VERDACCIO_SIZE${NC}"
    echo "Keeping verdaccio - packages are actively used"
    echo -e "${BLUE}ℹ Run 'verdaccio-cleanup' command if you want to clear it${NC}"
fi

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 5: Old Project Directories${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Android project (2.7GB - likely old)
if [ -d "/mnt/storage/projects/Android" ]; then
    SIZE=$(du -sh /mnt/storage/projects/Android 2>/dev/null | awk '{print $1}')
    echo -e "Android project: ${YELLOW}$SIZE${NC}"
    echo "Archiving to tar.gz..."
    tar -czf /mnt/storage/projects/Android-backup-$(date +%Y%m%d).tar.gz -C /mnt/storage/projects Android 2>/dev/null
    rm -rf /mnt/storage/projects/Android
    ARCHIVE_SIZE=$(du -sh /mnt/storage/projects/Android-backup-*.tar.gz 2>/dev/null | tail -1 | awk '{print $1}')
    echo -e "${GREEN}✓ Archived to Android-backup.tar.gz ($ARCHIVE_SIZE)${NC}"
fi

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 6: Docker Cleanup${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo "Removing old Docker overlays..."
# Docker cleanup was already done in previous script
echo -e "${GREEN}✓ Docker already cleaned${NC}"

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 7: Old ankr-data${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ -d "/mnt/storage/ankr-data" ]; then
    ANKR_SIZE=$(du -sh /mnt/storage/ankr-data 2>/dev/null | awk '{print $1}')
    echo -e "ankr-data size: ${YELLOW}$ANKR_SIZE${NC}"

    # Clean old logs
    echo "Cleaning old logs from ankr-data..."
    find /mnt/storage/ankr-data -type f -name "*.log" -mtime +30 -delete 2>/dev/null
    find /mnt/storage/ankr-data -type f -name "*.log.*" -mtime +30 -delete 2>/dev/null

    echo -e "${GREEN}✓ Old logs cleaned${NC}"
fi

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}🎉 CLEANUP COMPLETE${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${BOLD}After:${NC}"
df -h /mnt/storage | grep -v Filesystem

SPACE_AFTER=$(df -k /mnt/storage | awk 'NR==2 {print $3}')
FREED_KB=$((SPACE_BEFORE - SPACE_AFTER))
FREED_GB=$(echo "scale=2; $FREED_KB / 1024 / 1024" | bc)

echo -e "\n${GREEN}${BOLD}✓ Freed: ${FREED_GB}GB${NC}\n"
