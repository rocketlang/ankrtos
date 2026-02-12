#!/bin/bash
# Monitor both pipelines and report when complete

EXTRACTION_OUTPUT="/tmp/claude-0/-root/tasks/be2d2a8.output"
SOLVER_OUTPUT="/tmp/claude-0/-root/tasks/b0f5379.output"
STATUS_FILE="/tmp/ncert-pipeline-status.txt"

echo "🔍 Monitoring NCERT extraction and solver pipelines..."
echo "Started: $(date)"
echo ""

while true; do
    # Check if extraction completed (look for final summary)
    EXTRACTION_DONE=$(grep -c "Extraction Summary" "$EXTRACTION_OUTPUT" 2>/dev/null || echo "0")

    # Check if solver completed (look for final summary)
    SOLVER_DONE=$(grep -c "Summary" "$SOLVER_OUTPUT" 2>/dev/null || echo "0")

    # Get current stats
    CHAPTERS=$(grep -c "✅ Extracted" "$EXTRACTION_OUTPUT" 2>/dev/null || echo "0")
    SOLVED=$(grep -c "✅ Solved" "$SOLVER_OUTPUT" 2>/dev/null || echo "0")

    # Update status file
    echo "Last checked: $(date)" > "$STATUS_FILE"
    echo "Extraction: $CHAPTERS chapters | Solver: $SOLVED/198" >> "$STATUS_FILE"
    echo "Extraction complete: $([ $EXTRACTION_DONE -gt 0 ] && echo 'YES ✅' || echo 'NO ⏳')" >> "$STATUS_FILE"
    echo "Solver complete: $([ $SOLVER_DONE -gt 0 ] && echo 'YES ✅' || echo 'NO ⏳')" >> "$STATUS_FILE"

    # Check if both are done
    if [ $EXTRACTION_DONE -gt 0 ] && [ $SOLVER_DONE -gt 0 ]; then
        echo ""
        echo "════════════════════════════════════════════════════════════"
        echo "  🎉 BOTH PIPELINES COMPLETED! 🎉"
        echo "════════════════════════════════════════════════════════════"
        echo ""
        echo "Completed at: $(date)"
        echo ""
        echo "📄 EXTRACTION RESULTS:"
        tail -20 "$EXTRACTION_OUTPUT" | grep -E "(Total|Extracted|Skipped|Failed)"
        echo ""
        echo "🤖 SOLVER RESULTS:"
        tail -20 "$SOLVER_OUTPUT" | grep -E "(Total|Solved|Failed)"
        echo ""
        echo "💾 DATABASE STATS:"
        PGPASSWORD='indrA@0612' psql -U ankr -h localhost -d ankr_eon -t -c "SELECT COUNT(*) FROM ankr_learning.chapter_exercises;" | xargs echo "Total exercises:"
        PGPASSWORD='indrA@0612' psql -U ankr -h localhost -d ankr_eon -t -c "SELECT COUNT(*) FROM ankr_learning.chapter_exercises WHERE solution IS NOT NULL AND solution <> '';" | xargs echo "With solutions:"
        echo ""
        echo "✅ All done! ANKR LMS is ready for testing."
        echo "════════════════════════════════════════════════════════════"

        exit 0
    fi

    # Sleep for 2 minutes before checking again
    sleep 120
done
