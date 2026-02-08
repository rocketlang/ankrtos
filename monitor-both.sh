#!/bin/bash
# Monitor both parallel processes

clear
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║         ANKR Learning Platform - Dual Process Monitor              ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 PROCESS 1: Processing NCERT Set (Question Generation + Translation)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
tail -15 /tmp/claude-0/-root/tasks/b977110.output 2>/dev/null || echo "Starting..."
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📥 PROCESS 2: Downloading All NCERT Books (Classes 1-12)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
tail -15 /tmp/claude-0/-root/tasks/bd7081a.output 2>/dev/null || echo "Starting..."
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Quick Stats"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Count successful books in processing
PROCESSED=$(grep -c "✅ Success" /tmp/claude-0/-root/tasks/b977110.output 2>/dev/null || echo "0")
echo "  Books Processed (with questions): $PROCESSED/14"

# Count downloaded books
DOWNLOADED=$(grep -c "✅ Downloaded successfully" /tmp/claude-0/-root/tasks/bd7081a.output 2>/dev/null || echo "0")
echo "  Books Downloaded: $DOWNLOADED/100+"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Commands:"
echo "  Watch Process 1: tail -f /tmp/claude-0/-root/tasks/b977110.output"
echo "  Watch Process 2: tail -f /tmp/claude-0/-root/tasks/bd7081a.output"
echo "  Refresh This: bash /root/monitor-both.sh"
echo ""
