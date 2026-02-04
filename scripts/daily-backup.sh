#!/bin/bash
# Daily backup script - runs at 2 AM
BACKUP_DIR="/root/backups/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

export PGPASSWORD='ankrSecure2025'

# Compliance DB
pg_dump -U ankr -h localhost -p 5434 compliance > "$BACKUP_DIR/compliance.sql" 2>/dev/null

# Sunosunao DB  
pg_dump -U ankr -h localhost -p 5433 sunosunao > "$BACKUP_DIR/sunosunao.sql" 2>/dev/null

# Critical schemas
cp /root/ankr-compliance/apps/api/prisma/schema.prisma "$BACKUP_DIR/" 2>/dev/null

# Keep only last 7 days
find /root/backups -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null

echo "$(date): Backup completed to $BACKUP_DIR" >> /root/backups/backup.log
