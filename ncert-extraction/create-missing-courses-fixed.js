const { Pool } = require('pg');
const pool = new Pool({ 
  connectionString: 'postgresql://ankr:indrA@0612@localhost:5432/ankr_eon' 
});

const classMap = {
  'g': 7, 'h': 8, 'i': 9, 'j': 10, 'k': 11, 'l': 12, 'f': 6
};

function decodeFilename(filename) {
  const classLetter = filename[0];
  const classNum = classMap[classLetter] || 10;
  
  // Map to actual subject names used in DB
  let subject = 'Science';
  const code = filename.slice(2, 4);
  
  if (code === 'mh' || filename.includes('mh')) subject = 'Mathematics';
  else if (code === 'sc' || filename.includes('sc')) subject = 'Science';
  else if (code === 'ss' || code === 'es' || filename.includes('ss') || filename.includes('es')) subject = 'Social Science';
  else if (code === 'en') subject = 'English';
  else if (code === 'hi') subject = 'Hindi';
  
  return { class: classNum, subject };
}

async function createCourse(classNum, subject) {
  const courseId = `class-${classNum}-${subject.toLowerCase().replace(/ /g, '-')}`;
  
  try {
    const check = await pool.query(
      'SELECT id FROM ankr_learning.courses WHERE id = $1',
      [courseId]
    );
    
    if (check.rows.length > 0) {
      console.log(`✓ Course exists: ${courseId}`);
      return courseId;
    }
    
    // Use simple query without prepared statement issues
    const query = `
      INSERT INTO ankr_learning.courses (
        id, title, slug, description, category, difficulty, 
        status, author_id, duration, metadata
      ) VALUES (
        '${courseId}',
        '${subject} for Class ${classNum}',
        'cbse-class-${classNum}-${subject.toLowerCase().replace(/ /g, '-')}',
        'NCERT ${subject} textbook for Class ${classNum}',
        '${subject.toUpperCase().replace(/ /g, '_')}',
        '${classNum >= 11 ? 'advanced' : 'INTERMEDIATE'}',
        'PUBLISHED',
        'ankr-system',
        0,
        '{"board":"CBSE","grade":"${classNum}","source":"NCERT","language":"English"}'::jsonb
      )
    `;
    
    await pool.query(query);
    console.log(`✅ Created: ${courseId}`);
    return courseId;
  } catch (err) {
    console.error(`❌ Error ${courseId}:`, err.message);
    return null;
  }
}

async function main() {
  console.log('🔧 Creating Missing Courses (Fixed)...\n');
  
  const failedFiles = [
    'jemh102', 'jemh105', 'jesc104', 'jesc108', 
    'iesc108', 'kemh101', 'kemh108', 'gemh108',
    'hemh109', 'gesc111', 'hesc108', 'fees107'
  ];
  
  const created = new Set();
  
  for (const file of failedFiles) {
    const { class: classNum, subject } = decodeFilename(file);
    const key = `${classNum}-${subject}`;
    
    if (!created.has(key)) {
      await createCourse(classNum, subject);
      created.add(key);
    }
  }
  
  console.log(`\n✅ Done! Created/verified: ${created.size} courses`);
  await pool.end();
}

main().catch(console.error);
