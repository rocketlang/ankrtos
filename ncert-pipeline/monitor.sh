#!/bin/bash
# Monitor bulk processing progress

echo "NCERT Bulk Processing Monitor"
echo "=============================="
echo ""

# Check if process is running
if pgrep -f "bulk-process.sh" > /dev/null; then
    echo "✓ Bulk processor is RUNNING"
else
    echo "⊘ Bulk processor is NOT running"
fi

echo ""
echo "Progress:"
echo "--------"

# Count extracted JSONs
EXTRACTED=$(find /root/ncert-pipeline/extracted -name '*.json' | wc -l)
echo "Extracted: $EXTRACTED files"

# Count database entries
DB_COUNT=$(PGPASSWORD='indrA@0612' psql -h localhost -U ankr -d ankr_eon -t -c "SELECT COUNT(*) FROM ankr_learning.chapter_content;" 2>/dev/null | tr -d ' ')
DB_CHAPTERS=$(PGPASSWORD='indrA@0612' psql -h localhost -U ankr -d ankr_eon -t -c "SELECT COUNT(*) FROM ankr_learning.modules;" 2>/dev/null | tr -d ' ')

echo "Database content entries: $DB_COUNT"
echo "Database chapters: $DB_CHAPTERS"

echo ""
echo "Recent log (last 10 lines):"
echo "----------------------------"
tail -10 /root/ncert-pipeline/bulk-process.log 2>/dev/null || echo "No log file yet"

echo ""
echo "Latest output:"
echo "-------------"
tail -5 /tmp/bulk-process.out 2>/dev/null || echo "No output yet"

echo ""
