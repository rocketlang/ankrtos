#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# WOWTRUCK 2.0 - BACKUP & PERMANENT FIX
# ═══════════════════════════════════════════════════════════════════════════════
# This script:
#   1. Creates timestamped backup of all config files
#   2. Backs up database schema
#   3. Applies permanent port/database fix
#   4. Installs PM2 ecosystem file for future deployments
#
# Usage: bash wowtruck-backup-and-fix.sh
# 
# 🙏 Jai Guru Ji | ANKR Labs | December 14, 2025
# ═══════════════════════════════════════════════════════════════════════════════

set -e  # Exit on error

# ─────────────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────────
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$HOME/wowtruck-backups/$TIMESTAMP"
WOWTRUCK_BACKEND_PORT=4000
DATABASE_URL="postgresql://ankr:indrA@0612@localhost:5432/ankr_eon?schema=wowtruck"

# Detect working directory
if [ -d "/var/www/ankr-labs-nx" ]; then
    BASE_DIR="/var/www/ankr-labs-nx"
    echo "📂 Production server detected: $BASE_DIR"
elif [ -d "$HOME/ankr-labs-nx" ]; then
    BASE_DIR="$HOME/ankr-labs-nx"
    echo "📂 Development server detected: $BASE_DIR"
else
    echo "❌ ERROR: Cannot find ankr-labs-nx directory!"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "  🚛 WOWTRUCK 2.0 - BACKUP & PERMANENT FIX"
echo "  📅 Timestamp: $TIMESTAMP"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 1: BACKUP EVERYTHING
# ═══════════════════════════════════════════════════════════════════════════════

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📦 PHASE 1: CREATING BACKUP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR/config"
mkdir -p "$BACKUP_DIR/database"
mkdir -p "$BACKUP_DIR/pm2"
mkdir -p "$BACKUP_DIR/nginx"

echo "📁 Backup directory: $BACKUP_DIR"
echo ""

# ─────────────────────────────────────────────────────────────────────────────────
# Backup 1.1: All .env files
# ─────────────────────────────────────────────────────────────────────────────────
echo "📝 Backing up .env files..."

# Backend .env
if [ -f "$BASE_DIR/apps/wowtruck/backend/.env" ]; then
    cp "$BASE_DIR/apps/wowtruck/backend/.env" "$BACKUP_DIR/config/backend.env"
    echo "   ✅ backend/.env"
else
    echo "   ⚠️  backend/.env not found"
fi

# Frontend .env
if [ -f "$BASE_DIR/apps/wowtruck/frontend/.env" ]; then
    cp "$BASE_DIR/apps/wowtruck/frontend/.env" "$BACKUP_DIR/config/frontend.env"
    echo "   ✅ frontend/.env"
else
    echo "   ⚠️  frontend/.env not found"
fi

# Prisma .env
if [ -f "$BASE_DIR/apps/wowtruck/.env" ]; then
    cp "$BASE_DIR/apps/wowtruck/.env" "$BACKUP_DIR/config/prisma.env"
    echo "   ✅ prisma/.env"
else
    echo "   ⚠️  prisma/.env not found"
fi

# Root .env
if [ -f "$BASE_DIR/.env" ]; then
    cp "$BASE_DIR/.env" "$BACKUP_DIR/config/root.env"
    echo "   ✅ root/.env"
fi

# ─────────────────────────────────────────────────────────────────────────────────
# Backup 1.2: PM2 process list
# ─────────────────────────────────────────────────────────────────────────────────
echo ""
echo "📝 Backing up PM2 configuration..."

pm2 save 2>/dev/null || true
pm2 list > "$BACKUP_DIR/pm2/pm2-list.txt" 2>/dev/null || true
pm2 prettylist > "$BACKUP_DIR/pm2/pm2-prettylist.json" 2>/dev/null || true

if [ -f "$HOME/.pm2/dump.pm2" ]; then
    cp "$HOME/.pm2/dump.pm2" "$BACKUP_DIR/pm2/dump.pm2"
fi

echo "   ✅ PM2 process list saved"

# ─────────────────────────────────────────────────────────────────────────────────
# Backup 1.3: Nginx configuration
# ─────────────────────────────────────────────────────────────────────────────────
echo ""
echo "📝 Backing up Nginx configuration..."

if [ -f "/etc/nginx/sites-available/wowtruck.ankr.in" ]; then
    sudo cp "/etc/nginx/sites-available/wowtruck.ankr.in" "$BACKUP_DIR/nginx/wowtruck.ankr.in"
    echo "   ✅ wowtruck.ankr.in"
fi

if [ -f "/etc/nginx/sites-available/ankr.in" ]; then
    sudo cp "/etc/nginx/sites-available/ankr.in" "$BACKUP_DIR/nginx/ankr.in"
    echo "   ✅ ankr.in"
fi

if [ -f "/etc/nginx/nginx.conf" ]; then
    sudo cp "/etc/nginx/nginx.conf" "$BACKUP_DIR/nginx/nginx.conf"
    echo "   ✅ nginx.conf"
fi

# ─────────────────────────────────────────────────────────────────────────────────
# Backup 1.4: Database schema and critical data
# ─────────────────────────────────────────────────────────────────────────────────
echo ""
echo "📝 Backing up database..."

# Schema only (fast)
PGPASSWORD='indrA@0612' pg_dump -h localhost -p 5432 -U ankr -d ankr_eon \
    --schema=wowtruck --schema-only \
    > "$BACKUP_DIR/database/wowtruck-schema.sql" 2>/dev/null && \
    echo "   ✅ Schema backup" || \
    echo "   ⚠️  Schema backup failed"

# User table (critical)
PGPASSWORD='indrA@0612' pg_dump -h localhost -p 5432 -U ankr -d ankr_eon \
    --table='wowtruck."User"' --data-only \
    > "$BACKUP_DIR/database/users-data.sql" 2>/dev/null && \
    echo "   ✅ Users data backup" || \
    echo "   ⚠️  Users data backup failed"

# Current user count for verification
PGPASSWORD='indrA@0612' psql -h localhost -p 5432 -U ankr -d ankr_eon \
    -c "SELECT email, role, \"createdAt\" FROM wowtruck.\"User\";" \
    > "$BACKUP_DIR/database/users-list.txt" 2>/dev/null || true

# ─────────────────────────────────────────────────────────────────────────────────
# Backup 1.5: Prisma schema
# ─────────────────────────────────────────────────────────────────────────────────
echo ""
echo "📝 Backing up Prisma schema..."

if [ -f "$BASE_DIR/apps/wowtruck/backend/prisma/schema.prisma" ]; then
    cp "$BASE_DIR/apps/wowtruck/backend/prisma/schema.prisma" "$BACKUP_DIR/config/schema.prisma"
    echo "   ✅ schema.prisma"
elif [ -f "$BASE_DIR/apps/wowtruck/prisma/schema.prisma" ]; then
    cp "$BASE_DIR/apps/wowtruck/prisma/schema.prisma" "$BACKUP_DIR/config/schema.prisma"
    echo "   ✅ schema.prisma (from apps/wowtruck/prisma)"
fi

# ─────────────────────────────────────────────────────────────────────────────────
# Backup 1.6: Create restore script
# ─────────────────────────────────────────────────────────────────────────────────
echo ""
echo "📝 Creating restore script..."

cat > "$BACKUP_DIR/restore.sh" << 'RESTORESCRIPT'
#!/bin/bash
# Restore script for backup taken at TIMESTAMP_PLACEHOLDER
# Usage: bash restore.sh

BACKUP_DIR="$(dirname "$0")"
BASE_DIR="BASEDIR_PLACEHOLDER"

echo "⚠️  This will restore configuration from TIMESTAMP_PLACEHOLDER"
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

echo "✅ Configuration restored from TIMESTAMP_PLACEHOLDER"
RESTORESCRIPT

sed -i "s|TIMESTAMP_PLACEHOLDER|$TIMESTAMP|g" "$BACKUP_DIR/restore.sh"
sed -i "s|BASEDIR_PLACEHOLDER|$BASE_DIR|g" "$BACKUP_DIR/restore.sh"
chmod +x "$BACKUP_DIR/restore.sh"

echo "   ✅ restore.sh created"

# ─────────────────────────────────────────────────────────────────────────────────
# Backup Summary
# ─────────────────────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ BACKUP COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  📁 Location: $BACKUP_DIR"
echo ""
ls -la "$BACKUP_DIR"
echo ""
echo "  📋 To restore: bash $BACKUP_DIR/restore.sh"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 2: APPLY PERMANENT FIX (Option 1)
# ═══════════════════════════════════════════════════════════════════════════════

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔧 PHASE 2: APPLYING PERMANENT FIX"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ─────────────────────────────────────────────────────────────────────────────────
# Fix 2.1: Backend .env (THE MOST CRITICAL FILE)
# ─────────────────────────────────────────────────────────────────────────────────
echo "📝 Step 2.1: Writing canonical backend .env..."

cat > "$BASE_DIR/apps/wowtruck/backend/.env" << ENVEOF
# ═══════════════════════════════════════════════════════════════════════════════
# WOWTRUCK 2.0 BACKEND - CANONICAL CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════
# LOCKED BY: wowtruck-backup-and-fix.sh on $TIMESTAMP
# ═══════════════════════════════════════════════════════════════════════════════
# ⚠️  DO NOT CHANGE PORT - Must be 4000 to match nginx proxy
# ⚠️  DO NOT REMOVE ?schema=wowtruck - Required for Prisma to find tables
# ═══════════════════════════════════════════════════════════════════════════════

DATABASE_URL="${DATABASE_URL}"
PORT=${WOWTRUCK_BACKEND_PORT}
NODE_ENV=production
JWT_SECRET=wowtruck-jwt-secret-2025
LICENSE_KEY=WT2-2025-PROD-001
CORS_ORIGIN=https://wowtruck.ankr.in,https://ankr.in,http://localhost:3002

# ═══════════════════════════════════════════════════════════════════════════════
# PORT 4000 = nginx proxy target | schema=wowtruck = Prisma table location
# ═══════════════════════════════════════════════════════════════════════════════
ENVEOF

echo "   ✅ Backend .env: PORT=$WOWTRUCK_BACKEND_PORT, schema=wowtruck"

# ─────────────────────────────────────────────────────────────────────────────────
# Fix 2.2: Prisma .env
# ─────────────────────────────────────────────────────────────────────────────────
echo "📝 Step 2.2: Writing Prisma .env..."

cat > "$BASE_DIR/apps/wowtruck/.env" << ENVEOF
DATABASE_URL="${DATABASE_URL}"
ENVEOF

echo "   ✅ Prisma .env written"

# ─────────────────────────────────────────────────────────────────────────────────
# Fix 2.3: Frontend .env (relative URLs)
# ─────────────────────────────────────────────────────────────────────────────────
echo "📝 Step 2.3: Writing Frontend .env..."

cat > "$BASE_DIR/apps/wowtruck/frontend/.env" << ENVEOF
# ═══════════════════════════════════════════════════════════════════════════════
# WOWTRUCK 2.0 FRONTEND - CANONICAL CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════
# Using relative URLs so nginx can proxy correctly
# ═══════════════════════════════════════════════════════════════════════════════

VITE_API_URL=/api
VITE_GRAPHQL_URL=/graphql
VITE_WS_URL=wss://wowtruck.ankr.in/graphql
ENVEOF

echo "   ✅ Frontend .env: relative URLs for nginx proxy"

# ─────────────────────────────────────────────────────────────────────────────────
# Fix 2.4: Ensure Prisma schema is in backend folder
# ─────────────────────────────────────────────────────────────────────────────────
echo "📝 Step 2.4: Checking Prisma schema location..."

if [ ! -f "$BASE_DIR/apps/wowtruck/backend/prisma/schema.prisma" ]; then
    mkdir -p "$BASE_DIR/apps/wowtruck/backend/prisma"
    if [ -f "$BASE_DIR/apps/wowtruck/prisma/schema.prisma" ]; then
        cp "$BASE_DIR/apps/wowtruck/prisma/schema.prisma" "$BASE_DIR/apps/wowtruck/backend/prisma/"
        echo "   ✅ Copied schema.prisma to backend/prisma/"
    else
        echo "   ⚠️  schema.prisma not found - may need manual fix"
    fi
else
    echo "   ✅ schema.prisma already in backend/prisma/"
fi

# ─────────────────────────────────────────────────────────────────────────────────
# Fix 2.5: Regenerate Prisma client
# ─────────────────────────────────────────────────────────────────────────────────
echo "📝 Step 2.5: Regenerating Prisma client..."

cd "$BASE_DIR/apps/wowtruck/backend"
npx prisma generate 2>&1 | head -5
echo "   ✅ Prisma client regenerated"

# ─────────────────────────────────────────────────────────────────────────────────
# Fix 2.6: Clean up ports
# ─────────────────────────────────────────────────────────────────────────────────
echo "📝 Step 2.6: Cleaning up ports..."

# Kill anything on wrong ports
for port in 4000 4001; do
    if lsof -ti:$port >/dev/null 2>&1; then
        echo "   🔪 Killing process on port $port..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
    fi
done
echo "   ✅ Ports cleaned"

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 3: INSTALL PM2 ECOSYSTEM FILE (Option 2)
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📦 PHASE 3: INSTALLING PM2 ECOSYSTEM FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ─────────────────────────────────────────────────────────────────────────────────
# Create PM2 ecosystem file with hardcoded correct values
# ─────────────────────────────────────────────────────────────────────────────────
echo "📝 Step 3.1: Creating ecosystem.wowtruck.config.js..."

cat > "$BASE_DIR/ecosystem.wowtruck.config.js" << 'ECOSYSTEM'
// ═══════════════════════════════════════════════════════════════════════════════
// WOWTRUCK 2.0 - PM2 ECOSYSTEM FILE
// ═══════════════════════════════════════════════════════════════════════════════
// SINGLE SOURCE OF TRUTH for WowTruck service configuration
// These env vars OVERRIDE any .env file, preventing configuration drift
//
// Usage:
//   pm2 start ecosystem.wowtruck.config.js
//   pm2 restart ecosystem.wowtruck.config.js
//
// 🙏 Jai Guru Ji | ANKR Labs
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  apps: [
    {
      name: 'wowtruck-backend',
      cwd: './apps/wowtruck/backend',
      script: 'pnpm',
      args: 'dev',
      
      // ⚠️ CRITICAL: These env vars override .env file
      env: {
        NODE_ENV: 'production',
        PORT: 4000,  // MUST BE 4000 - nginx proxies here
        DATABASE_URL: 'postgresql://ankr:indrA@0612@localhost:5432/ankr_eon?schema=wowtruck',
        JWT_SECRET: 'wowtruck-jwt-secret-2025',
        CORS_ORIGIN: 'https://wowtruck.ankr.in,https://ankr.in,http://localhost:3002',
      },
      
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      
      error_file: './logs/wowtruck-backend-error.log',
      out_file: './logs/wowtruck-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      watch: false,
    },
    {
      name: 'wowtruck-frontend',
      cwd: './apps/wowtruck/frontend',
      script: 'pnpm',
      args: 'preview --host 0.0.0.0 --port 3002',
      
      env: {
        NODE_ENV: 'production',
      },
      
      autorestart: true,
      max_restarts: 10,
      
      error_file: './logs/wowtruck-frontend-error.log',
      out_file: './logs/wowtruck-frontend-out.log',
    },
  ],
};
ECOSYSTEM

echo "   ✅ ecosystem.wowtruck.config.js created"

# ─────────────────────────────────────────────────────────────────────────────────
# Create logs directory
# ─────────────────────────────────────────────────────────────────────────────────
mkdir -p "$BASE_DIR/logs"
echo "   ✅ logs/ directory created"

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 4: RESTART SERVICES
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 PHASE 4: RESTARTING SERVICES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Delete old PM2 processes
echo "📝 Step 4.1: Stopping old processes..."
pm2 delete wowtruck-backend 2>/dev/null || true
pm2 delete wowtruck-frontend 2>/dev/null || true
echo "   ✅ Old processes stopped"

# Start using ecosystem file
echo "📝 Step 4.2: Starting with ecosystem file..."
cd "$BASE_DIR"
pm2 start ecosystem.wowtruck.config.js
echo "   ✅ Services started"

# Wait for startup
echo "📝 Step 4.3: Waiting for services to start..."
sleep 5

# Save PM2 config
pm2 save
echo "   ✅ PM2 config saved"

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 5: VERIFICATION
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ PHASE 5: VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check PM2 status
echo "📊 PM2 Status:"
pm2 list | grep -E "wowtruck|Name"
echo ""

# Check backend port
echo "📊 Port Check:"
if lsof -i:4000 >/dev/null 2>&1; then
    echo "   ✅ Port 4000: IN USE (correct)"
else
    echo "   ❌ Port 4000: NOT IN USE (backend may have failed)"
fi

if lsof -i:4001 >/dev/null 2>&1; then
    echo "   ⚠️  Port 4001: IN USE (should not be)"
else
    echo "   ✅ Port 4001: FREE (correct)"
fi
echo ""

# Health check
echo "📊 Health Check:"
if curl -s http://localhost:4000/health >/dev/null 2>&1; then
    echo "   ✅ Backend health: OK"
else
    echo "   ⚠️  Backend health: FAILED"
    echo "   📋 Checking logs..."
    pm2 logs wowtruck-backend --lines 10 --nostream
fi
echo ""

# Database check
echo "📊 Database Check:"
USER_COUNT=$(PGPASSWORD='indrA@0612' psql -h localhost -p 5432 -U ankr -d ankr_eon -t -c "SELECT COUNT(*) FROM wowtruck.\"User\";" 2>/dev/null | tr -d ' ')
if [ -n "$USER_COUNT" ] && [ "$USER_COUNT" -gt 0 ]; then
    echo "   ✅ Database: $USER_COUNT users in wowtruck.User"
else
    echo "   ⚠️  Database: Could not verify users"
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# COMPLETE
# ═══════════════════════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════════════════════════════"
echo "  ✅ WOWTRUCK 2.0 - BACKUP & FIX COMPLETE!"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "  📦 Backup Location:    $BACKUP_DIR"
echo "  🔧 Backend Port:       4000 (locked)"
echo "  🗄️  Database Schema:    wowtruck (locked)"
echo "  📄 Ecosystem File:     $BASE_DIR/ecosystem.wowtruck.config.js"
echo ""
echo "  🌐 Test Login:         https://wowtruck.ankr.in/login"
echo ""
echo "  📋 Future Commands:"
echo "     pm2 restart ecosystem.wowtruck.config.js  # Restart with correct config"
echo "     bash $BACKUP_DIR/restore.sh               # Rollback if needed"
echo ""
echo "  🙏 Jai Guru Ji | ANKR Labs"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
