#!/usr/bin/env tsx
/**
 * NCERT Content Pipeline
 *
 * Downloads NCERT PDFs, converts to markdown, extracts images,
 * and generates AI-powered questions
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';

const execAsync = promisify(exec);

interface NCERTBook {
  class: number;
  subject: string;
  title: string;
  pdfUrl: string;
  chapters: { number: number; title: string; startPage?: number; endPage?: number }[];
}

// NCERT Book Catalog (Sample - can be expanded)
const NCERT_CATALOG: NCERTBook[] = [
  {
    class: 10,
    subject: 'science',
    title: 'Science for Class 10',
    pdfUrl: 'https://ncert.nic.in/textbook/pdf/jesc1dd.zip', // Example URL
    chapters: [
      { number: 1, title: 'Chemical Reactions and Equations' },
      { number: 2, title: 'Acids, Bases and Salts' },
      { number: 3, title: 'Metals and Non-metals' },
      { number: 4, title: 'Carbon and its Compounds' },
      { number: 5, title: 'Periodic Classification of Elements' },
      { number: 6, title: 'Life Processes' },
      { number: 7, title: 'Control and Coordination' },
      { number: 8, title: 'How do Organisms Reproduce?' },
      { number: 9, title: 'Heredity and Evolution' },
      { number: 10, title: 'Light – Reflection and Refraction' },
      { number: 11, title: 'Human Eye and Colourful World' },
      { number: 12, title: 'Electricity' },
      { number: 13, title: 'Magnetic Effects of Electric Current' },
      { number: 14, title: 'Sources of Energy' },
      { number: 15, title: 'Our Environment' },
      { number: 16, title: 'Sustainable Management of Natural Resources' },
    ],
  },
  {
    class: 10,
    subject: 'mathematics',
    title: 'Mathematics for Class 10',
    pdfUrl: 'https://ncert.nic.in/textbook/pdf/jemh1dd.zip',
    chapters: [
      { number: 1, title: 'Real Numbers' },
      { number: 2, title: 'Polynomials' },
      { number: 3, title: 'Pair of Linear Equations in Two Variables' },
      { number: 4, title: 'Quadratic Equations' },
      { number: 5, title: 'Arithmetic Progressions' },
      { number: 6, title: 'Triangles' },
      { number: 7, title: 'Coordinate Geometry' },
      { number: 8, title: 'Introduction to Trigonometry' },
      { number: 9, title: 'Some Applications of Trigonometry' },
      { number: 10, title: 'Circles' },
      { number: 11, title: 'Constructions' },
      { number: 12, title: 'Areas Related to Circles' },
      { number: 13, title: 'Surface Areas and Volumes' },
      { number: 14, title: 'Statistics' },
      { number: 15, title: 'Probability' },
    ],
  },
];

class ContentPipeline {
  private baseDir = '/root/apps/ncert-intelligent-viewer/content';
  private apiUrl = 'http://localhost:4090';

  async downloadPDF(book: NCERTBook): Promise<string> {
    const filename = `class${book.class}-${book.subject}.pdf`;
    const outputPath = path.join(this.baseDir, 'raw-pdfs', filename);

    console.log(`📥 Downloading: ${book.title}`);

    try {
      // Check if already downloaded
      await fs.access(outputPath);
      console.log(`  ✓ Already exists: ${outputPath}`);
      return outputPath;
    } catch {
      // File doesn't exist, download it
      console.log(`  → Downloading from: ${book.pdfUrl}`);

      // Note: NCERT PDFs are often in ZIP format, need to extract
      if (book.pdfUrl.endsWith('.zip')) {
        const zipPath = outputPath.replace('.pdf', '.zip');
        await execAsync(`wget -q -O "${zipPath}" "${book.pdfUrl}"`);
        await execAsync(`unzip -q -o "${zipPath}" -d "${path.dirname(outputPath)}"`);
        console.log(`  ✓ Downloaded and extracted`);
      } else {
        await execAsync(`wget -q -O "${outputPath}" "${book.pdfUrl}"`);
        console.log(`  ✓ Downloaded: ${outputPath}`);
      }

      return outputPath;
    }
  }

  async convertPDFToMarkdown(pdfPath: string, book: NCERTBook): Promise<string[]> {
    console.log(`🔄 Converting PDF to Markdown: ${book.title}`);

    const outputDir = path.join(
      this.baseDir,
      'converted-md',
      `class-${book.class}`,
      book.subject
    );
    await fs.mkdir(outputDir, { recursive: true });

    const markdownFiles: string[] = [];

    // Convert entire PDF to markdown
    const fullMdPath = path.join(outputDir, 'full-book.md');

    try {
      console.log(`  → Running pandoc conversion...`);
      await execAsync(
        `pandoc "${pdfPath}" -f pdf -t markdown --extract-media="${outputDir}/images" -o "${fullMdPath}"`
      );
      console.log(`  ✓ Converted to: ${fullMdPath}`);

      markdownFiles.push(fullMdPath);

      // Split by chapters (basic splitting - can be improved)
      const content = await fs.readFile(fullMdPath, 'utf-8');
      const chapters = this.splitIntoChapters(content, book.chapters);

      for (const [index, chapterContent] of chapters.entries()) {
        const chapter = book.chapters[index];
        if (chapter && chapterContent.length > 100) {
          const chapterPath = path.join(
            outputDir,
            `ch${chapter.number}-${chapter.title.toLowerCase().replace(/\s+/g, '-')}.md`
          );
          await fs.writeFile(chapterPath, chapterContent, 'utf-8');
          markdownFiles.push(chapterPath);
          console.log(`  ✓ Chapter ${chapter.number}: ${chapter.title} (${chapterContent.length} chars)`);
        }
      }

      return markdownFiles;
    } catch (error) {
      console.error(`  ✗ Conversion failed:`, error);
      return [];
    }
  }

  private splitIntoChapters(
    content: string,
    chapterInfo: { number: number; title: string }[]
  ): string[] {
    const chapters: string[] = [];

    // Split by chapter headings (# Chapter N or ## Chapter N)
    const chapterPattern = /^#{1,2}\s+(Chapter\s+\d+|CHAPTER\s+\d+|\d+\.)/gim;
    const matches = [...content.matchAll(chapterPattern)];

    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index || 0;
      const end = matches[i + 1]?.index || content.length;
      chapters.push(content.substring(start, end).trim());
    }

    return chapters;
  }

  async generateQuestions(markdownPath: string, book: NCERTBook): Promise<void> {
    console.log(`🤖 Generating AI questions for: ${path.basename(markdownPath)}`);

    const content = await fs.readFile(markdownPath, 'utf-8');

    // Take first 2000 characters as context
    const context = content.substring(0, 2000);

    const chapterMatch = path.basename(markdownPath).match(/ch(\d+)/);
    const chapterNumber = chapterMatch ? parseInt(chapterMatch[1]) : 1;
    const chapterInfo = book.chapters.find((c) => c.number === chapterNumber);

    if (!chapterInfo) {
      console.log(`  ⊘ No chapter info for ${path.basename(markdownPath)}`);
      return;
    }

    const chapterId = `class${book.class}-${book.subject}-ch${chapterNumber}`;
    const questionsDir = path.join(this.baseDir, 'questions', `class-${book.class}`, book.subject);
    await fs.mkdir(questionsDir, { recursive: true });

    // Generate Fermi questions
    try {
      console.log(`  → Generating Fermi questions...`);
      const fermiResponse = await fetch(`${this.apiUrl}/api/ncert/questions/fermi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId,
          section: chapterInfo.title,
          content: context,
          difficulty: 'medium',
          count: 2,
        }),
      });

      if (fermiResponse.ok) {
        const fermiData = await fermiResponse.json();
        await fs.writeFile(
          path.join(questionsDir, `ch${chapterNumber}-fermi.json`),
          JSON.stringify(fermiData.questions, null, 2)
        );
        console.log(`  ✓ Fermi questions: ${fermiData.questions?.length || 0}`);
      }
    } catch (error) {
      console.log(`  ✗ Fermi generation failed:`, error);
    }

    // Generate Logic challenges
    try {
      console.log(`  → Generating Logic challenges...`);
      const logicResponse = await fetch(`${this.apiUrl}/api/ncert/questions/logic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId,
          concept: chapterInfo.title,
          content: context,
          difficulty: 'medium',
          count: 2,
        }),
      });

      if (logicResponse.ok) {
        const logicData = await logicResponse.json();
        await fs.writeFile(
          path.join(questionsDir, `ch${chapterNumber}-logic.json`),
          JSON.stringify(logicData.challenges, null, 2)
        );
        console.log(`  ✓ Logic challenges: ${logicData.challenges?.length || 0}`);
      }
    } catch (error) {
      console.log(`  ✗ Logic generation failed:`, error);
    }
  }

  async processBook(book: NCERTBook): Promise<void> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📚 Processing: ${book.title}`);
    console.log(`${'='.repeat(60)}\n`);

    // Step 1: Download PDF
    const pdfPath = await this.downloadPDF(book);

    // Step 2: Convert to Markdown
    const markdownFiles = await this.convertPDFToMarkdown(pdfPath, book);

    // Step 3: Generate Questions (for first 3 chapters as demo)
    const chapterFiles = markdownFiles.filter((f) => f.includes('/ch'));
    for (const mdFile of chapterFiles.slice(0, 3)) {
      await this.generateQuestions(mdFile, book);
    }

    console.log(`\n✅ Completed: ${book.title}\n`);
  }

  async run(className?: number): Promise<void> {
    console.log(`\n🚀 NCERT Content Pipeline Starting...\n`);

    const booksToProcess = className
      ? NCERT_CATALOG.filter((b) => b.class === className)
      : NCERT_CATALOG;

    for (const book of booksToProcess) {
      await this.processBook(book);
    }

    console.log(`\n✨ Pipeline Complete! Processed ${booksToProcess.length} books.\n`);
  }
}

// CLI
const className = process.argv[2] ? parseInt(process.argv[2]) : undefined;

const pipeline = new ContentPipeline();
pipeline.run(className).catch((error) => {
  console.error('Pipeline error:', error);
  process.exit(1);
});
