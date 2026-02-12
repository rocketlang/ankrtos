#!/bin/bash
# Monitor extraction pipeline and report when complete

EXTRACTION_OUTPUT="/tmp/claude-0/-root/tasks/b74d8f5.output"
STATUS_FILE="/tmp/extraction-status.txt"

echo "🔍 Monitoring NCERT extraction pipeline..."
echo "Started: $(date)"
echo ""

while true; do
    # Check if extraction completed (look for final summary)
    EXTRACTION_DONE=$(grep -c "Extraction Summary" "$EXTRACTION_OUTPUT" 2>/dev/null || echo "0")

    # Get current batch
    CURRENT_BATCH=$(tail -50 "$EXTRACTION_OUTPUT" 2>/dev/null | grep -oP "Batch \d+/37" | tail -1 || echo "Unknown")

    # Count successful extractions this run
    EXTRACTED=$(grep -c "✅ Extracted" "$EXTRACTION_OUTPUT" 2>/dev/null || echo "0")

    # Update status file
    echo "Last checked: $(date)" > "$STATUS_FILE"
    echo "Current: $CURRENT_BATCH" >> "$STATUS_FILE"
    echo "Extractions in this run: $EXTRACTED" >> "$STATUS_FILE"
    echo "Status: $([ $EXTRACTION_DONE -gt 0 ] && echo 'COMPLETE ✅' || echo 'RUNNING ⏳')" >> "$STATUS_FILE"

    # Check if extraction is done
    if [ $EXTRACTION_DONE -gt 0 ]; then
        echo ""
        echo "════════════════════════════════════════════════════════════"
        echo "  🎉 EXTRACTION PIPELINE COMPLETED! 🎉"
        echo "════════════════════════════════════════════════════════════"
        echo ""
        echo "Completed at: $(date)"
        echo ""
        echo "📊 EXTRACTION RESULTS:"
        tail -30 "$EXTRACTION_OUTPUT" | grep -E "(Total|Extracted|Processed|Failed|Skipped)"
        echo ""
        echo "💾 FINAL DATABASE STATS:"
        PGPASSWORD='indrA@0612' psql -U ankr -h localhost -d ankr_eon -t -c "
          SELECT 'Total exercises: ' || COUNT(*) FROM ankr_learning.chapter_exercises;
        "
        PGPASSWORD='indrA@0612' psql -U ankr -h localhost -d ankr_eon -t -c "
          SELECT 'With solutions: ' || COUNT(*) || ' (' ||
          ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM ankr_learning.chapter_exercises), 1) || '%)'
          FROM ankr_learning.chapter_exercises
          WHERE solution IS NOT NULL AND solution <> '';
        "
        echo ""
        echo "📚 BY CLASS:"
        PGPASSWORD='indrA@0612' psql -U ankr -h localhost -d ankr_eon -t -c "
          SELECT '  Class ' || SUBSTRING(id FROM 'class([0-9]+)') || ': ' || COUNT(*) || ' exercises'
          FROM ankr_learning.chapter_exercises
          WHERE id ~ 'class[0-9]+'
          GROUP BY SUBSTRING(id FROM 'class([0-9]+)')
          ORDER BY SUBSTRING(id FROM 'class([0-9]+)')::int;
        "
        echo ""
        echo "✅ ANKR LMS is ready with complete NCERT content!"
        echo "════════════════════════════════════════════════════════════"

        exit 0
    fi

    # Check if process is still running
    if ! ps aux | grep -E "batch-extract-and-solve.js" | grep -v grep > /dev/null; then
        echo ""
        echo "⚠️  Extraction process not running - checking if completed..."
        # Give it one more check
        sleep 5
        if [ $EXTRACTION_DONE -gt 0 ]; then
            continue
        else
            echo "❌ Process stopped before completion"
            echo "Last status: $CURRENT_BATCH"
            exit 1
        fi
    fi

    # Sleep for 2 minutes before checking again
    sleep 120
done
