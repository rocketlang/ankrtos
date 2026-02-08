#!/bin/bash
###############################################################################
# Mari8XOSRM - Daily Route Extraction Setup
#
# This script sets up automatic daily route extraction using cron
###############################################################################

set -e

echo "🚀 Mari8XOSRM - Daily Extraction Setup"
echo "═══════════════════════════════════════════════════════════════════"
echo

# Get the absolute path to the backend directory
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/backend" && pwd)"
SCRIPT_PATH="$BACKEND_DIR/src/scripts/daily-route-extraction.ts"

echo "Backend directory: $BACKEND_DIR"
echo "Script path: $SCRIPT_PATH"
echo

# Check if script exists
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ Error: Script not found at $SCRIPT_PATH"
    exit 1
fi

echo "✓ Script found"
echo

# Create cron job
CRON_JOB="0 0 * * * cd $BACKEND_DIR && /usr/bin/npx tsx $SCRIPT_PATH >> /var/log/mari8xosrm-daily.log 2>&1"

echo "Cron job to add:"
echo "$CRON_JOB"
echo

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "daily-route-extraction.ts"; then
    echo "⚠️  Cron job already exists!"
    echo
    read -p "Do you want to replace it? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled"
        exit 0
    fi

    # Remove existing cron job
    crontab -l 2>/dev/null | grep -v "daily-route-extraction.ts" | crontab -
    echo "✓ Removed old cron job"
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✓ Cron job added successfully!"
echo

# Create log directory
sudo mkdir -p /var/log
sudo touch /var/log/mari8xosrm-daily.log
sudo chmod 666 /var/log/mari8xosrm-daily.log

echo "✓ Log file created: /var/log/mari8xosrm-daily.log"
echo

# Test run (optional)
echo "═══════════════════════════════════════════════════════════════════"
echo "Testing extraction script..."
echo

read -p "Run test extraction now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd "$BACKEND_DIR"
    npx tsx "$SCRIPT_PATH"
fi

echo
echo "═══════════════════════════════════════════════════════════════════"
echo "✅ Setup Complete!"
echo
echo "📅 Extraction will run daily at midnight (00:00)"
echo "📝 Logs: /var/log/mari8xosrm-daily.log"
echo "📊 Reports: /tmp/mari8xosrm-daily-reports.jsonl"
echo
echo "Useful commands:"
echo "  View cron jobs:    crontab -l"
echo "  View logs:         tail -f /var/log/mari8xosrm-daily.log"
echo "  View reports:      tail -f /tmp/mari8xosrm-daily-reports.jsonl"
echo "  Manual run:        cd $BACKEND_DIR && npx tsx $SCRIPT_PATH"
echo "  Remove cron job:   crontab -e (then delete the line)"
echo
echo "🎯 Expected growth:"
echo "   Day 1: 11 routes → Day 7: ~20 routes → Day 14: ~30 routes"
echo "   Confidence: 10% → 18% → 30% → 40%+"
echo
echo "The system will now automatically get smarter every day! 🧠"
echo "═══════════════════════════════════════════════════════════════════"
