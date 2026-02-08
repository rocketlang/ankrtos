#!/usr/bin/env tsx
/**
 * Manual NCERT Content Ingestion
 *
 * For manually created or pre-existing markdown files.
 * Processes existing markdown and generates questions.
 */

import { promises as fs } from 'fs';
import path from 'path';

const API_URL = 'http://localhost:4090';
const CONTENT_DIR = '/root/apps/ncert-intelligent-viewer/content';

interface ChapterMetadata {
  class: number;
  subject: string;
  chapterNumber: number;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

async function extractMetadata(markdownPath: string): Promise<ChapterMetadata | null> {
  const content = await fs.readFile(markdownPath, 'utf-8');

  // Extract from path: class-10/science/ch12-electricity.md
  const pathMatch = markdownPath.match(/class-(\d+)\/(\w+)\/ch(\d+)-(.+)\.md$/);

  if (!pathMatch) {
    console.warn(`⚠️  Could not parse path: ${markdownPath}`);
    return null;
  }

  const [, classNum, subject, chapterNum, titleSlug] = pathMatch;

  // Extract title from first heading
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : titleSlug.replace(/-/g, ' ');

  return {
    class: parseInt(classNum),
    subject,
    chapterNumber: parseInt(chapterNum),
    title,
    difficulty: 'medium',
  };
}

async function generateQuestionsForChapter(
  markdownPath: string,
  metadata: ChapterMetadata
): Promise<void> {
  console.log(`\n🤖 Processing: ${metadata.title}`);
  console.log(`   Class ${metadata.class} ${metadata.subject} - Chapter ${metadata.chapterNumber}`);

  const content = await fs.readFile(markdownPath, 'utf-8');
  const context = content.substring(0, 2000); // First 2000 chars as context

  const chapterId = `class${metadata.class}-${metadata.subject}-ch${metadata.chapterNumber}`;
  const questionsDir = path.join(
    CONTENT_DIR,
    'questions',
    `class-${metadata.class}`,
    metadata.subject
  );
  await fs.mkdir(questionsDir, { recursive: true });

  let successCount = 0;

  // 1. Fermi Questions
  try {
    console.log(`   → Generating Fermi questions...`);
    const response = await fetch(`${API_URL}/api/ncert/questions/fermi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chapterId,
        section: metadata.title,
        content: context,
        difficulty: metadata.difficulty,
        count: 3,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.questions?.length > 0) {
        const outputPath = path.join(questionsDir, `ch${metadata.chapterNumber}-fermi.json`);
        await fs.writeFile(outputPath, JSON.stringify(data.questions, null, 2));
        console.log(`   ✓ Fermi: ${data.questions.length} questions → ${path.basename(outputPath)}`);
        successCount++;
      }
    } else {
      console.log(`   ✗ Fermi: ${response.status} ${response.statusText}`);
    }
  } catch (error: any) {
    console.log(`   ✗ Fermi: ${error.message}`);
  }

  // 2. Logic Challenges
  try {
    console.log(`   → Generating Logic challenges...`);
    const response = await fetch(`${API_URL}/api/ncert/questions/logic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chapterId,
        concept: metadata.title,
        content: context,
        difficulty: metadata.difficulty,
        count: 3,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.challenges?.length > 0) {
        const outputPath = path.join(questionsDir, `ch${metadata.chapterNumber}-logic.json`);
        await fs.writeFile(outputPath, JSON.stringify(data.challenges, null, 2));
        console.log(`   ✓ Logic: ${data.challenges.length} challenges → ${path.basename(outputPath)}`);
        successCount++;
      }
    } else {
      console.log(`   ✗ Logic: ${response.status} ${response.statusText}`);
    }
  } catch (error: any) {
    console.log(`   ✗ Logic: ${error.message}`);
  }

  // 3. Translation to Hindi
  try {
    console.log(`   → Translating to Hindi...`);

    // Translate first section (up to 1000 chars)
    const sectionToTranslate = content.substring(0, 1000);

    const response = await fetch(`${API_URL}/api/ncert/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: sectionToTranslate,
        from: 'en',
        to: 'hi',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.translatedText) {
        const outputPath = path.join(
          path.dirname(markdownPath),
          `ch${metadata.chapterNumber}-${metadata.title.toLowerCase().replace(/\s+/g, '-')}-hi.md`
        );
        await fs.writeFile(outputPath, data.translatedText);
        console.log(`   ✓ Translation: Hindi version → ${path.basename(outputPath)}`);
        successCount++;
      }
    } else {
      console.log(`   ✗ Translation: ${response.status} ${response.statusText}`);
    }
  } catch (error: any) {
    console.log(`   ✗ Translation: ${error.message}`);
  }

  console.log(`   ✅ Completed: ${successCount}/3 AI services successful\n`);
}

async function scanAndProcess(directory: string): Promise<void> {
  console.log(`\n📂 Scanning: ${directory}\n`);

  const entries = await fs.readdir(directory, { withFileTypes: true });

  const markdownFiles: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await scanAndProcess(fullPath);
    } else if (entry.name.endsWith('.md') && entry.name.startsWith('ch')) {
      markdownFiles.push(fullPath);
    }
  }

  // Process markdown files
  for (const mdFile of markdownFiles) {
    const metadata = await extractMetadata(mdFile);
    if (metadata) {
      await generateQuestionsForChapter(mdFile, metadata);
    }
  }
}

// Main
async function main() {
  console.log(`\n🚀 NCERT Manual Content Ingestion\n`);
  console.log(`API Endpoint: ${API_URL}`);
  console.log(`Content Directory: ${CONTENT_DIR}\n`);

  // Check if backend is running
  try {
    const healthCheck = await fetch(`${API_URL}/health`);
    if (!healthCheck.ok) {
      throw new Error('Backend not healthy');
    }
    console.log(`✓ Backend is running\n`);
  } catch (error) {
    console.error(`✗ Backend is not accessible at ${API_URL}`);
    console.error(`  Please start the NCERT backend first: pm2 restart ncert-backend\n`);
    process.exit(1);
  }

  const convertedDir = path.join(CONTENT_DIR, 'converted-md');

  try {
    await fs.access(convertedDir);
  } catch {
    console.error(`✗ Content directory not found: ${convertedDir}`);
    console.error(`  Please create markdown files first or run the PDF pipeline\n`);
    process.exit(1);
  }

  await scanAndProcess(convertedDir);

  console.log(`\n✨ Ingestion Complete!\n`);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
