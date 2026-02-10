/**
 * Database Importer - Imports extracted NCERT content into PostgreSQL
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ankr_eon',
  user: 'ankr',
  password: 'indrA@0612'
});

/**
 * Import chapters into database
 */
async function importChapters(bookId, chapters) {
  console.log(`\n📥 Importing ${chapters.length} chapters for ${bookId}...`);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let importedChapters = 0;
    let importedExamples = 0;
    let importedExercises = 0;

    for (const chapter of chapters) {
      const moduleId = `ch${chapter.chapterNumber}-${slugify(chapter.title)}`;

      // 1. Insert/update module (chapter)
      await client.query(`
        INSERT INTO ankr_learning.modules (id, course_id, title, description, "order", duration)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          "order" = EXCLUDED."order",
          duration = EXCLUDED.duration
      `, [
        moduleId,
        bookId,
        chapter.title,
        chapter.title,
        chapter.chapterNumber,
        Math.ceil(chapter.wordCount / 200) // Reading time estimate (200 words/min)
      ]);

      // 2. Insert/update chapter content
      await client.query(`
        INSERT INTO ankr_learning.chapter_content (id, module_id, content, word_count, reading_time_minutes, content_format, source)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (module_id) DO UPDATE SET
          content = EXCLUDED.content,
          word_count = EXCLUDED.word_count,
          reading_time_minutes = EXCLUDED.reading_time_minutes,
          last_updated = NOW()
      `, [
        `content-${moduleId}`,
        moduleId,
        chapter.content,
        chapter.wordCount,
        Math.ceil(chapter.wordCount / 200),
        'markdown',
        'NCERT PDF extraction'
      ]);

      importedChapters++;

      // 3. Import examples
      for (const example of chapter.examples) {
        const exampleId = `ex-${moduleId}-${example.exampleNumber}`;

        await client.query(`
          INSERT INTO ankr_learning.chapter_examples (
            id, module_id, example_number, title, question, solution, explanation, difficulty, tags, "order"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            question = EXCLUDED.question,
            solution = EXCLUDED.solution
        `, [
          exampleId,
          moduleId,
          example.exampleNumber,
          example.title,
          example.question,
          example.solution || 'Solution to be added',
          example.solution ? 'Step-by-step solution' : null,
          'medium',
          [],
          example.exampleNumber
        ]);

        importedExamples++;
      }

      // 4. Import exercises
      for (const exercise of chapter.exercises) {
        for (const question of exercise.questions) {
          const exerciseId = `exe-${moduleId}-${exercise.exerciseNumber}-${question.questionNumber}`;

          await client.query(`
            INSERT INTO ankr_learning.chapter_exercises (
              id, module_id, exercise_number, question_number, question_text, solution, hints, difficulty, tags, "order"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (id) DO UPDATE SET
              question_text = EXCLUDED.question_text
          `, [
            exerciseId,
            moduleId,
            exercise.exerciseNumber,
            question.questionNumber,
            question.questionText,
            null, // Solutions will be added separately
            [],
            'medium',
            [],
            question.questionNumber
          ]);

          importedExercises++;
        }
      }

      process.stdout.write(`\r   Progress: ${importedChapters}/${chapters.length} chapters`);
    }

    await client.query('COMMIT');

    console.log('\n\n✅ Import complete!');
    console.log(`   Chapters: ${importedChapters}`);
    console.log(`   Examples: ${importedExamples}`);
    console.log(`   Exercises: ${importedExercises}`);

    return {
      success: true,
      chapters: importedChapters,
      examples: importedExamples,
      exercises: importedExercises
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Import failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Import from extracted JSON file
 */
async function importFromJSON(jsonPath, bookId) {
  console.log(`\n📖 Importing from: ${path.basename(jsonPath)}`);

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  console.log(`   Book: ${bookId}`);
  console.log(`   Chapters: ${data.chapters.length}`);
  console.log(`   Total words: ${data.metadata.totalWords}`);

  return await importChapters(bookId, data.chapters);
}

/**
 * Helper: Convert title to slug
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

/**
 * Verify import
 */
async function verifyImport(bookId) {
  const result = await pool.query(`
    SELECT
      COUNT(DISTINCT m.id) as chapter_count,
      COUNT(DISTINCT cc.id) as content_count,
      SUM(cc.word_count) as total_words,
      COUNT(DISTINCT ce.id) as example_count,
      COUNT(DISTINCT cx.id) as exercise_count
    FROM ankr_learning.modules m
    LEFT JOIN ankr_learning.chapter_content cc ON cc.module_id = m.id
    LEFT JOIN ankr_learning.chapter_examples ce ON ce.module_id = m.id
    LEFT JOIN ankr_learning.chapter_exercises cx ON cx.module_id = m.id
    WHERE m.course_id = $1
  `, [bookId]);

  console.log('\n🔍 Database Verification:');
  console.log(`   Chapters: ${result.rows[0].chapter_count}`);
  console.log(`   Content entries: ${result.rows[0].content_count}`);
  console.log(`   Total words: ${result.rows[0].total_words}`);
  console.log(`   Examples: ${result.rows[0].example_count}`);
  console.log(`   Exercises: ${result.rows[0].exercise_count}`);

  return result.rows[0];
}

// CLI
if (require.main === module) {
  const jsonPath = process.argv[2];
  const bookId = process.argv[3] || 'class-10-mathematics';

  if (!jsonPath) {
    console.error('Usage: node db-importer.js <json-file> [bookId]');
    process.exit(1);
  }

  importFromJSON(jsonPath, bookId)
    .then(() => verifyImport(bookId))
    .then(() => {
      console.log('\n✅ All done!');
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { importChapters, importFromJSON, verifyImport };
