const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://ankr:indrA@0612@localhost:5432/ankr_eon'
});

async function checkStatus() {
  // Job status
  const jobsResult = await pool.query(`
    SELECT status, COUNT(*) as count
    FROM ankr_learning.exercise_solving_jobs
    GROUP BY status
    ORDER BY status
  `);

  console.log('📊 Job Status:');
  jobsResult.rows.forEach(row => {
    console.log(`   ${row.status}: ${row.count}`);
  });

  // Exercise completion
  const exercisesResult = await pool.query(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE solution IS NOT NULL AND solution != '') as with_solutions,
      COUNT(*) FILTER (WHERE solution IS NULL OR solution = '') as without_solutions
    FROM ankr_learning.chapter_exercises
  `);

  const stats = exercisesResult.rows[0];
  console.log('\n📚 Exercises:');
  console.log(`   Total: ${stats.total}`);
  console.log(`   With solutions: ${stats.with_solutions}`);
  console.log(`   Without solutions: ${stats.without_solutions}`);
  console.log(`   Completion: ${Math.round(stats.with_solutions / stats.total * 100)}%`);

  await pool.end();
}

checkStatus().catch(console.error);
