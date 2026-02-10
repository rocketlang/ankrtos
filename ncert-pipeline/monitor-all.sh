#!/bin/bash

# Comprehensive Monitor - Solver + Seeder

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  NCERT EXERCISE SYSTEM - LIVE DASHBOARD"
echo "  Solver (Solving existing) + Seeder (Generating new)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
date
echo ""

echo "🤖 RUNNING PROCESSES:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check solver
if pgrep -f "exercise-solver-v2.js" > /dev/null; then
    SOLVER_PID=$(pgrep -f "exercise-solver-v2.js")
    echo "✅ Exercise Solver: RUNNING (PID: $SOLVER_PID)"
else
    echo "⊘ Exercise Solver: NOT RUNNING"
fi

# Check seeders
SEEDER_COUNT=$(pgrep -f "exercise-seeder.js" | wc -l)
if [ $SEEDER_COUNT -gt 0 ]; then
    echo "✅ Exercise Seeders: $SEEDER_COUNT RUNNING"
    pgrep -f "exercise-seeder.js" | while read pid; do
        echo "   - Seeder PID: $pid"
    done
else
    echo "⊘ Exercise Seeders: NOT RUNNING"
fi

echo ""
echo "📊 OVERALL EXERCISE STATISTICS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PGPASSWORD='indrA@0612' psql -h localhost -U ankr -d ankr_eon -t -c "
SELECT
  '   Total Exercises: ' || COUNT(*) || CHR(10) ||
  '   With Solutions: ' || COUNT(CASE WHEN solution IS NOT NULL AND solution != '' THEN 1 END) || CHR(10) ||
  '   Without Solutions: ' || COUNT(CASE WHEN solution IS NULL OR solution = '' THEN 1 END) || CHR(10) ||
  '   Coverage: ' || ROUND(100.0 * COUNT(CASE WHEN solution IS NOT NULL AND solution != '' THEN 1 END) / COUNT(*), 1) || '%'
FROM ankr_learning.chapter_exercises;
" 2>/dev/null

echo ""
echo "🔄 SOLVER PROGRESS (Existing Exercises):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PGPASSWORD='indrA@0612' psql -h localhost -U ankr -d ankr_eon -t -c "
SELECT
  '   ✅ Completed: ' || COUNT(CASE WHEN status = 'completed' THEN 1 END) || CHR(10) ||
  '   🔄 Processing: ' || COUNT(CASE WHEN status = 'processing' THEN 1 END) || CHR(10) ||
  '   ⏳ Pending: ' || COUNT(CASE WHEN status = 'pending' THEN 1 END) || CHR(10) ||
  '   ❌ Failed: ' || COUNT(CASE WHEN status = 'failed' THEN 1 END) || CHR(10) ||
  '   Success Rate: ' ||
    CASE
      WHEN COUNT(CASE WHEN status IN ('completed', 'failed') THEN 1 END) > 0 THEN
        ROUND(100.0 * COUNT(CASE WHEN status = 'completed' THEN 1 END) /
        COUNT(CASE WHEN status IN ('completed', 'failed') THEN 1 END), 1) || '%'
      ELSE '0%'
    END
FROM ankr_learning.exercise_solving_jobs;
" 2>/dev/null

echo ""
echo "🌱 SEEDER ACTIVITY (New Exercises Generated):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

AI_GENERATED=$(PGPASSWORD='indrA@0612' psql -h localhost -U ankr -d ankr_eon -t -c "
SELECT COUNT(*)
FROM ankr_learning.chapter_exercises
WHERE id LIKE 'ai-%';
" 2>/dev/null | tr -d ' ')

echo "   AI-Generated Exercises: $AI_GENERATED"

echo ""
echo "📈 PROGRESS BY COURSE:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PGPASSWORD='indrA@0612' psql -h localhost -U ankr -d ankr_eon -c "
SELECT
  m.course_id as \"Course\",
  COUNT(cx.id) as \"Total\",
  COUNT(CASE WHEN cx.solution IS NOT NULL AND cx.solution != '' THEN 1 END) as \"Solved\",
  COUNT(CASE WHEN cx.id LIKE 'ai-%' THEN 1 END) as \"AI New\",
  ROUND(100.0 * COUNT(CASE WHEN cx.solution IS NOT NULL AND cx.solution != '' THEN 1 END) / COUNT(cx.id), 1) || '%' as \"Coverage\"
FROM ankr_learning.chapter_exercises cx
JOIN ankr_learning.modules m ON m.id = cx.module_id
WHERE m.course_id LIKE 'class-%'
GROUP BY m.course_id
ORDER BY m.course_id;
" 2>/dev/null | head -20

echo ""
echo "📜 RECENT ACTIVITY:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Solver (last 3 lines):"
tail -3 /tmp/solver-v2.log 2>/dev/null || echo "   No solver log"

echo ""
echo "Seeders:"
for log in /tmp/seeder-*.log; do
    if [ -f "$log" ]; then
        echo "   $(basename $log): $(tail -1 $log 2>/dev/null)"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Commands:"
echo "    Watch live: watch -n 10 /root/ncert-pipeline/monitor-all.sh"
echo "    Solver logs: tail -f /tmp/solver-v2.log"
echo "    Seeder logs: tail -f /tmp/seeder-*.log"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
