/**
 * PDF Parser - Extracts text and structure from NCERT PDFs
 */

const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const pdfParse = PDFParse;

/**
 * Parse PDF and extract raw text
 */
async function parsePDF(pdfPath) {
  console.log(`📄 Parsing PDF: ${path.basename(pdfPath)}`);

  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(dataBuffer);

  console.log(`   Pages: ${data.numpages}`);
  console.log(`   Text length: ${data.text.length} chars`);

  return {
    filename: path.basename(pdfPath),
    numpages: data.numpages,
    text: data.text,
    info: data.info,
    metadata: data.metadata
  };
}

/**
 * Extract chapter structure from text
 */
function extractChapters(text) {
  console.log('\n📖 Extracting chapter structure...');

  const chapters = [];

  // Pattern 1: "CHAPTER 1" or "Chapter 1" followed by title
  const chapterPattern = /(?:CHAPTER|Chapter)\s+(\d+)\s*\n\s*([^\n]+)/gi;

  let match;
  let lastIndex = 0;

  while ((match = chapterPattern.exec(text)) !== null) {
    const chapterNum = parseInt(match[1]);
    const title = match[2].trim();
    const startPos = match.index;

    // Save previous chapter's content
    if (chapters.length > 0) {
      chapters[chapters.length - 1].content = text.substring(
        chapters[chapters.length - 1].startPos,
        startPos
      );
    }

    chapters.push({
      chapterNumber: chapterNum,
      title: title,
      startPos: startPos,
      content: ''
    });
  }

  // Set content for last chapter
  if (chapters.length > 0) {
    chapters[chapters.length - 1].content = text.substring(
      chapters[chapters.length - 1].startPos
    );
  }

  console.log(`   Found ${chapters.length} chapters`);
  chapters.forEach(ch => {
    console.log(`   - Chapter ${ch.chapterNumber}: ${ch.title} (${ch.content.length} chars)`);
  });

  return chapters;
}

/**
 * Extract examples from chapter content
 */
function extractExamples(chapterContent, chapterNumber) {
  const examples = [];

  // Pattern: "Example 1" or "EXAMPLE 1" followed by content
  const examplePattern = /(?:Example|EXAMPLE)\s+(\d+)[:\.]?\s*([^\n]+)/gi;

  let match;
  while ((match = examplePattern.exec(chapterContent)) !== null) {
    const exNum = parseInt(match[1]);
    const context = chapterContent.substring(match.index, match.index + 1000);

    // Try to extract solution (text between "Solution" and next "Example" or exercise)
    const solutionMatch = context.match(/(?:Solution|SOLUTION)[:\.]?\s*([\s\S]+?)(?=(?:Example|EXAMPLE|Exercise|EXERCISE|\n\n\n))/i);

    examples.push({
      chapterNumber,
      exampleNumber: exNum,
      title: match[2].trim(),
      question: context.substring(0, 300).trim(),
      solution: solutionMatch ? solutionMatch[1].trim() : '',
      rawContext: context
    });
  }

  return examples;
}

/**
 * Extract exercises from chapter content
 */
function extractExercises(chapterContent, chapterNumber) {
  const exercises = [];

  // Pattern: "EXERCISE 1.1" followed by questions
  const exercisePattern = /(?:Exercise|EXERCISE)\s+(\d+)\.(\d+)/gi;

  let match;
  while ((match = exercisePattern.exec(chapterContent)) !== null) {
    const exerciseNum = `${match[1]}.${match[2]}`;
    const startPos = match.index;

    // Extract content after exercise heading (next 2000 chars)
    const exerciseContent = chapterContent.substring(startPos, startPos + 2000);

    // Extract individual questions (numbered 1., 2., 3., etc.)
    const questionPattern = /^\s*(\d+)\.\s+([^\n]+(?:\n(?!\s*\d+\.)[^\n]+)*)/gm;

    const questions = [];
    let qMatch;
    while ((qMatch = questionPattern.exec(exerciseContent)) !== null) {
      const qNum = parseInt(qMatch[1]);
      const qText = qMatch[2].trim();

      if (qNum > 0 && qNum <= 30) { // Reasonable question number range
        questions.push({
          questionNumber: qNum,
          questionText: qText
        });
      }
    }

    if (questions.length > 0) {
      exercises.push({
        chapterNumber,
        exerciseNumber: exerciseNum,
        questions
      });
    }
  }

  return exercises;
}

/**
 * Clean and format text to markdown
 */
function textToMarkdown(text) {
  let md = text;

  // Clean up excessive newlines
  md = md.replace(/\n{4,}/g, '\n\n\n');

  // Remove page numbers (numbers alone on a line)
  md = md.replace(/^\s*\d+\s*$/gm, '');

  // Clean up whitespace
  md = md.replace(/[ \t]+/g, ' ');
  md = md.trim();

  return md;
}

/**
 * Main parsing function
 */
async function parseNCERTBook(pdfPath) {
  const pdfData = await parsePDF(pdfPath);

  const chapters = extractChapters(pdfData.text);

  // Process each chapter
  const processedChapters = chapters.map(chapter => {
    const examples = extractExamples(chapter.content, chapter.chapterNumber);
    const exercises = extractExercises(chapter.content, chapter.chapterNumber);
    const cleanContent = textToMarkdown(chapter.content);

    return {
      chapterNumber: chapter.chapterNumber,
      title: chapter.title,
      content: cleanContent,
      wordCount: cleanContent.split(/\s+/).length,
      examples: examples,
      exercises: exercises,
      stats: {
        examplesCount: examples.length,
        exercisesCount: exercises.reduce((sum, ex) => sum + ex.questions.length, 0)
      }
    };
  });

  // Summary
  console.log('\n📊 Extraction Summary:');
  console.log(`   Chapters: ${processedChapters.length}`);
  console.log(`   Total Examples: ${processedChapters.reduce((s, c) => s + c.stats.examplesCount, 0)}`);
  console.log(`   Total Exercises: ${processedChapters.reduce((s, c) => s + c.stats.exercisesCount, 0)}`);

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
    console.error('Usage: node pdf-parser.js <path-to-pdf>');
    process.exit(1);
  }

  parseNCERTBook(pdfPath).then(result => {
    // Save to JSON
    const outputPath = path.join(__dirname, 'extracted',
      path.basename(pdfPath, '.pdf') + '.json'
    );
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`\n✅ Saved to: ${outputPath}`);
  }).catch(console.error);
}

module.exports = { parseNCERTBook, extractChapters, extractExamples, extractExercises };
