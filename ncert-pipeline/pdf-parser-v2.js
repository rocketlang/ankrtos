/**
 * PDF Parser v2 - Using pdfjs-dist for better extraction
 */

const fs = require('fs');
const path = require('path');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

/**
 * Parse PDF and extract text
 */
async function parsePDF(pdfPath) {
  console.log(`📄 Parsing PDF: ${path.basename(pdfPath)}`);

  const dataBuffer = new Uint8Array(fs.readFileSync(pdfPath));
  const loadingTask = pdfjsLib.getDocument({ data: dataBuffer });
  const pdfDocument = await loadingTask.promise;

  console.log(`   Pages: ${pdfDocument.numPages}`);

  // Extract text from all pages
  let fullText = '';
  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';

    if (pageNum % 10 === 0) {
      process.stdout.write(`\r   Extracting: ${pageNum}/${pdfDocument.numPages} pages`);
    }
  }

  console.log(`\r   ✅ Extracted ${pdfDocument.numPages} pages`);
  console.log(`   Text length: ${fullText.length} chars`);

  return {
    filename: path.basename(pdfPath),
    numpages: pdfDocument.numPages,
    text: fullText
  };
}

/**
 * Extract chapters from text
 */
function extractChapters(text) {
  console.log('\n📖 Extracting chapters...');

  const chapters = [];

  // NCERT chapter patterns
  const patterns = [
    // Pattern 1: "1 REAL NUMBERS" or "1\nREAL NUMBERS"
    /^(\d+)\s*\n?\s*([A-Z][A-Z\s]+?)(?=\n|$)/gm,
    // Pattern 2: "Chapter 1" or "CHAPTER 1"
    /(?:Chapter|CHAPTER)\s+(\d+)[:\s]*([^\n]+)/gi,
    // Pattern 3: Page header format "1. Real Numbers"
    /^(\d+)\.\s+([A-Z][a-z].+?)(?=\n|$)/gm
  ];

  let matches = [];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const chapterNum = parseInt(match[1]);
      const title = match[2].trim();

      // Validate chapter number and title
      if (chapterNum >= 1 && chapterNum <= 20 && title.length > 3 && title.length < 100) {
        matches.push({
          chapterNumber: chapterNum,
          title: title,
          startPos: match.index
        });
      }
    }
  }

  // Remove duplicates and sort
  const uniqueMatches = [];
  const seen = new Set();

  matches.sort((a, b) => a.chapterNumber - b.chapterNumber || a.startPos - b.startPos);

  for (const match of matches) {
    const key = `${match.chapterNumber}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueMatches.push(match);
    }
  }

  // Extract content for each chapter
  for (let i = 0; i < uniqueMatches.length; i++) {
    const chapter = uniqueMatches[i];
    const nextChapter = uniqueMatches[i + 1];

    const endPos = nextChapter ? nextChapter.startPos : text.length;
    chapter.content = text.substring(chapter.startPos, endPos);

    chapters.push(chapter);
  }

  console.log(`   Found ${chapters.length} chapters:`);
  chapters.forEach(ch => {
    console.log(`   ${ch.chapterNumber}. ${ch.title} (${(ch.content.length/1000).toFixed(1)}KB)`);
  });

  return chapters;
}

/**
 * Extract examples from chapter
 */
function extractExamples(chapterText, chapterNum) {
  const examples = [];

  // Pattern: "Example 1" or "EXAMPLE 1"
  const exampleRegex = /(?:Example|EXAMPLE)\s+(\d+)[:\.]?\s*([^\n]{0,200})/gi;

  let match;
  while ((match = exampleRegex.exec(chapterText)) !== null) {
    const exNum = parseInt(match[1]);
    const startPos = match.index;

    // Extract context (next 1500 chars)
    const context = chapterText.substring(startPos, startPos + 1500);

    // Try to find solution
    const solutionMatch = context.match(/(?:Solution|SOLUTION)[:\.]?\s*([\s\S]{100,800}?)(?=(?:Example|EXAMPLE|Exercise|EXERCISE|\d\.\s+[A-Z]))/i);

    examples.push({
      chapterNumber: chapterNum,
      exampleNumber: exNum,
      title: match[2] ? match[2].trim() : `Example ${exNum}`,
      question: context.substring(0, Math.min(500, context.length)).trim(),
      solution: solutionMatch ? solutionMatch[1].trim() : ''
    });
  }

  return examples;
}

/**
 * Extract exercises from chapter
 */
function extractExercises(chapterText, chapterNum) {
  const exercises = [];

  // Pattern: "EXERCISE 1.1" or "Exercise 1.1"
  const exerciseRegex = /(?:EXERCISE|Exercise)\s+(\d+)\.(\d+)/gi;

  let match;
  while ((match = exerciseRegex.exec(chapterText)) !== null) {
    const exerciseNum = `${match[1]}.${match[2]}`;
    const startPos = match.index;

    // Extract exercise content (next 3000 chars)
    const exerciseText = chapterText.substring(startPos, startPos + 3000);

    // Extract numbered questions
    const questionRegex = /^\s*(\d+)\.\s+([^\n]+(?:\n(?!\s*\d+\.)[^\n]+)*)/gm;

    const questions = [];
    let qMatch;

    while ((qMatch = questionRegex.exec(exerciseText)) !== null) {
      const qNum = parseInt(qMatch[1]);
      const qText = qMatch[2].trim();

      if (qNum > 0 && qNum <= 50 && qText.length > 10) {
        questions.push({
          questionNumber: qNum,
          questionText: qText
        });
      }
    }

    if (questions.length > 0) {
      exercises.push({
        chapterNumber: chapterNum,
        exerciseNumber: exerciseNum,
        questions
      });
    }
  }

  return exercises;
}

/**
 * Clean text to markdown
 */
function cleanToMarkdown(text) {
  let md = text;

  // Remove excessive whitespace
  md = md.replace(/[ \t]+/g, ' ');
  md = md.replace(/\n{4,}/g, '\n\n\n');

  // Remove isolated page numbers
  md = md.replace(/^\s*\d+\s*$/gm, '');

  // Clean up
  md = md.trim();

  return md;
}

/**
 * Main parsing function
 */
async function parseNCERTBook(pdfPath) {
  const pdfData = await parsePDF(pdfPath);
  const chapters = extractChapters(pdfData.text);

  const processedChapters = chapters.map(chapter => {
    const examples = extractExamples(chapter.content, chapter.chapterNumber);
    const exercises = extractExercises(chapter.content, chapter.chapterNumber);
    const cleanContent = cleanToMarkdown(chapter.content);

    return {
      chapterNumber: chapter.chapterNumber,
      title: chapter.title,
      content: cleanContent,
      wordCount: cleanContent.split(/\s+/).length,
      examples,
      exercises,
      stats: {
        examplesCount: examples.length,
        exercisesCount: exercises.reduce((sum, ex) => sum + ex.questions.length, 0)
      }
    };
  });

  console.log('\n📊 Extraction Summary:');
  console.log(`   Chapters: ${processedChapters.length}`);
  console.log(`   Total Examples: ${processedChapters.reduce((s, c) => s + c.stats.examplesCount, 0)}`);
  console.log(`   Total Exercises: ${processedChapters.reduce((s, c) => s + c.stats.exercisesCount, 0)}`);
  console.log(`   Total Words: ${processedChapters.reduce((s, c) => s + c.wordCount, 0)}`);

  return {
    filename: pdfData.filename,
    chapters: processedChapters,
    metadata: {
      pages: pdfData.numpages,
      totalWords: processedChapters.reduce((s, c) => s + c.wordCount, 0)
    }
  };
}

// CLI
if (require.main === module) {
  const pdfPath = process.argv[2];

  if (!pdfPath) {
    console.error('Usage: node pdf-parser-v2.js <path-to-pdf>');
    process.exit(1);
  }

  parseNCERTBook(pdfPath).then(result => {
    const outputPath = path.join(__dirname, 'extracted',
      path.basename(pdfPath, '.pdf') + '.json'
    );
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`\n✅ Saved to: ${outputPath}`);
  }).catch(error => {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { parseNCERTBook, extractChapters, extractExamples, extractExercises };
