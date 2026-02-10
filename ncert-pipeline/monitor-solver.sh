#!/bin/bash

# Monitor Exercise Solver Progress

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  NCERT EXERCISE SOLVER - LIVE MONITOR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if solver is running
if pgrep -f "exercise-solver.js" > /dev/null; then
    echo "✅ Solver Status: RUNNING"
else
    echo "⊘ Solver Status: NOT RUNNING"
fi

echo ""
echo "📊 Database Progress:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get current stats
PGPASSWORD='indrA@0612' psql -h localhost -U ankr -d ankr_eon -t -c "
SELECT
  '   Total Exercises: ' || COUNT(*) || CHR(10) ||
  '   With Solutions: ' || COUNT(CASE WHEN solution IS NOT NULL AND solution != '' THEN 1 END) || CHR(10) ||
  '   Without Solutions: ' || COUNT(CASE WHEN solution IS NULL OR solution = '' THEN 1 END) || CHR(10) ||
  '   Progress: ' || ROUND(100.0 * COUNT(CASE WHEN solution IS NOT NULL AND solution != '' THEN 1 END) / COUNT(*), 1) || '%'
FROM ankr_learning.chapter_exercises;
" 2>/dev/null

echo ""
echo "📈 Progress by Course:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PGPASSWORD='indrA@0612' psql -h localhost -U ankr -d ankr_eon -c "
SELECT
  m.course_id as \"Course\",
  COUNT(cx.id) as \"Total\",
  COUNT(CASE WHEN cx.solution IS NOT NULL AND cx.solution != '' THEN 1 END) as \"Solved\",
  ROUND(100.0 * COUNT(CASE WHEN cx.solution IS NOT NULL AND cx.solution != '' THEN 1 END) / COUNT(cx.id), 1) || '%' as \"Progress\"
FROM ankr_learning.chapter_exercises cx
JOIN ankr_learning.modules m ON m.id = cx.module_id
WHERE m.course_id LIKE 'class-%'
GROUP BY m.course_id
ORDER BY m.course_id;
" 2>/dev/null | head -20

echo ""
echo "📝 Recent Activity (last 5 solutions):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PGPASSWORD='indrA@0612' psql -h localhost -U ankr -d ankr_eon -c "
SELECT
  SUBSTRING(cx.exercise_number, 1, 10) as \"Exercise\",
  cx.question_number as \"Q#\",
  SUBSTRING(cx.question_text, 1, 50) as \"Question\",
  LENGTH(cx.solution) as \"Sol Length\"
FROM ankr_learning.chapter_exercises cx
WHERE cx.solution IS NOT NULL
  AND cx.solution != ''
  AND LENGTH(cx.solution) > 100
ORDER BY cx.id DESC
LIMIT 5;
" 2>/dev/null

echo ""
echo "📜 Latest Log Lines:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
tail -10 /tmp/solve-all.log 2>/dev/null || echo "No log file yet"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Use: watch -n 10 /root/ncert-pipeline/monitor-solver.sh"
echo "  Logs: tail -f /tmp/solve-all.log"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
