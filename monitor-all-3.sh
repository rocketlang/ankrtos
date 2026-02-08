#!/bin/bash
# Monitor all 3 parallel scrapers/processors

clear
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║      ANKR Learning Platform - Triple Scraper Monitor               ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 PROCESS 1: NCERT Processing (Classes 6-12) + Questions + Translation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
tail -10 /tmp/claude-0/-root/tasks/b24d5aa.output 2>/dev/null || echo "Starting..."
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📥 PROCESS 2: NCERT Download (Classes 1-5)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
tail -10 /tmp/claude-0/-root/tasks/be5baf8.output 2>/dev/null || echo "Starting..."
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎓 PROCESS 3: Cambridge Processing (15 books) - FIXED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
tail -10 /tmp/claude-0/-root/tasks/bafba85.output 2>/dev/null || echo "Starting..."
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Live Stats"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Process 1: NCERT Processing
P1_DONE=$(grep -c "✅ Success" /tmp/claude-0/-root/tasks/b24d5aa.output 2>/dev/null | head -1)
P1_DONE=${P1_DONE:-0}
P1_QUESTIONS=$(grep "^ *Questions: [0-9]" /tmp/claude-0/-root/tasks/b24d5aa.output 2>/dev/null | tail -1 | awk '{print $2}' 2>/dev/null)
P1_QUESTIONS=${P1_QUESTIONS:-0}
echo "  📚 NCERT Processed: $P1_DONE/14 books | Questions: ${P1_QUESTIONS}"

# Process 2: NCERT Download
P2_DONE=$(grep -c "✅ Downloaded successfully" /tmp/claude-0/-root/tasks/be5baf8.output 2>/dev/null | head -1)
P2_DONE=${P2_DONE:-0}
echo "  📥 NCERT Downloaded: $P2_DONE/13 books (Classes 1-5)"

# Process 3: Cambridge
P3_DONE=$(grep -c "✅ Success" /tmp/claude-0/-root/tasks/bafba85.output 2>/dev/null | head -1)
P3_DONE=${P3_DONE:-0}
P3_QUESTIONS=$(grep "^ *Questions: [0-9]" /tmp/claude-0/-root/tasks/bafba85.output 2>/dev/null | tail -1 | awk '{print $2}' 2>/dev/null)
P3_QUESTIONS=${P3_QUESTIONS:-0}
echo "  🎓 Cambridge Processed: $P3_DONE/15 books | Questions: ${P3_QUESTIONS}"

# Total stats - ensure they're numbers
[[ "$P1_QUESTIONS" =~ ^[0-9]+$ ]] || P1_QUESTIONS=0
[[ "$P3_QUESTIONS" =~ ^[0-9]+$ ]] || P3_QUESTIONS=0
TOTAL_BOOKS=$((P1_DONE + P2_DONE + P3_DONE))
TOTAL_QUESTIONS=$((P1_QUESTIONS + P3_QUESTIONS))
echo ""
echo "  🎯 TOTAL: $TOTAL_BOOKS books | $TOTAL_QUESTIONS questions"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Commands:"
echo "  Watch NCERT Processing: tail -f /tmp/claude-0/-root/tasks/b24d5aa.output"
echo "  Watch NCERT Download:   tail -f /tmp/claude-0/-root/tasks/be5baf8.output"
echo "  Watch Cambridge:        tail -f /tmp/claude-0/-root/tasks/bafba85.output"
echo "  Refresh:                bash /root/monitor-all-3.sh"
echo ""
