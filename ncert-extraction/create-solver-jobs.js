const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://ankr:indrA@0612@localhost:5432/ankr_eon'
});

async function createJobs() {
  console.log('🔧 Creating solver jobs for exercises without solutions...\n');
  
  // Get all exercises without solutions
  const result = await pool.query(`
    SELECT id FROM ankr_learning.chapter_exercises
    WHERE solution IS NULL OR solution = ''
  `);
  
  console.log(`Found ${result.rows.length} exercises without solutions`);
  
  if (result.rows.length === 0) {
    console.log('✅ All exercises already have solutions!');
    await pool.end();
    return;
  }
  
  // Create jobs for each
  let created = 0;
  for (const row of result.rows) {
    try {
      await pool.query(`
        INSERT INTO ankr_learning.exercise_solving_jobs (
          id, exercise_id, status, priority, attempt_count, created_at
        ) VALUES (
          gen_random_uuid()::text,
          $1,
          'pending',
          1,
          0,
          NOW()
        )
        ON CONFLICT DO NOTHING
      `, [row.id]);
      created++;
    } catch (err) {
      // Skip if job already exists
    }
  }
  
  console.log(`✅ Created ${created} solver jobs`);
  await pool.end();
}

createJobs().catch(console.error);
