#!/bin/bash
# Monitor all parallel processes

clear
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║         ANKR Learning Platform - Live Process Monitor              ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 PROCESS 1: NCERT Processing (Questions + Translation)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
tail -12 /tmp/claude-0/-root/tasks/b977110.output 2>/dev/null || echo "Starting..."
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎓 PROCESS 2: Cambridge Books Download"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
tail -12 /tmp/claude-0/-root/tasks/b5f251d.output 2>/dev/null || echo "Starting..."
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Quick Stats"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# NCERT processing stats
NCERT_PROCESSED=$(grep -c "✅ Success" /tmp/claude-0/-root/tasks/b977110.output 2>/dev/null || echo "0")
NCERT_QUESTIONS=$(grep "Questions:" /tmp/claude-0/-root/tasks/b977110.output 2>/dev/null | tail -1 | awk '{print $2}')
echo "  NCERT Books Processed: $NCERT_PROCESSED/14"
echo "  Questions Generated: ${NCERT_QUESTIONS:-0}"

# Cambridge download stats
CAMBRIDGE_SUCCESS=$(grep -c "✅ Downloaded successfully" /tmp/claude-0/-root/tasks/b5f251d.output 2>/dev/null || echo "0")
CAMBRIDGE_FAILED=$(grep -c "❌ Failed" /tmp/claude-0/-root/tasks/b5f251d.output 2>/dev/null || echo "0")
echo "  Cambridge Resources: $CAMBRIDGE_SUCCESS downloaded, $CAMBRIDGE_FAILED failed"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Commands:"
echo "  Watch NCERT: tail -f /tmp/claude-0/-root/tasks/b977110.output"
echo "  Watch Cambridge: tail -f /tmp/claude-0/-root/tasks/b5f251d.output"
echo "  Refresh: bash /root/monitor-all.sh"
echo ""
