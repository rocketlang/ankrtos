#!/usr/bin/env node
/**
 * NCERT Exercise AI Solver
 * Solves exercises using Claude 3.5 Sonnet via AI proxy
 */

const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ankr_eon',
  user: 'ankr',
  password: 'indrA@0612',
});

const AI_PROXY_URL = 'http://localhost:4444/v1/chat/completions';

// Generate step-by-step solution using AI
async function generateSolution(exercise) {
  const prompt = `You are a mathematics tutor helping a Class 10 student solve NCERT exercises.

**Exercise ${exercise.exercise_number}, Question ${exercise.question_number}:**
${exercise.question_text}

**Hints:**
${exercise.hints ? exercise.hints.join('\n') : 'No hints provided'}

**Difficulty:** ${exercise.difficulty}

Please provide a detailed step-by-step solution that:
1. Explains the concept clearly
2. Shows all calculation steps
3. Explains the reasoning at each step
4. Provides the final answer

Format your response in markdown with proper headings and formatting.`;

  try {
    const response = await axios.post(AI_PROXY_URL, {
      model: 'claude-3-5-sonnet-20241022',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.3
    }, {
      timeout: 60000
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    throw new Error(`AI proxy error: ${error.message}`);
  }
}

// Solve a single exercise
async function solveExercise(jobId, exerciseId) {
  const client = await pool.connect();

  try {
    // Mark job as processing
    await client.query(
      `UPDATE ankr_learning.exercise_solving_jobs
       SET status = 'processing', started_at = NOW(), attempt_count = attempt_count + 1
       WHERE id = $1`,
      [jobId]
    );

    // Fetch exercise details
    const exerciseResult = await client.query(
      `SELECT id, module_id, exercise_number, question_number, question_text,
              hints, difficulty, tags
       FROM ankr_learning.chapter_exercises
       WHERE id = $1`,
      [exerciseId]
    );

    if (exerciseResult.rows.length === 0) {
      throw new Error(`Exercise ${exerciseId} not found`);
    }

    const exercise = exerciseResult.rows[0];
    console.log(`\n📝 Solving: ${exercise.id}`);
    console.log(`   Question: ${exercise.question_text.substring(0, 80)}...`);

    // Generate solution using AI
    const solution = await generateSolution(exercise);

    // Store solution in both tables
    await client.query('BEGIN');

    // Update exercise with solution
    await client.query(
      `UPDATE ankr_learning.chapter_exercises
       SET solution = $1, updated_at = NOW()
       WHERE id = $2`,
      [solution, exerciseId]
    );

    // Mark job as completed
    await client.query(
      `UPDATE ankr_learning.exercise_solving_jobs
       SET status = 'completed',
           solution_generated = $1,
           completed_at = NOW(),
           updated_at = NOW()
       WHERE id = $2`,
      [solution, jobId]
    );

    await client.query('COMMIT');
    console.log(`   ✅ Solved successfully (${solution.length} chars)`);

    return { success: true, solution };

  } catch (error) {
    await client.query('ROLLBACK');

    // Mark job as failed
    await client.query(
      `UPDATE ankr_learning.exercise_solving_jobs
       SET status = 'failed',
           error_message = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [error.message, jobId]
    );

    console.log(`   ❌ Failed: ${error.message}`);
    return { success: false, error: error.message };

  } finally {
    client.release();
  }
}

// Main execution
async function main() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('  NCERT Exercise AI Solver - Batch Processing');
  console.log('════════════════════════════════════════════════════════════');
  console.log('');

  try {
    // Fetch all pending jobs
    const result = await pool.query(
      `SELECT id, exercise_id
       FROM ankr_learning.exercise_solving_jobs
       WHERE status = 'pending'
       ORDER BY created_at`
    );

    const jobs = result.rows;
    console.log(`Found ${jobs.length} pending exercises to solve\n`);

    if (jobs.length === 0) {
      console.log('No pending exercises. All done! ✅\n');
      await pool.end();
      return;
    }

    let solved = 0;
    let failed = 0;

    for (const job of jobs) {
      const result = await solveExercise(job.id, job.exercise_id);

      if (result.success) {
        solved++;
      } else {
        failed++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('  Summary');
    console.log('════════════════════════════════════════════════════════════');
    console.log(`Total exercises: ${jobs.length}`);
    console.log(`Solved: ${solved}`);
    console.log(`Failed: ${failed}`);
    console.log('════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
