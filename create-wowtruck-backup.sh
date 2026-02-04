#!/bin/bash
# WowTruck to ANKRTMS Migration - Backup Script
# Created: 2026-01-22

set -e  # Exit on error

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups/wowtruck-to-ankrtms-${TIMESTAMP}"
LOG_FILE="${BACKUP_DIR}/backup.log"

echo "=== WowTruck to ANKRTMS Migration Backup ===" | tee -a "$LOG_FILE"
echo "Started: $(date)" | tee -a "$LOG_FILE"
echo "Backup Directory: ${BACKUP_DIR}" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Create backup directory structure
mkdir -p "${BACKUP_DIR}"/{database,config,codebase,env}

# 1. Database Backup
echo "[1/5] Backing up PostgreSQL database (wowtruck schema)..." | tee -a "$LOG_FILE"
if pg_dump -U ankr -h localhost -p 5432 wowtruck > "${BACKUP_DIR}/database/wowtruck_full_$(date +%Y%m%d_%H%M%S).sql" 2>> "$LOG_FILE"; then
    echo "  ✓ Database backup complete" | tee -a "$LOG_FILE"
    DB_SIZE=$(du -sh "${BACKUP_DIR}/database/wowtruck_full_"*.sql | cut -f1)
    echo "  Size: ${DB_SIZE}" | tee -a "$LOG_FILE"
else
    echo "  ✗ Database backup failed (may not exist or no password set)" | tee -a "$LOG_FILE"
fi

# 2. Configuration Files
echo "[2/5] Backing up configuration files..." | tee -a "$LOG_FILE"
if [ -d "/root/.ankr/config" ]; then
    cp -r /root/.ankr/config/* "${BACKUP_DIR}/config/" 2>> "$LOG_FILE"
    echo "  ✓ ANKR config files backed up" | tee -a "$LOG_FILE"
fi

if [ -f "/root/ankr-ctl" ]; then
    cp /root/ankr-ctl "${BACKUP_DIR}/config/" 2>> "$LOG_FILE"
    echo "  ✓ ankr-ctl script backed up" | tee -a "$LOG_FILE"
fi

if [ -f "/root/ecosystem.config.js" ]; then
    cp /root/ecosystem.config.js "${BACKUP_DIR}/config/" 2>> "$LOG_FILE"
fi

# 3. Environment Files
echo "[3/5] Backing up environment files..." | tee -a "$LOG_FILE"
if [ -f "/root/.env" ]; then
    cp /root/.env "${BACKUP_DIR}/env/.env.root" 2>> "$LOG_FILE"
    echo "  ✓ Root .env backed up" | tee -a "$LOG_FILE"
fi

if [ -d "/root/rocketlang/ankr-labs-nx/apps/wowtruck" ]; then
    find /root/rocketlang/ankr-labs-nx/apps/wowtruck -name ".env*" -type f -exec cp {} "${BACKUP_DIR}/env/" \; 2>> "$LOG_FILE"
    echo "  ✓ WowTruck app .env files backed up" | tee -a "$LOG_FILE"
fi

# 4. Critical Codebase Files
echo "[4/5] Backing up critical codebase files..." | tee -a "$LOG_FILE"

# Package.json files with wowtruck references
echo "  - Backing up package.json files..." | tee -a "$LOG_FILE"
find /root/rocketlang/ankr-labs-nx -name "package.json" -not -path "*/node_modules/*" -not -path "*/backups/*" -exec grep -l "wowtruck" {} \; > "${BACKUP_DIR}/codebase/package-json-files.txt" 2>> "$LOG_FILE"
PACKAGE_COUNT=$(wc -l < "${BACKUP_DIR}/codebase/package-json-files.txt")
echo "    Found ${PACKAGE_COUNT} package.json files with wowtruck references" | tee -a "$LOG_FILE"

# Prisma schema files
echo "  - Backing up Prisma schema files..." | tee -a "$LOG_FILE"
find /root/rocketlang/ankr-labs-nx -name "schema.prisma" -not -path "*/node_modules/*" -exec grep -l "wowtruck" {} \; | while read file; do
    cp "$file" "${BACKUP_DIR}/codebase/$(basename $(dirname $file))_schema.prisma" 2>> "$LOG_FILE"
done
echo "    ✓ Prisma schemas backed up" | tee -a "$LOG_FILE"

# Key configuration files
echo "  - Backing up key config files..." | tee -a "$LOG_FILE"
if [ -f "/root/rocketlang/ankr-labs-nx/packages/ankr-interact/src/config/features.ts" ]; then
    cp /root/rocketlang/ankr-labs-nx/packages/ankr-interact/src/config/features.ts "${BACKUP_DIR}/codebase/" 2>> "$LOG_FILE"
fi

if [ -f "/root/rocketlang/ankr-labs-nx/packages/saathi-core/src/config/branding.ts" ]; then
    cp /root/rocketlang/ankr-labs-nx/packages/saathi-core/src/config/branding.ts "${BACKUP_DIR}/codebase/" 2>> "$LOG_FILE"
fi

# 5. Create Archive
echo "[5/5] Creating compressed archive..." | tee -a "$LOG_FILE"
cd /root/backups
tar -czf "wowtruck-to-ankrtms-${TIMESTAMP}.tar.gz" "wowtruck-to-ankrtms-${TIMESTAMP}" 2>> "$LOG_FILE"
ARCHIVE_SIZE=$(du -sh "wowtruck-to-ankrtms-${TIMESTAMP}.tar.gz" | cut -f1)
echo "  ✓ Archive created: wowtruck-to-ankrtms-${TIMESTAMP}.tar.gz" | tee -a "$LOG_FILE"
echo "  Size: ${ARCHIVE_SIZE}" | tee -a "$LOG_FILE"

# Summary
echo "" | tee -a "$LOG_FILE"
echo "=== Backup Summary ===" | tee -a "$LOG_FILE"
echo "Backup Location: ${BACKUP_DIR}" | tee -a "$LOG_FILE"
echo "Archive: /root/backups/wowtruck-to-ankrtms-${TIMESTAMP}.tar.gz (${ARCHIVE_SIZE})" | tee -a "$LOG_FILE"
echo "Log File: ${LOG_FILE}" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# List contents
echo "Backup Contents:" | tee -a "$LOG_FILE"
du -sh "${BACKUP_DIR}"/* | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

echo "✓ Backup completed successfully at $(date)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "To restore from this backup:" | tee -a "$LOG_FILE"
echo "  1. Database: psql -U ankr wowtruck < ${BACKUP_DIR}/database/wowtruck_full_*.sql" | tee -a "$LOG_FILE"
echo "  2. Config: cp ${BACKUP_DIR}/config/* /root/.ankr/config/" | tee -a "$LOG_FILE"
echo "  3. Extract archive: tar -xzf /root/backups/wowtruck-to-ankrtms-${TIMESTAMP}.tar.gz" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Display backup location
echo "BACKUP_DIR=${BACKUP_DIR}"
