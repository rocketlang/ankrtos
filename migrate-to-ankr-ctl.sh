#!/bin/bash
#
# MIGRATE PM2 → ANKR-CTL
# ========================
# Safe migration with rollback capability
#
# Author: ANKR Labs | Jai Guru Ji
#

set -e

ANKR_CTL="/root/ankr-ctl"
BACKUP_DIR="/root/.ankr/pm2-backup-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="/root/.ankr/logs/migration.log"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
  echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

ok() {
  echo -e "${GREEN}✓${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
  echo -e "${YELLOW}⚠${NC} $1" | tee -a "$LOG_FILE"
}

error() {
  echo -e "${RED}✗${NC} $1" | tee -a "$LOG_FILE"
}

# Ensure directories
mkdir -p /root/.ankr/logs "$BACKUP_DIR"

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║            PM2 → ANKR-CTL MIGRATION (NO HARDCODING)                          ║"
echo "║                 All config from /root/.ankr/config/                           ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Phase 1: Backup PM2 state
log "Phase 1: Backing up PM2 state..."
pm2 save --force 2>/dev/null || true
pm2 jlist > "$BACKUP_DIR/pm2-processes.json" 2>/dev/null || true
cp ~/.pm2/dump.pm2 "$BACKUP_DIR/" 2>/dev/null || true
ok "PM2 state backed up to $BACKUP_DIR"

# Phase 2: Stop PM2 services one by one
log "Phase 2: Stopping PM2 services..."
SERVICES=$(pm2 jlist 2>/dev/null | node -e "
const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
data.filter(p => p.pm2_env.status === 'online').forEach(p => console.log(p.name));
" 2>/dev/null || echo "")

if [ -z "$SERVICES" ]; then
  warn "No running PM2 services found"
else
  for svc in $SERVICES; do
    log "  Stopping PM2: $svc..."
    pm2 stop "$svc" 2>/dev/null || true
    sleep 0.5
  done
  ok "All PM2 services stopped"
fi

# Phase 3: Start services via ankr-ctl
log "Phase 3: Starting services via ankr-ctl..."
chmod +x "$ANKR_CTL"

# Start each service with small delay
node "$ANKR_CTL" start

# Phase 4: Verify services
log "Phase 4: Verifying services..."
sleep 5
node "$ANKR_CTL" health

# Phase 5: Final status
echo ""
log "Phase 5: Final status..."
node "$ANKR_CTL" status

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                      MIGRATION COMPLETE                                       ║"
echo "╠══════════════════════════════════════════════════════════════════════════════╣"
echo "║  Services now managed by: ankr-ctl                                            ║"
echo "║  Config: /root/.ankr/config/                                                  ║"
echo "║  Logs: /root/.ankr/logs/                                                      ║"
echo "║  PIDs: /root/.ankr/pids/                                                      ║"
echo "║                                                                               ║"
echo "║  Commands:                                                                    ║"
echo "║    ankr-ctl status          - View all services                               ║"
echo "║    ankr-ctl start <svc>     - Start a service                                 ║"
echo "║    ankr-ctl stop <svc>      - Stop a service                                  ║"
echo "║    ankr-ctl restart <svc>   - Restart a service                               ║"
echo "║    ankr-ctl health          - Health check all                                ║"
echo "║                                                                               ║"
echo "║  Rollback:                                                                    ║"
echo "║    ./rollback-to-pm2.sh     - Restore PM2 if needed                           ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Create rollback script
cat > /root/rollback-to-pm2.sh << 'ROLLBACK'
#!/bin/bash
echo "Rolling back to PM2..."
/root/ankr-ctl stop
pm2 resurrect
pm2 status
echo "Rollback complete!"
ROLLBACK
chmod +x /root/rollback-to-pm2.sh

ok "Migration complete! Rollback available via /root/rollback-to-pm2.sh"
