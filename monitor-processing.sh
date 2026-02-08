#!/bin/bash
# Monitor book processing progress

echo "📊 PROCESSING MONITOR"
echo "===================="
echo ""

# Check if process is running
if ps -p 813734 > /dev/null 2>&1; then
    echo "✅ Process is running (PID: 813734)"
else
    echo "⚠️  Process has stopped"
fi

echo ""
echo "📈 Progress:"
echo ""

# Show last 30 lines of log
tail -30 /tmp/processing-all-29-books.log

echo ""
echo "---"
echo ""
echo "💡 Commands:"
echo "  • Watch live: tail -f /tmp/processing-all-29-books.log"
echo "  • Check database: psql postgresql://ankr:indrA@0612@localhost:5432/ankr_eon -c 'SELECT COUNT(*) FROM ankr_learning.\"Course\";'"
echo "  • Kill process: kill 813734"
echo ""
