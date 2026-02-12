#!/bin/bash
# Monitor solver and notify on completion

SOLVER_OUTPUT="/tmp/claude-0/-root/tasks/b09d6e8.output"

echo "🔍 Monitoring NCERT solver (1,475 exercises)..."
echo "Started: $(date)"
echo ""

while true; do
    # Check if solver completed
    if grep -q "Summary" "$SOLVER_OUTPUT" 2>/dev/null; then
        echo ""
        echo "════════════════════════════════════════════════════════════"
        echo "  🎉 SOLVER COMPLETED! 🎉"
        echo "════════════════════════════════════════════════════════════"
        echo ""
        echo "Completed at: $(date)"
        echo ""
        tail -30 "$SOLVER_OUTPUT" | grep -E "(Total|Solved|Failed|Summary)" -A 10
        echo ""
        echo "💾 FINAL DATABASE STATS:"
        PGPASSWORD='indrA@0612' psql -U ankr -h localhost -d ankr_eon -t -c "
          SELECT 'Total: ' || COUNT(*) || ' | With solutions: ' ||
          COUNT(CASE WHEN solution IS NOT NULL AND solution <> '' THEN 1 END) ||
          ' (' || ROUND(100.0 * COUNT(CASE WHEN solution IS NOT NULL AND solution <> '' THEN 1 END) / COUNT(*), 1) || '%)'
          FROM ankr_learning.chapter_exercises;
        "
        echo ""
        echo "✅ All exercises now have AI-generated solutions!"
        echo "════════════════════════════════════════════════════════════"
        exit 0
    fi

    # Check if still running
    if ! ps aux | grep "solve-exercises.js" | grep -v grep > /dev/null; then
        echo "⚠️  Solver stopped - checking if completed..."
        sleep 5
        continue
    fi

    # Progress update every 5 minutes
    SOLVED=$(grep -c "✅ Solved" "$SOLVER_OUTPUT" 2>/dev/null || echo "0")
    echo "[$(date '+%H:%M')] Progress: $SOLVED/1475 solved"

    sleep 300  # 5 minutes
done
