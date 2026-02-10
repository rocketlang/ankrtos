#!/bin/bash

# Monitor Exercise Solver v2 with Resume Capability

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  NCERT EXERCISE SOLVER V2 - LIVE MONITOR (Resume Enabled)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if solver is running
if pgrep -f "exercise-solver-v2.js" > /dev/null; then
    PID=$(pgrep -f "exercise-solver-v2.js")
    echo "✅ Solver Status: RUNNING (PID: $PID)"
else
    echo "⊘ Solver Status: NOT RUNNING"
fi

echo ""
echo "📊 Active Sessions:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PGPASSWORD='indrA@0612' psql -h localhost -U ankr -d ankr_eon -c "
SELECT
  id,
  course_id,
  total_exercises as target,
  completed,
  failed,
  skipped,
  status,
  started_at,
  CASE
    WHEN completed + failed > 0 THEN
      ROUND(100.0 * completed / (completed + failed), 1) || '%'
    ELSE '0%'
  END as success_rate
FROM ankr_learning.solver_sessions
ORDER BY started_at DESC
LIMIT 3;
" 2>/dev/null

echo ""
echo "📈 Overall Progress:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PGPASSWORD='indrA@0612' psql -h localhost -U ankr -d ankr_eon -t -c "
SELECT
  '   Total Jobs: ' || COUNT(*) || CHR(10) ||
  '   ✅ Completed: ' || COUNT(CASE WHEN status = 'completed' THEN 1 END) || CHR(10) ||
  '   🔄 Processing: ' || COUNT(CASE WHEN status = 'processing' THEN 1 END) || CHR(10) ||
  '   ⏳ Pending: ' || COUNT(CASE WHEN status = 'pending' THEN 1 END) || CHR(10) ||
  '   ❌ Failed: ' || COUNT(CASE WHEN status = 'failed' THEN 1 END) || CHR(10) ||
  '   Progress: ' || ROUND(100.0 * COUNT(CASE WHEN status = 'completed' THEN 1 END) / COUNT(*), 1) || '%'
FROM ankr_learning.exercise_solving_jobs;
" 2>/dev/null

echo ""
echo "📚 Progress by Course:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PGPASSWORD='indrA@0612' psql -h localhost -U ankr -d ankr_eon -c "
SELECT
  m.course_id as \"Course\",
  COUNT(j.id) as \"Total\",
  COUNT(CASE WHEN j.status = 'completed' THEN 1 END) as \"Done\",
  COUNT(CASE WHEN j.status = 'pending' THEN 1 END) as \"Pending\",
  COUNT(CASE WHEN j.status = 'failed' THEN 1 END) as \"Failed\",
  ROUND(100.0 * COUNT(CASE WHEN j.status = 'completed' THEN 1 END) / COUNT(j.id), 1) || '%' as \"Progress\"
FROM ankr_learning.exercise_solving_jobs j
JOIN ankr_learning.chapter_exercises cx ON cx.id = j.exercise_id
JOIN ankr_learning.modules m ON m.id = cx.module_id
WHERE m.course_id LIKE 'class-%'
GROUP BY m.course_id
ORDER BY m.course_id;
" 2>/dev/null | head -20

echo ""
echo "🔄 Recent Activity (last 5):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PGPASSWORD='indrA@0612' psql -h localhost -U ankr -d ankr_eon -c "
SELECT
  j.status as \"Status\",
  SUBSTRING(j.exercise_id, 1, 20) as \"Exercise\",
  j.attempt_count as \"Attempts\",
  LENGTH(j.solution_generated) as \"Sol Len\",
  TO_CHAR(j.updated_at, 'HH24:MI:SS') as \"Time\"
FROM ankr_learning.exercise_solving_jobs j
WHERE j.status IN ('completed', 'failed', 'processing')
ORDER BY j.updated_at DESC
LIMIT 5;
" 2>/dev/null

echo ""
echo "📜 Latest Log:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
tail -8 /tmp/solver-v2.log 2>/dev/null || echo "No log file"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Commands:"
echo "    Watch: watch -n 10 /root/ncert-pipeline/monitor-solver-v2.sh"
echo "    Resume: node exercise-solver-v2.js resume <session-id>"
echo "    Logs: tail -f /tmp/solver-v2.log"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
