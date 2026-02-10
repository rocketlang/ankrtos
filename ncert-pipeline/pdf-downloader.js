/**
 * NCERT PDF Downloader
 * Downloads PDFs from NCERT official website
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// NCERT PDF URLs (official e-pathshala links)
const NCERT_BOOKS = {
  'class-10-mathematics': {
    url: 'https://ncert.nic.in/textbook/pdf/jemh1dd.pdf',
    title: 'Mathematics - Class 10',
    filename: 'class-10-math.pdf'
  },
  'class-10-science': {
    url: 'https://ncert.nic.in/textbook/pdf/jesc1dd.pdf',
    title: 'Science - Class 10',
    filename: 'class-10-science.pdf'
  },
  'class-9-mathematics': {
    url: 'https://ncert.nic.in/textbook/pdf/iemh1dd.pdf',
    title: 'Mathematics - Class 9',
    filename: 'class-9-math.pdf'
  },
  'class-9-science': {
    url: 'https://ncert.nic.in/textbook/pdf/iesc1dd.pdf',
    title: 'Science - Class 9',
    filename: 'class-9-science.pdf'
  }
};

async function downloadPDF(bookId) {
  const book = NCERT_BOOKS[bookId];
  if (!book) {
    throw new Error(`Book not found: ${bookId}`);
  }

  const outputPath = path.join(__dirname, 'pdfs', book.filename);

  // Check if already downloaded
  if (fs.existsSync(outputPath)) {
    console.log(`✓ ${book.title} already downloaded`);
    return outputPath;
  }

  console.log(`📥 Downloading ${book.title}...`);
  console.log(`   URL: ${book.url}`);

  try {
    const response = await axios({
      method: 'GET',
      url: book.url,
      responseType: 'stream',
      timeout: 120000, // 2 minutes
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      let downloadedBytes = 0;
      response.data.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        process.stdout.write(`\r   Downloaded: ${(downloadedBytes / 1024 / 1024).toFixed(2)} MB`);
      });

      writer.on('finish', () => {
        console.log(`\n✅ Downloaded: ${outputPath}`);
        resolve(outputPath);
      });
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`❌ Download failed:`, error.message);
    throw error;
  }
}

async function downloadAll() {
  console.log('📚 NCERT PDF Downloader\n');

  const results = [];
  for (const [bookId, book] of Object.entries(NCERT_BOOKS)) {
    try {
      const path = await downloadPDF(bookId);
      results.push({ bookId, success: true, path });
    } catch (error) {
      results.push({ bookId, success: false, error: error.message });
    }
    console.log(''); // blank line
  }

  console.log('\n📊 Download Summary:');
  console.log(`   Total: ${results.length}`);
  console.log(`   Success: ${results.filter(r => r.success).length}`);
  console.log(`   Failed: ${results.filter(r => !r.success).length}`);

  return results;
}

// CLI
if (require.main === module) {
  const bookId = process.argv[2];

  if (bookId) {
    downloadPDF(bookId).catch(console.error);
  } else {
    downloadAll().catch(console.error);
  }
}

module.exports = { downloadPDF, downloadAll, NCERT_BOOKS };
