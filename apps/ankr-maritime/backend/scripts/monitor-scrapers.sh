#!/bin/bash
# Monitor all scraper processes

echo "📊 Mari8X Scraper Status Monitor"
echo "=================================="
echo ""

# Check if processes are running
check_process() {
    local name=$1
    local pattern=$2
    if pgrep -f "$pattern" > /dev/null; then
        echo "✅ $name: RUNNING"
    else
        echo "❌ $name: STOPPED"
    fi
}

check_process "Port Scraper" "cron-port-scraper.ts"
check_process "IMO Enrichment" "cron-imo-enrichment.ts"
check_process "AIS Positions" "cron-ais-positions.ts"

echo ""
echo "📁 Log Files (last 10 lines):"
echo "=================================="

if [ -f /root/logs/mari8x/test-port-scraper.log ]; then
    echo ""
    echo "🚢 Port Scraper:"
    tail -10 /root/logs/mari8x/test-port-scraper.log
fi

if [ -f /root/logs/mari8x/test-imo-enrichment.log ]; then
    echo ""
    echo "🏢 IMO Enrichment:"
    tail -10 /root/logs/mari8x/test-imo-enrichment.log
fi

if [ -f /root/logs/mari8x/test-ais-positions.log ]; then
    echo ""
    echo "📡 AIS Positions:"
    tail -10 /root/logs/mari8x/test-ais-positions.log
fi

echo ""
echo "=================================="
echo "To view full logs:"
echo "  tail -f /root/logs/mari8x/test-port-scraper.log"
echo "  tail -f /root/logs/mari8x/test-imo-enrichment.log"
echo "  tail -f /root/logs/mari8x/test-ais-positions.log"
