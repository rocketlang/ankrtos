#!/bin/bash
# Add AIS position updates to existing cron jobs

echo "🔧 Adding AIS position updates to cron..."

# Get the absolute path to the backend directory
BACKEND_DIR="/root/apps/ankr-maritime/backend"

# Create temporary crontab file
TEMP_CRON=$(mktemp)

# Get existing crontab
crontab -l > "$TEMP_CRON"

# Remove old AIS entry (if exists)
sed -i '/mari8x-ais-positions/d' "$TEMP_CRON"

# Add AIS position update (every 30 minutes)
cat >> "$TEMP_CRON" << EOF

# AIS Position Updates - Every 30 minutes
*/30 * * * * cd $BACKEND_DIR && npx tsx scripts/cron-ais-positions.ts >> /root/logs/mari8x/ais-positions.log 2>&1 # mari8x-ais-positions

EOF

# Install the new crontab
crontab "$TEMP_CRON"
rm "$TEMP_CRON"

echo "✅ AIS position updates added to cron!"
echo ""
echo "📋 All Mari8X cron jobs:"
crontab -l | grep mari8x
echo ""
echo "📁 Log file: /root/logs/mari8x/ais-positions.log"
echo ""
echo "⏰ Schedule: Every 30 minutes"
echo "📊 Updates: Up to 100 vessels per run"
echo "🧹 Cleanup: Keeps recent data + daily snapshots"
echo ""
echo "✨ Done!"
