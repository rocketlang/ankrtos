#!/usr/bin/env node

const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ankr_eon',
  user: 'ankr',
  password: 'indrA@0612'
});

async function syncExercisesToLMS() {
  console.log('🔄 Syncing solved NCERT exercises to ANKR Academy LMS...\n');
  
  // Get count of solved exercises
  const countResult = await pool.query(`
    SELECT COUNT(*) 
    FROM ankr_learning.chapter_exercises 
    WHERE solution IS NOT NULL AND solution != ''
  `);
  
  const totalSolved = parseInt(countResult.rows[0].count);
  console.log(`📚 Found ${totalSolved} solved exercises ready to sync\n`);
  
  // Check what courses exist
  const coursesResult = await pool.query(`
    SELECT id, title, category 
    FROM ankr_learning.courses 
    WHERE title ILIKE '%class%' 
    LIMIT 20
  `);
  
  console.log(`📖 Found ${coursesResult.rows.length} class-based courses:\n`);
  coursesResult.rows.forEach((course, idx) => {
    console.log(`   ${idx + 1}. ${course.title} (${course.category || 'N/A'})`);
  });
  
  console.log(`\n✅ Sync check complete!`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Map chapter_exercises to courses/modules`);
  console.log(`   2. Create lessons with solved exercises`);
  console.log(`   3. Add quizzes based on exercises`);
  
  await pool.end();
}

syncExercisesToLMS().catch(console.error);
