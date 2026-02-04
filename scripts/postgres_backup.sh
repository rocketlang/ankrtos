#!/bin/bash
# PostgreSQL Backup Script with 7-day rotation
# Jai GuruJi!

BACKUP_DIR="/root/backups/postgres"
DB_HOST="localhost"
DB_PORT="5434"
DB_USER="ankr"
DB_PASS="ankrSecure2025"
DB_NAME="compliance"
RETENTION_DAYS=7

mkdir -p $BACKUP_DIR

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/compliance_$TIMESTAMP.dump"
SQL_FILE="$BACKUP_DIR/compliance_$TIMESTAMP.sql"

echo "[$(date)] Starting PostgreSQL backup..."
PGPASSWORD=$DB_PASS pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F c -f $BACKUP_FILE
PGPASSWORD=$DB_PASS pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $SQL_FILE
gzip $SQL_FILE

echo "[$(date)] Cleaning old backups..."
find $BACKUP_DIR -name "compliance_*.dump" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "compliance_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "[$(date)] Backup complete!"
ls -lh $BACKUP_DIR | tail -5
