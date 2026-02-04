#!/bin/bash
# Setup cron jobs for Mari8X automated tasks

echo "🔧 Setting up Mari8X cron jobs..."

# Create log directory
mkdir -p /root/logs/mari8x

# Get the absolute path to the backend directory
BACKEND_DIR="/root/apps/ankr-maritime/backend"

# Create temporary crontab file
TEMP_CRON=$(mktemp)

# Get existing crontab (if any)
crontab -l 2>/dev/null > "$TEMP_CRON" || true

# Remove old Mari8X entries (if they exist)
sed -i '/mari8x-port-scraper/d' "$TEMP_CRON"
sed -i '/mari8x-imo-enrichment/d' "$TEMP_CRON"

# Add new cron jobs
cat >> "$TEMP_CRON" << EOF

# Mari8X Automated Tasks
# Port Tariff Scraper - Daily at 2 AM (10 ports/day = 800 ports in 80 days)
0 2 * * * cd $BACKEND_DIR && npx tsx scripts/cron-port-scraper.ts >> /root/logs/mari8x/port-scraper.log 2>&1 # mari8x-port-scraper

# IMO GISIS Enrichment - Daily at 3 AM (20 vessels/day)
0 3 * * * cd $BACKEND_DIR && npx tsx scripts/cron-imo-enrichment.ts >> /root/logs/mari8x/imo-enrichment.log 2>&1 # mari8x-imo-enrichment

EOF

# Install the new crontab
crontab "$TEMP_CRON"
rm "$TEMP_CRON"

echo "✅ Cron jobs installed successfully!"
echo ""
echo "📋 Installed cron jobs:"
echo "   1. Port Scraper:     Daily at 2:00 AM (10 ports/day)"
echo "   2. IMO Enrichment:   Daily at 3:00 AM (20 vessels/day)"
echo ""
echo "📁 Log files:"
echo "   Port Scraper:     /root/logs/mari8x/port-scraper.log"
echo "   IMO Enrichment:   /root/logs/mari8x/imo-enrichment.log"
echo ""
echo "⏰ Timeline:"
echo "   800 ports ÷ 10/day = 80 days to complete"
echo "   Respectful delays: 30s between ports, 5s between vessels"
echo ""
echo "🔍 To view cron jobs:"
echo "   crontab -l"
echo ""
echo "📊 To test manually:"
echo "   cd $BACKEND_DIR"
echo "   npx tsx scripts/cron-port-scraper.ts"
echo "   npx tsx scripts/cron-imo-enrichment.ts"
echo ""
echo "✨ Done!"
