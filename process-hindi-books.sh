#!/bin/bash
# Process CBSE Class 10 Hindi Textbooks
# Run this AFTER the current English batch completes

set -e

echo "📚 CBSE Class 10 Hindi - Batch 2 Processing"
echo "============================================="
echo ""
echo "⚠️  Make sure the first batch (29 books) is complete!"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

cd /root/ankr-labs-nx/apps/ankr-curriculum-backend

echo "📦 Building TypeScript (if needed)..."
npm run build 2>&1 | tail -5
echo ""

echo "🚀 Starting Hindi books processing..."
echo "   • 3 Kritika chapters"
echo "   • 3 Sanchayan chapters"
echo "   • 14 Sparsh chapters"
echo "   • 18 Kshitij chapters"
echo "   Total: 38 chapters"
echo ""
echo "⏱️  Estimated time: ~2.5 hours"
echo ""

# Create Hindi processing script on the fly
cat > /tmp/process-hindi-temp.js << 'EOJS'
const { createMasterOrchestrator } = require('@ankr/curriculum-mapper');
const fs = require('fs').promises;
const path = require('path');

const hindiDir = '/root/data/uploads';

async function getHindiChapters() {
  const files = await fs.readdir(hindiDir);

  const patterns = [
    { prefix: 'jhkr', name: 'Kritika', subject: 'hindi' },
    { prefix: 'jhsy', name: 'Sanchayan', subject: 'hindi' },
    { prefix: 'jhsp', name: 'Sparsh', subject: 'hindi' },
    { prefix: 'jhks', name: 'Kshitij', subject: 'hindi' },
  ];

  const books = [];

  for (const pattern of patterns) {
    const chapterFiles = files
      .filter(f => f.startsWith(pattern.prefix) && f.match(/\d{2}\.pdf$/))
      .sort();

    chapterFiles.forEach((file, index) => {
      books.push({
        name: \`CBSE Class 10 \${pattern.name} - Chapter \${index + 1}\`,
        board: 'CBSE',
        grade: 'CLASS_10',
        subject: pattern.subject,
        pdfPath: path.join(hindiDir, file),
      });
    });
  }

  return books;
}

async function processBook(book, index, total) {
  console.log(\`\n${'='.repeat(70)}\`);
  console.log(\`\n📚 [\${index + 1}/\${total}] Processing: \${book.name}\`);
  console.log(\`${'='.repeat(70)}\n\`);

  const startTime = Date.now();

  try {
    const orchestrator = createMasterOrchestrator({
      board: book.board,
      grade: book.grade,
      subject: book.subject,
      language: 'hi',
      pdfPath: book.pdfPath,
      outputFormat: 'DATABASE',
      mode: 'LIVE',
      enableTranslation: false,
      aiProvider: 'ANTHROPIC',
      verbose: false,
      courseGeneration: {
        includeVideos: false,
        includeQuizzes: true,
        includeAssignments: false,
        questionsPerModule: 10,
        difficultyDistribution: { easy: 0.3, medium: 0.5, hard: 0.2 },
        realWorldExamples: false,
        hindiTranslation: true,
        boardStyle: 'CBSE',
      },
    });

    const result = await orchestrator.run();
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

    if (result.success) {
      console.log(\`\n✅ [\${index + 1}/\${total}] SUCCESS: \${book.name} (\${duration} min)\`);
      return { success: true, book: book.name, duration: parseFloat(duration) };
    } else {
      console.log(\`\n❌ [\${index + 1}/\${total}] FAILED: \${book.name}\`);
      return { success: false, book: book.name, duration: parseFloat(duration) };
    }
  } catch (error) {
    console.error(\`\n❌ ERROR: \${book.name} - \${error.message}\`);
    return { success: false, book: book.name, error: error.message };
  }
}

async function main() {
  console.log('\n🚀 HINDI BOOKS PROCESSOR\n');

  const books = await getHindiChapters();
  console.log(\`Processing \${books.length} Hindi chapters...\n\`);

  const results = [];

  for (let i = 0; i < books.length; i++) {
    const result = await processBook(books[i], i, books.length);
    results.push(result);

    if (i < books.length - 1) {
      console.log('\n⏸️  Waiting 3 seconds...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Summary
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(\`\n${'='.repeat(70)}\`);
  console.log('\n📊 BATCH 2 SUMMARY\n');
  console.log(\`✅ Successful: \${successful.length}/\${books.length}\`);
  console.log(\`❌ Failed: \${failed.length}/\${books.length}\n\`);

  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
  console.log(\`⏱️  Total Duration: \${totalDuration.toFixed(1)} minutes\n\`);
}

main().catch(console.error);
EOJS

# Run the Hindi processing
DATABASE_URL="postgresql://ankr:indrA@0612@localhost:5432/ankr_eon?schema=ankr_learning" \
nohup node /tmp/process-hindi-temp.js > /tmp/processing-hindi-batch2.log 2>&1 &

HINDI_PID=$!
echo ""
echo "✅ Hindi processing started!"
echo "   PID: $HINDI_PID"
echo "   Log: /tmp/processing-hindi-batch2.log"
echo ""
echo "Monitor progress:"
echo "   tail -f /tmp/processing-hindi-batch2.log"
echo ""
