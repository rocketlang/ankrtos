#!/usr/bin/env node

/**
 * NCERT Exercise Solver
 * Uses AI to generate solutions for exercises
 */

const { Pool } = require('pg');
const https = require('https');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ankr_eon',
  user: 'ankr',
  password: 'indrA@0612'
});

// AI Proxy endpoint (using local ANKR AI proxy)
const AI_PROXY_URL = 'http://localhost:4444';
const AI_MODEL = 'claude-3-5-sonnet-20241022';

/**
 * Call AI to solve an exercise
 */
async function solveWithAI(exercise, chapterContext) {
  const prompt = `You are an expert mathematics and science tutor. Solve this NCERT exercise question with a clear, step-by-step solution.

**Chapter Context:** ${chapterContext.title}
**Subject:** ${chapterContext.subject}
**Grade Level:** ${chapterContext.grade}

**Exercise ${exercise.exercise_number}, Question ${exercise.question_number}:**
${exercise.question_text}

${exercise.hints && exercise.hints.length > 0 ? `**Hints:**\n${exercise.hints.join('\n')}` : ''}

Provide a detailed solution that:
1. Shows all working steps
2. Explains the reasoning
3. Arrives at the final answer
4. Uses clear mathematical notation

Format your response as a step-by-step solution.`;

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
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    const data = await response.json();

    if (data.choices && data.choices[0]) {
      return data.choices[0].message.content;
    }

    throw new Error('No response from AI');
  } catch (error) {
    console.error('   AI Error:', error.message);
    return null;
  }
}

/**
 * Get chapter context for an exercise
 */
async function getChapterContext(moduleId) {
  const result = await pool.query(`
    SELECT
      m.title,
      c.title as course_title,
      c.metadata->>'grade' as grade,
      CASE
        WHEN c.category = 'Mathematics' THEN 'Mathematics'
        WHEN c.category = 'Physics' THEN 'Physics'
        WHEN c.category = 'Chemistry' THEN 'Chemistry'
        WHEN c.category = 'Biology' THEN 'Biology'
        ELSE 'Science'
      END as subject,
      cc.content
    FROM ankr_learning.modules m
    JOIN ankr_learning.courses c ON c.id = m.course_id
    LEFT JOIN ankr_learning.chapter_content cc ON cc.module_id = m.id
    WHERE m.id = $1
  `, [moduleId]);

  return result.rows[0] || {};
}

/**
 * Solve exercises for a specific course
 */
async function solveExercises(courseId, limit = 10) {
  console.log(`\n🤖 AI Exercise Solver`);
  console.log(`Course: ${courseId}`);
  console.log(`Limit: ${limit} exercises\n`);

  // Get unsolved exercises
  const exercises = await pool.query(`
    SELECT
      cx.id,
      cx.module_id,
      cx.exercise_number,
      cx.question_number,
      cx.question_text,
      cx.hints,
      cx.difficulty
    FROM ankr_learning.chapter_exercises cx
    JOIN ankr_learning.modules m ON m.id = cx.module_id
    WHERE m.course_id = $1
      AND (cx.solution IS NULL OR cx.solution = '')
    ORDER BY RANDOM()
    LIMIT $2
  `, [courseId, limit]);

  console.log(`Found ${exercises.rows.length} unsolved exercises\n`);

  let solved = 0;
  let failed = 0;

  for (const exercise of exercises.rows) {
    console.log(`\n📝 Exercise ${exercise.exercise_number}.${exercise.question_number}`);
    console.log(`   Question: ${exercise.question_text.substring(0, 80)}...`);

    // Get chapter context
    const context = await getChapterContext(exercise.module_id);
    console.log(`   Chapter: ${context.title || 'Unknown'}`);

    // Solve with AI
    console.log(`   🤖 Generating solution...`);
    const solution = await solveWithAI(exercise, context);

    if (solution) {
      // Update database
      await pool.query(`
        UPDATE ankr_learning.chapter_exercises
        SET solution = $1
        WHERE id = $2
      `, [solution, exercise.id]);

      console.log(`   ✅ Solution generated (${solution.length} chars)`);
      solved++;

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      console.log(`   ❌ Failed to generate solution`);
      failed++;
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Solved: ${solved}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  return { solved, failed };
}

/**
 * Solve all exercises for multiple courses
 */
async function solveAllCourses(exercisesPerCourse = 10) {
  const courses = await pool.query(`
    SELECT DISTINCT m.course_id, c.title
    FROM ankr_learning.modules m
    JOIN ankr_learning.courses c ON c.id = m.course_id
    WHERE m.course_id LIKE 'class-%'
    ORDER BY m.course_id
  `);

  console.log(`\n🎯 Solving exercises for ${courses.rows.length} courses\n`);

  const results = [];

  for (const course of courses.rows) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ${course.title}`);
    console.log(`${'='.repeat(60)}`);

    const result = await solveExercises(course.course_id, exercisesPerCourse);
    results.push({
      course: course.course_id,
      ...result
    });
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  FINAL SUMMARY`);
  console.log(`${'='.repeat(60)}\n`);

  const totalSolved = results.reduce((sum, r) => sum + r.solved, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);

  console.log(`Total exercises solved: ${totalSolved}`);
  console.log(`Total failed: ${totalFailed}`);
  console.log(`Success rate: ${(totalSolved / (totalSolved + totalFailed) * 100).toFixed(1)}%\n`);
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const param = args[1];

  if (command === 'course') {
    const courseId = param || 'class-11-mathematics';
    const limit = parseInt(args[2]) || 10;
    solveExercises(courseId, limit)
      .then(() => process.exit(0))
      .catch(err => {
        console.error(err);
        process.exit(1);
      });
  } else if (command === 'all') {
    const perCourse = parseInt(param) || 10;
    solveAllCourses(perCourse)
      .then(() => process.exit(0))
      .catch(err => {
        console.error(err);
        process.exit(1);
      });
  } else {
    console.log('NCERT Exercise Solver\n');
    console.log('Usage:');
    console.log('  node exercise-solver.js course <courseId> [limit]');
    console.log('  node exercise-solver.js all [exercisesPerCourse]');
    console.log('\nExamples:');
    console.log('  node exercise-solver.js course class-11-mathematics 5');
    console.log('  node exercise-solver.js all 10');
    process.exit(0);
  }
}

module.exports = { solveExercises, solveAllCourses };
