#!/bin/bash
# Restore script for backup taken at 20251214_225040
# Usage: bash restore.sh

BACKUP_DIR="$(dirname "$0")"
BASE_DIR="/var/www/ankr-labs-nx"

echo "⚠️  This will restore configuration from 20251214_225040"
read -p "Are you sure? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

# Restore .env files
cp "$BACKUP_DIR/config/backend.env" "$BASE_DIR/apps/wowtruck/backend/.env" 2>/dev/null
cp "$BACKUP_DIR/config/frontend.env" "$BASE_DIR/apps/wowtruck/frontend/.env" 2>/dev/null
cp "$BACKUP_DIR/config/prisma.env" "$BASE_DIR/apps/wowtruck/.env" 2>/dev/null

# Restart services
pm2 restart wowtruck-backend wowtruck-frontend

echo "✅ Configuration restored from 20251214_225040"
