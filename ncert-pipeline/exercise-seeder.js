#!/usr/bin/env node

/**
 * NCERT Exercise Seeder
 * Generates new practice exercises using AI
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ankr_eon',
  user: 'ankr',
  password: 'indrA@0612'
});

const AI_PROXY_URL = 'http://localhost:4444';
const AI_MODEL = 'claude-3-5-sonnet-20241022';

/**
 * Generate new exercises using AI
 */
async function generateExercises(chapterContext, count = 5) {
  const prompt = `You are an expert NCERT textbook author. Generate ${count} practice exercises for this chapter.

**Chapter:** ${chapterContext.title}
**Subject:** ${chapterContext.subject}
**Grade:** ${chapterContext.grade}

**Chapter Content Preview:**
${chapterContext.content ? chapterContext.content.substring(0, 1000) : 'Mathematics/Science chapter'}

**Existing Examples:**
${chapterContext.examples.map(ex => `- ${ex.title}`).join('\n')}

Generate ${count} NEW practice exercises that:
1. Cover key concepts from this chapter
2. Range from easy to hard difficulty
3. Follow NCERT question style
4. Are different from existing examples
5. Include complete solutions

Format as JSON array:
[
  {
    "question": "Question text",
    "solution": "Step-by-step solution",
    "hints": ["hint1", "hint2"],
    "difficulty": "easy|medium|hard"
  }
]

Return ONLY the JSON array, no other text.`;

  try {
    const response = await fetch(`${AI_PROXY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 3000
      })
    });

    const data = await response.json();

    if (data.choices && data.choices[0]) {
      const content = data.choices[0].message.content;

      // Extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    throw new Error('Failed to parse AI response');
  } catch (error) {
    console.error('   AI Error:', error.message);
    return null;
  }
}

/**
 * Get chapter context
 */
async function getChapterContext(moduleId) {
  const result = await pool.query(`
    SELECT
      m.id,
      m.title,
      m."order" as chapter_number,
      c.title as course_title,
      c.metadata->>'grade' as grade,
      c.category as subject,
      cc.content
    FROM ankr_learning.modules m
    JOIN ankr_learning.courses c ON c.id = m.course_id
    LEFT JOIN ankr_learning.chapter_content cc ON cc.module_id = m.id
    WHERE m.id = $1
  `, [moduleId]);

  const chapter = result.rows[0];

  // Get existing examples
  const examples = await pool.query(`
    SELECT title, question
    FROM ankr_learning.chapter_examples
    WHERE module_id = $1
    LIMIT 10
  `, [moduleId]);

  return {
    ...chapter,
    examples: examples.rows
  };
}

/**
 * Seed exercises for a module
 */
async function seedExercisesForModule(moduleId, count = 5) {
  console.log(`\n🌱 Seeding exercises for module: ${moduleId}`);

  // Get chapter context
  const context = await getChapterContext(moduleId);
  console.log(`   Chapter: ${context.title}`);
  console.log(`   Subject: ${context.subject}`);

  // Get current exercise count
  const existingCount = await pool.query(`
    SELECT COUNT(*) as count
    FROM ankr_learning.chapter_exercises
    WHERE module_id = $1
  `, [moduleId]);

  const currentCount = parseInt(existingCount.rows[0].count);
  console.log(`   Existing exercises: ${currentCount}`);

  // Generate new exercises
  console.log(`   🤖 Generating ${count} new exercises...`);
  const exercises = await generateExercises(context, count);

  if (!exercises || exercises.length === 0) {
    console.log(`   ❌ Failed to generate exercises`);
    return { seeded: 0, failed: count };
  }

  console.log(`   ✅ Generated ${exercises.length} exercises`);

  // Insert into database
  let seeded = 0;
  let failed = 0;

  const exerciseNumber = `AI-${Date.now()}`;

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    const exerciseId = `ai-${moduleId}-${Date.now()}-${i}`;

    try {
      await pool.query(`
        INSERT INTO ankr_learning.chapter_exercises (
          id, module_id, exercise_number, question_number,
          question_text, solution, hints, difficulty, "order"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        exerciseId,
        moduleId,
        exerciseNumber,
        currentCount + i + 1,
        ex.question,
        ex.solution,
        ex.hints || [],
        ex.difficulty || 'medium',
        1000 + i
      ]);

      console.log(`   ✓ Seeded: ${ex.question.substring(0, 60)}...`);
      seeded++;
    } catch (error) {
      console.error(`   ✗ Error: ${error.message}`);
      failed++;
    }
  }

  return { seeded, failed };
}

/**
 * Seed exercises for a course
 */
async function seedExercisesForCourse(courseId, exercisesPerChapter = 5, maxChapters = 5) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  SEEDING EXERCISES: ${courseId}`);
  console.log(`${'='.repeat(60)}\n`);

  // Get chapters that need more exercises
  const modules = await pool.query(`
    SELECT
      m.id,
      m.title,
      COUNT(cx.id) as exercise_count
    FROM ankr_learning.modules m
    LEFT JOIN ankr_learning.chapter_exercises cx ON cx.module_id = m.id
    WHERE m.course_id = $1
      AND m.id IN (
        SELECT DISTINCT module_id
        FROM ankr_learning.chapter_content
        WHERE word_count > 500
      )
    GROUP BY m.id, m.title
    ORDER BY exercise_count ASC, RANDOM()
    LIMIT $2
  `, [courseId, maxChapters]);

  console.log(`Found ${modules.rows.length} chapters to seed\n`);

  let totalSeeded = 0;
  let totalFailed = 0;

  for (const module of modules.rows) {
    const result = await seedExercisesForModule(module.id, exercisesPerChapter);
    totalSeeded += result.seeded;
    totalFailed += result.failed;

    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Seeded: ${totalSeeded}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  return { seeded: totalSeeded, failed: totalFailed };
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'module') {
    const moduleId = args[1];
    const count = parseInt(args[2]) || 5;

    if (!moduleId) {
      console.error('Usage: node exercise-seeder.js module <moduleId> [count]');
      process.exit(1);
    }

    seedExercisesForModule(moduleId, count)
      .then(() => process.exit(0))
      .catch(err => {
        console.error(err);
        process.exit(1);
      });
  } else if (command === 'course') {
    const courseId = args[1] || 'class-11-mathematics';
    const perChapter = parseInt(args[2]) || 5;
    const maxChapters = parseInt(args[3]) || 5;

    seedExercisesForCourse(courseId, perChapter, maxChapters)
      .then(() => process.exit(0))
      .catch(err => {
        console.error(err);
        process.exit(1);
      });
  } else {
    console.log('NCERT Exercise Seeder\n');
    console.log('Usage:');
    console.log('  node exercise-seeder.js module <moduleId> [count]');
    console.log('  node exercise-seeder.js course <courseId> [perChapter] [maxChapters]');
    console.log('\nExamples:');
    console.log('  node exercise-seeder.js module ch1-sets 5');
    console.log('  node exercise-seeder.js course class-11-mathematics 5 3');
    process.exit(0);
  }
}

module.exports = { seedExercisesForModule, seedExercisesForCourse };
