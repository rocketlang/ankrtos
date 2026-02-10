#!/usr/bin/env node

/**
 * NCERT Exercise Solver v2
 * With PostgreSQL-based resume capability and progress tracking
 */

const { Pool } = require('pg');
const crypto = require('crypto');

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
 * Create or resume a solver session
 */
async function createSession(courseId = null, limit = 100) {
  const sessionId = `session-${Date.now()}`;

  await pool.query(`
    INSERT INTO ankr_learning.solver_sessions (id, course_id, total_exercises, status, metadata)
    VALUES ($1, $2, $3, 'running', $4)
  `, [
    sessionId,
    courseId,
    limit,
    JSON.stringify({ limit, startedAt: new Date().toISOString() })
  ]);

  console.log(`✅ Created session: ${sessionId}`);
  return sessionId;
}

/**
 * Resume an existing session
 */
async function resumeSession(sessionId) {
  const result = await pool.query(`
    SELECT * FROM ankr_learning.solver_sessions WHERE id = $1
  `, [sessionId]);

  if (result.rows.length === 0) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  await pool.query(`
    UPDATE ankr_learning.solver_sessions
    SET status = 'running', updated_at = NOW()
    WHERE id = $1
  `, [sessionId]);

  console.log(`✅ Resumed session: ${sessionId}`);
  return result.rows[0];
}

/**
 * Get pending jobs for a session
 */
async function getPendingJobs(sessionId, courseId, limit) {
  const query = courseId && courseId !== 'null' ? `
    SELECT
      j.id,
      j.exercise_id,
      cx.exercise_number,
      cx.question_number,
      cx.question_text,
      cx.hints,
      cx.difficulty,
      m.id as module_id,
      m.course_id
    FROM ankr_learning.exercise_solving_jobs j
    JOIN ankr_learning.chapter_exercises cx ON cx.id = j.exercise_id
    JOIN ankr_learning.modules m ON m.id = cx.module_id
    WHERE j.status = 'pending'
      AND m.course_id = $1
      AND j.attempt_count < 3
    ORDER BY RANDOM()
    LIMIT $2
  ` : `
    SELECT
      j.id,
      j.exercise_id,
      cx.exercise_number,
      cx.question_number,
      cx.question_text,
      cx.hints,
      cx.difficulty,
      m.id as module_id,
      m.course_id
    FROM ankr_learning.exercise_solving_jobs j
    JOIN ankr_learning.chapter_exercises cx ON cx.id = j.exercise_id
    JOIN ankr_learning.modules m ON m.id = cx.module_id
    WHERE j.status = 'pending'
      AND j.attempt_count < 3
    ORDER BY RANDOM()
    LIMIT $1
  `;

  const params = (courseId && courseId !== 'null') ? [courseId, limit] : [limit];
  const result = await pool.query(query, params);

  return result.rows;
}

/**
 * Mark job as processing
 */
async function markProcessing(jobId) {
  await pool.query(`
    UPDATE ankr_learning.exercise_solving_jobs
    SET status = 'processing',
        attempt_count = attempt_count + 1,
        started_at = NOW(),
        updated_at = NOW()
    WHERE id = $1
  `, [jobId]);
}

/**
 * Mark job as completed
 */
async function markCompleted(jobId, exerciseId, solution) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Update job status
    await client.query(`
      UPDATE ankr_learning.exercise_solving_jobs
      SET status = 'completed',
          solution_generated = $1,
          completed_at = NOW(),
          updated_at = NOW()
      WHERE id = $2
    `, [solution, jobId]);

    // Update exercise with solution
    await client.query(`
      UPDATE ankr_learning.chapter_exercises
      SET solution = $1
      WHERE id = $2
    `, [solution, exerciseId]);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Mark job as failed
 */
async function markFailed(jobId, errorMessage) {
  await pool.query(`
    UPDATE ankr_learning.exercise_solving_jobs
    SET status = 'failed',
        error_message = $1,
        updated_at = NOW()
    WHERE id = $2
  `, [errorMessage, jobId]);
}

/**
 * Get chapter context
 */
async function getChapterContext(moduleId) {
  const result = await pool.query(`
    SELECT
      m.title,
      c.title as course_title,
      c.metadata->>'grade' as grade,
      c.category as subject,
      cc.content
    FROM ankr_learning.modules m
    JOIN ankr_learning.courses c ON c.id = m.course_id
    LEFT JOIN ankr_learning.chapter_content cc ON cc.module_id = m.id
    WHERE m.id = $1
  `, [moduleId]);

  return result.rows[0] || {};
}

/**
 * Solve with AI
 */
async function solveWithAI(exercise, context) {
  const prompt = `You are an expert NCERT tutor. Solve this exercise question with a clear, step-by-step solution.

**Chapter:** ${context.title}
**Subject:** ${context.subject}
**Grade:** ${context.grade}

**Exercise ${exercise.exercise_number}, Question ${exercise.question_number}:**
${exercise.question_text}

${exercise.hints && exercise.hints.length > 0 ? `**Hints:** ${exercise.hints.join(', ')}` : ''}

Provide a detailed solution with:
1. Clear working steps
2. Mathematical reasoning
3. Final answer

Format as a concise step-by-step solution.`;

  try {
    const response = await fetch(`${AI_PROXY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
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
    throw new Error(`AI Error: ${error.message}`);
  }
}

/**
 * Process jobs
 */
async function processJobs(sessionId, courseId, limit, batchSize = 10) {
  console.log(`\n🚀 Starting solver session: ${sessionId}`);
  console.log(`   Course: ${courseId || 'ALL'}`);
  console.log(`   Limit: ${limit} exercises\n`);

  let totalProcessed = 0;
  let totalCompleted = 0;
  let totalFailed = 0;

  while (totalProcessed < limit) {
    // Get next batch of pending jobs
    const jobs = await getPendingJobs(sessionId, courseId, Math.min(batchSize, limit - totalProcessed));

    if (jobs.length === 0) {
      console.log(`\n✅ No more pending jobs`);
      break;
    }

    console.log(`\n📦 Processing batch of ${jobs.length} exercises...\n`);

    for (const job of jobs) {
      try {
        console.log(`📝 Exercise ${job.exercise_number}.${job.question_number}`);
        console.log(`   Question: ${job.question_text.substring(0, 60)}...`);

        // Mark as processing
        await markProcessing(job.id);

        // Get chapter context
        const context = await getChapterContext(job.module_id);

        // Solve with AI
        console.log(`   🤖 Generating solution...`);
        const solution = await solveWithAI(job, context);

        // Mark as completed
        await markCompleted(job.id, job.exercise_id, solution);

        console.log(`   ✅ Solution saved (${solution.length} chars)`);
        totalCompleted++;

        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        await markFailed(job.id, error.message);
        totalFailed++;
      }

      totalProcessed++;
    }

    // Update session progress
    await pool.query(`
      UPDATE ankr_learning.solver_sessions
      SET completed = $1, failed = $2, updated_at = NOW()
      WHERE id = $3
    `, [totalCompleted, totalFailed, sessionId]);

    console.log(`\n📊 Progress: ${totalProcessed}/${limit} | ✅ ${totalCompleted} | ❌ ${totalFailed}`);
  }

  // Mark session as completed
  await pool.query(`
    UPDATE ankr_learning.solver_sessions
    SET status = 'completed', completed_at = NOW()
    WHERE id = $1
  `, [sessionId]);

  return { totalProcessed, totalCompleted, totalFailed };
}

/**
 * Show progress
 */
async function showProgress(sessionId = null) {
  const query = sessionId ? `
    SELECT * FROM ankr_learning.solver_progress WHERE session_id = $1
  ` : `
    SELECT * FROM ankr_learning.solver_progress ORDER BY session_id DESC LIMIT 5
  `;

  const params = sessionId ? [sessionId] : [];
  const result = await pool.query(query, params);

  console.log('\n📊 Solver Progress:\n');
  console.table(result.rows);
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'start') {
    const courseId = args[1];
    const limit = parseInt(args[2]) || 100;

    createSession(courseId, limit)
      .then(sessionId => processJobs(sessionId, courseId, limit))
      .then(result => {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`✅ Completed: ${result.totalCompleted}`);
        console.log(`❌ Failed: ${result.totalFailed}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        process.exit(0);
      })
      .catch(err => {
        console.error(err);
        process.exit(1);
      });
  } else if (command === 'resume') {
    const sessionId = args[1];

    if (!sessionId) {
      console.error('Usage: node exercise-solver-v2.js resume <sessionId>');
      process.exit(1);
    }

    resumeSession(sessionId)
      .then(session => {
        const remaining = session.total_exercises - session.completed - session.failed;
        return processJobs(sessionId, session.course_id, remaining);
      })
      .then(() => process.exit(0))
      .catch(err => {
        console.error(err);
        process.exit(1);
      });
  } else if (command === 'progress') {
    const sessionId = args[1];
    showProgress(sessionId)
      .then(() => process.exit(0))
      .catch(err => {
        console.error(err);
        process.exit(1);
      });
  } else {
    console.log('NCERT Exercise Solver v2 - with Resume\n');
    console.log('Usage:');
    console.log('  node exercise-solver-v2.js start [courseId] [limit]');
    console.log('  node exercise-solver-v2.js resume <sessionId>');
    console.log('  node exercise-solver-v2.js progress [sessionId]');
    console.log('\nExamples:');
    console.log('  node exercise-solver-v2.js start class-11-mathematics 50');
    console.log('  node exercise-solver-v2.js start null 1000  # All courses');
    console.log('  node exercise-solver-v2.js resume session-1234567890');
    console.log('  node exercise-solver-v2.js progress');
    process.exit(0);
  }
}

module.exports = { createSession, resumeSession, processJobs, showProgress };
