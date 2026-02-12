#!/usr/bin/env node
/**
 * NCERT Batch Extraction and Solving Pipeline
 * Processes all 183 chapter PDFs: extract → ingest → solve
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Pool } = require('pg');
const axios = require('axios');

const PDF_DIR = '/root/data/ncert-extracted';
const OUTPUT_DIR = '/root/ncert-extraction/extracted-data';
const LOG_FILE = '/root/ncert-extraction/batch-pipeline.log';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ankr_eon',
  user: 'ankr',
  password: 'indrA@0612',
});

const AI_PROXY_URL = 'http://localhost:4444/v1/chat/completions';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Log function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logMessage);
  console.log(message);
}

// Extract book/chapter metadata from filename
function parseFilename(filename) {
  const basename = path.basename(filename, '.pdf');

  // Class mapping
  const classMap = {
    'g': 7, 'h': 8, 'i': 9, 'j': 10, 'k': 11, 'l': 12
  };

  // Subject mapping
  const subjectMap = {
    'emh': 'mathematics',
    'esc': 'science',
    'ess': 'social_science',
    'eff': 'english_firstflight',
    'efw': 'english_footprints',
    'eps': 'english_literature'
  };

  const classCode = basename[0];
  const subjectCode = basename.substring(1, 4);
  const chapterNum = parseInt(basename.substring(4));

  return {
    class: classMap[classCode] || 0,
    subject: subjectMap[subjectCode] || 'unknown',
    chapter: chapterNum,
    filename: basename,
    priority: getPriority(classMap[classCode], subjectMap[subjectCode])
  };
}

// Priority scoring (lower = higher priority)
function getPriority(classNum, subject) {
  let score = 0;

  // Class 10 is highest priority
  if (classNum === 10) score = 0;
  else if (classNum === 9) score = 100;
  else if (classNum === 11) score = 200;
  else if (classNum === 12) score = 300;
  else score = 400;

  // Math and Science are higher priority
  if (!subject) score += 30;
  else if (subject === 'mathematics') score += 0;
  else if (subject === 'science') score += 10;
  else if (subject.startsWith('english')) score += 20;
  else score += 30;

  return score;
}

// Extract text from PDF
function extractPDFText(pdfPath) {
  try {
    const text = execSync(`pdftotext "${pdfPath}" -`, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024
    });
    return text;
  } catch (error) {
    throw new Error(`pdftotext failed: ${error.message}`);
  }
}

// Use AI to extract structured exercises from PDF text
async function extractExercisesWithAI(pdfText, metadata) {
  const prompt = `You are extracting NCERT exercises from a Class ${metadata.class} ${metadata.subject} chapter.

Extract ALL exercises and questions from this chapter text. Return a JSON object with this exact structure:

{
  "chapter_number": ${metadata.chapter},
  "chapter_title": "Chapter Title Here",
  "exercises": [
    {
      "exercise_number": "1.1",
      "questions": [
        {
          "question_number": 1,
          "question_text": "Full question text here...",
          "hints": ["hint1", "hint2"],
          "difficulty": "easy|medium|hard",
          "tags": ["tag1", "tag2"]
        }
      ]
    }
  ]
}

**IMPORTANT:**
- Extract ALL exercises (1.1, 1.2, 1.3, etc.)
- Extract ALL questions within each exercise
- Preserve exact question text including all parts (i), (ii), etc.
- Infer difficulty based on question complexity
- Add relevant tags (e.g., "prime factorization", "proof", "application")
- Set hints based on common solving approaches
- Return ONLY valid JSON, no markdown formatting

PDF Text:
${pdfText.substring(0, 50000)}`;

  try {
    const response = await axios.post(AI_PROXY_URL, {
      model: 'claude-3-5-sonnet-20241022',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8000,
      temperature: 0.1
    }, {
      timeout: 120000
    });

    const content = response.data.choices[0].message.content;

    // Extract JSON from response (may be wrapped in markdown)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    throw new Error(`AI extraction failed: ${error.message}`);
  }
}

// Ensure module exists
async function ensureModule(client, moduleId, chapterTitle, metadata) {
  const courseId = `class-${metadata.class}-${metadata.subject}`;

  // Check if module exists
  const existingModule = await client.query(
    'SELECT id FROM ankr_learning.modules WHERE id = $1',
    [moduleId]
  );

  if (existingModule.rows.length > 0) {
    return; // Module already exists
  }

  // Create module
  await client.query(
    `INSERT INTO ankr_learning.modules (id, course_id, title, description, \"order\", duration)
     VALUES ($1, $2, $3, $4, $5, 0)
     ON CONFLICT (id) DO NOTHING`,
    [moduleId, courseId, chapterTitle, `Chapter ${metadata.chapter}: ${chapterTitle}`, metadata.chapter]
  );
}

// Ingest exercises into database
async function ingestExercises(exercises, metadata) {
  const client = await pool.connect();
  let inserted = 0;

  try {
    await client.query('BEGIN');

    const moduleId = `ch${metadata.chapter}-${metadata.subject}`;
    const chapterTitle = exercises.chapter_title || `Chapter ${metadata.chapter}`;

    // Ensure module exists
    await ensureModule(client, moduleId, chapterTitle, metadata);

    for (const exercise of exercises.exercises || []) {
      for (const question of exercise.questions || []) {
        const exerciseId = `class${metadata.class}-ch${metadata.chapter}-ex${exercise.exercise_number}-q${question.question_number}`;

        await client.query(
          `INSERT INTO ankr_learning.chapter_exercises
           (id, module_id, exercise_number, question_number, question_text,
            hints, difficulty, tags, "order", is_optional, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, NOW(), NOW())
           ON CONFLICT (id) DO NOTHING`,
          [
            exerciseId,
            moduleId,
            exercise.exercise_number,
            question.question_number,
            question.question_text,
            question.hints || [],
            question.difficulty || 'medium',
            question.tags || [],
            question.question_number
          ]
        );

        inserted++;
      }
    }

    await client.query('COMMIT');
    return inserted;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Create solver jobs for exercises
async function createSolverJobs(exercises, metadata) {
  const client = await pool.connect();
  let created = 0;

  try {
    await client.query('BEGIN');

    for (const exercise of exercises.exercises || []) {
      for (const question of exercise.questions || []) {
        const exerciseId = `class${metadata.class}-ch${metadata.chapter}-ex${exercise.exercise_number}-q${question.question_number}`;
        const jobId = `solver-${exerciseId}`;

        await client.query(
          `INSERT INTO ankr_learning.exercise_solving_jobs
           (id, exercise_id, status, created_at, updated_at)
           VALUES ($1, $2, 'pending', NOW(), NOW())
           ON CONFLICT (id) DO NOTHING`,
          [jobId, exerciseId]
        );

        created++;
      }
    }

    await client.query('COMMIT');
    return created;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Process a single PDF
async function processPDF(pdfPath, metadata) {
  const outputFile = path.join(OUTPUT_DIR, `${metadata.filename}.json`);

  // Skip if already processed
  if (fs.existsSync(outputFile)) {
    log(`⏭️  Skipped: ${metadata.filename} (already processed)`);
    return { success: true, skipped: true };
  }

  log(`📄 Processing: Class ${metadata.class} ${metadata.subject} Ch${metadata.chapter}`);

  try {
    // Step 1: Extract PDF text
    const pdfText = extractPDFText(pdfPath);

    // Step 2: Extract exercises with AI
    const exercises = await extractExercisesWithAI(pdfText, metadata);

    // Save extracted JSON
    fs.writeFileSync(outputFile, JSON.stringify(exercises, null, 2));

    const questionCount = exercises.exercises?.reduce((sum, ex) => sum + (ex.questions?.length || 0), 0) || 0;

    if (questionCount === 0) {
      log(`   ⚠️  No exercises found`);
      return { success: true, questions: 0 };
    }

    // Step 3: Ingest into database
    const inserted = await ingestExercises(exercises, metadata);

    // Step 4: Create solver jobs
    const jobsCreated = await createSolverJobs(exercises, metadata);

    log(`   ✅ Extracted ${questionCount} questions, ingested ${inserted}, created ${jobsCreated} jobs`);

    return { success: true, questions: questionCount, inserted, jobsCreated };

  } catch (error) {
    log(`   ❌ Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main execution
async function main() {
  log('════════════════════════════════════════════════════════════');
  log('  NCERT Batch Extraction & Solving Pipeline');
  log('════════════════════════════════════════════════════════════');
  log('');

  // Get all PDFs
  const allFiles = fs.readdirSync(PDF_DIR)
    .filter(f => f.endsWith('.pdf'))
    .map(f => {
      const metadata = parseFilename(f);
      metadata.path = path.join(PDF_DIR, f);
      return metadata;
    })
    .sort((a, b) => a.priority - b.priority); // Sort by priority

  log(`Found ${allFiles.length} PDFs to process`);
  log('');

  let totalQuestions = 0;
  let totalInserted = 0;
  let totalJobsCreated = 0;
  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  // Process in batches
  const BATCH_SIZE = 5; // Process 5 chapters at a time

  for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
    const batch = allFiles.slice(i, i + BATCH_SIZE);

    log(`━━━ Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allFiles.length / BATCH_SIZE)} ━━━`);

    for (const file of batch) {
      const result = await processPDF(file.path, file);

      if (result.success && !result.skipped) {
        totalProcessed++;
        totalQuestions += result.questions || 0;
        totalInserted += result.inserted || 0;
        totalJobsCreated += result.jobsCreated || 0;
      } else if (result.skipped) {
        totalSkipped++;
      } else {
        totalFailed++;
      }

      // Small delay to avoid overwhelming the AI
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    log('');
  }

  log('════════════════════════════════════════════════════════════');
  log('  Extraction Summary');
  log('════════════════════════════════════════════════════════════');
  log(`Total PDFs: ${allFiles.length}`);
  log(`Processed: ${totalProcessed}`);
  log(`Skipped: ${totalSkipped}`);
  log(`Failed: ${totalFailed}`);
  log(`Total questions extracted: ${totalQuestions}`);
  log(`Total exercises ingested: ${totalInserted}`);
  log(`Total solver jobs created: ${totalJobsCreated}`);
  log('════════════════════════════════════════════════════════════');
  log('');
  log('💡 Next step: Run solve-exercises.js to solve all pending exercises');
  log('');

  await pool.end();
}

main().catch(console.error);
