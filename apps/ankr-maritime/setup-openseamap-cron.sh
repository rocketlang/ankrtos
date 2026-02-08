#!/bin/bash
###############################################################################
# OpenSeaMap Coverage Check - Automated Setup
#
# This script sets up automated OpenSeaMap coverage checks via cron
# Runs every 3 hours, checking 500 ports per run (resumable)
###############################################################################

set -e

SCRIPT_DIR="/root/apps/ankr-maritime/backend"
LOG_DIR="/root/apps/ankr-maritime/logs/openseamap"
CRON_SCRIPT="$SCRIPT_DIR/src/scripts/check-openseamap-coverage.ts"

echo "🔧 Setting up OpenSeaMap Automated Coverage Checks..."
echo "═══════════════════════════════════════════════════════════"
echo ""

# Create log directory
mkdir -p "$LOG_DIR"
echo "✅ Created log directory: $LOG_DIR"

# Create wrapper script for cron
cat > "$SCRIPT_DIR/run-openseamap-check.sh" <<'WRAPPER_EOF'
#!/bin/bash
# OpenSeaMap Coverage Check - Cron Wrapper

cd /root/apps/ankr-maritime/backend

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Run the coverage check
LOG_FILE="/root/apps/ankr-maritime/logs/openseamap/check-$(date +%Y%m%d-%H%M%S).log"
npx tsx src/scripts/check-openseamap-coverage.ts >> "$LOG_FILE" 2>&1

# Keep only last 30 log files (rotate)
cd /root/apps/ankr-maritime/logs/openseamap
ls -t check-*.log 2>/dev/null | tail -n +31 | xargs -r rm --

echo "✅ Check completed at $(date)" >> "$LOG_FILE"

# Send completion notification (optional)
echo "OpenSeaMap coverage check completed" | logger -t openseamap
WRAPPER_EOF

chmod +x "$SCRIPT_DIR/run-openseamap-check.sh"
echo "✅ Created cron wrapper script"

# Add cron job (every 3 hours)
CRON_JOB="0 */3 * * * $SCRIPT_DIR/run-openseamap-check.sh"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "run-openseamap-check.sh"; then
  echo "⚠️  Cron job already exists. Removing old one..."
  crontab -l 2>/dev/null | grep -v "run-openseamap-check.sh" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
echo "✅ Added cron job: Every 3 hours"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ SETUP COMPLETE"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📅 Schedule: Every 3 hours (at :00 minutes)"
echo "   • 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00"
echo ""
echo "📊 Current Status:"
echo "   • Total ports: 12,714"
echo "   • Already checked: 2,662 (21%)"
echo "   • Unchecked remaining: 10,052 (79%)"
echo "   • Batch size: 500 ports per run"
echo "   • Time per batch: ~125 minutes (~2 hours)"
echo ""
echo "⏱️  Completion Timeline:"
echo "   • Total runs needed: ~20 batches"
echo "   • Total time: ~40 hours of processing"
echo "   • Spread over: ~2.5 days (with 3-hour intervals)"
echo "   • Expected completion: 3 days from now"
echo ""
echo "📁 Logs & Reports:"
echo "   • Logs: $LOG_DIR/check-*.log"
echo "   • Report: /root/apps/ankr-maritime/backend/OPENSEAMAP-COVERAGE-REPORT.json"
echo "   • Syslog: grep 'openseamap' /var/log/syslog"
echo ""
echo "🛠️  Useful Commands:"
echo "   • View cron jobs:    crontab -l"
echo "   • Manual run:        $SCRIPT_DIR/run-openseamap-check.sh"
echo "   • View latest log:   tail -f $LOG_DIR/check-*.log | tail -1"
echo "   • Check progress:    tail -100 \$(ls -t $LOG_DIR/check-*.log | head -1)"
echo "   • Remove cron:       crontab -e (delete the line)"
echo ""
echo "📈 Expected Coverage:"
echo "   • Currently: 43.6% of checked ports have OpenSeaMap data"
echo "   • This is GOOD coverage! Almost half have detailed maritime features"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🚀 The system will now automatically crawl all remaining ports!"
echo "═══════════════════════════════════════════════════════════"
