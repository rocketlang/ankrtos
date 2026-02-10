-- Create exercise solving progress tracking table

CREATE TABLE IF NOT EXISTS ankr_learning.exercise_solving_jobs (
  id TEXT PRIMARY KEY,
  exercise_id TEXT NOT NULL REFERENCES ankr_learning.chapter_exercises(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  attempt_count INTEGER DEFAULT 0,
  error_message TEXT,
  solution_generated TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_solver_jobs_status ON ankr_learning.exercise_solving_jobs(status);
CREATE INDEX IF NOT EXISTS idx_solver_jobs_exercise ON ankr_learning.exercise_solving_jobs(exercise_id);

-- Create solver session tracking
CREATE TABLE IF NOT EXISTS ankr_learning.solver_sessions (
  id TEXT PRIMARY KEY,
  course_id TEXT,
  total_exercises INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  skipped INTEGER DEFAULT 0,
  status TEXT DEFAULT 'running',
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'
);

-- Summary view
CREATE OR REPLACE VIEW ankr_learning.solver_progress AS
SELECT
  s.id as session_id,
  s.course_id,
  s.status as session_status,
  COUNT(j.id) as total_jobs,
  COUNT(CASE WHEN j.status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN j.status = 'failed' THEN 1 END) as failed,
  COUNT(CASE WHEN j.status = 'processing' THEN 1 END) as processing,
  COUNT(CASE WHEN j.status = 'pending' THEN 1 END) as pending,
  ROUND(100.0 * COUNT(CASE WHEN j.status = 'completed' THEN 1 END) / NULLIF(COUNT(j.id), 0), 1) as progress_pct
FROM ankr_learning.solver_sessions s
LEFT JOIN ankr_learning.exercise_solving_jobs j ON j.id LIKE s.id || '-%'
GROUP BY s.id, s.course_id, s.status;

-- Initialize tracking for existing exercises
INSERT INTO ankr_learning.exercise_solving_jobs (id, exercise_id, status)
SELECT
  'init-' || cx.id,
  cx.id,
  CASE
    WHEN cx.solution IS NOT NULL AND cx.solution != '' AND LENGTH(cx.solution) > 100 THEN 'completed'
    ELSE 'pending'
  END
FROM ankr_learning.chapter_exercises cx
ON CONFLICT (id) DO NOTHING;

-- Show summary
SELECT
  status,
  COUNT(*) as count
FROM ankr_learning.exercise_solving_jobs
GROUP BY status
ORDER BY status;
