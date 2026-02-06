#!/bin/bash
##############################################################################
# OpenSeaMap Coverage Check - Progress Monitor
##############################################################################

LOG_FILE="/tmp/openseamap-1000-check.log"

echo "════════════════════════════════════════════════════════════════════════"
echo "  🗺️  OPENSEAMAP COVERAGE CHECK - PROGRESS"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

# Check if process is running
PID=$(pgrep -f "check-openseamap-coverage.ts" | head -1)
if [ -z "$PID" ]; then
    echo "⚠️  Coverage check process not found"
    echo ""
    echo "Check if it completed:"
    tail -30 "$LOG_FILE"
    exit 0
fi

echo "✅ Process running (PID: $PID)"
echo ""

# Get current progress from log
CURRENT_PORT=$(tail -1 "$LOG_FILE" | grep -oP "Checking \K\d+(?=/1000)" || echo "0")
echo "📊 Progress: $CURRENT_PORT / 1000 ports checked"

# Calculate percentage
if [ "$CURRENT_PORT" -gt 0 ]; then
    PERCENT=$((CURRENT_PORT * 100 / 1000))
    echo "📈 Completion: $PERCENT%"
fi

# Estimate time remaining
if [ "$CURRENT_PORT" -gt 0 ]; then
    REMAINING=$((1000 - CURRENT_PORT))
    MINUTES_REMAINING=$((REMAINING / 4))  # 4 ports per minute
    HOURS=$((MINUTES_REMAINING / 60))
    MINS=$((MINUTES_REMAINING % 60))
    echo "⏱️  Estimated time remaining: ${HOURS}h ${MINS}m"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Recent activity:"
tail -10 "$LOG_FILE" | grep "🔍\|⏸️\|✅\|❌"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Commands:"
echo "   • Watch progress: watch -n 10 /root/check-osm-progress.sh"
echo "   • View full log: tail -f /tmp/openseamap-1000-check.log"
echo "   • Check database: npx tsx -e 'import {PrismaClient} from \"@prisma/client\"; const p = new PrismaClient(); p.\$queryRaw\`SELECT COUNT(*) as checked FROM ports WHERE \"openSeaMapCheckedAt\" IS NOT NULL\`.then(console.log)'"
echo ""
