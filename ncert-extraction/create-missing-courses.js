const { Pool } = require('pg');
const pool = new Pool({ 
  connectionString: 'postgresql://ankr:indrA@0612@localhost:5432/ankr_eon' 
});

// Decode NCERT file naming pattern
// Format: [a-z]e[ms][hsc][0-9]+
// First letter: a=supplementary, i=class9, j=class10, k=class11, l=class12, etc.
// e = english
// m/s = math/science
// h/s/c = hindi/social/commerce
// numbers = chapter

const classMap = {
  'a': 0, 'b': 0, 'c': 0, 'd': 0, 'e': 0, 'f': 0, 'g': 7, 'h': 8, 
  'i': 9, 'j': 10, 'k': 11, 'l': 12
};

const subjectMap = {
  'mh': 'MATHEMATICS',
  'sc': 'SCIENCE', 
  'ss': 'SOCIAL_SCIENCE',
  'es': 'HISTORY',  // Social Science - History
  'eg': 'GEOGRAPHY',
  'ep': 'POLITICAL_SCIENCE',
  'ec': 'ECONOMICS',
  'en': 'ENGLISH',
  'hi': 'HINDI'
};

function decodeFilename(filename) {
  // Extract class from first letter
  const classLetter = filename[0];
  const classNum = classMap[classLetter] || 10;
  
  // Extract subject from next 2 characters
  const subjectCode = filename.slice(2, 4);
  const subject = subjectMap[subjectCode] || 'SCIENCE';
  
  return { class: classNum, subject };
}

async function createCourse(classNum, subject) {
  const courseId = `class-${classNum}-${subject.toLowerCase()}`;
  const slug = `cbse-class-${classNum}-${subject.toLowerCase()}`;
  
  try {
    // Check if course exists
    const check = await pool.query(
      'SELECT id FROM ankr_learning.courses WHERE id = $1',
      [courseId]
    );
    
    if (check.rows.length > 0) {
      console.log(`✓ Course exists: ${courseId}`);
      return courseId;
    }
    
    // Create course
    await pool.query(`
      INSERT INTO ankr_learning.courses (
        id, title, slug, description, category, difficulty, 
        status, author_id, duration, metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 'PUBLISHED', 'ankr-system', 0,
        jsonb_build_object('class', $7, 'subject', $5, 'board', 'CBSE')
      )
    `, [
      courseId,
      `${subject} for Class ${classNum}`,
      slug,
      `Complete NCERT ${subject} curriculum for Class ${classNum}`,
      subject,
      classNum >= 11 ? 'ADVANCED' : 'INTERMEDIATE',
      classNum
    ]);
    
    console.log(`✅ Created course: ${courseId}`);
    return courseId;
  } catch (err) {
    console.error(`❌ Error creating ${courseId}:`, err.message);
    return null;
  }
}

async function main() {
  console.log('🔧 Creating Missing Courses...\n');
  
  // Failed files from log
  const failedFiles = [
    'jemh102', 'jemh105', 'jemh1ps',
    'jesc104', 'jesc108', 
    'iesc108',
    'kemh101', 'kemh108', 'kemh112',
    'lemh102', 'lemh106',
    'gemh108', 'gemh112', 'gemh1an',
    'hemh109', 'hemh111', 'hemh1an',
    'gesc111',
    'hesc108', 'hesc109', 'hesc111', 'hesc112',
    'fees107', 'fees1gl'
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
  
  console.log(`\n✅ Course creation complete!`);
  console.log(`   Created/verified: ${created.size} courses`);
  
  await pool.end();
}

main().catch(console.error);
