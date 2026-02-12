const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://ankr:indrA@0612@localhost:5432/ankr_eon'
});

async function resetFailedJobs() {
  console.log('🔄 Resetting failed solver jobs to pending...\n');

  // First, check current status
  const beforeResult = await pool.query(`
    SELECT status, COUNT(*) as count
    FROM ankr_learning.exercise_solving_jobs
    GROUP BY status
    ORDER BY status
  `);

  console.log('📊 Before reset:');
  beforeResult.rows.forEach(row => {
    console.log(`   ${row.status}: ${row.count}`);
  });

  // Reset failed jobs to pending
  const resetResult = await pool.query(`
    UPDATE ankr_learning.exercise_solving_jobs
    SET
      status = 'pending',
      attempt_count = 0,
      started_at = NULL,
      completed_at = NULL,
      error_message = NULL,
      updated_at = NOW()
    WHERE status = 'failed'
    RETURNING id
  `);

  console.log(`\n✅ Reset ${resetResult.rowCount} jobs from failed to pending\n`);

  // Check status after
  const afterResult = await pool.query(`
    SELECT status, COUNT(*) as count
    FROM ankr_learning.exercise_solving_jobs
    GROUP BY status
    ORDER BY status
  `);

  console.log('📊 After reset:');
  afterResult.rows.forEach(row => {
    console.log(`   ${row.status}: ${row.count}`);
  });

  await pool.end();
}

resetFailedJobs().catch(console.error);
